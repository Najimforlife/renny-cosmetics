<?php
/* =========================================================
   API iPOS & STOK (admin)
   POST ?action=impor      {brands, products, opsi}  -> tambah/perbarui produk dari daftar item iPOS
   POST ?action=stok       {rows: [[kode, stok], ...]} -> sinkron stok
   POST ?action=reset-stok                             -> semua stok kembali "dikonfirmasi via WA"
   File .exitem dibaca di browser (sql.js), lalu dikirim ke sini sedikit demi sedikit.
   Harga pokok & margin TIDAK pernah dikirim ke server website.
   ========================================================= */
require __DIR__ . '/_admin.php';
if (method() !== 'POST') fail('Metode tidak didukung.', 405);
$in = body();

if (action() === 'impor') {
    $products = (array) ($in['products'] ?? []);
    if (count($products) > 1000) fail('Kirim maksimal 1000 produk per bagian.');
    $opt = (array) ($in['opsi'] ?? []);
    $addNew = !empty($opt['tambah']);
    $updPrice = !empty($opt['harga']);
    $updName = !empty($opt['nama']);

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $brandIns = $pdo->prepare("INSERT IGNORE INTO brands (id, name) VALUES (?, ?)");
        foreach ((array) ($in['brands'] ?? []) as $b) {
            $bid = (string) ($b['id'] ?? '');
            $name = mb_substr(trim((string) ($b['name'] ?? '')), 0, 80);
            if ($bid !== '' && $name !== '' && !q("SELECT 1 FROM brands WHERE name = ? AND id <> ?", [$name, $bid])->fetchColumn()) $brandIns->execute([$bid, $name]);
        }
        $cats = array_column(q("SELECT id FROM categories")->fetchAll(), 'id');
        $added = $updated = 0;
        foreach ($products as $p) {
            $id = mb_substr(trim((string) ($p['id'] ?? '')), 0, 60);
            $name = mb_substr(trim((string) ($p['name'] ?? '')), 0, 200);
            $price = (int) ($p['price'] ?? 0);
            $brand = (string) ($p['brand'] ?? '');
            $cat = in_array($p['cat'] ?? '', $cats, true) ? $p['cat'] : 'lainnya';
            $sub = mb_substr((string) ($p['sub'] ?? ''), 0, 60);
            if ($id === '' || $name === '' || $price < 1 || !q("SELECT 1 FROM brands WHERE id = ?", [$brand])->fetchColumn()) continue;
            $old = q("SELECT price, compare_price FROM products WHERE id = ?", [$id])->fetch();
            if (!$old) {
                if (!$addNew) continue;
                $created = preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) ($p['created'] ?? '')) ? $p['created'] : date('Y-m-d');
                q("INSERT INTO products (id, name, brand_id, category_id, sub, price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [$id, $name, $brand, $cat, $sub, $price, $created]);
                $added++;
                continue;
            }
            $sets = [];
            $vals = [];
            if ($updPrice && (int) $old['price'] !== $price) {
                $sets[] = 'price = ?';
                $vals[] = $price;
                if ((int) $old['compare_price'] <= $price) $sets[] = 'compare_price = 0';
            }
            if ($updName) {
                array_push($sets, 'name = ?', 'brand_id = ?', 'category_id = ?', 'sub = ?');
                array_push($vals, $name, $brand, $cat, $sub);
            }
            if ($sets) {
                $vals[] = $id;
                if (q("UPDATE products SET " . implode(', ', $sets) . " WHERE id = ?", $vals)->rowCount()) $updated++;
            }
        }
        // nonaktifkan produk yang tidak ada lagi di iPOS (dikirim terpisah di bagian terakhir)
        $hidden = 0;
        $hide = array_values(array_filter(array_map('strval', (array) ($in['nonaktifkan'] ?? []))));
        foreach (array_chunk($hide, 500) as $chunk) {
            $hidden += q("UPDATE products SET is_active = 0 WHERE id IN (" . implode(',', array_fill(0, count($chunk), '?')) . ")", $chunk)->rowCount();
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
    ok(['added' => $added, 'updated' => $updated, 'hidden' => $hidden]);
}

if (action() === 'stok') {
    $rows = (array) ($in['rows'] ?? []);
    if (count($rows) > 20000) fail('Data stok terlalu banyak (maksimal 20.000 baris).');
    $st = db()->prepare("UPDATE products SET stock = ? WHERE id = ?");
    $exists = db()->prepare("SELECT 1 FROM products WHERE id = ?");
    $changed = 0;
    $notFound = [];
    db()->beginTransaction();
    foreach ($rows as $r) {
        $code = trim((string) ($r[0] ?? ''));
        $stock = (int) ($r[1] ?? -1);
        if ($code === '' || $stock < 0) continue;
        $exists->execute([$code]);
        if (!$exists->fetchColumn()) {
            $notFound[] = $code;
            continue;
        }
        $st->execute([$stock, $code]);
        $changed++;
    }
    db()->commit();
    ok(['changed' => $changed, 'notFound' => array_slice($notFound, 0, 50), 'notFoundCount' => count($notFound)], "$changed stok diperbarui.");
}

if (action() === 'reset-stok') {
    $n = q("UPDATE products SET stock = NULL WHERE stock IS NOT NULL")->rowCount();
    ok(['changed' => $n], "$n stok dikosongkan.");
}

fail('Aksi tidak dikenal.', 404);
