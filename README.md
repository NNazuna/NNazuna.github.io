<p align="center">
  <img src="icon-192.png" width="96" alt="WiraCalc icon">
</p>

<h1 align="center">WiraCalc</h1>

<p align="center">
  Kalkulator biaya produksi dan harga jual untuk UMKM. Gratis, tanpa login, dan bisa dipakai offline.
</p>

<p align="center">
  <a href="https://nnazuna.me"><b>Buka aplikasi → nnazuna.me</b></a>
</p>

---

## Kenapa

Banyak pelaku UMKM menghitung modal dan harga jual secara manual di kertas atau kalkulator biasa, sehingga mudah salah hitung dan sulit dicek ulang. WiraCalc menghitung semuanya otomatis dan menampilkan rincian yang bisa disimpan atau dibagikan.

## Fitur

- **Bahan baku**: nama, jumlah, satuan, dan harga per satuan.
- **Biaya operasional**: gas, listrik, kemasan, dan biaya lain.
- **Margin keuntungan** dan **jumlah porsi** → langsung keluar total modal, harga jual per porsi, dan total keuntungan.
- **Export** hasil sebagai PDF atau gambar, atau **bagikan** langsung.
- Data tersimpan otomatis di browser, jadi tidak hilang saat halaman ditutup.
- **Bisa di-install** ke layar utama HP (PWA) dan tetap jalan tanpa internet.

## Cara hitung

```
Total modal         = Σ (jumlah × harga bahan) + Σ biaya operasional
Harga jual / porsi  = ⌈ total modal × (1 + margin%) ÷ jumlah porsi ⌉
Total keuntungan    = harga jual / porsi × jumlah porsi − total modal
```

Harga jual dibulatkan ke atas supaya tidak pernah di bawah target margin.

## Teknologi

HTML, JavaScript tanpa framework, Tailwind CSS, Service Worker untuk mode offline, html2canvas dan jsPDF untuk export. Di-host gratis dengan GitHub Pages di domain `nnazuna.me`.

## Menjalankan secara lokal

```bash
git clone https://github.com/NNazuna/NNazuna.github.io
cd NNazuna.github.io
python3 -m http.server 8000
# buka http://localhost:8000
```

Service Worker butuh `localhost` atau HTTPS, jadi jangan buka `index.html` langsung dari file.

---

<p align="center">Dibuat oleh <a href="https://github.com/NNazuna">NNazuna</a></p>
