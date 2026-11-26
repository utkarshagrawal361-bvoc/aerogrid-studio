// =============================================================================
// billing.js — AeroGrid Studio v7.0
// KTC GST Invoice Engine, GSTR-1 Ledger Export, and Skybrush .SKYC / .CSV
// Multi-Slide Flight Trajectory Compiler (supports 500–5,000 UAVs).
// Depends on: three-engine.js, formations.js
// =============================================================================

'use strict';

window.STATE_NAMES = {
  '24': 'Gujarat',
  '27': 'Maharashtra',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '29': 'Karnataka',
  '33': 'Tamil Nadu',
  '09': 'Uttar Pradesh',
};

let _lastCompiledCsv = '';
let _lastJobId = 'AG_SHOW';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clampFleet(val) {
  return Math.max(500, Math.min(5000, parseInt(val, 10) || 2200));
}

// -----------------------------------------------------------------------------
// Download Helper
// -----------------------------------------------------------------------------
window.triggerDownload = function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

// -----------------------------------------------------------------------------
// Modal Toggle
// -----------------------------------------------------------------------------
window.toggleExportModal = function toggleExportModal(open) {
  const modal = document.getElementById('exportModal');
  if (!modal) return;
  modal.classList.toggle('hidden', !open);
  if (open) window.updateQuote();
};

// -----------------------------------------------------------------------------
// Add-Ons & Live Quote
// -----------------------------------------------------------------------------
function getSelectedAddons() {
  const list = [];
  document.querySelectorAll('.addon-chk:checked').forEach((chk) => {
    list.push({
      name: chk.dataset.name || 'Add-On',
      price: parseFloat(chk.dataset.price) || 0,
    });
  });
  return list;
}

window.updateQuote = function updateQuote() {
  const drones = clampFleet(document.getElementById('droneManualInput')?.value);
  const mins   = parseInt(document.getElementById('durSelect')?.value, 10) || 10;
  const addonsTotal = getSelectedAddons().reduce((acc, a) => acc + a.price, 0);
  const total = (drones * 180) + (mins * 2000) + addonsTotal;
  const label = document.getElementById('priceLabel');
  if (label) label.textContent = `₹${total.toLocaleString('en-IN')}`;
};

// -----------------------------------------------------------------------------
// Auto-Detect State from GSTIN Prefix
// -----------------------------------------------------------------------------
window.autoDetectState = function autoDetectState(gstin) {
  if (!gstin || gstin.length < 2) return;
  const code = gstin.substring(0, 2);
  const sel  = document.getElementById('compState');
  if (!sel) return;
  for (const opt of sel.options) {
    if (opt.value === code) {
      sel.value = code;
      break;
    }
  }
};

