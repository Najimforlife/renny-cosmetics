# Website Renny Cosmetics

Toko online ala Sociolla + panel admin, dengan **akun pembeli, pesanan, dan database MySQL**.
Frontend: HTML, CSS, JavaScript. Backend: PHP 8. Database: MySQL/MariaDB.
Jalan di **XAMPP**, tanpa npm, tanpa PowerShell.

Data awal: 13.081 produk dan 418 brand dari daftar item iPOS (tanpa harga pokok & margin).

## Isi folder

Frontend (yang dilihat pengunjung) dan backend (PHP + database) dipisah di dua folder.

```
renny-cosmetics/
├── index.html                 Pengalih otomatis ke frontend/index.html
├── README.md
├── .gitignore
│
├── frontend/                  FRONTEND: semua yang dibuka di browser
│   ├── index.html             Halaman toko / landing page (pembeli)
│   ├── admin.html             Panel admin (owner & staf)
│   ├── assets/
│   │   ├── css/
│   │   │   ├── style.css      Tampilan toko (dipakai juga oleh admin)
│   │   │   └── admin.css      Tambahan khusus panel admin
│   │   ├── img/               Logo, favicon, gambar pratinjau link (og.png)
│   │   ├── js/
│   │   │   ├── config.js      Alamat folder API (satu-satunya yang diubah kalau backend dipindah)
│   │   │   ├── shared/        Dipakai toko & admin
│   │   │   │   ├── core.js    Data kategori, konversi data iPOS
│   │   │   │   └── api.js     Penghubung ke backend (fetch + token CSRF)
│   │   │   ├── toko/          1 file = 1 fitur toko
│   │   │   │   ├── dasar.js       Variabel bersama & kartu produk
│   │   │   │   ├── beranda.js     Landing page, banner, deretan brand
│   │   │   │   ├── katalog.js     Daftar produk + filter
│   │   │   │   ├── produk.js      Detail produk
│   │   │   │   ├── halaman.js     Semua brand, wishlist, bantuan
│   │   │   │   ├── pencarian.js   Kolom cari + saran
│   │   │   │   ├── keranjang.js   Keranjang & checkout
│   │   │   │   ├── akun.js        Masuk, daftar, alamat, pesanan saya
│   │   │   │   └── main.js        Router halaman & mulai (dimuat terakhir)
│   │   │   └── admin/         1 file = 1 menu admin
│   │   │       ├── dasar.js       Helper bersama (form, toast, upload)
│   │   │       ├── ringkasan.js, pesanan.js, produk.js, kategori.js, brand.js,
│   │   │       ├── pengguna.js, konten.js, pengaturan.js, ipos.js, akun.js
│   │   │       └── main.js        Router menu & login (dimuat terakhir)
│   │   └── vendor/            sql.js: pembaca file iPOS (.exitem) di browser
│   └── uploads/               Foto produk & logo brand yang diupload admin
│
├── backend/                   BACKEND: PHP + database
│   ├── install.php            Pasang database + akun owner (sekali saja)
│   ├── api/                   Endpoint yang dipanggil frontend (membalas JSON)
│   │   ├── toko/              API untuk pembeli
│   │   │   ├── katalog.php    Data toko & produk aktif
│   │   │   ├── akun.php       Daftar, masuk, profil, password, hapus akun
│   │   │   ├── alamat.php     CRUD alamat
│   │   │   └── pesanan.php    Buat, lihat, batalkan pesanan
│   │   └── admin/             API panel admin (wajib login admin)
│   │       └── auth, ringkasan, pesanan, produk, kategori, brand, pengguna,
│   │           staf, konten, pengaturan, ipos, upload (.php)
│   ├── core/                  Tidak bisa dibuka dari browser
│   │   ├── config.example.php Contoh setelan (ikut Git)
│   │   ├── config.php         Setelan koneksi MySQL & folder upload (salinan lokal, TIDAK ikut Git)
│   │   ├── bootstrap.php      Titik masuk: setelan, header, sesi, lalu memuat modul di bawah
│   │   ├── database.php       Koneksi DB: db(), q()
│   │   ├── response.php       Balasan JSON & isi request
│   │   ├── validator.php      Validasi input
│   │   ├── security.php       Token CSRF & batas percobaan login
│   │   ├── auth.php           Sesi pembeli & admin
│   │   └── helpers.php        Bentuk data produk, pengaturan, slug, id unik
│   └── database/              Tidak bisa dibuka dari browser
│       ├── schema.sql         Struktur 13 tabel
│       └── seed.json          Data awal: 13.081 produk, 418 brand
│
└── docs/                      Dokumentasi untuk presentasi (SVG)
    ├── erd.svg
    └── flowchart-checkout / login / produk / impor-ipos / sinkron-stok .svg
```

