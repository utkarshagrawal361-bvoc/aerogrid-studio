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
// 1. MULTI-SOURCE VISUAL BLUEPRINT GENERATOR (Puter.js AI + 44+ Vector Blueprints)
// ---------------------------------------------------------------------------
let _bpGenToken = 0;

window.setBpPrompt = function setBpPrompt(txt, pal) {
  document.getElementById('bpPromptInput').value = txt;
  if (pal) document.getElementById('bpPaletteSelect').value = pal;
  generateBlueprintPreview(false);
};

function getBlueprintPalette(pal) {
  if (pal === 'tricolour')   return { c1: '#FF9933', c2: '#FFFFFF', c3: '#10B981', glow: '#38BDF8' };
  if (pal === 'divine_fire') return { c1: '#FFD700', c2: '#FF2A85', c3: '#FF6D00', glow: '#FEF08A' };
  if (pal === 'diamond')     return { c1: '#FFFFFF', c2: '#38BDF8', c3: '#BAE6FD', glow: '#E0F2FE' };
  return { c1: '#FFD700', c2: '#00E5FF', c3: '#FFFFFF', glow: '#FDE047' };
}

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
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function renderProceduralBlueprint(raw, pal, ctx, w, h) {
  const q = raw.toLowerCase();
  const cx = w / 2, cy = h / 2;
  const { c1, c2, c3, glow } = getBlueprintPalette(pal);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Helper for radial gradients so brighter centers protrude in 3D relief
  const radGrad = (x, y, r, inner, outer) => {
    const g = ctx.createRadialGradient(x, y, r * 0.08, x, y, r);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    return g;
  };

  // 1. PEACOCK (with fanned plumage & eye-spots)
  if (q.includes('peacock') || q.includes('mayur') || q.includes('mor')) {
    const fanCx = cx, fanCy = cy + 28;
    for (let i = -5; i <= 5; i++) {
      const a = -Math.PI / 2 + i * 0.24;
      const len = 94 - Math.abs(i) * 4;
      const fx = fanCx + Math.cos(a) * len;
      const fy = fanCy + Math.sin(a) * len;
      ctx.strokeStyle = c3; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(fanCx, fanCy); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(fx, fy, 11, 15, a + Math.PI / 2, 0, Math.PI * 2);
      drawFilledGlow(ctx, c2, c1, 2.2);
      ctx.beginPath(); ctx.arc(fx, fy, 5, 0, Math.PI * 2);
      drawFilledGlow(ctx, c1, '#FFFFFF', 1.2);
    }
    // Inner fan feathers
    for (let i = -3; i <= 3; i++) {
      const a = -Math.PI / 2 + i * 0.30;
      const fx = fanCx + Math.cos(a) * 56;
      const fy = fanCy + Math.sin(a) * 56;
      ctx.beginPath(); ctx.ellipse(fx, fy, 8, 11, a + Math.PI / 2, 0, Math.PI * 2);
      drawFilledGlow(ctx, c3, c2, 2);
    }
    // Peacock body & S-curved neck
    ctx.beginPath();
    ctx.ellipse(cx, cy + 44, 18, 28, 0, 0, Math.PI * 2);
    drawFilledGlow(ctx, radGrad(cx, cy + 44, 28, '#FFFFFF', c2), c1, 3);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 28);
    ctx.bezierCurveTo(cx - 12, cy + 2, cx + 14, cy - 16, cx + 2, cy - 32);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 2, cy - 34, 9, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', c1, 2.5);
    // Beak & crest
    ctx.fillStyle = c1;
    ctx.beginPath(); ctx.moveTo(cx + 9, cy - 35); ctx.lineTo(cx + 21, cy - 31); ctx.lineTo(cx + 9, cy - 28); ctx.closePath(); ctx.fill();
    for (let k = -1; k <= 1; k++) {
      ctx.strokeStyle = c1; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx + 2, cy - 42); ctx.lineTo(cx + 2 + k * 7, cy - 56); ctx.stroke();
      ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(cx + 2 + k * 7, cy - 57, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    return true;
  }

  // 2. GATEWAY OF INDIA (check BEFORE generic india/map!)
  if (q.includes('gateway')) {
    ctx.beginPath(); ctx.rect(52, 74, 216, 116);
    drawFilledGlow(ctx, radGrad(cx, 130, 110, c2, '#1E293B'), c1, 3);
    // Central grand arch cutout + bright rim
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.moveTo(cx - 34, 190); ctx.lineTo(cx - 34, 128);
    ctx.arc(cx, 128, 34, Math.PI, 0); ctx.lineTo(cx + 34, 190); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3.5; ctx.stroke();
    // Side arches
    [-68, 68].forEach(ox => {
      ctx.fillStyle = '#000000';
      ctx.beginPath(); ctx.moveTo(cx + ox - 16, 190); ctx.lineTo(cx + ox - 16, 146);
      ctx.arc(cx + ox, 146, 16, Math.PI, 0); ctx.lineTo(cx + ox + 16, 190); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = c1; ctx.lineWidth = 2.5; ctx.stroke();
    });
    // Central dome & 4 corner turrets
    ctx.beginPath(); ctx.arc(cx, 74, 34, Math.PI, 0);
    drawFilledGlow(ctx, '#FFFFFF', c1, 3.5);
    [-100, -48, 48, 100].forEach(tx => {
      ctx.beginPath(); ctx.rect(cx + tx - 7, 50, 14, 140);
      drawFilledGlow(ctx, c1, '#FFFFFF', 2);
      ctx.beginPath(); ctx.arc(cx + tx, 50, 8, Math.PI, 0);
      drawFilledGlow(ctx, '#FFFFFF', c1, 2);
    });
    ctx.strokeStyle = c3; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(34, 192); ctx.lineTo(286, 192); ctx.stroke();
    return true;
  }

  // 3. INDIA GATE (check BEFORE generic india/map!)
  if (q.includes('india gate')) {
    ctx.beginPath(); ctx.rect(96, 44, 128, 152);
    drawFilledGlow(ctx, radGrad(cx, 120, 90, c1, c3), '#FFFFFF', 3);
    // Cornice tiers
    ctx.beginPath(); ctx.rect(86, 36, 148, 14);
    drawFilledGlow(ctx, '#FFFFFF', c1, 2.5);
    ctx.beginPath(); ctx.rect(108, 22, 104, 14);
    drawFilledGlow(ctx, c1, '#FFFFFF', 2.5);
    // Tall central arch opening
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.moveTo(cx - 28, 196); ctx.lineTo(cx - 28, 114);
    ctx.arc(cx, 114, 28, Math.PI, 0); ctx.lineTo(cx + 28, 196); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3.5; ctx.stroke();
    // Amar Jawan Jyoti flame inside arch
    ctx.beginPath(); ctx.moveTo(cx, 152); ctx.quadraticCurveTo(cx + 12, 170, cx, 184);
    ctx.quadraticCurveTo(cx - 12, 170, cx, 152);
    drawFilledGlow(ctx, '#FFD700', '#FFFFFF', 2);
    // Stepped base
    ctx.beginPath(); ctx.rect(72, 196, 176, 12);
    drawFilledGlow(ctx, c3, '#FFFFFF', 2.5);
    return true;
  }

  // 4. RAM MANDIR / AYODHYA
  if (q.includes('ram mandir') || q.includes('ayodhya')) {
    // Plinth
    ctx.beginPath(); ctx.rect(42, 174, 236, 22);
    drawFilledGlow(ctx, c3, '#FFFFFF', 2.5);
    // Main Shikhara (tall stepped Nagara spire)
    for (let tier = 0; tier < 6; tier++) {
      const tw = 74 - tier * 10;
      const ty = 152 - tier * 17;
      ctx.beginPath(); ctx.rect(cx - tw / 2, ty, tw, 18);
      drawFilledGlow(ctx, tier % 2 === 0 ? c1 : '#FFFFFF', c2, 2.2);
    }
    // Amalaka & Kalash + Saffron Flag (Dhwaja)
    ctx.beginPath(); ctx.arc(cx, 48, 8, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', c1, 2);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, 42); ctx.lineTo(cx, 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 18); ctx.lineTo(cx + 26, 25); ctx.lineTo(cx, 32); ctx.closePath();
    drawFilledGlow(ctx, '#FF9933', '#FFFFFF', 1.5);
    // Side Mandapa domes
    [-58, 58].forEach(mx => {
      ctx.beginPath(); ctx.rect(cx + mx - 24, 134, 48, 40);
      drawFilledGlow(ctx, c2, '#FFFFFF', 2);
      ctx.beginPath(); ctx.moveTo(cx + mx - 24, 134); ctx.lineTo(cx + mx, 102); ctx.lineTo(cx + mx + 24, 134); ctx.closePath();
      drawFilledGlow(ctx, c1, '#FFFFFF', 2);
    });
    return true;
  }

  // 5. TAJ MAHAL
  if (q.includes('taj') || q.includes('mahal')) {
    ctx.beginPath(); ctx.rect(44, 174, 232, 18);
    drawFilledGlow(ctx, c3, '#FFFFFF', 2.5);
    ctx.beginPath(); ctx.rect(cx - 56, 92, 112, 82);
    drawFilledGlow(ctx, radGrad(cx, 130, 60, '#FFFFFF', c2), c1, 3);
    // Onion Dome
    ctx.beginPath();
    ctx.moveTo(cx - 32, 92);
    ctx.bezierCurveTo(cx - 42, 62, cx - 18, 42, cx, 32);
    ctx.bezierCurveTo(cx + 18, 42, cx + 42, 62, cx + 32, 92);
    ctx.closePath();
    drawFilledGlow(ctx, radGrad(cx, 66, 32, '#FFFFFF', c1), '#FFFFFF', 3);
    ctx.strokeStyle = c1; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, 16); ctx.lineTo(cx, 34); ctx.stroke();
    // Pishtaq central arch
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.moveTo(cx - 22, 174); ctx.lineTo(cx - 22, 132);
    ctx.arc(cx, 132, 22, Math.PI, 0); ctx.lineTo(cx + 22, 174); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = c1; ctx.lineWidth = 3; ctx.stroke();
    // 4 Minarets
    [-92, -72, 72, 92].forEach((mx, idx) => {
      ctx.beginPath(); ctx.rect(cx + mx - 5, 62, 10, 112);
      drawFilledGlow(ctx, idx % 2 === 0 ? c1 : '#FFFFFF', c2, 2);
      ctx.beginPath(); ctx.arc(cx + mx, 58, 6, Math.PI, 0);
      drawFilledGlow(ctx, '#FFFFFF', c1, 2);
    });
    return true;
  }

  // 6. INDIAN MAP (only when explicitly requested)
  if (q.includes('india') || q.includes('map') || q.includes('bharat')) {
    const pts = [
      [148,22],[164,26],[174,42],[168,56],[186,68],[218,72],
      [246,62],[262,74],[248,92],[234,88],[214,96],[206,118],
      [184,146],[166,186],[156,216],[146,188],[130,148],[116,122],
      [94,114],[90,98],[114,92],[126,72],[136,48],
    ];
    const grad = ctx.createLinearGradient(0, 20, 0, 216);
    grad.addColorStop(0.0, c1);
    grad.addColorStop(0.5, c2);
    grad.addColorStop(1.0, c3);
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    drawFilledGlow(ctx, grad, '#FFFFFF', 3.5);
    ctx.strokeStyle = '#38BDF8'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(160, 118, 20, 0, Math.PI * 2); ctx.stroke();
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(160, 118); ctx.lineTo(160 + 19 * Math.cos(a), 118 + 19 * Math.sin(a)); ctx.stroke();
    }
    return true;
  }

  // 7. GANESHA
  if (q.includes('ganesh') || q.includes('ganpati') || q.includes('vinayak') || q.includes('bappa')) {
    // Large ears
    [-1, 1].forEach(s => {
      ctx.beginPath(); ctx.ellipse(cx + s * 56, cy + 4, 30, 44, s * 0.25, 0, Math.PI * 2);
      drawFilledGlow(ctx, c2, c1, 3);
    });
    // Head
    ctx.beginPath(); ctx.arc(cx, cy + 4, 42, 0, Math.PI * 2);
    drawFilledGlow(ctx, radGrad(cx, cy + 4, 42, '#FFFFFF', c1), '#FFFFFF', 3);
    // Crown (Mukut)
    ctx.beginPath();
    ctx.moveTo(cx - 28, cy - 30); ctx.lineTo(cx - 18, cy - 64);
    ctx.lineTo(cx, cy - 82); ctx.lineTo(cx + 18, cy - 64); ctx.lineTo(cx + 28, cy - 30);
    ctx.closePath();
    drawFilledGlow(ctx, c1, '#FFFFFF', 3);
    // Curved Trunk
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 10);
    ctx.bezierCurveTo(cx, cy + 54, cx + 28, cy + 72, cx + 44, cy + 54);
    ctx.stroke();
    ctx.strokeStyle = c1; ctx.lineWidth = 4; ctx.stroke();
    // Tilak & Eyes
    ctx.fillStyle = '#FF2A85';
    ctx.beginPath(); ctx.arc(cx, cy - 12, 4.5, 0, Math.PI * 2); ctx.fill();
    [-14, 14].forEach(ex => {
      ctx.fillStyle = '#000000'; ctx.beginPath(); ctx.arc(cx + ex, cy - 2, 4, 0, Math.PI * 2); ctx.fill();
    });
    return true;
  }

  // 8. FLUTE (Bansuri + Mor Pankh)
  if (q.includes('flute') || q.includes('bansuri') || q.includes('krishna') || q.includes('murali')) {
    ctx.save();
    ctx.translate(cx, cy + 12);
    ctx.rotate(-0.35);
    ctx.beginPath(); ctx.roundRect(-105, -9, 210, 18, 9);
    drawFilledGlow(ctx, radGrad(0, 0, 100, '#FFFFFF', c1), '#FFFFFF', 3);
    for (let i = -2; i <= 4; i++) {
      ctx.fillStyle = '#000000';
      ctx.beginPath(); ctx.arc(i * 22, 0, 3.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // Peacock feather (Mor Pankh)
    ctx.beginPath(); ctx.ellipse(cx + 38, cy - 48, 22, 30, 0.35, 0, Math.PI * 2);
    drawFilledGlow(ctx, c3, c2, 3);
    ctx.beginPath(); ctx.ellipse(cx + 38, cy - 48, 12, 16, 0.35, 0, Math.PI * 2);
    drawFilledGlow(ctx, c1, '#FFFFFF', 2);
    return true;
  }

  // 9. WEDDING COUPLE
  if (q.includes('wedding') || q.includes('couple') || q.includes('bride') || q.includes('groom') || q.includes('shaadi') || q.includes('dulha')) {
    // Mandap floral arch
    ctx.strokeStyle = c1; ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.arc(cx, cy + 28, 92, Math.PI, 0); ctx.stroke();
    // Groom (left)
    ctx.beginPath(); ctx.arc(cx - 32, cy - 20, 16, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', c2, 2.5);
    ctx.beginPath(); ctx.moveTo(cx - 56, cy + 78); ctx.lineTo(cx - 46, cy + 4); ctx.lineTo(cx - 18, cy + 4); ctx.lineTo(cx - 10, cy + 78); ctx.closePath();
    drawFilledGlow(ctx, c2, '#FFFFFF', 2.5);
    // Bride (right)
    ctx.beginPath(); ctx.arc(cx + 32, cy - 16, 15, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', c1, 2.5);
    ctx.beginPath(); ctx.moveTo(cx + 8, cy + 78); ctx.lineTo(cx + 20, cy + 6); ctx.lineTo(cx + 44, cy + 6); ctx.lineTo(cx + 62, cy + 78); ctx.closePath();
    drawFilledGlow(ctx, c1, '#FFFFFF', 2.5);
    // Varmala garland + glowing heart
    ctx.strokeStyle = '#FF2A85'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy + 10, 20, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    drawStarPolygon(ctx, cx, cy - 52, 5, 14, 6);
    drawFilledGlow(ctx, '#FF2A85', '#FFFFFF', 2);
    return true;
  }

  // 10. DHOL / DRUM
  if (q.includes('dhol') || q.includes('drum') || q.includes('tabla')) {
    ctx.save();
    ctx.translate(cx, cy + 8);
    ctx.rotate(-0.18);
    ctx.beginPath(); ctx.ellipse(0, 0, 74, 46, 0, 0, Math.PI * 2);
    drawFilledGlow(ctx, radGrad(0, 0, 70, c1, c3), '#FFFFFF', 3.5);
    // Drumheads
    [-68, 68].forEach(dx => {
      ctx.beginPath(); ctx.ellipse(dx, 0, 14, 44, 0, 0, Math.PI * 2);
      drawFilledGlow(ctx, '#FFFFFF', c2, 3);
    });
    // Rope zig-zag lacing
    ctx.strokeStyle = c2; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = -3; i <= 3; i++) {
      ctx.lineTo(i * 18, i % 2 === 0 ? -40 : 40);
    }
    ctx.stroke();
    ctx.restore();
    // Crossed drumsticks
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx - 56, cy - 72); ctx.lineTo(cx + 12, cy - 36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 56, cy - 72); ctx.lineTo(cx - 12, cy - 36); ctx.stroke();
    return true;
  }

  // 11. TIGER
  if (q.includes('tiger') || q.includes('bagh') || q.includes('sher')) {
    [-1, 1].forEach(s => {
      ctx.beginPath(); ctx.arc(cx + s * 52, cy - 54, 18, 0, Math.PI * 2);
      drawFilledGlow(ctx, c1, '#FFFFFF', 3);
    });
    ctx.beginPath(); ctx.ellipse(cx, cy + 4, 68, 60, 0, 0, Math.PI * 2);
    drawFilledGlow(ctx, radGrad(cx, cy, 66, '#FFFFFF', c1), '#FFFFFF', 3.5);
    // Bold tiger stripes
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 6;
    [-34, -18, 18, 34].forEach(sy => {
      ctx.beginPath(); ctx.moveTo(cx - 52, cy + sy); ctx.lineTo(cx - 22, cy + sy - 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 52, cy + sy); ctx.lineTo(cx + 22, cy + sy - 6); ctx.stroke();
    });
    // Glowing eyes & nose
    [-22, 22].forEach(ex => {
      ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(cx + ex, cy - 12, 9, 5, ex < 0 ? 0.2 : -0.2, 0, Math.PI * 2); ctx.fill();
    });
    ctx.beginPath(); ctx.moveTo(cx - 12, cy + 10); ctx.lineTo(cx + 12, cy + 10); ctx.lineTo(cx, cy + 24); ctx.closePath();
    drawFilledGlow(ctx, '#FF2A85', '#FFFFFF', 2);
    return true;
  }

  // 12. LION
  if (q.includes('lion') || q.includes('simha')) {
    // Radiant spiky mane
    drawStarPolygon(ctx, cx, cy, 16, 92, 66);
    drawFilledGlow(ctx, radGrad(cx, cy, 90, c1, c3), '#FFFFFF', 3);
    ctx.beginPath(); ctx.arc(cx, cy + 4, 46, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', c1, 3);
    [-18, 18].forEach(ex => {
      ctx.fillStyle = '#000000'; ctx.beginPath(); ctx.arc(cx + ex, cy - 8, 5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.beginPath(); ctx.moveTo(cx - 10, cy + 8); ctx.lineTo(cx + 10, cy + 8); ctx.lineTo(cx, cy + 22); ctx.closePath();
    drawFilledGlow(ctx, c1, '#000000', 2);
    return true;
  }

  // 13. ELEPHANT
  if (q.includes('elephant') || q.includes('hathi') || q.includes('airavat')) {
    // Body
    ctx.beginPath(); ctx.ellipse(cx - 16, cy + 10, 62, 44, 0, 0, Math.PI * 2);
    drawFilledGlow(ctx, radGrad(cx - 16, cy + 10, 60, '#FFFFFF', c2), c1, 3);
    // Legs
    [-58, -32, 8, 32].forEach(lx => {
      ctx.beginPath(); ctx.rect(cx + lx, cy + 38, 16, 44);
      drawFilledGlow(ctx, c2, '#FFFFFF', 2.5);
    });
    // Head + Ear + Raised Trunk
    ctx.beginPath(); ctx.arc(cx + 46, cy - 10, 28, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', c1, 3);
    ctx.beginPath(); ctx.ellipse(cx + 28, cy - 8, 18, 26, -0.2, 0, Math.PI * 2);
    drawFilledGlow(ctx, c1, '#FFFFFF', 2.5);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(cx + 66, cy - 4); ctx.bezierCurveTo(cx + 98, cy + 12, cx + 104, cy - 36, cx + 82, cy - 52); ctx.stroke();
    // Ornate royal blanket
    ctx.beginPath(); ctx.rect(cx - 46, cy - 28, 56, 34);
    drawFilledGlow(ctx, c1, '#FFFFFF', 2.5);
    return true;
  }

  // 14. TROPHY
  if (q.includes('trophy') || q.includes('cup') || q.includes('champion') || q.includes('winner') || q.includes('ipl')) {
    // Handles
    [-1, 1].forEach(s => {
      ctx.strokeStyle = c1; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(cx + s * 46, cy - 26, 22, s < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, s < 0 ? Math.PI * 1.5 : Math.PI * 0.5); ctx.stroke();
    });
    // Cup chalice
    ctx.beginPath();
    ctx.moveTo(cx - 48, cy - 68); ctx.lineTo(cx + 48, cy - 68);
    ctx.quadraticCurveTo(cx + 44, cy + 6, cx, cy + 18);
    ctx.quadraticCurveTo(cx - 44, cy + 6, cx - 48, cy - 68);
    ctx.closePath();
    drawFilledGlow(ctx, radGrad(cx, cy - 30, 50, '#FFFFFF', c1), '#FFFFFF', 3.5);
    // Stem & Base
    ctx.beginPath(); ctx.rect(cx - 10, cy + 16, 20, 38);
    drawFilledGlow(ctx, c1, '#FFFFFF', 2.5);
    ctx.beginPath(); ctx.rect(cx - 42, cy + 54, 84, 22);
    drawFilledGlow(ctx, c2, '#FFFFFF', 3);
    drawStarPolygon(ctx, cx, cy - 34, 5, 16, 7);
    drawFilledGlow(ctx, c2, '#FFFFFF', 2);
    return true;
  }

  // 15. GLOBE / EARTH
  if (q.includes('globe') || q.includes('earth') || q.includes('world') || q.includes('planet')) {
    ctx.beginPath(); ctx.arc(cx, cy, 74, 0, Math.PI * 2);
    drawFilledGlow(ctx, radGrad(cx - 18, cy - 18, 76, '#38BDF8', '#0284C7'), '#FFFFFF', 3.5);
    ctx.strokeStyle = '#10B981'; ctx.lineWidth = 3;
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath(); ctx.ellipse(cx, cy, 74 * Math.cos(k * 0.4), 74, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.strokeStyle = c1; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(cx, cy, 98, 24, -0.32, 0, Math.PI * 2); ctx.stroke();
    return true;
  }

  // 16. ROCKET / ISRO
  if (q.includes('rocket') || q.includes('isro') || q.includes('chandrayaan') || q.includes('space') || q.includes('missile')) {
    // Exhaust flame
    ctx.beginPath(); ctx.moveTo(cx - 16, cy + 44); ctx.lineTo(cx, cy + 98); ctx.lineTo(cx + 16, cy + 44); ctx.closePath();
    drawFilledGlow(ctx, '#FF6D00', '#FFD700', 3);
    // Fins
    [-1, 1].forEach(s => {
      ctx.beginPath(); ctx.moveTo(cx + s * 18, cy + 14); ctx.lineTo(cx + s * 44, cy + 54); ctx.lineTo(cx + s * 18, cy + 44); ctx.closePath();
      drawFilledGlow(ctx, c2, '#FFFFFF', 2.5);
    });
    // Body + Nose
    ctx.beginPath(); ctx.moveTo(cx, cy - 92); ctx.quadraticCurveTo(cx + 24, cy - 48, cx + 20, cy + 44);
    ctx.lineTo(cx - 20, cy + 44); ctx.quadraticCurveTo(cx - 24, cy - 48, cx, cy - 92); ctx.closePath();
    drawFilledGlow(ctx, radGrad(cx, cy - 20, 50, '#FFFFFF', c1), '#FFFFFF', 3.5);
    ctx.beginPath(); ctx.arc(cx, cy - 24, 9, 0, Math.PI * 2);
    drawFilledGlow(ctx, c2, '#FFFFFF', 2);
    return true;
  }

  // 17. HEART
  if (q.includes('heart') || q.includes('love') || q.includes('dil') || q.includes('pyaar')) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + 72);
    ctx.bezierCurveTo(cx - 98, cy + 12, cx - 86, cy - 78, cx, cy - 28);
    ctx.bezierCurveTo(cx + 86, cy - 78, cx + 98, cy + 12, cx, cy + 72);
    ctx.closePath();
    drawFilledGlow(ctx, radGrad(cx, cy - 8, 76, '#FFFFFF', '#FF2A85'), c1, 4);
    return true;
  }

  // 18. RINGS / DIAMOND
  if (q.includes('ring') || q.includes('engagement') || q.includes('solitaire') || q.includes('diamond')) {
    ctx.strokeStyle = c1; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(cx - 26, cy + 14, 46, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(cx + 26, cy + 14, 46, 0, Math.PI * 2); ctx.stroke();
    // Solitaire diamond
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy - 58); ctx.lineTo(cx - 14, cy - 76); ctx.lineTo(cx + 14, cy - 76);
    ctx.lineTo(cx + 26, cy - 58); ctx.lineTo(cx, cy - 30); ctx.closePath();
    drawFilledGlow(ctx, radGrad(cx, cy - 56, 26, '#FFFFFF', '#00E5FF'), '#FFFFFF', 3);
    return true;
  }

  // 19. TRISHUL / SHIVA
  if (q.includes('trishul') || q.includes('shiv') || q.includes('mahadev')) {
    ctx.strokeStyle = c2; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(cx, 20); ctx.lineTo(cx, 216); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 18); ctx.lineTo(cx - 14, 56); ctx.lineTo(cx + 14, 56); ctx.closePath();
    drawFilledGlow(ctx, '#FFFFFF', c1, 3);
    ctx.strokeStyle = c1; ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx - 48, 36); ctx.quadraticCurveTo(cx - 54, 92, cx, 92);
    ctx.quadraticCurveTo(cx + 54, 92, cx + 48, 36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 26, 134); ctx.lineTo(cx + 26, 160); ctx.lineTo(cx + 26, 134); ctx.lineTo(cx - 26, 160); ctx.closePath();
    drawFilledGlow(ctx, c3, '#FFFFFF', 2.5);
    return true;
  }

  // 20. LOTUS
  if (q.includes('lotus') || q.includes('kamal') || q.includes('padma') || q.includes('flower')) {
    for (let layer = 2; layer >= 0; layer--) {
      const petals = 8 + layer * 4, r = 38 + layer * 24;
      const col = layer === 0 ? '#FFFFFF' : (layer === 1 ? c1 : c2);
      for (let k = 0; k < petals; k++) {
        const a = (k / petals) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(a) * (r * 0.54), cy + Math.sin(a) * (r * 0.54), r * 0.44, 12, a, 0, Math.PI * 2);
        drawFilledGlow(ctx, col, c3, 2);
      }
    }
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    drawFilledGlow(ctx, c1, '#FFFFFF', 2.5);
    return true;
  }

  // 21. DIYA / LAMP
  if (q.includes('diya') || q.includes('lamp') || q.includes('deepam') || q.includes('diwali')) {
    ctx.beginPath(); ctx.arc(cx, cy + 18, 72, 0.08 * Math.PI, 0.92 * Math.PI); ctx.closePath();
    drawFilledGlow(ctx, radGrad(cx, cy + 40, 68, c1, c3), '#FFFFFF', 3.5);
    ctx.beginPath();
    ctx.moveTo(cx, 28); ctx.quadraticCurveTo(cx + 38, 86, cx, 128); ctx.quadraticCurveTo(cx - 38, 86, cx, 28);
    drawFilledGlow(ctx, radGrad(cx, 88, 36, '#FFFFFF', '#FFD700'), c1, 3);
    return true;
  }

  // 22. CROWN
  if (q.includes('crown') || q.includes('king') || q.includes('royal') || q.includes('tiara') || q.includes('queen')) {
    ctx.beginPath();
    ctx.moveTo(64, 178); ctx.lineTo(50, 82); ctx.lineTo(106, 124);
    ctx.lineTo(cx, 54); ctx.lineTo(214, 124); ctx.lineTo(270, 82);
    ctx.lineTo(256, 178); ctx.closePath();
    drawFilledGlow(ctx, radGrad(cx, 130, 86, '#FFFFFF', c1), '#FFFFFF', 3.5);
    [50, cx, 270].forEach(jx => {
      ctx.beginPath(); ctx.arc(jx, jx === cx ? 48 : 76, 8, 0, Math.PI * 2);
      drawFilledGlow(ctx, c2, '#FFFFFF', 2);
    });
    return true;
  }

  // 23. OM / AUM
  if (q.includes('om') || q.includes('aum')) {
    ctx.beginPath(); ctx.arc(cx, cy, 86, 0, Math.PI * 2);
    ctx.strokeStyle = c2; ctx.lineWidth = 4; ctx.stroke();
    ctx.font = 'bold 124px Georgia, serif';
    ctx.fillStyle = c1; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('ॐ', cx, cy + 6);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5;
    ctx.strokeText('ॐ', cx, cy + 6);
    return true;
  }

  // 24. MANDALA / RANGOLI / YANTRA
  if (q.includes('mandala') || q.includes('rangoli') || q.includes('yantra')) {
    for (let r = 88; r >= 22; r -= 22) {
      drawStarPolygon(ctx, cx, cy, 12, r, r * 0.68, r * 0.02);
      drawFilledGlow(ctx, r === 22 ? '#FFFFFF' : (r % 44 === 0 ? c1 : c2), '#FFFFFF', 2.5);
    }
    return true;
  }

  // 25. ASHOKA CHAKRA / WHEEL
  if (q.includes('chakra') || q.includes('wheel')) {
    ctx.strokeStyle = c2; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(cx, cy, 82, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', c1, 3);
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      ctx.strokeStyle = k % 2 === 0 ? '#FFFFFF' : c2; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 80 * Math.cos(a), cy + 80 * Math.sin(a)); ctx.stroke();
    }
    return true;
  }

  // 26. BUTTERFLY
  if (q.includes('butterfly') || q.includes('titli')) {
    [-1, 1].forEach(s => {
      ctx.beginPath(); ctx.ellipse(cx + s * 52, cy - 26, 44, 34, s * -0.35, 0, Math.PI * 2);
      drawFilledGlow(ctx, radGrad(cx + s * 52, cy - 26, 40, '#FFFFFF', c1), c2, 3);
      ctx.beginPath(); ctx.ellipse(cx + s * 40, cy + 28, 30, 26, s * 0.35, 0, Math.PI * 2);
      drawFilledGlow(ctx, c2, '#FFFFFF', 3);
    });
    ctx.beginPath(); ctx.ellipse(cx, cy + 4, 8, 44, 0, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', c1, 2.5);
    return true;
  }

  // 27. EAGLE / GARUDA / PHOENIX / BIRD
  if (q.includes('eagle') || q.includes('garuda') || q.includes('phoenix') || q.includes('bird') || q.includes('falcon') || q.includes('hawk') || q.includes('dove')) {
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);
      ctx.quadraticCurveTo(cx + s * 64, cy - 84, cx + s * 116, cy - 36);
      ctx.quadraticCurveTo(cx + s * 78, cy + 12, cx + s * 14, cy + 18);
      ctx.closePath();
      drawFilledGlow(ctx, radGrad(cx + s * 56, cy - 26, 54, '#FFFFFF', c1), '#FFFFFF', 3);
    });
    ctx.beginPath(); ctx.moveTo(cx, cy - 52); ctx.lineTo(cx + 14, cy + 26); ctx.lineTo(cx, cy + 72); ctx.lineTo(cx - 14, cy + 26); ctx.closePath();
    drawFilledGlow(ctx, c2, '#FFFFFF', 3);
    return true;
  }

  // 28. HORSE / UNICORN
  if (q.includes('horse') || q.includes('ashwa') || q.includes('stallion') || q.includes('unicorn')) {
    ctx.beginPath();
    ctx.moveTo(cx - 46, cy + 68); ctx.lineTo(cx - 28, cy + 8);
    ctx.quadraticCurveTo(cx - 10, cy - 64, cx + 34, cy - 66);
    ctx.lineTo(cx + 62, cy - 42); ctx.lineTo(cx + 42, cy - 26);
    ctx.quadraticCurveTo(cx + 16, cy - 24, cx + 22, cy + 68);
    ctx.closePath();
    drawFilledGlow(ctx, radGrad(cx, cy, 60, '#FFFFFF', c1), '#FFFFFF', 3.5);
    if (q.includes('unicorn')) {
      ctx.strokeStyle = c2; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx + 34, cy - 64); ctx.lineTo(cx + 62, cy - 96); ctx.stroke();
    }
    return true;
  }

  // 29. SHIP / BOAT / YACHT
  if (q.includes('ship') || q.includes('boat') || q.includes('yacht') || q.includes('sail')) {
    ctx.beginPath(); ctx.moveTo(cx - 88, cy + 36); ctx.lineTo(cx + 88, cy + 36);
    ctx.lineTo(cx + 62, cy + 74); ctx.lineTo(cx - 62, cy + 74); ctx.closePath();
    drawFilledGlow(ctx, c2, '#FFFFFF', 3.5);
    ctx.beginPath(); ctx.moveTo(cx - 6, cy + 32); ctx.lineTo(cx - 6, cy - 78); ctx.lineTo(cx + 58, cy + 24); ctx.closePath();
    drawFilledGlow(ctx, '#FFFFFF', c1, 3);
    ctx.beginPath(); ctx.moveTo(cx - 14, cy + 28); ctx.lineTo(cx - 14, cy - 58); ctx.lineTo(cx - 68, cy + 24); ctx.closePath();
    drawFilledGlow(ctx, c1, '#FFFFFF', 2.5);
    return true;
  }

  // 30. AIRPLANE / JET
  if (q.includes('plane') || q.includes('jet') || q.includes('aircraft') || q.includes('fighter')) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 88); ctx.lineTo(cx + 14, cy - 24); ctx.lineTo(cx + 98, cy + 16);
    ctx.lineTo(cx + 98, cy + 34); ctx.lineTo(cx + 14, cy + 14); ctx.lineTo(cx + 10, cy + 62);
    ctx.lineTo(cx + 36, cy + 82); ctx.lineTo(cx, cy + 74);
    ctx.lineTo(cx - 36, cy + 82); ctx.lineTo(cx - 10, cy + 62);
    ctx.lineTo(cx - 14, cy + 14); ctx.lineTo(cx - 98, cy + 34); ctx.lineTo(cx - 98, cy + 16);
    ctx.lineTo(cx - 14, cy - 24); ctx.closePath();
    drawFilledGlow(ctx, radGrad(cx, cy, 70, '#FFFFFF', c2), c1, 3.5);
    return true;
  }

  // 31. SUPERCAR / F1
  if (q.includes('car') || q.includes('supercar') || q.includes('formula') || q.includes('racing')) {
    ctx.beginPath();
    ctx.moveTo(cx - 102, cy + 24); ctx.quadraticCurveTo(cx - 96, cy - 6, cx - 44, cy - 12);
    ctx.quadraticCurveTo(cx - 14, cy - 42, cx + 36, cy - 36);
    ctx.lineTo(cx + 92, cy - 6); ctx.lineTo(cx + 104, cy + 24); ctx.closePath();
    drawFilledGlow(ctx, radGrad(cx, cy, 75, '#FFFFFF', c1), '#FFFFFF', 3.5);
    [-62, 62].forEach(wx => {
      ctx.beginPath(); ctx.arc(cx + wx, cy + 26, 22, 0, Math.PI * 2);
      drawFilledGlow(ctx, '#000000', c2, 5);
    });
    return true;
  }

  // 32. GUITAR / SITAR / MUSIC
  if (q.includes('guitar') || q.includes('sitar') || q.includes('veena') || q.includes('music')) {
    ctx.save(); ctx.translate(cx, cy + 12); ctx.rotate(-0.45);
    ctx.beginPath(); ctx.ellipse(0, 32, 34, 38, 0, 0, Math.PI * 2);
    drawFilledGlow(ctx, c1, '#FFFFFF', 3);
    ctx.beginPath(); ctx.ellipse(0, -6, 24, 24, 0, 0, Math.PI * 2);
    drawFilledGlow(ctx, c1, '#FFFFFF', 3);
    ctx.beginPath(); ctx.rect(-6, -92, 12, 74);
    drawFilledGlow(ctx, '#FFFFFF', c2, 2.5);
    ctx.fillStyle = '#000000'; ctx.beginPath(); ctx.arc(0, 14, 11, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return true;
  }

  // 33. CASTLE / FORT / PALACE
  if (q.includes('castle') || q.includes('fort') || q.includes('palace') || q.includes('qila') || q.includes('hawa')) {
    ctx.beginPath(); ctx.rect(cx - 76, cy - 10, 152, 92);
    drawFilledGlow(ctx, radGrad(cx, cy + 36, 70, '#FFFFFF', c2), c1, 3);
    [-68, 0, 68].forEach((tx, idx) => {
      const th = idx === 1 ? 124 : 96;
      ctx.beginPath(); ctx.rect(cx + tx - 16, cy + 82 - th, 32, th);
      drawFilledGlow(ctx, c1, '#FFFFFF', 2.5);
      ctx.beginPath(); ctx.moveTo(cx + tx - 20, cy + 82 - th); ctx.lineTo(cx + tx, cy + 52 - th); ctx.lineTo(cx + tx + 20, cy + 82 - th); ctx.closePath();
      drawFilledGlow(ctx, '#FFFFFF', c2, 2);
    });
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(cx, cy + 54, 18, Math.PI, 0); ctx.lineTo(cx + 18, cy + 82); ctx.lineTo(cx - 18, cy + 82); ctx.closePath(); ctx.fill();
    return true;
  }

  // 34. BRIDGE / SEA LINK
  if (q.includes('bridge') || q.includes('sea link') || q.includes('howrah')) {
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(24, cy + 36); ctx.lineTo(296, cy + 36); ctx.stroke();
    [-58, 58].forEach(px => {
      ctx.beginPath(); ctx.rect(cx + px - 6, cy - 64, 12, 116);
      drawFilledGlow(ctx, c1, '#FFFFFF', 2.5);
      for (let k = -4; k <= 4; k++) {
        ctx.strokeStyle = c2; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(cx + px, cy - 58); ctx.lineTo(cx + px + k * 14, cy + 36); ctx.stroke();
      }
    });
    return true;
  }

  // 35. TREE / BANYAN / NATURE
  if (q.includes('tree') || q.includes('banyan') || q.includes('palm') || q.includes('nature')) {
    ctx.beginPath(); ctx.moveTo(cx - 14, cy + 86); ctx.lineTo(cx - 8, cy); ctx.lineTo(cx + 8, cy); ctx.lineTo(cx + 14, cy + 86); ctx.closePath();
    drawFilledGlow(ctx, c1, '#FFFFFF', 3);
    [[0, -34, 52], [-42, -12, 38], [42, -12, 38], [-24, -56, 36], [24, -56, 36]].forEach(([ox, oy, r]) => {
      ctx.beginPath(); ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2);
      drawFilledGlow(ctx, '#10B981', '#FFFFFF', 2.5);
    });
    return true;
  }

  // 36. SUN / SURYA
  if (q.includes('sun') || q.includes('surya') || q.includes('solar')) {
    drawStarPolygon(ctx, cx, cy, 16, 92, 58);
    drawFilledGlow(ctx, radGrad(cx, cy, 80, '#FFFFFF', '#FF6D00'), '#FFD700', 3);
    ctx.beginPath(); ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', '#FFD700', 3);
    return true;
  }

  // 37. CRESCENT MOON / EID
  if (q.includes('moon') || q.includes('chand') || q.includes('eid') || q.includes('crescent')) {
    ctx.beginPath(); ctx.arc(cx - 10, cy, 70, 0, Math.PI * 2);
    drawFilledGlow(ctx, radGrad(cx - 10, cy, 70, '#FFFFFF', c1), '#FFFFFF', 3);
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(cx + 18, cy - 10, 58, 0, Math.PI * 2); ctx.fill();
    drawStarPolygon(ctx, cx + 48, cy - 36, 5, 18, 7);
    drawFilledGlow(ctx, '#FFFFFF', c2, 2);
    return true;
  }

  // 38. ANGEL WINGS / VICTORY WINGS
  if (q.includes('wing') || q.includes('angel') || q.includes('victory')) {
    [-1, 1].forEach(s => {
      for (let f = 0; f < 5; f++) {
        ctx.beginPath();
        ctx.ellipse(cx + s * (38 + f * 16), cy - 34 + f * 18, 36 - f * 4, 12, s * (-0.4 + f * 0.14), 0, Math.PI * 2);
        drawFilledGlow(ctx, f % 2 === 0 ? '#FFFFFF' : c2, c1, 2.5);
      }
    });
    return true;
  }

  // 39. STAR / COMPASS
  if (q.includes('star') || q.includes('compass') || q.includes('polaris')) {
    drawStarPolygon(ctx, cx, cy, 8, 92, 28);
    drawFilledGlow(ctx, radGrad(cx, cy, 80, '#FFFFFF', c1), c2, 3.5);
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FFFFFF', c1, 2.5);
    return true;
  }

  // 40. TEMPLE BELL
  if (q.includes('bell') || q.includes('ghanta')) {
    ctx.beginPath();
    ctx.moveTo(cx - 64, cy + 52);
    ctx.quadraticCurveTo(cx - 52, cy - 42, cx, cy - 64);
    ctx.quadraticCurveTo(cx + 52, cy - 42, cx + 64, cy + 52);
    ctx.closePath();
    drawFilledGlow(ctx, radGrad(cx, cy, 60, '#FFFFFF', c1), '#FFFFFF', 3.5);
    ctx.beginPath(); ctx.arc(cx, cy + 62, 12, 0, Math.PI * 2);
    drawFilledGlow(ctx, c2, '#FFFFFF', 2.5);
    return true;
  }

  // 41. KALASH
  if (q.includes('kalash') || q.includes('kumbh') || q.includes('coconut')) {
    ctx.beginPath(); ctx.ellipse(cx, cy + 28, 48, 44, 0, 0, Math.PI * 2);
    drawFilledGlow(ctx, radGrad(cx, cy + 28, 48, '#FFFFFF', c1), '#FFFFFF', 3.5);
    ctx.beginPath(); ctx.arc(cx, cy - 28, 24, 0, Math.PI * 2);
    drawFilledGlow(ctx, c3, '#FFFFFF', 3);
    [-1, 0, 1].forEach(d => {
      ctx.beginPath(); ctx.ellipse(cx + d * 26, cy - 16, 18, 8, d * 0.5, 0, Math.PI * 2);
      drawFilledGlow(ctx, '#10B981', '#FFFFFF', 2);
    });
    return true;
  }

  // 42. CHAMPAGNE / CELEBRATION / CHEERS
  if (q.includes('champagne') || q.includes('party') || q.includes('cheers') || q.includes('toast')) {
    [-1, 1].forEach(s => {
      ctx.save(); ctx.translate(cx + s * 22, cy + 12); ctx.rotate(s * -0.22);
      ctx.beginPath(); ctx.moveTo(-16, -54); ctx.lineTo(16, -54); ctx.lineTo(10, 6); ctx.lineTo(-10, 6); ctx.closePath();
      drawFilledGlow(ctx, c1, '#FFFFFF', 3);
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, 56); ctx.moveTo(-18, 56); ctx.lineTo(18, 56); ctx.stroke();
      ctx.restore();
    });
    drawStarPolygon(ctx, cx, cy - 68, 6, 20, 7);
    drawFilledGlow(ctx, '#FFFFFF', c2, 2);
    return true;
  }

  // 43. CRICKET
  if (q.includes('cricket') || q.includes('bat') || q.includes('stadium')) {
    [-20, 0, 20].forEach(sx => {
      ctx.beginPath(); ctx.rect(cx + sx - 4, cy - 42, 8, 112);
      drawFilledGlow(ctx, '#FFFFFF', c1, 2);
    });
    ctx.strokeStyle = c1; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(cx - 72, cy + 62); ctx.lineTo(cx + 42, cy - 62); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 56, cy - 14, 18, 0, Math.PI * 2);
    drawFilledGlow(ctx, '#FF2A85', '#FFFFFF', 2.5);
    return true;
  }

  // 44. CAMERA / CINEMA / FILM
  if (q.includes('camera') || q.includes('cinema') || q.includes('film') || q.includes('bollywood')) {
    ctx.beginPath(); ctx.roundRect(cx - 58, cy - 18, 96, 68, 10);
    drawFilledGlow(ctx, radGrad(cx - 10, cy + 16, 54, '#FFFFFF', c2), c1, 3.5);
    ctx.beginPath(); ctx.arc(cx - 32, cy - 46, 24, 0, Math.PI * 2);
    drawFilledGlow(ctx, c1, '#FFFFFF', 3);
    ctx.beginPath(); ctx.arc(cx + 18, cy - 46, 20, 0, Math.PI * 2);
    drawFilledGlow(ctx, c1, '#FFFFFF', 3);
    ctx.beginPath(); ctx.moveTo(cx + 38, cy); ctx.lineTo(cx + 96, cy - 28); ctx.lineTo(cx + 96, cy + 56); ctx.lineTo(cx + 38, cy + 28); ctx.closePath();
    drawFilledGlow(ctx, '#FFFFFF', c2, 2.5);
    return true;
  }

  // FALLBACK (NEVER print prompt text or unrelated India map — render a rich 3D-shaded Sacred Geometric Crest)
  for (let r = 84; r >= 28; r -= 28) {
    drawStarPolygon(ctx, cx, cy, 8, r, r * 0.56, r === 56 ? Math.PI / 8 : 0);
    drawFilledGlow(ctx, r === 28 ? '#FFFFFF' : (r === 56 ? c2 : c1), '#FFFFFF', 3);
  }
  ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  drawFilledGlow(ctx, '#FFFFFF', c1, 2.5);
  return false;
}

