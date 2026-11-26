<?php
/* GET backend/api/admin/ringkasan.php -> angka-angka untuk dashboard */
require __DIR__ . '/_admin.php';

$s = get_settings();
$flashOn = !empty($s['flashActive']) && !empty($s['flashEndsAt']) && strtotime($s['flashEndsAt']) > time();
ok([
    'products' => (int) q("SELECT COUNT(*) FROM products")->fetchColumn(),
    'active' => (int) q("SELECT COUNT(*) FROM products WHERE is_active = 1")->fetchColumn(),
    'noPhoto' => (int) q("SELECT COUNT(*) FROM products WHERE is_active = 1 AND (image IS NULL OR image = '')")->fetchColumn(),
    'tracked' => (int) q("SELECT COUNT(*) FROM products WHERE stock IS NOT NULL")->fetchColumn(),
    'outOfStock' => (int) q("SELECT COUNT(*) FROM products WHERE stock = 0")->fetchColumn(),
    'brands' => (int) q("SELECT COUNT(*) FROM brands")->fetchColumn(),
    'logos' => (int) q("SELECT COUNT(*) FROM brands WHERE logo IS NOT NULL AND logo <> ''")->fetchColumn(),
    'featured' => (int) q("SELECT COUNT(*) FROM products WHERE is_active = 1 AND is_featured = 1")->fetchColumn(),
    'flashOn' => $flashOn,
    'flashCount' => (int) q("SELECT COUNT(*) FROM products WHERE is_active = 1 AND is_flash = 1 AND compare_price > price")->fetchColumn(),
    'users' => (int) q("SELECT COUNT(*) FROM users")->fetchColumn(),
    'ordersNew' => (int) q("SELECT COUNT(*) FROM orders WHERE status = 'baru'")->fetchColumn(),
    'ordersToday' => (int) q("SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()")->fetchColumn(),
    'salesMonth' => (int) q("SELECT COALESCE(SUM(subtotal),0) FROM orders WHERE status = 'selesai' AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')")->fetchColumn(),
    'latestOrders' => q("SELECT code, customer_name, subtotal, status, created_at FROM orders ORDER BY created_at DESC, id DESC LIMIT 5")->fetchAll(),
    'settings' => ['whatsapp' => $s['whatsapp'] ?? '', 'hours' => $s['hours'] ?? '', 'shippingInfo' => $s['shippingInfo'] ?? '', 'paymentInfo' => $s['paymentInfo'] ?? ''],
]);
