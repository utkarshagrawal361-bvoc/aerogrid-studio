// =============================================================================
// formations.js — AeroGrid Studio v7.0
// 6 Flagship 3D Parametric Hero Sculptures (via AeroSampler),
// Puter.js AI Blueprint Generator + Offline Silhouette Fallback Library,
// Brightness-Relief + Distance-Field 3D Extrusion Compiler, 3D Typography,
// Symmetry Sky Draw, and Global Ctrl+V Clipboard Paste Compiler.
// =============================================================================

'use strict';

// -----------------------------------------------------------------------------
// 1. SHARED STUDIO STATE & HERO VAULT REGISTRY (6 FLAGSHIP PRESETS)
// -----------------------------------------------------------------------------
window.slides         = [];
window.activeSlideIdx = 0;

window.HERO_VAULT = [
  { id: 'rings',  name: 'Solitaire Rings',      tag: 'SOLITAIRE',  icon: '💍' },
  { id: 'heart',  name: 'Beating 3D Heart',     tag: 'VOLUMETRIC', icon: '❤️' },
  { id: 'globe',  name: 'Rotating Earth Globe', tag: 'PLANETARY',  icon: '🌍' },
  { id: 'rocket', name: 'ISRO Rocket',          tag: 'AEROSPACE',  icon: '🚀' },
  { id: 'lotus',  name: '3D Lotus',             tag: '3D PETALS',  icon: '🪷' },
  { id: 'crown',  name: '3D Crown',             tag: 'IMPERIAL',   icon: '👑' },
];

// -----------------------------------------------------------------------------
// 2. THREE.JS COMPOSITE 3D HERO SCULPTURE BUILDERS
// -----------------------------------------------------------------------------
function makeMeshPart(geometry, colorSource, options = {}) {
  if (colorSource !== undefined) {
    window.AeroSampler.applyVertexColors(geometry, colorSource);
  }
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const mesh = new THREE.Mesh(geometry, mat);
  if (typeof options.surfaceWeight === 'number') mesh.userData.surfaceWeight = options.surfaceWeight;
  if (options.skipBottom) mesh.userData.skipBottom = true;
  if (typeof options.colorFn === 'function') mesh.userData.colorFn = options.colorFn;
  if (options.pos) mesh.position.set(options.pos[0], options.pos[1], options.pos[2]);
  if (options.rot) mesh.rotation.set(options.rot[0], options.rot[1], options.rot[2]);
  if (options.scale) mesh.scale.set(options.scale[0], options.scale[1], options.scale[2]);
  return mesh;
}

// -----------------------------------------------------------------------------
// 2A. TAJ MAHAL — Multi-tiered plinth, octagonal chamber, Lathe onion dome,
//     arched alcoves, 4 corner chhatris, 4 tapered minarets with balcony rings
// -----------------------------------------------------------------------------
function buildTajMahalGroup() {
  const group = new THREE.Group();
  const marbleColor = (x, y) => (y > 0 ? '#FFFFFF' : '#E2E8F0');

  // Tier 1: Wide riverfront terrace plinth
  group.add(makeMeshPart(
    new THREE.BoxGeometry(78, 3.8, 78, 4, 1, 4),
    (x, y, z) => (Math.abs(x) > 37 || Math.abs(z) > 37 ? '#FDE68A' : '#CBD5E1'),
    { pos: [0, 1.9, 0], surfaceWeight: 0.34, skipBottom: true }
  ));

  // Tier 2: Upper white marble podium
  group.add(makeMeshPart(
    new THREE.BoxGeometry(58, 6.2, 58, 4, 1, 4),
    (x, y, z) => (y > 2.4 && (Math.abs(x) > 27 || Math.abs(z) > 27) ? '#FFD700' : '#F8FAFC'),
    { pos: [0, 6.9, 0], surfaceWeight: 0.44, skipBottom: true }
  ));

  // Ceremonial front approach apron (+Z)
  group.add(makeMeshPart(
    new THREE.BoxGeometry(16, 4.0, 8),
    '#E2E8F0',
    { pos: [0, 4.0, 32], surfaceWeight: 0.35, skipBottom: true }
  ));

  // Central Baghdadi octagonal chamber (wide cardinal facades, chamfered corners)
  const w = 18.5;
  const c = 11.8;
  const octShape = new THREE.Shape();
  octShape.moveTo(-c, -w); octShape.lineTo(c, -w);
  octShape.lineTo(w, -c);  octShape.lineTo(w, c);
  octShape.lineTo(c, w);   octShape.lineTo(-c, w);
  octShape.lineTo(-w, c);  octShape.lineTo(-w, -c);
  octShape.closePath();

  const chamberGeo = new THREE.ExtrudeGeometry(octShape, {
    depth: 22.0,
    bevelEnabled: false,
    curveSegments: 4,
  });
  chamberGeo.rotateX(-Math.PI / 2);
  group.add(makeMeshPart(
    chamberGeo,
    (x, y) => (y > 20.5 ? '#FEF3C7' : '#FFFFFF'),
    { pos: [0, 10.0, 0], surfaceWeight: 0.85, skipBottom: true }
  ));

  // 4 Grand Pishtaq portals + pointed Mughal arch alcoves + flanking double niches
  for (let side = 0; side < 4; side++) {
    const facade = new THREE.Group();
    facade.rotation.y = side * (Math.PI / 2);

    // Protruding Pishtaq frame
    facade.add(makeMeshPart(
      new THREE.BoxGeometry(14.5, 24.5, 2.2),
      (x, y) => (y > 10.5 || Math.abs(x) > 5.8 ? '#FFD700' : '#FFFFFF'),
      { pos: [0, 22.25, 19.0], surfaceWeight: 0.72, skipBottom: true }
    ));

    // Pointed central Mughal ogee arch rib
    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.8, 10.2, 20.2),
      new THREE.Vector3(-4.8, 20.0, 20.2),
      new THREE.Vector3(-2.8, 25.0, 20.2),
      new THREE.Vector3( 0.0, 27.8, 20.2),
      new THREE.Vector3( 2.8, 25.0, 20.2),
      new THREE.Vector3( 4.8, 20.0, 20.2),
      new THREE.Vector3( 4.8, 10.2, 20.2),
    ]);
    facade.add(makeMeshPart(
      new THREE.TubeGeometry(archCurve, 28, 0.55, 8, false),
      '#FFD700',
      { surfaceWeight: 2.0 }
    ));

    // Flanking lower & upper side alcove arches
    [-10.2, 10.2].forEach((ax) => {
      [14.0, 23.5].forEach((ay) => {
        const subCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(ax - 1.9, ay - 3.0, 19.0),
          new THREE.Vector3(ax - 1.9, ay + 1.2, 19.0),
          new THREE.Vector3(ax,       ay + 3.2, 19.0),
          new THREE.Vector3(ax + 1.9, ay + 1.2, 19.0),
          new THREE.Vector3(ax + 1.9, ay - 3.0, 19.0),
        ]);
        facade.add(makeMeshPart(
          new THREE.TubeGeometry(subCurve, 14, 0.35, 6, false),
          '#7DD3FC',
          { surfaceWeight: 1.5 }
        ));
      });
    });

    // Twin parapet guldasta finials on Pishtaq corners
    [-7.2, 7.2].forEach((gx) => {
      facade.add(makeMeshPart(
        new THREE.CylinderGeometry(0.32, 0.42, 4.5, 8),
        '#FFD700',
        { pos: [gx, 36.2, 19.2], surfaceWeight: 2.2 }
      ));
    });

    group.add(facade);
  }

  // Drum base under main onion dome
  group.add(makeMeshPart(
    new THREE.CylinderGeometry(10.6, 11.4, 7.2, 28),
    (x, y) => (y > 2.8 ? '#FEF3C7' : '#F8FAFC'),
    { pos: [0, 35.6, 0], surfaceWeight: 1.05, skipBottom: true }
  ));

  // Golden lotus collar ring at dome base
  group.add(makeMeshPart(
    new THREE.TorusGeometry(10.8, 0.52, 10, 36),
    '#FFD700',
    { pos: [0, 39.2, 0], rot: [Math.PI / 2, 0, 0], surfaceWeight: 1.6 }
  ));

  // True 3D LatheGeometry Onion Dome
  const domePts = [
    new THREE.Vector2(10.6, 0.0),
    new THREE.Vector2( 9.8, 1.8),  // authentic Mughal neck constriction
    new THREE.Vector2(11.6, 5.0),
    new THREE.Vector2(13.2, 8.8),  // bulbous onion belly
    new THREE.Vector2(12.8, 12.6),
    new THREE.Vector2(10.4, 16.5),
    new THREE.Vector2( 6.6, 20.0),
    new THREE.Vector2( 2.4, 22.4),
    new THREE.Vector2( 0.0, 24.0), // inverted lotus apex
  ];
  group.add(makeMeshPart(
    new THREE.LatheGeometry(domePts, 32),
    (x, y) => (y > 20.5 ? '#FDE68A' : marbleColor(x, y)),
    { pos: [0, 39.2, 0], surfaceWeight: 1.65 }
  ));

  // Golden Kalash Finial Spire + Orbs + Crescent
  group.add(makeMeshPart(
    new THREE.CylinderGeometry(0.18, 0.58, 10.2, 12),
    '#FFD700',
    { pos: [0, 68.2, 0], surfaceWeight: 3.4 }
  ));
  [64.4, 67.0, 69.4].forEach((ky, idx) => {
    group.add(makeMeshPart(
      new THREE.SphereGeometry(1.15 - idx * 0.25, 12, 10),
      '#FFD700',
      { pos: [0, ky, 0], surfaceWeight: 3.2 }
    ));
  });
  group.add(makeMeshPart(
    new THREE.TorusGeometry(1.3, 0.30, 8, 18, Math.PI * 1.25),
    '#FFFFFF',
    { pos: [0, 73.2, 0], rot: [0, 0, -Math.PI * 0.12], surfaceWeight: 3.5 }
  ));

  // 4 Corner Roof Chhatris (domed pavilions)
  const chhatriCoords = [[-11.8, -11.8], [11.8, -11.8], [-11.8, 11.8], [11.8, 11.8]];
  const miniDomePts = [
    new THREE.Vector2(3.1, 0.0),
    new THREE.Vector2(3.5, 1.8),
    new THREE.Vector2(2.6, 3.8),
    new THREE.Vector2(0.0, 5.2),
  ];
  chhatriCoords.forEach(([cx, cz]) => {
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2;
      group.add(makeMeshPart(
        new THREE.CylinderGeometry(0.24, 0.28, 5.0, 8),
        '#E2E8F0',
        { pos: [cx + Math.cos(a) * 2.5, 34.5, cz + Math.sin(a) * 2.5], surfaceWeight: 1.8 }
      ));
    }
    group.add(makeMeshPart(
      new THREE.CylinderGeometry(3.4, 3.6, 0.65, 8),
      '#FFD700',
      { pos: [cx, 37.2, cz], surfaceWeight: 1.8 }
    ));
    group.add(makeMeshPart(
      new THREE.LatheGeometry(miniDomePts, 16),
      '#FFFFFF',
      { pos: [cx, 37.5, cz], surfaceWeight: 2.1 }
    ));
    group.add(makeMeshPart(
      new THREE.CylinderGeometry(0.12, 0.28, 2.4, 8),
      '#FFD700',
      { pos: [cx, 43.8, cz], surfaceWeight: 2.8 }
    ));
  });

  // 4 Tapered Cylindrical Minarets with Balcony Rings
  const minaretCoords = [[-25.5, -25.5], [25.5, -25.5], [-25.5, 25.5], [25.5, 25.5]];
  const minaretDomePts = [
    new THREE.Vector2(1.85, 0.0),
    new THREE.Vector2(2.10, 1.3),
    new THREE.Vector2(1.40, 2.7),
    new THREE.Vector2(0.0, 3.7),
  ];
  minaretCoords.forEach(([mx, mz]) => {
    // Octagonal pedestal
    group.add(makeMeshPart(
      new THREE.CylinderGeometry(2.6, 3.0, 2.6, 8),
      '#CBD5E1',
      { pos: [mx, 11.3, mz], surfaceWeight: 1.1, skipBottom: true }
    ));
    // Tapered shaft
    group.add(makeMeshPart(
      new THREE.CylinderGeometry(1.35, 2.45, 34.0, 16),
      '#F8FAFC',
      { pos: [mx, 29.6, mz], surfaceWeight: 1.35, skipBottom: true }
    ));
    // 3 Balcony rings along shaft
    [23.0, 34.2, 45.8].forEach((by, rIdx) => {
      const rRad = 2.65 - rIdx * 0.35;
      group.add(makeMeshPart(
        new THREE.TorusGeometry(rRad, 0.42, 10, 22),
        '#FFD700',
        { pos: [mx, by, mz], rot: [Math.PI / 2, 0, 0], surfaceWeight: 2.2 }
      ));
    });
    // Top chhatri pillars + mini dome + finial
    for (let k = 0; k < 6; k++) {
      const ang = (k / 6) * Math.PI * 2;
      group.add(makeMeshPart(
        new THREE.CylinderGeometry(0.16, 0.18, 3.6, 6),
        '#E2E8F0',
        { pos: [mx + Math.cos(ang) * 1.25, 48.4, mz + Math.sin(ang) * 1.25], surfaceWeight: 1.8 }
      ));
    }
    group.add(makeMeshPart(
      new THREE.LatheGeometry(minaretDomePts, 14),
      '#FFFFFF',
      { pos: [mx, 50.2, mz], surfaceWeight: 2.1 }
    ));
    group.add(makeMeshPart(
      new THREE.CylinderGeometry(0.10, 0.22, 2.4, 8),
      '#FFD700',
      { pos: [mx, 54.9, mz], surfaceWeight: 2.8 }
    ));
  });

  return group;
}

