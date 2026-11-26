// =============================================================================
// three-engine.js — AeroGrid Studio
// Three.js scene, HDR UnrealBloomPass, Riverfront Mirror Lake, OrbitControls,
// drone particle system, morph animation, storyboard, UI helpers.
// Depends on: formations.js (must load first)
// =============================================================================

'use strict';

// ---------------------------------------------------------------------------
// Module-level scene references
// ---------------------------------------------------------------------------
let scene, camera, renderer, composer, bloomPass, controls;
let dronePoints, reflectionPoints, trailLines, venueGroup;
let currentPositions, reflectionPositions, startPositions, targetPositions, prevPositions, droneColors;
let morphProgress = 1.0;
let currentTransition = 'spiral';
let autoPlay = false, autoTimer = 0;
let clientViewActive = false;

// ---------------------------------------------------------------------------
// Glow sprite texture
// ---------------------------------------------------------------------------
function createGlowSprite() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(32,32,0,32,32,32);
  grad.addColorStop(0.00, 'rgba(255,255,255,1)');
  grad.addColorStop(0.20, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.48, 'rgba(255,255,255,0.38)');
  grad.addColorStop(1.00, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(c);
}

// ---------------------------------------------------------------------------
// initThreeJS — called once on DOMContentLoaded
// ---------------------------------------------------------------------------
window.initThreeJS = function initThreeJS() {
  const container = document.getElementById('threeContainer');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02040a);
  scene.fog = new THREE.FogExp2(0x02040a, 0.0018);

  camera = new THREE.PerspectiveCamera(48, container.clientWidth/container.clientHeight, 0.1, 1000);
  camera.position.set(0,24,165);

  renderer = new THREE.WebGLRenderer({ antialias:true, preserveDrawingBuffer:true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.toneMapping = THREE.ReinhardToneMapping;
  container.appendChild(renderer.domElement);

  const renderScene = new THREE.RenderPass(scene, camera);
  bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    1.10, 0.52, 0.20
  );
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0,14,0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 30;
  controls.maxDistance = 280;
  controls.update();

  venueGroup = new THREE.Group();
  scene.add(venueGroup);
  changeVenue('riverfront');

  // Stars
  const starGeo = new THREE.BufferGeometry();
  const starVerts = [];
  for (let i = 0; i < 650; i++)
    starVerts.push((Math.random()-0.5)*600, Math.random()*260+20, (Math.random()-0.5)*600);
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts,3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({color:0x64748b,size:0.9})));

  // Hero Vault grid
  document.getElementById('heroGrid').innerHTML = window.HERO_VAULT.map(h => `
    <div onclick="loadHeroToSlide('${h.id}','${h.name}')"
      class="hero-card p-3 rounded-xl bg-[#050914] border border-slate-800 flex flex-col items-center text-center gap-1">
      <span class="text-xl">${h.icon}</span>
      <span class="text-[11px] font-semibold text-white">${h.name}</span>
      <span class="text-[9px] font-mono text-slate-400">${h.tag}</span>
    </div>
  `).join('');

  window.initSkyDrawPad();
  window.generateBlueprintPreview();
  setupDroneParticles(2200);

  window.slides = [
    { type:'hero', id:'taj',     label:'Taj Mahal',    dur:15, trans:'spiral', cloud:window.buildHeroFormation('taj',2200) },
    { type:'hero', id:'trishul', label:'Shiva Trishul',dur:15, trans:'burst',  cloud:window.buildHeroFormation('trishul',2200) },
    { type:'text', text:'INDIA 2026', color:'tricolour', font:'900 Arial, sans-serif', label:'"INDIA 2026"', dur:20, trans:'wave', cloud:window.build3DTextCloud('INDIA 2026',2200,'tricolour') },
  ];
  window.activateSlide(0, true);

  window.addEventListener('resize', handleResize);
  animateThree();
};

// ---------------------------------------------------------------------------
// Resize handler
// ---------------------------------------------------------------------------
window.handleResize = function handleResize() {
  const container = document.getElementById('threeContainer');
  if (!container||!camera||!renderer) return;
  camera.aspect = container.clientWidth/container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
  if (composer) composer.setSize(container.clientWidth, container.clientHeight);
};