Alur singkat: browser membuka `frontend/` → `assets/js/shared/api.js` memanggil `backend/api/...` → API memakai `backend/core/bootstrap.php` untuk bicara ke MySQL.

Urutan `<script>` di `frontend/index.html` dan `frontend/admin.html` penting: `config.js` dulu, lalu `shared`, `dasar.js`, file fitur, dan `main.js` paling akhir.

## Gambar

- Logo, favicon, ikon kategori, dan ilustrasi produk memakai **SVG**, jadi tajam di semua ukuran layar.
- Upload **logo brand**: paling bagus file **SVG**. File SVG dicek dulu, yang berisi script ditolak.
- Upload **foto produk**: foto otomatis dikecilkan dan diubah ke **WebP** (lebih ringan dari JPG). Foto asli tidak bisa jadi SVG karena SVG untuk gambar vektor (logo, ikon), bukan foto.
- `og.png` tetap PNG karena WhatsApp, Instagram, dan Facebook belum bisa menampilkan SVG sebagai pratinjau link.

## Animasi

Diatur di **Admin → Pengaturan toko → Tampilan & animasi beranda**:

| Pilihan deretan brand | Keterangan |
| --- | --- |
| **Grid diam** (bawaan) | Paling ringan, tidak ada animasi |
| Geser manual | Satu baris, digeser dengan jari atau tombol panah |
| Berjalan otomatis | Satu baris bergerak pelan, berhenti saat tidak terlihat di layar |

Banner promo bisa diatur berganti otomatis atau tidak. Pengunjung yang mengaktifkan "kurangi animasi" di HP-nya otomatis mendapat versi tanpa gerakan.

## Cara menjalankan di laptop (XAMPP)

1. Install **XAMPP** (versi dengan PHP 8): https://www.apachefriends.org
2. Extract zip, lalu salin folder `renny-cosmetics` ke `C:\xampp\htdocs\`
   (hasilnya `C:\xampp\htdocs\renny-cosmetics\index.html`).
3. Buka **XAMPP Control Panel** → klik **Start** di **Apache** dan **MySQL** (sampai hijau).
4. Buka browser: `http://localhost/renny-cosmetics/backend/install.php`
   Isi nama, email, dan password akun **owner** → klik **Pasang sekarang**.
   Tunggu sampai muncul "Pemasangan selesai" (mengisi 13 ribu produk, ±10–30 detik).
5. Toko: `http://localhost/renny-cosmetics/` (otomatis diarahkan ke `frontend/`)
   Admin: `http://localhost/renny-cosmetics/frontend/admin.html` → masuk pakai akun owner tadi.

Edit kode di VS Code: **File → Open Folder** → `C:\xampp\htdocs\renny-cosmetics`.
Simpan file, lalu refresh browser. Tidak perlu Live Server.

> Jangan buka dengan klik dua kali file `frontend/index.html` atau lewat Live Server: PHP tidak jalan di sana.
> Selalu lewat `http://localhost/...` dengan Apache & MySQL menyala.

### Kalau ada masalah

| Pesan / gejala | Solusi |
| --- | --- |
| "Tidak bisa terhubung ke server" / "Database belum siap" | Apache atau MySQL belum Start di XAMPP |
| MySQL tidak mau Start (port 3306 dipakai) | Tutup aplikasi MySQL lain, atau ganti port di XAMPP lalu ubah `db_port` di `backend/core/config.php` |
| MySQL root pakai password | Isi `db_pass` di `backend/core/config.php` |
| "Database sudah terpasang" di install.php | Normal, install hanya sekali. Untuk ulang dari nol: phpMyAdmin → hapus database `renny_cosmetics` → buka `backend/install.php` lagi |
| Upload foto gagal | Pastikan folder `frontend/uploads/` bisa ditulis, ukuran maks. 3 MB |

