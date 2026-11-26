<?php
/* =========================================================
   API PENGGUNA / PEMBELI (CRUD admin)
   GET               -> daftar pembeli (?q= cari, ?hal= halaman)
   GET    ?id=..     -> detail pembeli + alamat + pesanan
   POST              -> buat akun pembeli
   PUT    ?id=..     -> ubah data / nonaktifkan / reset password
   DELETE ?id=..     -> hapus akun (khusus owner)
   ========================================================= */
require __DIR__ . '/_admin.php';

$id = (int) ($_GET['id'] ?? 0);

if (method() === 'GET' && $id) {
    $u = q("SELECT id, name, email, phone, is_itk, is_active, created_at FROM users WHERE id = ?", [$id])->fetch();
    if (!$u) fail('Pembeli tidak ditemukan.', 404);
    $u['addresses'] = q("SELECT label, recipient, phone, address, city, postal_code, is_default FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id", [$id])->fetchAll();
    $u['orders'] = q("SELECT code, subtotal, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20", [$id])->fetchAll();
    ok(['user' => $u]);
}

if (method() === 'GET') {
    $search = trim((string) ($_GET['q'] ?? ''));
    $page = max(1, (int) ($_GET['hal'] ?? 1));
    $where = '';
    $params = [];
    if ($search !== '') {
        $where = "WHERE u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?";
        $like = '%' . $search . '%';
        $params = [$like, $like, $like];
    }
    $total = (int) q("SELECT COUNT(*) FROM users u $where", $params)->fetchColumn();
    $rows = q("SELECT u.id, u.name, u.email, u.phone, u.is_itk, u.is_active, u.created_at,
                      COUNT(o.id) AS orders, COALESCE(SUM(CASE WHEN o.status = 'selesai' THEN o.subtotal END), 0) AS spent
               FROM users u LEFT JOIN orders o ON o.user_id = u.id $where
               GROUP BY u.id ORDER BY u.created_at DESC LIMIT 25 OFFSET " . (($page - 1) * 25), $params)->fetchAll();
    ok(['users' => $rows, 'total' => $total, 'pages' => max(1, (int) ceil($total / 25))]);
}

if (method() === 'POST') {
    $d = v()->text('name', 'Nama', 80, true, 2)->email('email')->phone('phone')->password('password')->bool('is_itk')->check();
    if (q("SELECT 1 FROM users WHERE email = ?", [$d['email']])->fetchColumn()) fail('Email sudah terdaftar.', 422, ['email' => 'Email sudah terdaftar.']);
    q("INSERT INTO users (name, email, phone, password_hash, is_itk) VALUES (?, ?, ?, ?, ?)",
        [$d['name'], $d['email'], $d['phone'], password_hash($d['password'], PASSWORD_DEFAULT), $d['is_itk']]);
    ok(['id' => (int) db()->lastInsertId()], 'Akun pembeli dibuat.');
}

if (method() === 'PUT') {
    if (!q("SELECT 1 FROM users WHERE id = ?", [$id])->fetchColumn()) fail('Pembeli tidak ditemukan.', 404);
    $d = v()->text('name', 'Nama', 80, true, 2)->email('email')->phone('phone')->bool('is_itk')->bool('is_active')->password('password', false)->check();
    if (q("SELECT 1 FROM users WHERE email = ? AND id <> ?", [$d['email'], $id])->fetchColumn()) fail('Email sudah dipakai akun lain.', 422, ['email' => 'Email sudah dipakai akun lain.']);
    q("UPDATE users SET name = ?, email = ?, phone = ?, is_itk = ?, is_active = ? WHERE id = ?", [$d['name'], $d['email'], $d['phone'], $d['is_itk'], $d['is_active'], $id]);
    if ($d['password'] !== '') q("UPDATE users SET password_hash = ? WHERE id = ?", [password_hash($d['password'], PASSWORD_DEFAULT), $id]);
    ok([], 'Data pembeli disimpan.');
}

if (method() === 'DELETE') {
    require_admin('owner');
    if (!q("DELETE FROM users WHERE id = ?", [$id])->rowCount()) fail('Pembeli tidak ditemukan.', 404);
    ok([], 'Akun pembeli dihapus. Riwayat pesanannya tetap tersimpan.');
}

fail('Metode tidak didukung.', 405);
