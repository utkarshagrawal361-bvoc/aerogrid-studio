// =============================================================================
// billing.js — AeroGrid Studio
// KTC GST Invoice engine, GSTR-1 export, flight-package CSV/.SKYC compiler.
// Depends on: formations.js (window.slides), three-engine.js (window.activeSlideIdx)
// =============================================================================

'use strict';

window.STATE_NAMES = {
  '24':'Gujarat','27':'Maharashtra','07':'Delhi','08':'Rajasthan',
  '29':'Karnataka','33':'Tamil Nadu','09':'Uttar Pradesh',
};

let _lastCompiledCsv = '';
let _lastJobId = 'AG_SHOW';

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
window.triggerDownload = function triggerDownload(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};

// ---------------------------------------------------------------------------
// Modal open/close
// ---------------------------------------------------------------------------
window.toggleExportModal = function toggleExportModal(open) {
  document.getElementById('exportModal').classList.toggle('hidden', !open);
  if (open) window.updateQuote();
};

// ---------------------------------------------------------------------------
// Addon helpers
// ---------------------------------------------------------------------------
function getSelectedAddons() {
  const list = [];
  document.querySelectorAll('.addon-chk:checked').forEach(chk => {
    list.push({ name: chk.dataset.name, price: parseFloat(chk.dataset.price) });
  });
  return list;
}

// ---------------------------------------------------------------------------
// Live quote update
// ---------------------------------------------------------------------------
window.updateQuote = function updateQuote() {
  const drones = parseInt(document.getElementById('droneManualInput').value, 10) || 2200;
  const mins   = parseInt(document.getElementById('durSelect').value, 10);
  const addonsTotal = getSelectedAddons().reduce((acc, a) => acc + a.price, 0);
  const total = (drones * 180) + (mins * 2000) + addonsTotal;
  document.getElementById('priceLabel').textContent = `₹${total.toLocaleString('en-IN')}`;
};

// ---------------------------------------------------------------------------
// Auto-detect state from GSTIN prefix
// ---------------------------------------------------------------------------
window.autoDetectState = function autoDetectState(gstin) {
  if (gstin && gstin.length >= 2) {
    const code = gstin.substring(0, 2);
    const sel  = document.getElementById('compState');
    for (const opt of sel.options) {
      if (opt.value === code) { sel.value = code; break; }
    }
  }
};

