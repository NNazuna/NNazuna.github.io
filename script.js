// Wiratama Kalkulator Biaya Produksi
// ES6, optimal, dengan komentar penjelas

// --- Helper: Format angka ke Rupiah ---
function formatRupiah(angka) {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

// --- Helper: Format input ribuan secara live ---
function formatInputRupiah(input) {
  let value = input.value.replace(/[^0-9]/g, '');
  if (value === '') {
    input.value = '';
    input.setAttribute('data-value', '');
    return;
  }
  input.value = parseInt(value, 10).toLocaleString('id-ID');
  input.setAttribute('data-value', value);
}

// --- Preview gambar produk ---
document.getElementById('gambarProduk').addEventListener('change', e => {
  const file = e.target.files[0];
  const preview = document.getElementById('previewGambar');
  if (file) {
    const reader = new FileReader();
    reader.onload = ev => {
      preview.src = ev.target.result;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  } else {
    preview.src = '';
    preview.classList.add('hidden');
  }
});

// --- Format input bahan baku dan biaya masak ---
['bahanBaku', 'biayaMasak'].forEach(id => {
  document.getElementById(id).addEventListener('input', e => {
    formatInputRupiah(e.target);
    simpanSementara();
  });
});

// --- Reset form dan hasil ---
function resetForm() {
  document.getElementById('form').reset();
  document.getElementById('output').classList.add('hidden');
  document.getElementById('outNamaProduk').textContent = '';
  document.getElementById('outTotalModal').textContent = '';
  document.getElementById('outHargaJual').textContent = '';
  document.getElementById('outTotalKeuntungan').textContent = '';
  document.getElementById('previewGambar').src = '';
  document.getElementById('previewGambar').classList.add('hidden');
  document.getElementById('outputGambar').src = '';
  document.getElementById('outputGambar').classList.add('hidden');
  localStorage.removeItem('wiracalcData');
}
document.getElementById('resetBtn').addEventListener('click', resetForm);

// --- Validasi input ramah ---
function validasiInput({bahanBaku, biayaMasak, margin, jumlahPorsi}) {
  let pesan = '';
  if (bahanBaku < 100) pesan += 'Biaya bahan baku terlalu kecil.\n';
  if (biayaMasak < 50) pesan += 'Biaya masak terlalu kecil.\n';
  if (margin < 5) pesan += 'Margin keuntungan sebaiknya di atas 5%.\n';
  if (jumlahPorsi < 1) pesan += 'Jumlah porsi minimal 1.\n';
  return pesan;
}

// --- Simpan ke Local Storage ---
function simpanSementara() {
  const data = {
    namaProduk: document.getElementById('namaProduk').value,
    bahanBaku: document.getElementById('bahanBaku').getAttribute('data-value') || '',
    biayaMasak: document.getElementById('biayaMasak').getAttribute('data-value') || '',
    margin: document.getElementById('margin').value,
    jumlahPorsi: document.getElementById('jumlahPorsi').value
  };
  localStorage.setItem('wiracalcData', JSON.stringify(data));
}

// --- Load data dari Local Storage saat halaman dibuka ---
window.addEventListener('DOMContentLoaded', () => {
  const data = JSON.parse(localStorage.getItem('wiracalcData') || '{}');
  if (data.namaProduk) document.getElementById('namaProduk').value = data.namaProduk;
  if (data.bahanBaku) {
    document.getElementById('bahanBaku').value = parseInt(data.bahanBaku, 10).toLocaleString('id-ID');
    document.getElementById('bahanBaku').setAttribute('data-value', data.bahanBaku);
  }
  if (data.biayaMasak) {
    document.getElementById('biayaMasak').value = parseInt(data.biayaMasak, 10).toLocaleString('id-ID');
    document.getElementById('biayaMasak').setAttribute('data-value', data.biayaMasak);
  }
  if (data.margin) document.getElementById('margin').value = data.margin;
  if (data.jumlahPorsi) document.getElementById('jumlahPorsi').value = data.jumlahPorsi;
});

// --- Tabel Bahan Baku Dinamis ---
function updateEmptyState() {
  const tbody = document.getElementById('bahanTableBody');
  const emptyRow = document.getElementById('emptyBahanRow');
  if (tbody.querySelectorAll('tr:not(#emptyBahanRow)').length > 0) {
    if (emptyRow) emptyRow.remove();
  } else {
    if (!emptyRow) {
      const tr = document.createElement('tr');
      tr.id = 'emptyBahanRow';
      tr.innerHTML = `<td colspan="5" class="text-center text-gray-400 py-6">
        <i class="fas fa-leaf text-2xl mb-2"></i><br>
        Tambahkan bahan baku untuk memulai perhitungan.
      </td>`;
      tbody.appendChild(tr);
    }
  }
}
function addBahanRow(data = {}) {
  const tbody = document.getElementById('bahanTableBody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="bahan-nama w-full" value="${data.nama || ''}" /></td>
    <td><input type="number" class="bahan-jumlah w-full" value="${data.jumlah || ''}" min="0" /></td>
    <td>
      <select class="bahan-satuan w-full">
        <option value="gr" ${data.satuan==='gr'?'selected':''}>gr</option>
        <option value="kg" ${data.satuan==='kg'?'selected':''}>kg</option>
        <option value="ml" ${data.satuan==='ml'?'selected':''}>ml</option>
        <option value="L" ${data.satuan==='L'?'selected':''}>L</option>
        <option value="pcs" ${data.satuan==='pcs'?'selected':''}>pcs</option>
      </select>
    </td>
    <td><input type="number" class="bahan-harga w-full" value="${data.harga || ''}" min="0" /></td>
    <td><button type="button" class="remove-bahan btn-wiracalc px-2 py-1 rounded"><i class="fas fa-trash"></i></button></td>
  `;
  tbody.appendChild(tr);
  tr.querySelector('.remove-bahan').onclick = () => {
    tr.remove();
    updateEmptyState();
  };
  updateEmptyState();
}
document.getElementById('addBahanRow').onclick = () => addBahanRow();

function getTotalBahanBaku() {
  let total = 0;
  Array.from(document.querySelectorAll('#bahanTableBody tr')).forEach(tr => {
    if (tr.id === 'emptyBahanRow') return;
    const jumlah = parseFloat(tr.querySelector('.bahan-jumlah').value) || 0;
    const harga = parseFloat(tr.querySelector('.bahan-harga').value) || 0;
    total += jumlah * harga;
  });
  return total;
}

// --- Submit form: Hitung dan tampilkan hasil ---
document.getElementById('form').addEventListener('submit', e => {
  e.preventDefault();
  const namaProduk = document.getElementById('namaProduk').value;
  const totalBahanBaku = getTotalBahanBaku();
  const biayaTenagaKerja = parseFloat(document.getElementById('biayaTenagaKerja').value) || 0;
  const biayaKemasan = parseFloat(document.getElementById('biayaKemasan').value) || 0;
  const biayaListrik = parseFloat(document.getElementById('biayaListrik').value) || 0;
  const margin = parseFloat(document.getElementById('margin').value) || 0;
  const jumlahPorsi = parseInt(document.getElementById('jumlahPorsi').value) || 1;

  // Validasi input
  let pesan = '';
  if (totalBahanBaku < 100) pesan += 'Total biaya bahan baku terlalu kecil.\n';
  if (margin < 5) pesan += 'Margin keuntungan sebaiknya di atas 5%.\n';
  if (jumlahPorsi < 1) pesan += 'Jumlah porsi minimal 1.\n';
  if (pesan) {
    alert(pesan);
    return;
  }

  // Hitung total modal
  const totalOperasional = biayaTenagaKerja + biayaKemasan + biayaListrik;
  const totalModal = totalBahanBaku + totalOperasional;
  // Hitung harga jual per porsi
  const hargaJualPerPorsi = (totalModal * (1 + margin / 100)) / jumlahPorsi;
  // Hitung total keuntungan
  const totalKeuntungan = (hargaJualPerPorsi * jumlahPorsi) - totalModal;

  // Tampilkan hasil ke tabel
  document.getElementById('outNamaProduk').textContent = namaProduk;
  document.getElementById('outTotalModal').textContent = formatRupiah(totalModal);
  document.getElementById('outHargaJual').textContent = formatRupiah(hargaJualPerPorsi.toFixed(0));
  document.getElementById('outTotalKeuntungan').textContent = formatRupiah(totalKeuntungan.toFixed(0));
  document.getElementById('output').classList.remove('hidden');

  // Tampilkan gambar di hasil
  const gambarSrc = document.getElementById('previewGambar').src;
  if (gambarSrc) {
    document.getElementById('outputGambar').src = gambarSrc;
    document.getElementById('outputGambar').classList.remove('hidden');
  } else {
    document.getElementById('outputGambar').src = '';
    document.getElementById('outputGambar').classList.add('hidden');
  }

  // Simpan data terakhir
  simpanSementara();
});

// --- Export hasil ke PDF/Image ---
function loadScript(src) {
  return new Promise(resolve => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    document.body.appendChild(s);
  });
}

async function exportIMG() {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  const output = document.getElementById('output');
  output.classList.add('export-report');
  await new Promise(r => setTimeout(r, 100));
  html2canvas(output, {
    backgroundColor: '#fff',
    useCORS: true,
    scale: 2
  }).then(canvas => {
    output.classList.remove('export-report');
    const link = document.createElement('a');
    link.download = 'hasil-wiracalc.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

document.getElementById('output').addEventListener('click', e => {
  if (e.target.closest('#exportPDF')) exportPDF();
  if (e.target.closest('#exportIMG')) exportIMG();
});

// Helper: FontAwesome icons are used in HTML
// Fluid logic for dynamic tables and calculation

document.addEventListener('DOMContentLoaded', function() {
  // --- Bahan Baku Table Logic ---
  const bahanTableBody = document.getElementById('bahanTableBody');
  const addBahanRowBtn = document.getElementById('addBahanRow');
  const satuanOptions = ['gr', 'kg', 'ml', 'L', 'pcs'];

  function updateEmptyBahanState() {
    if (bahanTableBody.children.length === 0) {
      bahanTableBody.innerHTML = `<tr id="emptyBahanRow"><td colspan="5" class="text-center text-gray-400 py-6"><i class="fas fa-leaf text-2xl mb-2"></i><br>Tambahkan bahan baku untuk memulai perhitungan.</td></tr>`;
    } else {
      const emptyRow = document.getElementById('emptyBahanRow');
      if (emptyRow) emptyRow.remove();
    }
  }

  function addBahanRow() {
    updateEmptyBahanState();
    const tr = document.createElement('tr');
    tr.classList.add('added-row');
    tr.innerHTML = `
      <td><input type="text" class="w-full border rounded px-2 py-1" placeholder="Nama Bahan" required></td>
      <td><input type="number" class="w-full border rounded px-2 py-1" min="0" step="any" placeholder="Jumlah" required></td>
      <td>
        <select class="w-full border rounded px-2 py-1">
          ${satuanOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
        </select>
      </td>
      <td><input type="number" class="w-full border rounded px-2 py-1" min="0" step="any" placeholder="Harga" required></td>
      <td class="text-center">
        <button type="button" class="icon-btn remove-bahan" title="Hapus"><i class="fas fa-trash"></i></button>
      </td>
    `;
    bahanTableBody.appendChild(tr);
    updateEmptyBahanState();
    tr.querySelector('.remove-bahan').addEventListener('click', function() {
      tr.classList.add('removed-row');
      setTimeout(() => {
        tr.remove();
        updateEmptyBahanState();
        updateTotalBahanBaku();
      }, 350);
    });
    // Recalculate on input change
    Array.from(tr.querySelectorAll('input')).forEach(input => {
      input.addEventListener('input', updateTotalBahanBaku);
    });
    updateTotalBahanBaku();
  }

  addBahanRowBtn.addEventListener('click', addBahanRow);

  function getTotalBahanBaku() {
    let total = 0;
    Array.from(bahanTableBody.children).forEach(tr => {
      const inputs = tr.querySelectorAll('input');
      if (inputs.length === 3) {
        const jumlah = parseFloat(inputs[0].value) || 0;
        const harga = parseFloat(inputs[2].value) || 0;
        total += jumlah * harga;
      }
    });
    return total;
  }

  function updateTotalBahanBaku() {
    // For output calculation
  }

  // --- Biaya Operasional Table Logic ---
  const operasionalTableBody = document.getElementById('operasionalTableBody');
  const addOperasionalRowBtn = document.getElementById('addOperasionalRow');

  function updateEmptyOperasionalState() {
    if (operasionalTableBody.children.length === 0) {
      operasionalTableBody.innerHTML = `<tr id="emptyOperasionalRow"><td colspan="3" class="text-center text-gray-400 py-6"><i class="fas fa-lightbulb text-2xl mb-2"></i><br>Tambahkan biaya operasional untuk perhitungan modal.</td></tr>`;
    } else {
      const emptyRow = document.getElementById('emptyOperasionalRow');
      if (emptyRow) emptyRow.remove();
    }
  }

  function addOperasionalRow() {
    updateEmptyOperasionalState();
    const tr = document.createElement('tr');
    tr.classList.add('added-row');
    tr.innerHTML = `
      <td><input type="text" class="w-full border rounded px-2 py-1" placeholder="Nama Biaya" required></td>
      <td><input type="number" class="w-full border rounded px-2 py-1" min="0" step="any" placeholder="Modal" required></td>
      <td class="text-center">
        <button type="button" class="icon-btn remove-operasional" title="Hapus"><i class="fas fa-trash"></i></button>
      </td>
    `;
    operasionalTableBody.appendChild(tr);
    updateEmptyOperasionalState();
    tr.querySelector('.remove-operasional').addEventListener('click', function() {
      tr.classList.add('removed-row');
      setTimeout(() => {
        tr.remove();
        updateEmptyOperasionalState();
        updateTotalOperasional();
      }, 350);
    });
    tr.querySelector('input[type="number"]').addEventListener('input', updateTotalOperasional);
    updateTotalOperasional();
  }

  addOperasionalRowBtn.addEventListener('click', addOperasionalRow);

  function getTotalOperasional() {
    let total = 0;
    Array.from(operasionalTableBody.children).forEach(tr => {
      const input = tr.querySelector('input[type="number"]');
      if (input) {
        total += parseFloat(input.value) || 0;
      }
    });
    return total;
  }

  function updateTotalOperasional() {
    // For output calculation
  }

  // --- Form Logic & Output ---
  const form = document.getElementById('form');
  const output = document.getElementById('output');
  const outNamaProduk = document.getElementById('outNamaProduk');
  const outTotalModal = document.getElementById('outTotalModal');
  const outHargaJual = document.getElementById('outHargaJual');
  const outTotalKeuntungan = document.getElementById('outTotalKeuntungan');
  const outGambar = document.getElementById('outputGambar');
  const previewGambar = document.getElementById('previewGambar');
  const gambarProduk = document.getElementById('gambarProduk');
  const resetBtn = document.getElementById('resetBtn');

  gambarProduk.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        previewGambar.src = ev.target.result;
        previewGambar.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    } else {
      previewGambar.src = '';
      previewGambar.classList.add('hidden');
    }
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    // Get values
    const namaProduk = document.getElementById('namaProduk').value;
    const margin = parseFloat(document.getElementById('margin').value) || 0;
    const jumlahPorsi = parseInt(document.getElementById('jumlahPorsi').value) || 1;
    const totalBahan = getTotalBahanBaku();
    const totalOperasional = getTotalOperasional();
    const totalModal = totalBahan + totalOperasional;
    const hargaJual = Math.ceil((totalModal * (1 + margin/100)) / jumlahPorsi);
    const totalKeuntungan = Math.ceil((hargaJual * jumlahPorsi) - totalModal);
    // Output
    outNamaProduk.textContent = namaProduk;
    outTotalModal.textContent = 'Rp ' + totalModal.toLocaleString('id-ID');
    outHargaJual.textContent = 'Rp ' + hargaJual.toLocaleString('id-ID');
    outTotalKeuntungan.textContent = 'Rp ' + totalKeuntungan.toLocaleString('id-ID');
    // Gambar
    if (previewGambar.src && !previewGambar.classList.contains('hidden')) {
      outGambar.src = previewGambar.src;
      outGambar.classList.remove('hidden');
    } else {
      outGambar.src = '';
      outGambar.classList.add('hidden');
    }
    output.classList.remove('hidden');
    window.scrollTo({ top: output.offsetTop - 40, behavior: 'smooth' });
  });

  resetBtn.addEventListener('click', function() {
    form.reset();
    previewGambar.src = '';
    previewGambar.classList.add('hidden');
    outGambar.src = '';
    outGambar.classList.add('hidden');
    output.classList.add('hidden');
    // Remove all table rows
    bahanTableBody.innerHTML = '';
    operasionalTableBody.innerHTML = '';
    updateEmptyBahanState();
    updateEmptyOperasionalState();
  });

  // --- Export Logic ---
  document.getElementById('exportIMG').addEventListener('click', function() {
    const exportTarget = output;
    // html2canvas with white background
    html2canvas(exportTarget, {
      backgroundColor: '#fff',
      scale: 2,
      useCORS: true
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'wiracalc-hasil.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  });
  document.getElementById('exportPDF').addEventListener('click', function() {
    const exportTarget = output;
    html2canvas(exportTarget, {
      backgroundColor: '#fff',
      scale: 2,
      useCORS: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      pdf.save('wiracalc-hasil.pdf');
    });
  });

  // --- Initial State ---
  updateEmptyBahanState();
  updateEmptyOperasionalState();
});