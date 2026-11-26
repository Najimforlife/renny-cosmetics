<?php
/* =========================================================
   API BRAND (CRUD admin)
   GET / POST / PUT ?id / DELETE ?id
   Logo diupload dulu lewat upload.php, lalu path-nya disimpan di sini.
   ========================================================= */
require __DIR__ . '/_admin.php';

function all_brands(): array
{
    return q("SELECT b.id, b.name, COALESCE(b.logo, '') AS logo, COUNT(p.id) AS count
              FROM brands b LEFT JOIN products p ON p.brand_id = b.id GROUP BY b.id ORDER BY count DESC, b.name")->fetchAll();
}

function brand_input(): array
{
    $d = v()->text('name', 'Nama brand', 80, true, 1)->text('logo', 'Logo', 255, false)->check();
    if ($d['logo'] !== '' && !preg_match('#^(uploads/|assets/|https?://)#', $d['logo'])) fail('Link logo tidak valid.', 422, ['logo' => 'Link logo tidak valid.']);
    return $d;
}

$id = (string) ($_GET['id'] ?? '');

if (method() === 'GET') ok(['brands' => all_brands()]);

if (method() === 'POST') {
    $d = brand_input();
    if (q("SELECT 1 FROM brands WHERE name = ?", [$d['name']])->fetchColumn()) fail('Nama brand sudah ada.', 422, ['name' => 'Nama brand sudah ada.']);
    q("INSERT INTO brands (id, name, logo) VALUES (?, ?, ?)", [unique_id('brands', slugify($d['name']) ?: 'brand'), $d['name'], $d['logo'] ?: null]);
    ok(['brands' => all_brands()], 'Brand ditambahkan.');
}

if (method() === 'PUT') {
    $d = brand_input();
    if (!q("SELECT 1 FROM brands WHERE id = ?", [$id])->fetchColumn()) fail('Brand tidak ditemukan.', 404);
    if (q("SELECT 1 FROM brands WHERE name = ? AND id <> ?", [$d['name'], $id])->fetchColumn()) fail('Nama brand sudah ada.', 422, ['name' => 'Nama brand sudah ada.']);
    q("UPDATE brands SET name = ?, logo = ? WHERE id = ?", [$d['name'], $d['logo'] ?: null, $id]);
    ok(['brands' => all_brands()], 'Brand disimpan.');
}

if (method() === 'DELETE') {
    $n = (int) q("SELECT COUNT(*) FROM products WHERE brand_id = ?", [$id])->fetchColumn();
    if ($n) fail("Brand masih dipakai $n produk.", 409);
    q("DELETE FROM brands WHERE id = ?", [$id]);
    ok(['brands' => all_brands()], 'Brand dihapus.');
}

fail('Metode tidak didukung.', 405);
