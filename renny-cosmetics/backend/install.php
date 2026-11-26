<?php
/* =========================================================
   RENNY COSMETICS — PEMASANG DATABASE
   Buka sekali lewat browser: http://localhost/renny-cosmetics/backend/install.php
   - membuat database & tabel
   - mengisi 13 ribuan produk dari daftar item iPOS (backend/database/seed.json)
   - membuat akun owner pertama
   ========================================================= */
declare(strict_types=1);
$configFile = __DIR__ . '/core/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    exit('File backend/core/config.php belum ada. Salin backend/core/config.example.php menjadi config.php, lalu isi koneksi database.');
}
$CONFIG = require $configFile;
set_time_limit(300);

$step = 'form';
$error = '';
$log = [];

function h(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

function connect(array $c, bool $withDb): PDO
{
    $dsn = sprintf('mysql:host=%s;port=%d;charset=utf8mb4', $c['db_host'], $c['db_port']) . ($withDb ? ';dbname=' . $c['db_name'] : '');
    return new PDO($dsn, $c['db_user'], $c['db_pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
}

// sudah terpasang?
try {
    $pdo = connect($CONFIG, true);
    if ($pdo->query("SHOW TABLES LIKE 'admins'")->fetch() && (int) $pdo->query("SELECT COUNT(*) FROM admins")->fetchColumn() > 0) {
        $step = 'done-before';
    }
} catch (Throwable $e) {
    // database belum ada, lanjut ke form
}

if ($step === 'form' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $name = trim((string) ($_POST['name'] ?? ''));
    $email = strtolower(trim((string) ($_POST['email'] ?? '')));
    $pass = (string) ($_POST['password'] ?? '');
    if (mb_strlen($name) < 2) $error = 'Isi nama owner.';
    elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) $error = 'Format email belum benar.';
    elseif (strlen($pass) < 8 || !preg_match('/[A-Za-z]/', $pass) || !preg_match('/\d/', $pass)) $error = 'Password minimal 8 karakter, ada huruf dan angka.';

    if (!$error) {
        try {
            $root = connect($CONFIG, false);
            $root->exec("CREATE DATABASE IF NOT EXISTS `{$CONFIG['db_name']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo = connect($CONFIG, true);
            $pdo->exec(file_get_contents(__DIR__ . '/database/schema.sql'));
            $log[] = 'Tabel database dibuat.';

            $seed = json_decode(file_get_contents(__DIR__ . '/database/seed.json'), true);
            $pdo->beginTransaction();

            $st = $pdo->prepare("INSERT IGNORE INTO categories (id, name, description, icon, sort_order) VALUES (?, ?, ?, ?, ?)");
            foreach ($seed['categories'] as $i => $c) $st->execute([$c['id'], $c['name'], $c['desc'] ?? null, $c['icon'] ?? 'lainnya', $i]);
            $st = $pdo->prepare("INSERT IGNORE INTO brands (id, name, logo) VALUES (?, ?, ?)");
            foreach ($seed['brands'] as $b) $st->execute([$b['id'], $b['name'], $b['logo'] ?: null]);
            $log[] = count($seed['categories']) . ' kategori dan ' . count($seed['brands']) . ' brand dimasukkan.';

            // produk: [id, name, brand, cat, sub, price, compare, stock, created, img, desc, howto, flags, rating, reviews]
            $rows = $seed['products'];
            foreach (array_chunk($rows, 500) as $chunk) {
                $sql = "INSERT IGNORE INTO products (id, name, brand_id, category_id, sub, price, compare_price, stock, created_at, is_active) VALUES "
                    . implode(',', array_fill(0, count($chunk), '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'));
                $vals = [];
                foreach ($chunk as $p) {
                    $flags = (int) ($p[12] ?? 0);
                    array_push($vals, (string) $p[0], $p[1], $p[2], $p[3], $p[4] ?? '', (int) $p[5], (int) ($p[6] ?? 0), $p[7] ?? null, $p[8] ?: date('Y-m-d'), $flags & 1 ? 0 : 1);
                }
                $pdo->prepare($sql)->execute($vals);
            }
            $log[] = number_format(count($rows), 0, ',', '.') . ' produk dari daftar item iPOS dimasukkan.';

            $st = $pdo->prepare("REPLACE INTO settings (`key`, `value`) VALUES (?, ?)");
            foreach ($seed['settings'] as $k => $v) {
                if ($k === 'pinHash') continue;
                $st->execute([$k, json_encode($v, JSON_UNESCAPED_UNICODE)]);
            }
            if (!(int) $pdo->query("SELECT COUNT(*) FROM promos")->fetchColumn()) {
                $st = $pdo->prepare("INSERT INTO promos (title, subtitle, cta, link, theme, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
                foreach ($seed['promos'] as $i => $p) $st->execute([$p['title'], $p['subtitle'], $p['cta'], $p['link'], $p['theme'], $i]);
            }
            if (!(int) $pdo->query("SELECT COUNT(*) FROM faqs")->fetchColumn()) {
                $st = $pdo->prepare("INSERT INTO faqs (question, answer, is_visible, sort_order) VALUES (?, ?, 1, ?)");
                foreach ($seed['faqs'] as $i => $f) $st->execute([$f['q'], $f['a'], $i]);
            }
            $log[] = 'Pengaturan toko, banner promo, dan FAQ dimasukkan.';

            $pdo->prepare("INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, 'owner')")
                ->execute([$name, $email, password_hash($pass, PASSWORD_DEFAULT)]);
            $log[] = "Akun owner $email dibuat.";
            $pdo->commit();
            $step = 'done';
        } catch (Throwable $e) {
            if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
            $error = str_contains($e->getMessage(), 'Connection refused') || str_contains($e->getMessage(), '2002')
                ? 'MySQL belum menyala. Buka XAMPP Control Panel lalu klik Start di baris MySQL.'
                : 'Gagal memasang: ' . $e->getMessage();
        }
    }
}
?><!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pasang Database | Renny Cosmetics</title>
  <meta name="robots" content="noindex">
  <link rel="icon" type="image/svg+xml" href="../frontend/assets/img/favicon.svg">
  <link rel="stylesheet" href="../frontend/assets/css/style.css">
  <link rel="stylesheet" href="../frontend/assets/css/admin.css">
</head>
<body class="admin">
  <div class="gate">
    <div class="gate-card install-card">
      <img src="../frontend/assets/img/logo.svg" alt="Renny Cosmetics" width="900" height="364">
      <?php if ($step === 'done'): ?>
        <h1>Pemasangan selesai</h1>
        <ul class="install-log"><?php foreach ($log as $l): ?><li><?= h($l) ?></li><?php endforeach; ?></ul>
        <p>Untuk keamanan, hapus file <code>install.php</code> setelah ini.</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="../frontend/admin.html">Masuk ke admin</a>
          <a class="btn btn-ghost" href="../frontend/index.html">Lihat toko</a>
        </div>
      <?php elseif ($step === 'done-before'): ?>
        <h1>Database sudah terpasang</h1>
        <p>Akun admin sudah ada. Kalau ingin memasang ulang dari awal, hapus database <code><?= h($CONFIG['db_name']) ?></code> di phpMyAdmin lalu buka halaman ini lagi.</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="../frontend/admin.html">Masuk ke admin</a>
          <a class="btn btn-ghost" href="../frontend/index.html">Lihat toko</a>
        </div>
      <?php else: ?>
        <h1>Pasang database</h1>
        <p>Database <b><?= h($CONFIG['db_name']) ?></b> akan dibuat di MySQL (<?= h($CONFIG['db_host']) ?>, user <?= h($CONFIG['db_user']) ?>), lalu diisi produk dari daftar item iPOS. Buat akun owner untuk masuk ke admin.</p>
        <?php if ($error): ?><p class="form-error"><?= h($error) ?></p><?php endif; ?>
        <form method="post" class="install-form">
          <div class="field"><label for="name">Nama owner</label><input id="name" name="name" value="<?= h($_POST['name'] ?? 'Reni') ?>" required></div>
          <div class="field"><label for="email">Email login admin</label><input id="email" name="email" type="email" value="<?= h($_POST['email'] ?? '') ?>" required></div>
          <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" minlength="8" required><p class="hint">Minimal 8 karakter, ada huruf dan angka.</p></div>
          <button class="btn btn-primary btn-block" type="submit">Pasang sekarang</button>
        </form>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>
