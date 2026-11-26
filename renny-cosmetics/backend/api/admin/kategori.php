<?php
/* =========================================================
   API KATEGORI (CRUD admin)
   GET / POST / PUT ?id / DELETE ?id
   POST ?action=urut {ids} -> simpan urutan menu
   ========================================================= */
require __DIR__ . '/_admin.php';

const ICONS = ['skincare', 'makeup', 'tubuh', 'rambut', 'parfum', 'kuku', 'aksesoris', 'lainnya'];

function all_categories(): array
{
    return q("SELECT c.id, c.name, c.description AS `desc`, c.icon, COUNT(p.id) AS count
              FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id ORDER BY c.sort_order, c.name")->fetchAll();
}

function category_input(): array
{
    $d = v()->text('name', 'Nama kategori', 60, true, 2)->text('desc', 'Deskripsi', 255, false)->text('icon', 'Ikon', 20, false)->check();
    if (!in_array($d['icon'], ICONS, true)) $d['icon'] = 'lainnya';
    return $d;
}

$id = (string) ($_GET['id'] ?? '');

if (method() === 'GET') ok(['categories' => all_categories()]);

if (method() === 'POST' && action() === 'urut') {
    foreach (array_values((array) (body()['ids'] ?? [])) as $i => $cid) q("UPDATE categories SET sort_order = ? WHERE id = ?", [$i, (string) $cid]);
    ok(['categories' => all_categories()], 'Urutan disimpan.');
}

if (method() === 'POST') {
    $d = category_input();
    if (q("SELECT 1 FROM categories WHERE name = ?", [$d['name']])->fetchColumn()) fail('Nama kategori sudah ada.', 422, ['name' => 'Nama kategori sudah ada.']);
    $newId = unique_id('categories', slugify($d['name']));
    $order = (int) q("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories")->fetchColumn();
    q("INSERT INTO categories (id, name, description, icon, sort_order) VALUES (?, ?, ?, ?, ?)", [$newId, $d['name'], $d['desc'] ?: null, $d['icon'], $order]);
    ok(['categories' => all_categories()], 'Kategori ditambahkan.');
}

if (method() === 'PUT') {
    $d = category_input();
    if (q("SELECT 1 FROM categories WHERE name = ? AND id <> ?", [$d['name'], $id])->fetchColumn()) fail('Nama kategori sudah ada.', 422, ['name' => 'Nama kategori sudah ada.']);
    if (!q("UPDATE categories SET name = ?, description = ?, icon = ? WHERE id = ?", [$d['name'], $d['desc'] ?: null, $d['icon'], $id])->rowCount()
        && !q("SELECT 1 FROM categories WHERE id = ?", [$id])->fetchColumn()) fail('Kategori tidak ditemukan.', 404);
    ok(['categories' => all_categories()], 'Kategori disimpan.');
}

if (method() === 'DELETE') {
    $n = (int) q("SELECT COUNT(*) FROM products WHERE category_id = ?", [$id])->fetchColumn();
    if ($n) fail("Kategori masih dipakai $n produk. Pindahkan produknya dulu.", 409);
    q("DELETE FROM categories WHERE id = ?", [$id]);
    ok(['categories' => all_categories()], 'Kategori dihapus.');
}

fail('Metode tidak didukung.', 405);