// -----------------------------------------------------------------------------
// 2B. SHIVA TRISHUL — Diamond-section central blade, curved TubeGeometry outer
//     prongs, crescent base guard, tilted 3D hourglass Damru, vertical staff
// -----------------------------------------------------------------------------
function createDiamondBladeGeometry(height, maxHalfW, maxHalfD) {
  const stations = [
    { t: 0.00, w: 0.26, d: 0.36 },
    { t: 0.08, w: 0.62, d: 0.68 },
    { t: 0.24, w: 1.00, d: 1.00 },
    { t: 0.48, w: 0.84, d: 0.82 },
    { t: 0.74, w: 0.48, d: 0.46 },
    { t: 0.92, w: 0.16, d: 0.16 },
    { t: 1.00, w: 0.00, d: 0.00 },
  ];
  const positions = [];
  const colors = [];
  const indices = [];
  const cEdge = new THREE.Color('#00F0FF');
  const cRidge = new THREE.Color('#FFFFFF');

  stations.forEach((st) => {
    const y = st.t * height;
    const hw = st.w * maxHalfW;
    const hd = st.d * maxHalfD;
    // 4 diamond vertices: +X edge, +Z ridge, -X edge, -Z ridge
    positions.push(
       hw, y,  0,
        0, y,  hd,
      -hw, y,  0,
        0, y, -hd
    );
    const tipMix = Math.min(1, st.t * 1.2);
    const edgeC = cEdge.clone().lerp(cRidge, tipMix * 0.45);
    colors.push(
      edgeC.r, edgeC.g, edgeC.b,
      cRidge.r, cRidge.g, cRidge.b,
      edgeC.r, edgeC.g, edgeC.b,
      cRidge.r, cRidge.g, cRidge.b
    );
  });

  for (let s = 0; s < stations.length - 1; s++) {
    const rowA = s * 4;
    const rowB = (s + 1) * 4;
    for (let k = 0; k < 4; k++) {
      const kNext = (k + 1) % 4;
      indices.push(rowA + k, rowA + kNext, rowB + kNext);
      indices.push(rowA + k, rowB + kNext, rowB + k);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildShivaTrishulGroup() {
  const group = new THREE.Group();

  // Vertical staff (Danda) with golden grip bands
  group.add(makeMeshPart(
    new THREE.CylinderGeometry(1.05, 1.32, 58, 16),
    (x, y) => (y > 20 ? '#E2E8F0' : '#7DD3FC'),
    { pos: [0, 29, 0], surfaceWeight: 0.95 }
  ));
  [4, 18, 32, 48, 55].forEach((ry) => {
    group.add(makeMeshPart(
      new THREE.TorusGeometry(1.55, 0.42, 10, 24),
      '#FFD700',
      { pos: [0, ry, 0], rot: [Math.PI / 2, 0, 0], surfaceWeight: 1.8 }
    ));
  });
  // Butt spike at bottom of staff
  group.add(makeMeshPart(
    new THREE.ConeGeometry(1.45, 5.2, 14),
    '#FFD700',
    { pos: [0, -2.5, 0], rot: [Math.PI, 0, 0], surfaceWeight: 1.6 }
  ));

  // Ornate lotus collar at junction
  const collarPts = [
    new THREE.Vector2(1.4, 0.0),
    new THREE.Vector2(3.2, 1.4),
    new THREE.Vector2(2.4, 2.8),
    new THREE.Vector2(4.0, 4.2),
    new THREE.Vector2(1.8, 5.4),
  ];
  group.add(makeMeshPart(
    new THREE.LatheGeometry(collarPts, 20),
    '#FFD700',
    { pos: [0, 53.5, 0], surfaceWeight: 1.6 }
  ));

  // Crescent Base Guard sweeping beneath both outer prongs
  const guardCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-13.5, 62.5, 0),
    new THREE.Vector3( -7.8, 57.5, 0),
    new THREE.Vector3(  0.0, 56.2, 0),
    new THREE.Vector3(  7.8, 57.5, 0),
    new THREE.Vector3( 13.5, 62.5, 0),
  ]);
  group.add(makeMeshPart(
    new THREE.TubeGeometry(guardCurve, 36, 0.92, 10, false),
    (x) => (Math.abs(x) > 10 ? '#FFFFFF' : '#FFD700'),
    { surfaceWeight: 1.45 }
  ));

  // Tall Central 3D Diamond-Section Spear Blade
  const bladeGeo = createDiamondBladeGeometry(39.5, 4.6, 2.5);
  const bladeMesh = new THREE.Mesh(bladeGeo, new THREE.MeshBasicMaterial({ vertexColors: true }));
  bladeMesh.position.set(0, 57.5, 0);
  bladeMesh.userData.surfaceWeight = 1.55;
  group.add(bladeMesh);

  // Two Symmetrical Curved Tubular Outer Prongs (TubeGeometry + sharp flared tips)
  [-1, 1].forEach((dir) => {
    const prongCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(dir *  1.8, 57.6, 0),
      new THREE.Vector3(dir *  9.5, 59.5, 0),
      new THREE.Vector3(dir * 16.2, 66.5, 0),
      new THREE.Vector3(dir * 15.6, 75.5, 0),
      new THREE.Vector3(dir * 11.4, 82.0, 0),
      new THREE.Vector3(dir * 13.6, 86.2, 0),
    ]);
    group.add(makeMeshPart(
      new THREE.TubeGeometry(prongCurve, 44, 1.15, 12, false),
      (x, y) => (y > 80 ? '#FFFFFF' : (y > 68 ? '#00F0FF' : '#FFD700')),
      { surfaceWeight: 1.45 }
    ));

    // Flared razor tip on each curved prong
    group.add(makeMeshPart(
      new THREE.ConeGeometry(1.55, 6.2, 12),
      (x, y) => (y > 0.5 ? '#FFFFFF' : '#00F0FF'),
      { pos: [dir * 14.3, 88.2, 0], rot: [0, 0, -dir * 0.36], surfaceWeight: 2.1 }
    ));
  });

  // Tilted 3D Hourglass Damru with Crimson/Gold Cord
  const damru = new THREE.Group();
  damru.position.set(3.2, 43.5, 0);
  damru.rotation.z = -0.46; // ~26 deg tilt

  const damruPts = [
    new THREE.Vector2(0.0, -7.2),
    new THREE.Vector2(5.8, -7.2),
    new THREE.Vector2(4.2, -3.6),
    new THREE.Vector2(1.4,  0.0),
    new THREE.Vector2(4.2,  3.6),
    new THREE.Vector2(5.8,  7.2),
    new THREE.Vector2(0.0,  7.2),
  ];
  damru.add(makeMeshPart(
    new THREE.LatheGeometry(damruPts, 24),
    (x, y) => {
      if (Math.abs(y) > 7.0) return '#FFFBEB'; // parchment drumhead
      if (Math.abs(y) < 1.6) return '#FFD700'; // waist sash
      return Math.abs(y) > 4.5 ? '#FF2A85' : '#FF6D00';
    },
    { surfaceWeight: 1.75 }
  ));

  // Drumhead golden rims & crimson waist collar
  [-7.1, 7.1].forEach((hy) => {
    damru.add(makeMeshPart(
      new THREE.TorusGeometry(5.85, 0.42, 8, 28),
      '#FFD700',
      { pos: [0, hy, 0], rot: [Math.PI / 2, 0, 0], surfaceWeight: 2.0 }
    ));
  });
  damru.add(makeMeshPart(
    new THREE.TorusGeometry(1.65, 0.48, 8, 20),
    '#FF1744',
    { pos: [0, 0, 0], rot: [Math.PI / 2, 0, 0], surfaceWeight: 2.2 }
  ));

  // Zigzag golden & crimson tension cords around Damru body
  const cordPts = [];
  const laces = 8;
  for (let i = 0; i <= laces * 2; i++) {
    const a = (i / (laces * 2)) * Math.PI * 2;
    const top = i % 2 === 0;
    cordPts.push(new THREE.Vector3(Math.cos(a) * 5.7, top ? 6.8 : -6.8, Math.sin(a) * 5.7));
  }
  damru.add(makeMeshPart(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cordPts, true), 48, 0.24, 6, true),
    '#FFD700',
    { surfaceWeight: 2.0 }
  ));

  // Twin knotted striker cords & beads swinging from Damru waist
  [-1, 1].forEach((side) => {
    const beatCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 1.6, 0.0, 0),
      new THREE.Vector3(side * 4.5, -2.5, side * 1.4),
      new THREE.Vector3(side * 6.4, -5.2, side * 2.0),
    ]);
    damru.add(makeMeshPart(
      new THREE.TubeGeometry(beatCurve, 14, 0.22, 6, false),
      '#FF2A85',
      { surfaceWeight: 2.4 }
    ));
    damru.add(makeMeshPart(
      new THREE.SphereGeometry(0.85, 10, 8),
      '#FFD700',
      { pos: [side * 6.4, -5.2, side * 2.0], surfaceWeight: 2.8 }
    ));
  });

  group.add(damru);
  return group;
}

