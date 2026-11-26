// =============================================================================
// formations.js — AeroGrid Studio
// Blueprint preview, Sobel-edge 3D compiler, Hero Vault formations,
// 3D typography builder, Sky-draw pad helpers.
// All functions exposed on window so index.html inline handlers work.
// =============================================================================

'use strict';

// ---------------------------------------------------------------------------
// Shared state (declared here, consumed by three-engine.js)
// ---------------------------------------------------------------------------
window.slides        = [];
window.activeSlideIdx = 0;

window.HERO_VAULT = [
  { id: 'taj',     name: 'Taj Mahal',       tag: 'HERITAGE',  icon: '🕌' },
  { id: 'trishul', name: 'Shiva Trishul',   tag: 'DIVINE',    icon: '🔱' },
  { id: 'heart',   name: 'Beating 3D Heart',tag: 'WEDDING',   icon: '❤️' },
  { id: 'rings',   name: 'Wedding Rings',   tag: 'WEDDING',   icon: '💍' },
  { id: 'globe',   name: '3D Earth Globe',  tag: 'GLOBAL',    icon: '🌍' },
  { id: 'rocket',  name: 'ISRO Rocket',     tag: 'AEROSPACE', icon: '🚀' },
];

// ---------------------------------------------------------------------------
// 1. BLUEPRINT PREVIEW (Stage 1)
// ---------------------------------------------------------------------------
window.setBpPrompt = function setBpPrompt(txt, pal) {
  document.getElementById('bpPromptInput').value = txt;
  if (pal) document.getElementById('bpPaletteSelect').value = pal;
  generateBlueprintPreview();
};

window.generateBlueprintPreview = function generateBlueprintPreview() {
  const raw = (document.getElementById('bpPromptInput').value || 'INDIA').trim();
  const pal = document.getElementById('bpPaletteSelect').value;
  const c   = document.getElementById('blueprintCanvas');
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const q  = raw.toLowerCase();
  const cx = 160, cy = 120;
  const c1 = pal === 'tricolour' ? '#FF9933' : (pal === 'divine_fire' ? '#FFD700' : (pal === 'diamond' ? '#FFFFFF' : '#FFD700'));
  const c2 = pal === 'tricolour' ? '#FFFFFF'  : (pal === 'divine_fire' ? '#FF2A85' : (pal === 'diamond' ? '#38BDF8' : '#00E5FF'));
  const c3 = pal === 'tricolour' ? '#10B981'  : (pal === 'divine_fire' ? '#FF6D00' : '#FFFFFF');

  if (q.includes('india') || q.includes('map') || q.includes('bharat')) {
    const pts = [
      [148,22],[164,26],[174,42],[168,56],[186,68],[218,72],
      [246,62],[262,74],[248,92],[234,88],[214,96],[206,118],
      [184,146],[166,186],[156,216],[146,188],[130,148],[116,122],
      [94,114],[90,98],[114,92],[126,72],[136,48],
    ];
    ctx.lineWidth = 4;
    for (let i = 0; i < pts.length; i++) {
      const [x1,y1] = pts[i], [x2,y2] = pts[(i+1) % pts.length];
      const avgY = (y1 + y2) / 2;
      ctx.strokeStyle = avgY < 85 ? c1 : (avgY < 145 ? c2 : c3);
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    }
    ctx.strokeStyle = '#38BDF8'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(160,118,20,0,Math.PI*2); ctx.stroke();
    for (let k = 0; k < 12; k++) {
      const a = (k/12)*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(160,118); ctx.lineTo(160+19*Math.cos(a),118+19*Math.sin(a)); ctx.stroke();
    }
  } else if (q.includes('trishul') || q.includes('shiv')) {
    ctx.strokeStyle = c2; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx,22); ctx.lineTo(cx,218); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,20); ctx.lineTo(cx-12,54); ctx.lineTo(cx+12,54); ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = c1; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx-46,36); ctx.quadraticCurveTo(cx-52,88,cx,88);
    ctx.quadraticCurveTo(cx+52,88,cx+46,36); ctx.stroke();
    ctx.strokeStyle = c3; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx-24,134); ctx.lineTo(cx+24,158); ctx.lineTo(cx+24,134); ctx.lineTo(cx-24,158); ctx.closePath(); ctx.stroke();
  } else if (q.includes('lotus') || q.includes('flower') || q.includes('mandala')) {
    for (let layer = 0; layer < 3; layer++) {
      const petals = 8 + layer*4, r = 42 + layer*24;
      ctx.strokeStyle = layer === 0 ? c1 : (layer === 1 ? c2 : c3);
      ctx.lineWidth = 3;
      for (let k = 0; k < petals; k++) {
        const a = (k/petals)*Math.PI*2;
        ctx.beginPath();
        ctx.ellipse(cx+Math.cos(a)*(r*0.55), cy+Math.sin(a)*(r*0.55), r*0.45, 11, a, 0, Math.PI*2);
        ctx.stroke();
      }
    }
  } else if (q.includes('taj') || q.includes('palace') || q.includes('temple') || q.includes('mandir')) {
    ctx.strokeStyle = c1; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx,82,34,Math.PI,0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,26); ctx.lineTo(cx,48); ctx.stroke();
    ctx.strokeStyle = c2; ctx.lineWidth = 3.5;
    ctx.strokeRect(cx-56,84,112,92);
    ctx.beginPath(); ctx.arc(cx,176,26,Math.PI,0); ctx.stroke();
    [cx-88,cx-72,cx+72,cx+88].forEach((mx,idx) => {
      ctx.strokeStyle = idx%2===0 ? c1 : c3;
      ctx.beginPath(); ctx.moveTo(mx,56); ctx.lineTo(mx,176); ctx.stroke();
    });
    ctx.strokeStyle = c3; ctx.beginPath(); ctx.moveTo(45,178); ctx.lineTo(275,178); ctx.stroke();
  } else if (q.includes('crown') || q.includes('king') || q.includes('royal')) {
    ctx.strokeStyle = c1; ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(68,174); ctx.lineTo(56,86); ctx.lineTo(108,126);
    ctx.lineTo(cx,62); ctx.lineTo(212,126); ctx.lineTo(264,86);
    ctx.lineTo(252,174); ctx.closePath(); ctx.stroke();
    [56,cx,264].forEach(jx => {
      ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(jx,jx===cx?54:78,6,0,Math.PI*2); ctx.fill();
    });
  } else if (q.includes('diya') || q.includes('lamp') || q.includes('flame')) {
    ctx.strokeStyle = c3; ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.arc(cx,134,68,0.1*Math.PI,0.9*Math.PI); ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = c1; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx,42); ctx.quadraticCurveTo(cx+28,86,cx,118); ctx.quadraticCurveTo(cx-28,86,cx,42); ctx.stroke();
  } else {
    ctx.strokeStyle = c1; ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI*2; a += 0.05) {
      const rr = 92 + Math.sin(a*16)*6;
      const x = cx + rr*Math.cos(a), y = cy + rr*Math.sin(a);
      a === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = c2; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx,cy,78,0,Math.PI*2); ctx.stroke();
    ctx.font = '900 28px Arial, sans-serif';
    ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(raw.toUpperCase().slice(0,14), cx, cy);
  }

  document.getElementById('bpStatusBadge').textContent = 'PREVIEW READY';
  document.getElementById('bpStatusBadge').className   = 'text-sky-400 font-bold';
  document.getElementById('statusToast').textContent   = `👁️ Blueprint ready for "${raw.slice(0,22)}" — click 'Approve & Compile' to fly!`;
};

