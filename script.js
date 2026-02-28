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

// --- Submit form: Hitung dan tampilkan hasil ---
document.getElementById('form').addEventListener('submit', e => {
  e.preventDefault();
  const namaProduk = document.getElementById('namaProduk').value;
  const bahanBaku = parseFloat(document.getElementById('bahanBaku').getAttribute('data-value') || '0');
  const biayaMasak = parseFloat(document.getElementById('biayaMasak').getAttribute('data-value') || '0');
  const margin = parseFloat(document.getElementById('margin').value) || 0;
  const jumlahPorsi = parseInt(document.getElementById('jumlahPorsi').value) || 1;

  // Validasi input
  const pesan = validasiInput({bahanBaku, biayaMasak, margin, jumlahPorsi});
  if (pesan) {
    alert(pesan);
    return;
  }

  // Hitung total modal
  const totalModal = bahanBaku + biayaMasak;
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

async function exportPDF() {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  const output = document.getElementById('output');
  html2canvas(output).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new window.jspdf.jsPDF({orientation: 'portrait', unit: 'pt', format: 'a4'});
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 40;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
    pdf.save('hasil-wiracalc.pdf');
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