// -----------------------------------------------------------------------------
// 2C. SOLITAIRE WEDDING RINGS — Two thick, beveled 3D TorusGeometry bands
//     interlocked cleanly (rose-gold #FFB74D & platinum #E2E8F0) + 4-prong
//     cathedral setting + upright brilliant-cut solitaire diamond (#00F0FF)
// -----------------------------------------------------------------------------
function buildWeddingRingsGroup() {
  const group = new THREE.Group();

  // Ring 1: Thick beveled Platinum band (#E2E8F0) standing upright
  const ring1Group = new THREE.Group();
  ring1Group.position.set(-7.6, 22.0, 0);
  ring1Group.rotation.y = THREE.MathUtils.degToRad(14);

  ring1Group.add(makeMeshPart(
    new THREE.TorusGeometry(18.0, 2.8, 22, 72),
    (x, y, z) => (Math.abs(z) > 1.55 ? '#FFFFFF' : '#E2E8F0'),
    { scale: [1.0, 1.0, 1.32], surfaceWeight: 1.0 }
  ));
  // Crisp outer & inner chamfered bevel rims on platinum band
  [-2.35, 2.35].forEach((zOff) => {
    ring1Group.add(makeMeshPart(
      new THREE.TorusGeometry(20.4, 0.52, 10, 72),
      '#FFFFFF',
      { pos: [0, 0, zOff], surfaceWeight: 0.55 }
    ));
    ring1Group.add(makeMeshPart(
      new THREE.TorusGeometry(15.5, 0.52, 10, 72),
      '#F8FAFC',
      { pos: [0, 0, zOff], surfaceWeight: 0.45 }
    ));
  });
  group.add(ring1Group);

  // Ring 2: Thick beveled Rose-Gold band (#FFB74D) interlocked at 54° tilt
  const ring2Group = new THREE.Group();
  ring2Group.position.set(7.6, 19.8, 0);
  ring2Group.rotation.x = THREE.MathUtils.degToRad(54);
  ring2Group.rotation.y = THREE.MathUtils.degToRad(-22);

  ring2Group.add(makeMeshPart(
    new THREE.TorusGeometry(18.0, 2.8, 22, 72),
    (x, y, z) => (Math.abs(z) > 1.55 ? '#FFE0B2' : '#FFB74D'),
    { scale: [1.0, 1.0, 1.32], surfaceWeight: 1.0 }
  ));
  [-2.35, 2.35].forEach((zOff) => {
    ring2Group.add(makeMeshPart(
      new THREE.TorusGeometry(20.4, 0.52, 10, 72),
      '#FFE0B2',
      { pos: [0, 0, zOff], surfaceWeight: 0.55 }
    ));
    ring2Group.add(makeMeshPart(
      new THREE.TorusGeometry(15.5, 0.52, 10, 72),
      '#FFCC80',
      { pos: [0, 0, zOff], surfaceWeight: 0.45 }
    ));
  });
  group.add(ring2Group);

  // Crown Setting + Upright Solitaire Diamond anchored directly atop Ring 1
  const crown = new THREE.Group();
  crown.position.set(-7.6, 40.2, 0);
  crown.rotation.y = THREE.MathUtils.degToRad(14);

  // Cathedral shoulders curving up from platinum ring rim into gallery
  [-1, 1].forEach((dir) => {
    const shCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(dir * 9.5, -2.3, 0),
      new THREE.Vector3(dir * 6.5,  1.3, 0),
      new THREE.Vector3(dir * 4.4,  4.2, 0),
    ]);
    crown.add(makeMeshPart(
      new THREE.TubeGeometry(shCurve, 16, 0.85, 8, false),
      '#E2E8F0',
      { surfaceWeight: 2.0 }
    ));
  });

  // Gallery basket collar under diamond pavilion
  crown.add(makeMeshPart(
    new THREE.TorusGeometry(4.4, 0.72, 12, 36),
    '#FFFFFF',
    { pos: [0, 4.4, 0], rot: [Math.PI / 2, 0, 0], surfaceWeight: 2.1 }
  ));

  // 4 Curved Prongs clutching the upright solitaire diamond
  for (let p = 0; p < 4; p++) {
    const a = (p * Math.PI) / 2 + Math.PI / 4;
    const ca = Math.cos(a), sa = Math.sin(a);
    const prongCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(ca * 2.2,  0.4, sa * 2.2),
      new THREE.Vector3(ca * 5.0,  4.6, sa * 5.0),
      new THREE.Vector3(ca * 8.2,  9.3, sa * 8.2),
      new THREE.Vector3(ca * 6.5, 11.6, sa * 6.5),
    ]);
    crown.add(makeMeshPart(
      new THREE.TubeGeometry(prongCurve, 18, 0.56, 8, false),
      '#F8FAFC',
      { surfaceWeight: 2.4 }
    ));
  }

  // Upright Brilliant-Cut Solitaire Diamond:
  // Pointed pavilion culet pointing DOWN (y = 0.8), flat wide table facing UP (y = 13.4)
  const diamondPts = [
    new THREE.Vector2(0.0,  0.0), // sharp culet point facing DOWN into ring band
    new THREE.Vector2(4.4,  4.4), // lower pavilion facets
    new THREE.Vector2(8.2,  8.5), // sharp girdle edge
    new THREE.Vector2(8.2,  9.4), // girdle band
    new THREE.Vector2(5.1, 12.6), // upper crown bevel facets
    new THREE.Vector2(0.0, 12.6), // flat wide table facing UP
  ];
  crown.add(makeMeshPart(
    new THREE.LatheGeometry(diamondPts, 16),
    (x, y) => {
      if (y > 12.2) return '#FFFFFF'; // crisp flat top table
      if (y > 8.2 && y < 9.6) return '#E0FFFF'; // brilliant girdle flash
      return '#00F0FF'; // cyan-white pavilion & crown facets
    },
    { pos: [0, 0.8, 0], surfaceWeight: 2.6 }
  ));

  // Crisp girdle & flat-top table rim highlights for unmistakable diamond silhouette
  crown.add(makeMeshPart(
    new THREE.TorusGeometry(8.2, 0.28, 8, 16),
    '#E0FFFF',
    { pos: [0, 9.7, 0], rot: [Math.PI / 2, 0, 0], surfaceWeight: 2.4 }
  ));
  crown.add(makeMeshPart(
    new THREE.TorusGeometry(5.1, 0.30, 8, 16),
    '#FFFFFF',
    { pos: [0, 13.4, 0], rot: [Math.PI / 2, 0, 0], surfaceWeight: 2.8 }
  ));

  group.add(crown);
  return group;
}

// -----------------------------------------------------------------------------
// 2D. BEATING 3D HEART — True volumetric 3D parametric heart surface
// -----------------------------------------------------------------------------
function buildHeartGroup() {
  const group = new THREE.Group();
  const uSteps = 76;
  const vSteps = 38;
  const positions = [];
  const colors = [];
  const indices = [];

  const cDeep = new THREE.Color('#FF1744');
  const cMid  = new THREE.Color('#FF2A85');
  const cGlow = new THREE.Color('#FFD1DC');

  for (let iv = 0; iv <= vSteps; iv++) {
    const v = -Math.PI / 2 + (iv / vSteps) * Math.PI;
    const cosV = Math.cos(v);
    const sinV = Math.sin(v);

    for (let iu = 0; iu <= uSteps; iu++) {
      const u = (iu / uSteps) * Math.PI * 2;
      const sinU = Math.sin(u);
      const x0 = 16 * sinU * sinU * sinU;
      const y0 = 13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);

      const x = cosV * x0;
      const y = -2.0 + cosV * (y0 + 2.0);
      const z = 11.4 * sinV * (0.74 + 0.26 * cosV * Math.abs(sinU));

      positions.push(x, y, z);

      // Gradient shading: warm highlight on upper lobes, deep ruby near base & cleft
      const lobeMix = Math.max(0, Math.min(1, (y + 16) / 30));
      const col = cDeep.clone().lerp(cMid, lobeMix);
      if (y > 4 && Math.abs(sinV) < 0.72) {
        col.lerp(cGlow, Math.max(0, (y - 4) / 14) * 0.55);
      }
      colors.push(col.r, col.g, col.b);
    }
  }

  const stride = uSteps + 1;
  for (let iv = 0; iv < vSteps; iv++) {
    for (let iu = 0; iu < uSteps; iu++) {
      const a = iv * stride + iu;
      const b = a + 1;
      const c = (iv + 1) * stride + iu;
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const heartMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true }));
  heartMesh.userData.surfaceWeight = 1.0;
  group.add(heartMesh);
  return group;
}

// -----------------------------------------------------------------------------
// 2E. ROTATING 3D EARTH GLOBE — Sphere + raised continental land-mass clusters +
//     equator/meridian & orbital rings
// -----------------------------------------------------------------------------
const CONTINENT_POLYGONS = [
  // North America
  { color: '#10B981', pts: [[-168,66],[-145,70],[-112,72],[-82,66],[-60,52],[-70,42],[-82,28],[-98,18],[-84,10],[-95,16],[-108,24],[-122,38],[-135,55]] },
  // Greenland
  { color: '#F8FAFC', pts: [[-56,60],[-20,70],[-18,82],[-55,82],[-62,72]] },
  // South America
  { color: '#34D399', pts: [[-80,10],[-64,11],[-36,-6],[-42,-22],[-56,-36],[-68,-54],[-74,-44],[-78,-18],[-81,-4]] },
  // Europe
  { color: '#34D399', pts: [[-9,37],[6,38],[26,40],[42,46],[46,66],[26,71],[6,62],[-4,52]] },
  // Africa
  { color: '#FBBF24', pts: [[-17,15],[-6,35],[12,35],[32,31],[42,12],[50,11],[40,-10],[28,-33],[18,-34],[12,-14],[8,4],[-8,6]] },
  // Indian Subcontinent (distinctive peninsula highlight — checked before Asia)
  { color: '#FFD700', pts: [[68,24],[78,34],[88,26],[86,18],[77,8],[72,18]] },
  // Asia & Eurasia
  { color: '#10B981', pts: [[36,42],[56,56],[90,74],[145,70],[172,66],[142,46],[122,36],[110,20],[100,12],[88,22],[66,26],[46,30]] },
  // Australia
  { color: '#F59E0B', pts: [[114,-22],[130,-12],[144,-14],[153,-27],[148,-38],[132,-32],[115,-34]] },
  // Antarctica
  { color: '#F8FAFC', pts: [[-180,-72],[180,-72],[180,-89],[-180,-89]] },
];