// ---------------------------------------------------------------------------
// 2. STAGE 2: APPROVE & COMPILE TO 3D DRONES
// ---------------------------------------------------------------------------
window.approveBlueprintToDrones = function approveBlueprintToDrones() {
  const drones   = parseInt(document.getElementById('droneManualInput').value, 10) || 2200;
  const pal      = document.getElementById('bpPaletteSelect').value;
  const depthAmp = parseFloat(document.getElementById('bpDepthSelect').value);
  const label    = (document.getElementById('bpPromptInput').value || 'Blueprint').trim().slice(0,20);
  const canvas   = document.getElementById('blueprintCanvas');

  const cloud = compileImageTo3DCloud(canvas, drones, pal, depthAmp);
  window.slides[window.activeSlideIdx] = {
    ...window.slides[window.activeSlideIdx],
    type: 'blueprint', label, cloud,
  };
  document.getElementById('bpStatusBadge').textContent = 'COMPILED ✓';
  document.getElementById('bpStatusBadge').className   = 'text-emerald-400 font-bold';
  if (typeof window.activateSlide === 'function') window.activateSlide(window.activeSlideIdx, false);
};

// ---------------------------------------------------------------------------
// 3. SOBEL EDGE + 3D DEPTH COMPILER
// ---------------------------------------------------------------------------
window.compileImageTo3DCloud = function compileImageTo3DCloud(imgSource, nDrones, styleTheme = 'gold_cyan', depthAmp = 14) {
  const w = 260, h = 220;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h);

  const iw = imgSource.width || w, ih = imgSource.height || h;
  const fit = Math.min((w-16)/iw, (h-16)/ih);
  const dw = iw*fit, dh = ih*fit;
  ctx.drawImage(imgSource, (w-dw)/2, (h-dh)/2, dw, dh);

  const data = ctx.getImageData(0,0,w,h).data;
  const cornerLum = (data[0]+data[1]+data[2]+data[(w-1)*4]+data[(w-1)*4+1]+data[(w-1)*4+2])/6;
  const isLightBg = cornerLum > 165;

  const lumGrid = new Float32Array(w*h);
  for (let i = 0; i < w*h; i++) {
    const r=data[i*4], g=data[i*4+1], b=data[i*4+2];
    const rawL = 0.299*r + 0.587*g + 0.114*b;
    lumGrid[i] = isLightBg ? (255-rawL) : rawL;
  }

  const edgePts=[], fillPts=[];
  let minX=w, maxX=0, minY=h, maxY=0;
  for (let y=2; y<h-2; y+=2) {
    for (let x=2; x<w-2; x+=2) {
      const idx = y*w+x;
      const lum = lumGrid[idx];
      if (lum < 34) continue;
      const gx = -lumGrid[idx-w-1]+lumGrid[idx-w+1]-2*lumGrid[idx-1]+2*lumGrid[idx+1]-lumGrid[idx+w-1]+lumGrid[idx+w+1];
      const gy = -lumGrid[idx-w-1]-2*lumGrid[idx-w]-lumGrid[idx-w+1]+lumGrid[idx+w-1]+2*lumGrid[idx+w]+lumGrid[idx+w+1];
      const edgeMag = Math.hypot(gx, gy);
      const pIdx = idx*4;
      const r=data[pIdx], g=data[pIdx+1], b=data[pIdx+2];
      const item = [x,y,lum,r,g,b,edgeMag];
      if (edgeMag > 130) edgePts.push(item); else fillPts.push(item);
      if (x<minX) minX=x; if (x>maxX) maxX=x;
      if (y<minY) minY=y; if (y>maxY) maxY=y;
    }
  }

  const combined = [...edgePts, ...fillPts];
  if (combined.length < 20) return build3DTextCloud('AEROGRID', nDrones, 'gold');

  const midX=(minX+maxX)/2, midY=(minY+maxY)/2;
  const spanX=Math.max(1,maxX-minX), spanY=Math.max(1,maxY-minY);
  const scale=Math.min(104/spanX, 68/spanY);

  const edgeBudget=Math.min(edgePts.length, Math.floor(nDrones*0.65));
  const fillBudget=nDrones-edgeBudget;
  const selected=[];
  for (let i=0; i<edgeBudget; i++) selected.push(edgePts[Math.floor((i/Math.max(1,edgeBudget))*edgePts.length)]);
  const fillPool=fillPts.length>0?fillPts:edgePts;
  for (let i=0; i<fillBudget; i++) selected.push(fillPool[Math.floor((i/Math.max(1,fillBudget))*fillPool.length)]);

  const out=[];
  for (let i=0; i<nDrones; i++) {
    const [px,py,lum,r,g,b,edgeMag]=selected[i%selected.length];
    const normX=(px-minX)/spanX, normY=(py-minY)/spanY;
    const archDepth=Math.cos((normX-0.5)*Math.PI)*(depthAmp*0.65);
    const lumDepth=((lum/255)-0.35)*(depthAmp*0.55);
    const maxC=Math.max(r,g,b), minC=Math.min(r,g,b);
    const isColorful=!isLightBg&&(maxC-minC>45);
    let hex;
    if (isColorful) {
      hex=`#${Math.min(255,r+25).toString(16).padStart(2,'0')}${Math.min(255,g+25).toString(16).padStart(2,'0')}${Math.min(255,b+25).toString(16).padStart(2,'0')}`;
    } else if (styleTheme==='tricolour') {
      hex=normY<0.34?'#FF9933':(normY<0.67?'#FFFFFF':'#10B981');
    } else if (styleTheme==='divine_fire') {
      hex=edgeMag>160?'#FFD700':(normY<0.5?'#FF6D00':'#FF2A85');
    } else if (styleTheme==='diamond') {
      hex=edgeMag>160?'#FFFFFF':'#38BDF8';
    } else {
      hex=edgeMag>150?'#FFD700':(lum>140?'#FFFFFF':'#00E5FF');
    }
    out.push([+((px-midX)*scale).toFixed(2), +(archDepth+lumDepth).toFixed(2), +(66-(py-midY)*scale).toFixed(2), hex]);
  }
  return out;
};