// ---------------------------------------------------------------------------
// Compile full flight package + generate GST invoice
// ---------------------------------------------------------------------------
window.compileAndExport = function compileAndExport() {
  const drones   = parseInt(document.getElementById('droneManualInput').value, 10) || 2200;
  const mins     = parseInt(document.getElementById('durSelect').value, 10);
  const addons   = getSelectedAddons();
  const basePrice = (drones * 180) + (mins * 2000);
  const taxable   = basePrice + addons.reduce((a, b) => a + b.price, 0);

  _lastJobId = `AG_${new Date().toTimeString().slice(0,8).replace(/:/g,'')}`;
  const lines = ['drone_id,time_sec,x_m,y_m,z_alt_m,led_hex'];

  for (let d = 0; d < drones; d++) {
    const gx = ((d % 44) - 22) * 2.2;
    const gy = (Math.floor(d / 44) - 25) * 2.2;
    lines.push(`UAV_${String(d+1).padStart(4,'0')},0.0,${gx.toFixed(2)},${gy.toFixed(2)},0.00,#000000`);
    let tAcc = 30.0;
    window.slides.forEach(s => {
      const pt = s.cloud[d % s.cloud.length] || [0,0,66,'#00E5FF'];
      lines.push(`UAV_${String(d+1).padStart(4,'0')},${tAcc.toFixed(1)},${pt[0].toFixed(2)},${pt[1].toFixed(2)},${pt[2].toFixed(2)},${pt[3]}`);
      tAcc += (s.dur || 15);
    });
    lines.push(`UAV_${String(d+1).padStart(4,'0')},${mins*60}.0,${gx.toFixed(2)},${gy.toFixed(2)},0.00,#000000`);
  }
  _lastCompiledCsv = lines.join('\n');

  const compName  = document.getElementById('compName').value.trim();
  const compGstin = document.getElementById('compGstin').value.trim().toUpperCase();
  const stCode    = document.getElementById('compState').value;
  const stName    = window.STATE_NAMES[stCode] || 'Gujarat';
  const addr      = document.getElementById('compAddr').value.trim() || 'India';
  const isGuj     = (stCode === '24');

  document.getElementById('downloadBox').classList.remove('hidden');
  const printBtn  = document.getElementById('printInvBtn');
  const ledgerBtn = document.getElementById('ledgerBtn');
  const invBox    = document.getElementById('printableInvoice');

  if (compName || compGstin) {
    const seq    = (parseInt(localStorage.getItem('ktc_inv_seq') || '0', 10) + 1);
    localStorage.setItem('ktc_inv_seq', String(seq));
    const invNo  = `KTC - ${String(seq).padStart(3,'0')} - 26`;
    const invDate = new Date().toLocaleDateString('en-GB').replace(/\//g,'-');
    const cgst   = isGuj ? +(taxable*0.09).toFixed(2) : 0;
    const sgst   = isGuj ? +(taxable*0.09).toFixed(2) : 0;
    const igst   = !isGuj ? +(taxable*0.18).toFixed(2) : 0;
    const grand  = +(taxable + cgst + sgst + igst).toFixed(2);

    const ledger = JSON.parse(localStorage.getItem('ktc_gstr1_ledger') || '[]');
    ledger.push([invNo,invDate,compName||'Walk-In Client',compGstin||'URP',stCode,stName,taxable,isGuj?cgst:'-',isGuj?sgst:'-',!isGuj?igst:'-',grand]);
    localStorage.setItem('ktc_gstr1_ledger', JSON.stringify(ledger));

    document.getElementById('invInfo').textContent = `Job: ${_lastJobId} | Invoice: ${invNo} | Total (incl. GST): ₹${grand.toLocaleString('en-IN')}`;
    printBtn.classList.remove('hidden');
    ledgerBtn.classList.remove('hidden');

    const addonRows = addons.map((a,idx) =>
      `<tr><td class="border p-2">${idx+2}</td><td class="border p-2">Add-On: ${a.name}</td><td class="border p-2 text-right">₹${a.price.toLocaleString('en-IN')}</td></tr>`
    ).join('');

    invBox.classList.remove('hidden');
    invBox.innerHTML = `
      <div class="flex justify-between border-b pb-3 mb-3">
        <div><h3 class="font-bold text-base">KRISHNA TRADING COMPANY — TAX INVOICE</h3><p>Seller GSTIN: 24AABFK1234C1Z5 (Ahmedabad, Gujarat)</p></div>
        <div class="text-right font-mono"><p><b>Invoice No:</b> ${invNo}</p><p><b>Date:</b> ${invDate}</p></div>
      </div>
      <div class="grid grid-cols-2 gap-2 mb-3">
        <div><b>Billed To:</b> ${compName||'Client'}<br/><b>GSTIN:</b> ${compGstin||'URP'}<br/><b>Address:</b> ${addr}</div>
        <div class="text-right"><b>Place of Supply:</b> ${stName} (${stCode})<br/><b>SAC Code:</b> 998399</div>
      </div>
      <table class="w-full border-collapse border mb-3">
        <thead><tr class="bg-slate-100"><th class="border p-2 text-left">Sr</th><th class="border p-2 text-left">Description</th><th class="border p-2 text-right">Taxable Value</th></tr></thead>
        <tbody>
          <tr><td class="border p-2">1</td><td class="border p-2">3D Drone Show (${window.slides.length} Slides • ${drones} UAVs • ${mins} Mins)</td><td class="border p-2 text-right">₹${basePrice.toLocaleString('en-IN')}</td></tr>
          ${addonRows}
        </tbody>
      </table>
      <div class="text-right font-mono space-y-1">
        <p>Taxable Value: ₹${taxable.toLocaleString('en-IN')}</p>
        <p>CGST @ 9%: ${isGuj?'₹'+cgst.toLocaleString('en-IN'):'-'}</p>
        <p>SGST @ 9%: ${isGuj?'₹'+sgst.toLocaleString('en-IN'):'-'}</p>
        <p>IGST @ 18%: ${!isGuj?'₹'+igst.toLocaleString('en-IN'):'-'}</p>
        <p class="text-sm font-bold border-t pt-1">Grand Total: ₹${grand.toLocaleString('en-IN')}</p>
      </div>`;
  } else {
    document.getElementById('invInfo').textContent = `Job: ${_lastJobId} | Total: ₹${taxable.toLocaleString('en-IN')}`;
    printBtn.classList.add('hidden');
    ledgerBtn.classList.add('hidden');
    invBox.classList.add('hidden');
  }
};

// ---------------------------------------------------------------------------
// Download helpers
// ---------------------------------------------------------------------------
window.downloadCsvFile = function downloadCsvFile() {
  window.triggerDownload(new Blob([_lastCompiledCsv],{type:'text/csv'}),`${_lastJobId}_flight_paths.csv`);
};

window.downloadSkycFile = async function downloadSkycFile() {
  const zip = new JSZip();
  zip.file('show.json', JSON.stringify({version:1,generator:'AeroGrid Studio',slides:window.slides.length,dgcaCompliant:true},null,2));
  zip.file('trajectories/flight_paths.csv', _lastCompiledCsv);
  window.triggerDownload(await zip.generateAsync({type:'blob'}),`${_lastJobId}_skybrush.skyc`);
};

window.downloadGstrLedger = function downloadGstrLedger() {
  const ledger = JSON.parse(localStorage.getItem('ktc_gstr1_ledger') || '[]');
  const header = 'Invoice No,Date,Client Name,GSTIN,State Code,State,Taxable Value,CGST,SGST,IGST,Invoice Total\n';
  window.triggerDownload(
    new Blob([header + ledger.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n')],{type:'text/csv'}),
    'Master_GSTR1_Sales_Ledger.csv'
  );
};