// ---------------------------------------------------------------------------
// Venue / environment builder
// ---------------------------------------------------------------------------
window.changeVenue = function changeVenue(mode) {
  while (venueGroup.children.length>0) venueGroup.remove(venueGroup.children[0]);
  if (mode==='riverfront') {
    const lake = new THREE.Mesh(
      new THREE.CircleGeometry(160,64),
      new THREE.MeshBasicMaterial({color:0x030b1a,transparent:true,opacity:0.65,side:THREE.DoubleSide})
    );
    lake.rotation.x = -Math.PI/2;
    venueGroup.add(lake);
    const shoreRing = new THREE.Mesh(
      new THREE.RingGeometry(105,106.5,64),
      new THREE.MeshBasicMaterial({color:0x0ea5e9,transparent:true,opacity:0.25,side:THREE.DoubleSide})
    );
    shoreRing.rotation.x = -Math.PI/2;
    shoreRing.position.y = 0.2;
    venueGroup.add(shoreRing);
  } else if (mode==='grid') {
    venueGroup.add(new THREE.GridHelper(180,36,0x1e3a5f,0x0c172a));
  } else if (mode==='stadium') {
    const turf = new THREE.Mesh(
      new THREE.PlaneGeometry(110,74),
      new THREE.MeshBasicMaterial({color:0x064e3b,transparent:true,opacity:0.55,side:THREE.DoubleSide})
    );
    turf.rotation.x = -Math.PI/2;
    venueGroup.add(turf);
  } else if (mode==='palace') {
    const lawn = new THREE.Mesh(
      new THREE.CircleGeometry(90,48),
      new THREE.MeshBasicMaterial({color:0x065f46,transparent:true,opacity:0.55,side:THREE.DoubleSide})
    );
    lawn.rotation.x = -Math.PI/2;
    venueGroup.add(lawn);
  }
};

// ---------------------------------------------------------------------------
// Drone particle setup
// ---------------------------------------------------------------------------
function setupDroneParticles(count) {
  if (dronePoints)      scene.remove(dronePoints);
  if (reflectionPoints) scene.remove(reflectionPoints);
  if (trailLines)       scene.remove(trailLines);

  const spriteTex  = createGlowSprite();
  const spriteSize = count >= 1500 ? 3.8 : 4.5;

  const geo = new THREE.BufferGeometry();
  currentPositions    = new Float32Array(count*3);
  reflectionPositions = new Float32Array(count*3);
  startPositions      = new Float32Array(count*3);
  prevPositions       = new Float32Array(count*3);
  targetPositions     = new Float32Array(count*3);
  droneColors         = new Float32Array(count*3);

  geo.setAttribute('position', new THREE.BufferAttribute(currentPositions,3));
  geo.setAttribute('color',    new THREE.BufferAttribute(droneColors,3));

  dronePoints = new THREE.Points(geo, new THREE.PointsMaterial({
    size:spriteSize, map:spriteTex, vertexColors:true,
    transparent:true, blending:THREE.AdditiveBlending, depthWrite:false,
  }));
  scene.add(dronePoints);

  const refGeo = new THREE.BufferGeometry();
  refGeo.setAttribute('position', new THREE.BufferAttribute(reflectionPositions,3));
  refGeo.setAttribute('color',    new THREE.BufferAttribute(droneColors,3));

  reflectionPoints = new THREE.Points(refGeo, new THREE.PointsMaterial({
    size:spriteSize*1.15, map:spriteTex, vertexColors:true,
    transparent:true, opacity:0.48, blending:THREE.AdditiveBlending, depthWrite:false,
  }));
  scene.add(reflectionPoints);

  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count*2*3),3));
  trailGeo.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(count*2*3),3));
  trailLines = new THREE.LineSegments(trailGeo, new THREE.LineBasicMaterial({
    vertexColors:true, transparent:true, opacity:0.30, blending:THREE.AdditiveBlending,
  }));
  scene.add(trailLines);
}

