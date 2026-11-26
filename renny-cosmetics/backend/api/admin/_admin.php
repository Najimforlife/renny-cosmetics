<?php
/* Dipanggil oleh semua API admin: wajib login admin + token CSRF */
require __DIR__ . '/../../core/bootstrap.php';
require_csrf();
$ADMIN = require_admin();