// ---------------------------------------------------------------------------
// 4. HERO VAULT FORMATIONS
// ---------------------------------------------------------------------------
function allocateParts(parts, nDrones) {
  const out=[]; let rem=nDrones;
  parts.forEach((p, idx) => {
    const count=idx===parts.length-1?rem:Math.max(1,Math.round(nDrones*p.w));
    rem-=count;
    if (!p.pts||p.pts.length===0) return;
    for (let i=0; i<count; i++) {
      const j=Math.floor((i/count)*p.pts.length);
      const pt=p.pts[j];
      out.push([pt[0],pt[1],pt[2],pt[3]||p.col]);
    }
  });
  return out;
}

window.buildHeroFormation = function buildHeroFormation(id, nDrones) {
  if (id === 'taj') {
    const waterPool = [], plinth = [], mausoleum = [], chhatris = [], mainDome = [], minarets = [];

    // 1. Cyan Charbagh Water-Pool Reflection Base (extending forward from plinth)
    for (let y = 24; y <= 50; y += 2.6) {
      for (let x = -11; x <= 11; x += 2.2) {
        const isBorder = Math.abs(x) >= 9.5 || y <= 25.5 || y >= 48.5;
        const isFountain = Math.abs(x) < 2.2 && Math.abs(y - 37) < 2.2;
        if (isBorder || isFountain || ((Math.round(x) + Math.round(y)) % 4 === 0)) {
          waterPool.push([x, y, 33.5, isFountain ? '#FFFFFF' : (isBorder ? '#38BDF8' : '#00E5FF')]);
        }
      }
    }

    // 2. Wide Marble Plinth Terrace (x: -48..48, y: -22..22, z: 36..43)
    for (let x = -48; x <= 48; x += 3.0) {
      for (let y = -22; y <= 22; y += 3.5) {
        const isEdge = Math.abs(x) >= 45 || Math.abs(y) >= 19.5;
        plinth.push([x, y, isEdge ? 43 : 36, isEdge ? '#FFFDF7' : '#CBD5E1']);
        if (isEdge) plinth.push([x, y, 39.5, '#E2E8F0']);
      }
    }
    // Front plinth stair balustrade & cornice
    for (let x = -10; x <= 10; x += 2.0) {
      plinth.push([x, 22, 36, '#FFD700'], [x, 22, 43, '#FFD700']);
    }

    // 3. Main Mausoleum Facade, Chamfered Corners & Central Pishtaq Arch (z: 43..70)
    const addArchWall = (isXWall, sign, fixedCoord) => {
      for (let z = 43; z <= 70; z += 1.8) {
        for (let u = -22; u <= 22; u += 2.0) {
          const inCentralIwan = Math.abs(u) < 8.5 && z < 65 && (Math.pow(u / 8.5, 2) + Math.pow((z - 43) / 22, 2) < 1);
          const inSideAlcove  = Math.abs(u) > 11.5 && Math.abs(u) < 19.5 && ((z > 44 && z < 54) || (z > 57 && z < 67));
          if (!inCentralIwan && !inSideAlcove) {
            const isGoldTrim = Math.abs(u) <= 9.5 && Math.abs(z - 69.5) < 1.2;
            const col = isGoldTrim ? '#FFD700' : '#FFFDF7';
            mausoleum.push(isXWall ? [fixedCoord, u * 0.72, z, col] : [u, fixedCoord, z, col]);
          }
        }
      }
      // Tall Central Pishtaq Portal Frame rising above roof (z: 70..75)
      if (!isXWall) {
        for (let z = 70; z <= 75; z += 1.6) {
          for (let u = -10; u <= 10; u += 2.0) {
            if (Math.abs(u) >= 8.5 || z >= 73.5) {
              mausoleum.push([u, fixedCoord + sign * 1.2, z, z >= 73.5 ? '#FFD700' : '#FFFDF7']);
            }
          }
        }
      }
    };
    addArchWall(false,  1,  16); // Front facade
    addArchWall(false, -1, -16); // Back facade
    addArchWall(true,   1,  22); // Right facade
    addArchWall(true,  -1, -22); // Left facade

    // 4. Grand Central Onion Dome + Drum + Lotus Finial Spire (z: 70..112)
    // Cylindrical drum
    for (let z = 70; z <= 76; z += 2.0) {
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        mainDome.push([14.2 * Math.cos(a), 14.2 * Math.sin(a), z, z >= 75 ? '#FFD700' : '#F8FAFC']);
      }
    }
    // True bulbous onion dome surface
    for (let i = 0; i < 460; i++) {
      const u = i / 460;
      const th = (i * 2.39996) % (Math.PI * 2);
      const r = 15.8 * Math.sin(u * Math.PI * 0.86 + 0.12) * (1 + 0.18 * Math.sin(u * Math.PI * 1.15));
      const z = 76 + u * 24;
      const col = u > 0.88 ? '#FFD700' : (u < 0.08 ? '#FDE047' : '#FFFDF7');
      mainDome.push([r * Math.cos(th), r * Math.sin(th), z, col]);
    }
    // Lotus base & Imperial Gold Kalash Finial Spire (z: 100..112)
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      mainDome.push([2.8 * Math.cos(a), 2.8 * Math.sin(a), 100.5, '#FFD700']);
    }
    for (let z = 101; z <= 112; z += 1.0) {
      const kalashR = (Math.abs(z - 103.5) < 0.8 || Math.abs(z - 106.5) < 0.8) ? 1.2 : 0.0;
      mainDome.push([kalashR, 0, z, '#FFD700']);
      if (kalashR > 0) mainDome.push([-kalashR, 0, z, '#FFD700'], [0, kalashR, z, '#FFD700']);
    }

    // 5. Four Surrounding Chhatri Domes on roof corners (z: 70..83)
    [[-15, 10], [15, 10], [-15, -10], [15, -10]].forEach(([cx, cy]) => {
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        for (let z = 70; z <= 75; z += 1.6) {
          chhatris.push([cx + 2.8 * Math.cos(a), cy + 2.8 * Math.sin(a), z, '#E2E8F0']);
        }
      }
      for (let u = 0; u <= 1; u += 0.2) {
        const r = 3.8 * Math.sin(u * Math.PI * 0.88 + 0.1);
        const z = 75 + u * 5.5;
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          chhatris.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z, u > 0.7 ? '#FFD700' : '#FFFDF7']);
        }
      }
      chhatris.push([cx, cy, 82.5, '#FFD700']);
    });

    // 6. Four Tall Slender Corner Minarets with 3 Tiered Balconies (z: 43..96)
    [[-42, 18], [42, 18], [-42, -18], [42, -18]].forEach(([mx, my]) => {
      for (let z = 43; z <= 88; z += 1.6) {
        const rad = 2.9 - (z - 43) * 0.024;
        const isBalcony = Math.abs(z - 57) < 1.1 || Math.abs(z - 71) < 1.1 || Math.abs(z - 85) < 1.1;
        const rUse = isBalcony ? rad + 1.35 : rad;
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          minarets.push([mx + rUse * Math.cos(a), my + rUse * Math.sin(a), z, isBalcony ? '#FFD700' : '#FFFDF7']);
        }
      }
      // Minaret cupola + finial
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        minarets.push([mx + 2.0 * Math.cos(a), my + 2.0 * Math.sin(a), 90.5, '#FFFDF7']);
      }
      minarets.push([mx, my, 93.5, '#FFD700'], [mx, my, 96.0, '#FFD700']);
    });

    return allocateParts([
      { pts: waterPool, col: '#00E5FF', w: 0.08 },
      { pts: plinth,    col: '#E2E8F0', w: 0.14 },
      { pts: mausoleum, col: '#FFFDF7', w: 0.28 },
      { pts: chhatris,  col: '#FFFDF7', w: 0.10 },
      { pts: mainDome,  col: '#FFFDF7', w: 0.22 },
      { pts: minarets,  col: '#FFFDF7', w: 0.18 },
    ], nDrones);
  }

  if (id === 'trishul') {
    const shaft = [], rudraksha = [], collar = [], centralBlade = [], outerProngs = [], damru = [];

    // 1. Vertical Cylindrical Staff (z: 24..80)
    for (let z = 24; z <= 80; z += 1.4) {
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const r = 1.35;
        shaft.push([r * Math.cos(a), r * Math.sin(a), z, z > 74 ? '#FFD700' : '#E2E8F0']);
      }
    }

    // 2. Subtle Rudraksha Bead Rings along the Staff
    [32, 42, 68, 75].forEach(rz => {
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        rudraksha.push([2.3 * Math.cos(a), 2.3 * Math.sin(a), rz, '#D97706']);
        rudraksha.push([2.5 * Math.cos(a + 0.15), 2.5 * Math.sin(a + 0.15), rz + 0.8, '#B45309']);
      }
    });

    // 3. Ornate Crescent Collar at Base of Prongs (z: 78..83)
    for (let s = -24; s <= 24; s++) {
      const u = s / 24;
      const x = u * 11.5;
      const z = 78.5 + u * u * 4.5;
      collar.push([x, 1.4, z, '#FFD700'], [x, -1.4, z, '#FFD700']);
      if (Math.abs(s) % 3 === 0) collar.push([x, 0, z - 0.8, '#00E5FF']);
    }

    // 4. Tall Vertical Central Spearhead Blade (#FFD700 gold, z: 80..114)
    for (let s = 0; s <= 72; s++) {
      const u = s / 72;
      const z = 80 + u * 34;
      const halfW = u < 0.24 ? 1.4 + (u / 0.24) * 3.6 : 5.0 * Math.pow(1 - (u - 0.24) / 0.76, 0.85);
      const ridgeY = 1.9 * (1 - u * 0.85);
      centralBlade.push(
        [-halfW, 0, z, '#FFD700'],
        [ halfW, 0, z, '#FFD700'],
        [0,  ridgeY, z, '#FEF08A'],
        [0, -ridgeY, z, '#FEF08A']
      );
    }

    // 5. Two Symmetrical Sweeping Outer Curved Prongs Tapering to Sharp Points
    [-1, 1].forEach(side => {
      for (let s = 0; s <= 90; s++) {
        const u = s / 90;
        // Sweeps out gracefully from collar (x=+-3.5, z=80) to wide curve (x=+-20.5, z=93) and tapers inward to razor tip (x=+-15.5, z=109)
        const x = side * (3.5 + Math.sin(u * Math.PI * 0.82) * 17.0 - (u > 0.72 ? (u - 0.72) * 14.0 : 0));
        const z = 79.5 + u * 29.5 - Math.sin(u * Math.PI) * 3.8;
        const thickness = 1.65 * (1 - u * 0.90);
        outerProngs.push(
          [x,  thickness, z, '#FFD700'],
          [x, -thickness, z, '#FFD700'],
          [x - side * thickness * 1.1, 0, z + 0.4, u > 0.65 ? '#FFFFFF' : '#00E5FF']
        );
      }
    });

    // 6. 3D Hourglass Damru Tied with Crimson/Gold Cord Mid-Shaft (z: 56)
    const tilt = -0.30;
    const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    for (let s = -9.5; s <= 9.5; s += 0.95) {
      const r = 1.9 + Math.pow(Math.abs(s) / 9.5, 1.15) * 4.6;
      const isCord = Math.abs(s) < 2.4;
      const isDrumhead = Math.abs(s) > 8.6;
      const col = isCord ? (Math.round(s * 3) % 2 === 0 ? '#FF2A85' : '#FFD700') : (isDrumhead ? '#FEF3C7' : '#D97706');
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        const lx = s;
        const ly = r * Math.sin(a);
        const lz = r * Math.cos(a);
        const rx = lx * cosT - lz * sinT;
        const rz = lx * sinT + lz * cosT + 56;
        damru.push([rx, ly, rz, col]);
      }
    }
    // Crimson/Gold knotted cord hanging from Damru waist
    for (let d = 0; d <= 10; d++) {
      damru.push([1.8 + Math.sin(d * 0.4) * 1.2, 2.2, 54 - d * 1.1, d % 2 === 0 ? '#FF2A85' : '#FFD700']);
      damru.push([-1.8 - Math.sin(d * 0.4) * 1.2, -2.2, 54 - d * 1.1, d % 2 === 0 ? '#FFD700' : '#FF2A85']);
    }

    return allocateParts([
      { pts: shaft,        col: '#E2E8F0', w: 0.16 },
      { pts: rudraksha,    col: '#D97706', w: 0.08 },
      { pts: collar,       col: '#FFD700', w: 0.08 },
      { pts: centralBlade, col: '#FFD700', w: 0.24 },
      { pts: outerProngs,  col: '#FFD700', w: 0.24 },
      { pts: damru,        col: '#FF2A85', w: 0.20 },
    ], nDrones);
  }

  if (id === 'heart') {
    // Volumetric 3D parametric heart with smooth front/back shells
    const pts = [];
    for (let layer = 0; layer < 9; layer++) {
      const frac = layer / 8;
      const sc = 1.72 * Math.sin(frac * Math.PI * 0.85 + 0.25);
      const hy = (frac - 0.5) * 18.0;
      const col = (frac > 0.35 && frac < 0.65) ? '#FF2A85' : (layer % 2 === 0 ? '#FF6D00' : '#FFD700');
      for (let k = 0; k < 110; k++) {
        const t = (k / 110) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3) * sc;
        const hz = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * sc + 66;
        pts.push([hx, hy, hz, col]);
      }
    }
    return allocateParts([{ pts, col: '#FF2A85', w: 1.0 }], nDrones);
  }

  if (id === 'rings') {
    const band1 = [], band2 = [], prongs = [], diamond = [];

    // Helper: Thick beveled 3D comfort-fit torus band
    const buildTorusBand = (out, cx, cy, cz, R, rTube, rotXDeg, rotYDeg, rotZDeg, mainCol, bevelCol) => {
      const rx = rotXDeg * Math.PI / 180;
      const ry = rotYDeg * Math.PI / 180;
      const rz = rotZDeg * Math.PI / 180;
      const cosX = Math.cos(rx), sinX = Math.sin(rx);
      const cosY = Math.cos(ry), sinY = Math.sin(ry);
      const cosZ = Math.cos(rz), sinZ = Math.sin(rz);

      for (let i = 0; i < 84; i++) {
        const u = (i / 84) * Math.PI * 2;
        const cu = Math.cos(u), su = Math.sin(u);
        for (let j = 0; j < 10; j++) {
          const v = (j / 10) * Math.PI * 2;
          // Beveled comfort-fit profile: slightly wider/flatter outer edge
          const radOffset = rTube * (1 - 0.14 * Math.pow(Math.cos(v), 2));
          const lx = (R + radOffset * Math.cos(v)) * cu;
          const lz = (R + radOffset * Math.cos(v)) * su;
          const ly = radOffset * 1.25 * Math.sin(v);

          // Rotate X -> Y -> Z
          const y1 = ly * cosX - lz * sinX;
          const z1 = ly * sinX + lz * cosX;
          const x2 = lx * cosY + z1 * sinY;
          const z2 = -lx * sinY + z1 * cosY;
          const x3 = x2 * cosZ - y1 * sinZ;
          const y3 = x2 * sinZ + y1 * cosZ;

          const isBevelEdge = Math.abs(Math.sin(v)) > 0.78;
          out.push([cx + x3, cy + y3, cz + z2, isBevelEdge ? bevelCol : mainCol]);
        }
      }
    };

    // 1. Primary Rose-Gold Band (centered at -9, 0, 58, upright in XZ plane so crown apex is at (-9, 0, 81))
    buildTorusBand(band1, -9, 0, 58, 20, 3.2, 0, 0, 0, '#FFD700', '#F59E0B');

    // 2. Secondary Platinum Band (centered at +9, 0, 58, tilted 35° around X so it cleanly interlocks through Band 1's hole)
    buildTorusBand(band2,  9, 0, 58, 20, 3.1, 35, 0, 90, '#E2E8F0', '#FFFFFF');

    // 3. 4-Prong Cathedral Setting on Crown Apex (-9, 0, 81)
    const apexX = -9, apexY = 0, culetZ = 82.5, girdleZ = 90.0, tableZ = 93.8;
    [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4].forEach(ang => {
      for (let s = 0; s <= 10; s++) {
        const u = s / 10;
        const pr = 2.0 + u * 5.1;
        const pz = 80.5 + u * 10.6;
        prongs.push([apexX + pr * Math.cos(ang), apexY + pr * Math.sin(ang), pz, '#FFFFFF']);
      }
    });

    // 4. Upright Brilliant-Cut Solitaire Diamond:
    //    - Pointed pavilion cone pointing DOWN into the ring band (z: 82.5 -> 90.0)
    //    - Wide girdle at z = 90.0 (r = 6.8)
    //    - Crown tapering to flat wide table facing UP at z = 93.8 (r = 4.2)
    for (let s = 0; s <= 12; s++) {
      const u = s / 12;
      const r = 0.25 + u * 6.55;
      const z = culetZ + u * (girdleZ - culetZ);
      const facets = 16;
      for (let k = 0; k < facets; k++) {
        const a = (k / facets) * Math.PI * 2;
        const col = (k % 2 === 0) ? '#00E5FF' : '#FFFFFF';
        diamond.push([apexX + r * Math.cos(a), apexY + r * Math.sin(a), z, col]);
      }
    }
    // Crown facets (girdle -> flat table)
    for (let s = 1; s <= 6; s++) {
      const u = s / 6;
      const r = 6.8 - u * 2.6;
      const z = girdleZ + u * (tableZ - girdleZ);
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        diamond.push([apexX + r * Math.cos(a), apexY + r * Math.sin(a), z, u > 0.7 ? '#FFFFFF' : '#38BDF8']);
      }
    }
    // Flat Wide Table facing UP
    for (let ring = 0; ring <= 3; ring++) {
      const r = (ring / 3) * 3.8;
      const nPts = Math.max(1, ring * 6);
      for (let k = 0; k < nPts; k++) {
        const a = (k / nPts) * Math.PI * 2;
        diamond.push([apexX + r * Math.cos(a), apexY + r * Math.sin(a), tableZ, '#FFFFFF']);
      }
    }

    return allocateParts([
      { pts: band1,   col: '#FFD700', w: 0.36 },
      { pts: band2,   col: '#E2E8F0', w: 0.36 },
      { pts: prongs,  col: '#FFFFFF', w: 0.08 },
      { pts: diamond, col: '#00E5FF', w: 0.20 },
    ], nDrones);
  }

  if (id === 'globe') {
    const spherePts = [], ringPts = [];
    const R = 31;
    const sphereCount = Math.floor(nDrones * 0.86);
    for (let i = 0; i < sphereCount; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / sphereCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const x = R * Math.sin(phi) * Math.cos(theta);
      const y = R * Math.sin(phi) * Math.sin(theta);
      const z = R * Math.cos(phi) + 66;
      const lat = Math.PI / 2 - phi; // -pi/2 .. +pi/2
      const lon = ((theta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      // Distinct continental lobes (Americas, Eurasia/Africa, Australia)
      const america = Math.exp(-Math.pow((lon + 1.65) / 0.55, 2) - Math.pow((lat - 0.35) / 0.55, 2))
                    + Math.exp(-Math.pow((lon + 1.15) / 0.35, 2) - Math.pow((lat + 0.40) / 0.50, 2));
      const eurasia = Math.exp(-Math.pow((lon - 0.85) / 0.95, 2) - Math.pow((lat - 0.55) / 0.42, 2))
                    + Math.exp(-Math.pow((lon - 0.35) / 0.42, 2) - Math.pow((lat - 0.02) / 0.52, 2));
      const aus     = Math.exp(-Math.pow((lon - 2.25) / 0.35, 2) - Math.pow((lat + 0.45) / 0.25, 2));
      const isLand  = (america + eurasia + aus) > 0.42;
      const isPolar = Math.abs(Math.cos(phi)) > 0.88;
      spherePts.push([x, y, z, isPolar ? '#FFFFFF' : (isLand ? '#10B981' : '#0284C7')]);
    }
    // Crisp Latitude Rings (Equator + Tropics)
    [0, 0.42, -0.42].forEach((lat, idx) => {
      const rRing = (R + 0.8) * Math.cos(lat);
      const zRing = 66 + (R + 0.8) * Math.sin(lat);
      const steps = idx === 0 ? 96 : 64;
      for (let k = 0; k < steps; k++) {
        const a = (k / steps) * Math.PI * 2;
        ringPts.push([rRing * Math.cos(a), rRing * Math.sin(a), zRing, idx === 0 ? '#FFD700' : '#38BDF8']);
      }
    });
    return allocateParts([
      { pts: spherePts, col: '#0284C7', w: 0.86 },
      { pts: ringPts,   col: '#38BDF8', w: 0.14 },
    ], nDrones);
  }

  // ISRO Launch Rocket (default / id === 'rocket')
  const core = [], boosters = [], fins = [], flame = [];
  // Core stage + Payload fairing + Nose cone (z: 44..104)
  for (let z = 44; z <= 104; z += 1.5) {
    const u = (z - 44) / 60;
    const r = u > 0.74 ? 6.2 * (1 - (u - 0.74) / 0.26) : 6.2;
    const col = u > 0.74 ? '#FF9933' : (u > 0.50 ? '#FFFFFF' : (u > 0.36 ? '#10B981' : '#E2E8F0'));
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      core.push([r * Math.cos(a), r * Math.sin(a), z, col]);
    }
  }
  // Dual Strap-on Boosters (LVM3 style, z: 44..76)
  [-9.8, 9.8].forEach(bx => {
    for (let z = 44; z <= 76; z += 1.8) {
      const u = (z - 44) / 32;
      const r = u > 0.82 ? 2.8 * (1 - (u - 0.82) / 0.18) : 2.8;
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        boosters.push([bx + r * Math.cos(a), r * Math.sin(a), z, u > 0.82 ? '#FF9933' : '#CBD5E1']);
      }
    }
  });
  // 4 Swept Delta Fins
  [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(ang => {
    for (let s = 0; s <= 12; s++) {
      const r = 6.2 + s * 0.75, z = 44 + (12 - s) * 1.25;
      fins.push([r * Math.cos(ang), r * Math.sin(ang), z, '#38BDF8']);
    }
  });
  // Live Exhaust Plume (z < 44 triggers live flicker in three-engine.js)
  for (let z = 20; z < 44; z += 1.2) {
    const r = ((z - 20) / 24) * 6.4;
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const flameCol = z > 38 ? '#FFFFFF' : (z > 31 ? '#FFD700' : (k % 2 === 0 ? '#FF8C00' : '#FF5500'));
      flame.push([r * Math.cos(a), r * Math.sin(a), z, flameCol]);
    }
  }
  return allocateParts([
    { pts: core,     col: '#FFFFFF', w: 0.44 },
    { pts: boosters, col: '#CBD5E1', w: 0.20 },
    { pts: fins,     col: '#38BDF8', w: 0.14 },
    { pts: flame,    col: '#FF5500', w: 0.22 },
  ], nDrones);
};