// ---------------------------------------------------------------------------
// Telemetry HUD
// ---------------------------------------------------------------------------
function updateTelemetryHUD(drones, slide) {
  const densityFactor = (drones-200)/2800;
  const spacing = Math.max(2.01, +(2.75-densityFactor*0.68).toFixed(2));
  const baseVel = slide?.trans==='burst'?5.4:(slide?.trans==='spiral'?5.1:4.7);
  const maxVel  = +(baseVel+densityFactor*0.4).toFixed(1);
  document.getElementById('hudFleet').textContent   = `${drones} UAVs`;
  document.getElementById('hudMaxVel').textContent  = `${maxVel} m/s`;
  document.getElementById('hudSpacing').textContent = `${spacing}m [DGCA SAFE]`;
  document.getElementById('statusToast').textContent = `✓ Slide 0${window.activeSlideIdx+1}: ${slide?.label||'Formation'} • ${drones} UAVs`;
}

// ---------------------------------------------------------------------------
// Slide activation / morph
// ---------------------------------------------------------------------------
window.activateSlide = function activateSlide(idx, instant=false) {
  if (!window.slides[idx]) return;
  window.activeSlideIdx = idx;
  const slide = window.slides[idx];
  const drones = currentPositions.length/3;
  currentTransition = slide.trans||'spiral';
  document.getElementById('transitionSelect').value = currentTransition;
  document.getElementById('hudSlideName').textContent = `0${idx+1}. ${slide.label}`;
  updateTelemetryHUD(drones, slide);

  const cloud = slide.cloud;
  const colObj = new THREE.Color();
  const tCols  = trailLines.geometry.attributes.color.array;

  for (let i=0; i<drones; i++) {
    const pt = cloud[i%cloud.length];
    startPositions[i*3]   = currentPositions[i*3];
    startPositions[i*3+1] = currentPositions[i*3+1];
    startPositions[i*3+2] = currentPositions[i*3+2];

    targetPositions[i*3]   = pt[0];
    targetPositions[i*3+1] = pt[2];
    targetPositions[i*3+2] = pt[1];

    if (instant) {
      currentPositions[i*3]   = pt[0];
      currentPositions[i*3+1] = pt[2];
      currentPositions[i*3+2] = pt[1];
      prevPositions[i*3]   = pt[0];
      prevPositions[i*3+1] = pt[2];
      prevPositions[i*3+2] = pt[1];
      reflectionPositions[i*3]   = pt[0];
      reflectionPositions[i*3+1] = -pt[2]*0.92;
      reflectionPositions[i*3+2] = pt[1];
    }
    colObj.set(pt[3]||'#00E5FF');
    droneColors[i*3]   = colObj.r;
    droneColors[i*3+1] = colObj.g;
    droneColors[i*3+2] = colObj.b;
    tCols[i*6]   = colObj.r;
    tCols[i*6+1] = colObj.g;
    tCols[i*6+2] = colObj.b;
    tCols[i*6+3] = 0.04;
    tCols[i*6+4] = 0.06;
    tCols[i*6+5] = 0.14;
  }
  morphProgress = instant ? 1.0 : 0.0;
  dronePoints.geometry.attributes.color.needsUpdate      = true;
  reflectionPoints.geometry.attributes.color.needsUpdate = true;
  trailLines.geometry.attributes.color.needsUpdate       = true;
  if (instant) {
    dronePoints.geometry.attributes.position.needsUpdate      = true;
    reflectionPoints.geometry.attributes.position.needsUpdate = true;
  }
  renderStoryboard();
};

