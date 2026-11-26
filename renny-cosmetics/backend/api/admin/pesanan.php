<?php
/* =========================================================
   API PESANAN (admin)
   GET               -> daftar pesanan (?status=, ?q=, ?hal=)
   GET    ?id=..     -> detail pesanan + item
   PUT    ?id=..     -> ubah status & catatan admin
   DELETE ?id=..     -> hapus pesanan (khusus owner)
   ========================================================= */
require __DIR__ . '/_admin.php';

const STATUSES = ['baru', 'dikonfirmasi', 'dikemas', 'dikirim', 'selesai', 'dibatalkan'];
$id = (int) ($_GET['id'] ?? 0);

if (method() === 'GET' && $id) {
    $o = q("SELECT o.*, u.email FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ?", [$id])->fetch();
    if (!$o) fail('Pesanan tidak ditemukan.', 404);
    $o['items'] = q("SELECT product_id, product_name, brand_name, price, qty FROM order_items WHERE order_id = ?", [$id])->fetchAll();
    ok(['order' => $o]);
}

if (method() === 'GET') {
    $status = (string) ($_GET['status'] ?? '');
    $search = trim((string) ($_GET['q'] ?? ''));
    $page = max(1, (int) ($_GET['hal'] ?? 1));
    $where = [];
    $params = [];
    if (in_array($status, STATUSES, true)) {
        $where[] = 'status = ?';
        $params[] = $status;
    }
    if ($search !== '') {
        $where[] = '(code LIKE ? OR customer_name LIKE ? OR phone LIKE ?)';
        array_push($params, "%$search%", "%$search%", "%$search%");
    }
    $w = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $total = (int) q("SELECT COUNT(*) FROM orders $w", $params)->fetchColumn();
    $rows = q("SELECT o.id, o.code, o.customer_name, o.phone, o.method, o.subtotal, o.status, o.itk_claim, o.created_at,
                      (SELECT SUM(qty) FROM order_items i WHERE i.order_id = o.id) AS items
               FROM orders o $w ORDER BY o.created_at DESC, o.id DESC LIMIT 25 OFFSET " . (($page - 1) * 25), $params)->fetchAll();
    $counts = [];
    foreach (q("SELECT status, COUNT(*) AS n FROM orders GROUP BY status")->fetchAll() as $r) $counts[$r['status']] = (int) $r['n'];
    ok(['orders' => $rows, 'total' => $total, 'pages' => max(1, (int) ceil($total / 25)), 'counts' => $counts]);
}

if (method() === 'PUT') {
    $in = body();
    $status = (string) ($in['status'] ?? '');
    if (!in_array($status, STATUSES, true)) fail('Status tidak valid.', 422, ['status' => 'Status tidak valid.']);
    $note = mb_substr(trim((string) ($in['admin_note'] ?? '')), 0, 300);
    if (!q("SELECT 1 FROM orders WHERE id = ?", [$id])->fetchColumn()) fail('Pesanan tidak ditemukan.', 404);
    q("UPDATE orders SET status = ?, admin_note = ? WHERE id = ?", [$status, $note ?: null, $id]);
    ok([], 'Pesanan diperbarui.');
}

if (method() === 'DELETE') {
    require_admin('owner');
    if (!q("DELETE FROM orders WHERE id = ?", [$id])->rowCount()) fail('Pesanan tidak ditemukan.', 404);
    ok([], 'Pesanan dihapus.');
}

fail('Metode tidak didukung.', 405);