function pointInPoly(lon, lat, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > lat) !== (yj > lat))
      && (lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function classifyLand(lon, lat) {
  for (let p = 0; p < CONTINENT_POLYGONS.length; p++) {
    if (pointInPoly(lon, lat, CONTINENT_POLYGONS[p].pts)) {
      return CONTINENT_POLYGONS[p].color;
    }
  }
  return null;
}

function buildRaisedContinentsGeometry(radius) {
  const lonSteps = 128;
  const latSteps = 64;
  const positions = [];
  const colors = [];
  const indices = [];
  const tmpCol = new THREE.Color();

  function sphPoint(lonDeg, latDeg, rad) {
    const phi = THREE.MathUtils.degToRad(90 - latDeg);
    const theta = THREE.MathUtils.degToRad(lonDeg + 180);
    return [
      -rad * Math.sin(phi) * Math.cos(theta),
       rad * Math.cos(phi),
       rad * Math.sin(phi) * Math.sin(theta),
    ];
  }

  for (let j = 0; j < latSteps; j++) {
    const lat0 = -86 + (j / latSteps) * 172;
    const lat1 = -86 + ((j + 1) / latSteps) * 172;
    const latMid = (lat0 + lat1) * 0.5;

    for (let i = 0; i < lonSteps; i++) {
      const lon0 = -180 + (i / lonSteps) * 360;
      const lon1 = -180 + ((i + 1) / lonSteps) * 360;
      const lonMid = (lon0 + lon1) * 0.5;

      const hex = classifyLand(lonMid, latMid);
      if (!hex) continue;

      tmpCol.set(hex);
      const baseIdx = positions.length / 3;
      const p0 = sphPoint(lon0, lat0, radius);
      const p1 = sphPoint(lon1, lat0, radius);
      const p2 = sphPoint(lon1, lat1, radius);
      const p3 = sphPoint(lon0, lat1, radius);

      [p0, p1, p2, p3].forEach((p) => {
        positions.push(p[0], p[1], p[2]);
        colors.push(tmpCol.r, tmpCol.g, tmpCol.b);
      });
      indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
      indices.push(baseIdx, baseIdx + 2, baseIdx + 3);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildEarthGlobeGroup() {
  const group = new THREE.Group();

  // Ocean Sphere (lower surfaceWeight so land masses pop brightly)
  group.add(makeMeshPart(
    new THREE.SphereGeometry(28.0, 48, 32),
    (x, y) => (Math.abs(y) > 25.5 ? '#BAE6FD' : '#0284C7'),
    { surfaceWeight: 0.45 }
  ));

  // Raised 3D Continental Land-Mass Clusters at radius 29.3
  const landMesh = new THREE.Mesh(
    buildRaisedContinentsGeometry(29.3),
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })
  );
  landMesh.userData.surfaceWeight = 2.15;
  group.add(landMesh);

  // Equator ring
  group.add(makeMeshPart(
    new THREE.TorusGeometry(31.4, 0.44, 10, 84),
    '#38BDF8',
    { rot: [Math.PI / 2, 0, 0], surfaceWeight: 1.4 }
  ));

  // Two orthogonal Meridian rings
  [0, Math.PI / 2].forEach((ry) => {
    group.add(makeMeshPart(
      new THREE.TorusGeometry(31.1, 0.34, 10, 84),
      '#7DD3FC',
      { rot: [0, ry, 0], surfaceWeight: 1.0 }
    ));
  });

  // Tilted Golden Orbital Ring
  group.add(makeMeshPart(
    new THREE.TorusGeometry(36.2, 0.44, 10, 84),
    '#FFD700',
    { rot: [THREE.MathUtils.degToRad(66), THREE.MathUtils.degToRad(18), 0], surfaceWeight: 1.35 }
  ));

  return group;
}

// -----------------------------------------------------------------------------
// 2F. ISRO LVM3 ROCKET — Central core stage, twin strap-on S200 boosters,
//     payload fairing nose cone, 4 delta fins, animated golden-orange exhaust
// -----------------------------------------------------------------------------
function buildIsroRocketGroup() {
  const group = new THREE.Group();

  // Central L110 + C25 Core Stage (y = 0 .. 43)
  group.add(makeMeshPart(
    new THREE.CylinderGeometry(4.1, 4.1, 43.0, 24),
    (x, y) => {
      if (y > 16.5 && y < 19.0) return '#FF9933'; // Tricolor saffron ring
      if (y > 14.0 && y <= 16.5) return '#FFFFFF';
      if (y > 11.5 && y <= 14.0) return '#10B981'; // Tricolor emerald ring
      if (y < -14.0) return '#64748B';
      return '#F8FAFC';
    },
    { pos: [0, 21.5, 0], surfaceWeight: 0.95 }
  ));

  // Payload Fairing & Tangent-Ogive Nose Cone (y = 43 .. 64)
  const fairingPts = [
    new THREE.Vector2(4.1,  0.0),
    new THREE.Vector2(4.65, 2.2), // iconic bulbous 5m fairing shoulder
    new THREE.Vector2(4.65, 8.5),
    new THREE.Vector2(4.20, 12.0),
    new THREE.Vector2(3.15, 15.5),
    new THREE.Vector2(1.70, 18.5),
    new THREE.Vector2(0.0,  21.0), // sharp nose tip
  ];
  group.add(makeMeshPart(
    new THREE.LatheGeometry(fairingPts, 24),
    (x, y) => (y > 18.0 ? '#FF9933' : (y > 7.5 && y < 9.5 ? '#38BDF8' : '#FFFFFF')),
    { pos: [0, 43.0, 0], surfaceWeight: 1.25 }
  ));

  // Central Bell Nozzle (y = -4.2 .. 0)
  const bellPts = [
    new THREE.Vector2(1.6, 4.2),
    new THREE.Vector2(1.2, 3.0),
    new THREE.Vector2(2.6, 0.0),
  ];
  group.add(makeMeshPart(
    new THREE.LatheGeometry(bellPts, 18),
    '#94A3B8',
    { pos: [0, -4.2, 0], surfaceWeight: 1.3 }
  ));

  // Twin Strap-On S200 Boosters (x = ±6.8)
  [-1, 1].forEach((side) => {
    const bx = side * 6.8;

    group.add(makeMeshPart(
      new THREE.CylinderGeometry(2.55, 2.55, 31.0, 20),
      (x, y) => (y > 10.0 && y < 12.6 ? '#FF9933' : (y < -10.0 ? '#94A3B8' : '#E2E8F0')),
      { pos: [bx, 15.5, 0], surfaceWeight: 0.95 }
    ));

    // Inward-canted aerodynamic S200 nose cone
    group.add(makeMeshPart(
      new THREE.ConeGeometry(2.55, 7.6, 20),
      (x, y) => (y > 1.8 ? '#FF9933' : '#FFFFFF'),
      { pos: [bx - side * 0.35, 34.6, 0], rot: [0, 0, side * 0.10], surfaceWeight: 1.3 }
    ));

    // Cross-struts linking S200 booster to central core
    [8.0, 26.5].forEach((sy) => {
      group.add(makeMeshPart(
        new THREE.BoxGeometry(3.2, 1.4, 1.4),
        '#94A3B8',
        { pos: [side * 4.4, sy, 0], surfaceWeight: 1.1 }
      ));
    });

    // S200 engine nozzle
    group.add(makeMeshPart(
      new THREE.LatheGeometry([
        new THREE.Vector2(1.4, 3.6),
        new THREE.Vector2(1.1, 2.6),
        new THREE.Vector2(2.2, 0.0),
      ], 16),
      '#CBD5E1',
      { pos: [bx, -3.6, 0], surfaceWeight: 1.25 }
    ));
  });

  // 4 Swept Delta Fins (2 on outer S200 flanks ±X, 2 on fore/aft core flanks ±Z)
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(6.5, -1.6);
  finShape.lineTo(6.5, 2.0);
  finShape.lineTo(0, 9.2);
  finShape.closePath();

  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.6, bevelEnabled: false });
  finGeo.translate(0, 0, -0.3);

  group.add(makeMeshPart(finGeo.clone(), (x) => (x > 3.5 ? '#FF9933' : '#FFFFFF'), {
    pos: [9.2, 2.2, 0], rot: [0, 0, 0], surfaceWeight: 1.45,
  }));
  group.add(makeMeshPart(finGeo.clone(), (x) => (x > 3.5 ? '#FF9933' : '#FFFFFF'), {
    pos: [-9.2, 2.2, 0], rot: [0, Math.PI, 0], surfaceWeight: 1.45,
  }));
  group.add(makeMeshPart(finGeo.clone(), (x) => (x > 3.5 ? '#FF9933' : '#FFFFFF'), {
    pos: [0, 2.2, 4.0], rot: [0, -Math.PI / 2, 0], surfaceWeight: 1.45,
  }));
  group.add(makeMeshPart(finGeo.clone(), (x) => (x > 3.5 ? '#FF9933' : '#FFFFFF'), {
    pos: [0, 2.2, -4.0], rot: [0, Math.PI / 2, 0], surfaceWeight: 1.45,
  }));

  // 3 Live Golden-Orange Exhaust Plumes (below Y = -4, mapped below 34m alt)
  const exhaustColor = (x, y) => {
    if (y > 14.5) return '#FFFFFF';
    if (y > 9.5)  return '#FFD700';
    if (y > 4.5)  return '#FF6D00';
    return '#FF2A00';
  };

  // Central core main exhaust plume (height 18)
  const mainPlumePts = [
    new THREE.Vector2(0.0,  0.0),
    new THREE.Vector2(3.6,  5.0),
    new THREE.Vector2(3.9, 11.0),
    new THREE.Vector2(2.3, 18.0),
  ];
  group.add(makeMeshPart(
    new THREE.LatheGeometry(mainPlumePts, 18),
    exhaustColor,
    { pos: [0, -22.2, 0], surfaceWeight: 1.45 }
  ));

  // Twin S200 booster exhaust plumes
  [-6.8, 6.8].forEach((px) => {
    const sidePlumePts = [
      new THREE.Vector2(0.0,  0.0),
      new THREE.Vector2(2.6,  4.2),
      new THREE.Vector2(2.9,  9.5),
      new THREE.Vector2(1.9, 15.2),
    ];
    group.add(makeMeshPart(
      new THREE.LatheGeometry(sidePlumePts, 14),
      exhaustColor,
      { pos: [px, -19.0, 0], surfaceWeight: 1.35 }
    ));
  });

  return group;
}

// -----------------------------------------------------------------------------
// 2G. 3D SACRED LOTUS — 3 concentric tiers of double-curved parametric petals,
//     golden seed pod (pericarp), glowing stamen pearls & emerald lotus pad
// -----------------------------------------------------------------------------
function createLotusPetalGeometry(length, maxWidth, cupDepth, tiltAngle, baseRadius, baseY, theta, palette) {
  const uSteps = 10;
  const vSteps = 16;
  const positions = [];
  const colors = [];
  const indices = [];

  const cBase = new THREE.Color(palette.base);
  const cMid  = new THREE.Color(palette.mid);
  const cTip  = new THREE.Color(palette.tip);
  const cRim  = new THREE.Color(palette.rim);

  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const cosA = Math.cos(tiltAngle);
  const sinA = Math.sin(tiltAngle);

  for (let iv = 0; iv <= vSteps; iv++) {
    const v = iv / vSteps;
    const width = maxWidth * Math.sin(Math.pow(v, 0.62) * Math.PI);
    const spineY = length * (v - 0.10 * Math.sin(v * Math.PI));
    const spineZ = length * (0.20 * Math.sin(v * Math.PI) - 0.16 * v * v);

    for (let iu = 0; iu <= uSteps; iu++) {
      const u = -1 + (iu / uSteps) * 2;
      const px = u * width;
      const cup = cupDepth * Math.sin(v * Math.PI) * (1 - u * u);

      const radZ = baseRadius + spineY * sinA + (spineZ - cup) * cosA;
      const altY = baseY + spineY * cosA - (spineZ - cup) * sinA;

      const wx = px * cosT + radZ * sinT;
      const wz = -px * sinT + radZ * cosT;
      positions.push(wx, altY, wz);

      const col = cBase.clone().lerp(cMid, Math.min(1, v * 1.35));
      if (v > 0.65) col.lerp(cTip, (v - 0.65) / 0.35);
      const rimMix = Math.max(0, (Math.abs(u) - 0.68) / 0.32);
      if (rimMix > 0) col.lerp(cRim, rimMix * 0.85);
      colors.push(col.r, col.g, col.b);
    }
  }

  const stride = uSteps + 1;
  for (let iv = 0; iv < vSteps; iv++) {
    for (let iu = 0; iu < uSteps; iu++) {
      const a = iv * stride + iu;
      const b = a + 1;
      const c = (iv + 1) * stride + iu;
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildLotusGroup() {
  const group = new THREE.Group();

  // Emerald floating lotus pad + turquoise water halo
  group.add(makeMeshPart(
    new THREE.CylinderGeometry(31.0, 31.0, 0.9, 48),
    (x, y, z) => {
      const r = Math.hypot(x, z);
      return r > 28.0 ? '#34D399' : (r > 18.0 ? '#10B981' : '#059669');
    },
    { pos: [0, 1.2, 0], surfaceWeight: 0.42, skipBottom: true }
  ));
  group.add(makeMeshPart(
    new THREE.TorusGeometry(33.4, 0.52, 10, 64),
    '#00E5FF',
    { pos: [0, 1.4, 0], rot: [Math.PI / 2, 0, 0], surfaceWeight: 0.85 }
  ));

  // Central golden seed pod (pericarp) + glowing stamen pearls
  const podPts = [
    new THREE.Vector2(0.0,  0.0),
    new THREE.Vector2(3.0,  0.6),
    new THREE.Vector2(3.4,  4.0),
    new THREE.Vector2(5.4,  9.2),
    new THREE.Vector2(6.5, 11.4),
    new THREE.Vector2(0.0, 11.4),
  ];
  group.add(makeMeshPart(
    new THREE.LatheGeometry(podPts, 24),
    (x, y) => (y > 10.6 ? '#FFFBEB' : '#FFD700'),
    { pos: [0, 3.2, 0], surfaceWeight: 1.55 }
  ));

  group.add(makeMeshPart(
    new THREE.SphereGeometry(0.95, 10, 8),
    '#FFFFFF',
    { pos: [0, 15.2, 0], surfaceWeight: 2.0 }
  ));
  for (let s = 0; s < 6; s++) {
    const a = (s / 6) * Math.PI * 2;
    group.add(makeMeshPart(
      new THREE.SphereGeometry(0.75, 10, 8),
      '#FFFBEB',
      { pos: [Math.cos(a) * 3.8, 15.0, Math.sin(a) * 3.8], surfaceWeight: 1.8 }
    ));
  }

  // 3 Concentric tiers of double-curved parametric petals (sculptural upright bloom)
  const tiers = [
    {
      count: 8, offset: 0, length: 28.0, maxWidth: 6.0, cup: 2.8, tilt: 0.16, baseR: 4.5, baseY: 6.2, weight: 1.45,
      palette: { base: '#FDE68A', mid: '#FF80AB', tip: '#FFFFFF', rim: '#FFFFFF' },
    },
    {
      count: 10, offset: Math.PI / 10, length: 32.0, maxWidth: 7.6, cup: 3.3, tilt: 0.46, baseR: 5.8, baseY: 4.8, weight: 1.25,
      palette: { base: '#FFD700', mid: '#FF2A85', tip: '#FFE4E6', rim: '#FFFFFF' },
    },
    {
      count: 12, offset: Math.PI / 12, length: 34.0, maxWidth: 8.8, cup: 3.5, tilt: 0.78, baseR: 7.0, baseY: 3.4, weight: 1.05,
      palette: { base: '#F59E0B', mid: '#EC4899', tip: '#FF80AB', rim: '#FDE68A' },
    },
  ];

  tiers.forEach((tier) => {
    for (let k = 0; k < tier.count; k++) {
      const theta = (k / tier.count) * Math.PI * 2 + tier.offset;
      const geo = createLotusPetalGeometry(
        tier.length, tier.maxWidth, tier.cup, tier.tilt,
        tier.baseR, tier.baseY, theta, tier.palette
      );
      const petalMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true }));
      petalMesh.userData.surfaceWeight = tier.weight;
      group.add(petalMesh);
    }
  });

  return group;
}

