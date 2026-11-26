<?php
/* =========================================================
   RESPON & REQUEST
   Balasan JSON (json_out, ok, fail) dan pembaca isi request (method, action, body).
   ========================================================= */
declare(strict_types=1);

function json_out(array $data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ok(array $data = [], string $message = ''): never
{
    json_out(['ok' => true, 'message' => $message] + $data);
}

/** Gagal. $errors = ['nama_kolom' => 'pesan'] untuk ditampilkan di form */
function fail(string $message, int $code = 400, array $errors = []): never
{
    json_out(['ok' => false, 'message' => $message, 'errors' => (object) $errors], $code);
}

function method(): string
{
    return $_SERVER['REQUEST_METHOD'] ?? 'GET';
}

function action(): string
{
    return (string) ($_GET['action'] ?? '');
}

/** Isi request (JSON atau form) */
function body(): array
{
    static $data = null;
    if ($data !== null) return $data;
    $raw = file_get_contents('php://input');
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($type, 'application/json')) {
        $data = json_decode($raw ?: '[]', true);
        if (!is_array($data)) fail('Format data tidak valid.');
    } else {
        $data = $_POST;
    }
    return $data;
}
