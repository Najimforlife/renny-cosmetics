<?php
/* =========================================================
   API ALAMAT PEMBELI (CRUD)
   GET            -> daftar alamat milik pembeli
   POST           -> tambah alamat
   PUT    ?id=..  -> ubah alamat
   DELETE ?id=..  -> hapus alamat
   ========================================================= */
require __DIR__ . '/../../core/bootstrap.php';
require_csrf();
$user = require_user();
$uid = (int) $user['id'];

function list_addresses(int $uid): array
{
    return q("SELECT id, label, recipient, phone, address, city, postal_code, is_default FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id", [$uid])->fetchAll();
}

function address_input(): array
{
    return v()->text('label', 'Label', 30)->text('recipient', 'Nama penerima', 80, true, 2)->phone('phone')
        ->text('address', 'Alamat lengkap', 300, true, 10)->text('city', 'Kota/kecamatan', 60)->text('postal_code', 'Kode pos', 10, false)
        ->bool('is_default')->check();
}

$id = (int) ($_GET['id'] ?? 0);

switch (method()) {
    case 'GET':
        ok(['addresses' => list_addresses($uid)]);

    case 'POST':
        $d = address_input();
        $count = (int) q("SELECT COUNT(*) FROM addresses WHERE user_id = ?", [$uid])->fetchColumn();
        if ($count >= 10) fail('Maksimal 10 alamat.');
        if ($count === 0) $d['is_default'] = 1;
        if ($d['is_default']) q("UPDATE addresses SET is_default = 0 WHERE user_id = ?", [$uid]);
        q("INSERT INTO addresses (user_id, label, recipient, phone, address, city, postal_code, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [$uid, $d['label'], $d['recipient'], $d['phone'], $d['address'], $d['city'], $d['postal_code'] ?: null, $d['is_default']]);
        ok(['addresses' => list_addresses($uid)], 'Alamat ditambahkan.');

    case 'PUT':
        $own = q("SELECT is_default FROM addresses WHERE id = ? AND user_id = ?", [$id, $uid])->fetch();
        if (!$own) fail('Alamat tidak ditemukan.', 404);
        $d = address_input();
        if ($d['is_default']) q("UPDATE addresses SET is_default = 0 WHERE user_id = ?", [$uid]);
        elseif ($own['is_default']) $d['is_default'] = 1; // harus selalu ada 1 alamat utama
        q("UPDATE addresses SET label = ?, recipient = ?, phone = ?, address = ?, city = ?, postal_code = ?, is_default = ? WHERE id = ? AND user_id = ?",
            [$d['label'], $d['recipient'], $d['phone'], $d['address'], $d['city'], $d['postal_code'] ?: null, $d['is_default'], $id, $uid]);
        ok(['addresses' => list_addresses($uid)], 'Alamat disimpan.');

    case 'DELETE':
        $own = q("SELECT is_default FROM addresses WHERE id = ? AND user_id = ?", [$id, $uid])->fetch();
        if (!$own) fail('Alamat tidak ditemukan.', 404);
        q("DELETE FROM addresses WHERE id = ? AND user_id = ?", [$id, $uid]);
        if ($own['is_default']) q("UPDATE addresses SET is_default = 1 WHERE user_id = ? ORDER BY id LIMIT 1", [$uid]);
        ok(['addresses' => list_addresses($uid)], 'Alamat dihapus.');
}
fail('Metode tidak didukung.', 405);