// -----------------------------------------------------------------------------
// 2H. 3D ROYAL IMPERIAL CROWN — Flared golden circlet, 8 bezel-set jewels,
//     8 fleur-de-lis spires, 4 S-curved imperial arches, velvet dome & finial
// -----------------------------------------------------------------------------
function buildCrownGroup() {
  const group = new THREE.Group();

  // Flared Imperial Base Circlet Band
  const bandPts = [
    new THREE.Vector2(21.2, 0.0),
    new THREE.Vector2(21.9, 3.2),
    new THREE.Vector2(23.1, 6.8),
    new THREE.Vector2(24.8, 10.2),
  ];
  group.add(makeMeshPart(
    new THREE.LatheGeometry(bandPts, 48),
    (x, y) => (y > 8.6 || y < 1.4 ? '#FFFBEB' : '#FFD700'),
    { surfaceWeight: 0.95 }
  ));

  // Beaded Upper & Lower Gold Rim Moldings
  group.add(makeMeshPart(
    new THREE.TorusGeometry(21.2, 0.72, 10, 56),
    '#FFFBEB',
    { pos: [0, 0.6, 0], rot: [Math.PI / 2, 0, 0], surfaceWeight: 1.4 }
  ));
  group.add(makeMeshPart(
    new THREE.TorusGeometry(24.9, 0.85, 10, 56),
    '#FFFBEB',
    { pos: [0, 10.2, 0], rot: [Math.PI / 2, 0, 0], surfaceWeight: 1.5 }
  ));

  // Subtle Royal Velvet Inner Cushion Dome
  const cushionPts = [
    new THREE.Vector2(21.5,  8.5),
    new THREE.Vector2(22.6, 16.0),
    new THREE.Vector2(18.5, 24.5),
    new THREE.Vector2(10.0, 29.8),
    new THREE.Vector2( 0.0, 31.6),
  ];
  group.add(makeMeshPart(
    new THREE.LatheGeometry(cushionPts, 32),
    (x, y) => (y > 25.0 ? '#A855F7' : '#7E22CE'),
    { surfaceWeight: 0.28, skipBottom: true }
  ));

  // 8 Bezel-Set Gemstones around Circlet + 8 Sculpted Rim Spires
  const gemPalette = ['#FF2A85', '#00E5FF', '#10B981', '#FFFFFF'];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const isCardinal = (i % 2 === 0);

    // Circlet Jewel + Gold Bezel
    group.add(makeMeshPart(
      new THREE.OctahedronGeometry(isCardinal ? 2.1 : 1.65, 0),
      gemPalette[i % gemPalette.length],
      { pos: [ca * 23.6, 5.3, sa * 23.6], rot: [0, -a, 0], surfaceWeight: 2.3 }
    ));
    group.add(makeMeshPart(
      new THREE.TorusGeometry(isCardinal ? 2.2 : 1.75, 0.34, 8, 18),
      '#FFD700',
      { pos: [ca * 23.3, 5.3, sa * 23.3], rot: [0, Math.PI / 2 - a, 0], surfaceWeight: 1.9 }
    ));

    // Rim Fleur-de-Lis Spires
    const spireH = isCardinal ? 14.2 : 10.2;
    const spireR = isCardinal ? 25.5 : 25.1;
    group.add(makeMeshPart(
      new THREE.ConeGeometry(isCardinal ? 2.4 : 1.75, spireH, 12),
      (x, y) => (y > spireH * 0.25 ? '#FFD700' : '#F59E0B'),
      {
        pos: [ca * spireR, 10.0 + spireH * 0.5, sa * spireR],
        rot: [sa * 0.14, 0, -ca * 0.14],
        surfaceWeight: 1.5,
      }
    ));
    // Glowing Pearl Finial on each spire tip
    group.add(makeMeshPart(
      new THREE.SphereGeometry(isCardinal ? 1.75 : 1.30, 12, 10),
      isCardinal ? '#FFFFFF' : '#7DD3FC',
      { pos: [ca * (spireR + 0.9), 10.2 + spireH, sa * (spireR + 0.9)], surfaceWeight: 2.2 }
    ));
  }

  // 4 Intersecting Imperial S-Curved Arches + Pearl Studs
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(ca * 25.8, 22.8, sa * 25.8),
      new THREE.Vector3(ca * 24.4, 31.8, sa * 24.4),
      new THREE.Vector3(ca * 15.2, 37.8, sa * 15.2),
      new THREE.Vector3(ca *  6.0, 36.8, sa *  6.0),
      new THREE.Vector3(0.0,       35.2, 0.0),
    ]);
    group.add(makeMeshPart(
      new THREE.TubeGeometry(archCurve, 28, 1.05, 10, false),
      (x, y) => (y > 35.5 ? '#FFFBEB' : '#FFD700'),
      { surfaceWeight: 1.85 }
    ));

    // Pearl beads along each imperial arch
    [0.24, 0.48, 0.72].forEach((t) => {
      const pt = archCurve.getPoint(t);
      group.add(makeMeshPart(
        new THREE.SphereGeometry(0.95, 10, 8),
        '#FFFFFF',
        { pos: [pt.x, pt.y + 0.75, pt.z], surfaceWeight: 2.4 }
      ));
    });
  }

  // Central Monde Orb + Upright Royal Cross-Diamond Finial
  group.add(makeMeshPart(
    new THREE.SphereGeometry(3.1, 16, 12),
    '#FFD700',
    { pos: [0, 38.2, 0], surfaceWeight: 2.0 }
  ));
  group.add(makeMeshPart(
    new THREE.TorusGeometry(3.25, 0.36, 8, 24),
    '#FFFFFF',
    { pos: [0, 38.2, 0], rot: [Math.PI / 2, 0, 0], surfaceWeight: 2.2 }
  ));

  // Upright Royal Cross / Faceted Diamond Finial at Crown Apex
  group.add(makeMeshPart(
    new THREE.BoxGeometry(1.4, 7.6, 1.4),
    '#FFFBEB',
    { pos: [0, 44.8, 0], surfaceWeight: 2.4 }
  ));
  group.add(makeMeshPart(
    new THREE.BoxGeometry(6.2, 1.4, 1.4),
    '#FFD700',
    { pos: [0, 45.4, 0], surfaceWeight: 2.4 }
  ));
  group.add(makeMeshPart(
    new THREE.OctahedronGeometry(2.1, 0),
    '#00F0FF',
    { pos: [0, 45.4, 0], surfaceWeight: 2.8 }
  ));

  return group;
}

// -----------------------------------------------------------------------------
// 3. MASTER HERO FORMATION BUILDER (runs through AeroSampler!)
// -----------------------------------------------------------------------------
window.buildHeroFormation = function buildHeroFormation(id, nDrones = 2200) {
  const n = Math.max(500, Math.min(5000, Math.round(nDrones || 2200)));

  if (id === 'rings') {
    return window.AeroSampler.sampleMeshToDroneCloud(buildWeddingRingsGroup(), n, {
      targetSpan: 76,
      baseAlt: 18,
    });
  }
  if (id === 'heart') {
    return window.AeroSampler.sampleMeshToDroneCloud(buildHeartGroup(), n, {
      targetSpan: 68,
      centerAlt: 56,
      interiorRatio: 0.14,
      interiorDepth: 0.35,
    });
  }
  if (id === 'globe') {
    return window.AeroSampler.sampleMeshToDroneCloud(buildEarthGlobeGroup(), n, {
      targetSpan: 72,
      centerAlt: 56,
    });
  }
  if (id === 'rocket') {
    return window.AeroSampler.sampleMeshToDroneCloud(buildIsroRocketGroup(), n, {
      targetSpan: 82,
      baseAlt: 14,
    });
  }
  if (id === 'lotus') {
    return window.AeroSampler.sampleMeshToDroneCloud(buildLotusGroup(), n, {
      targetSpan: 76,
      baseAlt: 22,
    });
  }
  if (id === 'crown') {
    return window.AeroSampler.sampleMeshToDroneCloud(buildCrownGroup(), n, {
      targetSpan: 76,
      baseAlt: 18,
    });
  }
  if (id === 'taj') {
    return window.AeroSampler.sampleMeshToDroneCloud(buildTajMahalGroup(), n, {
      targetSpan: 78,
      baseAlt: 16,
    });
  }
  if (id === 'trishul') {
    return window.AeroSampler.sampleMeshToDroneCloud(buildShivaTrishulGroup(), n, {
      targetSpan: 80,
      baseAlt: 15,
    });
  }

  return window.AeroSampler.sampleMeshToDroneCloud(buildWeddingRingsGroup(), n, {
    targetSpan: 76,
    baseAlt: 18,
  });
};

// -----------------------------------------------------------------------------
// 4. AI BLUEPRINT GENERATOR (PUTER.JS + OFFLINE PROCEDURAL SILHOUETTES)
// -----------------------------------------------------------------------------
let _bpGenToken = 0;

window.setBpPrompt = function setBpPrompt(txt, pal) {
  const input = document.getElementById('bpPromptInput');
  const palEl = document.getElementById('bpPaletteSelect');
  if (input) input.value = txt;
  if (pal && palEl) palEl.value = pal;
  window.generateBlueprintPreview(false);
};

