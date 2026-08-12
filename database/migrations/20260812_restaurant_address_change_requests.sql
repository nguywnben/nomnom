CREATE TABLE restaurant_address_change_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  restaurant_id BIGINT UNSIGNED NOT NULL,
  requested_by_user_id BIGINT UNSIGNED NOT NULL,
  current_address_line VARCHAR(500) NOT NULL,
  current_ward VARCHAR(160) NOT NULL DEFAULT '',
  current_district VARCHAR(160) NOT NULL DEFAULT '',
  current_city VARCHAR(160) NOT NULL,
  proposed_address_line VARCHAR(500) NOT NULL,
  proposed_ward VARCHAR(160) NOT NULL DEFAULT '',
  proposed_district VARCHAR(160) NOT NULL DEFAULT '',
  proposed_city VARCHAR(160) NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  reviewed_by_admin_id BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  rejection_reason VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  pending_restaurant_id BIGINT UNSIGNED GENERATED ALWAYS AS (
    CASE WHEN status = 'pending' THEN restaurant_id ELSE NULL END
  ) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_racr_one_pending (pending_restaurant_id),
  KEY idx_racr_restaurant_status (restaurant_id, status),
  KEY idx_racr_status_created (status, created_at),
  CONSTRAINT fk_racr_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  CONSTRAINT fk_racr_requester FOREIGN KEY (requested_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_racr_reviewer FOREIGN KEY (reviewed_by_admin_id) REFERENCES users(id)
);
