<?php
/* =========================================================
   API UPLOAD GAMBAR (foto produk & logo brand)
   POST multipart: file=<gambar>, jenis=produk|logo
   ========================================================= */
require __DIR__ . '/_admin.php';
if (method() !== 'POST') fail('Metode tidak didukung.', 405);

$f = $_FILES['file'] ?? null;
if (!$f || $f['error'] !== UPLOAD_ERR_OK) fail('File gagal diupload. Coba lagi.');
if ($f['size'] > $CONFIG['max_upload']) fail('Ukuran gambar maksimal 3 MB.');

// cek isi file benar-benar gambar (bukan cuma dari nama file)
$head = (string) file_get_contents($f['tmp_name'], false, null, 0, 1024);
if (preg_match('/^\s*(<\?xml[^>]*>\s*)?(<!--.*?-->\s*)*<svg[\s>]/is', $head)) {
    // SVG: gambar vektor, tajam di semua ukuran. Dicek supaya tidak berisi kode berbahaya.
    if ($f['size'] > 512 * 1024) fail('Ukuran file SVG maksimal 512 KB.');
    $svg = (string) file_get_contents($f['tmp_name']);
    $bahaya = '/<script|<foreignobject|<iframe|<embed|<object|<!entity|<!doctype|\bon[a-z]+\s*=|javascript:|(?:xlink:)?href\s*=\s*["\']\s*(?:https?:|data:(?!image\/))/i';
    if (preg_match($bahaya, $svg)) fail('File SVG ini berisi kode yang tidak diizinkan. Pakai SVG biasa (hanya gambar).');
    $ext = 'svg';
} else {
    $info = @getimagesize($f['tmp_name']);
    $ext = match ($info['mime'] ?? '') {
        'image/webp' => 'webp',
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
        default => fail('Format harus SVG, WEBP, PNG, atau JPG.'),
    };
}

$jenis = ($_POST['jenis'] ?? '') === 'logo' ? 'logo' : 'produk';
$dir = rtrim($CONFIG['upload_dir'], '/') . "/$jenis/" . date('Ym');
if (!is_dir($dir) && !mkdir($dir, 0755, true)) fail('Folder uploads tidak bisa dibuat. Cek izin folder.', 500);
$name = bin2hex(random_bytes(8)) . '.' . $ext;
if (!move_uploaded_file($f['tmp_name'], "$dir/$name")) fail('Gambar gagal disimpan.', 500);

ok(['url' => $CONFIG['upload_url'] . "$jenis/" . date('Ym') . "/$name"], 'Gambar diupload.');
