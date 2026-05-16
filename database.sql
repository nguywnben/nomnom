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
-- SEED — dữ liệu khởi tạo tối thiểu để team có thể smoke-test schema
-- =============================================================================

INSERT INTO platform_config (config_key, config_value, data_type, description) VALUES
  ('default_commission_rate',   '15',     'decimal', 'Hoa hồng nền tảng (%) mặc định cho nhà hàng'),
  ('default_driver_share',      '80',     'decimal', '% phí giao hàng tài xế nhận được'),
  ('min_payout_amount',         '100000', 'int',     'Số tiền tối thiểu mỗi lần rút (VND)'),
  ('order_auto_cancel_minutes', '5',      'int',     'Số phút huỷ tự động nếu nhà hàng không xác nhận'),
  ('max_search_radius_km',      '8',      'decimal', 'Bán kính tìm kiếm tối đa (km)');

INSERT INTO cuisines (name, slug, sort_order) VALUES
  ('Ý',         'italian',  1),
  ('Mỹ',        'american', 2),
  ('Nhật',      'japanese', 3),
  ('Lành mạnh', 'healthy',  4),
  ('Mexico',    'mexican',  5),
  ('Cà phê',    'coffee',   6),
  ('Tiệm bánh', 'bakery',   7);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- END — Total: 24 tables across 8 sections.
-- =============================================================================
