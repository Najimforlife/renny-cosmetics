<?php
/* =========================================================
   PENGATURAN KONEKSI DATABASE
   Default sudah cocok untuk XAMPP (user root, tanpa password).
   Kalau website dipindah ke hosting, ganti sesuai data hosting.
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