## Fitur

**Pembeli (CRUD akun sendiri)**
- Daftar, masuk, keluar, ubah profil, ganti password, hapus akun
- Simpan sampai 10 alamat, pilih alamat utama
- Keranjang & wishlist, checkout (ambil di toko / dikirim), klaim diskon mahasiswa ITK
- Pesanan tersimpan dengan kode `RC-YYMMDD-NNN`, lalu dikirim ke WhatsApp admin
- Lihat status pesanan & catatan admin, batalkan pesanan yang masih "Baru"

**Admin**
- Ringkasan: pesanan baru, penjualan bulan ini, produk, pembeli, daftar tugas
- Pesanan: filter status, detail, chat WhatsApp, ubah status + catatan
- Produk: tambah/edit/hapus, upload foto, cari & filter, aksi massal
- Kategori (urutan, ikon), Brand & logo
- Pengguna: akun pembeli (tambah, edit, nonaktifkan, reset password, hapus) dan staf (khusus owner)
- Banner promo, testimoni, FAQ, pengaturan toko, flash sale
- iPOS & stok: impor file `.exitem`, sinkron stok dari CSV/Excel
- Peran: **owner** (semua akses) dan **staf** (tanpa pengaturan, hapus akun, kelola staf)

## Alur pesanan

`Baru → Dikonfirmasi → Dikemas → Dikirim / siap diambil → Selesai` (atau `Dibatalkan`).
Pembayaran & ongkir tetap dikonfirmasi lewat WhatsApp; admin menulis total di catatan pesanan.

## Update data dari iPOS

1. Di iPOS: **Export Daftar Item** → file `.exitem`.
2. Admin → **iPOS & stok** → pilih file → centang opsi → **Terapkan**.
   File dibaca di browser; harga pokok dan margin **tidak** dikirim ke server.
3. Stok: export stok dari iPOS ke Excel/CSV (kolom `kode barang, stok`), tempel → **Sinkronkan stok**.
   Produk tanpa angka stok tampil "stok dikonfirmasi lewat WhatsApp".

## Keamanan yang sudah ada

- Password di-hash (bcrypt), query pakai prepared statement (aman dari SQL injection)
- Token CSRF di setiap simpan/ubah/hapus, sesi cookie httponly
- Batas 5 kali salah login per 15 menit
- Hak owner/staf dicek di server, harga & stok pesanan dihitung ulang di server
- Upload hanya gambar asli (JPG/PNG/WebP, maks. 3 MB); folder `frontend/uploads/` tidak bisa menjalankan PHP; `backend/core/` dan `backend/database/` tertutup dari browser

## Git

`backend/core/config.php` berisi password database, jadi sengaja tidak ikut Git (ada di `.gitignore`).
Setelah clone, salin `backend/core/config.example.php` menjadi `config.php`. Untuk XAMPP, isinya sudah cocok tanpa diubah.

## Online (hosting)

Netlify/GitHub Pages **tidak bisa** menjalankan PHP. Pakai hosting yang mendukung **PHP 8 + MySQL**
(misal Niagahoster/Hostinger/Rumahweb):
1. Upload isi folder `renny-cosmetics` ke `public_html` (folder `frontend/`, `backend/`, dan `index.html` ikut).
2. Salin `backend/core/config.example.php` menjadi `backend/core/config.php` (kalau belum ada), lalu isi nama database, user, dan password dari cPanel.
3. Buka `https://domainmu/backend/install.php`, buat akun owner.
4. Setelah berhasil, hapus atau ganti nama `backend/install.php`.
5. Toko bisa dibuka di `https://domainmu/` (diarahkan ke `frontend/`).

Kalau backend dipindah ke tempat lain, ubah `apiBase` dan `installUrl` di `frontend/assets/js/config.js`.