function drawFilledGlow(ctx, fillStyle, strokeStyle, lineWidth = 3) {
  if (fillStyle) { ctx.fillStyle = fillStyle; ctx.fill(); }
  if (strokeStyle && lineWidth > 0) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function drawStarPolygon(ctx, cx, cy, spikes, outerR, innerR, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = rot + (i * Math.PI) / spikes;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * Offline procedural high-contrast B&W / luminous silhouette fallback for common
 * Indian & broadcast motifs. NEVER writes raw text words onto the canvas.
 */
function renderProceduralSilhouette(raw, ctx, w, h) {
  const q  = (raw || '').toLowerCase();
  const cx = w / 2;
  const cy = h / 2;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  ctx.lineCap  = 'round';
  ctx.lineJoin = 'round';

  // 1. Peacock / Mayur
  if (q.includes('peacock') || q.includes('mayur') || q.includes('mor')) {
    const fanCy = cy + 32;
    for (let i = -5; i <= 5; i++) {
      const a   = -Math.PI / 2 + i * 0.24;
      const len = 94 - Math.abs(i) * 4;
      const fx  = cx + Math.cos(a) * len;
      const fy  = fanCy + Math.sin(a) * len;
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth   = 2.6;
      ctx.beginPath(); ctx.moveTo(cx, fanCy); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(fx, fy, 11, 15, a + Math.PI / 2, 0, Math.PI * 2);
      drawFilledGlow(ctx, '#FFFFFF', '#E2E8F0', 2);
      ctx.beginPath(); ctx.arc(fx, fy, 4.5, 0, Math.PI * 2);
      drawFilledGlow(ctx, '#000000', '#FFFFFF', 1.5);
    }
    for (let i = -3; i <= 3; i++) {
      const a  = -Math.PI / 2 + i * 0.30;
      const fx = cx + Math.cos(a) * 56;
      const fy = fanCy + Math.sin(a) * 56;
      ctx.beginPath(); ctx.ellipse(fx, fy, 8, 11, a + Math.PI / 2, 0, Math.PI * 2);
      drawFilledGlow(ctx, '#E2E8F0', '#FFFFFF', 2);
    }
    ctx.beginPath(); ctx.ellipse(cx, cy + 46, 18, 28, 0, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 2.5);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth   = 10;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 28);
    ctx.bezierCurveTo(cx - 12, cy + 2, cx + 14, cy - 16, cx + 2, cy - 32);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 2, cy - 34, 9, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.moveTo(cx + 9, cy - 35); ctx.lineTo(cx + 21, cy - 31); ctx.lineTo(cx + 9, cy - 28); ctx.closePath(); ctx.fill();
    for (let k = -1; k <= 1; k++) {
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx + 2, cy - 42); ctx.lineTo(cx + 2 + k * 7, cy - 56); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 2 + k * 7, cy - 57, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    return true;
  }

  // 2. Gateway of India
  if (q.includes('gateway')) {
    ctx.beginPath(); ctx.rect(52, 74, 216, 116);
    drawFilledGlow(ctx, '#E2E8F0', '#FFFFFF', 3);
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.moveTo(cx - 34, 190); ctx.lineTo(cx - 34, 128);
    ctx.arc(cx, 128, 34, Math.PI, 0); ctx.lineTo(cx + 34, 190); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3.5; ctx.stroke();
    [-68, 68].forEach((ox) => {
      ctx.fillStyle = '#000000';
      ctx.beginPath(); ctx.moveTo(cx + ox - 16, 190); ctx.lineTo(cx + ox - 16, 146);
      ctx.arc(cx + ox, 146, 16, Math.PI, 0); ctx.lineTo(cx + ox + 16, 190); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5; ctx.stroke();
    });
    ctx.beginPath(); ctx.arc(cx, 74, 34, Math.PI, 0);
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 3);
    [-100, -48, 48, 100].forEach((tx) => {
      ctx.beginPath(); ctx.rect(cx + tx - 7, 50, 14, 140);
      drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 2);
      ctx.beginPath(); ctx.arc(cx + tx, 50, 8, Math.PI, 0);
      drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 2);
    });
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(34, 192); ctx.lineTo(286, 192); ctx.stroke();
    return true;
  }

  // 3. India Gate
  if (q.includes('india gate')) {
    ctx.beginPath(); ctx.rect(96, 44, 128, 152);
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 3);
    ctx.beginPath(); ctx.rect(86, 36, 148, 14);
    drawFilledGlow(ctx, '#FFFFFF', '#E2E8F0', 2);
    ctx.beginPath(); ctx.rect(108, 22, 104, 14);
    drawFilledGlow(ctx, '#E2E8F0', '#FFFFFF', 2);
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.moveTo(cx - 28, 196); ctx.lineTo(cx - 28, 114);
    ctx.arc(cx, 114, 28, Math.PI, 0); ctx.lineTo(cx + 28, 196); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 152); ctx.quadraticCurveTo(cx + 12, 170, cx, 184);
    ctx.quadraticCurveTo(cx - 12, 170, cx, 152);
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 2);
    ctx.beginPath(); ctx.rect(72, 196, 176, 12);
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 2);
    return true;
  }

  // 4. Lion / Ashoka Lion
  if (q.includes('lion') || q.includes('sher') || q.includes('simha')) {
    // Bold lion mane starburst + proud face + snout
    drawStarPolygon(ctx, cx, cy - 8, 18, 72, 54);
    drawFilledGlow(ctx, '#FFFFFF', '#E2E8F0', 3);
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(cx, cy - 8, 42, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy - 6, 36, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 2.5);
    // Eyes, nose, fierce brow & jaw
    ctx.fillStyle = '#000000';
    [-14, 14].forEach((ex) => {
      ctx.beginPath(); ctx.ellipse(cx + ex, cy - 16, 6, 4, ex > 0 ? -0.25 : 0.25, 0, Math.PI * 2); ctx.fill();
    });
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 2); ctx.lineTo(cx + 10, cy - 2); ctx.lineTo(cx, cy + 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(cx, cy + 10); ctx.lineTo(cx, cy + 20);
    ctx.moveTo(cx - 14, cy + 20); ctx.quadraticCurveTo(cx, cy + 15, cx + 14, cy + 20); ctx.stroke();
    return true;
  }

  // 5. Ram Mandir / Temple Shikhara
  if (q.includes('ram mandir') || q.includes('temple') || q.includes('ayodhya')) {
    ctx.beginPath(); ctx.rect(42, 174, 236, 22);
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 2.5);
    for (let tier = 0; tier < 6; tier++) {
      const tw = 76 - tier * 10;
      const ty = 152 - tier * 17;
      ctx.beginPath(); ctx.rect(cx - tw / 2, ty, tw, 18);
      drawFilledGlow(ctx, tier % 2 === 0 ? '#FFFFFF' : '#CBD5E1', '#FFFFFF', 2);
    }
    ctx.beginPath(); ctx.arc(cx, 48, 8, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 2);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, 42); ctx.lineTo(cx, 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 18); ctx.lineTo(cx + 26, 25); ctx.lineTo(cx, 32); ctx.closePath();
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 1.5);
    [-58, 58].forEach((mx) => {
      ctx.beginPath(); ctx.rect(cx + mx - 24, 134, 48, 40);
      drawFilledGlow(ctx, '#E2E8F0', '#FFFFFF', 2);
      ctx.beginPath(); ctx.moveTo(cx + mx - 24, 134); ctx.lineTo(cx + mx, 102); ctx.lineTo(cx + mx + 24, 134); ctx.closePath();
      drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 2);
    });
    return true;
  }

  // 6. Indian Map + Ashoka Chakra
  if (q.includes('india') || q.includes('map') || q.includes('bharat') || q.includes('chakra')) {
    const pts = [
      [148,22],[164,26],[174,42],[168,56],[186,68],[218,72],
      [246,62],[262,74],[248,92],[234,88],[214,96],[206,118],
      [184,146],[166,186],[156,216],[146,188],[130,148],[116,122],
      [94,114],[90,98],[114,92],[126,72],[136,48],
    ];
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    drawFilledGlow(ctx, '#E2E8F0', '#FFFFFF', 3.5);
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(160, 118, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.arc(160, 118, 20, 0, Math.PI * 2); ctx.stroke();
    for (let s = 0; s < 12; s++) {
      const a = (s / 12) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(160, 118); ctx.lineTo(160 + Math.cos(a) * 19, 118 + Math.sin(a) * 19); ctx.stroke();
    }
    return true;
  }

  // 7. Sacred Lotus
  if (q.includes('lotus') || q.includes('kamal') || q.includes('flower')) {
    for (let i = -3; i <= 3; i++) {
      const ang = i * 0.34;
      ctx.save();
      ctx.translate(cx, cy + 44);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-24, -42, -20, -96, 0, -118 + Math.abs(i) * 10);
      ctx.bezierCurveTo(20, -96, 24, -42, 0, 0);
      drawFilledGlow(ctx, i === 0 ? '#FFFFFF' : '#E2E8F0', '#FFFFFF', 2.8);
      ctx.restore();
    }
    ctx.beginPath(); ctx.ellipse(cx, cy + 56, 72, 11, 0, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 2);
    return true;
  }

  // 8. Diwali Diya
  if (q.includes('diya') || q.includes('lamp') || q.includes('diwali') || q.includes('flame')) {
    ctx.beginPath();
    ctx.moveTo(cx - 78, cy + 16);
    ctx.quadraticCurveTo(cx, cy + 84, cx + 78, cy + 16);
    ctx.quadraticCurveTo(cx, cy + 36, cx - 78, cy + 16);
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 3);
    ctx.beginPath();
    ctx.moveTo(cx, cy - 82);
    ctx.bezierCurveTo(cx + 32, cy - 32, cx + 24, cy + 18, cx, cy + 20);
    ctx.bezierCurveTo(cx - 24, cy + 18, cx - 32, cy - 32, cx, cy - 82);
    drawFilledGlow(ctx, '#FFFFFF', '#E2E8F0', 3);
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 42);
    ctx.bezierCurveTo(cx + 12, cy - 18, cx + 8, cy + 6, cx, cy + 8);
    ctx.bezierCurveTo(cx - 8, cy + 6, cx - 12, cy - 18, cx, cy - 42);
    ctx.fill();
    return true;
  }

  // 9. Royal Crown
  if (q.includes('crown') || q.includes('king') || q.includes('queen') || q.includes('royal')) {
    ctx.beginPath();
    ctx.moveTo(cx - 86, cy + 44);
    ctx.lineTo(cx - 98, cy - 34);
    ctx.lineTo(cx - 48, cy + 4);
    ctx.lineTo(cx,      cy - 58);
    ctx.lineTo(cx + 48, cy + 4);
    ctx.lineTo(cx + 98, cy - 34);
    ctx.lineTo(cx + 86, cy + 44);
    ctx.closePath();
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 3.5);
    [-98, 0, 98].forEach((jx, idx) => {
      ctx.beginPath(); ctx.arc(cx + jx, idx === 1 ? cy - 66 : cy - 42, 9, 0, Math.PI * 2);
      drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 2);
    });
    ctx.beginPath(); ctx.rect(cx - 86, cy + 48, 172, 16);
    drawFilledGlow(ctx, '#E2E8F0', '#FFFFFF', 2.5);
    return true;
  }

  // 10. Ganesh / Elephant
  if (q.includes('ganesh') || q.includes('ganpati') || q.includes('elephant')) {
    // Crown + Ears + Head + Curved Trunk
    [-58, 58].forEach((ex) => {
      ctx.beginPath(); ctx.ellipse(cx + ex, cy + 2, 34, 46, ex > 0 ? 0.25 : -0.25, 0, Math.PI * 2);
      drawFilledGlow(ctx, '#E2E8F0', '#FFFFFF', 2.8);
    });
    ctx.beginPath(); ctx.arc(cx, cy - 4, 42, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 3);
    // Mukut crown
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy - 38); ctx.lineTo(cx, cy - 86); ctx.lineTo(cx + 26, cy - 38); ctx.closePath();
    drawFilledGlow(ctx, '#FFFFFF', '#E2E8F0', 2.5);
    // Curved Trunk
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 12);
    ctx.bezierCurveTo(cx, cy + 56, cx + 38, cy + 68, cx + 42, cy + 40);
    ctx.stroke();
    return true;
  }

  // 11. Butterfly
  if (q.includes('butterfly') || q.includes('titli')) {
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.ellipse(cx + s * 48, cy - 22, 46, 34, s * 0.4, 0, Math.PI * 2);
      drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 3);
      ctx.beginPath();
      ctx.ellipse(cx + s * 34, cy + 28, 30, 24, -s * 0.35, 0, Math.PI * 2);
      drawFilledGlow(ctx, '#E2E8F0', '#FFFFFF', 2.5);
    });
    ctx.beginPath(); ctx.ellipse(cx, cy + 4, 8, 42, 0, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', '#000000', 2);
    return true;
  }

  // 12. Eagle / Bird / Garuda / Phoenix
  if (q.includes('eagle') || q.includes('bird') || q.includes('phoenix') || q.includes('garuda')) {
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(cx + s * 42, cy - 58, cx + s * 96, cy - 68, cx + s * 124, cy - 34);
      ctx.lineTo(cx + s * 96, cy + 10);
      ctx.lineTo(cx + s * 46, cy + 18);
      ctx.closePath();
      drawFilledGlow(ctx, '#FFFFFF', '#E2E8F0', 2.5);
    });
    ctx.beginPath(); ctx.ellipse(cx, cy + 6, 16, 44, 0, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 2.5);
    return true;
  }

  // 13. Taj Mahal silhouette (for blueprint mode)
  if (q.includes('taj') || q.includes('mahal')) {
    ctx.beginPath(); ctx.rect(44, 174, 232, 18);
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 2.5);
    ctx.beginPath(); ctx.rect(cx - 56, 92, 112, 82);
    drawFilledGlow(ctx, '#E2E8F0', '#FFFFFF', 3);
    ctx.beginPath();
    ctx.moveTo(cx - 32, 92);
    ctx.bezierCurveTo(cx - 42, 62, cx - 18, 42, cx, 32);
    ctx.bezierCurveTo(cx + 18, 42, cx + 42, 62, cx + 32, 92);
    ctx.closePath();
    drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 3);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, 16); ctx.lineTo(cx, 34); ctx.stroke();
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.moveTo(cx - 22, 174); ctx.lineTo(cx - 22, 132);
    ctx.arc(cx, 132, 22, Math.PI, 0); ctx.lineTo(cx + 22, 174); ctx.closePath(); ctx.fill();
    [-92, -72, 72, 92].forEach((mx) => {
      ctx.beginPath(); ctx.rect(cx + mx - 5, 62, 10, 112);
      drawFilledGlow(ctx, '#FFFFFF', '#FFFFFF', 2);
    });
    return true;
  }

  // 14. Generic Sacred Mandala / Starburst Emblem (never raw text!)
  for (let r = 84; r >= 28; r -= 28) {
    drawStarPolygon(ctx, cx, cy, r === 84 ? 12 : 8, r, r * 0.56);
    drawFilledGlow(ctx, r === 28 ? '#FFFFFF' : (r === 56 ? '#CBD5E1' : '#FFFFFF'), '#FFFFFF', 2.8);
  }
  ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  drawFilledGlow(ctx, '#000000', '#FFFFFF', 2.5);
  return false;
}

/**
 * Normalizes any Puter AI image into a crisp high-contrast black-and-white
 * silhouette on pure #000000 background for clean 3D depth extrusion.
 */
function paintNormalizedSilhouette(imgEl, ctx, w, h) {
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d');
  octx.fillStyle = '#000000';
  octx.fillRect(0, 0, w, h);

  const iw = imgEl.naturalWidth || imgEl.width || w;
  const ih = imgEl.naturalHeight || imgEl.height || h;
  const fit = Math.min((w - 14) / iw, (h - 14) / ih);
  const dw = iw * fit;
  const dh = ih * fit;
  octx.drawImage(imgEl, (w - dw) / 2, (h - dh) / 2, dw, dh);

  const imgData = octx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Detect background brightness from image border pixels
  let borderSum = 0;
  let borderCnt = 0;
  for (let x = 0; x < w; x += 4) {
    const top = x * 4;
    const bot = ((h - 1) * w + x) * 4;
    borderSum += (data[top] + data[top + 1] + data[top + 2]) / 3;
    borderSum += (data[bot] + data[bot + 1] + data[bot + 2]) / 3;
    borderCnt += 2;
  }
  const invertBg = (borderSum / Math.max(1, borderCnt)) > 140;

  // Convert to crisp high-contrast grayscale silhouette
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const v = invertBg ? (255 - lum) : lum;
    const sharp = v > 72 ? Math.min(255, (v - 50) * 1.45) : 0;
    data[i] = data[i + 1] = data[i + 2] = sharp;
    data[i + 3] = 255;
  }
  octx.putImageData(imgData, 0, 0);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(off, 0, 0);
}

