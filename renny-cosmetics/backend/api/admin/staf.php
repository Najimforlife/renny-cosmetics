<?php
/* =========================================================
   API AKUN STAF ADMIN (CRUD, khusus owner)
   GET / POST / PUT ?id / DELETE ?id
   ========================================================= */
require __DIR__ . '/_admin.php';
$me = require_admin('owner');
$id = (int) ($_GET['id'] ?? 0);

function all_staff(): array
{
    return q("SELECT id, name, email, role, is_active, last_login, created_at FROM admins ORDER BY role = 'owner' DESC, name")->fetchAll();
}

function owners_left(int $exceptId): int
{
    return (int) q("SELECT COUNT(*) FROM admins WHERE role = 'owner' AND is_active = 1 AND id <> ?", [$exceptId])->fetchColumn();
}

if (method() === 'GET') ok(['staff' => all_staff()]);

if (method() === 'POST') {
    $d = v()->text('name', 'Nama', 80, true, 2)->email('email')->password('password')->text('role', 'Peran', 10)->check();
    $role = $d['role'] === 'owner' ? 'owner' : 'staf';
    if (q("SELECT 1 FROM admins WHERE email = ?", [$d['email']])->fetchColumn()) fail('Email sudah dipakai.', 422, ['email' => 'Email sudah dipakai.']);
    q("INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, ?)", [$d['name'], $d['email'], password_hash($d['password'], PASSWORD_DEFAULT), $role]);
    ok(['staff' => all_staff()], 'Akun staf dibuat.');
}

if (method() === 'PUT') {
    $cur = q("SELECT role FROM admins WHERE id = ?", [$id])->fetch();
    if (!$cur) fail('Akun tidak ditemukan.', 404);
    $d = v()->text('name', 'Nama', 80, true, 2)->email('email')->text('role', 'Peran', 10)->bool('is_active')->password('password', false)->check();
    $role = $d['role'] === 'owner' ? 'owner' : 'staf';
    if (q("SELECT 1 FROM admins WHERE email = ? AND id <> ?", [$d['email'], $id])->fetchColumn()) fail('Email sudah dipakai.', 422, ['email' => 'Email sudah dipakai.']);
    if ($cur['role'] === 'owner' && ($role !== 'owner' || !$d['is_active']) && owners_left($id) === 0) fail('Harus ada minimal 1 owner aktif.', 409);
    q("UPDATE admins SET name = ?, email = ?, role = ?, is_active = ? WHERE id = ?", [$d['name'], $d['email'], $role, $d['is_active'], $id]);
    if ($d['password'] !== '') q("UPDATE admins SET password_hash = ? WHERE id = ?", [password_hash($d['password'], PASSWORD_DEFAULT), $id]);
    ok(['staff' => all_staff()], 'Akun staf disimpan.');
}

if (method() === 'DELETE') {
    if ($id === (int) $me['id']) fail('Tidak bisa menghapus akun sendiri.', 409);
    $cur = q("SELECT role FROM admins WHERE id = ?", [$id])->fetch();
    if (!$cur) fail('Akun tidak ditemukan.', 404);
    if ($cur['role'] === 'owner' && owners_left($id) === 0) fail('Harus ada minimal 1 owner aktif.', 409);
    q("DELETE FROM admins WHERE id = ?", [$id]);
    ok(['staff' => all_staff()], 'Akun staf dihapus.');
}

fail('Metode tidak didukung.', 405);
