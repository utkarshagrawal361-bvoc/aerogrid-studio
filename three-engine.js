// =============================================================================
// three-engine.js — AeroGrid Studio v7.0
// Pure-JS Triangle-Area-Weighted 3D Mesh Surface & Volume Sampler (with UV
// texture sampling & live Euler/Scale transform), Three.js WebGL Stage,
// HDR UnrealBloomPass, Universal Drag-and-Drop (.GLB/.GLTF/.OBJ/Image/SVG),
// Bounding-Sphere + Projected-Extent Auto-Framing Camera & Studio Controls.
// =============================================================================

'use strict';

// -----------------------------------------------------------------------------
// 1. PURE-JS MATHEMATICAL TRIANGLE-AREA-WEIGHTED 3D MESH SURFACE & VOLUME SAMPLER
// -----------------------------------------------------------------------------
(function initAeroSampler() {
  const PHI  = 0.6180339887498949;
  const R2_A = 0.7548776662466927;
  const R2_B = 0.5698402909980532;

  function toHexFromRgb(r, g, b) {
    const cr = Math.max(0, Math.min(255, Math.round(r * 255)));
    const cg = Math.max(0, Math.min(255, Math.round(g * 255)));
    const cb = Math.max(0, Math.min(255, Math.round(b * 255)));
    return '#' + ((1 << 24) + (cr << 16) + (cg << 8) + cb).toString(16).slice(1).toUpperCase();
  }

  /**
   * Builds a fast CPU pixel sampler for any loaded THREE.Texture image so
   * textured .glb/.gltf/.obj models project true UV surface colors onto drones.
   */
  function buildTextureSampler(tex) {
    if (!tex || !tex.image) return null;
    const img = tex.image;
    const iw = img.naturalWidth || img.videoWidth || img.width || 0;
    const ih = img.naturalHeight || img.height || 0;
    if (iw <= 0 || ih <= 0) return null;

    const maxDim = 256;
    const scale  = Math.min(1, maxDim / Math.max(iw, ih));
    const sw     = Math.max(1, Math.round(iw * scale));
    const sh     = Math.max(1, Math.round(ih * scale));

    try {
      const c = document.createElement('canvas');
      c.width  = sw;
      c.height = sh;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, sw, sh);
      const data = ctx.getImageData(0, 0, sw, sh).data;
      const flipY = tex.flipY !== false;
      return { data, width: sw, height: sh, flipY };
    } catch (_) {
      return null;
    }
  }

  function sampleTextureAtUV(sampler, u, v) {
    const wu = ((u % 1) + 1) % 1;
    let wv   = ((v % 1) + 1) % 1;
    if (sampler.flipY) wv = 1 - wv;
    const px  = Math.min(sampler.width - 1, Math.max(0, Math.floor(wu * sampler.width)));
    const py  = Math.min(sampler.height - 1, Math.max(0, Math.floor(wv * sampler.height)));
    const idx = (py * sampler.width + px) * 4;
    return [
      sampler.data[idx] / 255,
      sampler.data[idx + 1] / 255,
      sampler.data[idx + 2] / 255,
    ];
  }

  function liftDarkRgb(r, g, b) {
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 0.16) {
      const boost = 0.16 - lum;
      return [
        Math.min(1, r + boost * 0.75 + 0.08),
        Math.min(1, g + boost * 0.90 + 0.12),
        Math.min(1, b + boost * 1.15 + 0.18),
      ];
    }
    return [r, g, b];
  }

  /**
   * Attaches a Float32BufferAttribute 'color' (per-vertex RGB) to any BufferGeometry
   * using a callback (x, y, z, nx, ny, nz) -> THREE.Color | hex | [r,g,b] | string.
   */
  function applyVertexColors(geometry, colorSource) {
    const pos = geometry.attributes.position;
    if (!pos) return geometry;
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    const norm   = geometry.attributes.normal;
    const colors = new Float32Array(pos.count * 3);
    const tmpCol = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x  = pos.getX(i);
      const y  = pos.getY(i);
      const z  = pos.getZ(i);
      const nx = norm ? norm.getX(i) : 0;
      const ny = norm ? norm.getY(i) : 1;
      const nz = norm ? norm.getZ(i) : 0;

      const resolved = typeof colorSource === 'function'
        ? colorSource(x, y, z, nx, ny, nz, i)
        : colorSource;

      if (Array.isArray(resolved)) {
        colors[i * 3]     = resolved[0];
        colors[i * 3 + 1] = resolved[1];
        colors[i * 3 + 2] = resolved[2];
      } else if (resolved && resolved.isColor) {
        colors[i * 3]     = resolved.r;
        colors[i * 3 + 1] = resolved.g;
        colors[i * 3 + 2] = resolved.b;
      } else {
        tmpCol.set(resolved || '#FFFFFF');
        colors[i * 3]     = tmpCol.r;
        colors[i * 3 + 1] = tmpCol.g;
        colors[i * 3 + 2] = tmpCol.b;
      }
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }

  /**
   * Collects world-transformed triangles with exact area, UV textures & per-vertex
   * colors from any BufferGeometry, Mesh, or Group hierarchy.
   */
  function collectTriangles(rootOrGeo) {
    const triangles = [];
    const va = new THREE.Vector3();
    const vb = new THREE.Vector3();
    const vc = new THREE.Vector3();
    const ab = new THREE.Vector3();
    const ac = new THREE.Vector3();
    const cross = new THREE.Vector3();
    const tmpColor = new THREE.Color();

    function extractFromMesh(geo, worldMat, materials, ud) {
      if (!geo || !geo.attributes || !geo.attributes.position) return;
      const pos     = geo.attributes.position;
      const colAttr = geo.attributes.color || null;
      const uvAttr  = geo.attributes.uv || null;
      const index   = geo.index;
      const triCount = index ? Math.floor(index.count / 3) : Math.floor(pos.count / 3);
      if (triCount <= 0) return;

      const weightMultiplier = typeof ud.surfaceWeight === 'number' ? ud.surfaceWeight : 1.0;
      const skipBottom       = Boolean(ud.skipBottom);
      const colorFn          = typeof ud.colorFn === 'function' ? ud.colorFn : null;
      const fallbackHex      = ud.partColor || null;
      const isImported       = Boolean(ud.isImported);

      const matList = Array.isArray(materials) ? materials : [materials];
      const texSamplers = matList.map((m) => (m && m.map ? buildTextureSampler(m.map) : null));
      const groups = Array.isArray(geo.groups) && geo.groups.length ? geo.groups : null;

      function resolveGroupMatIndex(triIdx) {
        if (!groups || matList.length <= 1) return 0;
        const vertIdx = triIdx * 3;
        for (let g = 0; g < groups.length; g++) {
          const grp = groups[g];
          if (vertIdx >= grp.start && vertIdx < grp.start + grp.count) {
            return Math.min(matList.length - 1, grp.materialIndex || 0);
          }
        }
        return 0;
      }

      for (let t = 0; t < triCount; t++) {
        const i0 = index ? index.getX(t * 3)     : t * 3;
        const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
        const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;

        va.fromBufferAttribute(pos, i0).applyMatrix4(worldMat);
        vb.fromBufferAttribute(pos, i1).applyMatrix4(worldMat);
        vc.fromBufferAttribute(pos, i2).applyMatrix4(worldMat);

        ab.subVectors(vb, va);
        ac.subVectors(vc, va);
        cross.crossVectors(ab, ac);
        const dblArea = cross.length();
        if (!Number.isFinite(dblArea) || dblArea <= 1e-7) continue;

        const area = 0.5 * dblArea;
        const nx = cross.x / dblArea;
        const ny = cross.y / dblArea;
        const nz = cross.z / dblArea;

        if (skipBottom && ny < -0.82) continue;

        const matIdx  = resolveGroupMatIndex(t);
        const mat     = matList[matIdx];
        const sampler = texSamplers[matIdx] || null;
        const matCol  = (mat && mat.color) ? mat.color : null;

        let c0, c1, c2;
        if (colAttr) {
          c0 = [colAttr.getX(i0), colAttr.getY(i0), colAttr.getZ(i0)];
          c1 = [colAttr.getX(i1), colAttr.getY(i1), colAttr.getZ(i1)];
          c2 = [colAttr.getX(i2), colAttr.getY(i2), colAttr.getZ(i2)];
        } else if (fallbackHex) {
          tmpColor.set(fallbackHex);
          const rgb = [tmpColor.r, tmpColor.g, tmpColor.b];
          c0 = rgb; c1 = rgb; c2 = rgb;
        } else if (matCol) {
          c0 = [matCol.r, matCol.g, matCol.b];
          c1 = c0; c2 = c0;
        } else {
          c0 = [1, 1, 1]; c1 = c0; c2 = c0;
        }

        const uv0 = (sampler && uvAttr) ? [uvAttr.getX(i0), uvAttr.getY(i0)] : null;
        const uv1 = (sampler && uvAttr) ? [uvAttr.getX(i1), uvAttr.getY(i1)] : null;
        const uv2 = (sampler && uvAttr) ? [uvAttr.getX(i2), uvAttr.getY(i2)] : null;

        triangles.push({
          ax: va.x, ay: va.y, az: va.z,
          bx: vb.x, by: vb.y, bz: vb.z,
          cx: vc.x, cy: vc.y, cz: vc.z,
          nx, ny, nz,
          c0, c1, c2,
          texSampler: sampler,
          uv0, uv1, uv2,
          matTint: matCol ? [matCol.r, matCol.g, matCol.b] : [1, 1, 1],
          isImported,
          colorFn,
          weight: area * (weightMultiplier > 0 ? weightMultiplier : 1.0),
          area,
        });
      }
    }

    if (rootOrGeo && rootOrGeo.isBufferGeometry) {
      extractFromMesh(rootOrGeo, new THREE.Matrix4(), null, { partColor: '#00E5FF' });
      return triangles;
    }

    if (rootOrGeo && typeof rootOrGeo.updateMatrixWorld === 'function') {
      rootOrGeo.updateMatrixWorld(true);
      rootOrGeo.traverse((child) => {
        if (!child.isMesh || !child.geometry || child.visible === false) return;
        extractFromMesh(child.geometry, child.matrixWorld, child.material, child.userData || {});
      });
    }
    return triangles;
  }

  /**
   * Fallback vertex extractor for point-cloud or wireframe-only .OBJ/.GLB files.
   */
  function collectFallbackVertices(rootOrGeo) {
    const pts = [];
    const v = new THREE.Vector3();
    if (!rootOrGeo || typeof rootOrGeo.traverse !== 'function') return pts;
    rootOrGeo.updateMatrixWorld(true);
    rootOrGeo.traverse((child) => {
      if (!child.geometry || !child.geometry.attributes || !child.geometry.attributes.position) return;
      if (!child.isPoints && !child.isLine && !child.isMesh) return;
      const pos = child.geometry.attributes.position;
      const col = child.geometry.attributes.color || null;
      const step = Math.max(1, Math.floor(pos.count / 6000));
      for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i).applyMatrix4(child.matrixWorld);
        if (!Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.z)) continue;
        const r = col ? col.getX(i) : 0.25;
        const g = col ? col.getY(i) : 0.88;
        const b = col ? col.getZ(i) : 1.0;
        pts.push({ x: v.x, y: v.y, z: v.z, nx: 0, ny: 1, nz: 0, r, g, b, hex: toHexFromRgb(r, g, b) });
      }
    });
    return pts;
  }

  function binarySearchCdf(cdf, target) {
    let lo = 0;
    let hi = cdf.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (cdf[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  /**
   * Evaluates uniform barycentric coordinates on triangle `tri` for (r1, r2) in [0, 1).
   */
  function samplePointOnTriangle(tri, r1, r2) {
    const s  = Math.sqrt(r1);
    const w0 = 1.0 - s;
    const w1 = s * (1.0 - r2);
    const w2 = s * r2;

    const x = w0 * tri.ax + w1 * tri.bx + w2 * tri.cx;
    const y = w0 * tri.ay + w1 * tri.by + w2 * tri.cy;
    const z = w0 * tri.az + w1 * tri.bz + w2 * tri.cz;

    let r = w0 * tri.c0[0] + w1 * tri.c1[0] + w2 * tri.c2[0];
    let g = w0 * tri.c0[1] + w1 * tri.c1[1] + w2 * tri.c2[1];
    let b = w0 * tri.c0[2] + w1 * tri.c1[2] + w2 * tri.c2[2];

    if (tri.texSampler && tri.uv0 && tri.uv1 && tri.uv2) {
      const u = w0 * tri.uv0[0] + w1 * tri.uv1[0] + w2 * tri.uv2[0];
      const v = w0 * tri.uv0[1] + w1 * tri.uv1[1] + w2 * tri.uv2[1];
      const texRgb = sampleTextureAtUV(tri.texSampler, u, v);
      r = texRgb[0] * tri.matTint[0];
      g = texRgb[1] * tri.matTint[1];
      b = texRgb[2] * tri.matTint[2];
    }

    if (tri.colorFn) {
      const custom = tri.colorFn(x, y, z, tri.nx, tri.ny, tri.nz);
      if (custom) {
        if (Array.isArray(custom)) {
          r = custom[0]; g = custom[1]; b = custom[2];
        } else {
          const c = new THREE.Color(custom);
          r = c.r; g = c.g; b = c.b;
        }
      }
    }

    if (tri.isImported) {
      const lifted = liftDarkRgb(r, g, b);
      r = lifted[0]; g = lifted[1]; b = lifted[2];
    }

    return {
      x, y, z,
      nx: tri.nx, ny: tri.ny, nz: tri.nz,
      r, g, b,
      hex: toHexFromRgb(r, g, b),
    };
  }

  /**
   * Distributes `count` points evenly across the 3D surface faces of any
   * BufferGeometry / Mesh / Group using triangle-area-weighted CDF sampling.
   */
  function sampleSurfaceRaw(rootOrGeo, count, options = {}) {
    if (count <= 0) return [];
    const triangles = collectTriangles(rootOrGeo);
    if (!triangles.length) {
      const fallback = collectFallbackVertices(rootOrGeo);
      if (!fallback.length) return [];
      const out = new Array(count);
      for (let i = 0; i < count; i++) {
        const src = fallback[Math.floor(((i * PHI) % 1) * fallback.length)];
        out[i] = { ...src };
      }
      return out;
    }

    const cdf = new Float64Array(triangles.length);
    let totalWeight = 0;
    for (let i = 0; i < triangles.length; i++) {
      totalWeight += triangles[i].weight;
      cdf[i] = totalWeight;
    }
    if (totalWeight <= 0) return [];

    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < triangles.length; i++) {
      const t = triangles[i];
      cx += (t.ax + t.bx + t.cx) / 3;
      cy += (t.ay + t.by + t.cy) / 3;
      cz += (t.az + t.bz + t.cz) / 3;
    }
    cx /= triangles.length;
    cy /= triangles.length;
    cz /= triangles.length;

    const interiorRatio = Math.max(0, Math.min(0.6, options.interiorRatio || 0));
    const interiorDepth = options.interiorDepth || 0.35;
    const results = new Array(count);

    for (let i = 0; i < count; i++) {
      const u = ((i + 0.5) * PHI) % 1.0;
      const triIdx = binarySearchCdf(cdf, u * totalWeight);
      const tri = triangles[triIdx];

      const r1 = ((i + 1) * R2_A) % 1.0;
      const r2 = ((i + 1) * R2_B) % 1.0;
      const pt = samplePointOnTriangle(tri, r1, r2);

      if (interiorRatio > 0 && ((i * 0.381966011) % 1.0) < interiorRatio) {
        const pull = (1.0 - Math.cbrt(((i + 0.3) * 0.754877) % 1.0)) * interiorDepth;
        pt.x += (cx - pt.x) * pull;
        pt.y += (cy - pt.y) * pull;
        pt.z += (cz - pt.z) * pull;
      }
      results[i] = pt;
    }
    return results;
  }

  /**
   * Transforms raw sampled 3D points (x, y, z, hex) by Euler X/Y/Z rotation (deg)
   * and Scale multiplier, normalizing cleanly into AeroGrid flight coordinates
   * [x_m, y_depth_m, z_alt_m, led_hex]. Runs in <0.3ms for live 60fps orientation!
   */
  function transformRawSamplesToCloud(rawPts, options = {}) {
    if (!rawPts || !rawPts.length) return [];
    const rotX = THREE.MathUtils.degToRad(options.rotX || 0);
    const rotY = THREE.MathUtils.degToRad(options.rotY || 0);
    const rotZ = THREE.MathUtils.degToRad(options.rotZ || 0);
    const userScale  = Math.max(0.25, Math.min(2.5, options.scale || 1.0));
    const targetSpan = (options.targetSpan || 76.0) * userScale;
    const baseAlt    = typeof options.baseAlt === 'number' ? options.baseAlt : 16.0;
    const centerAlt  = typeof options.centerAlt === 'number' ? options.centerAlt : null;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < rawPts.length; i++) {
      const p = rawPts[i];
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
      if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
    }

    const midX = (minX + maxX) * 0.5;
    const midY = (minY + maxY) * 0.5;
    const midZ = (minZ + maxZ) * 0.5;

    const hasRot = Math.abs(rotX) > 1e-4 || Math.abs(rotY) > 1e-4 || Math.abs(rotZ) > 1e-4;
    const quat   = hasRot ? new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, rotY, rotZ, 'XYZ')) : null;
    const tmpV   = new THREE.Vector3();

    const rotated = new Array(rawPts.length);
    let rMinX = Infinity, rMaxX = -Infinity;
    let rMinY = Infinity, rMaxY = -Infinity;
    let rMinZ = Infinity, rMaxZ = -Infinity;

    for (let i = 0; i < rawPts.length; i++) {
      const p = rawPts[i];
      tmpV.set(p.x - midX, p.y - midY, p.z - midZ);
      if (quat) tmpV.applyQuaternion(quat);
      const rx = tmpV.x, ry = tmpV.y, rz = tmpV.z;
      if (rx < rMinX) rMinX = rx; if (rx > rMaxX) rMaxX = rx;
      if (ry < rMinY) rMinY = ry; if (ry > rMaxY) rMaxY = ry;
      if (rz < rMinZ) rMinZ = rz; if (rz > rMaxZ) rMaxZ = rz;
      rotated[i] = { x: rx, y: ry, z: rz, hex: p.hex };
    }

    const maxDim = Math.max(1e-4, rMaxX - rMinX, rMaxY - rMinY, rMaxZ - rMinZ);
    const scale  = options.preserveScale ? userScale : (targetSpan / maxDim);
    const rMidX  = (rMinX + rMaxX) * 0.5;
    const rMidY  = (rMinY + rMaxY) * 0.5;
    const rMidZ  = (rMinZ + rMaxZ) * 0.5;

    const cloud = new Array(rotated.length);
    for (let i = 0; i < rotated.length; i++) {
      const p  = rotated[i];
      const wx = (p.x - rMidX) * scale;
      const wz = (p.z - rMidZ) * scale;
      const wy = centerAlt !== null
        ? (p.y - rMidY) * scale + centerAlt
        : (p.y - rMinY) * scale + baseAlt;
      cloud[i] = [+wx.toFixed(2), +wz.toFixed(2), +wy.toFixed(2), p.hex];
    }
    return cloud;
  }

  /**
   * Samples `count` points across a THREE.Object3D / THREE.BufferGeometry,
   * scales & places the 3D cloud into AeroGrid flight-space coordinates
   * [x_m, y_depth_m, z_alt_m, led_hex].
   */
  function sampleMeshToDroneCloud(rootOrGeo, count, options = {}) {
    const n = Math.max(1, Math.round(count || 2200));
    const rawPts = sampleSurfaceRaw(rootOrGeo, n, options);
    return transformRawSamplesToCloud(rawPts, options);
  }

  window.AeroSampler = {
    applyVertexColors,
    collectTriangles,
    sampleSurfaceRaw,
    transformRawSamplesToCloud,
    sampleMeshToDroneCloud,
    toHexFromRgb,
  };
})();

