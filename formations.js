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
  if (id==='taj') {
    const plinth=[], arches=[], dome=[], minarets=[];
    for (let x=-46; x<=46; x+=2.2)
      for (let y=-18; y<=18; y+=3.0) {
        plinth.push([x,y,36,'#94A3B8']);
        if (Math.abs(x)===46||Math.abs(y)===18) plinth.push([x,y,42,'#E2E8F0']);
      }
    for (let z=42; z<=70; z+=1.5)
      for (let x=-28; x<=28; x+=1.6) {
        const inMainArch=Math.abs(x)<10&&z<64&&(Math.pow(x/10,2)+Math.pow((z-42)/22,2)<1);
        const inSideArch=Math.abs(x)>13&&Math.abs(x)<23&&((z>43&&z<53)||(z>56&&z<66));
        if (!inMainArch&&!inSideArch) {
          arches.push([x,12,z,'#E0F2FE'],[x,-12,z,'#38BDF8']);
        }
      }
    for (let i=0; i<420; i++) {
      const u=i/420, th=(i*2.39996)%(Math.PI*2);
      const r=16.5*Math.sin(u*Math.PI*0.88)*(1+0.16*Math.sin(u*Math.PI));
      const z=70+u*23;
      dome.push([r*Math.cos(th),r*Math.sin(th),z,u>0.72?'#FFD700':'#FDE047']);
    }
    for (let z=93; z<=104; z+=0.9) dome.push([0,0,z,'#FFFFFF']);
    [[-40,15],[40,15],[-40,-15],[40,-15]].forEach(([mx,my]) => {
      for (let z=42; z<=88; z+=1.6) {
        const rad=2.8-(z-42)*0.022;
        const isBalcony=Math.abs(z-56)<1.2||Math.abs(z-70)<1.2||Math.abs(z-84)<1.2;
        for (let k=0; k<8; k++) {
          const a=(k/8)*Math.PI*2;
          minarets.push([mx+(isBalcony?rad+1.2:rad)*Math.cos(a),my+(isBalcony?rad+1.2:rad)*Math.sin(a),z,isBalcony?'#FFD700':'#E2E8F0']);
        }
      }
      minarets.push([mx,my,92,'#FFD700']);
    });
    return allocateParts([{pts:plinth,col:'#94A3B8',w:0.14},{pts:arches,col:'#38BDF8',w:0.34},{pts:dome,col:'#FFD700',w:0.28},{pts:minarets,col:'#FFFFFF',w:0.24}],nDrones);
  }

  if (id==='trishul') {
    const centralBlade=[], outerProngs=[], tilak=[], damru=[];
    for (let s=0; s<=70; s++) {
      const u=s/70, z=82+u*26;
      const halfW=u<0.25?(u/0.25)*4.5:4.5*(1-(u-0.25)/0.75);
      centralBlade.push([-halfW,1,z,'#FFFFFF'],[halfW,1,z,'#FFFFFF']);
    }
    for (let z=32; z<=82; z+=1.0) centralBlade.push([-1.3,0,z,'#FFFFFF'],[1.3,0,z,'#FFFFFF']);
    [-1,1].forEach(side => {
      for (let s=0; s<=85; s++) {
        const u=s/85;
        const x=side*(3.5+Math.sin(u*Math.PI*0.85)*16.5-(u>0.75?(u-0.75)*12:0));
        const z=75+u*27-Math.sin(u*Math.PI)*4.5;
        outerProngs.push([x,1,z,'#FFB703'],[x-side*2.2,1.5,z+0.8,'#00E5FF']);
      }
    });
    [86.5,88.8,91.1].forEach(tz => {
      for (let x=-7.5; x<=7.5; x+=0.85) tilak.push([x,3,tz,'#FFFFFF']);
    });
    tilak.push([0,3.8,88.8,'#FF2A85']);
    const tilt=-0.32;
    const rotD=(dx,dz)=>[dx*Math.cos(tilt)-dz*Math.sin(tilt), dx*Math.sin(tilt)+dz*Math.cos(tilt)+60];
    for (let s=-10; s<=10; s+=0.7) {
      const r=2.6+Math.abs(s)*0.65;
      const [xTop,zTop]=rotD(s,r), [xBot,zBot]=rotD(s,-r);
      damru.push([xTop,3,zTop,'#FFB703'],[xBot,3,zBot,'#FFB703']);
    }
    return allocateParts([{pts:centralBlade,col:'#FFFFFF',w:0.28},{pts:outerProngs,col:'#FFB703',w:0.34},{pts:tilak,col:'#FFFFFF',w:0.14},{pts:damru,col:'#FFB703',w:0.24}],nDrones);
  }

  if (id==='heart') {
    const pts=[];
    for (let layer=0; layer<8; layer++) {
      const sc=1.65-layer*0.16;
      for (let k=0; k<=120; k++) {
        const t=(k/120)*Math.PI*2;
        const hx=16*Math.pow(Math.sin(t),3)*sc;
        const hz=(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*sc+68;
        const hy=(layer-3.5)*2.2;
        pts.push([hx,hy,hz,layer<3?'#FF2A85':(layer<6?'#FF6D00':'#FFD700')]);
      }
    }
    return allocateParts([{pts,col:'#FF2A85',w:1.0}],nDrones);
  }

  if (id==='rings') {
    const r1=[], r2=[], diamond=[];
    for (let k=0; k<420; k++) {
      const th=(k/420)*Math.PI*2;
      for (let w=-2; w<=2; w+=2) {
        r1.push([-12+21*Math.cos(th),w+6*Math.sin(th),66+21*Math.sin(th),'#FFD700']);
        r2.push([12+21*Math.cos(th),w-6*Math.sin(th),66+21*Math.sin(th),'#00E5FF']);
      }
    }
    for (let i=0; i<140; i++) {
      const a=(i/140)*Math.PI*2, r=(i%5)*1.1;
      diamond.push([-12+r*Math.cos(a),r*Math.sin(a),89+(4-(i%5))*1.3,'#FFFFFF']);
    }
    return allocateParts([{pts:r1,col:'#FFD700',w:0.44},{pts:r2,col:'#00E5FF',w:0.44},{pts:diamond,col:'#FFFFFF',w:0.12}],nDrones);
  }

  if (id==='globe') {
    const pts=[];
    for (let i=0; i<nDrones; i++) {
      const phi=Math.acos(1-2*(i+0.5)/nDrones);
      const theta=Math.PI*(1+Math.sqrt(5))*i;
      const R=32;
      const x=R*Math.sin(phi)*Math.cos(theta);
      const y=R*Math.sin(phi)*Math.sin(theta);
      const z=R*Math.cos(phi)+66;
      const isLand=Math.sin(theta*2.5)*Math.cos(phi*3.0)>0.15;
      const isPolar=Math.abs(Math.cos(phi))>0.86;
      pts.push([x,y,z,isPolar?'#FFFFFF':(isLand?'#10B981':'#0284C7')]);
    }
    return pts;
  }

  // ISRO Rocket (default / id==='rocket')
  const body=[], fins=[], flame=[];
  for (let z=44; z<=98; z+=1.4) {
    const u=(z-44)/54;
    const r=u>0.72?6.5*(1-(u-0.72)/0.28):6.5;
    const col=u>0.72?'#FF9933':(u>0.48?'#FFFFFF':(u>0.34?'#10B981':'#E2E8F0'));
    for (let k=0; k<22; k++) {
      const a=(k/22)*Math.PI*2;
      body.push([r*Math.cos(a),r*Math.sin(a),z,col]);
    }
  }
  [0,Math.PI/2,Math.PI,Math.PI*1.5].forEach(ang => {
    for (let s=0; s<=12; s++) {
      const r=6.5+s*0.7, z=44+(12-s)*1.3;
      fins.push([r*Math.cos(ang),r*Math.sin(ang),z,'#38BDF8']);
    }
  });
  for (let z=24; z<44; z+=1.2) {
    const r=((z-24)/20)*6.0;
    for (let k=0; k<14; k++) {
      const a=(k/14)*Math.PI*2;
      flame.push([r*Math.cos(a),r*Math.sin(a),z,z>36?'#FFFFFF':'#FF5500']);
    }
  }
  return allocateParts([{pts:body,col:'#FFFFFF',w:0.62},{pts:fins,col:'#38BDF8',w:0.16},{pts:flame,col:'#FF5500',w:0.22}],nDrones);
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
