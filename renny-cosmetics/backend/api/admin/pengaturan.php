<?php
/* =========================================================
   API PENGATURAN TOKO
   GET -> semua pengaturan
   PUT -> simpan pengaturan (khusus owner)
   ========================================================= */
require __DIR__ . '/_admin.php';

if (method() === 'GET') ok(['settings' => get_settings()]);

if (method() === 'PUT') {
    require_admin('owner');
    $in = body();
    $d = v($in)->text('address', 'Alamat', 200, false)->text('mapsUrl', 'Link Google Maps', 255, false)->text('hours', 'Jam buka', 100, false)
        ->text('email', 'Email', 120, false)->text('instagram', 'Instagram', 60, false)->text('tiktok', 'TikTok', 60, false)->text('shopee', 'Shopee', 60, false)
        ->text('topbar', 'Teks bar atas', 160, false)->longtext('brandHighlight', 'Pilihan brand', 300)->longtext('itkDiscount', 'Diskon ITK', 300)
        ->longtext('offlineStore', 'Toko offline', 400)->longtext('shippingInfo', 'Info ongkir', 1500)->longtext('paymentInfo', 'Info pembayaran', 1500)
        ->bool('flashActive')->text('flashEndsAt', 'Waktu flash sale', 40, false)->check();

    $err = [];
    $wa = preg_replace('/\D/', '', (string) ($in['whatsapp'] ?? ''));
    if (str_starts_with($wa, '0')) $wa = '62' . substr($wa, 1);
    if (!preg_match('/^62\d{8,13}$/', $wa)) $err['whatsapp'] = 'Nomor WhatsApp belum benar. Contoh: 0811-5403-403.';
    if ($d['mapsUrl'] !== '' && !preg_match('#^https?://#i', $d['mapsUrl'])) $err['mapsUrl'] = 'Link harus diawali https://';
    if ($d['email'] !== '' && !filter_var($d['email'], FILTER_VALIDATE_EMAIL)) $err['email'] = 'Format email belum benar.';
    if ($d['flashActive'] && ($d['flashEndsAt'] === '' || strtotime($d['flashEndsAt']) <= time())) $err['flashEndsAt'] = 'Isi waktu berakhir yang belum lewat.';
    if ($err) fail('Periksa lagi isian yang ditandai merah.', 422, $err);

    // pilihan tampilan & animasi beranda
    $d['brandStyle'] = in_array($in['brandStyle'] ?? '', ['grid', 'geser', 'jalan'], true) ? $in['brandStyle'] : 'grid';
    $d['bannerAuto'] = !empty($in['bannerAuto']);

    $d['whatsapp'] = $wa;
    $d['flashActive'] = (bool) $d['flashActive'];
    $d['flashEndsAt'] = $d['flashEndsAt'] !== '' ? date('c', strtotime($d['flashEndsAt'])) : '';
    foreach (['instagram', 'tiktok'] as $k) $d[$k] = ltrim($d[$k], '@');
    $d['storeName'] = 'Renny Cosmetics';

    $st = db()->prepare("REPLACE INTO settings (`key`, `value`) VALUES (?, ?)");
    foreach ($d as $k => $val) $st->execute([$k, json_encode($val, JSON_UNESCAPED_UNICODE)]);
    ok(['settings' => get_settings()], 'Pengaturan disimpan.');
}

fail('Metode tidak didukung.', 405);
