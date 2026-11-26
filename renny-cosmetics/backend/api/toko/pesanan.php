<?php
/* =========================================================
   API PESANAN PEMBELI
   GET                       -> riwayat pesanan milik pembeli
   POST                      -> buat pesanan dari keranjang
   PUT ?code=..&action=batal -> batalkan pesanan (hanya status "baru")
   ========================================================= */
require __DIR__ . '/../../core/bootstrap.php';
require_csrf();
$user = require_user();
$uid = (int) $user['id'];

const STATUS_LABEL = [
    'baru' => 'Menunggu konfirmasi', 'dikonfirmasi' => 'Dikonfirmasi', 'dikemas' => 'Sedang dikemas',
    'dikirim' => 'Dikirim / siap diambil', 'selesai' => 'Selesai', 'dibatalkan' => 'Dibatalkan',
];

function my_orders(int $uid): array
{
    $orders = q("SELECT id, code, method, address, note, itk_claim, subtotal, status, admin_note, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50", [$uid])->fetchAll();
    if (!$orders) return [];
    $ids = array_column($orders, 'id');
    $in = implode(',', array_fill(0, count($ids), '?'));
    $items = q("SELECT order_id, product_id, product_name, brand_name, price, qty FROM order_items WHERE order_id IN ($in)", $ids)->fetchAll();
    $by = [];
    foreach ($items as $it) $by[$it['order_id']][] = $it;
    foreach ($orders as &$o) {
        $o['items'] = $by[$o['id']] ?? [];
        $o['status_label'] = STATUS_LABEL[$o['status']];
        unset($o['id']);
    }
    return $orders;
}

if (method() === 'GET') ok(['orders' => my_orders($uid)]);

if (method() === 'POST') {
    $in = body();
    $items = is_array($in['items'] ?? null) ? $in['items'] : [];
    if (!$items || count($items) > 50) fail('Keranjang kosong atau terlalu banyak produk.');
    $method = ($in['method'] ?? '') === 'kirim' ? 'kirim' : 'ambil';
    $note = mb_substr(trim((string) ($in['note'] ?? '')), 0, 300);
    $itk = !empty($in['itk_claim']) ? 1 : 0;

    $address = null;
    if ($method === 'kirim') {
        $a = q("SELECT recipient, phone, address, city, postal_code FROM addresses WHERE id = ? AND user_id = ?", [(int) ($in['address_id'] ?? 0), $uid])->fetch();
        if (!$a) fail('Pilih alamat pengiriman dulu.', 422, ['address_id' => 'Pilih alamat pengiriman.']);
        $address = "{$a['recipient']} ({$a['phone']}), {$a['address']}, {$a['city']}" . ($a['postal_code'] ? " {$a['postal_code']}" : '');
    }

    // harga & stok selalu diambil dari database, bukan dari browser
    $lines = [];
    $subtotal = 0;
    foreach ($items as $it) {
        $pid = (string) ($it['id'] ?? '');
        $qty = (int) ($it['qty'] ?? 0);
        if ($qty < 1 || $qty > 99) fail('Jumlah produk tidak valid.');
        $p = q("SELECT p.id, p.name, p.price, p.stock, b.name AS brand FROM products p JOIN brands b ON b.id = p.brand_id WHERE p.id = ? AND p.is_active = 1", [$pid])->fetch();
        if (!$p) fail('Ada produk di keranjang yang sudah tidak dijual. Hapus dulu dari keranjang.', 409);
        if ($p['stock'] !== null && $qty > (int) $p['stock']) fail("Stok {$p['name']} tinggal {$p['stock']}.", 409);
        $lines[] = [$p['id'], $p['name'], $p['brand'], (int) $p['price'], $qty];
        $subtotal += (int) $p['price'] * $qty;
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $prefix = 'RC-' . date('ymd') . '-';
        $n = (int) q("SELECT COUNT(*) FROM orders WHERE code LIKE ?", [$prefix . '%'])->fetchColumn() + 1;
        do {
            $code = $prefix . str_pad((string) $n++, 3, '0', STR_PAD_LEFT);
        } while (q("SELECT 1 FROM orders WHERE code = ?", [$code])->fetchColumn());

        q("INSERT INTO orders (code, user_id, customer_name, phone, method, address, note, itk_claim, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [$code, $uid, $user['name'], $user['phone'], $method, $address, $note ?: null, $itk, $subtotal]);
        $oid = (int) $pdo->lastInsertId();
        foreach ($lines as [$pid, $name, $brand, $price, $qty]) {
            q("INSERT INTO order_items (order_id, product_id, product_name, brand_name, price, qty) VALUES (?, ?, ?, ?, ?, ?)", [$oid, $pid, $name, $brand, $price, $qty]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    $order = array_values(array_filter(my_orders($uid), fn($o) => $o['code'] === $code))[0];
    ok(['order' => $order], 'Pesanan dibuat.');
}

if (method() === 'PUT' && action() === 'batal') {
    $o = q("SELECT id, status FROM orders WHERE code = ? AND user_id = ?", [(string) ($_GET['code'] ?? ''), $uid])->fetch();
    if (!$o) fail('Pesanan tidak ditemukan.', 404);
    if ($o['status'] !== 'baru') fail('Pesanan yang sudah dikonfirmasi admin tidak bisa dibatalkan sendiri. Hubungi admin lewat WhatsApp.', 409);
    q("UPDATE orders SET status = 'dibatalkan' WHERE id = ?", [$o['id']]);
    ok(['orders' => my_orders($uid)], 'Pesanan dibatalkan.');
}

fail('Metode tidak didukung.', 405);
