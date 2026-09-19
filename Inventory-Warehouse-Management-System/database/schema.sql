CREATE DATABASE IF NOT EXISTS inventory_warehouse_db;
USE inventory_warehouse_db;

CREATE TABLE IF NOT EXISTS categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  address VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouses (
  warehouse_id INT AUTO_INCREMENT PRIMARY KEY,
  warehouse_name VARCHAR(100) NOT NULL,
  location VARCHAR(150) DEFAULT '',
  capacity INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(150) NOT NULL,
  category_id INT NULL,
  supplier_id INT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 0,
  description VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_category FOREIGN KEY (category_id)
    REFERENCES categories(category_id) ON DELETE SET NULL,
  CONSTRAINT fk_product_supplier FOREIGN KEY (supplier_id)
    REFERENCES suppliers(supplier_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  inventory_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_product_warehouse (product_id, warehouse_id),
  CONSTRAINT fk_inventory_product FOREIGN KEY (product_id)
    REFERENCES products(product_id) ON DELETE CASCADE,
  CONSTRAINT fk_inventory_warehouse FOREIGN KEY (warehouse_id)
    REFERENCES warehouses(warehouse_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchase_items (
  purchase_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  supplier_id INT NULL,
  quantity INT NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes VARCHAR(255) DEFAULT '',
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_purchase_product FOREIGN KEY (product_id)
    REFERENCES products(product_id) ON DELETE RESTRICT,
  CONSTRAINT fk_purchase_warehouse FOREIGN KEY (warehouse_id)
    REFERENCES warehouses(warehouse_id) ON DELETE RESTRICT,
  CONSTRAINT fk_purchase_supplier FOREIGN KEY (supplier_id)
    REFERENCES suppliers(supplier_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sale_items (
  sale_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  customer_name VARCHAR(100) DEFAULT '',
  notes VARCHAR(255) DEFAULT '',
  sold_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sale_product FOREIGN KEY (product_id)
    REFERENCES products(product_id) ON DELETE RESTRICT,
  CONSTRAINT fk_sale_warehouse FOREIGN KEY (warehouse_id)
    REFERENCES warehouses(warehouse_id) ON DELETE RESTRICT
);

INSERT INTO categories (category_name, description)
VALUES ('Electronics','Electronic devices'), ('Office Supplies','Office products')
ON DUPLICATE KEY UPDATE category_name=VALUES(category_name);

INSERT INTO suppliers (supplier_name,email,phone,address)
VALUES ('Demo Supplier','supplier@example.com','1234567890','Demo Address')
ON DUPLICATE KEY UPDATE supplier_name=VALUES(supplier_name);
