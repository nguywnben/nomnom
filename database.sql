-- =============================================================================
-- NomNom — Setup (schema + seed data)
-- Import MỘT file này trên DB mới / phpMyAdmin là đủ.
-- mysql -u root -p < setup.sql
-- =============================================================================

-- =============================================================================
-- NomNom — Food Delivery Platform
-- MySQL Schema (InnoDB / utf8mb4)
-- Target: MySQL 8.0+
-- -----------------------------------------------------------------------------
-- Complete relational schema supporting the four modules of NomNom:
--   • Customer  (/app)       — tìm kiếm, giỏ hàng, thanh toán, theo dõi đơn,
--                              đánh giá.
--   • Merchant  (/merchant)  — quản lý thực đơn, xử lý đơn, doanh thu.
--   • Driver    (/driver)    — danh sách đơn, giao hàng, ví thu nhập.
--   • Admin     (/admin)     — duyệt tài khoản, đối soát tài chính.
--
-- The schema contains 24 tables organised into 8 functional sections so the
-- team can split ownership cleanly during development.
--
-- Conventions:
--   • Money values: BIGINT in VND (số nguyên, không có phần thập phân).
--   • Audit columns (created_at, updated_at) on every table.
--   • ENUM for finite status sets — bảo vệ tính toàn vẹn dữ liệu.
--   • FK strategy:
--       CASCADE   — dữ liệu phụ thuộc tuyệt đối (cart_items thuộc carts).
--       RESTRICT  — bảng tài chính (orders, wallets, payouts).
--       SET NULL  — tham chiếu mềm (driver bị xoá nhưng đơn cũ vẫn còn).
--   • Snapshot tên + giá trên order_items để dữ liệu lịch sử bất biến khi
--     thực đơn được chỉnh sửa.
-- =============================================================================

DROP DATABASE IF EXISTS nomnom;
CREATE DATABASE nomnom
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE nomnom;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- SECTION 1 — IDENTITY & ACCESS (4 tables)
-- =============================================================================
-- Một bảng users duy nhất chứa mọi tác nhân con người (khách, chủ nhà hàng,
-- tài xế, admin). Bảng user_roles cho phép một người giữ nhiều vai trò.
-- -----------------------------------------------------------------------------

CREATE TABLE users (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email             VARCHAR(160) NULL UNIQUE,
  phone             VARCHAR(20)  NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  full_name         VARCHAR(120) NOT NULL,
  avatar_url        VARCHAR(500) NULL,
  primary_role      ENUM('customer','merchant','driver','admin') NOT NULL DEFAULT 'customer',
  status            ENUM('pending','active','suspended','banned') NOT NULL DEFAULT 'active',
  email_verified_at DATETIME NULL,
  phone_verified_at DATETIME NULL,
  last_login_at     DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_users_role   (primary_role),
  KEY idx_users_status (status)
) ENGINE=InnoDB;

