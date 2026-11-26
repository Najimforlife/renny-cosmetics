<?php
/* =========================================================
   KONEKSI DATABASE
   db() = koneksi PDO (dibuat sekali), q() = jalankan query dengan prepared statement.
   Pengaturan koneksi dibaca dari $CONFIG (config.php).
   ========================================================= */
declare(strict_types=1);

function db(): PDO
{
    static $pdo = null;
    global $CONFIG;
    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $CONFIG['db_host'], $CONFIG['db_port'], $CONFIG['db_name']);
        $pdo = new PDO($dsn, $CONFIG['db_user'], $CONFIG['db_pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return $pdo;
}

function q(string $sql, array $params = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}
