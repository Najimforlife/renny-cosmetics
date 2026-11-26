<?php
/* =========================================================
   CONTOH PENGATURAN KONEKSI DATABASE
   Salin file ini menjadi config.php, lalu isi sesuai server kamu.
   - XAMPP: nilai di bawah sudah cocok (user root, tanpa password).
   - Hosting: ganti db_name, db_user, db_pass sesuai data dari cPanel.
   config.php TIDAK ikut Git karena berisi password. Yang ikut hanya file contoh ini.
   ========================================================= */
return [
    'db_host' => '127.0.0.1',
    'db_port' => 3306,
    'db_name' => 'renny_cosmetics',
    'db_user' => 'root',
    'db_pass' => '',

    // folder penyimpanan foto produk & logo brand.
    // Ada di frontend/ supaya bisa dibuka langsung oleh halaman toko.
    // upload_url = alamat yang disimpan di database (relatif terhadap folder frontend/).
    'upload_dir' => __DIR__ . '/../../frontend/uploads',
    'upload_url' => 'uploads/',
    'max_upload' => 3 * 1024 * 1024, // 3 MB
];
