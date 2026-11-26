<?php
/* =========================================================
   FUNGSI BANTU BERSAMA
   Bentuk data produk, pengaturan toko, slug, dan id unik.
   ========================================================= */
declare(strict_types=1);

const PRODUCT_FIELDS = ['id', 'name', 'brand', 'cat', 'sub', 'price', 'compare', 'stock', 'created', 'img', 'desc', 'howto', 'flags', 'rating', 'reviews'];

function product_row(array $p): array
{
    $flags = ($p['is_active'] ? 0 : 1) | ($p['is_featured'] ? 2 : 0) | ($p['is_flash'] ? 4 : 0);
    return [
        $p['id'], $p['name'], $p['brand_id'], $p['category_id'], $p['sub'], (int) $p['price'], (int) $p['compare_price'],
        $p['stock'] === null ? null : (int) $p['stock'], $p['created_at'], $p['image'] ?? '', $p['description'] ?? '',
        $p['how_to_use'] ?? '', $flags, (float) $p['rating'], (int) $p['reviews'],
    ];
}

function get_settings(): array
{
    $out = [];
    foreach (q("SELECT `key`, `value` FROM settings")->fetchAll() as $r) {
        $out[$r['key']] = json_decode((string) $r['value'], true);
    }
    return $out;
}

function slugify(string $text): string
{
    $t = strtolower(trim($text));
    $t = str_replace(['&', "'"], [' dan ', ''], $t);
    $t = preg_replace('/[^a-z0-9]+/', '-', $t);
    return trim($t, '-');
}

function unique_id(string $table, string $base): string
{
    $id = $base !== '' ? $base : 'item';
    $i = 2;
    while (q("SELECT 1 FROM $table WHERE id = ?", [$id])->fetchColumn()) $id = $base . '-' . $i++;
    return $id;
}
