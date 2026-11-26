<?php
/* =========================================================
   API PUBLIK — data toko untuk halaman pembeli
   GET backend/api/toko/katalog.php
   ========================================================= */
require __DIR__ . '/../../core/bootstrap.php';

if (method() !== 'GET') fail('Metode tidak didukung.', 405);

$products = array_map('product_row', q(
    "SELECT id, name, brand_id, category_id, sub, price, compare_price, stock, image, description, how_to_use,
            is_active, is_featured, is_flash, rating, reviews, created_at
     FROM products WHERE is_active = 1"
)->fetchAll());

$settings = get_settings();

// kirim versi terkompresi kalau browser mendukung (data produk cukup besar)
if (!ini_get('zlib.output_compression') && str_contains($_SERVER['HTTP_ACCEPT_ENCODING'] ?? '', 'gzip')) {
    ob_start('ob_gzhandler');
}

json_out([
    'ok' => true,
    'format' => 1,
    'settings' => $settings,
    'categories' => q("SELECT id, name, description AS `desc`, icon FROM categories ORDER BY sort_order, name")->fetchAll(),
    'brands' => q("SELECT id, name, COALESCE(logo, '') AS logo FROM brands ORDER BY name")->fetchAll(),
    'promos' => q("SELECT title, subtitle, cta, link, theme FROM promos ORDER BY sort_order, id")->fetchAll(),
    'faqs' => array_map(fn($f) => ['id' => (int) $f['id'], 'q' => $f['question'], 'a' => $f['answer'], 'visible' => true],
        q("SELECT id, question, answer FROM faqs WHERE is_visible = 1 ORDER BY sort_order, id")->fetchAll()),
    'testimonials' => array_map(fn($t) => ['name' => $t['name'], 'city' => $t['city'] ?? '', 'text' => $t['content'], 'rating' => (int) $t['rating'], 'visible' => true],
        q("SELECT name, city, content, rating FROM testimonials WHERE is_visible = 1 ORDER BY created_at DESC LIMIT 12")->fetchAll()),
    'fields' => PRODUCT_FIELDS,
    'products' => $products,
]);