// ---------------------------------------------------------------------------
// 5. 3D TYPOGRAPHY BUILDER
// ---------------------------------------------------------------------------
window.build3DTextCloud = function build3DTextCloud(textStr, nDrones, colorTheme='tricolour', fontCss='900 Arial, sans-serif') {
  const clean=(textStr||'AEROGRID').trim().slice(0,18);
  const c=document.createElement('canvas');
  c.width=760; c.height=190;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#000'; ctx.fillRect(0,0,c.width,c.height);
  const fsize=Math.max(46,Math.min(115,Math.floor(640/Math.max(1,clean.length*0.58))));
  const family=fontCss.includes('Georgia')?'Georgia, serif':(fontCss.includes('Courier')?"'Courier New', monospace":'Arial, sans-serif');
  const weight=fontCss.includes('italic')?'italic bold':'900';
  ctx.font=`${weight} ${fsize}px ${family}`;
  ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(clean, c.width/2, c.height/2);

  const imgData=ctx.getImageData(0,0,c.width,c.height).data;
  const lit=[]; let minX=c.width, maxX=0, minY=c.height, maxY=0;
  for (let y=0; y<c.height; y+=2)
    for (let x=0; x<c.width; x+=2)
      if (imgData[(y*c.width+x)*4]>135) {
        lit.push([x,y]);
        if (x<minX) minX=x; if (x>maxX) maxX=x;
        if (y<minY) minY=y; if (y>maxY) maxY=y;
      }
  if (lit.length<15) return [];
  const midX=(minX+maxX)/2, midY=(minY+maxY)/2;
  const scale=Math.min(116/Math.max(1,maxX-minX), 38/Math.max(1,maxY-minY));
  const solidMap={gold:'#FFD700',cyan:'#00E5FF',pink:'#FF2A85',white:'#FFFFFF'};
  const out=[];
  for (let i=0; i<nDrones; i++) {
    const idx=Math.floor((i/nDrones)*(lit.length-1));
    const [px,py]=lit[idx];
    const normX=(px-minX)/Math.max(1,maxX-minX);
    const triCol=normX<0.34?'#FF9933':(normX<0.67?'#FFFFFF':'#10B981');
    const col=colorTheme==='tricolour'?triCol:(solidMap[colorTheme]||'#00E5FF');
    out.push([+((px-midX)*scale).toFixed(2),0.0,+(66-(py-midY)*scale).toFixed(2),col]);
  }
  return out;
};