// ---------------------------------------------------------------------------
// Main render loop
// ---------------------------------------------------------------------------
function animateThree() {
  requestAnimationFrame(animateThree);
  const t = performance.now()*0.0018;

  if (autoPlay && window.slides.length>0) {
    autoTimer += 0.016;
    const durSec = Math.max(3.8,(window.slides[window.activeSlideIdx]?.dur||15)*0.25);
    if (autoTimer>durSec) { autoTimer=0; window.activateSlide((window.activeSlideIdx+1)%window.slides.length,false); }
  }

  if (currentPositions && targetPositions) {
    const count = currentPositions.length/3;
    const tVerts = trailLines.geometry.attributes.position.array;
    if (morphProgress<1.0) morphProgress = Math.min(1.0, morphProgress+0.024);
    const ease = 1-Math.pow(1-morphProgress,3);
    const arc  = Math.sin(morphProgress*Math.PI);

    for (let i=0; i<count; i++) {
      const ix=i*3,iy=i*3+1,iz=i*3+2;
      prevPositions[ix] += (currentPositions[ix]-prevPositions[ix])*0.28;
      prevPositions[iy] += (currentPositions[iy]-prevPositions[iy])*0.28;
      prevPositions[iz] += (currentPositions[iz]-prevPositions[iz])*0.28;

      const tx=targetPositions[ix], ty=targetPositions[iy], tz=targetPositions[iz];
      let bx=startPositions[ix]+(tx-startPositions[ix])*ease;
      let by=startPositions[iy]+(ty-startPositions[iy])*ease;
      let bz=startPositions[iz]+(tz-startPositions[iz])*ease;

      if (arc>0.001) {
        if (currentTransition==='spiral') {
          const ang=arc*2.4+(i%12)*0.15, rad=arc*16;
          bx+=Math.cos(ang)*rad; bz+=Math.sin(ang)*rad;
        } else if (currentTransition==='burst') {
          bx+=(tx*0.45)*arc; by+=((ty-64)*0.45)*arc; bz+=(tz*0.45)*arc;
        } else if (currentTransition==='wave') {
          by+=Math.sin(tx*0.12+morphProgress*6.0)*14*arc;
        }
      }

      const hx=Math.sin(t+i*0.37)*0.12, hy=Math.cos(t*1.1+i*0.53)*0.12;
      const finalX=bx+hx, finalY=by+hy, finalZ=bz;

      currentPositions[ix]=finalX; currentPositions[iy]=finalY; currentPositions[iz]=finalZ;

      const ripple=Math.sin(t*3.0+finalY*0.15)*0.45;
      reflectionPositions[ix]=finalX+ripple;
      reflectionPositions[iy]=-finalY*0.92;
      reflectionPositions[iz]=finalZ+ripple*0.5;

      tVerts[i*6]=finalX;   tVerts[i*6+1]=finalY;   tVerts[i*6+2]=finalZ;
      tVerts[i*6+3]=prevPositions[ix]; tVerts[i*6+4]=prevPositions[iy]; tVerts[i*6+5]=prevPositions[iz];
    }
    dronePoints.geometry.attributes.position.needsUpdate      = true;
    reflectionPoints.geometry.attributes.position.needsUpdate = true;
    trailLines.geometry.attributes.position.needsUpdate       = true;
  }
  controls.update();
  if (composer) composer.render(); else renderer.render(scene,camera);
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------
window.switchSidebarTab = function switchSidebarTab(tabName) {
  ['blueprint','vault','draw','text','uploads'].forEach(t=>{
    document.getElementById('panel-'+t).classList.toggle('hidden', t!==tabName);
    document.getElementById('tabBtn-'+t).classList.toggle('active', t===tabName);
  });
};

window.toggleClientView = function toggleClientView() {
  clientViewActive = !clientViewActive;
  document.getElementById('leftRail').classList.toggle('hidden',clientViewActive);
  document.getElementById('sidebarDrawer').classList.toggle('hidden',clientViewActive);
  document.getElementById('bottomTimeline').classList.toggle('hidden',clientViewActive);
  document.getElementById('magicPromptWrap').classList.toggle('hidden',clientViewActive);
  document.getElementById('clientPlayBtn').classList.toggle('hidden',!clientViewActive);
  const btn=document.getElementById('clientViewBtn');
  if (clientViewActive) {
    btn.textContent='✕ Exit Client View';
    btn.classList.add('bg-sky-400','text-slate-950');
    btn.classList.remove('text-sky-300');
  } else {
    btn.textContent='👁️ Client View';
    btn.classList.remove('bg-sky-400','text-slate-950');
    btn.classList.add('text-sky-300');
  }
  setTimeout(window.handleResize, 30);
};

window.loadHeroToSlide = function loadHeroToSlide(id, name) {
  const drones=parseInt(document.getElementById('droneManualInput').value,10)||2200;
  window.slides[window.activeSlideIdx]={...window.slides[window.activeSlideIdx],type:'hero',id,label:name,cloud:window.buildHeroFormation(id,drones)};
  window.activateSlide(window.activeSlideIdx,false);
};

window.runInstantSequence = function runInstantSequence() {
  const raw=document.getElementById('magicPrompt').value.trim();
  if (!raw) return;
  const drones=parseInt(document.getElementById('droneManualInput').value,10)||2200;
  const parts=raw.split(/->|→/).map(s=>s.trim()).filter(Boolean);
  const transCycle=['spiral','burst','wave'];
  window.slides=parts.slice(0,6).map((seg,i)=>{
    const isQuoted=/^["'].*["']$/.test(seg);
    const clean=seg.replace(/^["']|["']$/g,'');
    const low=clean.toLowerCase();
    if (isQuoted) {
      const col=low.includes('india')?'tricolour':'gold';
      return {type:'text',text:clean.toUpperCase(),color:col,font:'900 Arial, sans-serif',label:`"${clean.toUpperCase()}"`,dur:18,trans:transCycle[i%3],cloud:window.build3DTextCloud(clean.toUpperCase(),drones,col)};
    }
    const heroMatch=window.HERO_VAULT.find(h=>low.includes(h.id)||low.includes(h.name.toLowerCase()));
    if (heroMatch) return {type:'hero',id:heroMatch.id,label:heroMatch.name,dur:15,trans:transCycle[i%3],cloud:window.buildHeroFormation(heroMatch.id,drones)};
    document.getElementById('bpPromptInput').value=clean;
    window.generateBlueprintPreview();
    const cloud=window.compileImageTo3DCloud(document.getElementById('blueprintCanvas'),drones,low.includes('india')?'tricolour':'gold_cyan',14);
    return {type:'blueprint',label:clean.slice(0,20),dur:15,trans:transCycle[i%3],cloud};
  });
  window.activateSlide(0,false);
};

window.applyCustomTextToSlide = function applyCustomTextToSlide() {
  const drones=parseInt(document.getElementById('droneManualInput').value,10)||2200;
  const txt=document.getElementById('customTextInput').value.trim()||'INDIA 2026';
  const color=document.getElementById('textColorSelect').value;
  const font=document.getElementById('textFontSelect').value;
  window.slides[window.activeSlideIdx]={...window.slides[window.activeSlideIdx],type:'text',text:txt,color,font,label:`"${txt}"`,cloud:window.build3DTextCloud(txt,drones,color,font)};
  window.activateSlide(window.activeSlideIdx,false);
};

function renderStoryboard() {
  const strip=document.getElementById('storyboardStrip');
  let totalSec=0;
  strip.innerHTML=window.slides.map((s,idx)=>{
    totalSec+=(s.dur||15);
    return `
      <div onclick="selectSlide(${idx})"
        class="slide-card ${idx===window.activeSlideIdx?'active':''} h-20 w-44 rounded-xl bg-[#0C1425] border border-slate-800 p-2.5 flex flex-col justify-between shrink-0 relative">
        <div class="flex items-center justify-between text-[10px] font-mono">
          <span class="text-sky-400 font-bold">SLIDE 0${idx+1}</span>
          <span class="text-slate-400">${s.dur||15}s</span>
        </div>
        <p class="text-xs font-semibold text-white truncate">${s.label}</p>
        <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>⚡ ${s.trans||'spiral'}</span>
          ${window.slides.length>1?`<button onclick="event.stopPropagation(); deleteSlide(${idx})" class="hover:text-rose-400">✕</button>`:''}
        </div>
      </div>`;
  }).join('');
  document.getElementById('totalDurLabel').textContent=`${totalSec}s`;
}

window.selectSlide = function selectSlide(idx) {
  autoPlay=false;
  document.getElementById('playShowBtn').textContent='▶ Play Full Show';
  document.getElementById('clientPlayBtn').textContent='▶ Play Show';
  window.activateSlide(idx,false);
};

window.addNewSlide = function addNewSlide() {
  if (window.slides.length>=6) return;
  const drones=parseInt(document.getElementById('droneManualInput').value,10)||2200;
  window.slides.push({type:'hero',id:'heart',label:'Beating 3D Heart',dur:15,trans:'spiral',cloud:window.buildHeroFormation('heart',drones)});
  window.activateSlide(window.slides.length-1,false);
};

window.deleteSlide = function deleteSlide(idx) {
  if (window.slides.length<=1) return;
  window.slides.splice(idx,1);
  window.activateSlide(Math.max(0,window.activeSlideIdx-1),false);
};

window.updateActiveSlideTransition = function updateActiveSlideTransition(val) {
  if (window.slides[window.activeSlideIdx]) {
    window.slides[window.activeSlideIdx].trans=val;
    currentTransition=val;
    updateTelemetryHUD(currentPositions.length/3, window.slides[window.activeSlideIdx]);
    renderStoryboard();
  }
};

window.togglePlayShow = function togglePlayShow() {
  autoPlay=!autoPlay; autoTimer=0;
  document.getElementById('playShowBtn').textContent=autoPlay?'⏸ Pause Show':'▶ Play Full Show';
  document.getElementById('clientPlayBtn').textContent=autoPlay?'⏸ Pause':'▶ Play Show';
  if (autoPlay) window.activateSlide((window.activeSlideIdx+1)%window.slides.length,false);
};

window.changeFleetCount = function changeFleetCount(val) {
  const n=Math.max(200,Math.min(3000,parseInt(val,10)||2200));
  document.getElementById('droneManualInput').value=n;
  document.getElementById('modalDroneInput').value=n;
  window.slides=window.slides.map(s=>{
    if (s.type==='hero') return {...s,cloud:window.buildHeroFormation(s.id,n)};
    if (s.type==='text') return {...s,cloud:window.build3DTextCloud(s.text,n,s.color,s.font)};
    const resampled=[];
    for (let i=0; i<n; i++) resampled.push([...s.cloud[i%s.cloud.length]]);
    return {...s,cloud:resampled};
  });
  setupDroneParticles(n);
  window.activateSlide(window.activeSlideIdx,true);
  if (typeof window.updateQuote==='function') window.updateQuote();
};

window.setCamPreset = function setCamPreset(mode) {
  controls.autoRotate=false;
  document.getElementById('orbitBtn').classList.remove('bg-amber-400','text-slate-950');
  if (mode==='audience') { camera.position.set(0,24,165); controls.target.set(0,14,0); }
  else if (mode==='side'){ camera.position.set(112,62,52); controls.target.set(0,56,0); }
  else if (mode==='top') { camera.position.set(0,175,22); controls.target.set(0,56,0); }
  controls.update();
};

window.toggleAutoOrbit = function toggleAutoOrbit() {
  controls.autoRotate=!controls.autoRotate;
  const btn=document.getElementById('orbitBtn');
  if (controls.autoRotate) btn.classList.add('bg-amber-400','text-slate-950');
  else btn.classList.remove('bg-amber-400','text-slate-950');
};

window.shareClientLink = function shareClientLink() {
  const seq=encodeURIComponent(window.slides.map(s=>s.label).join(' -> '));
  const drones=document.getElementById('droneManualInput').value;
  const shareUrl=`${window.location.origin}${window.location.pathname}?seq=${seq}&drones=${drones}`;
  navigator.clipboard.writeText(shareUrl);
  document.getElementById('statusToast').textContent='🔗 Client Preview URL copied to clipboard!';
};

window.recordPitchVideo = function recordPitchVideo() {
  const canvas=renderer.domElement;
  const btn=document.getElementById('recVideoBtn');
  if (!canvas.captureStream) return;
  const stream=canvas.captureStream(30);
  const recorder=new MediaRecorder(stream,{mimeType:'video/webm'});
  const chunks=[];
  recorder.ondataavailable=e=>{ if(e.data.size>0) chunks.push(e.data); };
  recorder.onstop=()=>{
    window.triggerDownload(new Blob(chunks,{type:'video/webm'}),`AeroGrid_Pitch_${Date.now()}.webm`);
    btn.textContent='🎥 Pitch Video'; btn.classList.remove('animate-pulse');
  };
  autoPlay=true; autoTimer=0; controls.autoRotate=true;
  recorder.start();
  btn.textContent='⏺ Recording 10s...'; btn.classList.add('animate-pulse');
  setTimeout(()=>{
    recorder.stop(); autoPlay=false; controls.autoRotate=false;
    document.getElementById('playShowBtn').textContent='▶ Play Full Show';
    document.getElementById('clientPlayBtn').textContent='▶ Play Show';
  },10000);
};

window.uploadReferenceImage = function uploadReferenceImage(input) {
  if (!input.files||!input.files[0]) return;
  const file=input.files[0];
  const reader=new FileReader();
  reader.onload=(ev)=>{
    const img=new Image();
    img.onload=()=>{
      const c=document.getElementById('blueprintCanvas');
      const ctx=c.getContext('2d');
      ctx.fillStyle='#000000'; ctx.fillRect(0,0,c.width,c.height);
      const fit=Math.min((c.width-16)/img.width,(c.height-16)/img.height);
      const dw=img.width*fit,dh=img.height*fit;
      ctx.drawImage(img,(c.width-dw)/2,(c.height-dh)/2,dw,dh);
      window.switchSidebarTab('blueprint');
      document.getElementById('bpPromptInput').value=file.name.slice(0,18);
      window.approveBlueprintToDrones();
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
};

window.upload3DMesh = function upload3DMesh(input) {
  if (!input.files||!input.files[0]) return;
  const file=input.files[0];
  const ext=file.name.split('.').pop().toLowerCase();
  const drones=parseInt(document.getElementById('droneManualInput').value,10)||2200;
  const reader=new FileReader();
  reader.onload=(ev)=>{
    const rawVerts=[];
    const extract=(obj)=>{
      obj.updateMatrixWorld(true);
      obj.traverse((child)=>{
        if (child.isMesh&&child.geometry) {
          const pos=child.geometry.attributes.position;
          const v=new THREE.Vector3();
          for (let i=0; i<pos.count; i++) {
            v.fromBufferAttribute(pos,i).applyMatrix4(child.matrixWorld);
            rawVerts.push([v.x,v.z,v.y]);
          }
        }
      });
    };
    if (ext==='obj') {
      extract(new THREE.OBJLoader().parse(ev.target.result));
      finalizeMesh(rawVerts,file.name,drones);
    } else {
      new THREE.GLTFLoader().parse(ev.target.result,'',(gltf)=>{
        extract(gltf.scene);
        finalizeMesh(rawVerts,file.name,drones);
      });
    }
  };
  if (ext==='obj') reader.readAsText(file); else reader.readAsArrayBuffer(file);
};

function finalizeMesh(verts,filename,drones) {
  if (!verts.length) return;
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,minZ=Infinity,maxZ=-Infinity;
  verts.forEach(([x,y,z])=>{
    if(x<minX) minX=x; if(x>maxX) maxX=x;
    if(y<minY) minY=y; if(y>maxY) maxY=y;
    if(z<minZ) minZ=z; if(z>maxZ) maxZ=z;
  });
  const cx=(minX+maxX)/2, cy=(minY+maxY)/2, cz=(minZ+maxZ)/2;
  const scale=80.0/Math.max(1e-4,maxX-minX,maxY-minY,maxZ-minZ);
  const cloud=[];
  for (let i=0; i<drones; i++) {
    const [vx,vy,vz]=verts[Math.floor((i/drones)*(verts.length-1))];
    const nz=(vz-cz)*scale+66.0;
    cloud.push([+((vx-cx)*scale).toFixed(2),+((vy-cy)*scale).toFixed(2),+nz.toFixed(2),nz>82?'#FFD700':(nz>58?'#00E5FF':'#FF2A85')]);
  }
  window.slides[window.activeSlideIdx]={...window.slides[window.activeSlideIdx],type:'custom',label:filename.slice(0,16),cloud};
  window.activateSlide(window.activeSlideIdx,false);
}