// -----------------------------------------------------------------------------
// Compile Full Flight Package + Generate KTC GST Invoice
// -----------------------------------------------------------------------------
window.compileAndExport = function compileAndExport() {
  const drones    = clampFleet(document.getElementById('droneManualInput')?.value);
  const mins      = parseInt(document.getElementById('durSelect')?.value, 10) || 10;
  const addons    = getSelectedAddons();
  const basePrice = (drones * 180) + (mins * 2000);
  const taxable   = basePrice + addons.reduce((a, b) => a + b.price, 0);

  _lastJobId = `AG_${new Date().toTimeString().slice(0, 8).replace(/:/g, '')}`;

  // Centered square ground launchpad grid (2.2m DGCA spacing) for 500–5,000 UAVs
  const gridCols = Math.ceil(Math.sqrt(drones));
  const gridRows = Math.ceil(drones / gridCols);
  const lines = ['drone_id,time_sec,x_m,y_m,z_alt_m,led_hex'];
  const slides = Array.isArray(window.slides) ? window.slides : [];

  for (let d = 0; d < drones; d++) {
    const col = d % gridCols;
    const row = Math.floor(d / gridCols);
    const gx  = (col - (gridCols - 1) * 0.5) * 2.2;
    const gy  = (row - (gridRows - 1) * 0.5) * 2.2;
    const uid = `UAV_${String(d + 1).padStart(4, '0')}`;

    lines.push(`${uid},0.0,${gx.toFixed(2)},${gy.toFixed(2)},0.00,#000000`);
    let tAcc = 30.0;
    slides.forEach((s) => {
      const pt = (s.cloud && s.cloud.length)
        ? s.cloud[d % s.cloud.length]
        : [0, 0, 56, '#00E5FF'];
      lines.push(`${uid},${tAcc.toFixed(1)},${pt[0].toFixed(2)},${pt[1].toFixed(2)},${pt[2].toFixed(2)},${pt[3]}`);
      tAcc += (s.dur || 15);
    });
    lines.push(`${uid},${(mins * 60).toFixed(1)},${gx.toFixed(2)},${gy.toFixed(2)},0.00,#000000`);
  }
  _lastCompiledCsv = lines.join('\n');

  const compName  = (document.getElementById('compName')?.value || '').trim();
  const compGstin = (document.getElementById('compGstin')?.value || '').trim().toUpperCase();
  const stCode    = document.getElementById('compState')?.value || '24';
  const stName    = window.STATE_NAMES[stCode] || 'Gujarat';
  const addr      = (document.getElementById('compAddr')?.value || '').trim() || 'India';
  const isGuj     = (stCode === '24');

  const downloadBox = document.getElementById('downloadBox');
  const printBtn    = document.getElementById('printInvBtn');
  const ledgerBtn   = document.getElementById('ledgerBtn');
  const invBox      = document.getElementById('printableInvoice');
  const invInfo     = document.getElementById('invInfo');

  if (downloadBox) downloadBox.classList.remove('hidden');

  if (compName || compGstin) {
    const seq = parseInt(localStorage.getItem('ktc_inv_seq') || '0', 10) + 1;
    localStorage.setItem('ktc_inv_seq', String(seq));
    const invNo   = `KTC - ${String(seq).padStart(3, '0')} - 26`;
    const invDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const cgst    = isGuj ? +(taxable * 0.09).toFixed(2) : 0;
    const sgst    = isGuj ? +(taxable * 0.09).toFixed(2) : 0;
    const igst    = !isGuj ? +(taxable * 0.18).toFixed(2) : 0;
    const grand   = +(taxable + cgst + sgst + igst).toFixed(2);

    const ledger = JSON.parse(localStorage.getItem('ktc_gstr1_ledger') || '[]');
    ledger.push([
      invNo,
      invDate,
      compName || 'Walk-In Client',
      compGstin || 'URP',
      stCode,
      stName,
      taxable,
      isGuj ? cgst : '-',
      isGuj ? sgst : '-',
      !isGuj ? igst : '-',
      grand,
    ]);
    localStorage.setItem('ktc_gstr1_ledger', JSON.stringify(ledger));

    if (invInfo) {
      invInfo.textContent = `Job: ${_lastJobId} | Invoice: ${invNo} | Total (incl. GST): ₹${grand.toLocaleString('en-IN')}`;
    }
    if (printBtn)  printBtn.classList.remove('hidden');
    if (ledgerBtn) ledgerBtn.classList.remove('hidden');

    const addonRows = addons.map((a, idx) =>
      `<tr><td class="border p-2">${idx + 2}</td><td class="border p-2">Add-On: ${escapeHtml(a.name)}</td><td class="border p-2 text-right">₹${a.price.toLocaleString('en-IN')}</td></tr>`
    ).join('');

    if (invBox) {
      invBox.classList.remove('hidden');
      invBox.innerHTML = `
        <div class="flex justify-between border-b pb-3 mb-3">
          <div>
            <h3 class="font-bold text-base">KRISHNA TRADING COMPANY — TAX INVOICE</h3>
            <p>Seller GSTIN: 24AABFK1234C1Z5 (Ahmedabad, Gujarat)</p>
          </div>
          <div class="text-right font-mono">
            <p><b>Invoice No:</b> ${invNo}</p>
            <p><b>Date:</b> ${invDate}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-3">
          <div>
            <b>Billed To:</b> ${escapeHtml(compName || 'Client')}<br/>
            <b>GSTIN:</b> ${escapeHtml(compGstin || 'URP')}<br/>
            <b>Address:</b> ${escapeHtml(addr)}
          </div>
          <div class="text-right">
            <b>Place of Supply:</b> ${escapeHtml(stName)} (${escapeHtml(stCode)})<br/>
            <b>SAC Code:</b> 998399
          </div>
        </div>
        <table class="w-full border-collapse border mb-3">
          <thead>
            <tr class="bg-slate-100">
              <th class="border p-2 text-left">Sr</th>
              <th class="border p-2 text-left">Description</th>
              <th class="border p-2 text-right">Taxable Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border p-2">1</td>
              <td class="border p-2">3D Drone Show (${slides.length} Slides • ${drones} UAVs • ${mins} Mins)</td>
              <td class="border p-2 text-right">₹${basePrice.toLocaleString('en-IN')}</td>
            </tr>
            ${addonRows}
          </tbody>
        </table>
        <div class="text-right font-mono space-y-1">
          <p>Taxable Value: ₹${taxable.toLocaleString('en-IN')}</p>
          <p>CGST @ 9%: ${isGuj ? '₹' + cgst.toLocaleString('en-IN') : '-'}</p>
          <p>SGST @ 9%: ${isGuj ? '₹' + sgst.toLocaleString('en-IN') : '-'}</p>
          <p>IGST @ 18%: ${!isGuj ? '₹' + igst.toLocaleString('en-IN') : '-'}</p>
          <p class="text-sm font-bold border-t pt-1">Grand Total: ₹${grand.toLocaleString('en-IN')}</p>
        </div>`;
    }
  } else {
    if (invInfo) invInfo.textContent = `Job: ${_lastJobId} | Total: ₹${taxable.toLocaleString('en-IN')}`;
    if (printBtn)  printBtn.classList.add('hidden');
    if (ledgerBtn) ledgerBtn.classList.add('hidden');
    if (invBox)    invBox.classList.add('hidden');
  }
};