/**
 * Stage 1 Blueprint Preview:
 * Attempts Puter.js txt2img high-contrast B&W silhouette when allowAI is true,
 * backed by instant offline procedural silhouettes so Stage 1 never fails or
 * renders raw text.
 */
window.generateBlueprintPreview = function generateBlueprintPreview(allowAI = true) {
  const raw   = (document.getElementById('bpPromptInput')?.value || 'Peacock').trim();
  const c     = document.getElementById('blueprintCanvas');
  if (!c) return;
  const ctx   = c.getContext('2d');
  const token = ++_bpGenToken;

  const matchedFallback = renderProceduralSilhouette(raw, ctx, c.width, c.height);

  const badge = document.getElementById('bpStatusBadge');
  const toast = document.getElementById('statusToast');
  if (badge) {
    badge.textContent = matchedFallback ? 'SILHOUETTE READY' : 'EMBLEM READY';
    badge.className   = 'text-sky-400 font-bold';
  }
  if (toast) {
    toast.textContent = `👁️ Stage 1 preview ready for "${raw.slice(0, 24)}" — click Approve to compile 3D drones`;
  }

  const canUsePuter = allowAI
    && typeof puter !== 'undefined'
    && puter.ai
    && typeof puter.ai.txt2img === 'function';

  if (canUsePuter) {
    const aiPrompt = `minimalist high-contrast pure white silhouette of ${raw} centered on solid #000000 pitch-black background, crisp bold shapes, vector stencil style, no text, no letters, no watermark`;
    if (badge) {
      badge.textContent = 'PUTER AI GENERATING...';
      badge.className   = 'text-amber-300 font-bold animate-pulse';
    }
    if (toast) {
      toast.textContent = `✨ Puter AI generating B&W silhouette for "${raw.slice(0, 24)}"...`;
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Puter AI timeout')), 14000)
    );

    Promise.race([Promise.resolve(puter.ai.txt2img(aiPrompt)), timeoutPromise])
      .then((imgEl) => {
        if (token !== _bpGenToken || !imgEl) return;
        const applyImg = () => {
          if (token !== _bpGenToken) return;
          paintNormalizedSilhouette(imgEl, ctx, c.width, c.height);
          if (badge) {
            badge.textContent = 'AI B&W READY';
            badge.className   = 'text-emerald-400 font-bold';
          }
          if (toast) {
            toast.textContent = `✨ Puter AI silhouette ready for "${raw.slice(0, 24)}" — click Approve to fly!`;
          }
        };
        if (imgEl.complete && imgEl.naturalWidth > 0) applyImg();
        else imgEl.onload = applyImg;
      })
      .catch(() => {
        if (token !== _bpGenToken) return;
        if (badge) {
          badge.textContent = matchedFallback ? 'OFFLINE FALLBACK READY' : 'EMBLEM READY';
          badge.className   = 'text-sky-400 font-bold';
        }
        if (toast) {
          toast.textContent = `✓ Offline silhouette ready for "${raw.slice(0, 24)}" — click Approve to compile`;
        }
      });
  }
};

// -----------------------------------------------------------------------------
// 5. STAGE 2: DISTANCE-FIELD + SOBEL 3D DEPTH-EXTRUDED CLOUD COMPILER
// -----------------------------------------------------------------------------
function paletteColorAt(pal, nx, ny) {
  if (pal === 'tricolour') {
    if (ny > 0.32) return '#FF9933';
    if (ny < -0.32) return '#10B981';
    return '#FFFFFF';
  }
  if (pal === 'divine_fire') {
    return ny > 0.25 ? '#FFD700' : (ny < -0.25 ? '#FF2A85' : '#FF6D00');
  }
  if (pal === 'diamond') {
    return (Math.abs(nx) + Math.abs(ny)) < 0.7 ? '#FFFFFF' : '#7DD3FC';
  }
  // gold_cyan default
  return ny > 0.2 ? '#FFD700' : (ny < -0.3 ? '#38BDF8' : '#00E5FF');
}

function sampleStratifiedPoints(pts, targetCount, minX, maxX, minY, maxY) {
  if (!pts.length || targetCount <= 0) return [];
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const cols  = Math.max(6, Math.ceil(Math.sqrt(targetCount * (spanX / spanY))));
  const rows  = Math.max(6, Math.ceil(targetCount / cols));
  const cellW = spanX / cols;
  const cellH = spanY / rows;
  const grid  = Array.from({ length: cols * rows }, () => []);

  for (let i = 0; i < pts.length; i++) {
    const p  = pts[i];
    const gx = Math.min(cols - 1, Math.max(0, Math.floor((p.x - minX) / cellW)));
    const gy = Math.min(rows - 1, Math.max(0, Math.floor((p.y - minY) / cellH)));
    grid[gy * cols + gx].push(p);
  }

  const out = [];
  const used = new Set();
  for (let pass = 0; pass < 4 && out.length < targetCount; pass++) {
    for (let c = 0; c < grid.length && out.length < targetCount; c++) {
      const bucket = grid[c];
      if (!bucket.length) continue;
      const pick = bucket[(pass * 11 + c * 17) % bucket.length];
      const key  = `${pick.x}_${pick.y}`;
      if (!used.has(key)) {
        used.add(key);
        out.push(pick);
      }
    }
  }
  for (let i = 0; out.length < targetCount; i++) {
    out.push(pts[Math.floor((i * 0.6180339887 % 1) * pts.length)]);
  }
  return out;
}

window.compileImageTo3DCloud = function compileImageTo3DCloud(imgSource, nDrones = 2200, styleTheme = 'auto', depthAmp = 14) {
  const n = Math.max(500, Math.min(5000, Math.round(nDrones || 2200)));
  const W = 220;
  const H = 165;

  const off = document.createElement('canvas');
  off.width  = W;
  off.height = H;
  const ctx = off.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  // Preserve source aspect ratio inside (W, H) without stretching
  if (imgSource) {
    const iw = imgSource.naturalWidth || imgSource.videoWidth || imgSource.width || W;
    const ih = imgSource.naturalHeight || imgSource.height || H;
    const fit = Math.min((W - 8) / Math.max(1, iw), (H - 8) / Math.max(1, ih));
    const dw  = Math.max(1, iw * fit);
    const dh  = Math.max(1, ih * fit);
    ctx.drawImage(imgSource, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }

  const rgba = ctx.getImageData(0, 0, W, H).data;
  const lum  = new Float32Array(W * H);

  // Detect transparent-background images/SVGs vs opaque light/dark backgrounds
  let transparentPx = 0;
  for (let i = 0; i < W * H; i++) {
    if (rgba[i * 4 + 3] < 40) transparentPx++;
  }
  const useAlphaMask = transparentPx > (W * H * 0.08);

  let invert = false;
  if (!useAlphaMask) {
    let borderLum = 0;
    let borderCnt = 0;
    for (let x = 0; x < W; x++) {
      const iTop = x * 4;
      const iBot = ((H - 1) * W + x) * 4;
      borderLum += (rgba[iTop] + rgba[iTop + 1] + rgba[iTop + 2]) / 3;
      borderLum += (rgba[iBot] + rgba[iBot + 1] + rgba[iBot + 2]) / 3;
      borderCnt += 2;
    }
    for (let y = 0; y < H; y += 2) {
      const iLeft  = (y * W) * 4;
      const iRight = (y * W + (W - 1)) * 4;
      borderLum += (rgba[iLeft] + rgba[iLeft + 1] + rgba[iLeft + 2]) / 3;
      borderLum += (rgba[iRight] + rgba[iRight + 1] + rgba[iRight + 2]) / 3;
      borderCnt += 2;
    }
    invert = (borderLum / Math.max(1, borderCnt)) > 148;
  }

  let minX = W, maxX = 0, minY = H, maxY = 0;
  let colorSatSum = 0;
  let maskCount = 0;
  const mask = new Uint8Array(W * H);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx  = y * W + x;
      const p    = idx * 4;
      const r    = rgba[p];
      const g    = rgba[p + 1];
      const b    = rgba[p + 2];
      const a    = rgba[p + 3];
      const rawL = 0.299 * r + 0.587 * g + 0.114 * b;

      let active = false;
      let reliefLum = rawL;
      if (useAlphaMask) {
        active = a > 38;
        // Dark strokes on transparent PNG/SVG get strong relief so they shine bright
        reliefLum = active ? Math.max(rawL, 140) * (a / 255) : 0;
      } else {
        const v = invert ? (255 - rawL) : rawL;
        active = v > 38;
        reliefLum = v;
      }

      lum[idx] = reliefLum;
      if (active) {
        mask[idx] = 1;
        maskCount++;
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        colorSatSum += (maxC - minC) / Math.max(1, maxC);
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }

  if (maskCount < 8 || maxX <= minX || maxY <= minY) {
    return window.buildHeroFormation('lotus', n);
  }

  // 2-Pass Chamfer Distance Transform for smooth 3D volumetric depth extrusion
  const dist = new Float32Array(W * H);
  const INF  = 9999;
  for (let i = 0; i < W * H; i++) dist[i] = mask[i] ? INF : 0;

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (!mask[i]) continue;
      dist[i] = Math.min(dist[i], dist[i - 1] + 1, dist[i - W] + 1, dist[i - W - 1] + 1.414);
    }
  }
  let maxDist = 1;
  for (let y = H - 2; y >= 1; y--) {
    for (let x = W - 2; x >= 1; x--) {
      const i = y * W + x;
      if (!mask[i]) continue;
      dist[i] = Math.min(dist[i], dist[i + 1] + 1, dist[i + W] + 1, dist[i + W + 1] + 1.414);
      if (dist[i] > maxDist) maxDist = dist[i];
    }
  }

  // Separate sharp Sobel edges (45%) & brightness-relief interior (55%)
  const edgePts = [];
  const fillPts = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const idx = y * W + x;
      if (!mask[idx]) continue;
      const gx   = (x < W - 1 ? lum[idx + 1] : 0) - (x > 0 ? lum[idx - 1] : 0);
      const gy   = (y < H - 1 ? lum[idx + W] : 0) - (y > 0 ? lum[idx - W] : 0);
      const grad = Math.hypot(gx, gy);
      const p    = idx * 4;
      const pt = {
        x, y,
        dNorm:   Math.sqrt(dist[idx] / maxDist),
        lumNorm: Math.min(1, lum[idx] / 255),
        r: rgba[p], g: rgba[p + 1], b: rgba[p + 2],
      };
      if (grad > 58 || dist[idx] <= 1.8) edgePts.push(pt);
      else fillPts.push(pt);
    }
  }

  const edgeTarget = Math.min(edgePts.length, Math.round(n * 0.45));
  const fillTarget = n - edgeTarget;
  const chosen = [
    ...sampleStratifiedPoints(edgePts, edgeTarget, minX, maxX, minY, maxY),
    ...sampleStratifiedPoints(fillPts.length ? fillPts : edgePts, fillTarget, minX, maxX, minY, maxY),
  ];

  const cx   = (minX + maxX) * 0.5;
  const cy   = (minY + maxY) * 0.5;
  const span = Math.max(1, maxX - minX, maxY - minY);
  const scale = 72.0 / span;

  const avgSat = colorSatSum / Math.max(1, maskCount);
  const resolvedMode = styleTheme === 'auto'
    ? (avgSat > 0.14 ? 'original' : 'diamond')
    : styleTheme;

  return chosen.slice(0, n).map((pt, idx) => {
    const wx = (pt.x - cx) * scale;
    const wy = (cy - pt.y) * scale + 56.0;
    const nx = (pt.x - cx) / Math.max(1, (maxX - minX) * 0.5);
    const ny = (cy - pt.y) / Math.max(1, (maxY - minY) * 0.5);

    // Brightness-relief + Chamfer distance 3D depth extrusion
    const relief = 0.62 * pt.dNorm + 0.38 * pt.lumNorm;
    const sign   = (idx % 2 === 0) ? 1 : -1;
    const wz     = depthAmp > 0 ? sign * depthAmp * (0.18 + 0.82 * relief) : 0;

    let hex;
    if (resolvedMode === 'original') {
      let r = pt.r / 255;
      let g = pt.g / 255;
      let b = pt.b / 255;
      const pLum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (useAlphaMask && pLum < 0.25) {
        // Dark/black strokes on transparent PNG/SVG become crisp luminous white-cyan
        r = 0.92; g = 0.97; b = 1.0;
      } else if (invert && pLum > 0.72) {
        r = 1.0 - r * 0.1; g = 1.0 - g * 0.1; b = 1.0 - b * 0.1;
      } else if (pLum < 0.22) {
        const boost = (0.22 - pLum) + 0.14;
        r = Math.min(1, r + boost);
        g = Math.min(1, g + boost);
        b = Math.min(1, b + boost);
      }
      hex = window.AeroSampler.toHexFromRgb(r, g, b);
    } else {
      hex = paletteColorAt(resolvedMode, nx, ny);
    }
    return [+wx.toFixed(2), +wz.toFixed(2), +wy.toFixed(2), hex];
  });
};