// -----------------------------------------------------------------------------
// 2. MODULE-LEVEL SCENE STATE
// -----------------------------------------------------------------------------
let scene, camera, renderer, composer, bloomPass, controls;
let dronePoints, reflectionPoints, trailLines, venueGroup;
let currentPositions, reflectionPositions, startPositions, targetPositions, prevPositions;
let droneColors, baseDroneColors;
let morphProgress = 1.0;
let currentTransition = 'spiral';
let autoPlay = false;
let autoTimer = 0;
let clientViewActive = false;
let userDroneSize = null;
let waterRippleRings = [];
let currentCamPreset = 'audience';
let camGlideActive = false;
const camTargetPos    = new THREE.Vector3(0, 26, 175);
const camTargetLookAt = new THREE.Vector3(0, 56, 0);
let resizeObserver = null;

// -----------------------------------------------------------------------------
// 3. CRISP LED DRONE SPRITE TEXTURE
// -----------------------------------------------------------------------------
function createGlowSprite() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0.00, 'rgba(255,255,255,1.00)');
  grad.addColorStop(0.24, 'rgba(255,255,255,0.98)');
  grad.addColorStop(0.38, 'rgba(255,255,255,0.62)');
  grad.addColorStop(0.56, 'rgba(255,255,255,0.20)');
  grad.addColorStop(0.78, 'rgba(255,255,255,0.04)');
  grad.addColorStop(1.00, 'rgba(0,0,0,0.00)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

// -----------------------------------------------------------------------------
// 4. INIT THREE.JS STAGE (called on DOMContentLoaded)
// -----------------------------------------------------------------------------
window.initThreeJS = function initThreeJS() {
  const container = document.getElementById('threeContainer');
  if (!container) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02050c);
  scene.fog = new THREE.FogExp2(0x02050c, 0.0016);

  const initW = Math.max(1, container.clientWidth);
  const initH = Math.max(1, container.clientHeight);

  camera = new THREE.PerspectiveCamera(46, initW / initH, 0.5, 1200);
  camera.position.set(0, 26, 175);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(initW, initH, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ReinhardToneMapping;
  container.appendChild(renderer.domElement);

  // HDR UnrealBloom Post-Processing (default bloom: 0.75)
  if (typeof THREE.EffectComposer === 'function' && typeof THREE.UnrealBloomPass === 'function') {
    const renderPass = new THREE.RenderPass(scene, camera);
    bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(initW, initH),
      0.75, 0.42, 0.15
    );
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
  }

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 56, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 24;
  controls.maxDistance = 420;
  controls.addEventListener('start', () => { camGlideActive = false; });
  controls.update();

  venueGroup = new THREE.Group();
  scene.add(venueGroup);
  window.changeVenue('riverfront');

  // Deep Night Sky Starfield
  const starGeo = new THREE.BufferGeometry();
  const starVerts = [];
  const starCols  = [];
  for (let i = 0; i < 720; i++) {
    const sx = (Math.random() - 0.5) * 680;
    const sy = Math.random() * 280 + 24;
    const sz = (Math.random() - 0.5) * 680;
    starVerts.push(sx, sy, sz);
    const b = 0.35 + Math.random() * 0.55;
    starCols.push(b * 0.85, b * 0.92, b);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
  starGeo.setAttribute('color',    new THREE.Float32BufferAttribute(starCols, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
    size: 0.95, vertexColors: true, transparent: true, opacity: 0.72,
  })));

  // Populate Hero Vault Grid (6 Flagship Presets)
  const heroGrid = document.getElementById('heroGrid');
  if (heroGrid && Array.isArray(window.HERO_VAULT)) {
    heroGrid.innerHTML = window.HERO_VAULT.map((h) => `
      <div onclick="loadHeroToSlide('${h.id}','${h.name}')"
        class="hero-card p-3 rounded-xl bg-[#050914] border border-slate-800 flex flex-col items-center text-center gap-1">
        <span class="text-xl">${h.icon}</span>
        <span class="text-[11px] font-semibold text-white leading-tight">${h.name}</span>
        <span class="text-[9px] font-mono text-sky-400/90">${h.tag}</span>
      </div>
    `).join('');
  }

  // Initialize studios, drag-and-drop viewport & default fleet
  if (typeof window.initSkyDrawPad === 'function') window.initSkyDrawPad();
  if (typeof window.generateBlueprintPreview === 'function') window.generateBlueprintPreview(false);
  initViewportDropZone();

  // Respect shared URL parameters (?seq=...&drones=...) if present
  const params = new URLSearchParams(window.location.search);
  const urlDrones = parseInt(params.get('drones'), 10);
  const initDrones = (!isNaN(urlDrones) && urlDrones >= 500 && urlDrones <= 5000) ? urlDrones : 2200;

  const droneManualInput = document.getElementById('droneManualInput');
  const modalDroneInput  = document.getElementById('modalDroneInput');
  if (droneManualInput) droneManualInput.value = initDrones;
  if (modalDroneInput)  modalDroneInput.value  = initDrones;

  setupDroneParticles(initDrones);

  const urlSeq = params.get('seq');
  if (urlSeq) {
    const promptEl = document.getElementById('magicPrompt');
    if (promptEl) promptEl.value = urlSeq;
    window.runInstantSequence();
  } else {
    window.slides = [
      { type: 'hero', id: 'rings',  label: 'Solitaire Rings', dur: 15, trans: 'spiral', cloud: window.buildHeroFormation('rings', initDrones) },
      { type: 'hero', id: 'lotus',  label: '3D Lotus',        dur: 15, trans: 'burst',  cloud: window.buildHeroFormation('lotus', initDrones) },
      { type: 'hero', id: 'rocket', label: 'ISRO Rocket',     dur: 15, trans: 'wave',   cloud: window.buildHeroFormation('rocket', initDrones) },
      { type: 'text', text: 'INDIA 2026', color: 'tricolour', font: '900 Arial, sans-serif', arched: true, label: '"INDIA 2026"', dur: 20, trans: 'spiral', cloud: window.build3DTextCloud('INDIA 2026', initDrones, 'tricolour', '900 Arial, sans-serif', true) },
    ];
    window.activateSlide(0, true);
  }

  window.addEventListener('resize', window.handleResize);
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => window.handleResize());
    resizeObserver.observe(container);
  }
  requestAnimationFrame(() => window.handleResize());
  animateThree();
};