// ---------------------------------------------------------------------------
// 6. SYMMETRY SKY DRAW PAD
// ---------------------------------------------------------------------------
let _drawColor='#FFD700', _isDrawingPad=false, _lastPadPt=null;

window.setDrawColor = function setDrawColor(hex) { _drawColor=hex; };

window.initSkyDrawPad = function initSkyDrawPad() {
  const c=document.getElementById('skyDrawCanvas');
  const ctx=c.getContext('2d');
  ctx.fillStyle='#000000'; ctx.fillRect(0,0,c.width,c.height);
  _drawCenterGuide(ctx, c.width, c.height);

  const getPos=(e)=>{
    const rect=c.getBoundingClientRect();
    const clientX=e.touches?e.touches[0].clientX:e.clientX;
    const clientY=e.touches?e.touches[0].clientY:e.clientY;
    return { x:((clientX-rect.left)/rect.width)*c.width, y:((clientY-rect.top)/rect.height)*c.height };
  };
  const startDraw=(e)=>{ _isDrawingPad=true; _lastPadPt=getPos(e); };
  const moveDraw=(e)=>{
    if (!_isDrawingPad) return;
    e.preventDefault();
    const pt=getPos(e);
    ctx.strokeStyle=_drawColor; ctx.lineWidth=4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(_lastPadPt.x,_lastPadPt.y); ctx.lineTo(pt.x,pt.y); ctx.stroke();
    if (document.getElementById('mirrorDrawChk').checked) {
      ctx.beginPath(); ctx.moveTo(c.width-_lastPadPt.x,_lastPadPt.y); ctx.lineTo(c.width-pt.x,pt.y); ctx.stroke();
    }
    _lastPadPt=pt;
  };
  const endDraw=()=>{ _isDrawingPad=false; _lastPadPt=null; };

  c.addEventListener('mousedown',startDraw);
  c.addEventListener('mousemove',moveDraw);
  window.addEventListener('mouseup',endDraw);
  c.addEventListener('touchstart',startDraw,{passive:false});
  c.addEventListener('touchmove',moveDraw,{passive:false});
  c.addEventListener('touchend',endDraw);
};