window.compileImageElementToSlide = function compileImageElementToSlide(imgSource, label = 'Image Relief', theme = 'auto', depthAmp = 14) {
  const drones = parseInt(document.getElementById('droneManualInput')?.value, 10) || 2200;

  // Snapshot into an offscreen high-res canvas so fleet resizes re-compile cleanly
  const snap = document.createElement('canvas');
  const iw = imgSource.naturalWidth || imgSource.width || 320;
  const ih = imgSource.naturalHeight || imgSource.height || 240;
  const sc = Math.min(1, 512 / Math.max(1, iw, ih));
  snap.width  = Math.max(1, Math.round(iw * sc));
  snap.height = Math.max(1, Math.round(ih * sc));
  snap.getContext('2d').drawImage(imgSource, 0, 0, snap.width, snap.height);

  // Sync Stage 1 Blueprint Preview Canvas for visual inspection
  const bpCanvas = document.getElementById('blueprintCanvas');
  if (bpCanvas) {
    const bctx = bpCanvas.getContext('2d');
    bctx.fillStyle = '#000000';
    bctx.fillRect(0, 0, bpCanvas.width, bpCanvas.height);
    const fit = Math.min((bpCanvas.width - 14) / snap.width, (bpCanvas.height - 14) / snap.height);
    const dw  = snap.width * fit;
    const dh  = snap.height * fit;
    bctx.drawImage(snap, (bpCanvas.width - dw) / 2, (bpCanvas.height - dh) / 2, dw, dh);
  }

  const bpInput = document.getElementById('bpPromptInput');
  if (bpInput) bpInput.value = label.slice(0, 22);
  const badge = document.getElementById('bpStatusBadge');
  if (badge) {
    badge.textContent = '3D RELIEF COMPILED ✓';
    badge.className   = 'text-emerald-400 font-bold';
  }

  const cloud = window.compileImageTo3DCloud(snap, drones, theme, depthAmp);
  window.slides[window.activeSlideIdx] = {
    ...window.slides[window.activeSlideIdx],
    type: 'blueprint',
    imgSource: snap,
    imgTheme: theme,
    imgDepth: depthAmp,
    meshTransform: { rotX: 0, rotY: 0, rotZ: 0, scale: 1.0 },
    baseCloud: null,
    meshGroup: null,
    rawSamples: null,
    label: label.slice(0, 20),
    cloud,
  };
  if (typeof window.activateSlide === 'function') window.activateSlide(window.activeSlideIdx, false);
};

window.approveBlueprintToDrones = function approveBlueprintToDrones() {
  const drones   = parseInt(document.getElementById('droneManualInput')?.value, 10) || 2200;
  const pal      = document.getElementById('bpPaletteSelect')?.value || 'gold_cyan';
  const depthAmp = parseFloat(document.getElementById('bpDepthSelect')?.value ?? '14');
  const label    = (document.getElementById('bpPromptInput')?.value || 'Blueprint').trim().slice(0, 20);
  const canvas   = document.getElementById('blueprintCanvas');

  const cloud = window.compileImageTo3DCloud(canvas, drones, pal, depthAmp);
  window.slides[window.activeSlideIdx] = {
    ...window.slides[window.activeSlideIdx],
    type: 'blueprint',
    imgSource: canvas,
    imgTheme: pal,
    imgDepth: depthAmp,
    meshTransform: { rotX: 0, rotY: 0, rotZ: 0, scale: 1.0 },
    baseCloud: null,
    meshGroup: null,
    rawSamples: null,
    label,
    cloud,
  };
  const badge = document.getElementById('bpStatusBadge');
  if (badge) {
    badge.textContent = 'COMPILED ✓';
    badge.className   = 'text-emerald-400 font-bold';
  }
  if (typeof window.activateSlide === 'function') window.activateSlide(window.activeSlideIdx, false);
};

// -----------------------------------------------------------------------------
// 6. 3D SKY TYPOGRAPHY (BOLD EXTRUDED BLOCK LETTERS + ARCHED STADIUM BANNER)
// -----------------------------------------------------------------------------
window.build3DTextCloud = function build3DTextCloud(
  textStr = 'INDIA 2026',
  nDrones = 2200,
  colorTheme = 'tricolour',
  fontCss = '900 Arial, sans-serif',
  arched = true
) {
  const n   = Math.max(500, Math.min(5000, Math.round(nDrones || 2200)));
  const str = (textStr || 'INDIA 2026').trim().slice(0, 18) || 'INDIA 2026';

  const W = 560;
  const H = 160;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let fontSize = 104;
  const familyPart = fontCss.replace(/^(900|bold|italic)\s+/gi, '');
  const weightPart = fontCss.match(/^(900|bold|italic|\s)+/i)?.[0] || '900 ';
  while (fontSize > 28) {
    ctx.font = `${weightPart}${fontSize}px ${familyPart}`;
    if (ctx.measureText(str).width <= W - 36) break;
    fontSize -= 4;
  }
  ctx.fillText(str, W / 2, H / 2);

  const rgba = ctx.getImageData(0, 0, W, H).data;
  const edgePts = [];
  const bodyPts = [];
  let minX = W, maxX = 0, minY = H, maxY = 0;

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const idx = (y * W + x) * 4;
      if (rgba[idx] < 120) continue;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;

      const isEdge = rgba[idx - 4] < 120 || rgba[idx + 4] < 120
                  || rgba[idx - W * 4] < 120 || rgba[idx + W * 4] < 120;
      if (isEdge) edgePts.push({ x, y });
      else bodyPts.push({ x, y });
    }
  }

  if (!edgePts.length && !bodyPts.length) {
    return window.buildHeroFormation('taj', n);
  }

  const edgeTarget = Math.min(edgePts.length, Math.round(n * 0.42));
  const bodyTarget = n - edgeTarget;
  const chosen = [
    ...sampleStratifiedPoints(edgePts, edgeTarget, minX, maxX, minY, maxY),
    ...sampleStratifiedPoints(bodyPts.length ? bodyPts : edgePts, bodyTarget, minX, maxX, minY, maxY),
  ];

  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const targetWidth = Math.min(92, Math.max(58, str.length * 7.8));
  const scale = targetWidth / spanX;

  return chosen.slice(0, n).map((pt, idx) => {
    const ux = (pt.x - cx) / Math.max(1, spanX * 0.5); // -1 .. +1
    const uy = (cy - pt.y) / Math.max(1, spanY * 0.5); // -1 .. +1

    // 3D Block Letter Thickness (front face, back face, extruded side slices)
    const slice = (idx % 4) / 3 - 0.5; // -0.5 .. +0.5
    const extrudeZ = slice * 5.2;

    let wx, wy, wz;
    if (arched) {
      // Sweeping stadium arc curvature in X/Z + slight rainbow rise in Y
      const arcAngle = ux * 0.52;
      const rad = targetWidth * 1.15;
      wx = Math.sin(arcAngle) * (rad + extrudeZ);
      wz = (Math.cos(arcAngle) * (rad + extrudeZ)) - rad;
      wy = (cy - pt.y) * scale + Math.cos(ux * 1.1) * 5.0 + 54.0;
    } else {
      wx = (pt.x - cx) * scale;
      wy = (cy - pt.y) * scale + 56.0;
      wz = extrudeZ;
    }

    let hex = '#FFFFFF';
    if (colorTheme === 'tricolour') {
      hex = uy > 0.25 ? '#FF9933' : (uy < -0.25 ? '#10B981' : '#FFFFFF');
    } else if (colorTheme === 'gold') {
      hex = Math.abs(slice) > 0.35 ? '#F59E0B' : '#FFD700';
    } else if (colorTheme === 'cyan') {
      hex = Math.abs(slice) > 0.35 ? '#0284C7' : '#00E5FF';
    } else if (colorTheme === 'pink') {
      hex = Math.abs(slice) > 0.35 ? '#DB2777' : '#FF2A85';
    } else if (colorTheme === 'white') {
      hex = Math.abs(slice) > 0.35 ? '#BAE6FD' : '#FFFFFF';
    }

    return [+wx.toFixed(2), +wz.toFixed(2), +wy.toFixed(2), hex];
  });
};

// -----------------------------------------------------------------------------
// 7. SYMMETRY SKY DRAW PAD & CTRL+V CLIPBOARD PASTE
// -----------------------------------------------------------------------------
let _drawColor = '#FFD700';
let _isDrawing = false;
let _lastDrawPt = null;

window.setDrawColor = function setDrawColor(hex) {
  _drawColor = hex;
};

window.initSkyDrawPad = function initSkyDrawPad() {
  const c = document.getElementById('skyDrawCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, c.width, c.height);

  function getPos(ev) {
    const rect = c.getBoundingClientRect();
    const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
    const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
    return {
      x: ((clientX - rect.left) / Math.max(1, rect.width)) * c.width,
      y: ((clientY - rect.top)  / Math.max(1, rect.height)) * c.height,
    };
  }

  function paintSegment(fromPt, toPt) {
    ctx.strokeStyle = _drawColor;
    ctx.fillStyle   = _drawColor;
    ctx.lineWidth   = 10;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    const drawStroke = (x1, y1, x2, y2) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x2, y2, 5, 0, Math.PI * 2);
      ctx.fill();
    };

    drawStroke(fromPt.x, fromPt.y, toPt.x, toPt.y);
    const mirror = document.getElementById('mirrorDrawChk')?.checked;
    if (mirror) {
      drawStroke(c.width - fromPt.x, fromPt.y, c.width - toPt.x, toPt.y);
    }
  }

  const startDraw = (ev) => {
    _isDrawing = true;
    const p = getPos(ev);
    _lastDrawPt = p;
    paintSegment(p, p);
  };
  const moveDraw = (ev) => {
    if (!_isDrawing) return;
    ev.preventDefault();
    const p = getPos(ev);
    paintSegment(_lastDrawPt || p, p);
    _lastDrawPt = p;
  };
  const endDraw = () => {
    _isDrawing = false;
    _lastDrawPt = null;
  };

  c.addEventListener('mousedown', startDraw);
  c.addEventListener('mousemove', moveDraw);
  window.addEventListener('mouseup', endDraw);
  c.addEventListener('touchstart', startDraw, { passive: true });
  c.addEventListener('touchmove', moveDraw, { passive: false });
  window.addEventListener('touchend', endDraw);
};

window.clearSkyDrawPad = function clearSkyDrawPad() {
  const c = document.getElementById('skyDrawCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, c.width, c.height);
};

window.sendSkyDrawingToDrones = function sendSkyDrawingToDrones() {
  const c      = document.getElementById('skyDrawCanvas');
  const drones = parseInt(document.getElementById('droneManualInput')?.value, 10) || 2200;
  const cloud  = window.compileImageTo3DCloud(c, drones, 'original', 10);
  window.slides[window.activeSlideIdx] = {
    ...window.slides[window.activeSlideIdx],
    type: 'custom_draw',
    imgSource: c,
    imgTheme: 'original',
    imgDepth: 10,
    meshTransform: { rotX: 0, rotY: 0, rotZ: 0, scale: 1.0 },
    baseCloud: null,
    meshGroup: null,
    rawSamples: null,
    label: 'Custom Sky Art',
    cloud,
  };
  if (typeof window.activateSlide === 'function') window.activateSlide(window.activeSlideIdx, false);
};

// Global Ctrl+V Clipboard Image/SVG-to-3D-Drone Compiler
window.addEventListener('paste', (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (!file) continue;
      if (typeof window.handleUniversalFileUpload === 'function') {
        window.handleUniversalFileUpload(file, 'Pasted Image');
      } else {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          window.compileImageElementToSlide(img, 'Pasted Image', 'auto', 14);
        };
        img.src = url;
      }
      return;
    }
  }

  // Also support pasting raw <svg> markup when not typing inside an input
  const activeTag = document.activeElement?.tagName;
  if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
    const plain = e.clipboardData.getData('text/plain') || '';
    if (plain.trim().startsWith('<svg')) {
      const svgFile = new File([plain], 'pasted_vector.svg', { type: 'image/svg+xml' });
      if (typeof window.handleUniversalFileUpload === 'function') {
        window.handleUniversalFileUpload(svgFile, 'Pasted SVG');
      }
    }
  }
});
