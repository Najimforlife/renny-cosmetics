-- =========================================================
-- RENNY COSMETICS — STRUKTUR DATABASE (MySQL / MariaDB)
-- Dijalankan otomatis oleh install.php.
-- Bisa juga di-import manual lewat phpMyAdmin.
-- =========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------- Akun admin / staf toko ----------
CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('owner','staf') NOT NULL DEFAULT 'staf',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  last_login    DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Akun pembeli ----------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  phone         VARCHAR(20)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_itk        TINYINT(1)   NOT NULL DEFAULT 0,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Alamat pembeli ----------
CREATE TABLE IF NOT EXISTS addresses (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  label       VARCHAR(30)  NOT NULL,
  recipient   VARCHAR(80)  NOT NULL,
  phone       VARCHAR(20)  NOT NULL,
  address     VARCHAR(300) NOT NULL,
  city        VARCHAR(60)  NOT NULL,
  postal_code VARCHAR(10)  NULL,
  is_default  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_addr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_addr_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Kategori & brand ----------
CREATE TABLE IF NOT EXISTS categories (
  id          VARCHAR(40)  PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  icon        VARCHAR(20)  NOT NULL DEFAULT 'lainnya',
  sort_order  INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS brands (
  id    VARCHAR(80)  PRIMARY KEY,
  name  VARCHAR(80)  NOT NULL UNIQUE,
  logo  VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Produk (id = kode barang di iPOS) ----------
CREATE TABLE IF NOT EXISTS products (
  id            VARCHAR(60)  PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  brand_id      VARCHAR(80)  NOT NULL,
  category_id   VARCHAR(40)  NOT NULL,
  sub           VARCHAR(60)  NOT NULL DEFAULT '',
  price         INT UNSIGNED NOT NULL,
  compare_price INT UNSIGNED NOT NULL DEFAULT 0,
  stock         INT          NULL COMMENT 'NULL = stok tidak dilacak, dikonfirmasi via WhatsApp',
  image         VARCHAR(255) NULL,
  description   TEXT         NULL,
  how_to_use    TEXT         NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  is_featured   TINYINT(1)   NOT NULL DEFAULT 0,
  is_flash      TINYINT(1)   NOT NULL DEFAULT 0,
  rating        DECIMAL(2,1) NOT NULL DEFAULT 0,
  reviews       INT UNSIGNED NOT NULL DEFAULT 0,
  created_at    DATE         NOT NULL,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_prod_brand FOREIGN KEY (brand_id)    REFERENCES brands(id)     ON UPDATE CASCADE,
  CONSTRAINT fk_prod_cat   FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE,
  INDEX idx_prod_cat (category_id),
  INDEX idx_prod_brand (brand_id),
  INDEX idx_prod_active (is_active, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Pesanan ----------
CREATE TABLE IF NOT EXISTS orders (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(20)  NOT NULL UNIQUE,
  user_id       INT UNSIGNED NULL,
  customer_name VARCHAR(80)  NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  method        ENUM('ambil','kirim') NOT NULL,
  address       VARCHAR(400) NULL,
  note          VARCHAR(300) NULL,
  itk_claim     TINYINT(1)   NOT NULL DEFAULT 0,
  subtotal      INT UNSIGNED NOT NULL,
  status        ENUM('baru','dikonfirmasi','dikemas','dikirim','selesai','dibatalkan') NOT NULL DEFAULT 'baru',
  admin_note    VARCHAR(300) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id     INT UNSIGNED NOT NULL,
  product_id   VARCHAR(60)  NULL,
  product_name VARCHAR(200) NOT NULL,
  brand_name   VARCHAR(80)  NOT NULL,
  price        INT UNSIGNED NOT NULL,
  qty          INT UNSIGNED NOT NULL,
  CONSTRAINT fk_item_order   FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Konten toko ----------
CREATE TABLE IF NOT EXISTS promos (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(80)  NOT NULL,
  subtitle   VARCHAR(200) NOT NULL DEFAULT '',
  cta        VARCHAR(40)  NOT NULL DEFAULT 'Lihat',
  link       VARCHAR(255) NOT NULL DEFAULT '#/produk',
  theme      VARCHAR(10)  NOT NULL DEFAULT 'soft',
  sort_order INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faqs (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question   VARCHAR(200) NOT NULL,
  answer     TEXT         NOT NULL,
  is_visible TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS testimonials (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(80)  NOT NULL,
  city       VARCHAR(60)  NULL,
  content    VARCHAR(600) NOT NULL,
  rating     TINYINT      NOT NULL DEFAULT 5,
  is_visible TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Pengaturan toko (kunci - nilai) ----------
CREATE TABLE IF NOT EXISTS settings (
  `key`   VARCHAR(40) PRIMARY KEY,
  `value` TEXT        NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Catatan percobaan login (pembatas brute force) ----------
CREATE TABLE IF NOT EXISTS login_attempts (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ip         VARCHAR(45) NOT NULL,
  kind       VARCHAR(10) NOT NULL,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_attempt (ip, kind, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
