-- Cập nhật hash mật khẩu seed (password123) cho mọi user demo.
-- Chạy: mysql -u root -p nomnom < server/sql/003_fix_password_hash.sql

USE nomnom;

UPDATE users
SET password_hash = '$2b$10$ntmwBKvktt8Ei.h18bxEIOqkWs9a1hgpHwX8F06cpGdx5LrYhlXYC'
WHERE password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
   OR id BETWEEN 1 AND 22;