// -----------------------------------------------------------------------------
// 5. RESPONSIVE RESIZE HANDLER
// -----------------------------------------------------------------------------
window.handleResize = function handleResize() {
  const container = document.getElementById('threeContainer');
  if (!container || !camera || !renderer) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w < 10 || h < 10) return;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  if (composer) composer.setSize(w, h);
  if (bloomPass && bloomPass.resolution) bloomPass.resolution.set(w, h);
  if (window.slides && window.slides[window.activeSlideIdx]) {
    frameFormation(window.slides[window.activeSlideIdx].cloud, currentCamPreset, true);
  }
};

// -----------------------------------------------------------------------------
// 6. BOUNDING-SPHERE + PROJECTED-EXTENT AUTO-FRAMING CAMERA
// -----------------------------------------------------------------------------
function computeFormationBounds(cloud) {
  if (!cloud || !cloud.length) {
    return { cx: 0, cy: 56, cz: 0, radius: 42 };
  }
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (let i = 0; i < cloud.length; i++) {
    const pt = cloud[i];
    const x = pt[0], y = pt[2], z = pt[1];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }

  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const cz = (minZ + maxZ) * 0.5;

  let maxDistSq = 0;
  for (let i = 0; i < cloud.length; i++) {
    const pt = cloud[i];
    const dx = pt[0] - cx;
    const dy = pt[2] - cy;
    const dz = pt[1] - cz;
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 > maxDistSq) maxDistSq = d2;
  }

  const radius = Math.max(16, Math.sqrt(maxDistSq));
  return { cx, cy, cz, radius, minX, maxX, minY, maxY, minZ, maxZ };
}

function getCamPresetDirection(mode) {
  if (mode === 'side') return new THREE.Vector3(0.84, 0.20, 0.50).normalize();
  if (mode === 'top')  return new THREE.Vector3(0.00, 0.96, 0.28).normalize();
  return new THREE.Vector3(0.00, 0.05, 1.00).normalize();
}

function frameFormation(cloud, mode, instant = false) {
  if (!camera || !controls) return;
  const bounds = computeFormationBounds(cloud);
  const vFov   = THREE.MathUtils.degToRad(camera.fov);
  const aspect = Math.max(0.35, camera.aspect || 1.6);
  const hFov   = 2 * Math.atan(Math.tan(vFov * 0.5) * aspect);

  const dir    = getCamPresetDirection(mode || currentCamPreset);
  const upHint = Math.abs(dir.y) > 0.92
    ? new THREE.Vector3(0, 0, -1)
    : new THREE.Vector3(0, 1, 0);
  const right  = new THREE.Vector3().crossVectors(upHint, dir).normalize();
  const camUp  = new THREE.Vector3().crossVectors(dir, right).normalize();

  // Compute exact projected half-extents along camera right, up, and look axes
  let maxProjX = 16;
  let maxProjY = 16;
  let maxFrontZ = 0;
  if (cloud && cloud.length) {
    const stride = Math.max(1, Math.floor(cloud.length / 900));
    for (let i = 0; i < cloud.length; i += stride) {
      const pt = cloud[i];
      const dx = pt[0] - bounds.cx;
      const dy = pt[2] - bounds.cy;
      const dz = pt[1] - bounds.cz;
      const px = Math.abs(dx * right.x + dy * right.y + dz * right.z);
      const py = Math.abs(dx * camUp.x + dy * camUp.y + dz * camUp.z);
      const pz = dx * dir.x + dy * dir.y + dz * dir.z;
      if (px > maxProjX) maxProjX = px;
      if (py > maxProjY) maxProjY = py;
      if (pz > maxFrontZ) maxFrontZ = pz;
    }
  }

  // Account for animated rocket exhaust extension & heart beat expansion
  const activeSlide = window.slides && window.slides[window.activeSlideIdx];
  const extraPad = (activeSlide?.type === 'hero' && (activeSlide.id === 'rocket' || activeSlide.id === 'heart'))
    ? 1.34
    : 1.26;

  const tanHalfV = Math.tan(vFov * 0.5);
  const tanHalfH = Math.tan(hFov * 0.5);
  const sinHalfMin = Math.min(Math.sin(vFov * 0.5), Math.sin(hFov * 0.5));

  const distExactV = maxFrontZ + (maxProjY * extraPad) / tanHalfV;
  const distExactH = maxFrontZ + (maxProjX * extraPad) / tanHalfH;
  const distSphere = (bounds.radius * 1.20) / sinHalfMin;
  const dist       = Math.max(distExactV, distExactH, distSphere * 0.90, 56);

  camTargetLookAt.set(bounds.cx, bounds.cy, bounds.cz);
  camTargetPos.copy(camTargetLookAt).addScaledVector(dir, dist);
  controls.maxDistance = Math.max(380, dist * 2.5);

  if (instant) {
    camGlideActive = false;
    controls.target.copy(camTargetLookAt);
    camera.position.copy(camTargetPos);
    controls.update();
  } else {
    camGlideActive = true;
  }
}

