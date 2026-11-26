<?php
/* =========================================================
   VALIDASI INPUT
   Kelas Validator + v(): cek teks, email, HP, angka, password. Error dikirim per kolom.
   ========================================================= */
declare(strict_types=1);

final class Validator
{
    public array $errors = [];
    public array $clean = [];

    public function __construct(private array $in) {}

    public function text(string $key, string $label, int $max, bool $required = true, int $min = 0): self
    {
        $v = trim((string) ($this->in[$key] ?? ''));
        $v = preg_replace('/\s+/u', ' ', $v);
        if ($required && $v === '') $this->errors[$key] = "$label wajib diisi.";
        elseif ($v !== '' && mb_strlen($v) < $min) $this->errors[$key] = "$label minimal $min karakter.";
        elseif (mb_strlen($v) > $max) $this->errors[$key] = "$label maksimal $max karakter.";
        $this->clean[$key] = $v;
        return $this;
    }

    public function longtext(string $key, string $label, int $max, bool $required = false): self
    {
        $v = trim(str_replace("\r\n", "\n", (string) ($this->in[$key] ?? '')));
        if ($required && $v === '') $this->errors[$key] = "$label wajib diisi.";
        elseif (mb_strlen($v) > $max) $this->errors[$key] = "$label maksimal $max karakter.";
        $this->clean[$key] = $v;
        return $this;
    }

    public function email(string $key): self
    {
        $v = strtolower(trim((string) ($this->in[$key] ?? '')));
        if ($v === '') $this->errors[$key] = 'Email wajib diisi.';
        elseif (!filter_var($v, FILTER_VALIDATE_EMAIL) || strlen($v) > 120) $this->errors[$key] = 'Format email belum benar.';
        $this->clean[$key] = $v;
        return $this;
    }

    public function phone(string $key, bool $required = true): self
    {
        $digits = preg_replace('/\D/', '', (string) ($this->in[$key] ?? ''));
        if (str_starts_with($digits, '62')) $digits = '0' . substr($digits, 2);
        if ($digits === '' && !$required) {
            $this->clean[$key] = '';
            return $this;
        }
        if (!preg_match('/^08\d{7,12}$/', $digits)) $this->errors[$key] = 'Nomor HP belum benar. Contoh: 081234567890.';
        $this->clean[$key] = $digits;
        return $this;
    }

    public function int(string $key, string $label, int $min, int $max, bool $nullable = false): self
    {
        $raw = $this->in[$key] ?? '';
        if ($nullable && ($raw === '' || $raw === null)) {
            $this->clean[$key] = null;
            return $this;
        }
        if (!is_numeric($raw) || (int) $raw != $raw) $this->errors[$key] = "$label harus angka bulat.";
        elseif ($raw < $min || $raw > $max) $this->errors[$key] = "$label harus antara $min dan $max.";
        $this->clean[$key] = (int) $raw;
        return $this;
    }

    public function bool(string $key): self
    {
        $v = $this->in[$key] ?? false;
        $this->clean[$key] = in_array($v, [true, 1, '1', 'on', 'true'], true) ? 1 : 0;
        return $this;
    }

    public function password(string $key, bool $required = true): self
    {
        $v = (string) ($this->in[$key] ?? '');
        if (!$required && $v === '') {
            $this->clean[$key] = '';
            return $this;
        }
        if (strlen($v) < 8) $this->errors[$key] = 'Password minimal 8 karakter.';
        elseif (!preg_match('/[A-Za-z]/', $v) || !preg_match('/\d/', $v)) $this->errors[$key] = 'Password harus ada huruf dan angka.';
        elseif (strlen($v) > 72) $this->errors[$key] = 'Password maksimal 72 karakter.';
        $this->clean[$key] = $v;
        return $this;
    }

    public function check(): array
    {
        if ($this->errors) fail('Periksa lagi isian yang ditandai merah.', 422, $this->errors);
        return $this->clean;
    }
}

function v(?array $in = null): Validator
{
    return new Validator($in ?? body());
}
