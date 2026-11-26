<?php
/* =========================================================
   API LOGIN ADMIN
   GET  ?action=me       -> admin yang sedang masuk + token CSRF
   POST ?action=masuk    -> login (email + password)
   POST ?action=keluar   -> logout
   PUT  ?action=password -> ganti password sendiri
   ========================================================= */
require __DIR__ . '/../../core/bootstrap.php';
require_csrf();
$act = action();

if (method() === 'GET' && $act === 'me') ok(['admin' => current_admin(), 'csrf' => csrf_token()]);

if (method() === 'POST' && $act === 'masuk') {
    if (login_blocked('admin')) fail('Terlalu banyak percobaan. Coba lagi 15 menit lagi.', 429);
    $in = body();
    $a = q("SELECT id, password_hash, is_active FROM admins WHERE email = ?", [strtolower(trim((string) ($in['email'] ?? '')))])->fetch();
    if (!$a || !password_verify((string) ($in['password'] ?? ''), $a['password_hash'])) {
        login_failed('admin');
        fail('Email atau password salah.', 401);
    }
    if (!$a['is_active']) fail('Akun admin ini dinonaktifkan.', 403);
    login_cleared('admin');
    session_regenerate_id(true);
    $_SESSION['admin_id'] = (int) $a['id'];
    q("UPDATE admins SET last_login = NOW() WHERE id = ?", [$a['id']]);
    ok(['admin' => current_admin(), 'csrf' => csrf_token()], 'Berhasil masuk.');
}

if (method() === 'POST' && $act === 'keluar') {
    unset($_SESSION['admin_id']);
    session_regenerate_id(true);
    ok(['csrf' => csrf_token()]);
}

if (method() === 'PUT' && $act === 'password') {
    $admin = require_admin();
    $in = body();
    $hash = q("SELECT password_hash FROM admins WHERE id = ?", [$admin['id']])->fetchColumn();
    if (!password_verify((string) ($in['old'] ?? ''), $hash)) fail('Password lama salah.', 422, ['old' => 'Password lama salah.']);
    $d = v()->password('new')->check();
    q("UPDATE admins SET password_hash = ? WHERE id = ?", [password_hash($d['new'], PASSWORD_DEFAULT), $admin['id']]);
    ok([], 'Password diganti.');
}

fail('Aksi tidak dikenal.', 404);