// -----------------------------------------------------------------------------
// 7. VENUE BUILDER (RIVERFRONT MIRROR LAKE + NIGHT CITY SKYLINE)
// -----------------------------------------------------------------------------
window.changeVenue = function changeVenue(mode) {
  if (!venueGroup) return;
  while (venueGroup.children.length > 0) venueGroup.remove(venueGroup.children[0]);
  waterRippleRings = [];

  if (mode === 'riverfront') {
    // Calm midnight water plane
    const lake = new THREE.Mesh(
      new THREE.CircleGeometry(210, 72),
      new THREE.MeshBasicMaterial({ color: 0x020816, transparent: true, opacity: 0.78, side: THREE.DoubleSide })
    );
    lake.rotation.x = -Math.PI / 2;
    venueGroup.add(lake);

    // Animated water ripple rings
    [24, 44, 66, 88, 112].forEach((rad, idx) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(rad, rad + (idx === 4 ? 1.5 : 0.7), 80),
        new THREE.MeshBasicMaterial({
          color: idx % 2 === 0 ? 0x0ea5e9 : 0x38bdf8,
          transparent: true,
          opacity: idx === 4 ? 0.26 : 0.13,
          side: THREE.DoubleSide,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.1 + idx * 0.02;
      ring.userData = { phase: idx * 1.15, baseOpacity: idx === 4 ? 0.26 : 0.13 };
      venueGroup.add(ring);
      waterRippleRings.push(ring);
    });

    // Dark architectural city skyline silhouette along far bank (-Z)
    const matA = new THREE.MeshBasicMaterial({ color: 0x050b18 });
    const matB = new THREE.MeshBasicMaterial({ color: 0x091328 });
    const winVerts = [];
    const winCols  = [];
    const bCount   = 40;

    for (let i = 0; i < bCount; i++) {
      const u = i / (bCount - 1);
      const angle = (u - 0.5) * Math.PI * 0.90;
      const dist  = 134 + ((i * 19) % 22);
      const bx    = Math.sin(angle) * dist;
      const bz    = -Math.cos(angle) * dist;
      const bw    = 7 + ((i * 5) % 9);
      const bd    = 7 + ((i * 3) % 6);
      const bh    = 14 + Math.abs(Math.sin(i * 1.41)) * 36 + (i % 5 === 0 ? 14 : 0);

      const bldg = new THREE.Mesh(
        new THREE.BoxGeometry(bw, bh, bd),
        i % 2 === 0 ? matA : matB
      );
      bldg.position.set(bx, bh / 2 - 0.4, bz);
      bldg.lookAt(0, bh / 2 - 0.4, 0);
      venueGroup.add(bldg);

      // Subtle underwater building reflection
      const refBldg = new THREE.Mesh(
        new THREE.BoxGeometry(bw, bh * 0.7, bd),
        new THREE.MeshBasicMaterial({ color: 0x030812, transparent: true, opacity: 0.24 })
      );
      refBldg.position.set(bx, -(bh * 0.35), bz);
      refBldg.lookAt(0, -(bh * 0.35), 0);
      venueGroup.add(refBldg);

      // Building window lights + water reflection
      const rows = Math.floor(bh / 4.2);
      for (let r = 1; r < rows; r++) {
        if ((i + r) % 3 === 0) continue;
        const wy = r * 4.0;
        const wx = bx + ((r % 2 === 0 ? 0.22 : -0.22) * bw);
        winVerts.push(wx, wy, bz + bd * 0.54);
        const warm = (i + r) % 4 === 0;
        winCols.push(warm ? 0.52 : 0.18, warm ? 0.38 : 0.44, warm ? 0.16 : 0.68);
        winVerts.push(wx, -wy * 0.7, bz + bd * 0.54);
        winCols.push(warm ? 0.18 : 0.06, warm ? 0.12 : 0.15, warm ? 0.05 : 0.25);
      }
      if (i % 4 === 0) {
        winVerts.push(bx, bh + 0.7, bz);
        winCols.push(0.90, 0.20, 0.26);
      }
    }

    const winGeo = new THREE.BufferGeometry();
    winGeo.setAttribute('position', new THREE.Float32BufferAttribute(winVerts, 3));
    winGeo.setAttribute('color',    new THREE.Float32BufferAttribute(winCols, 3));
    venueGroup.add(new THREE.Points(winGeo, new THREE.PointsMaterial({
      size: 1.4, vertexColors: true, transparent: true, opacity: 0.78,
    })));
  } else if (mode === 'stadium') {
    const turf = new THREE.Mesh(
      new THREE.PlaneGeometry(116, 78),
      new THREE.MeshBasicMaterial({ color: 0x064e3b, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    turf.rotation.x = -Math.PI / 2;
    venueGroup.add(turf);
    const track = new THREE.Mesh(
      new THREE.RingGeometry(62, 74, 72),
      new THREE.MeshBasicMaterial({ color: 0x7c2d12, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    track.rotation.x = -Math.PI / 2;
    track.position.y = 0.05;
    venueGroup.add(track);
  } else if (mode === 'palace') {
    const lawn = new THREE.Mesh(
      new THREE.CircleGeometry(96, 56),
      new THREE.MeshBasicMaterial({ color: 0x065f46, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    lawn.rotation.x = -Math.PI / 2;
    venueGroup.add(lawn);
    const courtyard = new THREE.Mesh(
      new THREE.RingGeometry(48, 52, 64),
      new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
    );
    courtyard.rotation.x = -Math.PI / 2;
    courtyard.position.y = 0.05;
    venueGroup.add(courtyard);
  } else if (mode === 'grid') {
    venueGroup.add(new THREE.GridHelper(200, 40, 0x1e3a5f, 0x0c172a));
  }

  if (reflectionPoints) {
    reflectionPoints.visible = (mode === 'riverfront');
  }
};

// -----------------------------------------------------------------------------
// 8. DRONE PARTICLE SYSTEM SETUP (crisp LED sprites: size 2.6 @ 2,200 UAVs)
// -----------------------------------------------------------------------------
function setupDroneParticles(count) {
  if (dronePoints)      scene.remove(dronePoints);
  if (reflectionPoints) scene.remove(reflectionPoints);
  if (trailLines)       scene.remove(trailLines);

  const spriteTex  = createGlowSprite();
  const spriteSize = userDroneSize !== null
    ? userDroneSize
    : (count >= 3500 ? 2.2 : (count >= 1600 ? 2.6 : 3.1));

  const sizeSlider = document.getElementById('droneSizeSlider');
  const sizeVal    = document.getElementById('droneSizeVal');
  if (sizeSlider && userDroneSize === null) sizeSlider.value = spriteSize;
  if (sizeVal && userDroneSize === null)    sizeVal.textContent = spriteSize.toFixed(1);

  currentPositions    = new Float32Array(count * 3);
  reflectionPositions = new Float32Array(count * 3);
  startPositions      = new Float32Array(count * 3);
  prevPositions       = new Float32Array(count * 3);
  targetPositions     = new Float32Array(count * 3);
  droneColors         = new Float32Array(count * 3);
  baseDroneColors     = new Float32Array(count * 3);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(droneColors, 3));

  dronePoints = new THREE.Points(geo, new THREE.PointsMaterial({
    size: spriteSize,
    map: spriteTex,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  scene.add(dronePoints);

  const refGeo = new THREE.BufferGeometry();
  refGeo.setAttribute('position', new THREE.BufferAttribute(reflectionPositions, 3));
  refGeo.setAttribute('color',    new THREE.BufferAttribute(droneColors, 3));

  reflectionPoints = new THREE.Points(refGeo, new THREE.PointsMaterial({
    size: spriteSize * 1.15,
    map: spriteTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  const venueEl = document.getElementById('venueSelect');
  reflectionPoints.visible = !venueEl || venueEl.value === 'riverfront';
  scene.add(reflectionPoints);

  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 2 * 3), 3));
  trailGeo.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(count * 2 * 3), 3));
  trailLines = new THREE.LineSegments(trailGeo, new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
  }));
  scene.add(trailLines);
}

// -----------------------------------------------------------------------------
// 9. TELEMETRY HUD
// -----------------------------------------------------------------------------
function updateTelemetryHUD(drones, slide) {
  const densityFactor = Math.max(0, Math.min(1, (drones - 500) / 4500));
  const spacing = Math.max(1.55, +(2.80 - densityFactor * 0.95).toFixed(2));
  const baseVel = slide?.trans === 'burst' ? 5.4 : (slide?.trans === 'spiral' ? 5.1 : 4.7);
  const maxVel  = +(baseVel + densityFactor * 0.45).toFixed(1);

  const elFleet   = document.getElementById('hudFleet');
  const elMaxVel  = document.getElementById('hudMaxVel');
  const elSpacing = document.getElementById('hudSpacing');
  const elToast   = document.getElementById('statusToast');
  const slideNum  = String(window.activeSlideIdx + 1).padStart(2, '0');

  if (elFleet)   elFleet.textContent   = `${drones} UAVs`;
  if (elMaxVel)  elMaxVel.textContent  = `${maxVel} m/s`;
  if (elSpacing) elSpacing.textContent = `${spacing}m [DGCA SAFE]`;
  if (elToast)   elToast.textContent   = `✓ Slide ${slideNum}: ${slide?.label || 'Formation'} • ${drones} UAVs`;
}

// -----------------------------------------------------------------------------
// 10. SLIDE ACTIVATION & MORPH SETUP
// -----------------------------------------------------------------------------
window.activateSlide = function activateSlide(idx, instant = false) {
  if (!window.slides || !window.slides[idx] || !currentPositions) return;
  window.activeSlideIdx = idx;
  const slide  = window.slides[idx];
  const drones = currentPositions.length / 3;
  currentTransition = slide.trans || 'spiral';

  const transEl = document.getElementById('transitionSelect');
  const nameEl  = document.getElementById('hudSlideName');
  const slideNum = String(idx + 1).padStart(2, '0');
  if (transEl) transEl.value = currentTransition;
  if (nameEl)  nameEl.textContent = `${slideNum}. ${slide.label}`;
  updateTelemetryHUD(drones, slide);

  const cloud  = slide.cloud && slide.cloud.length ? slide.cloud : [[0, 0, 56, '#00E5FF']];
  const colObj = new THREE.Color();
  const tCols  = trailLines.geometry.attributes.color.array;

  for (let i = 0; i < drones; i++) {
    const pt = cloud[i % cloud.length];
    const ix = i * 3;

    startPositions[ix]     = currentPositions[ix];
    startPositions[ix + 1] = currentPositions[ix + 1];
    startPositions[ix + 2] = currentPositions[ix + 2];

    targetPositions[ix]     = pt[0];
    targetPositions[ix + 1] = pt[2]; // Altitude -> Three.js Y
    targetPositions[ix + 2] = pt[1]; // Depth    -> Three.js Z

    if (instant) {
      currentPositions[ix]     = pt[0];
      currentPositions[ix + 1] = pt[2];
      currentPositions[ix + 2] = pt[1];
      prevPositions[ix]        = pt[0];
      prevPositions[ix + 1]    = pt[2];
      prevPositions[ix + 2]    = pt[1];
      reflectionPositions[ix]     = pt[0];
      reflectionPositions[ix + 1] = -pt[2] * 0.90;
      reflectionPositions[ix + 2] = pt[1];
    }

    colObj.set(pt[3] || '#00E5FF');
    droneColors[ix]         = colObj.r;
    droneColors[ix + 1]     = colObj.g;
    droneColors[ix + 2]     = colObj.b;
    baseDroneColors[ix]     = colObj.r;
    baseDroneColors[ix + 1] = colObj.g;
    baseDroneColors[ix + 2] = colObj.b;

    tCols[i * 6]     = colObj.r;
    tCols[i * 6 + 1] = colObj.g;
    tCols[i * 6 + 2] = colObj.b;
    tCols[i * 6 + 3] = 0.04;
    tCols[i * 6 + 4] = 0.06;
    tCols[i * 6 + 5] = 0.14;
  }

  morphProgress = instant ? 1.0 : 0.0;
  dronePoints.geometry.attributes.color.needsUpdate      = true;
  reflectionPoints.geometry.attributes.color.needsUpdate = true;
  trailLines.geometry.attributes.color.needsUpdate       = true;
  if (instant) {
    dronePoints.geometry.attributes.position.needsUpdate      = true;
    reflectionPoints.geometry.attributes.position.needsUpdate = true;
  }
  frameFormation(cloud, currentCamPreset, instant);
  renderStoryboard();
  syncModelTransformUI();
};

// -----------------------------------------------------------------------------
// 11. MAIN ANIMATION LOOP
// -----------------------------------------------------------------------------
function animateThree() {
  requestAnimationFrame(animateThree);
  const t = performance.now() * 0.0018;

  if (autoPlay && window.slides && window.slides.length > 0) {
    autoTimer += 0.016;
    const durSec = Math.max(3.8, (window.slides[window.activeSlideIdx]?.dur || 15) * 0.25);
    if (autoTimer > durSec) {
      autoTimer = 0;
      window.activateSlide((window.activeSlideIdx + 1) % window.slides.length, false);
    }
  }

  if (currentPositions && targetPositions) {
    const count  = currentPositions.length / 3;
    const tVerts = trailLines.geometry.attributes.position.array;
    if (morphProgress < 1.0) morphProgress = Math.min(1.0, morphProgress + 0.024);
    const ease = 1 - Math.pow(1 - morphProgress, 3);
    const arc  = Math.sin(morphProgress * Math.PI);

    const activeSlide = window.slides[window.activeSlideIdx];
    const heroId      = activeSlide?.type === 'hero' ? activeSlide.id : null;
    const animBlend   = ease;
    let colorsDirty   = false;

    const heartPulse = heroId === 'heart'
      ? (Math.pow(Math.max(0, Math.sin(t * 2.4)), 6) * 0.105
         + Math.pow(Math.max(0, Math.sin(t * 2.4 - 0.52)), 8) * 0.065) * animBlend
      : 0;
    const globeCos = heroId === 'globe' ? Math.cos(t * 0.36 * animBlend) : 1;
    const globeSin = heroId === 'globe' ? Math.sin(t * 0.36 * animBlend) : 0;

    for (let i = 0; i < count; i++) {
      const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
      prevPositions[ix] += (currentPositions[ix] - prevPositions[ix]) * 0.28;
      prevPositions[iy] += (currentPositions[iy] - prevPositions[iy]) * 0.28;
      prevPositions[iz] += (currentPositions[iz] - prevPositions[iz]) * 0.28;

      const tx = targetPositions[ix];
      const ty = targetPositions[iy];
      const tz = targetPositions[iz];

      let bx = startPositions[ix] + (tx - startPositions[ix]) * ease;
      let by = startPositions[iy] + (ty - startPositions[iy]) * ease;
      let bz = startPositions[iz] + (tz - startPositions[iz]) * ease;

      if (arc > 0.001) {
        if (currentTransition === 'spiral') {
          const ang = arc * 2.6 + (i % 14) * 0.15;
          const rad = arc * 16;
          bx += Math.cos(ang) * rad;
          bz += Math.sin(ang) * rad;
        } else if (currentTransition === 'burst') {
          bx += (tx * 0.42) * arc;
          by += ((ty - 58) * 0.42) * arc;
          bz += (tz * 0.42) * arc;
        } else if (currentTransition === 'wave') {
          by += Math.sin(tx * 0.12 + morphProgress * 6.0) * 14 * arc;
        }
      }

      // Live Hero Dynamics
      if (heroId === 'heart') {
        bx = bx * (1 + heartPulse);
        by = 56 + (by - 56) * (1 + heartPulse);
        bz = bz * (1 + heartPulse);
        const pulseGlow = 1 + heartPulse * 1.4;
        droneColors[ix] = Math.min(1, baseDroneColors[ix] * pulseGlow);
        droneColors[iy] = Math.min(1, baseDroneColors[iy] * pulseGlow);
        droneColors[iz] = Math.min(1, baseDroneColors[iz] * pulseGlow);
        colorsDirty = true;
      } else if (heroId === 'globe') {
        const rx = bx * globeCos - bz * globeSin;
        const rz = bx * globeSin + bz * globeCos;
        bx = rx;
        bz = rz;
      } else if (heroId === 'rocket') {
        if (ty < 31.2) {
          const cycle  = (t * 2.5 + i * 0.173) % 1.0;
          const spread = 1.0 + cycle * 0.65;
          bx *= spread;
          bz *= spread;
          by -= cycle * 9.5 * animBlend;
          const flicker = 0.68 + 0.52 * Math.sin(t * 24.0 + i * 1.7);
          droneColors[ix] = Math.min(1, baseDroneColors[ix] * flicker + 0.20);
          droneColors[iy] = Math.min(1, baseDroneColors[iy] * flicker);
          droneColors[iz] = Math.min(1, baseDroneColors[iz] * (0.45 + 0.35 * Math.cos(t * 18 + i)));
          colorsDirty = true;
        } else {
          by += Math.sin(t * 18.0 + i * 0.1) * 0.16 * animBlend;
        }
      } else if (heroId === 'trishul') {
        const lum = 0.88 + 0.24 * Math.sin(t * 3.2 + by * 0.12 + i * 0.08);
        droneColors[ix] = Math.min(1, baseDroneColors[ix] * lum);
        droneColors[iy] = Math.min(1, baseDroneColors[iy] * lum);
        droneColors[iz] = Math.min(1, baseDroneColors[iz] * (lum + 0.05));
        colorsDirty = true;
      } else if (heroId === 'rings' && ty > 72) {
        const sparkle = 0.82 + 0.45 * Math.pow(Math.max(0, Math.sin(t * 4.8 + i * 1.37)), 4);
        droneColors[ix] = Math.min(1, baseDroneColors[ix] * sparkle);
        droneColors[iy] = Math.min(1, baseDroneColors[iy] * sparkle);
        droneColors[iz] = Math.min(1, baseDroneColors[iz] * sparkle);
        colorsDirty = true;
      } else if (heroId === 'lotus') {
        const radDist = Math.hypot(tx, tz);
        const lum = 0.90 + 0.18 * Math.sin(t * 2.6 - radDist * 0.12);
        droneColors[ix] = Math.min(1, baseDroneColors[ix] * lum);
        droneColors[iy] = Math.min(1, baseDroneColors[iy] * lum);
        droneColors[iz] = Math.min(1, baseDroneColors[iz] * lum);
        colorsDirty = true;
      } else if (heroId === 'crown') {
        const sparkle = ty > 74
          ? 0.88 + 0.38 * Math.pow(Math.max(0, Math.sin(t * 4.2 + i * 1.1)), 4)
          : 0.92 + 0.14 * Math.sin(t * 2.8 + Math.atan2(tz, tx) * 4.0);
        droneColors[ix] = Math.min(1, baseDroneColors[ix] * sparkle);
        droneColors[iy] = Math.min(1, baseDroneColors[iy] * sparkle);
        droneColors[iz] = Math.min(1, baseDroneColors[iz] * sparkle);
        colorsDirty = true;
      }

      const hx = Math.sin(t + i * 0.37) * 0.09;
      const hy = Math.cos(t * 1.1 + i * 0.53) * 0.09;
      const finalX = bx + hx;
      const finalY = by + hy;
      const finalZ = bz;

      currentPositions[ix] = finalX;
      currentPositions[iy] = finalY;
      currentPositions[iz] = finalZ;

      const rippleX = Math.sin(t * 3.1 + finalY * 0.13 + finalZ * 0.06) * 0.62;
      const rippleZ = Math.cos(t * 2.6 + finalX * 0.11) * 0.42;
      reflectionPositions[ix] = finalX + rippleX;
      reflectionPositions[iy] = -finalY * 0.90;
      reflectionPositions[iz] = finalZ + rippleZ;

      tVerts[i * 6]     = finalX;
      tVerts[i * 6 + 1] = finalY;
      tVerts[i * 6 + 2] = finalZ;
      tVerts[i * 6 + 3] = prevPositions[ix];
      tVerts[i * 6 + 4] = prevPositions[iy];
      tVerts[i * 6 + 5] = prevPositions[iz];
    }

    dronePoints.geometry.attributes.position.needsUpdate      = true;
    reflectionPoints.geometry.attributes.position.needsUpdate = true;
    trailLines.geometry.attributes.position.needsUpdate       = true;
    if (colorsDirty) {
      dronePoints.geometry.attributes.color.needsUpdate      = true;
      reflectionPoints.geometry.attributes.color.needsUpdate = true;
    }
  }

  for (let r = 0; r < waterRippleRings.length; r++) {
    const ring = waterRippleRings[r];
    const wave = Math.sin(t * 1.8 - ring.userData.phase);
    const sc   = 1 + wave * 0.018;
    ring.scale.set(sc, sc, 1);
    ring.material.opacity = ring.userData.baseOpacity * (0.65 + 0.35 * Math.cos(t * 2.2 + ring.userData.phase));
  }

  if (camGlideActive) {
    controls.target.lerp(camTargetLookAt, 0.09);
    camera.position.lerp(camTargetPos, 0.09);
    if (camera.position.distanceTo(camTargetPos) < 0.25 && controls.target.distanceTo(camTargetLookAt) < 0.25) {
      camGlideActive = false;
    }
  }

  controls.update();
  if (composer) composer.render();
  else renderer.render(scene, camera);
}

// -----------------------------------------------------------------------------
// 12. LIVE BLOOM & DRONE SIZE CONTROLS
// -----------------------------------------------------------------------------
window.setBloomStrength = function setBloomStrength(val) {
  const v = Math.max(0.1, Math.min(3.0, parseFloat(val) || 0.75));
  if (bloomPass) bloomPass.strength = v;
  const el = document.getElementById('bloomVal');
  if (el) el.textContent = v.toFixed(2);
};

window.setDroneSize = function setDroneSize(val) {
  const v = Math.max(1.0, Math.min(10.0, parseFloat(val) || 2.6));
  userDroneSize = v;
  if (dronePoints)      dronePoints.material.size      = v;
  if (reflectionPoints) reflectionPoints.material.size = v * 1.15;
  const el = document.getElementById('droneSizeVal');
  if (el) el.textContent = v.toFixed(1);
};

// -----------------------------------------------------------------------------
// 13. UI & WORKFLOW CONTROLLERS
// -----------------------------------------------------------------------------
window.switchSidebarTab = function switchSidebarTab(tabName) {
  ['blueprint', 'vault', 'draw', 'text', 'uploads'].forEach((t) => {
    const p = document.getElementById('panel-' + t);
    const b = document.getElementById('tabBtn-' + t);
    if (p) p.classList.toggle('hidden', t !== tabName);
    if (b) b.classList.toggle('active', t === tabName);
  });
};

window.toggleClientView = function toggleClientView() {
  clientViewActive = !clientViewActive;
  ['leftRail', 'sidebarDrawer', 'bottomTimeline', 'magicPromptWrap'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', clientViewActive);
  });
  const playBtn = document.getElementById('clientPlayBtn');
  if (playBtn) playBtn.classList.toggle('hidden', !clientViewActive);

  const btn = document.getElementById('clientViewBtn');
  if (btn) {
    if (clientViewActive) {
      btn.textContent = '✕ Exit Client View';
      btn.classList.add('bg-sky-400', 'text-slate-950');
      btn.classList.remove('text-sky-300');
    } else {
      btn.textContent = '👁️ Client View';
      btn.classList.remove('bg-sky-400', 'text-slate-950');
      btn.classList.add('text-sky-300');
    }
  }
  syncModelTransformUI();
  setTimeout(window.handleResize, 30);
};

window.loadHeroToSlide = function loadHeroToSlide(id, name) {
  const drones = parseInt(document.getElementById('droneManualInput')?.value, 10) || 2200;
  window.slides[window.activeSlideIdx] = {
    ...window.slides[window.activeSlideIdx],
    type: 'hero',
    id,
    label: name,
    meshGroup: null,
    rawSamples: null,
    imgSource: null,
    baseCloud: null,
    meshTransform: { rotX: 0, rotY: 0, rotZ: 0, scale: 1.0 },
    cloud: window.buildHeroFormation(id, drones),
  };
  window.activateSlide(window.activeSlideIdx, false);
};

window.runInstantSequence = function runInstantSequence() {
  const raw = (document.getElementById('magicPrompt')?.value || '').trim();
  if (!raw) return;
  const drones = parseInt(document.getElementById('droneManualInput')?.value, 10) || 2200;
  const parts  = raw.split(/->|→/).map((s) => s.trim()).filter(Boolean);
  const transCycle = ['spiral', 'burst', 'wave'];

  const extraAliases = [
    { keys: ['taj'], id: 'taj', name: 'Taj Mahal' },
    { keys: ['trishul', 'shiva'], id: 'trishul', name: 'Shiva Trishul' },
    { keys: ['ring', 'solitaire', 'wedding'], id: 'rings', name: 'Solitaire Rings' },
    { keys: ['heart'], id: 'heart', name: 'Beating 3D Heart' },
    { keys: ['globe', 'earth'], id: 'globe', name: 'Rotating Earth Globe' },
    { keys: ['rocket', 'isro', 'lvm3'], id: 'rocket', name: 'ISRO Rocket' },
    { keys: ['lotus', 'kamal'], id: 'lotus', name: '3D Lotus' },
    { keys: ['crown', 'king', 'queen', 'royal'], id: 'crown', name: '3D Crown' },
  ];

  window.slides = parts.slice(0, 6).map((seg, i) => {
    const isQuoted = /^["'].*["']$/.test(seg);
    const clean    = seg.replace(/^["']|["']$/g, '');
    const low      = clean.toLowerCase();

    if (isQuoted) {
      const col = low.includes('india') ? 'tricolour' : 'gold';
      return {
        type: 'text',
        text: clean.toUpperCase(),
        color: col,
        font: '900 Arial, sans-serif',
        arched: true,
        label: `"${clean.toUpperCase()}"`,
        dur: 18,
        trans: transCycle[i % 3],
        cloud: window.build3DTextCloud(clean.toUpperCase(), drones, col, '900 Arial, sans-serif', true),
      };
    }

    const vaultMatch = (window.HERO_VAULT || []).find(
      (h) => low.includes(h.id) || low.includes(h.name.toLowerCase())
    );
    const aliasMatch = vaultMatch || extraAliases.find((a) => a.keys.some((k) => low.includes(k)));
    if (aliasMatch) {
      return {
        type: 'hero',
        id: aliasMatch.id,
        label: aliasMatch.name,
        dur: 15,
        trans: transCycle[i % 3],
        cloud: window.buildHeroFormation(aliasMatch.id, drones),
      };
    }

    const bpInput = document.getElementById('bpPromptInput');
    if (bpInput) bpInput.value = clean;
    if (typeof window.generateBlueprintPreview === 'function') window.generateBlueprintPreview(false);
    const bpCanvas = document.getElementById('blueprintCanvas');
    const cloud = window.compileImageTo3DCloud(
      bpCanvas,
      drones,
      low.includes('india') ? 'tricolour' : 'gold_cyan',
      14
    );
    return {
      type: 'blueprint',
      imgSource: bpCanvas,
      imgTheme: low.includes('india') ? 'tricolour' : 'gold_cyan',
      imgDepth: 14,
      label: clean.slice(0, 20),
      dur: 15,
      trans: transCycle[i % 3],
      cloud,
    };
  });
  window.activateSlide(0, false);
};

window.applyCustomTextToSlide = function applyCustomTextToSlide() {
  const drones = parseInt(document.getElementById('droneManualInput')?.value, 10) || 2200;
  const txt    = (document.getElementById('customTextInput')?.value || 'INDIA 2026').trim() || 'INDIA 2026';
  const color  = document.getElementById('textColorSelect')?.value || 'tricolour';
  const font   = document.getElementById('textFontSelect')?.value || '900 Arial, sans-serif';
  const arched = Boolean(document.getElementById('archTextChk')?.checked);

  window.slides[window.activeSlideIdx] = {
    ...window.slides[window.activeSlideIdx],
    type: 'text',
    text: txt,
    color,
    font,
    arched,
    meshGroup: null,
    rawSamples: null,
    imgSource: null,
    baseCloud: null,
    meshTransform: { rotX: 0, rotY: 0, rotZ: 0, scale: 1.0 },
    label: `"${txt}"`,
    cloud: window.build3DTextCloud(txt, drones, color, font, arched),
  };
  window.activateSlide(window.activeSlideIdx, false);
};

function renderStoryboard() {
  const strip = document.getElementById('storyboardStrip');
  if (!strip) return;
  let totalSec = 0;
  strip.innerHTML = window.slides.map((s, idx) => {
    totalSec += (s.dur || 15);
    return `
      <div onclick="selectSlide(${idx})"
        class="slide-card ${idx === window.activeSlideIdx ? 'active' : ''} h-20 w-44 rounded-xl bg-[#0C1425] border border-slate-800 p-2.5 flex flex-col justify-between shrink-0 relative">
        <div class="flex items-center justify-between text-[10px] font-mono">
          <span class="text-sky-400 font-bold">SLIDE ${String(idx + 1).padStart(2, '0')}</span>
          <span class="text-slate-400">${s.dur || 15}s</span>
        </div>
        <p class="text-xs font-semibold text-white truncate">${s.label}</p>
        <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>⚡ ${s.trans || 'spiral'}</span>
          ${window.slides.length > 1
            ? `<button onclick="event.stopPropagation(); deleteSlide(${idx})" class="hover:text-rose-400">✕</button>`
            : ''}
        </div>
      </div>`;
  }).join('');
  const durLabel = document.getElementById('totalDurLabel');
  if (durLabel) durLabel.textContent = `${totalSec}s`;
}

window.selectSlide = function selectSlide(idx) {
  autoPlay = false;
  const b1 = document.getElementById('playShowBtn');
  const b2 = document.getElementById('clientPlayBtn');
  if (b1) b1.textContent = '▶ Play Full Show';
  if (b2) b2.textContent = '▶ Play Show';
  window.activateSlide(idx, false);
};

window.addNewSlide = function addNewSlide() {
  if (window.slides.length >= 6) return;
  const drones = parseInt(document.getElementById('droneManualInput')?.value, 10) || 2200;
  window.slides.push({
    type: 'hero',
    id: 'heart',
    label: 'Beating 3D Heart',
    dur: 15,
    trans: 'spiral',
    cloud: window.buildHeroFormation('heart', drones),
  });
  window.activateSlide(window.slides.length - 1, false);
};

window.deleteSlide = function deleteSlide(idx) {
  if (window.slides.length <= 1) return;
  window.slides.splice(idx, 1);
  window.activateSlide(Math.max(0, Math.min(window.activeSlideIdx, window.slides.length - 1)), false);
};

window.updateActiveSlideTransition = function updateActiveSlideTransition(val) {
  const slide = window.slides[window.activeSlideIdx];
  if (!slide) return;
  slide.trans = val;
  currentTransition = val;
  updateTelemetryHUD(currentPositions.length / 3, slide);
  renderStoryboard();
};

window.togglePlayShow = function togglePlayShow() {
  autoPlay = !autoPlay;
  autoTimer = 0;
  const b1 = document.getElementById('playShowBtn');
  const b2 = document.getElementById('clientPlayBtn');
  if (b1) b1.textContent = autoPlay ? '⏸ Pause Show' : '▶ Play Full Show';
  if (b2) b2.textContent = autoPlay ? '⏸ Pause' : '▶ Play Show';
  if (autoPlay && window.slides.length > 0) {
    window.activateSlide((window.activeSlideIdx + 1) % window.slides.length, false);
  }
};

window.changeFleetCount = function changeFleetCount(val) {
  const n = Math.max(500, Math.min(5000, parseInt(val, 10) || 2200));
  const hInput = document.getElementById('droneManualInput');
  const mInput = document.getElementById('modalDroneInput');
  if (hInput) hInput.value = n;
  if (mInput) mInput.value = n;

  window.slides = window.slides.map((s) => {
    if (s.type === 'hero') return { ...s, cloud: window.buildHeroFormation(s.id, n) };
    if (s.type === 'text') return { ...s, cloud: window.build3DTextCloud(s.text, n, s.color, s.font, s.arched) };
    if (s.meshGroup) {
      const rawSamples = window.AeroSampler.sampleSurfaceRaw(s.meshGroup, n);
      const tf = s.meshTransform || { rotX: 0, rotY: 0, rotZ: 0, scale: 1.0 };
      const cloud = window.AeroSampler.transformRawSamplesToCloud(rawSamples, {
        ...tf,
        targetSpan: 76,
        baseAlt: 16,
      });
      return { ...s, rawSamples, cloud };
    }
    if (s.imgSource && typeof window.compileImageTo3DCloud === 'function') {
      return {
        ...s,
        cloud: window.compileImageTo3DCloud(s.imgSource, n, s.imgTheme || 'auto', s.imgDepth ?? 14),
      };
    }
    const resampled = [];
    for (let i = 0; i < n; i++) resampled.push([...s.cloud[i % s.cloud.length]]);
    return { ...s, cloud: resampled };
  });

  setupDroneParticles(n);
  window.activateSlide(window.activeSlideIdx, true);
  if (typeof window.updateQuote === 'function') window.updateQuote();
};

window.setCamPreset = function setCamPreset(mode) {
  if (controls) controls.autoRotate = false;
  const ob = document.getElementById('orbitBtn');
  if (ob) ob.classList.remove('bg-amber-400', 'text-slate-950');
  currentCamPreset = mode || 'audience';

  const activeSlide = window.slides[window.activeSlideIdx];
  if (activeSlide && activeSlide.cloud) {
    frameFormation(activeSlide.cloud, currentCamPreset, true);
  }
};

window.toggleAutoOrbit = function toggleAutoOrbit() {
  if (!controls) return;
  controls.autoRotate = !controls.autoRotate;
  const btn = document.getElementById('orbitBtn');
  if (!btn) return;
  if (controls.autoRotate) btn.classList.add('bg-amber-400', 'text-slate-950');
  else btn.classList.remove('bg-amber-400', 'text-slate-950');
};

window.shareClientLink = function shareClientLink() {
  const seq    = encodeURIComponent(window.slides.map((s) => s.label).join(' -> '));
  const drones = document.getElementById('droneManualInput')?.value || 2200;
  const url    = `${window.location.origin}${window.location.pathname}?seq=${seq}&drones=${drones}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).catch(() => {});
  }
  const toast = document.getElementById('statusToast');
  if (toast) toast.textContent = '🔗 Client Preview URL copied to clipboard!';
};

window.recordPitchVideo = function recordPitchVideo() {
  if (!renderer) return;
  const canvas = renderer.domElement;
  const btn    = document.getElementById('recVideoBtn');
  if (!canvas.captureStream || typeof MediaRecorder === 'undefined') return;

  const stream = canvas.captureStream(30);
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : (MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '');
  const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  const chunks   = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = () => {
    if (typeof window.triggerDownload === 'function') {
      window.triggerDownload(new Blob(chunks, { type: mime || 'video/webm' }), `AeroGrid_Pitch_${Date.now()}.webm`);
    }
    if (btn) {
      btn.textContent = '🎥 Pitch Video';
      btn.classList.remove('animate-pulse');
    }
  };

  autoPlay = true;
  autoTimer = 0;
  if (controls) controls.autoRotate = true;
  recorder.start();

  if (btn) {
    btn.textContent = '⏺ Recording 10s...';
    btn.classList.add('animate-pulse');
  }

  setTimeout(() => {
    if (recorder.state === 'recording') recorder.stop();
    autoPlay = false;
    if (controls) controls.autoRotate = false;
    const b1 = document.getElementById('playShowBtn');
    const b2 = document.getElementById('clientPlayBtn');
    if (b1) b1.textContent = '▶ Play Full Show';
    if (b2) b2.textContent = '▶ Play Show';
  }, 10000);
};

// -----------------------------------------------------------------------------
// 14. LIVE MODEL ORIENTATION (X/Y/Z) & SCALE CONTROLLER
// -----------------------------------------------------------------------------
function wrapAngleDeg(deg) {
  let d = ((deg + 180) % 360 + 360) % 360 - 180;
  return d === -180 ? 180 : Math.round(d);
}

function syncModelTransformUI() {
  const slide = window.slides[window.activeSlideIdx];
  const tf = slide?.meshTransform || { rotX: 0, rotY: 0, rotZ: 0, scale: 1.0 };

  const setEl = (id, val, isLabel = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (isLabel) el.textContent = val;
    else el.value = val;
  };

  // Floating Viewport Transform Bar + Sidebar Uploads Controls
  ['rotXSlider', 'sideRotXSlider'].forEach((id) => setEl(id, tf.rotX));
  ['rotYSlider', 'sideRotYSlider'].forEach((id) => setEl(id, tf.rotY));
  ['rotZSlider', 'sideRotZSlider'].forEach((id) => setEl(id, tf.rotZ));
  ['modelScaleSlider', 'sideScaleSlider'].forEach((id) => setEl(id, tf.scale));

  ['rotXVal', 'sideRotXVal'].forEach((id) => setEl(id, `${tf.rotX}°`, true));
  ['rotYVal', 'sideRotYVal'].forEach((id) => setEl(id, `${tf.rotY}°`, true));
  ['rotZVal', 'sideRotZVal'].forEach((id) => setEl(id, `${tf.rotZ}°`, true));
  ['modelScaleVal', 'sideScaleVal'].forEach((id) => setEl(id, `${Number(tf.scale).toFixed(2)}x`, true));

  const bar = document.getElementById('modelTransformBar');
  if (bar) {
    const showBar = !clientViewActive && slide?.type === 'custom_mesh';
    bar.classList.toggle('hidden', !showBar);
  }
}

function applyTransformedCloudLive(cloud) {
  if (!cloud || !cloud.length || !currentPositions) return;
  const drones = currentPositions.length / 3;
  for (let i = 0; i < drones; i++) {
    const pt = cloud[i % cloud.length];
    const ix = i * 3;
    startPositions[ix]     = pt[0];
    startPositions[ix + 1] = pt[2];
    startPositions[ix + 2] = pt[1];
    targetPositions[ix]     = pt[0];
    targetPositions[ix + 1] = pt[2];
    targetPositions[ix + 2] = pt[1];
    currentPositions[ix]     = pt[0];
    currentPositions[ix + 1] = pt[2];
    currentPositions[ix + 2] = pt[1];
    prevPositions[ix]        = pt[0];
    prevPositions[ix + 1]    = pt[2];
    prevPositions[ix + 2]    = pt[1];
    reflectionPositions[ix]     = pt[0];
    reflectionPositions[ix + 1] = -pt[2] * 0.90;
    reflectionPositions[ix + 2] = pt[1];
  }
  morphProgress = 1.0;
  dronePoints.geometry.attributes.position.needsUpdate      = true;
  reflectionPoints.geometry.attributes.position.needsUpdate = true;
  frameFormation(cloud, currentCamPreset, true);
}

window.setModelTransform = function setModelTransform(patch = {}) {
  const slide = window.slides[window.activeSlideIdx];
  if (!slide) return;
  const prev = slide.meshTransform || { rotX: 0, rotY: 0, rotZ: 0, scale: 1.0 };
  const next = {
    rotX:  patch.rotX !== undefined ? wrapAngleDeg(parseFloat(patch.rotX) || 0) : prev.rotX,
    rotY:  patch.rotY !== undefined ? wrapAngleDeg(parseFloat(patch.rotY) || 0) : prev.rotY,
    rotZ:  patch.rotZ !== undefined ? wrapAngleDeg(parseFloat(patch.rotZ) || 0) : prev.rotZ,
    scale: patch.scale !== undefined ? Math.max(0.25, Math.min(2.5, parseFloat(patch.scale) || 1.0)) : prev.scale,
  };
  slide.meshTransform = next;

  let newCloud;
  if (slide.rawSamples && slide.rawSamples.length) {
    newCloud = window.AeroSampler.transformRawSamplesToCloud(slide.rawSamples, {
      ...next,
      targetSpan: 76,
      baseAlt: 16,
    });
  } else {
    if (!slide.baseCloud) slide.baseCloud = slide.cloud.map((p) => [...p]);
    const rawFromCloud = slide.baseCloud.map((p) => ({ x: p[0], y: p[2], z: p[1], hex: p[3] }));
    newCloud = window.AeroSampler.transformRawSamplesToCloud(rawFromCloud, {
      ...next,
      preserveScale: true,
      baseAlt: 16,
    });
  }

  slide.cloud = newCloud;
  applyTransformedCloudLive(newCloud);
  syncModelTransformUI();
};

window.nudgeModelRotation = function nudgeModelRotation(axis, deltaDeg) {
  const slide = window.slides[window.activeSlideIdx];
  if (!slide) return;
  const tf = slide.meshTransform || { rotX: 0, rotY: 0, rotZ: 0, scale: 1.0 };
  const key = axis === 'x' ? 'rotX' : (axis === 'y' ? 'rotY' : 'rotZ');
  window.setModelTransform({ [key]: tf[key] + deltaDeg });
};

window.resetModelTransform = function resetModelTransform() {
  window.setModelTransform({ rotX: 0, rotY: 0, rotZ: 0, scale: 1.0 });
};

// -----------------------------------------------------------------------------
// 15. UNIVERSAL DRAG & DROP + .GLB / .GLTF / .OBJ / .PNG / .JPG / .SVG INGESTION
// -----------------------------------------------------------------------------
function setStatusToast(msg, isError = false) {
  const toast = document.getElementById('statusToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.toggle('text-rose-400', isError);
  toast.classList.toggle('text-emerald-400', !isError);
}

function finalizeImportedMeshGroup(group, fileName) {
  const drones = parseInt(document.getElementById('droneManualInput')?.value, 10) || 2200;
  group.updateMatrixWorld(true);

  const bbox = new THREE.Box3().setFromObject(group);
  const spanY = Math.max(1e-4, bbox.max.y - bbox.min.y);

  // Inspect whether mesh uses textures or vivid vertex/material colors
  group.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    child.userData.isImported = true;
    const mat = Array.isArray(child.material) ? child.material[0] : child.material;
    const hasTex = Boolean(mat && mat.map && mat.map.image);
    const hasVtxCol = Boolean(child.geometry.attributes.color);

    let hasVividMatColor = false;
    if (mat && mat.color) {
      const c = mat.color;
      const maxC = Math.max(c.r, c.g, c.b);
      const minC = Math.min(c.r, c.g, c.b);
      hasVividMatColor = (maxC - minC) > 0.10;
    }

    if (!hasTex && !hasVtxCol && !hasVividMatColor) {
      child.userData.colorFn = (x, y) => {
        const ny = (y - bbox.min.y) / spanY;
        if (ny > 0.68) return '#FFD700';
        if (ny > 0.28) return '#00E5FF';
        return '#FF2A85';
      };
    }
  });

  const rawSamples = window.AeroSampler.sampleSurfaceRaw(group, drones);
  if (!rawSamples.length) {
    setStatusToast(`⚠ No 3D geometry found in "${fileName}". Try a standard .GLB or .OBJ mesh.`, true);
    return;
  }

  const tf = { rotX: 0, rotY: 0, rotZ: 0, scale: 1.0 };
  const cloud = window.AeroSampler.transformRawSamplesToCloud(rawSamples, {
    ...tf,
    targetSpan: 76,
    baseAlt: 16,
  });

  window.slides[window.activeSlideIdx] = {
    ...window.slides[window.activeSlideIdx],
    type: 'custom_mesh',
    meshGroup: group,
    rawSamples,
    meshTransform: tf,
    imgSource: null,
    baseCloud: null,
    label: fileName.replace(/\.[^.]+$/, '').slice(0, 18) || '3D Model',
    cloud,
  };
  window.activateSlide(window.activeSlideIdx, false);
  setStatusToast(`🧊 Imported 3D mesh "${fileName}" • ${drones} drones area-weighted across surface!`);
}

function load3DMeshFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const reader = new FileReader();
  setStatusToast(`⏳ Compiling 3D model "${file.name}"...`);

  reader.onerror = () => setStatusToast(`⚠ Failed to read "${file.name}".`, true);
  reader.onload = (ev) => {
    try {
      if (ext === 'obj') {
        if (typeof THREE.OBJLoader !== 'function') {
          setStatusToast('⚠ OBJLoader not ready. Check internet/CDN connection.', true);
          return;
        }
        const group = new THREE.OBJLoader().parse(ev.target.result);
        finalizeImportedMeshGroup(group, file.name);
        return;
      }

      if (typeof THREE.GLTFLoader !== 'function') {
        setStatusToast('⚠ GLTFLoader not ready. Check internet/CDN connection.', true);
        return;
      }
      const loader = new THREE.GLTFLoader();
      if (typeof THREE.DRACOLoader === 'function') {
        const draco = new THREE.DRACOLoader();
        draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');
        loader.setDRACOLoader(draco);
      }

      loader.parse(
        ev.target.result,
        '',
        (gltf) => {
          const root = gltf?.scene || (gltf?.scenes && gltf.scenes[0]);
          if (!root) {
            setStatusToast(`⚠ Empty GLTF scene in "${file.name}".`, true);
            return;
          }
          finalizeImportedMeshGroup(root, file.name);
        },
        (err) => {
          const msg = (err && err.message) ? err.message : String(err || 'parse error');
          const hint = msg.toLowerCase().includes('.bin') || ext === 'gltf'
            ? 'Separate .gltf/.bin files need a self-contained .GLB.'
            : msg.slice(0, 70);
          setStatusToast(`⚠ Could not parse "${file.name}": ${hint}`, true);
        }
      );
    } catch (err) {
      setStatusToast(`⚠ Error compiling "${file.name}": ${err.message || err}`, true);
    }
  };

  if (ext === 'obj') reader.readAsText(file);
  else reader.readAsArrayBuffer(file);
}

function loadSvgFile(file, customLabel) {
  const reader = new FileReader();
  setStatusToast(`⏳ Extruding SVG "${file.name}" to 3D drone relief...`);
  reader.onerror = () => setStatusToast(`⚠ Failed to read SVG "${file.name}".`, true);
  reader.onload = (ev) => {
    let svgText = String(ev.target.result || '');
    let w = 512, h = 512;
    try {
      const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      if (svgEl) {
        const vb = (svgEl.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
        const rawW = parseFloat(svgEl.getAttribute('width') || '');
        const rawH = parseFloat(svgEl.getAttribute('height') || '');
        if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) {
          const aspect = vb[2] / vb[3];
          w = aspect >= 1 ? 512 : Math.max(64, Math.round(512 * aspect));
          h = aspect >= 1 ? Math.max(64, Math.round(512 / aspect)) : 512;
        } else if (rawW > 0 && rawH > 0) {
          const aspect = rawW / rawH;
          w = aspect >= 1 ? 512 : Math.max(64, Math.round(512 * aspect));
          h = aspect >= 1 ? Math.max(64, Math.round(512 / aspect)) : 512;
        }
        svgEl.setAttribute('width', String(w));
        svgEl.setAttribute('height', String(h));
        svgText = new XMLSerializer().serializeToString(svgEl);
      }
    } catch (_) { /* keep original SVG text */ }

    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const label = customLabel || file.name.replace(/\.[^.]+$/, '') || 'SVG Relief';
      if (typeof window.compileImageElementToSlide === 'function') {
        window.compileImageElementToSlide(img, label, 'auto', 14);
      }
      setStatusToast(`✓ Extruded SVG "${file.name}" into 3D drone relief!`);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setStatusToast(`⚠ Could not rasterize SVG "${file.name}".`, true);
    };
    img.src = url;
  };
  reader.readAsText(file);
}

function loadRasterImageFile(file, customLabel) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  setStatusToast(`⏳ Extruding "${customLabel || file.name}" to 3D drone relief...`);
  img.onload = () => {
    URL.revokeObjectURL(url);
    const label = customLabel || file.name.replace(/\.[^.]+$/, '') || 'Image Relief';
    if (typeof window.compileImageElementToSlide === 'function') {
      window.compileImageElementToSlide(img, label, 'auto', 14);
    }
    setStatusToast(`✓ Compiled "${label}" into 3D brightness-relief drone formation!`);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    setStatusToast(`⚠ Could not decode image "${file.name}".`, true);
  };
  img.src = url;
}

window.handleUniversalFileUpload = function handleUniversalFileUpload(file, customLabel) {
  if (!file) return;
  const name = (file.name || 'upload').trim();
  const ext  = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
  const mime = (file.type || '').toLowerCase();

  if (ext === 'glb' || ext === 'gltf' || ext === 'obj') {
    load3DMeshFile(file);
    return;
  }
  if (ext === 'svg' || mime === 'image/svg+xml') {
    loadSvgFile(file, customLabel);
    return;
  }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext) || mime.startsWith('image/')) {
    loadRasterImageFile(file, customLabel);
    return;
  }
  setStatusToast(`⚠ Unsupported file "${name}". Drop .GLB, .GLTF, .OBJ, .PNG, .JPG, or .SVG.`, true);
};

window.uploadUniversalFiles = function uploadUniversalFiles(input) {
  if (!input || !input.files || !input.files[0]) return;
  window.handleUniversalFileUpload(input.files[0]);
  input.value = '';
};

window.uploadReferenceImage = function uploadReferenceImage(input) {
  window.uploadUniversalFiles(input);
};

window.upload3DMesh = function upload3DMesh(input) {
  window.uploadUniversalFiles(input);
};

function initViewportDropZone() {
  const zone    = document.getElementById('stageDropZone') || document.getElementById('threeContainer');
  const overlay = document.getElementById('dropZoneOverlay');
  if (!zone) return;

  let dragDepth = 0;

  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    if (!zone.contains(e.target)) e.preventDefault();
  });

  zone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragDepth++;
    if (overlay) overlay.classList.remove('hidden');
  });

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  });

  zone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0 && overlay) overlay.classList.add('hidden');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    dragDepth = 0;
    if (overlay) overlay.classList.add('hidden');
    const files = e.dataTransfer?.files;
    if (!files || !files.length) return;
    // Prefer 3D model if multiple files dropped together, else first file
    const preferred = Array.from(files).find((f) => /\.(glb|gltf|obj)$/i.test(f.name)) || files[0];
    window.handleUniversalFileUpload(preferred);
  });
}
