<?php
/* =========================================================
   RENNY COSMETICS — FONDASI API
   Titik masuk backend: semua file di backend/api/ memanggil file ini.
   Isinya hanya menyiapkan pengaturan, header, dan sesi, lalu memuat modul:
     database.php   koneksi DB (db, q)
     response.php   balasan JSON & isi request
     validator.php  validasi input
     security.php   CSRF & batas login
     auth.php       sesi pembeli & admin
     helpers.php    fungsi bantu bersama
   ========================================================= */
declare(strict_types=1);

// pengaturan (config.php dibuat dari config.example.php, tidak ikut Git)
$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'message' => 'File backend/core/config.php belum ada. Salin config.example.php menjadi config.php, lalu isi koneksi database.'], JSON_UNESCAPED_UNICODE);
    exit;
}
$CONFIG = require $configFile;

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);
session_name('RCSESSID');
session_start();

require __DIR__ . '/database.php';
require __DIR__ . '/response.php';
require __DIR__ . '/validator.php';
require __DIR__ . '/security.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/helpers.php';

set_exception_handler(function (Throwable $e) {
    error_log('[Renny Cosmetics API] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    $msg = $e instanceof PDOException
        ? 'Database belum siap. Pastikan MySQL di XAMPP sudah Start dan install.php sudah dijalankan.'
        : 'Terjadi kesalahan di server. Coba lagi beberapa saat.';
    json_out(['ok' => false, 'message' => $msg], 500);
});