window.generateBlueprintPreview = function generateBlueprintPreview(allowAI = true) {
  const raw = (document.getElementById('bpPromptInput').value || 'Sacred Lotus').trim();
  const pal = document.getElementById('bpPaletteSelect').value;
  const c   = document.getElementById('blueprintCanvas');
  const ctx = c.getContext('2d');
  const token = ++_bpGenToken;

  const matchedProcedural = renderProceduralBlueprint(raw, pal, ctx, c.width, c.height);

  const badge = document.getElementById('bpStatusBadge');
  const toast = document.getElementById('statusToast');
  badge.textContent = 'PREVIEW READY';
  badge.className   = 'text-sky-400 font-bold';
  toast.textContent = `👁️ Blueprint ready for "${raw.slice(0,22)}" — click 'Approve & Compile' to fly!`;

  const canUsePuter = allowAI && typeof puter !== 'undefined' && puter.ai && typeof puter.ai.txt2img === 'function';
  const puterSignedIn = canUsePuter && puter.auth && typeof puter.auth.isSignedIn === 'function' && puter.auth.isSignedIn();

  if (canUsePuter && (!matchedProcedural || puterSignedIn)) {
    const aiPrompt = `minimalist high-contrast glowing neon vector silhouette of ${raw} on pure solid #000000 black background, bold thick shapes, centered, no text, no background clutter`;
    badge.textContent = 'AI GENERATING...';
    badge.className   = 'text-amber-300 font-bold animate-pulse';
    toast.textContent = `✨ Puter AI generating neon silhouette for "${raw.slice(0,22)}"...`;

    Promise.resolve(puter.ai.txt2img(aiPrompt))
      .then((imgEl) => {
        if (token !== _bpGenToken || !imgEl) return;
        const paintImg = () => {
          if (token !== _bpGenToken) return;
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, c.width, c.height);
          const iw = imgEl.naturalWidth || imgEl.width || c.width;
          const ih = imgEl.naturalHeight || imgEl.height || c.height;
          const fit = Math.min((c.width - 12) / iw, (c.height - 12) / ih);
          const dw = iw * fit, dh = ih * fit;
          ctx.drawImage(imgEl, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
          badge.textContent = 'AI PREVIEW READY';
          badge.className   = 'text-emerald-400 font-bold';
          toast.textContent = `✨ AI Blueprint ready for "${raw.slice(0,22)}" — click 'Approve & Compile' to fly!`;
        };
        if (imgEl.complete && imgEl.naturalWidth > 0) paintImg();
        else imgEl.onload = paintImg;
      })
      .catch(() => {
        if (token !== _bpGenToken) return;
        badge.textContent = 'PREVIEW READY';
        badge.className   = 'text-sky-400 font-bold';
      });
  }
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
// 3. HYBRID CONTOUR (45%) + INTERIOR VOLUMETRIC POISSON/STRATIFIED (55%) 3D COMPILER
// ---------------------------------------------------------------------------
function sampleStratifiedPoisson(pts, targetCount, minX, maxX, minY, maxY) {
  if (!pts.length || targetCount <= 0) return [];
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const area = spanX * spanY;
  let minDist = Math.max(1.2, Math.sqrt(area / Math.max(1, targetCount)) * 0.72);

  // Build spatial hash buckets for fast Poisson-disc spacing checks
  const cols = Math.max(4, Math.ceil(Math.sqrt(targetCount * (spanX / spanY))));
  const rows = Math.max(4, Math.ceil(targetCount / cols));
  const cellW = spanX / cols, cellH = spanY / rows;
  const grid = Array.from({ length: cols * rows }, () => []);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const gx = Math.min(cols - 1, Math.max(0, Math.floor((p[0] - minX) / cellW)));
    const gy = Math.min(rows - 1, Math.max(0, Math.floor((p[1] - minY) / cellH)));
    grid[gy * cols + gx].push(p);
  }

  // Deterministic golden-ratio stride inside each cell so bright regions fill evenly
  const out = [];
  const used = new Set();
  for (let pass = 0; pass < 3 && out.length < targetCount; pass++) {
    const distSq = (minDist * Math.pow(0.55, pass)) ** 2;
    for (let c = 0; c < grid.length && out.length < targetCount; c++) {
      const bucket = grid[c];
      if (!bucket.length) continue;
      const pick = bucket[(pass * 7 + c * 13) % bucket.length];
      const key = `${pick[0]},${pick[1]}`;
      if (used.has(key)) continue;
      let tooClose = false;
      if (pass < 2) {
        for (let k = Math.max(0, out.length - 48); k < out.length; k++) {
          const dx = out[k][0] - pick[0], dy = out[k][1] - pick[1];
          if (dx * dx + dy * dy < distSq) { tooClose = true; break; }
        }
      }
      if (!tooClose) {
        used.add(key);
        out.push(pick);
      }
    }
  }
  for (let i = 0; out.length < targetCount && i < targetCount * 2; i++) {
    out.push(pts[Math.floor((i / Math.max(1, targetCount)) * pts.length) % pts.length]);
  }
  return out;
}

