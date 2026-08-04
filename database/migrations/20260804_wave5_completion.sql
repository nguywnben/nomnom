-- Wave 5: contextual 1:1 chat for customer, merchant, and administrator workflows.

CREATE TABLE IF NOT EXISTS conversations (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_messages (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
