// WiraCalc - Kalkulator Biaya Produksi UMKM
// ES6, murni client-side, tanpa database

document.addEventListener('DOMContentLoaded', () => {
  // --- Helper: Format Rupiah ---
  const formatRupiah = num => 'Rp ' + Math.ceil(num).toLocaleString('id-ID');

  // --- DOM Elements ---
  const bahanTableBody = document.getElementById('bahanTableBody');
  const operasionalTableBody = document.getElementById('operasionalTableBody');
  const addBahanRowBtn = document.getElementById('addBahanRow');
  const addOperasionalRowBtn = document.getElementById('addOperasionalRow');
  const satuanOptions = ['gr', 'kg', 'ml', 'L', 'pcs'];
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

  // --- Reusable Row Creation ---
  function createRow(type) {
    const tr = document.createElement('tr');
    tr.className = 'added-row hover:bg-indigo-50 transition-all';
    if (type === 'bahan') {
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
          <button type="button" class="icon-btn remove-row" title="Hapus"><i class="fas fa-trash"></i></button>
        </td>
      `;
    } else if (type === 'operasional') {
      tr.innerHTML = `
        <td><input type="text" class="w-full border rounded px-2 py-1" placeholder="Nama Biaya" required></td>
        <td><input type="number" class="w-full border rounded px-2 py-1" min="0" step="any" placeholder="Modal" required></td>
        <td class="text-center">
          <button type="button" class="icon-btn remove-row" title="Hapus"><i class="fas fa-trash"></i></button>
        </td>
      `;
    }
    // Event listeners for input changes
    tr.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', hitungOtomatis);
      el.addEventListener('change', hitungOtomatis);
    });
    // Remove row logic
    tr.querySelector('.remove-row').addEventListener('click', () => {
      tr.classList.add('removed-row');
      setTimeout(() => {
        tr.remove();
        checkEmptyState(type);
        hitungOtomatis();
      }, 300);
    });
    return tr;
  }

  // --- Empty State Management ---
  function checkEmptyState(type) {
    if (type === 'bahan') {
      if (bahanTableBody.children.length === 0) {
        bahanTableBody.innerHTML = `<tr id="emptyBahanRow"><td colspan="5" class="text-center text-gray-400 py-6"><i class="fas fa-leaf text-2xl mb-2"></i><br>Tambahkan bahan baku untuk memulai perhitungan.</td></tr>`;
      } else {
        const emptyRow = document.getElementById('emptyBahanRow');
        if (emptyRow) emptyRow.remove();
      }
    } else if (type === 'operasional') {
      if (operasionalTableBody.children.length === 0) {
        operasionalTableBody.innerHTML = `<tr id="emptyOperasionalRow"><td colspan="3" class="text-center text-gray-400 py-6"><i class="fas fa-lightbulb text-2xl mb-2"></i><br>Tambahkan biaya operasional untuk perhitungan modal.</td></tr>`;
      } else {
        const emptyRow = document.getElementById('emptyOperasionalRow');
        if (emptyRow) emptyRow.remove();
      }
    }
  }

  // --- Kalkulasi Otomatis ---
  function hitungOtomatis() {
    // Total Bahan
    let totalBahan = 0;
    Array.from(bahanTableBody.children).forEach(tr => {
      const inputs = tr.querySelectorAll('input');
      if (inputs.length === 3) {
        const jumlah = parseFloat(inputs[0].value) || 0;
        const harga = parseFloat(inputs[2].value) || 0;
        totalBahan += jumlah * harga;
      }
    });
    // Total Operasional
    let totalOperasional = 0;
    Array.from(operasionalTableBody.children).forEach(tr => {
      const input = tr.querySelector('input[type="number"]');
      if (input) totalOperasional += parseFloat(input.value) || 0;
    });
    // Margin & Porsi
    const margin = parseFloat(document.getElementById('margin').value) || 0;
    const jumlahPorsi = parseInt(document.getElementById('jumlahPorsi').value) || 1;
    const totalModal = totalBahan + totalOperasional;
    const hargaJual = jumlahPorsi > 0 ? Math.ceil((totalModal * (1 + margin/100)) / jumlahPorsi) : 0;
    const totalKeuntungan = Math.ceil((hargaJual * jumlahPorsi) - totalModal);
    // Output
    outTotalModal.textContent = formatRupiah(totalModal);
    outHargaJual.textContent = formatRupiah(hargaJual);
    outTotalKeuntungan.textContent = formatRupiah(totalKeuntungan);
  }

  // --- Event Listeners ---
  addBahanRowBtn.addEventListener('click', () => {
    bahanTableBody.appendChild(createRow('bahan'));
    checkEmptyState('bahan');
    hitungOtomatis();
  });
  addOperasionalRowBtn.addEventListener('click', () => {
    operasionalTableBody.appendChild(createRow('operasional'));
    checkEmptyState('operasional');
    hitungOtomatis();
  });

  // Form input listeners for real-time calculation
  ['margin', 'jumlahPorsi', 'namaProduk'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', hitungOtomatis);
      el.addEventListener('change', hitungOtomatis);
    }
  });

  // --- Form Submit ---
  form.addEventListener('submit', e => {
    e.preventDefault();
    outNamaProduk.textContent = document.getElementById('namaProduk').value;
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

  // --- Gambar Produk Preview ---
  gambarProduk.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        previewGambar.src = ev.target.result;
        previewGambar.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    } else {
      previewGambar.src = '';
      previewGambar.classList.add('hidden');
    }
  });

  // --- Reset ---
  resetBtn.addEventListener('click', () => {
    form.reset();
    previewGambar.src = '';
    previewGambar.classList.add('hidden');
    outGambar.src = '';
    outGambar.classList.add('hidden');
    output.classList.add('hidden');
    bahanTableBody.innerHTML = '';
    operasionalTableBody.innerHTML = '';
    checkEmptyState('bahan');
    checkEmptyState('operasional');
    hitungOtomatis();
  });

  // --- Initial State ---
  checkEmptyState('bahan');
  checkEmptyState('operasional');
  hitungOtomatis();
});