-- Một user có thể giữ nhiều vai trò (ví dụ: tài xế đồng thời là khách hàng).
CREATE TABLE user_roles (
  user_id    BIGINT UNSIGNED NOT NULL,
  role       ENUM('customer','merchant','driver','admin') NOT NULL,
  granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- OTP cho các luồng đăng ký, đăng nhập và đặt lại mật khẩu (mã đã hash,
-- giới hạn số lần thử).
CREATE TABLE otp_codes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NULL,
  destination VARCHAR(160) NOT NULL,
  channel     ENUM('email','sms') NOT NULL,
  purpose     ENUM('register','login','reset_password') NOT NULL,
  code_hash   VARCHAR(255) NOT NULL,
  attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at  DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_otp_destination (destination),
  CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Refresh token cho cơ chế JWT rotation. Access token là stateless.
CREATE TABLE refresh_tokens (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  user_agent VARCHAR(255) NULL,
  ip_address VARCHAR(45)  NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_refresh_user (user_id),
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- SECTION 2 — CUSTOMER PROFILE & ADDRESSES (2 tables)
-- =============================================================================

CREATE TABLE customer_profiles (
  user_id            BIGINT UNSIGNED NOT NULL,
  default_address_id BIGINT UNSIGNED NULL,
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'vi',
  marketing_opt_in   TINYINT(1)  NOT NULL DEFAULT 1,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_cust_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Mỗi khách có thể lưu nhiều địa chỉ giao hàng ("Nhà", "Công ty"...).
-- Cấu trúc địa lý theo tiếng Việt: line1, ward (phường/xã),
-- district (quận/huyện), city (tỉnh/thành phố).
CREATE TABLE customer_addresses (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id     BIGINT UNSIGNED NOT NULL,
  label           VARCHAR(40)  NOT NULL,
  recipient_name  VARCHAR(120) NOT NULL,
  recipient_phone VARCHAR(20)  NOT NULL,
  line1           VARCHAR(255) NOT NULL,
  ward            VARCHAR(120) NULL,
  district        VARCHAR(120) NULL,
  city            VARCHAR(120) NOT NULL,
  latitude        DECIMAL(10,7) NULL,
  longitude       DECIMAL(10,7) NULL,
  delivery_note   VARCHAR(255) NULL,
  is_default      TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_addr_customer (customer_id),
  CONSTRAINT fk_addr_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE customer_profiles
  ADD CONSTRAINT fk_cust_default_addr FOREIGN KEY (default_address_id)
  REFERENCES customer_addresses(id) ON DELETE SET NULL;

-- =============================================================================
-- SECTION 3 — RESTAURANTS & MENU (4 tables)
-- =============================================================================

CREATE TABLE cuisines (
  id         SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(80) NOT NULL UNIQUE,    -- "Ý", "Nhật", "Mexico"
  slug       VARCHAR(80) NOT NULL UNIQUE,
  icon_url   VARCHAR(500) NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Thực thể nhà hàng. Workflow duyệt: pending → active / rejected / suspended.
-- Tài liệu KYC (giấy phép kinh doanh, VSATTP) được lưu dưới dạng URL ảnh
-- trên Cloudinary; admin xem trực tiếp khi duyệt.
CREATE TABLE restaurants (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id        BIGINT UNSIGNED NOT NULL,
  cuisine_id           SMALLINT UNSIGNED NULL,
  name                 VARCHAR(160) NOT NULL,
  slug                 VARCHAR(180) NOT NULL UNIQUE,
  tagline              VARCHAR(255) NULL,
  description          TEXT NULL,
  phone                VARCHAR(20)  NULL,
  banner_url           VARCHAR(500) NULL,
  logo_url             VARCHAR(500) NULL,
  business_license_url VARCHAR(500) NULL,    -- giấy phép kinh doanh
  food_safety_cert_url VARCHAR(500) NULL,    -- chứng nhận VSATTP
  address_line         VARCHAR(255) NOT NULL,
  ward                 VARCHAR(120) NULL,
  district             VARCHAR(120) NULL,
  city                 VARCHAR(120) NOT NULL,
  latitude             DECIMAL(10,7) NULL,
  longitude            DECIMAL(10,7) NULL,
  base_delivery_fee    BIGINT UNSIGNED NOT NULL DEFAULT 0,   -- VND
  min_order_amount     BIGINT UNSIGNED NOT NULL DEFAULT 0,
  avg_prep_time_min    SMALLINT UNSIGNED NOT NULL DEFAULT 20,
  rating_avg           DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count         INT UNSIGNED NOT NULL DEFAULT 0,
  commission_rate      DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  is_open_now          TINYINT(1) NOT NULL DEFAULT 1,
  status               ENUM('pending','active','suspended','closed') NOT NULL DEFAULT 'pending',
  approved_at          DATETIME NULL,
  approved_by_admin_id BIGINT UNSIGNED NULL,
  rejection_reason     VARCHAR(500) NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_rest_owner  (owner_user_id),
  KEY idx_rest_status (status),
  KEY idx_rest_city   (city),
  CONSTRAINT fk_rest_owner    FOREIGN KEY (owner_user_id)        REFERENCES users(id)    ON DELETE RESTRICT,
  CONSTRAINT fk_rest_cuisine  FOREIGN KEY (cuisine_id)           REFERENCES cuisines(id) ON DELETE SET NULL,
  CONSTRAINT fk_rest_approver FOREIGN KEY (approved_by_admin_id) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE menu_categories (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  restaurant_id BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(120) NOT NULL,
  description   VARCHAR(255) NULL,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mcat_rest (restaurant_id),
  CONSTRAINT fk_mcat_rest FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Món ăn dùng mô hình giá cố định. Khi cần mở rộng (size, topping), có thể
-- bổ sung bảng option_groups + options nối qua menu_items.id.
CREATE TABLE menu_items (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  restaurant_id BIGINT UNSIGNED NOT NULL,
  category_id   BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(160) NOT NULL,
  description   VARCHAR(500) NULL,
  image_url     VARCHAR(500) NULL,
  price         BIGINT UNSIGNED NOT NULL,             -- VND
  prep_time_min SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  in_stock      TINYINT(1) NOT NULL DEFAULT 1,
  is_featured   TINYINT(1) NOT NULL DEFAULT 0,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  total_sold    INT UNSIGNED NOT NULL DEFAULT 0,
  rating_avg    DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  status        ENUM('active','hidden') NOT NULL DEFAULT 'active',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_item_rest     (restaurant_id),
  KEY idx_item_category (category_id),
  KEY idx_item_status   (status),
  CONSTRAINT fk_item_rest FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)     ON DELETE CASCADE,
  CONSTRAINT fk_item_cat  FOREIGN KEY (category_id)   REFERENCES menu_categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =============================================================================
-- SECTION 4 — CART (2 tables)
-- =============================================================================
-- Một khách có duy nhất một giỏ hàng đang hoạt động cho mỗi nhà hàng. Khi
-- khách chuyển sang nhà hàng khác, UI hỏi xác nhận để xoá giỏ cũ.
-- -----------------------------------------------------------------------------

CREATE TABLE carts (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id   BIGINT UNSIGNED NOT NULL,
  restaurant_id BIGINT UNSIGNED NOT NULL,
  status        ENUM('active','converted','abandoned') NOT NULL DEFAULT 'active',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_active (customer_id, restaurant_id, status),
  CONSTRAINT fk_cart_cust FOREIGN KEY (customer_id)   REFERENCES users(id)       ON DELETE CASCADE,
  CONSTRAINT fk_cart_rest FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cart_items (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cart_id      BIGINT UNSIGNED NOT NULL,
  menu_item_id BIGINT UNSIGNED NOT NULL,
  quantity     SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  unit_price   BIGINT UNSIGNED NOT NULL,    -- snapshot giá tại thời điểm thêm
  note         VARCHAR(255) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ci_cart (cart_id),
  CONSTRAINT fk_ci_cart FOREIGN KEY (cart_id)      REFERENCES carts(id)      ON DELETE CASCADE,
  CONSTRAINT fk_ci_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =============================================================================
-- SECTION 5 — DRIVER (1 table)
-- =============================================================================
-- Hồ sơ tài xế (1:1 với users). KYC được lưu dưới dạng URL ảnh; vị trí GPS
-- mới nhất lưu trong cùng bảng để đáp ứng cho màn Tracking của khách hàng
-- thông qua API polling.
-- -----------------------------------------------------------------------------

CREATE TABLE driver_profiles (
  user_id              BIGINT UNSIGNED NOT NULL,
  national_id          VARCHAR(20)  NULL UNIQUE,    -- CCCD
  driver_license_no    VARCHAR(40)  NULL,
  vehicle_type         ENUM('motorbike','bicycle','car') NOT NULL DEFAULT 'motorbike',
  vehicle_model        VARCHAR(120) NULL,
  license_plate        VARCHAR(20)  NULL,
  id_card_url          VARCHAR(500) NULL,
  driver_license_url   VARCHAR(500) NULL,
  portrait_url         VARCHAR(500) NULL,
  bank_account_no      VARCHAR(40)  NULL,
  bank_name            VARCHAR(120) NULL,
  bank_account_holder  VARCHAR(120) NULL,
  rating_avg           DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  total_trips          INT UNSIGNED NOT NULL DEFAULT 0,
  approval_status      ENUM('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  approved_at          DATETIME NULL,
  approved_by_admin_id BIGINT UNSIGNED NULL,
  is_online            TINYINT(1) NOT NULL DEFAULT 0,
  current_lat          DECIMAL(10,7) NULL,
  current_lng          DECIMAL(10,7) NULL,
  last_location_at     DATETIME NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  KEY idx_drv_online (is_online),
  KEY idx_drv_status (approval_status),
  CONSTRAINT fk_drv_user     FOREIGN KEY (user_id)              REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_drv_approver FOREIGN KEY (approved_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================================================
-- SECTION 6 — ORDERS, ITEMS, STATUS LOG, PAYMENTS, ASSIGNMENTS (5 tables)
-- =============================================================================
-- Đây là trục xương sống của hệ thống. Cơ chế dispatch sử dụng broadcast:
-- khi đơn chuyển sang trạng thái ready_for_pickup, API /driver/jobs trả đơn
-- này cho mọi tài xế đang online cùng thành phố. Tài xế nào nhận trước
-- (POST /jobs/:id/accept) sẽ được khoá thông qua UNIQUE constraint trên
-- driver_assignments.order_id, ngăn race condition.
-- -----------------------------------------------------------------------------

CREATE TABLE orders (
  id                        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_code                VARCHAR(20) NOT NULL UNIQUE,    -- "ORD-A1B2C"
  customer_id               BIGINT UNSIGNED NOT NULL,
  restaurant_id             BIGINT UNSIGNED NOT NULL,
  driver_id                 BIGINT UNSIGNED NULL,           -- gán khi nhận đơn
  delivery_address_id       BIGINT UNSIGNED NOT NULL,
  -- Snapshot địa chỉ tại thời điểm đặt (vì address có thể bị sửa sau này).
  delivery_address_snapshot VARCHAR(500) NOT NULL,
  delivery_lat              DECIMAL(10,7) NOT NULL,
  delivery_lng              DECIMAL(10,7) NOT NULL,
  pickup_lat                DECIMAL(10,7) NOT NULL,
  pickup_lng                DECIMAL(10,7) NOT NULL,
  distance_km               DECIMAL(6,2) NOT NULL DEFAULT 0,
  -- Cấu trúc giá tiền (VND)
  subtotal                  BIGINT UNSIGNED NOT NULL,
  delivery_fee              BIGINT UNSIGNED NOT NULL DEFAULT 0,
  discount_amount           BIGINT UNSIGNED NOT NULL DEFAULT 0,
  total_amount              BIGINT UNSIGNED NOT NULL,
  -- Phân chia thu nhập (cached cho báo cáo nhanh)
  driver_earning            BIGINT UNSIGNED NOT NULL DEFAULT 0,
  merchant_earning          BIGINT UNSIGNED NOT NULL DEFAULT 0,
  platform_fee              BIGINT UNSIGNED NOT NULL DEFAULT 0,
  -- Vòng đời 10 trạng thái
  status                    ENUM(
                              'pending_payment','placed','accepted','preparing','ready_for_pickup',
                              'picked_up','delivering','delivered',
                              'cancelled','failed'
                            ) NOT NULL DEFAULT 'pending_payment',
  payment_status            ENUM('unpaid','paid','failed','refunded') NOT NULL DEFAULT 'unpaid',
  payment_method            ENUM('cod','vnpay') NOT NULL,
  -- Mốc thời gian
  customer_note             VARCHAR(500) NULL,
  estimated_delivery_at     DATETIME NULL,
  placed_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at               DATETIME NULL,
  ready_at                  DATETIME NULL,
  picked_up_at              DATETIME NULL,
  delivered_at              DATETIME NULL,
  cancelled_at              DATETIME NULL,
  cancelled_by_role         ENUM('customer','merchant','driver','admin','system') NULL,
  cancel_reason             VARCHAR(500) NULL,
  -- Audit
  created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ord_customer (customer_id, placed_at),
  KEY idx_ord_rest     (restaurant_id, status),
  KEY idx_ord_driver   (driver_id, status),
  KEY idx_ord_status   (status),
  CONSTRAINT fk_ord_customer FOREIGN KEY (customer_id)         REFERENCES users(id)              ON DELETE RESTRICT,
  CONSTRAINT fk_ord_rest     FOREIGN KEY (restaurant_id)       REFERENCES restaurants(id)        ON DELETE RESTRICT,
  CONSTRAINT fk_ord_driver   FOREIGN KEY (driver_id)           REFERENCES users(id)              ON DELETE SET NULL,
  CONSTRAINT fk_ord_address  FOREIGN KEY (delivery_address_id) REFERENCES customer_addresses(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Mỗi dòng đơn snapshot tên và giá. Khi merchant chỉnh sửa thực đơn về sau,
-- dữ liệu lịch sử của đơn không bị thay đổi.
CREATE TABLE order_items (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id            BIGINT UNSIGNED NOT NULL,
  menu_item_id        BIGINT UNSIGNED NOT NULL,
  item_name_snapshot  VARCHAR(160) NOT NULL,
  unit_price_snapshot BIGINT UNSIGNED NOT NULL,
  quantity            SMALLINT UNSIGNED NOT NULL,
  line_subtotal       BIGINT UNSIGNED NOT NULL,
  note                VARCHAR(255) NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_oi_order (order_id),
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id)     REFERENCES orders(id)     ON DELETE CASCADE,
  CONSTRAINT fk_oi_item  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Sổ ghi chép trạng thái đơn (append-only). Cấp dữ liệu cho timeline trên
-- màn Tracking của khách hàng và phục vụ kiểm toán cho admin.
CREATE TABLE order_status_logs (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id           BIGINT UNSIGNED NOT NULL,
  from_status        VARCHAR(40) NULL,
  to_status          VARCHAR(40) NOT NULL,
  changed_by_role    ENUM('customer','merchant','driver','admin','system') NOT NULL,
  changed_by_user_id BIGINT UNSIGNED NULL,
  note               VARCHAR(500) NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_osl_order (order_id, created_at),
  CONSTRAINT fk_osl_order FOREIGN KEY (order_id)           REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_osl_user  FOREIGN KEY (changed_by_user_id) REFERENCES users(id)  ON DELETE SET NULL
) ENGINE=InnoDB;

-- Bản ghi mỗi lần thử thanh toán. Một đơn có thể có nhiều dòng (retry sau
-- khi failed). Cột raw_response lưu IPN từ cổng VNPay để đối soát.
CREATE TABLE payments (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id       BIGINT UNSIGNED NOT NULL,
  method         ENUM('cod','vnpay') NOT NULL,
  amount         BIGINT UNSIGNED NOT NULL,
  currency       CHAR(3) NOT NULL DEFAULT 'VND',
  gateway        VARCHAR(40) NULL,            -- "vnpay" hoặc NULL khi COD
  gateway_txn_id VARCHAR(120) NULL,
  status         ENUM('initiated','pending','succeeded','failed','cancelled') NOT NULL DEFAULT 'initiated',
  failure_reason VARCHAR(500) NULL,
  paid_at        DATETIME NULL,
  raw_response   JSON NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pay_order  (order_id),
  KEY idx_pay_status (status),
  CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Phân công tài xế cho đơn (1:1). UNIQUE(order_id) ngăn hai tài xế cùng
-- nhận một đơn.
CREATE TABLE driver_assignments (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id           BIGINT UNSIGNED NOT NULL UNIQUE,
  driver_id          BIGINT UNSIGNED NOT NULL,
  assigned_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  arrived_pickup_at  DATETIME NULL,
  picked_up_at       DATETIME NULL,
  arrived_dropoff_at DATETIME NULL,
  delivered_at       DATETIME NULL,
  status             ENUM('assigned','en_route_pickup','at_pickup','picked_up','en_route_dropoff','at_dropoff','delivered','cancelled') NOT NULL DEFAULT 'assigned',
  distance_km        DECIMAL(6,2) NOT NULL DEFAULT 0,
  earning_amount     BIGINT UNSIGNED NOT NULL DEFAULT 0,
  proof_photo_url    VARCHAR(500) NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_da_driver (driver_id, status),
  CONSTRAINT fk_da_order  FOREIGN KEY (order_id)  REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_da_driver FOREIGN KEY (driver_id) REFERENCES users(id)  ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =============================================================================
-- SECTION 7 — WALLETS, LEDGER, PAYOUTS (3 tables)
-- =============================================================================

-- Một bảng ví chung cho tài xế và nhà hàng. Cột owner_type cho phép tái sử
-- dụng cấu trúc cho cả hai vai trò mà giữ riêng số dư.
CREATE TABLE wallets (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  owner_type      ENUM('driver','merchant') NOT NULL,
  balance         BIGINT NOT NULL DEFAULT 0,    -- VND
  pending_balance BIGINT NOT NULL DEFAULT 0,
  total_earned    BIGINT NOT NULL DEFAULT 0,
  total_withdrawn BIGINT NOT NULL DEFAULT 0,
  is_locked       TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wallet_owner (user_id, owner_type),
  CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Sổ cái ví (append-only). Mọi credit/debit phải đi qua hàm
-- walletService.applyTx(...) — hàm này INSERT vào đây và UPDATE wallets.balance
-- trong cùng một transaction. Không service nào được phép chỉnh balance trực
-- tiếp. Cột balance_after được materialise để kiểm tra tính toàn vẹn lịch sử.
CREATE TABLE wallet_transactions (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  wallet_id            BIGINT UNSIGNED NOT NULL,
  direction            ENUM('credit','debit') NOT NULL,
  amount               BIGINT UNSIGNED NOT NULL,
  balance_after        BIGINT NOT NULL,
  tx_type              ENUM(
                         'order_earning',  -- driver/merchant nhận tiền khi đơn delivered
                         'commission',     -- nền tảng giữ hoa hồng (debit merchant)
                         'order_payment',  -- COD: tài xế thu hộ → debit ví tài xế
                         'withdrawal',     -- rút về ngân hàng
                         'adjustment'      -- admin điều chỉnh thủ công
                       ) NOT NULL,
  reference_type       ENUM('order','payout','manual') NULL,
  reference_id         BIGINT UNSIGNED NULL,
  description          VARCHAR(500) NULL,
  performed_by_user_id BIGINT UNSIGNED NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wt_wallet (wallet_id, created_at),
  KEY idx_wt_ref    (reference_type, reference_id),
  CONSTRAINT fk_wt_wallet FOREIGN KEY (wallet_id)            REFERENCES wallets(id) ON DELETE RESTRICT,
  CONSTRAINT fk_wt_admin  FOREIGN KEY (performed_by_user_id) REFERENCES users(id)   ON DELETE SET NULL
) ENGINE=InnoDB;

-- Yêu cầu rút tiền về ngân hàng (driver / merchant). Admin duyệt và xác
-- nhận đã chuyển khoản (external_ref lưu mã giao dịch ngân hàng).
CREATE TABLE payout_requests (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  wallet_id            BIGINT UNSIGNED NOT NULL,
  user_id              BIGINT UNSIGNED NOT NULL,
  amount               BIGINT UNSIGNED NOT NULL,
  bank_account_no      VARCHAR(40)  NOT NULL,
  bank_name            VARCHAR(120) NOT NULL,
  bank_account_holder  VARCHAR(120) NOT NULL,
  status               ENUM('pending','approved','completed','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by_admin_id BIGINT UNSIGNED NULL,
  reviewed_at          DATETIME NULL,
  reject_reason        VARCHAR(500) NULL,
  external_ref         VARCHAR(120) NULL,
  requested_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at         DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_payout_user   (user_id),
  KEY idx_payout_status (status),
  CONSTRAINT fk_payout_wallet FOREIGN KEY (wallet_id)            REFERENCES wallets(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payout_user   FOREIGN KEY (user_id)              REFERENCES users(id)   ON DELETE RESTRICT,
  CONSTRAINT fk_payout_admin  FOREIGN KEY (reviewed_by_admin_id) REFERENCES users(id)   ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================================================
-- SECTION 8 — REVIEWS, NOTIFICATIONS, CONFIG (3 tables)
-- =============================================================================

-- Đánh giá đơn hàng — gắn với nhà hàng. Mỗi đơn chỉ có 1 đánh giá. Cột
-- reply_text + reply_at để chủ nhà hàng phản hồi.
CREATE TABLE reviews (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id      BIGINT UNSIGNED NOT NULL UNIQUE,
  customer_id   BIGINT UNSIGNED NOT NULL,
  restaurant_id BIGINT UNSIGNED NOT NULL,
  rating        TINYINT UNSIGNED NOT NULL,
  comment       TEXT NULL,
  is_hidden     TINYINT(1) NOT NULL DEFAULT 0,
  reply_text    TEXT NULL,
  reply_at      DATETIME NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_rev_rest (restaurant_id),
  KEY idx_rev_cust (customer_id),
  CONSTRAINT fk_rev_order FOREIGN KEY (order_id)      REFERENCES orders(id)      ON DELETE CASCADE,
  CONSTRAINT fk_rev_cust  FOREIGN KEY (customer_id)   REFERENCES users(id)       ON DELETE CASCADE,
  CONSTRAINT fk_rev_rest  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  CONSTRAINT chk_rating   CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- Thông báo trong ứng dụng (in-app). Frontend gọi /notifications/me theo
-- chu kỳ để cập nhật danh sách.
CREATE TABLE notifications (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  type       ENUM(
                'order_placed','order_accepted','order_ready','order_picked_up',
                'order_delivered','order_cancelled','payment_succeeded',
                'payment_failed','payout_status','kyc_status','system'
             ) NOT NULL,
  title      VARCHAR(160) NOT NULL,
  body       VARCHAR(500) NOT NULL,
  link_url   VARCHAR(500) NULL,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  read_at    DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notif_user (user_id, is_read, created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng key-value cho các tham số toàn hệ thống (hoa hồng, % chia tài xế,
-- số tiền rút tối thiểu, bán kính tìm kiếm).
CREATE TABLE platform_config (
  config_key          VARCHAR(80) NOT NULL,
  config_value        VARCHAR(1000) NOT NULL,
  data_type           ENUM('string','int','decimal','boolean','json') NOT NULL DEFAULT 'string',
  description         VARCHAR(500) NULL,
  updated_by_admin_id BIGINT UNSIGNED NULL,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (config_key),
  CONSTRAINT fk_cfg_admin FOREIGN KEY (updated_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================================================
-- END — Total: 24 tables across 8 sections.
-- Schema only. Để nạp dữ liệu mẫu, import file `setup.sql` (schema + data 1 lần)
-- hoặc chạy tiếp `seed.sql` sau khi file này chạy xong.
-- =============================================================================


-- =============================================================================
-- SEED DATA
-- =============================================================================

-- =============================================================================
-- SECTION A — PLATFORM CONFIG & CUISINES (lookup data)
-- =============================================================================

REPLACE INTO platform_config (config_key, config_value, data_type, description) VALUES
  ('default_commission_rate',   '15',     'decimal', 'Hoa hồng nền tảng (%) mặc định cho nhà hàng'),
  ('default_driver_share',      '80',     'decimal', '% phí giao hàng tài xế nhận được'),
  ('min_payout_amount',         '100000', 'int',     'Số tiền tối thiểu mỗi lần rút (VND)'),
  ('order_auto_cancel_minutes', '5',      'int',     'Số phút huỷ tự động nếu nhà hàng không xác nhận'),
  ('max_search_radius_km',      '8',      'decimal', 'Bán kính tìm kiếm tối đa (km)');

REPLACE INTO cuisines (id, name, slug, sort_order) VALUES
  (1, 'Ý',         'italian',  1),
  (2, 'Mỹ',        'american', 2),
  (3, 'Nhật',      'japanese', 3),
  (4, 'Lành mạnh', 'healthy',  4),
  (5, 'Mexico',    'mexican',  5),
  (6, 'Cà phê',    'coffee',   6),
  (7, 'Tiệm bánh', 'bakery',   7);

-- =============================================================================
-- SECTION B — USERS
-- =============================================================================
-- Sơ đồ ID:
--   1            → Admin
--   2            → Customer chính (Mara Chen)
--   3-6          → Drivers
--   7-14         → Merchant owners (8 chủ quán tương ứng với 8 restaurants)
--   15-19        → Customer phụ (xuất hiện trong kanban / lịch sử đơn)
--   20-22        → Customer đã để lại review trên trang chi tiết quán
-- Hash mật khẩu phía dưới = bcrypt('password123', 10).
-- =============================================================================

INSERT INTO users (id, email, phone, password_hash, full_name, avatar_url, primary_role, status, email_verified_at, phone_verified_at) VALUES
  -- Admin
  (1,  'avery@nomnom.example',    '+84901000001', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Avery Park',     'https://api.dicebear.com/9.x/avataaars/svg?seed=Avery%20Park&radius=50', 'admin',    'active', NOW(), NOW()),
  -- Customer chính
  (2,  'mara@example.com',        '+84901000002', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Mara Chen',      'https://api.dicebear.com/9.x/avataaars/svg?seed=Mara%20Chen&radius=50',  'customer', 'active', NOW(), NOW()),
  -- Drivers (Owen là tài xế đang demo trên UI)
  (3,  'owen.r@example.com',      '+84901000003', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Owen Reyes',     'https://api.dicebear.com/9.x/avataaars/svg?seed=Owen%20Reyes&radius=50', 'driver',   'active', NOW(), NOW()),
  (4,  'iris.m@example.com',      '+84901000004', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Iris Mendez',    'https://api.dicebear.com/9.x/avataaars/svg?seed=Iris%20Mendez&radius=50','driver',   'active', NOW(), NOW()),
  (5,  'felix.t@example.com',     '+84901000005', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Felix Tao',      'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix%20Tao&radius=50',  'driver',   'pending', NULL, NULL),
  (6,  'sasha.p@example.com',     '+84901000006', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Sasha Park',     'https://api.dicebear.com/9.x/avataaars/svg?seed=Sasha%20Park&radius=50', 'driver',   'active', NOW(), NOW()),
  -- Merchant owners
  (7,  'owner@cinque.example',    '+84901000007', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Marco Bello',    'https://api.dicebear.com/9.x/avataaars/svg?seed=Marco%20Bello&radius=50','merchant', 'active', NOW(), NOW()),
  (8,  'r@junebug.example',       '+84901000008', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Reese Anya',     'https://api.dicebear.com/9.x/avataaars/svg?seed=Reese%20Anya&radius=50', 'merchant', 'active', NOW(), NOW()),
  (9,  'sora@kaiseki.example',    '+84901000009', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Sora Iida',      'https://api.dicebear.com/9.x/avataaars/svg?seed=Sora%20Iida&radius=50',  'merchant', 'active', NOW(), NOW()),
  (10, 'naomi@verdant.example',   '+84901000010', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Naomi Kato',     'https://api.dicebear.com/9.x/avataaars/svg?seed=Naomi%20Kato&radius=50', 'merchant', 'pending', NULL, NULL),
  (11, 'ren@hachi.example',       '+84901000011', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Ren Ozaki',      'https://api.dicebear.com/9.x/avataaars/svg?seed=Ren%20Ozaki&radius=50',  'merchant', 'active', NOW(), NOW()),
  (12, 'lupe@carreta.example',    '+84901000012', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Lupe Martinez',  'https://api.dicebear.com/9.x/avataaars/svg?seed=Lupe%20Martinez&radius=50','merchant','suspended', NOW(), NOW()),
  (13, 'owner@buenaonda.example', '+84901000013', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Bea Lopez',      'https://api.dicebear.com/9.x/avataaars/svg?seed=Bea%20Lopez&radius=50',  'merchant', 'active', NOW(), NOW()),
  (14, 'owner@doughdonut.example','+84901000014', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Daly Smith',     'https://api.dicebear.com/9.x/avataaars/svg?seed=Daly%20Smith&radius=50', 'merchant', 'active', NOW(), NOW()),
  -- Customer phụ (kanban, lịch sử)
  (15, 'owen.t@example.com',      '+84901000015', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Owen Tran',      'https://api.dicebear.com/9.x/avataaars/svg?seed=Owen%20Tran&radius=50',  'customer', 'active', NOW(), NOW()),
  (16, 'rae.p@example.com',       '+84901000016', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Rae Pham',       'https://api.dicebear.com/9.x/avataaars/svg?seed=Rae%20Pham&radius=50',   'customer', 'active', NOW(), NOW()),
  (17, 'lia.d@example.com',       '+84901000017', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Lia Do',         'https://api.dicebear.com/9.x/avataaars/svg?seed=Lia%20Do&radius=50',     'customer', 'active', NOW(), NOW()),
  (18, 'sam.k@example.com',       '+84901000018', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Sam Kim',        'https://api.dicebear.com/9.x/avataaars/svg?seed=Sam%20Kim&radius=50',    'customer', 'active', NOW(), NOW()),
  (19, 'kai.v@example.com',       '+84901000019', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Kai Vu',         'https://api.dicebear.com/9.x/avataaars/svg?seed=Kai%20Vu&radius=50',     'customer', 'active', NOW(), NOW()),
  -- Customers đã review trên trang chi tiết quán (sampleReviews)
  (20, 'jamie.p@example.com',     '+84901000020', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jamie Phan',     'https://api.dicebear.com/9.x/avataaars/svg?seed=Jamie%20P.&radius=50',   'customer', 'active', NOW(), NOW()),
  (21, 'daniel.l@example.com',    '+84901000021', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Daniel Le',      'https://api.dicebear.com/9.x/avataaars/svg?seed=Daniel%20L.&radius=50',  'customer', 'active', NOW(), NOW()),
  (22, 'sky.r@example.com',       '+84901000022', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Sky Reyes',      'https://api.dicebear.com/9.x/avataaars/svg?seed=Sky%20R.&radius=50',     'customer', 'active', NOW(), NOW());

-- user_roles: tài xế và chủ quán đều có thể đặt món → cấp thêm role customer.
INSERT INTO user_roles (user_id, role) VALUES
  (1, 'admin'),
  (2, 'customer'),
  (3, 'driver'),   (3, 'customer'),
  (4, 'driver'),   (4, 'customer'),
  (5, 'driver'),
  (6, 'driver'),   (6, 'customer'),
  (7, 'merchant'), (7, 'customer'),
  (8, 'merchant'), (8, 'customer'),
  (9, 'merchant'),
  (10, 'merchant'),
  (11, 'merchant'),
  (12, 'merchant'),
  (13, 'merchant'),
  (14, 'merchant'),
  (15, 'customer'),
  (16, 'customer'),
  (17, 'customer'),
  (18, 'customer'),
  (19, 'customer'),
  (20, 'customer'),
  (21, 'customer'),
  (22, 'customer');

-- =============================================================================
-- SECTION C — CUSTOMER PROFILES & ADDRESSES
-- =============================================================================

-- Mara có 2 địa chỉ; mỗi customer phụ có 1 địa chỉ mặc định.
INSERT INTO customer_addresses (id, customer_id, label, recipient_name, recipient_phone, line1, ward, district, city, latitude, longitude, delivery_note, is_default) VALUES
  (1,  2,  'Nhà',        'Mara Chen',  '+84901000002', '120 Wythe Ave, Apt 3B',  'P. Bến Nghé',  'Q.1',           'TP. Hồ Chí Minh', 10.7795000, 106.6991000, 'Bấm chuông căn hộ 3B', 1),
  (2,  2,  'Văn phòng',  'Mara Chen',  '+84901000002', '88 Holloway St, Tầng 4', 'P. Bến Thành', 'Q.1',           'TP. Hồ Chí Minh', 10.7715000, 106.6981000, 'Để tại quầy lễ tân nếu vắng', 0),
  (3,  15, 'Nhà',        'Owen Tran',  '+84901000015', '301 Carroll St',         'P. Đa Kao',    'Q.1',           'TP. Hồ Chí Minh', 10.7873000, 106.6919000, NULL, 1),
  (4,  16, 'Nhà',        'Rae Pham',   '+84901000016', '14 W 10th St',           'P. 6',         'Q. Bình Thạnh', 'TP. Hồ Chí Minh', 10.8030000, 106.7100000, NULL, 1),
  (5,  17, 'Nhà',        'Lia Do',     '+84901000017', '24 Bedford Ave',         'P. 17',        'Q. Bình Thạnh', 'TP. Hồ Chí Minh', 10.8055000, 106.7068000, NULL, 1),
  (6,  18, 'Nhà',        'Sam Kim',    '+84901000018', '6 Smith St',             'P. Tân Định',  'Q.1',           'TP. Hồ Chí Minh', 10.7896000, 106.6907000, NULL, 1),
  (7,  19, 'Nhà',        'Kai Vu',     '+84901000019', '88 W 4th St',            'P. Cô Giang',  'Q.1',           'TP. Hồ Chí Minh', 10.7660000, 106.6960000, NULL, 1),
  (8,  20, 'Nhà',        'Jamie Phan', '+84901000020', '15 Greenpoint Ave',      'P. Tân Phong', 'Q.7',           'TP. Hồ Chí Minh', 10.7305000, 106.7218000, NULL, 1),
  (9,  21, 'Nhà',        'Daniel Le',  '+84901000021', '209 Avenue B',           'P. 12',        'Q. Tân Bình',   'TP. Hồ Chí Minh', 10.8004000, 106.6437000, NULL, 1),
  (10, 22, 'Nhà',        'Sky Reyes',  '+84901000022', '4 Sakura Ln',            'P. 9',         'Q. Phú Nhuận',  'TP. Hồ Chí Minh', 10.7990000, 106.6791000, NULL, 1);

-- Bảng `customer_profiles` lưu địa chỉ mặc định và tuỳ chọn.
INSERT INTO customer_profiles (user_id, default_address_id, preferred_language, marketing_opt_in) VALUES
  (2,  1,  'vi', 1),
  (3,  NULL, 'vi', 1),
  (4,  NULL, 'vi', 1),
  (6,  NULL, 'vi', 1),
  (7,  NULL, 'vi', 0),
  (8,  NULL, 'vi', 0),
  (15, 3,  'vi', 1),
  (16, 4,  'vi', 1),
  (17, 5,  'vi', 1),
  (18, 6,  'vi', 1),
  (19, 7,  'vi', 0),
  (20, 8,  'vi', 1),
  (21, 9,  'vi', 1),
  (22, 10, 'vi', 1);

-- =============================================================================
-- SECTION D — DRIVER PROFILES
-- =============================================================================

INSERT INTO driver_profiles (user_id, national_id, driver_license_no, vehicle_type, vehicle_model, license_plate, id_card_url, driver_license_url, portrait_url, bank_account_no, bank_name, bank_account_holder, rating_avg, total_trips, approval_status, approved_at, approved_by_admin_id, is_online, current_lat, current_lng, last_location_at) VALUES
  (3, '079203011234', 'B2-1234567', 'motorbike', 'Honda CB300R',  '59X1-12345', 'https://placehold.co/600x400?text=ID+Owen',   'https://placehold.co/600x400?text=DL+Owen',   'https://placehold.co/600x400?text=Owen',  '1903456789',  'Techcombank',  'OWEN REYES',  4.92, 1840, 'approved', NOW(), 1, 1, 10.7790000, 106.6995000, NOW()),
  (4, '079203011235', 'A2-2233445', 'motorbike', 'Yamaha Sirius', '59A1-44882', 'https://placehold.co/600x400?text=ID+Iris',   'https://placehold.co/600x400?text=DL+Iris',   'https://placehold.co/600x400?text=Iris',  '060034882001','Vietcombank',  'IRIS MENDEZ', 4.88, 1102, 'approved', NOW(), 1, 0, 10.7700000, 106.7000000, NOW()),
  (5, '079203011236', NULL,         'motorbike', 'Honda Wave',    '51X3-66120', 'https://placehold.co/600x400?text=ID+Felix',  NULL,                                          NULL,                                      NULL,           NULL,          NULL,           0.00,    0, 'pending',  NULL, NULL, 0, NULL, NULL, NULL),
  (6, '079203011237', 'A2-1199223', 'motorbike', 'Honda Future',  '51X1-89712', 'https://placehold.co/600x400?text=ID+Sasha',  'https://placehold.co/600x400?text=DL+Sasha',  'https://placehold.co/600x400?text=Sasha', '1119876543',  'BIDV',         'SASHA PARK',  4.85,  768, 'approved', NOW(), 1, 1, 10.7820000, 106.6960000, NOW());

-- =============================================================================
-- SECTION E — RESTAURANTS
-- =============================================================================
-- 8 quán mirror mock.restaurants. Status:
--   active     → 1, 2, 3, 5, 7
--   pending    → 4 (Verdant Bowls, đang chờ duyệt)
--   suspended  → 6 (La Carreta)
--   closed     → 8 (Dough & Donut)
-- =============================================================================

INSERT INTO restaurants (id, owner_user_id, cuisine_id, name, slug, tagline, description, phone, banner_url, logo_url, business_license_url, food_safety_cert_url, address_line, ward, district, city, latitude, longitude, base_delivery_fee, min_order_amount, avg_prep_time_min, rating_avg, review_count, commission_rate, is_open_now, status, approved_at, approved_by_admin_id) VALUES
  (1, 7,  1, 'Cinque Pizzeria', 'cinque-pizzeria', 'Pizza nướng lò củi kiểu Neapolitan từ năm 2017.', 'Pizza Neapolitan, đế nướng cháy cạnh, nguyên liệu nhập từ Ý.', '+84281234001',
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=80',
      'https://api.dicebear.com/9.x/shapes/svg?seed=Cinque&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8',
      'https://placehold.co/600x400?text=License+Cinque',
      'https://placehold.co/600x400?text=VSATTP+Cinque',
      '12 Linden Ave', 'P. Bến Nghé', 'Q.1', 'TP. Hồ Chí Minh', 10.7765000, 106.7010000, 62000, 80000, 25, 4.80, 1240, 15.00, 1, 'active', NOW(), 1),
  (2, 8,  2, 'Junebug Burgers', 'junebug-burgers', 'Thịt bò đập dập trên bánh mì khoai tây.', 'Smash burger, sốt đặc trưng, mở đến nửa đêm.', '+84281234002',
      'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1400&q=80',
      'https://api.dicebear.com/9.x/shapes/svg?seed=Junebug&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8',
      'https://placehold.co/600x400?text=License+Junebug',
      'https://placehold.co/600x400?text=VSATTP+Junebug',
      '88 Holloway St', 'P. Bến Thành', 'Q.1', 'TP. Hồ Chí Minh', 10.7710000, 106.6985000, 50000, 60000, 20, 4.70, 982, 15.00, 1, 'active', NOW(), 1),
  (3, 9,  3, 'Kaiseki & Co.', 'kaiseki-and-co', 'Omakase, phong cách edomae.', 'Sushi omakase cao cấp, cá nhập trực tiếp từ chợ Toyosu.', '+84281234003',
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1400&q=80',
      'https://api.dicebear.com/9.x/shapes/svg?seed=Kaiseki&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8',
      'https://placehold.co/600x400?text=License+Kaiseki',
      'https://placehold.co/600x400?text=VSATTP+Kaiseki',
      '4 Sakura Ln', 'P. 9', 'Q. Phú Nhuận', 'TP. Hồ Chí Minh', 10.7995000, 106.6790000, 100000, 200000, 35, 4.90, 654, 18.00, 1, 'active', NOW(), 1),
  (4, 10, 4, 'Verdant Bowls', 'verdant-bowls', 'Tô ngũ cốc theo mùa.', 'Tô trộn theo mùa, nguyên liệu hữu cơ tại địa phương.', '+84281234004',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=80',
      'https://api.dicebear.com/9.x/shapes/svg?seed=Verdant&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8',
      'https://placehold.co/600x400?text=License+Verdant',
      NULL,
      '15 Greenpoint Ave', 'P. Tân Phong', 'Q.7', 'TP. Hồ Chí Minh', 10.7305000, 106.7218000, 50000, 60000, 18, 4.60, 432, 15.00, 0, 'pending', NULL, NULL),
  (5, 11, 3, 'Hachi Ramen', 'hachi-ramen', 'Nước dùng xương heo ninh trong 14 giờ.', 'Ramen tonkotsu chuẩn vị Hakata, không hương liệu nhân tạo.', '+84281234005',
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1400&q=80',
      'https://api.dicebear.com/9.x/shapes/svg?seed=Hachi&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8',
      'https://placehold.co/600x400?text=License+Hachi',
      'https://placehold.co/600x400?text=VSATTP+Hachi',
      '101 Mott St', 'P. Phạm Ngũ Lão', 'Q.1', 'TP. Hồ Chí Minh', 10.7680000, 106.6920000, 62000, 80000, 22, 4.70, 1102, 15.00, 1, 'active', NOW(), 1),
  (6, 12, 5, 'La Carreta', 'la-carreta', 'Tacos al pastor, phục vụ cả ngày.', 'Tacos & burritos kiểu Mexico City, cay nhẹ tới cay đậm.', '+84281234006',
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1400&q=80',
      'https://api.dicebear.com/9.x/shapes/svg?seed=LaCarreta&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8',
      'https://placehold.co/600x400?text=License+LaCarreta',
      'https://placehold.co/600x400?text=VSATTP+LaCarreta',
      '209 Avenue B', 'P. 12', 'Q. Tân Bình', 'TP. Hồ Chí Minh', 10.8004000, 106.6437000, 37000, 50000, 20, 4.50, 765, 16.00, 0, 'suspended', NOW(), 1),
  (7, 13, 6, 'Buena Onda Cafe', 'buena-onda-cafe', 'Cà phê, bánh ngọt, buổi sáng thư thái.', 'Cà phê specialty, bánh ngọt nướng trong ngày.', '+84281234007',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=80',
      'https://api.dicebear.com/9.x/shapes/svg?seed=Buena&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8',
      'https://placehold.co/600x400?text=License+Buena',
      'https://placehold.co/600x400?text=VSATTP+Buena',
      '24 Bedford Ave', 'P. 17', 'Q. Bình Thạnh', 'TP. Hồ Chí Minh', 10.8055000, 106.7068000, 37000, 40000, 15, 4.80, 510, 12.00, 1, 'active', NOW(), 1),
  (8, 14, 7, 'Dough & Donut', 'dough-and-donut', 'Bánh donut men phủ đường.', 'Donut men ủ qua đêm, phủ đường thủ công.', '+84281234008',
      'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1400&q=80',
      'https://api.dicebear.com/9.x/shapes/svg?seed=Dough&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8',
      'https://placehold.co/600x400?text=License+Dough',
      'https://placehold.co/600x400?text=VSATTP+Dough',
      '6 Smith St', 'P. Tân Định', 'Q.1', 'TP. Hồ Chí Minh', 10.7896000, 106.6907000, 37000, 40000, 15, 4.60, 322, 12.00, 0, 'closed', NOW(), 1);

-- =============================================================================
-- SECTION F — MENU CATEGORIES
-- =============================================================================

INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES
  -- Cinque (rest 1)
  (1,  1, 'Cổ điển',     1),
  (2,  1, 'Đặc sản',     2),
  (3,  1, 'Món phụ',     3),
  (4,  1, 'Tráng miệng', 4),
  -- Junebug (rest 2)
  (5,  2, 'Hamburger',    1),
  (6,  2, 'Bánh mì kẹp',  2),
  (7,  2, 'Món phụ',      3),
  (8,  2, 'Đồ uống',      4),
  -- Kaiseki (rest 3)
  (9,  3, 'Nigiri',  1),
  (10, 3, 'Tô trộn', 2),
  (11, 3, 'Cuộn',    3),
  (12, 3, 'Món phụ', 4),
  -- Verdant (rest 4)
  (13, 4, 'Tô trộn', 1),
  (14, 4, 'Đồ uống', 2),
  -- Hachi (rest 5)
  (15, 5, 'Ramen',   1),
  (16, 5, 'Món phụ', 2),
  -- La Carreta (rest 6)
  (17, 6, 'Tacos',    1),
  (18, 6, 'Burritos', 2),
  (19, 6, 'Món phụ',  3),
  (20, 6, 'Đồ uống',  4),
  -- Buena Onda (rest 7)
  (21, 7, 'Cà phê',    1),
  (22, 7, 'Bánh ngọt', 2),
  (23, 7, 'Brunch',    3),
  -- Dough & Donut (rest 8)
  (24, 8, 'Donuts', 1);

-- =============================================================================
-- SECTION G — MENU ITEMS
-- =============================================================================
-- Giá VND. is_featured=1 với món bán chạy nhất mỗi quán.
-- =============================================================================

INSERT INTO menu_items (id, restaurant_id, category_id, name, description, image_url, price, prep_time_min, in_stock, is_featured, sort_order, total_sold, rating_avg, status) VALUES
  -- Cinque Pizzeria
  (1,  1, 1, 'Margherita',     'Cà chua San Marzano, phô mai tươi, húng quế.',                       'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80', 338000, 18, 1, 1, 1, 184, 4.80, 'active'),
  (2,  1, 1, 'Funghi',         'Nấm Crimini, phô mai taleggio, cỏ xạ hương, dầu truffle.',           'https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&w=800&q=80', 400000, 20, 1, 0, 2,  96, 4.70, 'active'),
  (3,  1, 2, 'Salsiccia',      'Xúc xích thì là, phô mai mozzarella xông khói, ớt.',                 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?auto=format&fit=crop&w=800&q=80', 438000, 22, 1, 1, 1,  71, 4.90, 'active'),
  (4,  1, 3, 'Burrata Salad',  'Cà chua gia truyền, dầu húng quế, muối biển.',                      'https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=800&q=80', 300000, 10, 1, 0, 1,  58, 4.60, 'active'),
  (5,  1, 4, 'Tiramisu',       'Phô mai Mascarpone, espresso, ca cao.',                              'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80', 188000,  5, 0, 0, 1,  42, 4.50, 'active'),
  -- Junebug Burgers
  (6,  2, 5, 'Cổ điển',          'Thịt bò đập dập gấp đôi, phô mai Mỹ, sốt bí mật.',                   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', 288000, 14, 1, 1, 1, 220, 4.80, 'active'),
  (7,  2, 5, 'Cheddar Bacon',    'Phô mai Cheddar ủ, thịt xông khói ngào đường, dưa chuột muối.',     'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=80', 325000, 16, 1, 0, 2, 144, 4.70, 'active'),
  (8,  2, 6, 'Gà giòn',          'Gà chiên sữa bơ, salad bắp cải, mật ong cay.',                      'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80', 313000, 18, 1, 0, 1,  92, 4.60, 'active'),
  (9,  2, 7, 'Khoai tây chiên',  'Cắt tay, muối biển, thảo mộc.',                                     'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80', 113000,  8, 1, 0, 1, 320, 4.50, 'active'),
  (10, 2, 8, 'Vanilla Shake',    'Vani Madagascar, kem tươi.',                                         'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80', 138000,  5, 1, 0, 1,  88, 4.70, 'active'),
  -- Kaiseki & Co.
  (11, 3, 9,  'Set Nigiri (8 miếng)', 'Cá ngừ, cá hồi, cá đuôi vàng, tôm.',                          'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', 650000, 30, 1, 1, 1, 144, 4.95, 'active'),
  (12, 3, 10, 'Cơm bát cá hồi',       'Cơm sushi, cá hồi, bơ, đậu nành Nhật.',                       'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80', 450000, 25, 1, 0, 1,  92, 4.85, 'active'),
  (13, 3, 11, 'Spicy Tuna Roll',      'Cá ngừ vây vàng, dầu ớt, hành lá.',                            'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=800&q=80', 350000, 20, 1, 0, 1,  68, 4.80, 'active'),
  (14, 3, 12, 'Súp Miso',             'Miso trắng, đậu phụ, hành lá.',                                'https://images.unsplash.com/photo-1607301405390-d831c242f59b?auto=format&fit=crop&w=800&q=80', 113000,  8, 1, 0, 1, 110, 4.60, 'active'),
  -- Verdant Bowls (chờ duyệt — items vẫn hiện trong UI demo, status=active)
  (15, 4, 13, 'Tô mùa vụ',     'Diêm mạch, cải xoăn, bí đỏ, sốt mè.',                                'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', 325000, 12, 1, 1, 1, 64, 4.65, 'active'),
  (16, 4, 13, 'Buddha Bowl',   'Cơm lứt, đậu phụ, đậu nành Nhật, gừng.',                             'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', 313000, 14, 1, 0, 2, 52, 4.55, 'active'),
  (17, 4, 14, 'Sinh tố xanh',  'Cải xoăn, chuối, hạnh nhân, hạt gai dầu.',                            'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=800&q=80', 163000,  5, 1, 0, 1, 38, 4.40, 'active'),
  -- Hachi Ramen
  (18, 5, 15, 'Tonkotsu Ramen', 'Nước dùng xương heo, xá xíu, trứng ngâm tương.',                    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80', 400000, 18, 1, 1, 1, 268, 4.85, 'active'),
  (19, 5, 15, 'Miso Ramen',     'Miso đỏ, thịt heo xay, ngô.',                                       'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=800&q=80', 388000, 18, 1, 0, 2, 174, 4.70, 'active'),
  (20, 5, 16, 'Gyoza (6 miếng)','Sủi cảo heo, sốt ponzu.',                                          'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80', 188000,  8, 1, 0, 1, 220, 4.60, 'active'),
  -- La Carreta
  (21, 6, 17, 'Tacos al Pastor (3 chiếc)', 'Dứa, ngò rí, hành tây.',                                'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80', 275000, 12, 1, 1, 1, 184, 4.55, 'active'),
  (22, 6, 18, 'Burrito Carnitas',         'Thịt heo ninh nhừ, cơm, đậu, sốt salsa xanh.',          'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80', 313000, 15, 1, 0, 1, 96, 4.50, 'active'),
  (23, 6, 19, 'Elote',                    'Ngô nướng cháy cạnh, chanh, phô mai cotija.',           'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', 125000,  8, 1, 0, 1, 70, 4.40, 'active'),
  (24, 6, 20, 'Horchata',                 'Sữa gạo, quế, vani.',                                   'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=800&q=80', 100000,  4, 1, 0, 1, 52, 4.35, 'active'),
  -- Buena Onda Cafe
  (25, 7, 21, 'Flat White',                'Cà phê espresso kép, bọt sữa mịn.',                    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80', 120000,  5, 1, 1, 1, 410, 4.85, 'active'),
  (26, 7, 22, 'Bánh sừng bò hạnh nhân',    'Kem frangipane, hạnh nhân nướng.',                     'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80', 113000,  3, 1, 0, 1, 220, 4.75, 'active'),
  (27, 7, 23, 'Bánh mì bơ',                'Bánh mì men tự nhiên, ớt, chanh, muối biển.',          'https://images.unsplash.com/photo-1603046891744-1f76eb10aec3?auto=format&fit=crop&w=800&q=80', 238000, 10, 1, 0, 1, 154, 4.70, 'active'),
  -- Dough & Donut
  (28, 8, 24, 'Donut phủ đường cổ điển', 'Lớp phủ vani, bánh donut men.',                          'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', 75000,  4, 1, 1, 1, 88, 4.55, 'active'),
  (29, 8, 24, 'Maple Bacon',             'Lớp phủ phong, thịt xông khói ngào đường.',              'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80', 113000,  5, 1, 0, 2, 46, 4.50, 'active');

-- =============================================================================
-- SECTION H — ORDERS, ORDER ITEMS, STATUS LOGS, PAYMENTS, ASSIGNMENTS
-- =============================================================================
-- Sơ đồ:
--   1  ORD-A1B2C  Mara → Hachi      đang giao (demo trang Tracking)
--   2  ORD-Q3K9P  Mara → Junebug    đã giao (lịch sử của Mara)
--   3  ORD-7T2RD  Mara → Cinque     đã đặt        (cột "new" Merchant Orders)
--   4  ORD-K9XR1  Owen T → Cinque   đã đặt        (cột "new")
--   5  ORD-A41QM  Rae → Cinque      đang nấu      (cột "preparing")
--   6  ORD-V2HHJ  Lia → Cinque      sẵn sàng lấy  (cột "ready")
--   7  ORD-P9X22  Sam → Cinque      đã giao       (cột "completed")
--   8  ORD-J11HQ  Kai → Cinque      đã giao       (cột "completed")
--   9  ORD-RV001  Jamie → Cinque    đã giao       (gốc của review rev-1)
--   10 ORD-RV002  Daniel → Cinque   đã giao       (gốc của review rev-2)
--   11 ORD-RV003  Sky → Cinque      đã giao       (gốc của review rev-3)
-- =============================================================================

INSERT INTO orders (id, order_code, customer_id, restaurant_id, driver_id, delivery_address_id, delivery_address_snapshot, delivery_lat, delivery_lng, pickup_lat, pickup_lng, distance_km, subtotal, delivery_fee, discount_amount, total_amount, driver_earning, merchant_earning, platform_fee, status, payment_status, payment_method, customer_note, estimated_delivery_at, placed_at, accepted_at, ready_at, picked_up_at, delivered_at, cancelled_at) VALUES
  (1,  'ORD-A1B2C', 2,  5, 3,    1, '120 Wythe Ave, Apt 3B, P. Bến Nghé, Q.1, TP. Hồ Chí Minh',  10.7795000, 106.6991000, 10.7680000, 106.6920000, 3.40, 588000, 62000,     0,  650000, 49600, 499800, 100600, 'delivering',       'paid',   'vnpay', NULL,                            DATE_ADD(NOW(), INTERVAL 8 MINUTE),   NOW() - INTERVAL 12 MINUTE,   NOW() - INTERVAL 11 MINUTE,   NOW() - INTERVAL 4 MINUTE,   NOW() - INTERVAL 3 MINUTE,   NULL,                       NULL),
  (2,  'ORD-Q3K9P', 2,  2, 3,    1, '120 Wythe Ave, Apt 3B, P. Bến Nghé, Q.1, TP. Hồ Chí Minh',  10.7795000, 106.6991000, 10.7710000, 106.6985000, 1.80, 689000, 50000, 89000,  650000, 40000, 585650, 113350, 'delivered',        'paid',   'vnpay', NULL,                            NULL,                                 NOW() - INTERVAL 1560 MINUTE, NOW() - INTERVAL 1550 MINUTE,       NOW() - INTERVAL 1530 MINUTE,       NOW() - INTERVAL 1520 MINUTE,      NOW() - INTERVAL 1500 MINUTE, NULL),
  (3,  'ORD-7T2RD', 2,  1, NULL, 1, '120 Wythe Ave, Apt 3B, P. Bến Nghé, Q.1, TP. Hồ Chí Minh',  10.7795000, 106.6991000, 10.7765000, 106.7010000, 0.50, 638000, 62000,     0,  700000, 49600, 542300, 108100, 'placed',           'paid',   'vnpay', 'Làm ơn không lấy húng quế',     DATE_ADD(NOW(), INTERVAL 25 MINUTE),  NOW() - INTERVAL 2 MINUTE,    NULL,                         NULL,                       NULL,                       NULL,                       NULL),
  (4,  'ORD-K9XR1', 15, 1, NULL, 3, '301 Carroll St, P. Đa Kao, Q.1, TP. Hồ Chí Minh',           10.7873000, 106.6919000, 10.7765000, 106.7010000, 1.20, 800000, 62000,     0,  862000, 49600, 680000, 132400, 'placed',           'paid',   'vnpay', NULL,                            DATE_ADD(NOW(), INTERVAL 28 MINUTE),  NOW() - INTERVAL 4 MINUTE,    NULL,                         NULL,                       NULL,                       NULL,                       NULL),
  (5,  'ORD-A41QM', 16, 1, NULL, 4, '14 W 10th St, P. 6, Q. Bình Thạnh, TP. Hồ Chí Minh',         10.8030000, 106.7100000, 10.7765000, 106.7010000, 2.80, 776000, 62000,     0,  838000, 49600, 659600, 128800, 'preparing',        'paid',   'vnpay', 'Thêm dầu ớt',                   DATE_ADD(NOW(), INTERVAL 20 MINUTE),  NOW() - INTERVAL 9 MINUTE,    NOW() - INTERVAL 8 MINUTE,    NULL,                       NULL,                       NULL,                       NULL),
  (6,  'ORD-V2HHJ', 17, 1, NULL, 5, '24 Bedford Ave, P. 17, Q. Bình Thạnh, TP. Hồ Chí Minh',      10.8055000, 106.7068000, 10.7765000, 106.7010000, 3.30, 526000, 62000,     0,  588000, 49600, 447100,  91300, 'ready_for_pickup', 'paid',   'vnpay', NULL,                            DATE_ADD(NOW(), INTERVAL 15 MINUTE),  NOW() - INTERVAL 16 MINUTE,   NOW() - INTERVAL 15 MINUTE,   NOW() - INTERVAL 3 MINUTE,  NULL,                       NULL,                       NULL),
  (7,  'ORD-P9X22', 18, 1, 4,    6, '6 Smith St, P. Tân Định, Q.1, TP. Hồ Chí Minh',              10.7896000, 106.6907000, 10.7765000, 106.7010000, 2.10, 400000, 62000,     0,  462000, 49600, 340000,  72400, 'delivered',        'paid',   'cod',   NULL,                            NULL,                                 NOW() - INTERVAL 60 MINUTE,   NOW() - INTERVAL 58 MINUTE,   NOW() - INTERVAL 40 MINUTE, NOW() - INTERVAL 30 MINUTE, NOW() - INTERVAL 15 MINUTE, NULL),
  (8,  'ORD-J11HQ', 19, 1, 6,    7, '88 W 4th St, P. Cô Giang, Q.1, TP. Hồ Chí Minh',             10.7660000, 106.6960000, 10.7765000, 106.7010000, 1.40, 1014000,62000,     0, 1076000, 49600, 861900, 164500, 'delivered',        'paid',   'vnpay', 'Không gluten — đế không gluten',NULL,                                 NOW() - INTERVAL 90 MINUTE,   NOW() - INTERVAL 88 MINUTE,   NOW() - INTERVAL 60 MINUTE, NOW() - INTERVAL 55 MINUTE, NOW() - INTERVAL 40 MINUTE, NULL),
  (9,  'ORD-RV001', 20, 1, 3,    8, '15 Greenpoint Ave, P. Tân Phong, Q.7, TP. Hồ Chí Minh',      10.7305000, 106.7218000, 10.7765000, 106.7010000, 5.40, 438000, 62000,     0,  500000, 49600, 372300,  78100, 'delivered',        'paid',   'vnpay', NULL,                            NULL,                                 NOW() - INTERVAL 3 DAY,       NOW() - INTERVAL 3 DAY,       NOW() - INTERVAL 3 DAY,     NOW() - INTERVAL 3 DAY,     NOW() - INTERVAL 3 DAY,     NULL),
  (10, 'ORD-RV002', 21, 1, 4,    9, '209 Avenue B, P. 12, Q. Tân Bình, TP. Hồ Chí Minh',          10.8004000, 106.6437000, 10.7765000, 106.7010000, 6.80, 338000, 62000,     0,  400000, 49600, 287300,  63100, 'delivered',        'paid',   'vnpay', 'Giao chậm một chút cũng được',  NULL,                                 NOW() - INTERVAL 7 DAY,       NOW() - INTERVAL 7 DAY,       NOW() - INTERVAL 7 DAY,     NOW() - INTERVAL 7 DAY,     NOW() - INTERVAL 7 DAY,     NULL),
  (11, 'ORD-RV003', 22, 1, 6,   10, '4 Sakura Ln, P. 9, Q. Phú Nhuận, TP. Hồ Chí Minh',           10.7990000, 106.6791000, 10.7765000, 106.7010000, 3.10, 300000, 62000,     0,  362000, 49600, 255000,  57400, 'delivered',        'paid',   'cod',   NULL,                            NULL,                                 NOW() - INTERVAL 14 DAY,      NOW() - INTERVAL 14 DAY,      NOW() - INTERVAL 14 DAY,    NOW() - INTERVAL 14 DAY,    NOW() - INTERVAL 14 DAY,    NULL);

-- order_items: snapshot tên & giá tại thời điểm đặt.
INSERT INTO order_items (id, order_id, menu_item_id, item_name_snapshot, unit_price_snapshot, quantity, line_subtotal, note) VALUES
  -- ORD-A1B2C
  (1,  1, 18, 'Tonkotsu Ramen',  400000, 1, 400000, NULL),
  (2,  1, 20, 'Gyoza (6 miếng)', 188000, 1, 188000, NULL),
  -- ORD-Q3K9P
  (3,  2, 6,  'Cổ điển',          288000, 2, 576000, NULL),
  (4,  2, 9,  'Khoai tây chiên',  113000, 1, 113000, NULL),
  -- ORD-7T2RD
  (5,  3, 1,  'Margherita',     338000, 1, 338000, NULL),
  (6,  3, 4,  'Burrata Salad',  300000, 1, 300000, NULL),
  -- ORD-K9XR1
  (7,  4, 2,  'Funghi',         400000, 2, 800000, NULL),
  -- ORD-A41QM
  (8,  5, 3,  'Salsiccia',      438000, 1, 438000, NULL),
  (9,  5, 1,  'Margherita',     338000, 1, 338000, NULL),
  -- ORD-V2HHJ
  (10, 6, 1,  'Margherita',     338000, 1, 338000, NULL),
  (11, 6, 5,  'Tiramisu',       188000, 1, 188000, NULL),
  -- ORD-P9X22
  (12, 7, 2,  'Funghi',         400000, 1, 400000, NULL),
  -- ORD-J11HQ
  (13, 8, 1,  'Margherita',     338000, 3, 1014000, 'Đế không gluten'),
  -- ORD-RV001
  (14, 9, 3,  'Salsiccia',      438000, 1, 438000, NULL),
  -- ORD-RV002
  (15, 10, 1, 'Margherita',     338000, 1, 338000, NULL),
  -- ORD-RV003
  (16, 11, 4, 'Burrata Salad',  300000, 1, 300000, NULL);

-- order_status_logs: timeline cho ORD-A1B2C (đơn đang giao — feed cho trang Tracking).
INSERT INTO order_status_logs (order_id, from_status, to_status, changed_by_role, changed_by_user_id, note) VALUES
  (1, NULL,               'pending_payment', 'customer', 2, 'Khách tạo đơn'),
  (1, 'pending_payment',  'placed',          'system',   NULL, 'VNPay xác nhận thanh toán'),
  (1, 'placed',            'accepted',        'merchant', 11, 'Hachi Ramen xác nhận đơn'),
  (1, 'accepted',          'preparing',       'merchant', 11, 'Bắt đầu nấu'),
  (1, 'preparing',         'ready_for_pickup','merchant', 11, 'Sẵn sàng cho tài xế lấy'),
  (1, 'ready_for_pickup',  'picked_up',       'driver',   3,  'Owen đã lấy hàng'),
  (1, 'picked_up',         'delivering',     'driver',   3,  'Đang giao đến khách'),
  -- ORD-Q3K9P timeline rút gọn
  (2, 'preparing',         'delivered',       'driver',   3,  NULL),
  -- ORD-7T2RD vừa đặt
  (3, 'pending_payment',   'placed',          'system',   NULL, 'VNPay xác nhận'),
  (4, 'pending_payment',   'placed',          'system',   NULL, 'VNPay xác nhận'),
  -- ORD-A41QM đang chuẩn bị
  (5, 'placed',            'accepted',        'merchant', 7,  NULL),
  (5, 'accepted',          'preparing',       'merchant', 7,  NULL),
  -- ORD-V2HHJ sẵn sàng lấy
  (6, 'preparing',         'ready_for_pickup','merchant', 7,  NULL);

-- payments: 1 bản ghi / đơn. ORD-P9X22 và ORD-RV003 thanh toán COD nên `gateway` để NULL.
INSERT INTO payments (id, order_id, method, amount, gateway, gateway_txn_id, status, paid_at) VALUES
  (1,  1,  'vnpay', 650000,  'vnpay', 'VNP14829381', 'succeeded', NOW() - INTERVAL 12 MINUTE),
  (2,  2,  'vnpay', 650000,  'vnpay', 'VNP14771209', 'succeeded', NOW() - INTERVAL 26 HOUR),
  (3,  3,  'vnpay', 700000,  'vnpay', 'VNP14855001', 'succeeded', NOW() - INTERVAL 2 MINUTE),
  (4,  4,  'vnpay', 862000,  'vnpay', 'VNP14854999', 'succeeded', NOW() - INTERVAL 4 MINUTE),
  (5,  5,  'vnpay', 838000,  'vnpay', 'VNP14854810', 'succeeded', NOW() - INTERVAL 9 MINUTE),
  (6,  6,  'vnpay', 588000,  'vnpay', 'VNP14854711', 'succeeded', NOW() - INTERVAL 16 MINUTE),
  (7,  7,  'cod',   462000,  NULL,    NULL,          'succeeded', NOW() - INTERVAL 15 MINUTE),
  (8,  8,  'vnpay', 1076000, 'vnpay', 'VNP14852201', 'succeeded', NOW() - INTERVAL 90 MINUTE),
  (9,  9,  'vnpay', 500000,  'vnpay', 'VNP14809921', 'succeeded', NOW() - INTERVAL 3 DAY),
  (10, 10, 'vnpay', 400000,  'vnpay', 'VNP14761023', 'succeeded', NOW() - INTERVAL 7 DAY),
  (11, 11, 'cod',   362000,  NULL,    NULL,          'succeeded', NOW() - INTERVAL 14 DAY);

-- driver_assignments: cho mọi đơn đã có tài xế (1, 2, 7, 8, 9, 10, 11).
INSERT INTO driver_assignments (id, order_id, driver_id, assigned_at, arrived_pickup_at, picked_up_at, arrived_dropoff_at, delivered_at, status, distance_km, earning_amount, proof_photo_url) VALUES
  (1, 1, 3, NOW() - INTERVAL 10 MINUTE, NOW() - INTERVAL 6 MINUTE, NOW() - INTERVAL 3 MINUTE, NULL,                          NULL,                          'en_route_dropoff', 3.40, 49600, NULL),
  (2, 2, 3, NOW() - INTERVAL 1545 MINUTE,       NOW() - INTERVAL 1530 MINUTE,       NOW() - INTERVAL 1520 MINUTE,       NOW() - INTERVAL 1505 MINUTE,      NOW() - INTERVAL 1500 MINUTE, 'delivered',  1.80, 40000, 'https://placehold.co/600x400?text=Proof+Q3K9P'),
  (3, 7, 4, NOW() - INTERVAL 50 MINUTE, NOW() - INTERVAL 38 MINUTE, NOW() - INTERVAL 30 MINUTE, NOW() - INTERVAL 18 MINUTE, NOW() - INTERVAL 15 MINUTE,    'delivered',  2.10, 49600, 'https://placehold.co/600x400?text=Proof+P9X22'),
  (4, 8, 6, NOW() - INTERVAL 80 MINUTE, NOW() - INTERVAL 65 MINUTE, NOW() - INTERVAL 55 MINUTE, NOW() - INTERVAL 42 MINUTE, NOW() - INTERVAL 40 MINUTE,    'delivered',  1.40, 49600, 'https://placehold.co/600x400?text=Proof+J11HQ'),
  (5, 9, 3, NOW() - INTERVAL 3 DAY,     NOW() - INTERVAL 3 DAY,     NOW() - INTERVAL 3 DAY,     NOW() - INTERVAL 3 DAY,     NOW() - INTERVAL 3 DAY,        'delivered',  5.40, 49600, 'https://placehold.co/600x400?text=Proof+RV001'),
  (6, 10, 4, NOW() - INTERVAL 7 DAY,    NOW() - INTERVAL 7 DAY,     NOW() - INTERVAL 7 DAY,     NOW() - INTERVAL 7 DAY,     NOW() - INTERVAL 7 DAY,        'delivered',  6.80, 49600, 'https://placehold.co/600x400?text=Proof+RV002'),
  (7, 11, 6, NOW() - INTERVAL 14 DAY,   NOW() - INTERVAL 14 DAY,    NOW() - INTERVAL 14 DAY,    NOW() - INTERVAL 14 DAY,    NOW() - INTERVAL 14 DAY,       'delivered',  3.10, 49600, 'https://placehold.co/600x400?text=Proof+RV003');

-- =============================================================================
-- SECTION I — WALLETS, LEDGER, PAYOUTS
-- =============================================================================
-- Ví khởi tạo cho 3 tài xế đã duyệt và 5 chủ quán đang hoạt động.
-- Felix (driver pending), Naomi (Verdant pending), Lupe (La Carreta suspended),
-- Daly (Dough & Donut closed) — chưa cần ví.
-- =============================================================================

INSERT INTO wallets (id, user_id, owner_type, balance, pending_balance, total_earned, total_withdrawn, is_locked) VALUES
  -- Driver wallets
  (1, 3,  'driver',   642000,  49600,    4580000, 3938000, 0),  -- Owen — có 1 đơn đang giao
  (2, 4,  'driver',   850000,      0,    5200000, 4350000, 0),  -- Iris
  (3, 6,  'driver',   320000,      0,    1240000,  920000, 0),  -- Sasha
  -- Merchant wallets
  (4, 7,  'merchant', 1500000,     0,    2116500,  616500, 0),  -- Cinque
  (5, 8,  'merchant', 4300000,     0,    9850000, 5550000, 0),  -- Junebug
  (6, 9,  'merchant', 3200000,     0,    7340000, 4140000, 0),  -- Kaiseki
  (7, 11, 'merchant', 6800000,     0,   14120000, 7320000, 0),  -- Hachi
  (8, 13, 'merchant', 1100000,     0,    2450000, 1350000, 0);  -- Buena Onda

-- wallet_transactions cho ví Cinque (id=4) thể hiện đầy đủ vòng quay:
-- 5 lần order_earning từ các đơn đã giao + 1 lần withdrawal (sẽ tham chiếu
-- payout_request id=4 ở phần bên dưới).
INSERT INTO wallet_transactions (id, wallet_id, direction, amount, balance_after, tx_type, reference_type, reference_id, description, performed_by_user_id) VALUES
  -- Cinque ledger
  (1, 4, 'credit',  340000,  340000, 'order_earning', 'order',   7, 'Doanh thu đơn ORD-P9X22', NULL),
  (2, 4, 'credit',  861900, 1201900, 'order_earning', 'order',   8, 'Doanh thu đơn ORD-J11HQ', NULL),
  (3, 4, 'credit',  372300, 1574200, 'order_earning', 'order',   9, 'Doanh thu đơn ORD-RV001', NULL),
  (4, 4, 'credit',  287300, 1861500, 'order_earning', 'order',  10, 'Doanh thu đơn ORD-RV002', NULL),
  (5, 4, 'credit',  255000, 2116500, 'order_earning', 'order',  11, 'Doanh thu đơn ORD-RV003', NULL),
  (6, 4, 'debit',   616500, 1500000, 'withdrawal',    'payout',  4, 'Rút tiền PYT-004 đã hoàn tất', 1),
  -- Owen Reyes (driver, wallet=1) ledger — 2 chuyến đã hoàn tất
  (7, 1, 'credit',   40000,   40000, 'order_earning', 'order',   2, 'Tiền chuyến ORD-Q3K9P', NULL),
  (8, 1, 'credit',   49600,   89600, 'order_earning', 'order',   9, 'Tiền chuyến ORD-RV001', NULL),
  -- Iris Mendez (driver, wallet=2) ledger — minh hoạ flow COD đầy đủ.
  -- Số dư trước chu trình này = 800.400 (đã có doanh thu từ các chuyến trước).
  (9,  2, 'credit',   49600, 850000, 'order_earning', 'order',  7,    'Tiền chuyến ORD-P9X22 (COD)', NULL),
  (10, 2, 'debit',   462000, 388000, 'order_payment', 'order',  7,    'COD: tài xế thu hộ — sẽ đối soát',     NULL),
  (11, 2, 'credit',  462000, 850000, 'adjustment',    'manual', NULL, 'Nộp lại tiền COD vào cuối ca',         1);

-- payout_requests — 5 yêu cầu rút tiền (mirror initialPayouts trong frontend).
INSERT INTO payout_requests (id, wallet_id, user_id, amount, bank_account_no, bank_name, bank_account_holder, status, reviewed_by_admin_id, reviewed_at, reject_reason, external_ref, requested_at, completed_at) VALUES
  (1, 1, 3,   480000, '1903456789',  'Techcombank', 'OWEN REYES',      'pending',   NULL, NULL,                       NULL, NULL,                NOW() - INTERVAL 2 HOUR,  NULL),
  (2, 5, 8,  1500000, '060011223344','BIDV',        'JUNEBUG BURGERS', 'pending',   NULL, NULL,                       NULL, NULL,                NOW() - INTERVAL 6 HOUR,  NULL),
  (3, 2, 4,  1200000, '060034882001','Vietcombank', 'IRIS MENDEZ',     'completed', 1,    NOW() - INTERVAL 1 DAY,     NULL, 'VCB20260520-9911', NOW() - INTERVAL 2 DAY,   NOW() - INTERVAL 1 DAY),
  (4, 4, 7,  2000000, '037000118822','Vietcombank', 'MARCO BELLO',     'completed', 1,    NOW() - INTERVAL 4 DAY,     NULL, 'VCB20260518-7723', NOW() - INTERVAL 5 DAY,   NOW() - INTERVAL 4 DAY),
  (5, 3, 6,   350000, '1119876543',  'BIDV',        'SASHA PARK',      'rejected',  1,    NOW() - INTERVAL 3 DAY,     'Số tài khoản không khớp với chủ tài khoản đăng ký.', NULL, NOW() - INTERVAL 3 DAY, NULL);

-- =============================================================================
-- SECTION J — REVIEWS
-- =============================================================================
-- 3 review từ sampleReviews — gắn vào ORD-RV001 / RV002 / RV003 (đều của Cinque).
-- =============================================================================

INSERT INTO reviews (id, order_id, customer_id, restaurant_id, rating, comment, is_hidden, reply_text, reply_at) VALUES
  (1, 9,  20, 1, 5, 'Đế bánh được nướng cháy cạnh hoàn hảo. Salsiccia là chiếc pizza ngon nhất tôi từng ăn trong năm nay.', 0, 'Cảm ơn bạn rất nhiều — hẹn gặp lại nhé!', NOW() - INTERVAL 2 DAY),
  (2, 10, 21, 1, 4, 'Giao hàng hơi chậm một chút nhưng đồ ăn đã bù đắp lại tất cả.', 0, NULL, NULL),
  (3, 11, 22, 1, 5, 'Salad Burrata thật tuyệt vời. Sẽ đặt lại vào tuần tới.', 0, 'Cảm ơn Sky! Sẽ chuẩn bị thêm burrata tươi cho lần sau.', NOW() - INTERVAL 13 DAY);

-- =============================================================================
-- SECTION K — NOTIFICATIONS
-- =============================================================================
-- Hộp thư của Mara (customer chính) — mirror MOCK_NOTIFICATIONS trong trang
-- /app/notifications. Cũng thêm vài thông báo mẫu cho chủ quán Cinque (user 7)
-- và tài xế Owen (user 3) để có dữ liệu cho 2 trang notifications còn lại.
-- =============================================================================

INSERT INTO notifications (id, user_id, type, title, body, link_url, is_read, read_at, created_at) VALUES
  -- Mara (user 2) — 6 thông báo từ MOCK_NOTIFICATIONS trong trang khách
  (1,  2, 'order_delivered',   'Đơn hàng đã giao',         'Đơn ORD-A1B2C đã được giao tới bạn. Hãy đánh giá tài xế nhé!',                        '/app/reviews/ord-a1b2c',     0, NULL, NOW() - INTERVAL 5 MINUTE),
  (2,  2, 'order_picked_up',   'Tài xế đã lấy hàng',       'Tài xế Owen đang trên đường đến địa chỉ của bạn.',                                   '/app/track/ord-a1b2c',       0, NULL, NOW() - INTERVAL 25 MINUTE),
  (3,  2, 'order_accepted',    'Quán đã xác nhận đơn',     'Hachi Ramen đã nhận đơn ORD-A1B2C, dự kiến giao trong 25 phút.',                     '/app/track/ord-a1b2c',       0, NULL, NOW() - INTERVAL 40 MINUTE),
  (4,  2, 'payment_succeeded', 'Thanh toán thành công',    'Thanh toán VNPay cho đơn ORD-A1B2C đã hoàn tất.',                                    '/app/orders',                1, NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 6 HOUR),
  (5,  2, 'system',            'Ưu đãi mới: NOMNOM15',     'Giảm 15% cho đơn hàng tiếp theo trong tuần này.',                                    '/app/profile/promotions',    1, NOW() - INTERVAL 12 HOUR, NOW() - INTERVAL 26 HOUR),
  (6,  2, 'order_cancelled',   'Đơn hàng bị hủy',           'Đơn ORD-Z9Y8X đã bị hủy theo yêu cầu của bạn. Hoàn tiền trong 1-2 ngày.',           '/app/orders',                1, NOW() - INTERVAL 2 DAY,   NOW() - INTERVAL 3 DAY),
  -- Cinque (merchant, user 7)
  (7,  7, 'order_placed',      'Đơn hàng mới',             'Mara đặt đơn ORD-7T2RD với 2 món.',                                                  '/merchant/orders',           0, NULL, NOW() - INTERVAL 2 MINUTE),
  (8,  7, 'order_placed',      'Đơn hàng mới',             'Owen Tran đặt đơn ORD-K9XR1 với 1 món.',                                             '/merchant/orders',           0, NULL, NOW() - INTERVAL 4 MINUTE),
  (9,  7, 'payout_status',     'Yêu cầu rút tiền đã hoàn tất', 'Khoản 2.000.000 ₫ đã được chuyển vào tài khoản Vietcombank · *** 8822.',         '/merchant/wallet',           1, NOW() - INTERVAL 1 DAY,   NOW() - INTERVAL 4 DAY),
  (10, 7, 'kyc_status',        'Giấy phép sắp hết hạn',    'Giấy phép VSATTP sắp hết hạn trong 30 ngày. Hãy cập nhật.',                          '/merchant/onboarding',       0, NULL, NOW() - INTERVAL 1 DAY),
  (11, 7, 'system',            'Cập nhật chính sách',       'Chính sách hoa hồng mới áp dụng từ tháng sau (15% → 14%).',                          NULL,                          1, NOW() - INTERVAL 5 DAY,   NOW() - INTERVAL 7 DAY),
  -- Owen Reyes (driver, user 3)
  (12, 3, 'order_picked_up',   'Bạn đã nhận đơn ORD-A1B2C','Hãy đến Hachi Ramen — 1.2 km, 4 phút.',                                              '/driver/active',             0, NULL, NOW() - INTERVAL 4 MINUTE),
  (13, 3, 'payout_status',     'Yêu cầu rút tiền đang chờ duyệt', 'Khoản 480.000 ₫ đang chờ NomNom xét duyệt.',                                  '/driver/payouts',            0, NULL, NOW() - INTERVAL 2 HOUR),
  (14, 3, 'kyc_status',        'Bằng lái sắp hết hạn',     'Bằng lái xe của bạn sắp hết hạn trong 20 ngày.',                                     '/driver/onboarding',         1, NOW() - INTERVAL 12 HOUR, NOW() - INTERVAL 1 DAY),
  (15, 3, 'system',            'Thưởng tuần này',          'Hoàn thành 30 chuyến để nhận thưởng 200.000 ₫.',                                     NULL,                          1, NOW() - INTERVAL 2 DAY,   NOW() - INTERVAL 3 DAY);

-- =============================================================================
-- KẾT THÚC SEED — bật lại kiểm tra khoá ngoại.
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 1;

-- Reset AUTO_INCREMENT để dữ liệu mới do back-end tạo bắt đầu từ giá trị an toàn
-- (không trùng với các ID đã seed bên trên).
ALTER TABLE users               AUTO_INCREMENT = 100;
ALTER TABLE customer_addresses  AUTO_INCREMENT = 100;
ALTER TABLE restaurants         AUTO_INCREMENT = 100;
ALTER TABLE menu_categories     AUTO_INCREMENT = 100;
ALTER TABLE menu_items          AUTO_INCREMENT = 100;
ALTER TABLE orders              AUTO_INCREMENT = 100;
ALTER TABLE order_items         AUTO_INCREMENT = 100;
ALTER TABLE order_status_logs   AUTO_INCREMENT = 100;
ALTER TABLE payments            AUTO_INCREMENT = 100;
ALTER TABLE driver_assignments  AUTO_INCREMENT = 100;
ALTER TABLE wallets             AUTO_INCREMENT = 100;
ALTER TABLE wallet_transactions AUTO_INCREMENT = 100;
ALTER TABLE payout_requests     AUTO_INCREMENT = 100;
ALTER TABLE reviews             AUTO_INCREMENT = 100;
ALTER TABLE notifications       AUTO_INCREMENT = 100;
ALTER TABLE cuisines            AUTO_INCREMENT = 100;

-- =============================================================================
-- TÓM TẮT SỐ LƯỢNG BẢN GHI
--   platform_config     5
--   cuisines            7
--   users               22
--   user_roles          24
--   customer_addresses  10
--   customer_profiles   14
--   driver_profiles     4
--   restaurants         8
--   menu_categories     24
--   menu_items          29
--   orders              11
--   order_items         16
--   order_status_logs   13
--   payments            11
--   driver_assignments  7
--   wallets             8
--   wallet_transactions 11
--   payout_requests     5
--   reviews             3
--   notifications       15
-- =============================================================================
