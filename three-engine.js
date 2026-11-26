// =============================================================================
// three-engine.js — AeroGrid Studio v6.0
// Pure-JS Triangle-Area-Weighted 3D Mesh Surface & Volume Sampler,
// Three.js WebGL Stage, HDR UnrealBloomPass, Riverfront Mirror Lake + Skyline,
// Bounding-Sphere Auto-Framing Camera, Live Hero Animations & Studio Controls.
// =============================================================================

'use strict';

// -----------------------------------------------------------------------------
// 1. PURE-JS MATHEMATICAL TRIANGLE-AREA-WEIGHTED 3D MESH SURFACE & VOLUME SAMPLER
// -----------------------------------------------------------------------------
// Works on any THREE.BufferGeometry, THREE.Mesh, or THREE.Group without relying
// on external CDN MeshSurfaceSampler scripts. Uses cumulative triangle-area CDF
// with quasi-random golden-ratio stratification + Roberts R2 barycentric coords
// so N drones (500–5,000) distribute evenly across all 3D faces with interpolated
// per-vertex RGB colors (or material / procedural surface colors).
// -----------------------------------------------------------------------------
(function initAeroSampler() {
  const PHI = 0.6180339887498949;
  const R2_A = 0.7548776662466927;
  const R2_B = 0.5698402909980532;

  function toHexFromRgb(r, g, b) {
    const cr = Math.max(0, Math.min(255, Math.round(r * 255)));
    const cg = Math.max(0, Math.min(255, Math.round(g * 255)));
    const cb = Math.max(0, Math.min(255, Math.round(b * 255)));
    return '#' + ((1 << 24) + (cr << 16) + (cg << 8) + cb).toString(16).slice(1).toUpperCase();
  }

  /**
   * Attaches a Float32BufferAttribute 'color' (per-vertex RGB) to any BufferGeometry
   * using a callback (x, y, z, nx, ny, nz) -> THREE.Color | hex | [r,g,b] | string.
   */
  function applyVertexColors(geometry, colorSource) {
    const pos = geometry.attributes.position;
    if (!pos) return geometry;
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    const norm = geometry.attributes.normal;
    const colors = new Float32Array(pos.count * 3);
    const tmpCol = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
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
   * Collects world-transformed triangles with exact area & per-vertex colors
   * from any BufferGeometry, Mesh, or Group hierarchy.
   */
  function collectTriangles(rootOrGeo) {
    const triangles = [];
    const va = new THREE.Vector3();
    const vb = new THREE.Vector3();
    const vc = new THREE.Vector3();
    const ab = new THREE.Vector3();
    const ac = new THREE.Vector3();
    const cross = new THREE.Vector3();
    const normalMat = new THREE.Matrix3();
    const tmpColor = new THREE.Color();

    function extractFromMesh(geo, worldMat, fallbackColor, weightMultiplier, skipBottom, colorFn) {
      if (!geo || !geo.attributes || !geo.attributes.position) return;
      const pos = geo.attributes.position;
      const colAttr = geo.attributes.color || null;
      const index = geo.index;
      const triCount = index ? Math.floor(index.count / 3) : Math.floor(pos.count / 3);
      if (triCount <= 0) return;

      normalMat.getNormalMatrix(worldMat);

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
        if (dblArea <= 1e-7) continue;

        const area = 0.5 * dblArea;
        const nx = cross.x / dblArea;
        const ny = cross.y / dblArea;
        const nz = cross.z / dblArea;

        if (skipBottom && ny < -0.82) continue;

        let c0, c1, c2;
        if (colAttr) {
          c0 = [colAttr.getX(i0), colAttr.getY(i0), colAttr.getZ(i0)];
          c1 = [colAttr.getX(i1), colAttr.getY(i1), colAttr.getZ(i1)];
          c2 = [colAttr.getX(i2), colAttr.getY(i2), colAttr.getZ(i2)];
        } else {
          tmpColor.set(fallbackColor || '#FFFFFF');
          const rgb = [tmpColor.r, tmpColor.g, tmpColor.b];
          c0 = rgb; c1 = rgb; c2 = rgb;
        }

        triangles.push({
          ax: va.x, ay: va.y, az: va.z,
          bx: vb.x, by: vb.y, bz: vb.z,
          cx: vc.x, cy: vc.y, cz: vc.z,
          nx, ny, nz,
          c0, c1, c2,
          colorFn: colorFn || null,
          weight: area * (weightMultiplier > 0 ? weightMultiplier : 1.0),
          area,
        });
      }
    }

    if (rootOrGeo && rootOrGeo.isBufferGeometry) {
      extractFromMesh(rootOrGeo, new THREE.Matrix4(), '#00E5FF', 1.0, false, null);
      return triangles;
    }

    if (rootOrGeo && typeof rootOrGeo.updateMatrixWorld === 'function') {
      rootOrGeo.updateMatrixWorld(true);
      rootOrGeo.traverse((child) => {
        if (!child.isMesh || !child.geometry || child.visible === false) return;
        const ud = child.userData || {};
        const matColor = ud.partColor
          || (child.material && child.material.color ? child.material.color : '#FFFFFF');
        const weightMult = typeof ud.surfaceWeight === 'number' ? ud.surfaceWeight : 1.0;
        const skipBottom = Boolean(ud.skipBottom);
        const colorFn = typeof ud.colorFn === 'function' ? ud.colorFn : null;
        extractFromMesh(child.geometry, child.matrixWorld, matColor, weightMult, skipBottom, colorFn);
      });
    }
    return triangles;
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
    const s = Math.sqrt(r1);
    const w0 = 1.0 - s;
    const w1 = s * (1.0 - r2);
    const w2 = s * r2;

    const x = w0 * tri.ax + w1 * tri.bx + w2 * tri.cx;
    const y = w0 * tri.ay + w1 * tri.by + w2 * tri.cy;
    const z = w0 * tri.az + w1 * tri.bz + w2 * tri.cz;

    let r = w0 * tri.c0[0] + w1 * tri.c1[0] + w2 * tri.c2[0];
    let g = w0 * tri.c0[1] + w1 * tri.c1[1] + w2 * tri.c2[1];
    let b = w0 * tri.c0[2] + w1 * tri.c1[2] + w2 * tri.c2[2];

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
   * Optional `options.interiorRatio` (0..0.5) adds volumetric interior fill
   * displaced inward along surface normals or toward centroid.
   */
  function sampleSurfaceRaw(rootOrGeo, count, options = {}) {
    const triangles = collectTriangles(rootOrGeo);
    if (!triangles.length || count <= 0) return [];

    const cdf = new Float64Array(triangles.length);
    let totalWeight = 0;
    for (let i = 0; i < triangles.length; i++) {
      totalWeight += triangles[i].weight;
      cdf[i] = totalWeight;
    }
    if (totalWeight <= 0) return [];

    // Compute centroid for optional inward volume fill
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
      // Golden-ratio quasi-random stratification across the area CDF ensures
      // both exact triangle-area proportionality AND uniform distribution for any slice!
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
   * Samples `count` points across a THREE.Object3D / THREE.BufferGeometry,
   * scales & places the 3D cloud into AeroGrid flight-space coordinates
   * [x_m, y_depth_m, z_alt_m, led_hex].
   */
  function sampleMeshToDroneCloud(rootOrGeo, count, options = {}) {
    const n = Math.max(1, Math.round(count || 2200));
    const rawPts = sampleSurfaceRaw(rootOrGeo, n, options);
    if (!rawPts.length) return [];

    const targetSpan = options.targetSpan || 76.0;
    const baseAlt    = typeof options.baseAlt === 'number' ? options.baseAlt : 18.0;
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

    const spanX = maxX - minX;
    const spanY = maxY - minY;
    const spanZ = maxZ - minZ;
    const maxDim = Math.max(1e-4, spanX, spanY, spanZ);
    const scale = options.preserveScale ? 1.0 : (targetSpan / maxDim);

    const midX = (minX + maxX) * 0.5;
    const midY = (minY + maxY) * 0.5;
    const midZ = (minZ + maxZ) * 0.5;

    const cloud = new Array(rawPts.length);
    for (let i = 0; i < rawPts.length; i++) {
      const p = rawPts[i];
      const wx = (p.x - midX) * scale;
      const wz = (p.z - midZ) * scale;
      const wy = centerAlt !== null
        ? (p.y - midY) * scale + centerAlt
        : (p.y - minY) * scale + baseAlt;

      // AeroGrid waypoint tuple: [x_m, y_depth_m, z_alt_m, led_hex]
      cloud[i] = [+wx.toFixed(2), +wz.toFixed(2), +wy.toFixed(2), p.hex];
    }
    return cloud;
  }

  window.AeroSampler = {
    applyVertexColors,
    collectTriangles,
    sampleSurfaceRaw,
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

  // HDR UnrealBloom Post-Processing
  if (typeof THREE.EffectComposer === 'function' && typeof THREE.UnrealBloomPass === 'function') {
    const renderPass = new THREE.RenderPass(scene, camera);
    bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(initW, initH),
      0.90, 0.44, 0.15
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

  // Populate Hero Vault Grid
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

  // Initialize studios & default fleet
  if (typeof window.initSkyDrawPad === 'function') window.initSkyDrawPad();
  if (typeof window.generateBlueprintPreview === 'function') window.generateBlueprintPreview(false);

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
      { type: 'hero', id: 'taj',     label: 'Taj Mahal',       dur: 15, trans: 'spiral', cloud: window.buildHeroFormation('taj', initDrones) },
      { type: 'hero', id: 'trishul', label: 'Shiva Trishul',   dur: 15, trans: 'burst',  cloud: window.buildHeroFormation('trishul', initDrones) },
      { type: 'hero', id: 'rings',   label: 'Wedding Rings',   dur: 15, trans: 'wave',   cloud: window.buildHeroFormation('rings', initDrones) },
      { type: 'text', text: 'INDIA 2026', color: 'tricolour', font: '900 Arial, sans-serif', arched: true, label: '"INDIA 2026"', dur: 20, trans: 'spiral', cloud: window.build3DTextCloud('INDIA 2026', initDrones, 'tricolour', '900 Arial, sans-serif', true) },
    ];
    window.activateSlide(0, true);
  }

  window.addEventListener('resize', window.handleResize);
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => window.handleResize());
    resizeObserver.observe(container);
  }
  animateThree();
};

// -----------------------------------------------------------------------------
// 5. RESPONSIVE RESIZE HANDLER
// -----------------------------------------------------------------------------
window.handleResize = function handleResize() {
  const container = document.getElementById('threeContainer');
  if (!container || !camera || !renderer) return;
  const w = Math.max(1, container.clientWidth);
  const h = Math.max(1, container.clientHeight);
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
// 6. BOUNDING-SPHERE AUTO-FRAMING CAMERA
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

  // 24% bounding-sphere safety margin guarantees zero clipping on any aspect ratio
  const safety = 1.24;
  const distV  = (bounds.radius * safety) / Math.tan(vFov * 0.5);
  const distH  = (bounds.radius * safety) / Math.tan(hFov * 0.5);
  const dist   = Math.max(distV, distH, 54);

  const dir = getCamPresetDirection(mode || currentCamPreset);
  camTargetLookAt.set(bounds.cx, bounds.cy, bounds.cz);
  camTargetPos.copy(camTargetLookAt).addScaledVector(dir, dist);
  controls.maxDistance = Math.max(360, dist * 2.5);

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
// 8. DRONE PARTICLE SYSTEM SETUP
// -----------------------------------------------------------------------------
function setupDroneParticles(count) {
  if (dronePoints)      scene.remove(dronePoints);
  if (reflectionPoints) scene.remove(reflectionPoints);
  if (trailLines)       scene.remove(trailLines);

  const spriteTex  = createGlowSprite();
  const spriteSize = userDroneSize !== null
    ? userDroneSize
    : (count >= 3500 ? 2.5 : (count >= 1600 ? 3.1 : 3.6));

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
    opacity: 0.44,
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
    opacity: 0.28,
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

  if (elFleet)   elFleet.textContent   = `${drones} UAVs`;
  if (elMaxVel)  elMaxVel.textContent  = `${maxVel} m/s`;
  if (elSpacing) elSpacing.textContent = `${spacing}m [DGCA SAFE]`;
  if (elToast)   elToast.textContent   = `✓ Slide 0${window.activeSlideIdx + 1}: ${slide?.label || 'Formation'} • ${drones} UAVs`;
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
  if (transEl) transEl.value = currentTransition;
  if (nameEl)  nameEl.textContent = `0${idx + 1}. ${slide.label}`;
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

    // Hero animation parameters
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
        // Exhaust plume sits below nozzle exit threshold Y = 31.5m
        if (ty < 31.5) {
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
      } else if (heroId === 'rings' && ty > 74) {
        // Solitaire diamond fire & facet scintillation
        const sparkle = 0.82 + 0.45 * Math.pow(Math.max(0, Math.sin(t * 4.8 + i * 1.37)), 4);
        droneColors[ix] = Math.min(1, baseDroneColors[ix] * sparkle);
        droneColors[iy] = Math.min(1, baseDroneColors[iy] * sparkle);
        droneColors[iz] = Math.min(1, baseDroneColors[iz] * sparkle);
        colorsDirty = true;
      }

      const hx = Math.sin(t + i * 0.37) * 0.10;
      const hy = Math.cos(t * 1.1 + i * 0.53) * 0.10;
      const finalX = bx + hx;
      const finalY = by + hy;
      const finalZ = bz;

      currentPositions[ix] = finalX;
      currentPositions[iy] = finalY;
      currentPositions[iz] = finalZ;

      // Mirror water reflection with wave shimmer
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

  // Animated water ripple rings
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
  setTimeout(window.handleResize, 30);
};

window.loadHeroToSlide = function loadHeroToSlide(id, name) {
  const drones = parseInt(document.getElementById('droneManualInput')?.value, 10) || 2200;
  window.slides[window.activeSlideIdx] = {
    ...window.slides[window.activeSlideIdx],
    type: 'hero',
    id,
    label: name,
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

    const heroMatch = (window.HERO_VAULT || []).find(
      (h) => low.includes(h.id) || low.includes(h.name.toLowerCase())
    );
    if (heroMatch) {
      return {
        type: 'hero',
        id: heroMatch.id,
        label: heroMatch.name,
        dur: 15,
        trans: transCycle[i % 3],
        cloud: window.buildHeroFormation(heroMatch.id, drones),
      };
    }

    const bpInput = document.getElementById('bpPromptInput');
    if (bpInput) bpInput.value = clean;
    if (typeof window.generateBlueprintPreview === 'function') window.generateBlueprintPreview(false);
    const cloud = window.compileImageTo3DCloud(
      document.getElementById('blueprintCanvas'),
      drones,
      low.includes('india') ? 'tricolour' : 'gold_cyan',
      14
    );
    return {
      type: 'blueprint',
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
          <span class="text-sky-400 font-bold">SLIDE 0${idx + 1}</span>
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
    if (s.meshGroup) return { ...s, cloud: window.AeroSampler.sampleMeshToDroneCloud(s.meshGroup, n) };
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

  const stream   = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks   = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = () => {
    if (typeof window.triggerDownload === 'function') {
      window.triggerDownload(new Blob(chunks, { type: 'video/webm' }), `AeroGrid_Pitch_${Date.now()}.webm`);
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
// 14. IMAGE & 3D MESH (.GLB / .OBJ) UPLOAD PIPELINES
// -----------------------------------------------------------------------------
window.uploadReferenceImage = function uploadReferenceImage(input) {
  if (!input.files || !input.files[0]) return;
  const file   = input.files[0];
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const c   = document.getElementById('blueprintCanvas');
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, c.width, c.height);
      const fit = Math.min((c.width - 16) / img.width, (c.height - 16) / img.height);
      const dw  = img.width * fit;
      const dh  = img.height * fit;
      ctx.drawImage(img, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
      window.switchSidebarTab('blueprint');
      const bpInput = document.getElementById('bpPromptInput');
      if (bpInput) bpInput.value = file.name.replace(/\.[^.]+$/, '').slice(0, 22);
      if (typeof window.approveBlueprintToDrones === 'function') window.approveBlueprintToDrones();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

window.upload3DMesh = function upload3DMesh(input) {
  if (!input.files || !input.files[0]) return;
  const file   = input.files[0];
  const ext    = file.name.split('.').pop().toLowerCase();
  const drones = parseInt(document.getElementById('droneManualInput')?.value, 10) || 2200;
  const reader = new FileReader();

  const applyImportedGroup = (group) => {
    group.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(group);
    const spanY = Math.max(1e-4, bbox.max.y - bbox.min.y);
    // Apply altitude-based cyber-gold palette if mesh has no vertex colors
    group.traverse((child) => {
      if (child.isMesh && child.geometry && !child.geometry.attributes.color) {
        child.userData.colorFn = (x, y) => {
          const ny = (y - bbox.min.y) / spanY;
          if (ny > 0.68) return '#FFD700';
          if (ny > 0.28) return '#00E5FF';
          return '#FF2A85';
        };
      }
    });
    const cloud = window.AeroSampler.sampleMeshToDroneCloud(group, drones, {
      targetSpan: 76,
      baseAlt: 20,
    });
    if (!cloud.length) return;
    window.slides[window.activeSlideIdx] = {
      ...window.slides[window.activeSlideIdx],
      type: 'custom_mesh',
      meshGroup: group,
      label: file.name.slice(0, 18),
      cloud,
    };
    window.activateSlide(window.activeSlideIdx, false);
  };

  reader.onload = (ev) => {
    if (ext === 'obj' && typeof THREE.OBJLoader === 'function') {
      applyImportedGroup(new THREE.OBJLoader().parse(ev.target.result));
    } else if (typeof THREE.GLTFLoader === 'function') {
      new THREE.GLTFLoader().parse(ev.target.result, '', (gltf) => {
        applyImportedGroup(gltf.scene);
      });
    }
  };
  if (ext === 'obj') reader.readAsText(file);
  else reader.readAsArrayBuffer(file);
};
