// WiraCalc - Kalkulator Biaya Produksi UMKM
// ES6, murni client-side, tanpa database

document.addEventListener('DOMContentLoaded', () => {
  // --- Helper: Format Rupiah & Thousand Separator ---
  const formatRupiah = num => 'Rp ' + Math.ceil(num).toLocaleString('id-ID');
  const formatThousand = val => {
    val = val.toString().replace(/\D/g, '');
    return val.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };
  const parseThousand = val => parseInt(val.replace(/\./g, '')) || 0;

  // --- DOM Elements ---
  const bahanTableBody = document.getElementById('bahanTableBody');
  const operasionalTableBody = document.getElementById('operasionalTableBody');
  const addBahanRowBtn = document.getElementById('addBahanRow');
  const addOperasionalRowBtn = document.getElementById('addOperasionalRow');
  const satuanOptions = ['gr', 'kg', 'ml', 'L', 'pcs'];
  const form = document.getElementById('form');
  const output = document.getElementById('laporan-digital');
  const outNamaProduk = document.getElementById('outNamaProduk');
  const outTotalModal = document.getElementById('outTotalModal');
  const outHargaJual = document.getElementById('outHargaJual');
  const outTotalKeuntungan = document.getElementById('outTotalKeuntungan');
  const outGambar = document.getElementById('outputGambar');
  const previewGambar = document.getElementById('previewGambar');
  const gambarProduk = document.getElementById('gambarProduk');
  const resetBtn = document.getElementById('resetBtn');
  // Export wrapper
  const exportBahanTableBody = document.getElementById('exportBahanTableBody');
  const exportOperasionalTableBody = document.getElementById('exportOperasionalTableBody');
  const exportMargin = document.getElementById('exportMargin');
  const exportPorsi = document.getElementById('exportPorsi');

  // --- LocalStorage Logic ---
  const LS_KEY = 'wiracalc-data-v1';
  function saveToLocalStorage() {
    const data = {
      namaProduk: document.getElementById('namaProduk').value,
      margin: document.getElementById('margin').value,
      jumlahPorsi: document.getElementById('jumlahPorsi').value,
      bahan: Array.from(bahanTableBody.children).map(tr => {
        const inputs = tr.querySelectorAll('input, select');
        if (inputs.length === 4) {
          return {
            nama: inputs[0].value,
            jumlah: inputs[1].value,
            satuan: inputs[2].value,
            harga: inputs[3].value
          };
        }
      }).filter(Boolean),
      operasional: Array.from(operasionalTableBody.children).map(tr => {
        const inputs = tr.querySelectorAll('input, select');
        if (inputs.length === 2) {
          return {
            nama: inputs[0].value,
            modal: inputs[1].value
          };
        }
      }).filter(Boolean)
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }
  function loadFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    document.getElementById('namaProduk').value = data.namaProduk || '';
    document.getElementById('margin').value = data.margin || '';
    document.getElementById('jumlahPorsi').value = data.jumlahPorsi || '';
    bahanTableBody.innerHTML = '';
    operasionalTableBody.innerHTML = '';
    if (Array.isArray(data.bahan)) {
      data.bahan.forEach(item => {
        const tr = createRow('bahan');
        const inputs = tr.querySelectorAll('input, select');
        inputs[0].value = item.nama;
        inputs[1].value = item.jumlah;
        inputs[2].value = item.satuan;
        inputs[3].value = item.harga;
        bahanTableBody.appendChild(tr);
      });
    }
    if (Array.isArray(data.operasional)) {
      data.operasional.forEach(item => {
        const tr = createRow('operasional');
        const inputs = tr.querySelectorAll('input, select');
        inputs[0].value = item.nama;
        inputs[1].value = item.modal;
        operasionalTableBody.appendChild(tr);
      });
    }
    checkEmptyState('bahan');
    checkEmptyState('operasional');
    hitungOtomatis();
  }

  // --- Reusable Row Creation ---
  function createRow(type) {
    const tr = document.createElement('tr');
    tr.className = 'added-row hover:bg-indigo-50 transition-all';
    if (type === 'bahan') {
      tr.innerHTML = `
        <td><input type="text" class="w-full border rounded px-2 py-1" placeholder="Nama Bahan" required></td>
        <td><input type="text" class="w-full border rounded px-2 py-1 thousand-separator" min="0" step="any" placeholder="Jumlah" required></td>
        <td>
          <select class="w-full border rounded px-2 py-1">
            ${satuanOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
        </td>
        <td><input type="text" class="w-full border rounded px-2 py-1 thousand-separator" min="0" step="any" placeholder="Harga" required></td>
        <td class="text-center">
          <button type="button" class="icon-btn remove-row" title="Hapus"><i class="fas fa-trash"></i></button>
        </td>
      `;
      // Thousand separator for jumlah & harga
      tr.querySelectorAll('input.thousand-separator').forEach(input => {
        input.addEventListener('input', e => {
          const caret = input.selectionStart;
          let val = input.value.replace(/\./g, '');
          input.value = formatThousand(val);
          input.setSelectionRange(caret, caret);
          hitungOtomatis();
          saveToLocalStorage();
        });
      });
    } else if (type === 'operasional') {
      tr.innerHTML = `
        <td><input type="text" class="w-full border rounded px-2 py-1" placeholder="Nama Biaya" required></td>
        <td><input type="text" class="w-full border rounded px-2 py-1 thousand-separator" min="0" step="any" placeholder="Modal" required></td>
        <td class="text-center">
          <button type="button" class="icon-btn remove-row" title="Hapus"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tr.querySelector('input.thousand-separator').addEventListener('input', e => {
        const input = e.target;
        const caret = input.selectionStart;
        let val = input.value.replace(/\./g, '');
        input.value = formatThousand(val);
        input.setSelectionRange(caret, caret);
        hitungOtomatis();
        saveToLocalStorage();
      });
    }
    // Event listeners for input changes
    tr.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', () => { hitungOtomatis(); saveToLocalStorage(); });
      el.addEventListener('change', () => { hitungOtomatis(); saveToLocalStorage(); });
    });
    // Remove row logic
    tr.querySelector('.remove-row').addEventListener('click', () => {
      tr.classList.add('removed-row');
      setTimeout(() => {
        tr.remove();
        checkEmptyState(type);
        hitungOtomatis();
        saveToLocalStorage();
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
      const inputs = tr.querySelectorAll('input, select');
      if (inputs.length === 4) {
        const jumlah = parseThousand(inputs[1].value);
        const harga = parseThousand(inputs[3].value);
        totalBahan += jumlah * harga;
      }
    });
    // Total Operasional
    let totalOperasional = 0;
    Array.from(operasionalTableBody.children).forEach(tr => {
      const inputs = tr.querySelectorAll('input, select');
      if (inputs.length === 2) {
        totalOperasional += parseThousand(inputs[1].value);
      }
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
    // Export Table Sync
    syncExportTables();
  }

  // --- Export Table Sync ---
  function syncExportTables() {
    // Bahan
    exportBahanTableBody.innerHTML = '';
    Array.from(bahanTableBody.children).forEach(tr => {
      const inputs = tr.querySelectorAll('input, select');
      if (inputs.length === 4) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${inputs[0].value}</td>
          <td>${inputs[1].value}</td>
          <td>${inputs[2].value}</td>
          <td>${inputs[3].value}</td>
        `;
        exportBahanTableBody.appendChild(row);
      }
    });
    // Operasional
    exportOperasionalTableBody.innerHTML = '';
    Array.from(operasionalTableBody.children).forEach(tr => {
      const inputs = tr.querySelectorAll('input, select');
      if (inputs.length === 2) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${inputs[0].value}</td>
          <td>${inputs[1].value}</td>
        `;
        exportOperasionalTableBody.appendChild(row);
      }
    });
    // Margin & Porsi
    exportMargin.textContent = document.getElementById('margin').value + ' %';
    exportPorsi.textContent = document.getElementById('jumlahPorsi').value;
  }

  // --- Fungsi Tambahan: Web Share API ---
  async function shareHasil() {
    try {
      const canvas = await html2canvas(output, { backgroundColor: '#fff', scale: 2, useCORS: true });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `laporan-wiracalc.png`, { type: 'image/png' });
        if (navigator.share) {
          await navigator.share({
            title: 'Laporan WiraCalc',
            text: `Hasil perhitungan biaya produksi untuk ${outNamaProduk.textContent}`,
            files: [file],
          });
        } else {
          alert('Fitur Share tidak didukung di browser ini. Silakan gunakan tombol Export.');
        }
      });
    } catch (err) {
      console.error('Share gagal:', err);
    }
  }

  // --- Export Gambar ---
  function exportIMG() {
    const laporan = document.getElementById('laporan-digital');
    syncExportTables();
    const wasHidden = laporan.classList.contains('hidden');
    laporan.classList.remove('hidden');
    html2canvas(laporan, {
      backgroundColor: '#fff',
      scale: 2,
      useCORS: true
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `WiraCalc-${outNamaProduk.textContent}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      if (wasHidden) laporan.classList.add('hidden');
    });
  }

  // --- Export PDF ---
  function exportPDF() {
    const laporan = document.getElementById('laporan-digital');
    syncExportTables();
    const wasHidden = laporan.classList.contains('hidden');
    laporan.classList.remove('hidden');
    html2canvas(laporan, {
      backgroundColor: '#fff',
      scale: 2,
      useCORS: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Laporan-${outNamaProduk.textContent}.pdf`);
      if (wasHidden) laporan.classList.add('hidden');
    });
  }

  // --- Web Share API ---
  async function shareKeSosmed() {
    const laporan = document.getElementById('laporan-digital');
    syncExportTables();
    const wasHidden = laporan.classList.contains('hidden');
    laporan.classList.remove('hidden');
    try {
      const canvas = await html2canvas(laporan, { backgroundColor: '#fff', scale: 2, useCORS: true });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `Laporan-WiraCalc.png`, { type: 'image/png' });
        if (window.location.protocol !== 'https:') {
          alert('Fitur share hanya aktif di koneksi aman (HTTPS).');
        } else if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Laporan WiraCalc',
            text: `Hasil perhitungan biaya produksi untuk ${outNamaProduk.textContent}`,
            files: [file],
          });
        } else {
          alert('Fitur Share tidak didukung di browser ini. Silakan gunakan tombol Export.');
        }
        if (wasHidden) laporan.classList.add('hidden');
      });
    } catch (err) {
      if (wasHidden) laporan.classList.add('hidden');
      console.error('Share gagal:', err);
    }
  }

  // --- Export & Share Event Listeners ---
  document.getElementById('exportIMG').addEventListener('click', exportIMG);
  document.getElementById('exportPDF').addEventListener('click', exportPDF);
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) shareBtn.addEventListener('click', shareKeSosmed);

  // --- Initial State ---
  loadFromLocalStorage();
  output.classList.add('hidden');
});