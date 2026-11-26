<?php
/* =========================================================
   KEAMANAN
   Token CSRF dan pembatas percobaan login (5 kali salah per 15 menit).
   ========================================================= */
declare(strict_types=1);

function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}

/** Semua request yang mengubah data wajib membawa header X-CSRF-Token */
function require_csrf(): void
{
    if (method() === 'GET') return;
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!$sent || !hash_equals(csrf_token(), $sent)) fail('Sesi kedaluwarsa. Muat ulang halaman lalu coba lagi.', 419);
}

function client_ip(): string
{
    return substr((string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 45);
}

function login_blocked(string $kind): bool
{
    q("DELETE FROM login_attempts WHERE created_at < (NOW() - INTERVAL 1 DAY)");
    $n = (int) q("SELECT COUNT(*) FROM login_attempts WHERE ip = ? AND kind = ? AND created_at > (NOW() - INTERVAL 15 MINUTE)", [client_ip(), $kind])->fetchColumn();
    return $n >= 5;
}

function login_failed(string $kind): void
{
    q("INSERT INTO login_attempts (ip, kind) VALUES (?, ?)", [client_ip(), $kind]);
}

function login_cleared(string $kind): void
{
    q("DELETE FROM login_attempts WHERE ip = ? AND kind = ?", [client_ip(), $kind]);
}