function _drawCenterGuide(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle='#0f172a'; ctx.setLineDash([4,4]); ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(w/2,0); ctx.lineTo(w/2,h); ctx.stroke();
  ctx.restore();
}

window.clearSkyDrawPad = function clearSkyDrawPad() {
  const c=document.getElementById('skyDrawCanvas');
  const ctx=c.getContext('2d');
  ctx.fillStyle='#000000'; ctx.fillRect(0,0,c.width,c.height);
  _drawCenterGuide(ctx, c.width, c.height);
};

window.sendSkyDrawingToDrones = function sendSkyDrawingToDrones() {
  const drones=parseInt(document.getElementById('droneManualInput').value,10)||2200;
  const drawC=document.getElementById('skyDrawCanvas');
  const bpC=document.getElementById('blueprintCanvas');
  const bpCtx=bpC.getContext('2d');
  bpCtx.fillStyle='#000000'; bpCtx.fillRect(0,0,bpC.width,bpC.height);
  bpCtx.drawImage(drawC,0,0,bpC.width,bpC.height);

  const cloud=compileImageTo3DCloud(drawC,drones,'gold_cyan',10);
  window.slides[window.activeSlideIdx]={...window.slides[window.activeSlideIdx],type:'custom',label:'Custom Sky Art',cloud};
  if (typeof window.activateSlide==='function') window.activateSlide(window.activeSlideIdx,false);
};

// ---------------------------------------------------------------------------
// 7. CTRL+V GLOBAL PASTE
// ---------------------------------------------------------------------------
window.addEventListener('paste',(e)=>{
  const items=e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob=item.getAsFile();
      const reader=new FileReader();
      reader.onload=(ev)=>{
        const img=new Image();
        img.onload=()=>{
          const c=document.getElementById('blueprintCanvas');
          const ctx=c.getContext('2d');
          ctx.fillStyle='#000000'; ctx.fillRect(0,0,c.width,c.height);
          const fit=Math.min((c.width-16)/img.width,(c.height-16)/img.height);
          const dw=img.width*fit, dh=img.height*fit;
          ctx.drawImage(img,(c.width-dw)/2,(c.height-dh)/2,dw,dh);
          if (typeof window.switchSidebarTab==='function') window.switchSidebarTab('blueprint');
          document.getElementById('bpPromptInput').value='Pasted AI Art';
          document.getElementById('bpStatusBadge').textContent='IMAGE PASTED';
          window.approveBlueprintToDrones();
        };
        img.src=ev.target.result;
      };
      reader.readAsDataURL(blob);
      break;
    }
  }
});
