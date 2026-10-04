-- ============================================================
-- DATABASE: db_kasir_coffee
-- Jalankan file ini di HeidiSQL / phpMyAdmin (Laragon)
-- ============================================================

CREATE DATABASE IF NOT EXISTS db_kasir_coffee
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE db_kasir_coffee;

-- ------------------------------------------------------------
-- TABEL USERS (admin & kasir)
-- ------------------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'kasir') NOT NULL DEFAULT 'kasir',
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  status ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- PENTING: akun admin & kasir TIDAK dibuat lewat SQL ini, karena
-- password wajib di-hash dengan bcrypt (bukan plain text).
-- Setelah tabel dibuat, jalankan:
--     node database/seed-users.js
-- Script itu akan membuat 2 akun otomatis dengan password ter-hash:
--   admin / admin   (role: admin)
--   kasir / kasir   (role: kasir)

-- ------------------------------------------------------------
-- TABEL CATEGORIES (kategori menu coffee shop)
-- ------------------------------------------------------------
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(30) NOT NULL DEFAULT 'cup',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO categories (name, icon) VALUES
('Coffee', 'coffee-hot'),
('Non-Coffee', 'cup'),
('Pastry', 'croissant'),
('Snack', 'snack');

-- ------------------------------------------------------------
-- TABEL PRODUCTS (menu coffee shop)
-- kolom "icon" dipakai untuk memilih ilustrasi SVG bawaan
-- (bukan file foto), supaya tiap menu tetap punya gambar.
-- ------------------------------------------------------------
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category_id INT NOT NULL,
  price INT NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  description VARCHAR(255) DEFAULT NULL,
  icon VARCHAR(30) NOT NULL DEFAULT 'cup',
  status ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

INSERT INTO products (name, category_id, price, stock, description, icon) VALUES
('Espresso', 1, 15000, 40, 'Espresso shot murni, pekat dan kuat', 'coffee-hot'),
('Americano', 1, 18000, 40, 'Espresso dengan campuran air panas', 'coffee-hot'),
('Cappuccino', 1, 22000, 35, 'Espresso, susu, dan foam lembut', 'coffee-hot'),
('Cafe Latte', 1, 22000, 35, 'Espresso dengan susu creamy', 'coffee-hot'),
('Caramel Macchiato', 1, 25000, 30, 'Latte dengan saus karamel', 'coffee-hot'),
('Es Kopi Susu Gula Aren', 1, 20000, 30, 'Kopi susu khas dengan gula aren', 'coffee-cold'),
('Matcha Latte', 2, 23000, 25, 'Matcha premium dengan susu', 'cup'),
('Chocolate', 2, 20000, 25, 'Cokelat panas/dingin creamy', 'cup'),
('Lemon Tea', 2, 15000, 30, 'Teh segar dengan perasan lemon', 'cup'),
('Croissant Butter', 3, 18000, 20, 'Croissant renyah dengan mentega', 'croissant'),
('Cheesecake Slice', 3, 28000, 15, 'Cheesecake lembut satu slice', 'croissant'),
('Chocolate Muffin', 3, 17000, 20, 'Muffin cokelat lembut', 'croissant'),
('French Fries', 4, 18000, 25, 'Kentang goreng renyah', 'snack'),
('Chicken Wings', 4, 25000, 20, 'Sayap ayam goreng bumbu', 'snack');

-- ------------------------------------------------------------
-- TABEL MEMBERS
-- ------------------------------------------------------------
CREATE TABLE members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  address VARCHAR(255) DEFAULT NULL,
  status ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO members (member_code, name, phone, address) VALUES
('MBR001', 'Budi Santoso', '08123456789', 'Jl. Melati No. 5'),
('MBR002', 'Sinta Ayu', '08129876543', 'Jl. Kenanga No. 12');

-- ------------------------------------------------------------
-- TABEL TRANSACTIONS
-- ------------------------------------------------------------
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(30) NOT NULL UNIQUE,
  cashier_id INT NOT NULL,
  member_id INT DEFAULT NULL,
  subtotal INT NOT NULL,
  discount INT NOT NULL DEFAULT 0,
  total INT NOT NULL,
  payment_method ENUM('cash', 'qris', 'debit', 'ewallet') NOT NULL DEFAULT 'cash',
  paid_amount INT NOT NULL DEFAULT 0,
  change_amount INT NOT NULL DEFAULT 0,
  status ENUM('paid') NOT NULL DEFAULT 'paid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cashier_id) REFERENCES users(id),
  FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABEL TRANSACTION_ITEMS
-- ------------------------------------------------------------
CREATE TABLE transaction_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  unit_price INT NOT NULL,
  subtotal INT NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;
