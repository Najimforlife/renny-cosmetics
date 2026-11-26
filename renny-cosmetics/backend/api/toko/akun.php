<?php
/* =========================================================
   API AKUN PEMBELI
   GET    ?action=me        -> data akun yang sedang masuk + token CSRF
   POST   ?action=daftar    -> buat akun (Create)
   POST   ?action=masuk     -> login
   POST   ?action=keluar    -> logout
   PUT    ?action=profil    -> ubah profil (Update)
   PUT    ?action=password  -> ganti password
   DELETE ?action=hapus     -> hapus akun (Delete)
   ========================================================= */
require __DIR__ . '/../../core/bootstrap.php';
require_csrf();

$act = action();

if (method() === 'GET' && $act === 'me') {
    ok(['user' => current_user(), 'csrf' => csrf_token()]);
}

if (method() === 'POST' && $act === 'daftar') {
    $d = v()->text('name', 'Nama', 80, true, 2)->email('email')->phone('phone')->password('password')->bool('is_itk')->check();
    if (q("SELECT 1 FROM users WHERE email = ?", [$d['email']])->fetchColumn()) {
        fail('Email ini sudah terdaftar. Silakan masuk.', 422, ['email' => 'Email sudah terdaftar.']);
    }
    q("INSERT INTO users (name, email, phone, password_hash, is_itk) VALUES (?, ?, ?, ?, ?)",
        [$d['name'], $d['email'], $d['phone'], password_hash($d['password'], PASSWORD_DEFAULT), $d['is_itk']]);
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) db()->lastInsertId();
    ok(['user' => current_user(), 'csrf' => csrf_token()], 'Akun berhasil dibuat.');
}

if (method() === 'POST' && $act === 'masuk') {
    if (login_blocked('user')) fail('Terlalu banyak percobaan masuk. Coba lagi 15 menit lagi.', 429);
    $in = body();
    $email = strtolower(trim((string) ($in['email'] ?? '')));
    $u = q("SELECT id, password_hash, is_active FROM users WHERE email = ?", [$email])->fetch();
    if (!$u || !password_verify((string) ($in['password'] ?? ''), $u['password_hash'])) {
        login_failed('user');
        fail('Email atau password salah.', 401);
    }
    if (!$u['is_active']) fail('Akun ini dinonaktifkan. Hubungi admin toko.', 403);
    login_cleared('user');
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $u['id'];
    ok(['user' => current_user(), 'csrf' => csrf_token()], 'Berhasil masuk.');
}

if (method() === 'POST' && $act === 'keluar') {
    unset($_SESSION['user_id']);
    session_regenerate_id(true);
    ok(['csrf' => csrf_token()], 'Kamu sudah keluar.');
}

$user = require_user();

if (method() === 'PUT' && $act === 'profil') {
    $d = v()->text('name', 'Nama', 80, true, 2)->email('email')->phone('phone')->bool('is_itk')->check();
    if (q("SELECT 1 FROM users WHERE email = ? AND id <> ?", [$d['email'], $user['id']])->fetchColumn()) {
        fail('Email sudah dipakai akun lain.', 422, ['email' => 'Email sudah dipakai akun lain.']);
    }
    q("UPDATE users SET name = ?, email = ?, phone = ?, is_itk = ? WHERE id = ?", [$d['name'], $d['email'], $d['phone'], $d['is_itk'], $user['id']]);
    ok(['user' => current_user()], 'Profil disimpan.');
}

if (method() === 'PUT' && $act === 'password') {
    $in = body();
    $hash = q("SELECT password_hash FROM users WHERE id = ?", [$user['id']])->fetchColumn();
    if (!password_verify((string) ($in['old'] ?? ''), $hash)) fail('Password lama salah.', 422, ['old' => 'Password lama salah.']);
    $d = v()->password('new')->check();
    q("UPDATE users SET password_hash = ? WHERE id = ?", [password_hash($d['new'], PASSWORD_DEFAULT), $user['id']]);
    ok([], 'Password diganti.');
}

if (method() === 'DELETE' && $act === 'hapus') {
    $in = body();
    $hash = q("SELECT password_hash FROM users WHERE id = ?", [$user['id']])->fetchColumn();
    if (!password_verify((string) ($in['password'] ?? ''), $hash)) fail('Password salah.', 422, ['password' => 'Password salah.']);
    q("DELETE FROM users WHERE id = ?", [$user['id']]); // alamat ikut terhapus, riwayat pesanan tetap ada untuk toko
    unset($_SESSION['user_id']);
    session_regenerate_id(true);
    ok(['csrf' => csrf_token()], 'Akun kamu sudah dihapus.');
}

fail('Aksi tidak dikenal.', 404);
