-- Track Cloudinary assets so users cannot delete another account's uploads.
CREATE TABLE IF NOT EXISTS `uploaded_assets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_user_id` BIGINT UNSIGNED NOT NULL,
  `public_id` VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `secure_url` VARCHAR(1000) NOT NULL,
  `folder` VARCHAR(40) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_uploaded_assets_public_id` (`public_id`),
  KEY `idx_uploaded_assets_owner` (`owner_user_id`, `deleted_at`),
  CONSTRAINT `fk_uploaded_assets_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
