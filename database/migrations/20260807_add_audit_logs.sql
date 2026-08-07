-- Tạo bảng lịch sử đối soát hoạt động của Admin
CREATE TABLE IF NOT EXISTS audit_logs (
  id bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id bigint UNSIGNED NOT NULL,
  action varchar(100) NOT NULL,
  target_type varchar(50) NOT NULL,
  target_id varchar(100) DEFAULT NULL,
  metadata json DEFAULT NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_audit_logs_admin FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