window.compileImageTo3DCloud = function compileImageTo3DCloud(imgSource, nDrones, styleTheme = 'gold_cyan', depthAmp = 14) {
  const w = 260, h = 220;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);

  const iw = imgSource.width || w, ih = imgSource.height || h;
  const fit = Math.min((w - 16) / iw, (h - 16) / ih);
  const dw = iw * fit, dh = ih * fit;
  ctx.drawImage(imgSource, (w - dw) / 2, (h - dh) / 2, dw, dh);

  const data = ctx.getImageData(0, 0, w, h).data;
  const cornerLum = (data[0] + data[1] + data[2] + data[(w - 1) * 4] + data[(w - 1) * 4 + 1] + data[(w - 1) * 4 + 2]) / 6;
  const isLightBg = cornerLum > 165;

  const lumGrid = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const rawL = 0.299 * r + 0.587 * g + 0.114 * b;
    lumGrid[i] = isLightBg ? (255 - rawL) : rawL;
  }

  const edgePts = [], fillPts = [];
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 2; y < h - 2; y += 1) {
    for (let x = 2; x < w - 2; x += 1) {
      const idx = y * w + x;
      const lum = lumGrid[idx];
      if (lum < 26) continue;
      const gx = -lumGrid[idx - w - 1] + lumGrid[idx - w + 1] - 2 * lumGrid[idx - 1] + 2 * lumGrid[idx + 1] - lumGrid[idx + w - 1] + lumGrid[idx + w + 1];
      const gy = -lumGrid[idx - w - 1] - 2 * lumGrid[idx - w] - lumGrid[idx - w + 1] + lumGrid[idx + w - 1] + 2 * lumGrid[idx + w] + lumGrid[idx + w + 1];
      const edgeMag = Math.hypot(gx, gy);
      const pIdx = idx * 4;
      const r = data[pIdx], g = data[pIdx + 1], b = data[pIdx + 2];
      const item = [x, y, lum, r, g, b, edgeMag];
      if (edgeMag > 115) edgePts.push(item);
      else if (lum >= 34) fillPts.push(item);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }

  const combined = [...edgePts, ...fillPts];
  if (combined.length < 20) return build3DTextCloud('AEROGRID', nDrones, 'gold');

  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
  const spanX = Math.max(1, maxX - minX), spanY = Math.max(1, maxY - minY);
  const scale = Math.min(104 / spanX, 68 / spanY);

  // 45% high-contrast edge contour + 55% volumetric Poisson/stratified interior
  const edgeTarget = Math.floor(nDrones * 0.45);
  const selectedEdges = sampleStratifiedPoisson(
    edgePts.length ? edgePts : fillPts,
    Math.min(edgeTarget, (edgePts.length || fillPts.length)),
    minX, maxX, minY, maxY
  );
  const fillTarget = nDrones - selectedEdges.length;
  const fillPool = fillPts.length > 0 ? fillPts : edgePts;
  const selectedFill = sampleStratifiedPoisson(fillPool, fillTarget, minX, maxX, minY, maxY);
  const selected = [...selectedEdges, ...selectedFill];

  const out = [];
  for (let i = 0; i < nDrones; i++) {
    const [px, py, lum, r, g, b, edgeMag] = selected[i % selected.length];
    const normX = (px - minX) / spanX, normY = (py - minY) / spanY;
    const archDepth = depthAmp > 0 ? Math.cos((normX - 0.5) * Math.PI) * (depthAmp * 0.42) : 0;
    const lumDepth  = depthAmp > 0 ? ((lum / 255) - 0.28) * (depthAmp * 0.85) : 0;
    const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
    const isColorful = !isLightBg && (maxC - minC > 40);
    let hex;
    if (isColorful) {
      hex = `#${Math.min(255, r + 25).toString(16).padStart(2, '0')}${Math.min(255, g + 25).toString(16).padStart(2, '0')}${Math.min(255, b + 25).toString(16).padStart(2, '0')}`;
    } else if (styleTheme === 'tricolour') {
      hex = normY < 0.34 ? '#FF9933' : (normY < 0.67 ? '#FFFFFF' : '#10B981');
    } else if (styleTheme === 'divine_fire') {
      hex = edgeMag > 145 ? '#FFD700' : (normY < 0.5 ? '#FF6D00' : '#FF2A85');
    } else if (styleTheme === 'diamond') {
      hex = edgeMag > 145 ? '#FFFFFF' : '#38BDF8';
    } else {
      hex = edgeMag > 135 ? '#FFD700' : (lum > 145 ? '#FFFFFF' : '#00E5FF');
    }
    out.push([+((px - midX) * scale).toFixed(2), +(archDepth + lumDepth).toFixed(2), +(66 - (py - midY) * scale).toFixed(2), hex]);
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
