<?php
/* =========================================================
   API PRODUK (CRUD admin)
   GET               -> semua produk (aktif & nonaktif)
   POST              -> tambah produk
   PUT    ?id=..     -> ubah produk
   DELETE ?id=..     -> hapus produk
   POST   ?action=massal {ids, op} -> aktifkan / nonaktifkan / unggulan / hapus banyak sekaligus
   ========================================================= */
require __DIR__ . '/_admin.php';

const PRODUCT_SELECT = "SELECT id, name, brand_id, category_id, sub, price, compare_price, stock, image, description, how_to_use,
                               is_active, is_featured, is_flash, rating, reviews, created_at FROM products";

function product_input(bool $isNew): array
{
    $in = body();
    $val = v($in)->text('name', 'Nama produk', 200, true, 2)->text('brand', 'Brand', 80)->text('cat', 'Kategori', 40)->text('sub', 'Jenis', 60, false)
        ->int('price', 'Harga', 1, 100000000)->int('compare', 'Harga coret', 0, 100000000, true)->int('stock', 'Stok', 0, 1000000, true)
        ->text('img', 'Foto', 255, false)->longtext('desc', 'Deskripsi', 5000)->longtext('howto', 'Cara pakai', 3000)
        ->bool('active')->bool('featured')->bool('flash');
    if ($isNew) $val->text('id', 'Kode barang', 60, true, 2);
    $d = $val->check();
    $d['compare'] = (int) ($d['compare'] ?? 0);
    $err = [];
    if ($isNew && !preg_match('/^[\w.\-]+$/', $d['id'])) $err['id'] = 'Kode hanya boleh huruf, angka, titik, strip, garis bawah.';
    if ($d['compare'] && $d['compare'] <= $d['price']) $err['compare'] = 'Harga coret harus lebih besar dari harga jual.';
    if ($d['flash'] && $d['compare'] <= $d['price']) $err['compare'] = 'Produk flash sale wajib punya harga coret.';
    if (!q("SELECT 1 FROM categories WHERE id = ?", [$d['cat']])->fetchColumn()) $err['cat'] = 'Kategori tidak ditemukan.';
    $rating = round((float) ($in['rating'] ?? 0), 1);
    $reviews = (int) ($in['reviews'] ?? 0);
    if ($rating < 0 || $rating > 5) $err['rating'] = 'Rating antara 0 sampai 5.';
    if ($rating > 0 && $reviews < 1) $err['reviews'] = 'Isi jumlah ulasan kalau mengisi rating.';
    if ($d['img'] !== '' && !preg_match('#^(uploads/|assets/|https?://)#', $d['img'])) $err['img'] = 'Link foto harus diawali uploads/, assets/, atau https://';
    if ($err) fail('Periksa lagi isian yang ditandai merah.', 422, $err);

    // brand diketik bebas: pakai yang sudah ada, atau buat brand baru
    $brandId = q("SELECT id FROM brands WHERE name = ?", [$d['brand']])->fetchColumn();
    if (!$brandId) {
        $brandId = unique_id('brands', slugify($d['brand']) ?: 'brand');
        q("INSERT INTO brands (id, name) VALUES (?, ?)", [$brandId, $d['brand']]);
    }
    $d['brand_id'] = $brandId;
    $d['rating'] = $rating;
    $d['reviews'] = $rating > 0 ? $reviews : 0;
    return $d;
}

function product_out(string $id): array
{
    return product_row(q(PRODUCT_SELECT . " WHERE id = ?", [$id])->fetch());
}

$id = (string) ($_GET['id'] ?? '');

if (method() === 'GET') {
    ok(['fields' => PRODUCT_FIELDS, 'products' => array_map('product_row', q(PRODUCT_SELECT)->fetchAll())]);
}

if (method() === 'POST' && action() === 'massal') {
    $in = body();
    $ids = array_values(array_filter(array_map('strval', (array) ($in['ids'] ?? []))));
    if (!$ids || count($ids) > 1000) fail('Pilih 1 sampai 1000 produk.');
    $ph = implode(',', array_fill(0, count($ids), '?'));
    $sql = match ($in['op'] ?? '') {
        'aktif' => "UPDATE products SET is_active = 1 WHERE id IN ($ph)",
        'nonaktif' => "UPDATE products SET is_active = 0 WHERE id IN ($ph)",
        'unggulan' => "UPDATE products SET is_featured = 1 WHERE id IN ($ph)",
        'bukan-unggulan' => "UPDATE products SET is_featured = 0 WHERE id IN ($ph)",
        'hapus' => "DELETE FROM products WHERE id IN ($ph)",
        default => fail('Aksi tidak dikenal.'),
    };
    $n = q($sql, $ids)->rowCount();
    ok(['affected' => $n], "$n produk diperbarui.");
}

if (method() === 'POST') {
    $d = product_input(true);
    if (q("SELECT 1 FROM products WHERE id = ?", [$d['id']])->fetchColumn()) fail('Kode ini sudah dipakai produk lain.', 422, ['id' => 'Kode ini sudah dipakai produk lain.']);
    q("INSERT INTO products (id, name, brand_id, category_id, sub, price, compare_price, stock, image, description, how_to_use, is_active, is_featured, is_flash, rating, reviews, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())",
        [$d['id'], $d['name'], $d['brand_id'], $d['cat'], $d['sub'], $d['price'], $d['compare'], $d['stock'], $d['img'] ?: null, $d['desc'] ?: null, $d['howto'] ?: null,
         $d['active'], $d['featured'], $d['flash'], $d['rating'], $d['reviews']]);
    ok(['product' => product_out($d['id'])], 'Produk ditambahkan.');
}

if (method() === 'PUT') {
    if (!q("SELECT 1 FROM products WHERE id = ?", [$id])->fetchColumn()) fail('Produk tidak ditemukan.', 404);
    $d = product_input(false);
    q("UPDATE products SET name = ?, brand_id = ?, category_id = ?, sub = ?, price = ?, compare_price = ?, stock = ?, image = ?, description = ?, how_to_use = ?,
              is_active = ?, is_featured = ?, is_flash = ?, rating = ?, reviews = ? WHERE id = ?",
        [$d['name'], $d['brand_id'], $d['cat'], $d['sub'], $d['price'], $d['compare'], $d['stock'], $d['img'] ?: null, $d['desc'] ?: null, $d['howto'] ?: null,
         $d['active'], $d['featured'], $d['flash'], $d['rating'], $d['reviews'], $id]);
    ok(['product' => product_out($id)], 'Perubahan disimpan.');
}

if (method() === 'DELETE') {
    if (!q("DELETE FROM products WHERE id = ?", [$id])->rowCount()) fail('Produk tidak ditemukan.', 404);
    ok([], 'Produk dihapus.');
}

fail('Metode tidak didukung.', 405);
