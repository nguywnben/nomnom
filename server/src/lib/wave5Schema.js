export async function ensureWave5Schema(pool) {
  await pool.query(`CREATE TABLE IF NOT EXISTS conversations (
    id bigint UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id bigint UNSIGNED NOT NULL,
    restaurant_id bigint UNSIGNED NOT NULL,
    participant_one_user_id bigint UNSIGNED NOT NULL,
    participant_one_role enum('customer','merchant','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
    participant_two_user_id bigint UNSIGNED NOT NULL,
    participant_two_role enum('customer','merchant','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
    subject varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
    last_message_at datetime DEFAULT NULL,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_conversation_order_pair (order_id, participant_one_user_id, participant_two_user_id),
    KEY idx_conversation_participant_one (participant_one_user_id, last_message_at),
    KEY idx_conversation_participant_two (participant_two_user_id, last_message_at),
    CONSTRAINT fk_conversation_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_participant_one FOREIGN KEY (participant_one_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_participant_two FOREIGN KEY (participant_two_user_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS chat_messages (
    id bigint UNSIGNED NOT NULL AUTO_INCREMENT,
    conversation_id bigint UNSIGNED NOT NULL,
    sender_user_id bigint UNSIGNED NOT NULL,
    body varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
    read_at datetime DEFAULT NULL,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_chat_messages_conversation (conversation_id, id),
    KEY idx_chat_messages_unread (conversation_id, read_at, sender_user_id),
    CONSTRAINT fk_chat_message_conversation FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_message_sender FOREIGN KEY (sender_user_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // Tạo bảng nhật ký đối soát hoạt động của Admin
  await pool.query(`CREATE TABLE IF NOT EXISTS audit_logs (
    id bigint UNSIGNED NOT NULL AUTO_INCREMENT,
    admin_id bigint UNSIGNED NOT NULL,
    action varchar(100) NOT NULL,
    target_type varchar(50) NOT NULL,
    target_id varchar(100) DEFAULT NULL,
    metadata json DEFAULT NULL,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_audit_logs_admin FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // Kiểm tra và thêm cột menu_item_id vào bảng reviews nếu chưa có
  const [menuItemCol] = await pool.query("SHOW COLUMNS FROM reviews LIKE 'menu_item_id'");
  if (menuItemCol.length === 0) {
    console.log('[DB] Thêm cột menu_item_id vào bảng reviews');
    await pool.query("ALTER TABLE reviews ADD COLUMN menu_item_id bigint UNSIGNED NULL");
    
    // Thêm ràng buộc khóa ngoại nếu chưa có
    try {
      await pool.query("ALTER TABLE reviews ADD CONSTRAINT fk_reviews_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL");
    } catch (e) {
      console.warn('[DB] Warning adding fk_reviews_menu_item constraint:', e.message);
    }
  }

  // Kiểm tra và thêm cột is_edited vào bảng reviews nếu chưa có
  const [isEditedCol] = await pool.query("SHOW COLUMNS FROM reviews LIKE 'is_edited'");
  if (isEditedCol.length === 0) {
    console.log('[DB] Thêm cột is_edited vào bảng reviews');
    await pool.query("ALTER TABLE reviews ADD COLUMN is_edited tinyint(1) NOT NULL DEFAULT 0");
  }

  // Kiểm tra và thêm UNIQUE KEY unique_order_item vào bảng reviews nếu chưa có
  const [indexes] = await pool.query("SHOW INDEX FROM reviews WHERE Key_name = 'unique_order_item'");
  if (indexes.length === 0) {
    console.log('[DB] Thêm UNIQUE KEY unique_order_item vào bảng reviews');
    await pool.query("ALTER TABLE reviews ADD UNIQUE KEY unique_order_item (customer_id, order_id, menu_item_id)");
  }
}