// -----------------------------------------------------------------------------
// Download Handlers (.CSV, .SKYC ZIP, Master GSTR-1 CSV)
// -----------------------------------------------------------------------------
window.downloadCsvFile = function downloadCsvFile() {
  window.triggerDownload(
    new Blob([_lastCompiledCsv], { type: 'text/csv' }),
    `${_lastJobId}_flight_paths.csv`
  );
};

window.downloadSkycFile = async function downloadSkycFile() {
  if (typeof JSZip === 'undefined') return;
  const drones = clampFleet(document.getElementById('droneManualInput')?.value);
  const slides = Array.isArray(window.slides) ? window.slides : [];

  const zip = new JSZip();
  zip.file('show.json', JSON.stringify({
    version: 2,
    generator: 'AeroGrid Studio v7.0',
    fleetCount: drones,
    slides: slides.length,
    dgcaCompliant: true,
    createdAt: new Date().toISOString(),
  }, null, 2));

  let tOffset = 30;
  const cues = slides.map((s, idx) => {
    const cue = {
      index: idx + 1,
      label: s.label,
      type: s.type,
      transition: s.trans || 'spiral',
      startSec: tOffset,
      durationSec: s.dur || 15,
    };
    tOffset += cue.durationSec;
    return cue;
  });
  zip.file('cues/slides.json', JSON.stringify(cues, null, 2));
  zip.file('trajectories/flight_paths.csv', _lastCompiledCsv);

  const blob = await zip.generateAsync({ type: 'blob' });
  window.triggerDownload(blob, `${_lastJobId}_skybrush.skyc`);
};

window.downloadGstrLedger = function downloadGstrLedger() {
  const ledger = JSON.parse(localStorage.getItem('ktc_gstr1_ledger') || '[]');
  const header = 'Invoice No,Date,Client Name,GSTIN,State Code,State,Taxable Value,CGST,SGST,IGST,Invoice Total\n';
  const rows   = ledger.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  window.triggerDownload(
    new Blob([header + rows], { type: 'text/csv' }),
    'Master_GSTR1_Sales_Ledger.csv'
  );
};
