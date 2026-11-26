<?php
/* =========================================================
   SESI PEMBELI & ADMIN
   current_user / require_user (pembeli), current_admin / require_admin (admin & owner).
   ========================================================= */
declare(strict_types=1);

function current_user(): ?array
{
    $id = $_SESSION['user_id'] ?? null;
    if (!$id) return null;
    $u = q("SELECT id, name, email, phone, is_itk, created_at FROM users WHERE id = ? AND is_active = 1", [$id])->fetch();
    if (!$u) unset($_SESSION['user_id']);
    return $u ?: null;
}

function require_user(): array
{
    $u = current_user();
    if (!$u) fail('Silakan masuk dulu.', 401);
    return $u;
}

function current_admin(): ?array
{
    $id = $_SESSION['admin_id'] ?? null;
    if (!$id) return null;
    $a = q("SELECT id, name, email, role FROM admins WHERE id = ? AND is_active = 1", [$id])->fetch();
    if (!$a) unset($_SESSION['admin_id']);
    return $a ?: null;
}

function require_admin(?string $role = null): array
{
    $a = current_admin();
    if (!$a) fail('Silakan masuk sebagai admin.', 401);
    if ($role && $a['role'] !== $role) fail('Hanya pemilik toko (owner) yang boleh melakukan ini.', 403);
    return $a;
}
