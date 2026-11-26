<?php
/* =========================================================
   API KONTEN TOKO (CRUD admin)
   ?jenis=promo | faq | testimoni
   GET / POST / PUT ?id / DELETE ?id
   POST ?action=urut {ids}  (promo & faq)
   ========================================================= */
require __DIR__ . '/_admin.php';

$jenis = (string) ($_GET['jenis'] ?? '');
$id = (int) ($_GET['id'] ?? 0);
const THEMES = ['soft', 'deep', 'pink', 'gold', 'dark'];

$cfg = match ($jenis) {
    'promo' => ['table' => 'promos', 'order' => 'sort_order, id', 'select' => 'id, title, subtitle, cta, link, theme'],
    'faq' => ['table' => 'faqs', 'order' => 'sort_order, id', 'select' => 'id, question AS q, answer AS a, is_visible AS visible'],
    'testimoni' => ['table' => 'testimonials', 'order' => 'created_at DESC, id DESC', 'select' => 'id, name, city, content AS text, rating, is_visible AS visible'],
    default => fail('Jenis konten tidak dikenal.', 404),
};

function list_items(array $cfg): array
{
    return q("SELECT {$cfg['select']} FROM {$cfg['table']} ORDER BY {$cfg['order']}")->fetchAll();
}

function input_for(string $jenis): array
{
    if ($jenis === 'promo') {
        $d = v()->text('title', 'Judul', 80)->text('subtitle', 'Teks kecil', 200, false)->text('cta', 'Tulisan tombol', 40, false)
            ->text('link', 'Link tombol', 255, false)->text('theme', 'Warna', 10, false)->check();
        if (!in_array($d['theme'], THEMES, true)) $d['theme'] = 'soft';
        if ($d['link'] !== '' && !preg_match('#^(\#|wa$|https?://)#', $d['link'])) fail('Link tombol tidak valid.', 422, ['link' => 'Gunakan link katalog (#/...), "wa", atau https://']);
        return [['title', 'subtitle', 'cta', 'link', 'theme'], [$d['title'], $d['subtitle'], $d['cta'] ?: 'Lihat', $d['link'] ?: '#/produk', $d['theme']]];
    }
    if ($jenis === 'faq') {
        $d = v()->text('q', 'Pertanyaan', 200)->longtext('a', 'Jawaban', 2000, true)->bool('visible')->check();
        return [['question', 'answer', 'is_visible'], [$d['q'], $d['a'], $d['visible']]];
    }
    $d = v()->text('name', 'Nama', 80, true, 2)->text('city', 'Kota', 60, false)->text('text', 'Isi testimoni', 600, true, 10)
        ->int('rating', 'Rating', 1, 5)->bool('visible')->check();
    return [['name', 'city', 'content', 'rating', 'is_visible'], [$d['name'], $d['city'] ?: null, $d['text'], $d['rating'], $d['visible']]];
}

if (method() === 'GET') ok(['items' => list_items($cfg)]);

if (method() === 'POST' && action() === 'urut') {
    if ($jenis === 'testimoni') fail('Testimoni diurutkan otomatis dari yang terbaru.');
    foreach (array_values((array) (body()['ids'] ?? [])) as $i => $rid) q("UPDATE {$cfg['table']} SET sort_order = ? WHERE id = ?", [$i, (int) $rid]);
    ok(['items' => list_items($cfg)], 'Urutan disimpan.');
}

if (method() === 'POST') {
    if ($jenis === 'promo' && (int) q("SELECT COUNT(*) FROM promos")->fetchColumn() >= 6) fail('Maksimal 6 slide banner.');
    [$cols, $vals] = input_for($jenis);
    if ($jenis !== 'testimoni') {
        $cols[] = 'sort_order';
        $vals[] = (int) q("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM {$cfg['table']}")->fetchColumn();
    }
    q("INSERT INTO {$cfg['table']} (" . implode(', ', $cols) . ") VALUES (" . implode(', ', array_fill(0, count($cols), '?')) . ")", $vals);
    ok(['items' => list_items($cfg)], 'Tersimpan.');
}

if (method() === 'PUT') {
    if (!q("SELECT 1 FROM {$cfg['table']} WHERE id = ?", [$id])->fetchColumn()) fail('Data tidak ditemukan.', 404);
    // ubah status tampil saja (tombol cepat)
    if (action() === 'tampil') {
        q("UPDATE {$cfg['table']} SET is_visible = 1 - is_visible WHERE id = ?", [$id]);
        ok(['items' => list_items($cfg)], 'Status tampil diubah.');
    }
    [$cols, $vals] = input_for($jenis);
    q("UPDATE {$cfg['table']} SET " . implode(', ', array_map(fn($c) => "$c = ?", $cols)) . " WHERE id = ?", [...$vals, $id]);
    ok(['items' => list_items($cfg)], 'Tersimpan.');
}

if (method() === 'DELETE') {
    if ($jenis === 'promo' && (int) q("SELECT COUNT(*) FROM promos")->fetchColumn() <= 1) fail('Minimal harus ada 1 slide banner.');
    q("DELETE FROM {$cfg['table']} WHERE id = ?", [$id]);
    ok(['items' => list_items($cfg)], 'Dihapus.');
}

fail('Metode tidak didukung.', 405);
