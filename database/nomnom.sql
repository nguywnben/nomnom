
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` bigint unsigned NOT NULL,
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_audit_logs_admin` (`admin_id`),
  CONSTRAINT `fk_audit_logs_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (41,1,'sap_xep_banner_trang_chu','home_banner','all','{\"ids\": [\"promo-lunch\", \"promo-nomnom15\", \"promo-new\"]}','2026-08-13 00:10:36'),(42,1,'sap_xep_banner_trang_chu','home_banner','all','{\"ids\": [\"promo-nomnom15\", \"promo-lunch\", \"promo-new\"]}','2026-08-13 00:10:36'),(43,1,'cap_nhat_trang_chu_khach_hang','customer_home','1',NULL,'2026-08-13 00:11:16'),(44,1,'cap_nhat_trang_chu_khach_hang','customer_home','1',NULL,'2026-08-13 00:11:32'),(45,1,'cap_nhat_banner_trang_chu','home_banner','promo-lunch','{\"title\": \"Miễn phí giao hàng cho đơn từ 500.000 ₫\"}','2026-08-13 00:12:43'),(46,1,'cap_nhat_trang_chu_khach_hang','customer_home','1',NULL,'2026-08-13 00:12:45'),(47,1,'cap_nhat_banner_trang_chu','home_banner','promo-lunch','{\"title\": \"Miễn phí giao hàng cho đơn từ 500.000 ₫\"}','2026-08-13 00:12:57'),(48,1,'cap_nhat_trang_chu_khach_hang','customer_home','1',NULL,'2026-08-13 00:12:58'),(49,1,'cap_nhat_trang_chu_khach_hang','customer_home','1',NULL,'2026-08-13 00:13:15'),(50,1,'cap_nhat_trang_chu_khach_hang','customer_home','1',NULL,'2026-08-13 00:13:27'),(51,1,'cap_nhat_trang_chu_khach_hang','customer_home','1',NULL,'2026-08-13 00:14:45'),(52,1,'cap_nhat_trang_chu_khach_hang','customer_home','1',NULL,'2026-08-13 00:14:56'),(53,1,'cap_nhat_trang_chu_khach_hang','customer_home','1',NULL,'2026-08-13 00:15:09'),(54,1,'cap_nhat_trang_chu_khach_hang','customer_home','1',NULL,'2026-08-13 00:15:16'),(55,1,'cap_nhat_trang_chu_khach_hang','customer_home','1',NULL,'2026-08-13 00:15:21'),(56,1,'cap_nhat_trang_chu_khach_hang','customer_home','1',NULL,'2026-08-13 00:15:25'),(57,1,'sap_xep_loai_am_thuc','cuisine','all','{\"thuTuIds\": [2, 1, 3, 4, 5, 6, 7, 100]}','2026-08-13 00:18:40'),(58,1,'sap_xep_loai_am_thuc','cuisine','all','{\"thuTuIds\": [1, 2, 3, 4, 5, 6, 7, 100]}','2026-08-13 00:18:40'),(59,1,'cap_nhat_trang_chu_khach_hang','customer_home','1',NULL,'2026-08-13 00:19:11'),(60,1,'cap_nhat_trang_chu_khach_hang','customer_home','1',NULL,'2026-08-13 00:19:16'),(61,1,'cap_nhat_trang_chu_khach_hang','customer_home','1',NULL,'2026-08-13 00:19:21');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cart_id` bigint unsigned NOT NULL,
  `menu_item_id` bigint unsigned NOT NULL,
  `quantity` smallint unsigned NOT NULL DEFAULT '1',
  `unit_price` bigint unsigned NOT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ci_cart` (`cart_id`),
  KEY `fk_ci_item` (`menu_item_id`),
  CONSTRAINT `fk_ci_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ci_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES (6,4,109,1,35000,NULL,'2026-08-13 01:45:36','2026-08-13 01:45:36');
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `restaurant_id` bigint unsigned NOT NULL,
  `status` enum('active','converted','abandoned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cart_active` (`customer_id`,`restaurant_id`,`status`),
  KEY `fk_cart_rest` (`restaurant_id`),
  CONSTRAINT `fk_cart_cust` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
INSERT INTO `carts` VALUES (4,108,110,'active','2026-08-13 01:45:36','2026-08-13 01:45:36');
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint unsigned NOT NULL,
  `sender_user_id` bigint unsigned NOT NULL,
  `body` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_conversation` (`conversation_id`,`id`),
  KEY `idx_chat_messages_unread` (`conversation_id`,`read_at`,`sender_user_id`),
  KEY `fk_chat_message_sender` (`sender_user_id`),
  CONSTRAINT `fk_chat_message_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_message_sender` FOREIGN KEY (`sender_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `restaurant_id` bigint unsigned NOT NULL,
  `participant_one_user_id` bigint unsigned NOT NULL,
  `participant_one_role` enum('customer','merchant','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `participant_two_user_id` bigint unsigned NOT NULL,
  `participant_two_role` enum('customer','merchant','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_message_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_conversation_order_pair` (`order_id`,`participant_one_user_id`,`participant_two_user_id`),
  KEY `idx_conversation_participant_one` (`participant_one_user_id`,`last_message_at`),
  KEY `idx_conversation_participant_two` (`participant_two_user_id`,`last_message_at`),
  KEY `fk_conversation_restaurant` (`restaurant_id`),
  CONSTRAINT `fk_conversation_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversation_participant_one` FOREIGN KEY (`participant_one_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversation_participant_two` FOREIGN KEY (`participant_two_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversation_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `cuisines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuisines` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `cuisines` WRITE;
/*!40000 ALTER TABLE `cuisines` DISABLE KEYS */;
INSERT INTO `cuisines` VALUES (1,'Ý','italian','https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',1,1,'2026-05-21 21:42:10','2026-08-13 00:18:40'),(2,'Mỹ','american','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',2,1,'2026-05-21 21:42:10','2026-08-13 00:18:40'),(3,'Nhật','japanese','https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',3,1,'2026-05-21 21:42:10','2026-08-12 13:18:41'),(4,'Lành mạnh','healthy','https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',4,1,'2026-05-21 21:42:10','2026-08-12 13:18:41'),(5,'Mexico','mexican','https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',5,1,'2026-05-21 21:42:10','2026-08-12 13:18:41'),(6,'Cà phê','coffee','https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',6,1,'2026-05-21 21:42:10','2026-08-12 13:18:41'),(7,'Tiệm bánh','bakery','https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',7,1,'2026-05-21 21:42:10','2026-08-12 13:18:41'),(100,'Việt Nam','vietnamese','https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=80',8,1,'2026-08-12 22:54:00','2026-08-12 22:54:00');
/*!40000 ALTER TABLE `cuisines` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `customer_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_addresses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `label` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `line1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ward` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ghn_province_id` int unsigned DEFAULT NULL,
  `ghn_district_id` int unsigned DEFAULT NULL,
  `ghn_ward_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `delivery_note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_addr_customer` (`customer_id`),
  KEY `idx_customer_addresses_ghn_route` (`ghn_district_id`,`ghn_ward_code`),
  CONSTRAINT `fk_addr_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `customer_addresses` WRITE;
/*!40000 ALTER TABLE `customer_addresses` DISABLE KEYS */;
INSERT INTO `customer_addresses` VALUES (1,2,'Nhà','Mara Chen','+84901000002','120 Wythe Ave, Apt 3B','P. Bến Nghé','Q.1','TP. Hồ Chí Minh',NULL,NULL,NULL,10.7795000,106.6991000,'Bấm chuông căn hộ 3B',1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(2,2,'Văn phòng','Mara Chen','+84901000002','88 Holloway St, Tầng 4','P. Bến Thành','Q.1','TP. Hồ Chí Minh',NULL,NULL,NULL,10.7715000,106.6981000,'Để tại quầy lễ tân nếu vắng',0,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(3,15,'Nhà','Owen Tran','+84901000015','301 Carroll St','P. Đa Kao','Q.1','TP. Hồ Chí Minh',NULL,NULL,NULL,10.7873000,106.6919000,NULL,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(4,16,'Nhà','Rae Pham','+84901000016','14 W 10th St','P. 6','Q. Bình Thạnh','TP. Hồ Chí Minh',NULL,NULL,NULL,10.8030000,106.7100000,NULL,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(5,17,'Nhà','Lia Do','+84901000017','24 Bedford Ave','P. 17','Q. Bình Thạnh','TP. Hồ Chí Minh',NULL,NULL,NULL,10.8055000,106.7068000,NULL,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(6,18,'Nhà','Sam Kim','+84901000018','6 Smith St','P. Tân Định','Q.1','TP. Hồ Chí Minh',NULL,NULL,NULL,10.7896000,106.6907000,NULL,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(7,19,'Nhà','Kai Vu','+84901000019','88 W 4th St','P. Cô Giang','Q.1','TP. Hồ Chí Minh',NULL,NULL,NULL,10.7660000,106.6960000,NULL,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(8,20,'Nhà','Jamie Phan','+84901000020','15 Greenpoint Ave','P. Tân Phong','Q.7','TP. Hồ Chí Minh',NULL,NULL,NULL,10.7305000,106.7218000,NULL,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(9,21,'Nhà','Daniel Le','+84901000021','209 Avenue B','P. 12','Q. Tân Bình','TP. Hồ Chí Minh',NULL,NULL,NULL,10.8004000,106.6437000,NULL,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(10,22,'Nhà','Sky Reyes','+84901000022','4 Sakura Ln','P. 9','Q. Phú Nhuận','TP. Hồ Chí Minh',NULL,NULL,NULL,10.7990000,106.6791000,NULL,1,'2026-05-21 21:42:10','2026-05-21 21:42:10');
/*!40000 ALTER TABLE `customer_addresses` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `customer_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_profiles` (
  `user_id` bigint unsigned NOT NULL,
  `default_address_id` bigint unsigned DEFAULT NULL,
  `preferred_language` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'vi',
  `marketing_opt_in` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  KEY `fk_cust_default_addr` (`default_address_id`),
  CONSTRAINT `fk_cust_default_addr` FOREIGN KEY (`default_address_id`) REFERENCES `customer_addresses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cust_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `customer_profiles` WRITE;
/*!40000 ALTER TABLE `customer_profiles` DISABLE KEYS */;
INSERT INTO `customer_profiles` VALUES (2,1,'vi',1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(3,NULL,'vi',1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(4,NULL,'vi',1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(6,NULL,'vi',1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(7,NULL,'vi',0,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(8,NULL,'vi',0,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(15,3,'vi',1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(16,4,'vi',1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(17,5,'vi',1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(18,6,'vi',1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(19,7,'vi',0,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(20,8,'vi',1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(21,9,'vi',1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(22,10,'vi',1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(100,NULL,'vi',1,'2026-05-21 21:55:26','2026-05-21 21:55:26'),(102,NULL,'vi',1,'2026-05-21 22:31:26','2026-05-21 22:31:26'),(103,NULL,'vi',1,'2026-05-22 20:41:26','2026-05-22 20:41:26');
/*!40000 ALTER TABLE `customer_profiles` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `customer_saved_vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_saved_vouchers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `voucher_id` bigint unsigned NOT NULL,
  `saved_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_voucher` (`customer_id`,`voucher_id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_voucher` (`voucher_id`),
  CONSTRAINT `fk_saved_vouchers_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_saved_vouchers_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `customer_saved_vouchers` WRITE;
/*!40000 ALTER TABLE `customer_saved_vouchers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_saved_vouchers` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `driver_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_assignments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `driver_id` bigint unsigned NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `arrived_pickup_at` datetime DEFAULT NULL,
  `picked_up_at` datetime DEFAULT NULL,
  `arrived_dropoff_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `status` enum('assigned','en_route_pickup','at_pickup','picked_up','en_route_dropoff','at_dropoff','delivered','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'assigned',
  `distance_km` decimal(6,2) NOT NULL DEFAULT '0.00',
  `earning_amount` bigint unsigned NOT NULL DEFAULT '0',
  `proof_photo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `idx_da_driver` (`driver_id`,`status`),
  CONSTRAINT `fk_da_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_da_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `driver_assignments` WRITE;
/*!40000 ALTER TABLE `driver_assignments` DISABLE KEYS */;
INSERT INTO `driver_assignments` VALUES (1,1,3,'2026-05-21 21:32:10','2026-05-21 21:36:10','2026-05-21 21:39:10',NULL,NULL,'en_route_dropoff',3.40,49600,NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(2,2,3,'2026-05-20 19:57:10','2026-05-20 20:12:10','2026-05-20 20:22:10','2026-05-20 20:37:10','2026-05-20 20:42:10','delivered',1.80,40000,'https://placehold.co/600x400?text=Proof+Q3K9P','2026-05-21 21:42:10','2026-05-21 21:42:10'),(3,7,4,'2026-05-21 20:52:10','2026-05-21 21:04:10','2026-05-21 21:12:10','2026-05-21 21:24:10','2026-05-21 21:27:10','delivered',2.10,49600,'https://placehold.co/600x400?text=Proof+P9X22','2026-05-21 21:42:10','2026-05-21 21:42:10'),(4,8,6,'2026-05-21 20:22:10','2026-05-21 20:37:10','2026-05-21 20:47:10','2026-05-21 21:00:10','2026-05-21 21:02:10','delivered',1.40,49600,'https://placehold.co/600x400?text=Proof+J11HQ','2026-05-21 21:42:10','2026-05-21 21:42:10'),(5,9,3,'2026-05-18 21:42:10','2026-05-18 21:42:10','2026-05-18 21:42:10','2026-05-18 21:42:10','2026-05-18 21:42:10','delivered',5.40,49600,'https://placehold.co/600x400?text=Proof+RV001','2026-05-21 21:42:10','2026-05-21 21:42:10'),(6,10,4,'2026-05-14 21:42:10','2026-05-14 21:42:10','2026-05-14 21:42:10','2026-05-14 21:42:10','2026-05-14 21:42:10','delivered',6.80,49600,'https://placehold.co/600x400?text=Proof+RV002','2026-05-21 21:42:10','2026-05-21 21:42:10'),(7,11,6,'2026-05-07 21:42:10','2026-05-07 21:42:10','2026-05-07 21:42:10','2026-05-07 21:42:10','2026-05-07 21:42:10','delivered',3.10,49600,'https://placehold.co/600x400?text=Proof+RV003','2026-05-21 21:42:10','2026-05-21 21:42:10');
/*!40000 ALTER TABLE `driver_assignments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `driver_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_profiles` (
  `user_id` bigint unsigned NOT NULL,
  `national_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_license_no` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_type` enum('motorbike','bicycle','car') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'motorbike',
  `vehicle_model` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_plate` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_card_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_license_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `portrait_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_no` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_holder` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating_avg` decimal(3,2) NOT NULL DEFAULT '0.00',
  `total_trips` int unsigned NOT NULL DEFAULT '0',
  `approval_status` enum('pending','approved','rejected','suspended') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_at` datetime DEFAULT NULL,
  `approved_by_admin_id` bigint unsigned DEFAULT NULL,
  `is_online` tinyint(1) NOT NULL DEFAULT '0',
  `current_lat` decimal(10,7) DEFAULT NULL,
  `current_lng` decimal(10,7) DEFAULT NULL,
  `last_location_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `national_id` (`national_id`),
  KEY `idx_drv_online` (`is_online`),
  KEY `idx_drv_status` (`approval_status`),
  KEY `fk_drv_approver` (`approved_by_admin_id`),
  CONSTRAINT `fk_drv_approver` FOREIGN KEY (`approved_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_drv_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `driver_profiles` WRITE;
/*!40000 ALTER TABLE `driver_profiles` DISABLE KEYS */;
INSERT INTO `driver_profiles` VALUES (3,'079203011234','B2-1234567','motorbike','Honda CB300R','59X1-12345','https://placehold.co/600x400?text=ID+Owen','https://placehold.co/600x400?text=DL+Owen','https://placehold.co/600x400?text=Owen','1903456789','Techcombank','OWEN REYES',4.92,1840,'approved','2026-05-21 21:42:10',1,1,10.7790000,106.6995000,'2026-05-21 21:42:10','2026-05-21 21:42:10','2026-05-21 21:42:10'),(4,'079203011235','A2-2233445','motorbike','Yamaha Sirius','59A1-44882','https://placehold.co/600x400?text=ID+Iris','https://placehold.co/600x400?text=DL+Iris','https://placehold.co/600x400?text=Iris','060034882001','Vietcombank','IRIS MENDEZ',4.88,1102,'approved','2026-05-21 21:42:10',1,0,10.7700000,106.7000000,'2026-05-21 21:42:10','2026-05-21 21:42:10','2026-05-21 21:42:10'),(5,'079203011236',NULL,'motorbike','Honda Wave','51X3-66120','https://placehold.co/600x400?text=ID+Felix',NULL,NULL,NULL,NULL,NULL,0.00,0,'pending',NULL,NULL,0,NULL,NULL,NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(6,'079203011237','A2-1199223','motorbike','Honda Future','51X1-89712','https://placehold.co/600x400?text=ID+Sasha','https://placehold.co/600x400?text=DL+Sasha','https://placehold.co/600x400?text=Sasha','1119876543','BIDV','SASHA PARK',4.85,768,'approved','2026-05-21 21:42:10',1,1,10.7820000,106.6960000,'2026-05-21 21:42:10','2026-05-21 21:42:10','2026-05-21 21:42:10');
/*!40000 ALTER TABLE `driver_profiles` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `home_page_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `home_page_settings` (
  `id` tinyint unsigned NOT NULL,
  `config_json` json NOT NULL,
  `updated_by_admin_id` bigint unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `home_page_settings` WRITE;
/*!40000 ALTER TABLE `home_page_settings` DISABLE KEYS */;
INSERT INTO `home_page_settings` VALUES (1,'{\"hero\": {\"title\": \"Đói bụng? Đặt món ngay.\", \"imageUrl\": \"https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1800&q=80\", \"subtitle\": \"Khám phá món ngon giao siêu tốc từ các quán ăn hàng đầu quanh bạn.\"}, \"moods\": [{\"id\": \"comfort\", \"label\": \"Món ăn quen thuộc\", \"linkUrl\": \"/app/search?cuisine=american\", \"imageUrl\": \"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80\", \"subtitle\": \"Burger, mì Ý, mì ramen\", \"isVisible\": true, \"sortOrder\": 1}, {\"id\": \"healthy\", \"label\": \"Món ăn tốt cho sức khỏe\", \"linkUrl\": \"/app/search?cuisine=healthy\", \"imageUrl\": \"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80\", \"subtitle\": \"Rau xanh, ngũ cốc, protein\", \"isVisible\": true, \"sortOrder\": 2}, {\"id\": \"sweet\", \"label\": \"Món ngọt\", \"linkUrl\": \"/app/search?cuisine=bakery\", \"imageUrl\": \"https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80\", \"subtitle\": \"Bánh ngọt, bánh donut, kem\", \"isVisible\": true, \"sortOrder\": 3}, {\"id\": \"fast\", \"label\": \"Ăn nhẹ\", \"linkUrl\": \"/app/search?cuisine=mexican\", \"imageUrl\": \"https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80\", \"subtitle\": \"Sẵn sàng dưới 25 phút\", \"isVisible\": true, \"sortOrder\": 4}], \"sections\": [{\"id\": \"cuisines\", \"label\": \"Loại hình ẩm thực\", \"isVisible\": true, \"sortOrder\": 1}, {\"id\": \"featured-dishes\", \"label\": \"Món nổi bật từ nhiều quán\", \"isVisible\": true, \"sortOrder\": 2}, {\"id\": \"nearby-dishes\", \"label\": \"Các món gần bạn\", \"isVisible\": true, \"sortOrder\": 3}, {\"id\": \"promos\", \"label\": \"Banner chiến dịch\", \"isVisible\": true, \"sortOrder\": 4}, {\"id\": \"trending\", \"label\": \"Thịnh hành\", \"isVisible\": true, \"sortOrder\": 5}, {\"id\": \"order-again\", \"label\": \"Đặt lại món\", \"isVisible\": true, \"sortOrder\": 6}, {\"id\": \"featured-restaurants\", \"label\": \"Quán ăn nổi bật\", \"isVisible\": true, \"sortOrder\": 7}, {\"id\": \"moods\", \"label\": \"Theo tâm trạng\", \"isVisible\": true, \"sortOrder\": 8}, {\"id\": \"partner\", \"label\": \"Hợp tác với NomNom\", \"isVisible\": true, \"sortOrder\": 9}]}',1,'2026-08-13 00:19:21');
/*!40000 ALTER TABLE `home_page_settings` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `home_promo_banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `home_promo_banners` (
  `id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tag` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cta_label` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `link_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hpb_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `home_promo_banners` WRITE;
/*!40000 ALTER TABLE `home_promo_banners` DISABLE KEYS */;
INSERT INTO `home_promo_banners` VALUES ('promo-lunch','Trưa · 11–2','Miễn phí giao hàng cho đơn từ 500.000 ₫','Tránh giờ cao điểm văn phòng · T2–T6','Đặt bữa trưa','https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1000&q=80','/app/search',2,1,'2026-05-21 21:42:10'),('promo-new','Mới mở','5 bếp mới tuần này','Thử ngay trước khi kín chỗ','Khám phá','https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1000&q=80','/app/search',3,1,'2026-05-21 21:42:10'),('promo-nomnom15','Sử dụng NOMNOM15','Giảm 15% cho đơn hàng đầu tiên','Mỗi khách hàng một mã khuyến mãi · Giảm tối đa 250.000 ₫','Nhận ngay','https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=80','/app/profile/promotions',1,1,'2026-05-21 21:42:10');
/*!40000 ALTER TABLE `home_promo_banners` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `menu_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `restaurant_id` bigint unsigned NOT NULL,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mcat_rest` (`restaurant_id`),
  CONSTRAINT `fk_mcat_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `menu_categories` WRITE;
/*!40000 ALTER TABLE `menu_categories` DISABLE KEYS */;
INSERT INTO `menu_categories` VALUES (1,1,'Cổ điển',NULL,1,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(2,1,'Đặc sản',NULL,2,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(3,1,'Món phụ',NULL,3,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(4,1,'Tráng miệng',NULL,4,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(5,2,'Hamburger',NULL,1,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(6,2,'Bánh mì kẹp',NULL,2,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(7,2,'Món phụ',NULL,3,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(8,2,'Đồ uống',NULL,4,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(9,3,'Nigiri',NULL,1,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(10,3,'Tô trộn',NULL,2,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(11,3,'Cuộn',NULL,3,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(12,3,'Món phụ',NULL,4,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(13,4,'Tô trộn',NULL,1,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(14,4,'Đồ uống',NULL,2,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(15,5,'Ramen',NULL,1,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(16,5,'Món phụ',NULL,2,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(17,6,'Tacos',NULL,1,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(18,6,'Burritos',NULL,2,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(19,6,'Món phụ',NULL,3,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(20,6,'Đồ uống',NULL,4,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(21,7,'Cà phê',NULL,1,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(22,7,'Bánh ngọt',NULL,2,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(23,7,'Brunch',NULL,3,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(24,8,'Donuts',NULL,1,1,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(100,108,'Cơm phần',NULL,1,1,'2026-08-12 22:54:00','2026-08-12 22:54:00'),(101,108,'Món nước',NULL,2,1,'2026-08-12 22:54:00','2026-08-12 22:54:00'),(102,109,'Cà phê',NULL,1,1,'2026-08-12 22:54:00','2026-08-12 22:54:00'),(103,109,'Bánh ngọt',NULL,2,1,'2026-08-12 22:54:00','2026-08-12 22:54:00'),(104,110,'Ăn vặt',NULL,1,1,'2026-08-12 22:54:00','2026-08-12 22:54:00'),(105,110,'Nước uống',NULL,2,1,'2026-08-12 22:54:00','2026-08-12 22:54:00'),(107,115,'Món nước',NULL,1,1,'2026-08-13 00:47:38','2026-08-13 00:47:38'),(108,115,'Món thêm',NULL,2,1,'2026-08-13 00:47:38','2026-08-13 00:47:38'),(109,116,'Cơm gà',NULL,1,1,'2026-08-13 00:47:38','2026-08-13 00:47:38'),(110,116,'Món kèm',NULL,2,1,'2026-08-13 00:47:38','2026-08-13 00:47:38'),(111,117,'Trà trái cây',NULL,1,1,'2026-08-13 00:47:38','2026-08-13 00:47:38'),(112,117,'Cà phê và bánh',NULL,2,1,'2026-08-13 00:47:38','2026-08-13 00:47:38');
/*!40000 ALTER TABLE `menu_categories` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `restaurant_id` bigint unsigned NOT NULL,
  `category_id` bigint unsigned NOT NULL,
  `name` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` bigint unsigned NOT NULL,
  `prep_time_min` smallint unsigned NOT NULL DEFAULT '15',
  `in_stock` tinyint(1) NOT NULL DEFAULT '1',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` smallint NOT NULL DEFAULT '0',
  `total_sold` int unsigned NOT NULL DEFAULT '0',
  `rating_avg` decimal(3,2) NOT NULL DEFAULT '0.00',
  `status` enum('active','hidden') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_item_rest` (`restaurant_id`),
  KEY `idx_item_category` (`category_id`),
  KEY `idx_item_status` (`status`),
  CONSTRAINT `fk_item_cat` FOREIGN KEY (`category_id`) REFERENCES `menu_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_item_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
INSERT INTO `menu_items` VALUES (1,1,1,'Margherita','Cà chua San Marzano, phô mai tươi, húng quế.','https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',89000,18,1,1,1,184,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:11:43'),(2,1,1,'Funghi','Nấm Crimini, phô mai taleggio, cỏ xạ hương, dầu truffle.','https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&w=800&q=80',115000,20,1,0,2,96,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:11:43'),(3,1,2,'Salsiccia','Xúc xích thì là, phô mai mozzarella xông khói, ớt.','https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?auto=format&fit=crop&w=800&q=80',125000,22,1,1,1,71,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:11:43'),(4,1,3,'Burrata Salad','Cà chua gia truyền, dầu húng quế, muối biển.','https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=800&q=80',95000,10,1,0,1,58,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:11:43'),(5,1,4,'Tiramisu','Phô mai Mascarpone, espresso, ca cao.','https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',59000,5,0,0,1,42,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:11:43'),(6,2,5,'Cổ điển','Thịt bò đập dập gấp đôi, phô mai Mỹ, sốt bí mật.','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',99000,14,1,1,1,228,5.00,'active','2026-05-21 21:42:10','2026-08-13 01:47:48'),(7,2,5,'Cheddar Bacon','Phô mai Cheddar ủ, thịt xông khói ngào đường, dưa chuột muối.','https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=80',115000,16,1,0,2,146,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:47:48'),(8,2,6,'Gà giòn','Gà chiên sữa bơ, salad bắp cải, mật ong cay.','https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80',105000,18,1,0,1,94,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:47:48'),(9,2,7,'Khoai tây chiên','Cắt tay, muối biển, thảo mộc.','https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',35000,8,1,0,1,322,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:47:48'),(10,2,8,'Vanilla Shake','Vani Madagascar, kem tươi.','https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',49000,5,1,0,1,90,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:47:48'),(11,3,9,'Set Nigiri (8 miếng)','Cá ngừ, cá hồi, cá đuôi vàng, tôm.','https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',249000,30,1,1,1,152,5.00,'active','2026-05-21 21:42:10','2026-08-13 01:47:48'),(12,3,10,'Cơm bát cá hồi','Cơm sushi, cá hồi, bơ, đậu nành Nhật.','https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',159000,25,1,0,1,94,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:47:48'),(13,3,11,'Spicy Tuna Roll','Cá ngừ vây vàng, dầu ớt, hành lá.','https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=800&q=80',139000,20,1,0,1,70,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:47:48'),(14,3,12,'Súp Miso','Miso trắng, đậu phụ, hành lá.','https://images.unsplash.com/photo-1607301405390-d831c242f59b?auto=format&fit=crop&w=800&q=80',35000,8,1,0,1,112,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:47:48'),(15,4,13,'Tô mùa vụ','Diêm mạch, cải xoăn, bí đỏ, sốt mè.','https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',89000,12,1,1,1,64,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:11:43'),(16,4,13,'Buddha Bowl','Cơm lứt, đậu phụ, đậu nành Nhật, gừng.','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',95000,14,1,0,2,52,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:11:43'),(17,4,14,'Sinh tố xanh','Cải xoăn, chuối, hạnh nhân, hạt gai dầu.','https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=800&q=80',55000,5,1,0,1,38,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:11:43'),(18,5,15,'Tonkotsu Ramen','Nước dùng xương heo, xá xíu, trứng ngâm tương.','https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',119000,18,1,1,1,276,5.00,'active','2026-05-21 21:42:10','2026-08-13 01:47:48'),(19,5,15,'Miso Ramen','Miso đỏ, thịt heo xay, ngô.','https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=800&q=80',109000,18,1,0,2,176,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:47:48'),(20,5,16,'Gyoza (6 miếng)','Sủi cảo heo, sốt ponzu.','https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80',59000,8,1,0,1,222,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:47:48'),(21,6,17,'Tacos al Pastor (3 chiếc)','Dứa, ngò rí, hành tây.','https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',99000,12,1,1,1,184,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:11:43'),(22,6,18,'Burrito Carnitas','Thịt heo ninh nhừ, cơm, đậu, sốt salsa xanh.','https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80',119000,15,1,0,1,96,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:11:43'),(23,6,19,'Elote','Ngô nướng cháy cạnh, chanh, phô mai cotija.','https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',39000,8,1,0,1,70,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:11:43'),(24,6,20,'Horchata','Sữa gạo, quế, vani.','https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=800&q=80',35000,4,1,0,1,52,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:11:43'),(25,7,21,'Flat White','Cà phê espresso kép, bọt sữa mịn.','https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',49000,5,1,1,1,418,4.00,'active','2026-05-21 21:42:10','2026-08-13 01:47:48'),(26,7,22,'Bánh sừng bò hạnh nhân','Kem frangipane, hạnh nhân nướng.','https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',45000,3,1,0,1,222,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:47:48'),(27,7,23,'Bánh mì bơ','Bánh mì men tự nhiên, ớt, chanh, muối biển.','https://plus.unsplash.com/premium_photo-1675604221056-91821ac2df07?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',59000,10,1,0,1,156,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:47:48'),(28,8,24,'Donut phủ đường cổ điển','Lớp phủ vani, bánh donut men.','https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',30000,4,1,1,1,88,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:11:43'),(29,8,24,'Maple Bacon','Lớp phủ phong, thịt xông khói ngào đường.','https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80',39000,5,1,0,2,46,0.00,'active','2026-05-21 21:42:10','2026-08-13 01:11:43'),(100,108,100,'Cơm sườn nướng','Sườn nướng, trứng ốp la, đồ chua và canh trong ngày.','https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=80',48000,15,1,1,1,140,5.00,'active','2026-08-12 22:54:00','2026-08-13 01:47:48'),(101,108,100,'Cơm gà xối mỡ','Gà chiên giòn, cơm trắng, dưa chua và nước chấm.','https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',52000,18,1,1,2,96,0.00,'active','2026-08-12 22:54:00','2026-08-13 01:47:48'),(102,108,101,'Canh chua cá','Canh chua thanh vị, dùng kèm cơm trắng.','https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',35000,12,1,0,1,53,0.00,'active','2026-08-12 22:54:00','2026-08-13 01:47:48'),(103,108,101,'Trà tắc mật ong','Trà tắc mát lạnh, ít ngọt.','https://images.unsplash.com/photo-1712056407267-1a38c7024a8f?auto=format&fit=crop&w=800&q=80',18000,4,1,0,2,69,0.00,'active','2026-08-12 22:54:00','2026-08-13 01:47:48'),(104,109,102,'Cà phê sữa đá','Cà phê rang đậm, sữa đặc và đá viên.','https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',22000,5,1,1,1,194,4.00,'active','2026-08-12 22:54:00','2026-08-13 01:47:48'),(105,109,102,'Bạc xỉu','Sữa tươi, cà phê và đá mát lạnh.','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',28000,5,1,1,2,120,0.00,'active','2026-08-12 22:54:00','2026-08-13 01:47:48'),(106,109,103,'Bánh croissant bơ','Croissant nướng nóng, thơm bơ.','https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',30000,6,1,0,1,76,0.00,'active','2026-08-12 22:54:00','2026-08-13 01:47:48'),(107,109,103,'Tiramisu ly','Kem mascarpone, cacao và cà phê.','https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',42000,5,1,0,2,45,0.00,'active','2026-08-12 22:54:00','2026-08-13 01:47:48'),(108,110,104,'Bánh tráng trộn','Bánh tráng, xoài, trứng cút và sốt me.','https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=800&q=80',25000,7,1,1,1,157,5.00,'active','2026-08-12 22:54:00','2026-08-13 01:47:48'),(109,110,104,'Xiên que thập cẩm','Năm xiên chiên nóng, kèm tương ớt.','https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',35000,10,1,1,2,90,0.00,'active','2026-08-12 22:54:00','2026-08-13 01:47:48'),(110,110,105,'Trà đào cam sả','Trà đào thơm, lát cam và sả tươi.','https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',30000,5,1,0,1,104,0.00,'active','2026-08-12 22:54:00','2026-08-13 01:47:48'),(111,110,105,'Nước mơ ngâm','Nước mơ ngâm, chua ngọt vừa phải.','https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',22000,4,1,0,2,61,0.00,'active','2026-08-12 22:54:00','2026-08-13 01:47:48'),(115,115,107,'Bún cá đặc biệt','Bún cá, chả cá, rau sống và nước dùng thanh ngọt.','https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',48000,16,1,1,1,134,5.00,'active','2026-08-13 00:47:38','2026-08-13 01:47:48'),(116,115,107,'Bún chả cá','Chả cá dai mềm, bún tươi và rau ăn kèm.','https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=800&q=80',42000,14,1,1,2,90,0.00,'active','2026-08-13 00:47:38','2026-08-13 01:47:48'),(117,115,108,'Chả cá chiên','Chả cá chiên vàng, dùng kèm rau và nước chấm.','https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80',30000,10,1,0,1,59,0.00,'active','2026-08-13 00:47:38','2026-08-13 01:47:48'),(118,115,108,'Trà sâm mát','Trà thảo mộc thanh nhẹ, giảm ngọt.','https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',18000,4,1,0,2,51,0.00,'active','2026-08-13 00:47:38','2026-08-13 01:47:48'),(119,116,109,'Cơm gà xối mỡ','Gà giòn bên ngoài, mềm bên trong, dùng cùng cơm và đồ chua.','https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',52000,18,1,1,1,150,5.00,'active','2026-08-13 00:47:38','2026-08-13 01:47:48'),(120,116,109,'Cơm gà quay','Đùi gà quay đậm vị, cơm nóng và rau ăn kèm.','https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80',55000,18,1,1,2,99,0.00,'active','2026-08-13 00:47:38','2026-08-13 01:47:48'),(121,116,110,'Gà giòn không xương','Gà chiên giòn vừa miếng, kèm sốt riêng.','https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',45000,14,1,0,1,75,0.00,'active','2026-08-13 00:47:38','2026-08-13 01:47:48'),(122,116,110,'Canh rong biển','Canh rong biển nhẹ vị dùng kèm cơm gà.','https://images.unsplash.com/photo-1607301405390-d831c242f59b?auto=format&fit=crop&w=800&q=80',18000,7,1,0,2,40,0.00,'active','2026-08-13 00:47:38','2026-08-13 01:47:48'),(123,117,111,'Trà đào cam sả','Trà đào, cam tươi và sả thơm, điều chỉnh độ ngọt.','https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',32000,6,1,1,1,127,4.00,'active','2026-08-13 00:47:38','2026-08-13 01:47:48'),(124,117,111,'Trà chanh mật ong','Trà chanh, mật ong và bạc hà tươi.','https://images.unsplash.com/photo-1712056407267-1a38c7024a8f?auto=format&fit=crop&w=800&q=80',30000,5,1,1,2,93,0.00,'active','2026-08-13 00:47:38','2026-08-13 01:47:48'),(125,117,112,'Cà phê sữa đá','Cà phê rang đậm pha cùng sữa đặc.','https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',25000,5,1,0,1,136,0.00,'active','2026-08-13 00:47:38','2026-08-13 01:47:48'),(126,117,112,'Bánh croissant bơ','Croissant nướng nóng, lớp vỏ giòn nhẹ.','https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',30000,7,1,0,2,64,0.00,'active','2026-08-13 00:47:38','2026-08-13 01:47:48');
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `type` enum('order_placed','order_accepted','order_ready','order_picked_up','order_delivered','order_cancelled','payment_succeeded','payment_failed','payout_status','kyc_status','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `link_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`user_id`,`is_read`,`created_at`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7007 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,2,'order_delivered','Đơn hàng đã giao','Đơn ORD-A1B2C đã được giao tới bạn. Hãy đánh giá tài xế nhé!','/app/reviews/ord-a1b2c',0,NULL,'2026-05-21 21:37:10'),(2,2,'order_picked_up','Tài xế đã lấy hàng','Tài xế Owen đang trên đường đến địa chỉ của bạn.','/app/track/ord-a1b2c',0,NULL,'2026-05-21 21:17:10'),(3,2,'order_accepted','Quán đã xác nhận đơn','Hachi Ramen đã nhận đơn ORD-A1B2C, dự kiến giao trong 25 phút.','/app/track/ord-a1b2c',0,NULL,'2026-05-21 21:02:10'),(4,2,'payment_succeeded','Thanh toán thành công','Thanh toán VNPay cho đơn ORD-A1B2C đã hoàn tất.','/app/orders',1,'2026-05-21 18:42:10','2026-05-21 15:42:10'),(5,2,'system','Ưu đãi mới: NOMNOM15','Giảm 15% cho đơn hàng tiếp theo trong tuần này.','/app/profile/promotions',1,'2026-05-21 09:42:10','2026-05-20 19:42:10'),(6,2,'order_cancelled','Đơn hàng bị hủy','Đơn ORD-Z9Y8X đã bị hủy theo yêu cầu của bạn. Hoàn tiền trong 1-2 ngày.','/app/orders',1,'2026-05-19 21:42:10','2026-05-18 21:42:10'),(7,7,'order_placed','Đơn hàng mới','Mara đặt đơn ORD-7T2RD với 2 món.','/merchant/orders',0,NULL,'2026-05-21 21:40:10'),(8,7,'order_placed','Đơn hàng mới','Owen Tran đặt đơn ORD-K9XR1 với 1 món.','/merchant/orders',0,NULL,'2026-05-21 21:38:10'),(9,7,'payout_status','Yêu cầu rút tiền đã hoàn tất','Khoản 2.000.000 ₫ đã được chuyển vào tài khoản Vietcombank · *** 8822.','/merchant/wallet',1,'2026-05-20 21:42:10','2026-05-17 21:42:10'),(10,7,'kyc_status','Giấy phép sắp hết hạn','Giấy phép VSATTP sắp hết hạn trong 30 ngày. Hãy cập nhật.','/merchant/onboarding',0,NULL,'2026-05-20 21:42:10'),(11,7,'system','Cập nhật chính sách','Chính sách hoa hồng mới áp dụng từ tháng sau (15% → 14%).',NULL,1,'2026-05-16 21:42:10','2026-05-14 21:42:10'),(12,3,'order_picked_up','Bạn đã nhận đơn ORD-A1B2C','Hãy đến Hachi Ramen — 1.2 km, 4 phút.','/driver/active',0,NULL,'2026-05-21 21:38:10'),(13,3,'payout_status','Yêu cầu rút tiền đang chờ duyệt','Khoản 480.000 ₫ đang chờ NomNom xét duyệt.','/driver/payouts',0,NULL,'2026-05-21 19:42:10'),(14,3,'kyc_status','Bằng lái sắp hết hạn','Bằng lái xe của bạn sắp hết hạn trong 20 ngày.','/driver/onboarding',1,'2026-05-21 09:42:10','2026-05-20 21:42:10'),(15,3,'system','Thưởng tuần này','Hoàn thành 30 chuyến để nhận thưởng 200.000 ₫.',NULL,1,'2026-05-19 21:42:10','2026-05-18 21:42:10'),(7001,2,'order_delivered','Đơn hàng đã được giao','Đơn DEMO-2608-001 đã giao thành công. Bạn có thể đánh giá trải nghiệm.','/app/orders',0,NULL,'2026-08-12 01:47:48'),(7002,7,'order_placed','Bạn có đơn hàng mới','Đơn DEMO-LIVE-001 đang chờ quán xác nhận.','/merchant/orders',0,NULL,'2026-08-13 01:43:48'),(7003,8,'order_accepted','Đơn hàng đang được chuẩn bị','Đơn DEMO-LIVE-002 đang ở bước chuẩn bị món.','/merchant/orders',0,NULL,'2026-08-13 01:38:48'),(7004,11,'order_accepted','Đơn hàng mới đã xác nhận','Đơn DEMO-LIVE-003 đang chờ quán chuẩn bị.','/merchant/orders',0,NULL,'2026-08-13 01:43:48'),(7005,121,'order_ready','Đơn hàng đã sẵn sàng','Đơn DEMO-LIVE-004 đã sẵn sàng để bàn giao.','/merchant/orders',0,NULL,'2026-08-13 01:45:48'),(7006,1,'system','Dữ liệu báo cáo đã sẵn sàng','Hệ thống đã có dữ liệu đơn hàng, doanh thu và đánh giá trong 30 ngày gần nhất.','/admin',0,NULL,'2026-08-13 01:47:48');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `menu_item_id` bigint unsigned NOT NULL,
  `item_name_snapshot` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price_snapshot` bigint unsigned NOT NULL,
  `quantity` smallint unsigned NOT NULL,
  `line_subtotal` bigint unsigned NOT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_oi_order` (`order_id`),
  KEY `fk_oi_item` (`menu_item_id`),
  CONSTRAINT `fk_oi_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3036 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,18,'Tonkotsu Ramen',400000,1,400000,NULL,'2026-05-21 21:42:10'),(2,1,20,'Gyoza (6 miếng)',188000,1,188000,NULL,'2026-05-21 21:42:10'),(3,2,6,'Cổ điển',288000,2,576000,NULL,'2026-05-21 21:42:10'),(4,2,9,'Khoai tây chiên',113000,1,113000,NULL,'2026-05-21 21:42:10'),(5,3,1,'Margherita',338000,1,338000,NULL,'2026-05-21 21:42:10'),(6,3,4,'Burrata Salad',300000,1,300000,NULL,'2026-05-21 21:42:10'),(7,4,2,'Funghi',400000,2,800000,NULL,'2026-05-21 21:42:10'),(8,5,3,'Salsiccia',438000,1,438000,NULL,'2026-05-21 21:42:10'),(9,5,1,'Margherita',338000,1,338000,NULL,'2026-05-21 21:42:10'),(10,6,1,'Margherita',338000,1,338000,NULL,'2026-05-21 21:42:10'),(11,6,5,'Tiramisu',188000,1,188000,NULL,'2026-05-21 21:42:10'),(12,7,2,'Funghi',400000,1,400000,NULL,'2026-05-21 21:42:10'),(13,8,1,'Margherita',338000,3,1014000,'Đế không gluten','2026-05-21 21:42:10'),(14,9,3,'Salsiccia',438000,1,438000,NULL,'2026-05-21 21:42:10'),(15,10,1,'Margherita',338000,1,338000,NULL,'2026-05-21 21:42:10'),(16,11,4,'Burrata Salad',300000,1,300000,NULL,'2026-05-21 21:42:10'),(3001,2001,6,'Cổ điển',99000,1,99000,NULL,'2026-08-12 00:00:00'),(3002,2001,9,'Khoai tây chiên',35000,1,35000,NULL,'2026-08-12 00:00:00'),(3003,2002,11,'Set Nigiri (8 miếng)',249000,1,249000,NULL,'2026-08-11 00:00:00'),(3004,2002,14,'Súp Miso',35000,1,35000,NULL,'2026-08-11 00:00:00'),(3005,2003,18,'Tonkotsu Ramen',119000,1,119000,NULL,'2026-08-10 00:00:00'),(3006,2003,20,'Gyoza (6 miếng)',59000,1,59000,NULL,'2026-08-10 00:00:00'),(3007,2004,25,'Flat White',49000,1,49000,NULL,'2026-08-08 00:00:00'),(3008,2004,26,'Bánh sừng bò hạnh nhân',45000,1,45000,NULL,'2026-08-08 00:00:00'),(3009,2005,100,'Cơm sườn nướng',48000,1,48000,NULL,'2026-08-06 00:00:00'),(3010,2005,102,'Canh chua cá',35000,2,70000,NULL,'2026-08-06 00:00:00'),(3011,2006,104,'Cà phê sữa đá',22000,2,44000,'Ít đá','2026-08-04 00:00:00'),(3012,2006,105,'Bạc xỉu',28000,1,28000,NULL,'2026-08-04 00:00:00'),(3013,2007,108,'Bánh tráng trộn',25000,1,25000,NULL,'2026-08-01 00:00:00'),(3014,2007,109,'Xiên que thập cẩm',35000,1,35000,NULL,'2026-08-01 00:00:00'),(3015,2007,110,'Trà đào cam sả',30000,1,30000,NULL,'2026-08-01 00:00:00'),(3016,2008,115,'Bún cá đặc biệt',48000,1,48000,NULL,'2026-07-28 00:00:00'),(3017,2008,117,'Chả cá chiên',30000,2,60000,NULL,'2026-07-28 00:00:00'),(3018,2009,119,'Cơm gà xối mỡ',52000,1,52000,NULL,'2026-07-23 00:00:00'),(3019,2009,120,'Cơm gà quay',55000,1,55000,NULL,'2026-07-23 00:00:00'),(3020,2009,122,'Canh rong biển',18000,1,18000,NULL,'2026-07-23 00:00:00'),(3021,2010,123,'Trà đào cam sả',32000,1,32000,'50% đường','2026-07-17 00:00:00'),(3022,2010,125,'Cà phê sữa đá',25000,1,25000,NULL,'2026-07-17 00:00:00'),(3023,2010,126,'Bánh croissant bơ',30000,1,30000,NULL,'2026-07-17 00:00:00'),(3024,2011,1,'Margherita',89000,1,89000,NULL,'2026-08-13 01:47:48'),(3025,2011,2,'Funghi',115000,1,115000,NULL,'2026-08-13 01:47:48'),(3026,2012,7,'Cheddar Bacon',115000,1,115000,NULL,'2026-08-13 01:47:48'),(3027,2012,9,'Khoai tây chiên',35000,1,35000,NULL,'2026-08-13 01:47:48'),(3028,2013,19,'Miso Ramen',109000,1,109000,NULL,'2026-08-13 01:47:48'),(3029,2013,20,'Gyoza (6 miếng)',59000,1,59000,NULL,'2026-08-13 01:47:48'),(3030,2014,100,'Cơm sườn nướng',48000,1,48000,NULL,'2026-08-13 01:47:48'),(3031,2014,101,'Cơm gà xối mỡ',52000,1,52000,NULL,'2026-08-13 01:47:48'),(3032,2015,1,'Margherita',89000,1,89000,NULL,'2026-08-13 08:00:00'),(3033,2015,2,'Funghi',115000,1,115000,NULL,'2026-08-13 08:00:00'),(3034,2016,3,'Salsiccia',125000,1,125000,NULL,'2026-08-13 11:00:00'),(3035,2016,5,'Tiramisu',59000,1,59000,NULL,'2026-08-13 11:00:00');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `order_status_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `from_status` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_status` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by_role` enum('customer','merchant','driver','admin','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by_user_id` bigint unsigned DEFAULT NULL,
  `note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_osl_order` (`order_id`,`created_at`),
  KEY `fk_osl_user` (`changed_by_user_id`),
  CONSTRAINT `fk_osl_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_osl_user` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5017 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `order_status_logs` WRITE;
/*!40000 ALTER TABLE `order_status_logs` DISABLE KEYS */;
INSERT INTO `order_status_logs` VALUES (1,1,NULL,'pending_payment','customer',2,'Khách tạo đơn','2026-05-21 21:42:10'),(2,1,'pending_payment','placed','system',NULL,'VNPay xác nhận thanh toán','2026-05-21 21:42:10'),(3,1,'placed','accepted','merchant',11,'Hachi Ramen xác nhận đơn','2026-05-21 21:42:10'),(4,1,'accepted','preparing','merchant',11,'Bắt đầu nấu','2026-05-21 21:42:10'),(5,1,'preparing','ready_for_pickup','merchant',11,'Sẵn sàng cho tài xế lấy','2026-05-21 21:42:10'),(6,1,'ready_for_pickup','picked_up','driver',3,'Owen đã lấy hàng','2026-05-21 21:42:10'),(7,1,'picked_up','delivering','driver',3,'Đang giao đến khách','2026-05-21 21:42:10'),(8,2,'preparing','delivered','driver',3,NULL,'2026-05-21 21:42:10'),(9,3,'pending_payment','placed','system',NULL,'VNPay xác nhận','2026-05-21 21:42:10'),(10,4,'pending_payment','placed','system',NULL,'VNPay xác nhận','2026-05-21 21:42:10'),(11,5,'placed','accepted','merchant',7,NULL,'2026-05-21 21:42:10'),(12,5,'accepted','preparing','merchant',7,NULL,'2026-05-21 21:42:10'),(13,6,'preparing','ready_for_pickup','merchant',7,NULL,'2026-05-21 21:42:10'),(5001,2001,NULL,'delivered','system',NULL,'Dữ liệu minh họa phục vụ báo cáo tiến độ.','2026-08-12 12:32:00'),(5002,2002,NULL,'delivered','system',NULL,'Dữ liệu minh họa phục vụ báo cáo tiến độ.','2026-08-11 18:32:00'),(5003,2003,NULL,'delivered','system',NULL,'Dữ liệu minh họa phục vụ báo cáo tiến độ.','2026-08-10 11:32:00'),(5004,2004,NULL,'delivered','system',NULL,'Dữ liệu minh họa phục vụ báo cáo tiến độ.','2026-08-08 08:32:00'),(5005,2005,NULL,'delivered','system',NULL,'Dữ liệu minh họa phục vụ báo cáo tiến độ.','2026-08-06 12:32:00'),(5006,2006,NULL,'delivered','system',NULL,'Dữ liệu minh họa phục vụ báo cáo tiến độ.','2026-08-04 15:32:00'),(5007,2007,NULL,'delivered','system',NULL,'Dữ liệu minh họa phục vụ báo cáo tiến độ.','2026-08-01 16:32:00'),(5008,2008,NULL,'delivered','system',NULL,'Dữ liệu minh họa phục vụ báo cáo tiến độ.','2026-07-28 07:32:00'),(5009,2009,NULL,'delivered','system',NULL,'Dữ liệu minh họa phục vụ báo cáo tiến độ.','2026-07-23 12:32:00'),(5010,2010,NULL,'delivered','system',NULL,'Dữ liệu minh họa phục vụ báo cáo tiến độ.','2026-07-17 14:32:00'),(5011,2011,NULL,'placed','system',NULL,'Dữ liệu minh họa phục vụ báo cáo tiến độ.','2026-08-13 01:47:48'),(5012,2012,NULL,'preparing','system',NULL,'Dữ liệu minh họa phục vụ báo cáo tiến độ.','2026-08-13 01:47:48'),(5013,2013,NULL,'accepted','system',NULL,'Dữ liệu minh họa phục vụ báo cáo tiến độ.','2026-08-13 01:47:48'),(5014,2014,NULL,'ready_for_pickup','system',NULL,'Dữ liệu minh họa phục vụ báo cáo tiến độ.','2026-08-13 01:47:48'),(5015,2015,NULL,'delivered','system',NULL,'Dữ liệu minh họa phục vụ báo cáo tiến độ.','2026-08-13 08:36:00'),(5016,2016,NULL,'delivered','system',NULL,'Dữ liệu minh họa phục vụ báo cáo tiến độ.','2026-08-13 11:36:00');
/*!40000 ALTER TABLE `order_status_logs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `restaurant_id` bigint unsigned NOT NULL,
  `voucher_id` bigint unsigned DEFAULT NULL,
  `driver_id` bigint unsigned DEFAULT NULL,
  `delivery_address_id` bigint unsigned NOT NULL,
  `delivery_address_snapshot` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_lat` decimal(10,7) NOT NULL,
  `delivery_lng` decimal(10,7) NOT NULL,
  `pickup_lat` decimal(10,7) NOT NULL,
  `pickup_lng` decimal(10,7) NOT NULL,
  `distance_km` decimal(6,2) NOT NULL DEFAULT '0.00',
  `subtotal` bigint unsigned NOT NULL,
  `delivery_fee` bigint unsigned NOT NULL DEFAULT '0',
  `discount_amount` bigint unsigned NOT NULL DEFAULT '0',
  `voucher_code_snapshot` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_amount` bigint unsigned NOT NULL,
  `driver_earning` bigint unsigned NOT NULL DEFAULT '0',
  `merchant_earning` bigint unsigned NOT NULL DEFAULT '0',
  `platform_fee` bigint unsigned NOT NULL DEFAULT '0',
  `status` enum('pending_payment','payment_failed','placed','accepted','preparing','ready_for_pickup','picked_up','delivering','delivered','cancelled','failed','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_payment',
  `payment_status` enum('unpaid','paid','failed','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `payment_method` enum('cod','vnpay') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimated_delivery_at` datetime DEFAULT NULL,
  `placed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `accepted_at` datetime DEFAULT NULL,
  `ready_at` datetime DEFAULT NULL,
  `picked_up_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `cancelled_by_role` enum('customer','merchant','driver','admin','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancel_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_code` (`order_code`),
  KEY `idx_ord_customer` (`customer_id`,`placed_at`),
  KEY `idx_ord_rest` (`restaurant_id`,`status`),
  KEY `idx_ord_driver` (`driver_id`,`status`),
  KEY `idx_ord_status` (`status`),
  KEY `fk_ord_address` (`delivery_address_id`),
  KEY `idx_orders_voucher` (`voucher_id`),
  CONSTRAINT `fk_ord_address` FOREIGN KEY (`delivery_address_id`) REFERENCES `customer_addresses` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ord_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ord_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ord_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2017 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'ORD-A1B2C',2,5,NULL,3,1,'120 Wythe Ave, Apt 3B, P. Bến Nghé, Q.1, TP. Hồ Chí Minh',10.7795000,106.6991000,10.7680000,106.6920000,3.40,588000,62000,0,NULL,650000,49600,499800,100600,'delivering','paid','vnpay',NULL,'2026-05-21 21:50:10','2026-05-21 21:30:10','2026-05-21 21:31:10','2026-05-21 21:38:10','2026-05-21 21:39:10',NULL,NULL,NULL,NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(2,'ORD-Q3K9P',2,2,NULL,3,1,'120 Wythe Ave, Apt 3B, P. Bến Nghé, Q.1, TP. Hồ Chí Minh',10.7795000,106.6991000,10.7710000,106.6985000,1.80,689000,50000,89000,NULL,650000,40000,585650,113350,'delivered','paid','vnpay',NULL,NULL,'2026-05-20 19:42:10','2026-05-20 19:52:10','2026-05-20 20:12:10','2026-05-20 20:22:10','2026-05-20 20:42:10',NULL,NULL,NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(3,'ORD-7T2RD',2,1,NULL,NULL,1,'120 Wythe Ave, Apt 3B, P. Bến Nghé, Q.1, TP. Hồ Chí Minh',10.7795000,106.6991000,10.7765000,106.7010000,0.50,638000,62000,0,NULL,700000,49600,542300,108100,'placed','paid','vnpay','Làm ơn không lấy húng quế','2026-05-21 22:07:10','2026-05-21 21:40:10',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(4,'ORD-K9XR1',15,1,NULL,NULL,3,'301 Carroll St, P. Đa Kao, Q.1, TP. Hồ Chí Minh',10.7873000,106.6919000,10.7765000,106.7010000,1.20,800000,62000,0,NULL,862000,49600,680000,132400,'placed','paid','vnpay',NULL,'2026-05-21 22:10:10','2026-05-21 21:38:10',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(5,'ORD-A41QM',16,1,NULL,NULL,4,'14 W 10th St, P. 6, Q. Bình Thạnh, TP. Hồ Chí Minh',10.8030000,106.7100000,10.7765000,106.7010000,2.80,776000,62000,0,NULL,838000,49600,659600,128800,'preparing','paid','vnpay','Thêm dầu ớt','2026-05-21 22:02:10','2026-05-21 21:33:10','2026-05-21 21:34:10',NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(6,'ORD-V2HHJ',17,1,NULL,NULL,5,'24 Bedford Ave, P. 17, Q. Bình Thạnh, TP. Hồ Chí Minh',10.8055000,106.7068000,10.7765000,106.7010000,3.30,526000,62000,0,NULL,588000,49600,447100,91300,'ready_for_pickup','paid','vnpay',NULL,'2026-05-21 21:57:10','2026-05-21 21:26:10','2026-05-21 21:27:10','2026-05-21 21:39:10',NULL,NULL,NULL,NULL,NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(7,'ORD-P9X22',18,1,NULL,4,6,'6 Smith St, P. Tân Định, Q.1, TP. Hồ Chí Minh',10.7896000,106.6907000,10.7765000,106.7010000,2.10,400000,62000,0,NULL,462000,49600,340000,72400,'delivered','paid','cod',NULL,NULL,'2026-05-21 20:42:10','2026-05-21 20:44:10','2026-05-21 21:02:10','2026-05-21 21:12:10','2026-05-21 21:27:10',NULL,NULL,NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(8,'ORD-J11HQ',19,1,NULL,6,7,'88 W 4th St, P. Cô Giang, Q.1, TP. Hồ Chí Minh',10.7660000,106.6960000,10.7765000,106.7010000,1.40,1014000,62000,0,NULL,1076000,49600,861900,164500,'delivered','paid','vnpay','Không gluten — đế không gluten',NULL,'2026-05-21 20:12:10','2026-05-21 20:14:10','2026-05-21 20:42:10','2026-05-21 20:47:10','2026-05-21 21:02:10',NULL,NULL,NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(9,'ORD-RV001',20,1,NULL,3,8,'15 Greenpoint Ave, P. Tân Phong, Q.7, TP. Hồ Chí Minh',10.7305000,106.7218000,10.7765000,106.7010000,5.40,438000,62000,0,NULL,500000,49600,372300,78100,'delivered','paid','vnpay',NULL,NULL,'2026-05-18 21:42:10','2026-05-18 21:42:10','2026-05-18 21:42:10','2026-05-18 21:42:10','2026-05-18 21:42:10',NULL,NULL,NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(10,'ORD-RV002',21,1,NULL,4,9,'209 Avenue B, P. 12, Q. Tân Bình, TP. Hồ Chí Minh',10.8004000,106.6437000,10.7765000,106.7010000,6.80,338000,62000,0,NULL,400000,49600,287300,63100,'delivered','paid','vnpay','Giao chậm một chút cũng được',NULL,'2026-05-14 21:42:10','2026-05-14 21:42:10','2026-05-14 21:42:10','2026-05-14 21:42:10','2026-05-14 21:42:10',NULL,NULL,NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(11,'ORD-RV003',22,1,NULL,6,10,'4 Sakura Ln, P. 9, Q. Phú Nhuận, TP. Hồ Chí Minh',10.7990000,106.6791000,10.7765000,106.7010000,3.10,300000,62000,0,NULL,362000,49600,255000,57400,'delivered','paid','cod',NULL,NULL,'2026-05-07 21:42:10','2026-05-07 21:42:10','2026-05-07 21:42:10','2026-05-07 21:42:10','2026-05-07 21:42:10',NULL,NULL,NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(2001,'DEMO-2608-001',2,2,NULL,NULL,1,'120 Wythe Ave, Apt 3B, P. Bến Nghé, TP. Hồ Chí Minh',10.7795000,106.6991000,10.7710000,106.6985000,2.80,134000,18000,0,NULL,152000,0,113900,20100,'delivered','paid','cod','Ít tương ớt','2026-08-12 12:35:00','2026-08-12 12:00:00','2026-08-12 12:03:00','2026-08-12 12:18:00','2026-08-12 12:21:00','2026-08-12 12:32:00',NULL,NULL,NULL,'2026-08-12 12:00:00','2026-08-12 12:32:00'),(2002,'DEMO-2608-002',15,3,NULL,NULL,3,'301 Carroll St, P. Đa Kao, TP. Hồ Chí Minh',10.7873000,106.6919000,10.7995000,106.6790000,3.40,284000,22000,0,NULL,306000,0,232880,51120,'delivered','paid','vnpay',NULL,'2026-08-11 18:35:00','2026-08-11 18:00:00','2026-08-11 18:03:00','2026-08-11 18:18:00','2026-08-11 18:21:00','2026-08-11 18:32:00',NULL,NULL,NULL,'2026-08-11 18:00:00','2026-08-11 18:32:00'),(2003,'DEMO-2608-003',16,5,NULL,NULL,4,'14 W 10th St, P. 6, TP. Hồ Chí Minh',10.8030000,106.7100000,10.7680000,106.6920000,4.10,178000,25000,0,NULL,203000,0,151300,26700,'delivered','paid','cod','Không lấy đũa','2026-08-10 11:35:00','2026-08-10 11:00:00','2026-08-10 11:03:00','2026-08-10 11:18:00','2026-08-10 11:21:00','2026-08-10 11:32:00',NULL,NULL,NULL,'2026-08-10 11:00:00','2026-08-10 11:32:00'),(2004,'DEMO-2608-004',17,7,NULL,NULL,5,'24 Bedford Ave, P. 17, TP. Hồ Chí Minh',10.8055000,106.7068000,10.8055000,106.7068000,2.20,94000,16000,0,NULL,110000,0,82720,11280,'delivered','paid','vnpay',NULL,'2026-08-08 08:35:00','2026-08-08 08:00:00','2026-08-08 08:03:00','2026-08-08 08:18:00','2026-08-08 08:21:00','2026-08-08 08:32:00',NULL,NULL,NULL,'2026-08-08 08:00:00','2026-08-08 08:32:00'),(2005,'DEMO-2608-005',18,108,NULL,NULL,6,'6 Smith St, P. Tân Định, TP. Hồ Chí Minh',10.7896000,106.6907000,10.2504000,105.8682000,3.00,118000,19000,0,NULL,137000,0,100300,17700,'delivered','paid','cod','Giao tại lễ tân','2026-08-06 12:35:00','2026-08-06 12:00:00','2026-08-06 12:03:00','2026-08-06 12:18:00','2026-08-06 12:21:00','2026-08-06 12:32:00',NULL,NULL,NULL,'2026-08-06 12:00:00','2026-08-06 12:32:00'),(2006,'DEMO-2608-006',19,109,NULL,NULL,7,'88 W 4th St, P. Cô Giang, TP. Hồ Chí Minh',10.7660000,106.6960000,10.2547000,105.8753000,1.90,72000,15000,0,NULL,87000,0,63360,8640,'delivered','paid','vnpay','Ít đá','2026-08-04 15:35:00','2026-08-04 15:00:00','2026-08-04 15:03:00','2026-08-04 15:18:00','2026-08-04 15:21:00','2026-08-04 15:32:00',NULL,NULL,NULL,'2026-08-04 15:00:00','2026-08-04 15:32:00'),(2007,'DEMO-2608-007',20,110,NULL,NULL,8,'15 Greenpoint Ave, P. Tân Phong, TP. Hồ Chí Minh',10.7305000,106.7218000,10.2427000,105.8598000,2.50,90000,17000,0,NULL,107000,0,79200,10800,'delivered','paid','cod','Không cay','2026-08-01 16:35:00','2026-08-01 16:00:00','2026-08-01 16:03:00','2026-08-01 16:18:00','2026-08-01 16:21:00','2026-08-01 16:32:00',NULL,NULL,NULL,'2026-08-01 16:00:00','2026-08-01 16:32:00'),(2008,'DEMO-2608-008',21,115,NULL,NULL,9,'209 Avenue B, P. 12, TP. Hồ Chí Minh',10.8004000,106.6437000,9.9845360,105.7889760,3.70,108000,23000,0,NULL,131000,0,91800,16200,'delivered','paid','vnpay',NULL,'2026-07-28 07:35:00','2026-07-28 07:00:00','2026-07-28 07:03:00','2026-07-28 07:18:00','2026-07-28 07:21:00','2026-07-28 07:32:00',NULL,NULL,NULL,'2026-07-28 07:00:00','2026-07-28 07:32:00'),(2009,'DEMO-2608-009',22,116,NULL,NULL,10,'4 Sakura Ln, P. 9, TP. Hồ Chí Minh',10.7990000,106.6791000,9.9881000,105.7928000,4.40,125000,26000,0,NULL,151000,0,106250,18750,'delivered','paid','cod','Thêm nước tương','2026-07-23 12:35:00','2026-07-23 12:00:00','2026-07-23 12:03:00','2026-07-23 12:18:00','2026-07-23 12:21:00','2026-07-23 12:32:00',NULL,NULL,NULL,'2026-07-23 12:00:00','2026-07-23 12:32:00'),(2010,'DEMO-2608-010',2,117,NULL,NULL,1,'120 Wythe Ave, Apt 3B, P. Bến Nghé, TP. Hồ Chí Minh',10.7795000,106.6991000,9.9799000,105.7839000,2.60,87000,18000,0,NULL,105000,0,76560,10440,'delivered','paid','vnpay','50% đường','2026-07-17 14:35:00','2026-07-17 14:00:00','2026-07-17 14:03:00','2026-07-17 14:18:00','2026-07-17 14:21:00','2026-07-17 14:32:00',NULL,NULL,NULL,'2026-07-17 14:00:00','2026-07-17 14:32:00'),(2011,'DEMO-LIVE-001',2,1,NULL,NULL,1,'120 Wythe Ave, Apt 3B, P. Bến Nghé, TP. Hồ Chí Minh',10.7795000,106.6991000,10.7765000,106.7010000,2.10,204000,17000,0,NULL,221000,0,173400,30600,'placed','paid','cod','Gọi khi đến nơi','2026-08-13 02:17:48','2026-08-13 01:43:48',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-08-13 01:43:48','2026-08-13 01:47:48'),(2012,'DEMO-LIVE-002',15,2,NULL,NULL,3,'301 Carroll St, P. Đa Kao, TP. Hồ Chí Minh',10.7873000,106.6919000,10.7710000,106.6985000,2.90,150000,19000,0,NULL,169000,0,127500,22500,'preparing','paid','vnpay','Không hành','2026-08-13 02:17:48','2026-08-13 01:35:48','2026-08-13 01:38:48',NULL,NULL,NULL,NULL,NULL,NULL,'2026-08-13 01:35:48','2026-08-13 01:47:48'),(2013,'DEMO-LIVE-003',16,5,NULL,NULL,4,'14 W 10th St, P. 6, TP. Hồ Chí Minh',10.8030000,106.7100000,10.7680000,106.6920000,3.50,168000,22000,0,NULL,190000,0,142800,25200,'accepted','paid','cod',NULL,'2026-08-13 02:17:48','2026-08-13 01:40:48','2026-08-13 01:43:48',NULL,NULL,NULL,NULL,NULL,NULL,'2026-08-13 01:40:48','2026-08-13 01:47:48'),(2014,'DEMO-LIVE-004',17,108,NULL,NULL,5,'24 Bedford Ave, P. 17, TP. Hồ Chí Minh',10.8055000,106.7068000,10.2504000,105.8682000,2.40,100000,17000,0,NULL,117000,0,85000,15000,'ready_for_pickup','paid','vnpay','Xin thêm canh','2026-08-13 02:17:48','2026-08-13 01:23:48','2026-08-13 01:26:48','2026-08-13 01:45:48',NULL,NULL,NULL,NULL,NULL,'2026-08-13 01:23:48','2026-08-13 01:47:48'),(2015,'DEMO-TODAY-001',18,1,NULL,NULL,6,'6 Smith St, P. Tân Định, TP. Hồ Chí Minh',10.7896000,106.6907000,10.7765000,106.7010000,2.30,204000,17000,0,NULL,221000,0,173400,30600,'delivered','paid','cod','Cắt pizza giúp mình','2026-08-13 08:38:00','2026-08-13 08:00:00','2026-08-13 08:03:00','2026-08-13 08:20:00','2026-08-13 08:24:00','2026-08-13 08:36:00',NULL,NULL,NULL,'2026-08-13 08:00:00','2026-08-13 08:36:00'),(2016,'DEMO-TODAY-002',19,1,NULL,NULL,7,'88 W 4th St, P. Cô Giang, TP. Hồ Chí Minh',10.7660000,106.6960000,10.7765000,106.7010000,3.10,184000,20000,0,NULL,204000,0,156400,27600,'delivered','paid','vnpay',NULL,'2026-08-13 11:38:00','2026-08-13 11:00:00','2026-08-13 11:03:00','2026-08-13 11:20:00','2026-08-13 11:24:00','2026-08-13 11:36:00',NULL,NULL,NULL,'2026-08-13 11:00:00','2026-08-13 11:36:00');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `order_checkout_idempotency`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_checkout_idempotency` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `idempotency_key` varchar(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `request_hash` char(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_checkout_customer_key` (`customer_id`,`idempotency_key`),
  KEY `idx_checkout_order` (`order_id`),
  CONSTRAINT `fk_checkout_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_checkout_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

DROP TABLE IF EXISTS `otp_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_codes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `destination` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` enum('email','sms') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose` enum('register','login','reset_password') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL DEFAULT '0',
  `expires_at` datetime NOT NULL,
  `consumed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_otp_destination` (`destination`),
  KEY `fk_otp_user` (`user_id`),
  CONSTRAINT `fk_otp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `otp_codes` WRITE;
/*!40000 ALTER TABLE `otp_codes` DISABLE KEYS */;
INSERT INTO `otp_codes` VALUES (17,NULL,'dyna6046@emalupe.com','email','register','$2b$10$nukd9aiLNu9udQlFhENi5OlRAUbyAv5A6k1abnPgyaR8Al4QaD5je',0,'2026-08-12 21:23:13','2026-08-12 21:13:53','2026-08-12 21:13:13');
/*!40000 ALTER TABLE `otp_codes` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `payment_refunds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_refunds` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned NOT NULL,
  `request_id` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` bigint unsigned NOT NULL,
  `status` enum('initiated','succeeded','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'initiated',
  `gateway_txn_id` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `failure_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `raw_response` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_refunds_request` (`request_id`),
  KEY `idx_payment_refunds_payment` (`payment_id`,`status`),
  KEY `idx_payment_refunds_order` (`order_id`,`status`),
  CONSTRAINT `fk_payment_refunds_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payment_refunds_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `payment_refunds` WRITE;
/*!40000 ALTER TABLE `payment_refunds` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_refunds` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `method` enum('cod','vnpay') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` bigint unsigned NOT NULL,
  `currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VND',
  `gateway` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway_reference` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway_txn_id` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway_created_at` datetime DEFAULT NULL,
  `status` enum('initiated','pending','succeeded','failed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'initiated',
  `failure_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `raw_response` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payments_gateway_reference` (`gateway_reference`),
  KEY `idx_pay_order` (`order_id`),
  KEY `idx_pay_status` (`status`),
  CONSTRAINT `fk_pay_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4017 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,'vnpay',650000,'VND','vnpay',NULL,'VNP14829381',NULL,'succeeded',NULL,'2026-05-21 21:30:10',NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(2,2,'vnpay',650000,'VND','vnpay',NULL,'VNP14771209',NULL,'succeeded',NULL,'2026-05-20 19:42:10',NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(3,3,'vnpay',700000,'VND','vnpay',NULL,'VNP14855001',NULL,'succeeded',NULL,'2026-05-21 21:40:10',NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(4,4,'vnpay',862000,'VND','vnpay',NULL,'VNP14854999',NULL,'succeeded',NULL,'2026-05-21 21:38:10',NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(5,5,'vnpay',838000,'VND','vnpay',NULL,'VNP14854810',NULL,'succeeded',NULL,'2026-05-21 21:33:10',NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(6,6,'vnpay',588000,'VND','vnpay',NULL,'VNP14854711',NULL,'succeeded',NULL,'2026-05-21 21:26:10',NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(7,7,'cod',462000,'VND',NULL,NULL,NULL,NULL,'succeeded',NULL,'2026-05-21 21:27:10',NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(8,8,'vnpay',1076000,'VND','vnpay',NULL,'VNP14852201',NULL,'succeeded',NULL,'2026-05-21 20:12:10',NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(9,9,'vnpay',500000,'VND','vnpay',NULL,'VNP14809921',NULL,'succeeded',NULL,'2026-05-18 21:42:10',NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(10,10,'vnpay',400000,'VND','vnpay',NULL,'VNP14761023',NULL,'succeeded',NULL,'2026-05-14 21:42:10',NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(11,11,'cod',362000,'VND',NULL,NULL,NULL,NULL,'succeeded',NULL,'2026-05-07 21:42:10',NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(4001,2001,'cod',152000,'VND',NULL,'DEMO-PAY-2001',NULL,NULL,'succeeded',NULL,'2026-08-12 12:00:00',NULL,'2026-08-12 12:00:00','2026-08-12 12:32:00'),(4002,2002,'vnpay',306000,'VND','vnpay','DEMO-PAY-2002',NULL,NULL,'succeeded',NULL,'2026-08-11 18:00:00',NULL,'2026-08-11 18:00:00','2026-08-11 18:32:00'),(4003,2003,'cod',203000,'VND',NULL,'DEMO-PAY-2003',NULL,NULL,'succeeded',NULL,'2026-08-10 11:00:00',NULL,'2026-08-10 11:00:00','2026-08-10 11:32:00'),(4004,2004,'vnpay',110000,'VND','vnpay','DEMO-PAY-2004',NULL,NULL,'succeeded',NULL,'2026-08-08 08:00:00',NULL,'2026-08-08 08:00:00','2026-08-08 08:32:00'),(4005,2005,'cod',137000,'VND',NULL,'DEMO-PAY-2005',NULL,NULL,'succeeded',NULL,'2026-08-06 12:00:00',NULL,'2026-08-06 12:00:00','2026-08-06 12:32:00'),(4006,2006,'vnpay',87000,'VND','vnpay','DEMO-PAY-2006',NULL,NULL,'succeeded',NULL,'2026-08-04 15:00:00',NULL,'2026-08-04 15:00:00','2026-08-04 15:32:00'),(4007,2007,'cod',107000,'VND',NULL,'DEMO-PAY-2007',NULL,NULL,'succeeded',NULL,'2026-08-01 16:00:00',NULL,'2026-08-01 16:00:00','2026-08-01 16:32:00'),(4008,2008,'vnpay',131000,'VND','vnpay','DEMO-PAY-2008',NULL,NULL,'succeeded',NULL,'2026-07-28 07:00:00',NULL,'2026-07-28 07:00:00','2026-07-28 07:32:00'),(4009,2009,'cod',151000,'VND',NULL,'DEMO-PAY-2009',NULL,NULL,'succeeded',NULL,'2026-07-23 12:00:00',NULL,'2026-07-23 12:00:00','2026-07-23 12:32:00'),(4010,2010,'vnpay',105000,'VND','vnpay','DEMO-PAY-2010',NULL,NULL,'succeeded',NULL,'2026-07-17 14:00:00',NULL,'2026-07-17 14:00:00','2026-07-17 14:32:00'),(4011,2011,'cod',221000,'VND',NULL,'DEMO-PAY-2011',NULL,NULL,'succeeded',NULL,'2026-08-13 01:43:48',NULL,'2026-08-13 01:43:48','2026-08-13 01:47:48'),(4012,2012,'vnpay',169000,'VND','vnpay','DEMO-PAY-2012',NULL,NULL,'succeeded',NULL,'2026-08-13 01:35:48',NULL,'2026-08-13 01:35:48','2026-08-13 01:47:48'),(4013,2013,'cod',190000,'VND',NULL,'DEMO-PAY-2013',NULL,NULL,'succeeded',NULL,'2026-08-13 01:40:48',NULL,'2026-08-13 01:40:48','2026-08-13 01:47:48'),(4014,2014,'vnpay',117000,'VND','vnpay','DEMO-PAY-2014',NULL,NULL,'succeeded',NULL,'2026-08-13 01:23:48',NULL,'2026-08-13 01:23:48','2026-08-13 01:47:48'),(4015,2015,'cod',221000,'VND',NULL,'DEMO-PAY-2015',NULL,NULL,'succeeded',NULL,'2026-08-13 08:00:00',NULL,'2026-08-13 08:00:00','2026-08-13 08:36:00'),(4016,2016,'vnpay',204000,'VND','vnpay','DEMO-PAY-2016',NULL,NULL,'succeeded',NULL,'2026-08-13 11:00:00',NULL,'2026-08-13 11:00:00','2026-08-13 11:36:00');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `payout_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payout_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `wallet_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `amount` bigint unsigned NOT NULL,
  `bank_account_no` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_account_holder` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','completed','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `reviewed_by_admin_id` bigint unsigned DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_ref` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_payout_user` (`user_id`),
  KEY `idx_payout_status` (`status`),
  KEY `fk_payout_wallet` (`wallet_id`),
  KEY `fk_payout_admin` (`reviewed_by_admin_id`),
  CONSTRAINT `fk_payout_admin` FOREIGN KEY (`reviewed_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payout_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payout_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `payout_requests` WRITE;
/*!40000 ALTER TABLE `payout_requests` DISABLE KEYS */;
INSERT INTO `payout_requests` VALUES (1,1,3,480000,'1903456789','Techcombank','OWEN REYES','pending',NULL,NULL,NULL,NULL,'2026-05-21 19:42:10',NULL),(2,5,8,1500000,'060011223344','BIDV','JUNEBUG BURGERS','pending',NULL,NULL,NULL,NULL,'2026-05-21 15:42:10',NULL),(3,2,4,1200000,'060034882001','Vietcombank','IRIS MENDEZ','completed',1,'2026-05-20 21:42:10',NULL,'VCB20260520-9911','2026-05-19 21:42:10','2026-05-20 21:42:10'),(4,4,7,2000000,'037000118822','Vietcombank','MARCO BELLO','completed',1,'2026-05-17 21:42:10',NULL,'VCB20260518-7723','2026-05-16 21:42:10','2026-05-17 21:42:10'),(5,3,6,350000,'1119876543','BIDV','SASHA PARK','rejected',1,'2026-05-18 21:42:10','Số tài khoản không khớp với chủ tài khoản đăng ký.',NULL,'2026-05-18 21:42:10',NULL);
/*!40000 ALTER TABLE `payout_requests` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `platform_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `platform_config` (
  `config_key` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_value` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_type` enum('string','int','decimal','boolean','json') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'string',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by_admin_id` bigint unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`config_key`),
  KEY `fk_cfg_admin` (`updated_by_admin_id`),
  CONSTRAINT `fk_cfg_admin` FOREIGN KEY (`updated_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `platform_config` WRITE;
/*!40000 ALTER TABLE `platform_config` DISABLE KEYS */;
INSERT INTO `platform_config` VALUES ('default_commission_rate','15','decimal','Hoa hồng nền tảng (%) mặc định cho nhà hàng',NULL,'2026-05-21 21:42:10'),('default_driver_share','80','decimal','% phí giao hàng tài xế nhận được',NULL,'2026-05-21 21:42:10'),('max_search_radius_km','8','decimal','Bán kính tìm kiếm tối đa (km)',NULL,'2026-05-21 21:42:10'),('min_payout_amount','100000','int','Số tiền tối thiểu mỗi lần rút (VND)',NULL,'2026-05-21 21:42:10'),('order_auto_cancel_minutes','5','int','Số phút huỷ tự động nếu nhà hàng không xác nhận',NULL,'2026-05-21 21:42:10');
/*!40000 ALTER TABLE `platform_config` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `idx_refresh_user` (`user_id`),
  CONSTRAINT `fk_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (22,2,'4451d9dca9b7db5c265a9571bbe6a3c391ed76b0473d05aa3acd68cf6fa2f195','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-11 20:36:59','2026-08-12 20:37:05','2026-08-12 20:36:59'),(23,7,'a6104f5e415bc95e0a7bfb4d807e2ab2e1009815d306880db26f085d1d606dda','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-11 20:37:16','2026-08-12 21:07:48','2026-08-12 20:37:16'),(24,7,'2fe0cfcd7da2d964dec6dbc9254c5d1d65a81e454eddf2668e4d35cf79d586fe','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-11 21:07:48','2026-08-12 21:11:09','2026-08-12 21:07:48'),(25,108,'dba124868919de01732a004414a89106b052c34544097b4881c1368b26507b9e','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-11 21:13:54','2026-08-12 21:28:53','2026-08-12 21:13:53'),(26,108,'ff19767d15720c51f31eb7acdc7f3f5f8c79d52a92b52427f64e360a7b0ff2c4','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-11 21:28:54','2026-08-12 21:43:54','2026-08-12 21:28:53'),(27,108,'fc26932faefb9c35a7348bd2ffc021de2f4743aa6a2e11909a75ef07d5e92cc8','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-11 21:43:55','2026-08-12 21:59:11','2026-08-12 21:43:54'),(28,108,'53d5fcbc983f9bdb5495b799317e5093cf13e3c8378fe36356008bb36d7982a8','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-11 21:59:12','2026-08-12 22:14:14','2026-08-12 21:59:11'),(29,108,'3fb79fc810828ba41cc562e83f935cb65735295fafec92f95eda0cfb5f628263','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-11 22:14:15','2026-08-12 22:30:06','2026-08-12 22:14:14'),(30,108,'23496296fc3112e6db2addb04afbc17447c1c12bb6ce73f3ead08aa36ba4bd2d','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-11 22:30:07','2026-08-12 22:45:11','2026-08-12 22:30:06'),(31,108,'9d3df55cb386b7d99a253deaf63c94175449d299c499eff9493800f1fc7c1ff8','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-11 22:45:12','2026-08-12 23:00:12','2026-08-12 22:45:11'),(32,108,'66fe403439fb04e3f01d309aa025f1a324d633ded1b1c9d61df41cf8b02dfaee','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-11 23:00:13','2026-08-12 23:15:54','2026-08-12 23:00:12'),(33,108,'7ad7e4e299f901b8f01575e3c140dfea6e3926f16104c25e86d0a6dbf01b5619','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-11 23:15:55','2026-08-12 23:30:55','2026-08-12 23:15:54'),(34,1,'86ef036c420cfb6c1199319c447c6fa17be525a3ced9647c70261836fbb923ec','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-11 23:30:47','2026-08-12 23:47:43','2026-08-12 23:30:47'),(35,108,'d5149453f041feec555b1111233cae6640e97d568025b0b7341c0c256420b244','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-11 23:30:56','2026-08-12 23:45:57','2026-08-12 23:30:55'),(36,108,'551fdf11f0006b40dc9d9b0f64970ffb846bf6516773d96ab2728097abb19867','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-11 23:45:57','2026-08-13 00:01:00','2026-08-12 23:45:57'),(37,1,'fc3e5088e672f8f4a7ccc08df92b46cda26b2e0fbc53c908e82be3b7291239d7','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-11 23:47:44','2026-08-13 00:02:50','2026-08-12 23:47:43'),(38,108,'5947f30c96371923b52e8b541726b1ca6272fe69b896cb9e471666cd4075070b','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-12 00:01:00','2026-08-13 00:16:03','2026-08-13 00:01:00'),(39,1,'9f2f366d99ac9425a551e61a351bf94f918895f2f001d05ead845c49d8a11ec7','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-12 00:02:50','2026-08-13 00:18:15','2026-08-13 00:02:50'),(40,108,'969aa7d6a456588cb233bc2e0b47e6eaf43bd086c976ea74a65599d11472024a','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-12 00:16:04','2026-08-13 00:31:03','2026-08-13 00:16:03'),(41,1,'2adeb1ef1a6cf6c7fffdf0bf324c2f6af28f1accdf5f9d4dfc12da9245bd25b8','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-12 00:18:15','2026-08-13 00:33:15','2026-08-13 00:18:15'),(42,108,'d42e1b9f90d0d807df7d8f6e0ada8893d8acc63c56cdcb3fcf62e477428a258b','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-12 00:31:04','2026-08-13 00:46:06','2026-08-13 00:31:03'),(43,1,'339619d3c11f704a6a972453ef6bae7cddfb47db1578d3d6d7eb328331f082e7','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-12 00:33:15','2026-08-13 00:49:43','2026-08-13 00:33:15'),(44,108,'b36729f41b6d273f69cdb8db0fc03d621750c5d81fa5050bfbb5f464dfb37b65','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-12 00:46:07','2026-08-13 01:01:06','2026-08-13 00:46:06'),(45,1,'c5e4b95b1717c2abc26f72c8979274ef2b15b58d7f3a823f22cb510f7ec05885','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-12 00:49:43','2026-08-13 01:09:05','2026-08-13 00:49:43'),(46,108,'836dda9d5ea269c0cbab595a9bb1806ce319f80c2ca81661710eb93ff4d26b33','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-12 01:01:06','2026-08-13 01:16:09','2026-08-13 01:01:06'),(47,1,'857c7b4532379ba00a4ae16af0e1c9c9c0f5d23795f2976c2750550baf92b9ba','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-12 01:09:05',NULL,'2026-08-13 01:09:05'),(48,2,'987a16ea8ce7cb63d8cb76442f59c63c66550542e650841b976f1560b8cbdc11','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9168','::ffff:127.0.0.1','2026-08-14 01:13:09',NULL,'2026-08-13 01:13:09'),(49,108,'81b76f4f6dfbf94f586dd853c7f0f25028a4490eaec8d5d4e7db648db15951b7','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-12 01:16:10','2026-08-13 01:31:09','2026-08-13 01:16:09'),(50,108,'d1fa2a1a1da65acced5d2054820f4767a4d59c6978a1e1fda7383f13998af94e','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-12 01:31:10','2026-08-13 01:46:11','2026-08-13 01:31:09'),(51,108,'e314a817323e611d1a16d68f757c3a652c985d35608d2b3a5b4973a73e666581','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36','::1','2026-09-12 01:46:12',NULL,'2026-08-13 01:46:11'),(52,2,'86ec2e339c32f53b13a59c77eed76bad4c88ac248346508dd91de440d6047401','node','::1','2026-09-12 01:49:23',NULL,'2026-08-13 01:49:22'),(53,7,'dd12e198fa42c026bc1dd058642e74d8c4d3c033b64f3b38f719b6dba9c0ed07','node','::1','2026-09-12 01:49:23',NULL,'2026-08-13 01:49:22'),(54,1,'ace2b3340b438a586c5ce4dd768683834c59716806816c978e47c199483575dd','node','::1','2026-09-12 01:49:23',NULL,'2026-08-13 01:49:23');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `registration_pending`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registration_pending` (
  `email` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `registration_pending` WRITE;
/*!40000 ALTER TABLE `registration_pending` DISABLE KEYS */;
/*!40000 ALTER TABLE `registration_pending` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `restaurant_address_change_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_address_change_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `restaurant_id` bigint unsigned NOT NULL,
  `requested_by_user_id` bigint unsigned NOT NULL,
  `current_address_line` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_ward` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `current_district` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `current_city` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_ghn_province_id` int unsigned DEFAULT NULL,
  `current_ghn_district_id` int unsigned DEFAULT NULL,
  `current_ghn_ward_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proposed_address_line` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `proposed_ward` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `proposed_district` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `proposed_city` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `proposed_ghn_province_id` int unsigned DEFAULT NULL,
  `proposed_ghn_district_id` int unsigned DEFAULT NULL,
  `proposed_ghn_ward_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `reviewed_by_admin_id` bigint unsigned DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `rejection_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `pending_restaurant_id` bigint unsigned GENERATED ALWAYS AS ((case when (`status` = _utf8mb4'pending') then `restaurant_id` else NULL end)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_racr_one_pending` (`pending_restaurant_id`),
  KEY `idx_racr_restaurant_status` (`restaurant_id`,`status`),
  KEY `idx_racr_status_created` (`status`,`created_at`),
  KEY `fk_racr_requester` (`requested_by_user_id`),
  KEY `fk_racr_reviewer` (`reviewed_by_admin_id`),
  CONSTRAINT `fk_racr_requester` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_racr_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`),
  CONSTRAINT `fk_racr_reviewer` FOREIGN KEY (`reviewed_by_admin_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `restaurant_address_change_requests` WRITE;
/*!40000 ALTER TABLE `restaurant_address_change_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `restaurant_address_change_requests` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `restaurants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `owner_user_id` bigint unsigned NOT NULL,
  `cuisine_id` smallint unsigned DEFAULT NULL,
  `name` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tagline` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `banner_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_license_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `food_safety_cert_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ward` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ghn_province_id` int unsigned DEFAULT NULL,
  `ghn_district_id` int unsigned DEFAULT NULL,
  `ghn_ward_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `base_delivery_fee` bigint unsigned NOT NULL DEFAULT '0',
  `min_order_amount` bigint unsigned NOT NULL DEFAULT '0',
  `avg_prep_time_min` smallint unsigned NOT NULL DEFAULT '20',
  `rating_avg` decimal(3,2) NOT NULL DEFAULT '0.00',
  `review_count` int unsigned NOT NULL DEFAULT '0',
  `commission_rate` decimal(5,2) NOT NULL DEFAULT '15.00',
  `is_open_now` tinyint(1) NOT NULL DEFAULT '1',
  `status` enum('pending','active','suspended','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_at` datetime DEFAULT NULL,
  `approved_by_admin_id` bigint unsigned DEFAULT NULL,
  `rejection_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_no` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_holder` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_rest_owner` (`owner_user_id`),
  KEY `idx_rest_status` (`status`),
  KEY `idx_rest_city` (`city`),
  KEY `fk_rest_cuisine` (`cuisine_id`),
  KEY `fk_rest_approver` (`approved_by_admin_id`),
  KEY `idx_restaurants_ghn_route` (`ghn_district_id`,`ghn_ward_code`),
  CONSTRAINT `fk_rest_approver` FOREIGN KEY (`approved_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rest_cuisine` FOREIGN KEY (`cuisine_id`) REFERENCES `cuisines` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rest_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `restaurants` WRITE;
/*!40000 ALTER TABLE `restaurants` DISABLE KEYS */;
INSERT INTO `restaurants` VALUES (1,7,1,'Cinque Pizzeria','cinque-pizzeria','Pizza nướng lò củi kiểu Neapolitan từ năm 2017.','Pizza Neapolitan, đế nướng cháy cạnh, nguyên liệu nhập từ Ý.','+84281234001','https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=80','https://api.dicebear.com/9.x/shapes/svg?seed=Cinque&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8','https://placehold.co/600x400?text=License+Cinque','https://placehold.co/600x400?text=VSATTP+Cinque','12 Linden Ave','P. Bến Nghé','Q.1','TP. Hồ Chí Minh',NULL,NULL,NULL,10.7765000,106.7010000,62000,80000,25,4.60,5,15.00,1,'active','2026-05-21 21:42:10',1,NULL,NULL,NULL,NULL,'2026-05-21 21:42:10','2026-08-13 01:50:08'),(2,8,2,'Junebug Burgers','junebug-burgers','Thịt bò đập dập trên bánh mì khoai tây.','Smash burger, sốt đặc trưng, mở đến nửa đêm.','+84281234002','https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1400&q=80','https://api.dicebear.com/9.x/shapes/svg?seed=Junebug&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8','https://placehold.co/600x400?text=License+Junebug','https://placehold.co/600x400?text=VSATTP+Junebug','88 Holloway St','P. Bến Thành','Q.1','TP. Hồ Chí Minh',NULL,NULL,NULL,10.7710000,106.6985000,50000,60000,20,5.00,1,15.00,1,'active','2026-05-21 21:42:10',1,NULL,NULL,NULL,NULL,'2026-05-21 21:42:10','2026-08-13 01:47:48'),(3,9,3,'Kaiseki & Co.','kaiseki-and-co','Omakase, phong cách edomae.','Sushi omakase cao cấp, cá nhập trực tiếp từ chợ Toyosu.','+84281234003','https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1400&q=80','https://api.dicebear.com/9.x/shapes/svg?seed=Kaiseki&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8','https://placehold.co/600x400?text=License+Kaiseki','https://placehold.co/600x400?text=VSATTP+Kaiseki','4 Sakura Ln','P. 9','Q. Phú Nhuận','TP. Hồ Chí Minh',NULL,NULL,NULL,10.7995000,106.6790000,100000,200000,35,5.00,1,18.00,1,'active','2026-05-21 21:42:10',1,NULL,NULL,NULL,NULL,'2026-05-21 21:42:10','2026-08-13 01:47:48'),(4,10,4,'Verdant Bowls','verdant-bowls','Tô ngũ cốc theo mùa.','Tô trộn theo mùa, nguyên liệu hữu cơ tại địa phương.','+84281234004','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=80','https://api.dicebear.com/9.x/shapes/svg?seed=Verdant&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8','https://placehold.co/600x400?text=License+Verdant',NULL,'15 Greenpoint Ave','P. Tân Phong','Q.7','TP. Hồ Chí Minh',NULL,NULL,NULL,10.7305000,106.7218000,50000,60000,18,0.00,0,15.00,0,'pending',NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-21 21:42:10','2026-08-13 01:05:47'),(5,11,3,'Hachi Ramen','hachi-ramen','Nước dùng xương heo ninh trong 14 giờ.','Ramen tonkotsu chuẩn vị Hakata, không hương liệu nhân tạo.','+84281234005','https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1400&q=80','https://api.dicebear.com/9.x/shapes/svg?seed=Hachi&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8','https://placehold.co/600x400?text=License+Hachi','https://placehold.co/600x400?text=VSATTP+Hachi','101 Mott St','P. Phạm Ngũ Lão','Q.1','TP. Hồ Chí Minh',NULL,NULL,NULL,10.7680000,106.6920000,62000,80000,22,4.00,1,15.00,1,'active','2026-05-21 21:42:10',1,NULL,NULL,NULL,NULL,'2026-05-21 21:42:10','2026-08-13 01:47:48'),(6,12,5,'La Carreta','la-carreta','Tacos al pastor, phục vụ cả ngày.','Tacos & burritos kiểu Mexico City, cay nhẹ tới cay đậm.','+84281234006','https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1400&q=80','https://api.dicebear.com/9.x/shapes/svg?seed=LaCarreta&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8','https://placehold.co/600x400?text=License+LaCarreta','https://placehold.co/600x400?text=VSATTP+LaCarreta','209 Avenue B','P. 12','Q. Tân Bình','TP. Hồ Chí Minh',NULL,NULL,NULL,10.8004000,106.6437000,37000,50000,20,0.00,0,16.00,0,'suspended','2026-05-21 21:42:10',1,NULL,NULL,NULL,NULL,'2026-05-21 21:42:10','2026-08-13 01:05:47'),(7,13,6,'Buena Onda Cafe','buena-onda-cafe','Cà phê, bánh ngọt, buổi sáng thư thái.','Cà phê specialty, bánh ngọt nướng trong ngày.','+84281234007','https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=80','https://api.dicebear.com/9.x/shapes/svg?seed=Buena&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8','https://placehold.co/600x400?text=License+Buena','https://placehold.co/600x400?text=VSATTP+Buena','24 Bedford Ave','P. 17','Q. Bình Thạnh','TP. Hồ Chí Minh',NULL,NULL,NULL,10.8055000,106.7068000,37000,40000,15,5.00,1,12.00,1,'active','2026-05-21 21:42:10',1,NULL,NULL,NULL,NULL,'2026-05-21 21:42:10','2026-08-13 01:47:48'),(8,14,7,'Dough & Donut','dough-and-donut','Bánh donut men phủ đường.','Donut men ủ qua đêm, phủ đường thủ công.','+84281234008','https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1400&q=80','https://api.dicebear.com/9.x/shapes/svg?seed=Dough&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8','https://placehold.co/600x400?text=License+Dough','https://placehold.co/600x400?text=VSATTP+Dough','6 Smith St','P. Tân Định','Q.1','TP. Hồ Chí Minh',NULL,NULL,NULL,10.7896000,106.6907000,37000,40000,15,0.00,0,12.00,0,'closed','2026-05-21 21:42:10',1,NULL,NULL,NULL,NULL,'2026-05-21 21:42:10','2026-08-13 01:05:47'),(108,121,100,'Bếp Sông Quê','bep-song-que-vi-tri-demo','Cơm nhà, canh nóng và món miền Tây mỗi ngày.','Bữa cơm miền Tây với món mặn, món canh và rau theo ngày.','+84910990001','https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=1400&q=80','https://api.dicebear.com/9.x/shapes/svg?seed=BepSongQue&backgroundColor=ffffff',NULL,NULL,'Ấp Cái Tàu Hạ','Cái Tàu Hạ','Phú Hựu','Đồng Tháp',NULL,NULL,NULL,10.2504000,105.8682000,0,30000,18,5.00,1,15.00,1,'active','2026-08-12 22:54:00',1,NULL,NULL,NULL,NULL,'2026-08-12 22:54:00','2026-08-13 01:47:48'),(109,122,6,'Cà Phê Bờ Kênh','ca-phe-bo-kenh-vi-tri-demo','Cà phê pha máy, bánh ngọt và thức uống mát lạnh.','Cà phê pha máy, thức uống mát và bánh ngọt dùng trong ngày.','+84910990002','https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1400&q=80','https://api.dicebear.com/9.x/shapes/svg?seed=CaPheBoKenh&backgroundColor=ffffff',NULL,NULL,'Ấp Cái Tàu Hạ','Cái Tàu Hạ','Phú Hựu','Đồng Tháp',NULL,NULL,NULL,10.2547000,105.8753000,0,25000,10,4.00,1,12.00,1,'active','2026-08-12 22:54:00',1,NULL,NULL,NULL,NULL,'2026-08-12 22:54:00','2026-08-13 01:47:48'),(110,123,100,'Ăn Vặt Chợ Chiều','an-vat-cho-chieu-vi-tri-demo','Món ăn vặt nóng hổi cho buổi xế.','Các món ăn vặt quen thuộc, được chuẩn bị nóng khi nhận đơn.','+84910990003','https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=1400&q=80','https://api.dicebear.com/9.x/shapes/svg?seed=AnVatChoChieu&backgroundColor=ffffff',NULL,NULL,'Ấp Phú Thạnh','Cái Tàu Hạ','Phú Hựu','Đồng Tháp',NULL,NULL,NULL,10.2427000,105.8598000,0,20000,12,5.00,1,12.00,1,'active','2026-08-12 22:54:00',1,NULL,NULL,NULL,NULL,'2026-08-12 22:54:00','2026-08-13 01:47:48'),(115,132,100,'Bún Cá Hưng Phú','bun-ca-hung-phu','Bún cá miền Tây thanh vị, chuẩn bị nóng theo từng đơn.','Bún cá, chả cá và các món nước mang hương vị miền Tây.','+84910990101','https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1400&q=80','https://api.dicebear.com/9.x/shapes/svg?seed=BunCaHungPhu&backgroundColor=ffffff',NULL,NULL,'Phường Hưng Phú','Hưng Phú',NULL,'Cần Thơ',NULL,NULL,NULL,9.9845360,105.7889760,0,30000,16,5.00,1,15.00,1,'active','2026-08-13 00:47:38',1,NULL,NULL,NULL,NULL,'2026-08-13 00:47:38','2026-08-13 01:47:48'),(116,133,100,'Cơm Gà Trương Vĩnh Nguyên','com-ga-truong-vinh-nguyen','Cơm gà nóng, phần ăn vừa vị cho bữa trưa và bữa tối.','Cơm gà quay, gà xối mỡ và món ăn kèm được chuẩn bị trong ngày.','+84910990102','https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1400&q=80','https://api.dicebear.com/9.x/shapes/svg?seed=ComGaTruongVinhNguyen&backgroundColor=ffffff',NULL,NULL,'Đường Trương Vĩnh Nguyên','Hưng Phú',NULL,'Cần Thơ',NULL,NULL,NULL,9.9881000,105.7928000,0,35000,18,4.00,1,15.00,1,'active','2026-08-13 00:47:38',1,NULL,NULL,NULL,NULL,'2026-08-13 00:47:38','2026-08-13 01:47:48'),(117,134,6,'Tiệm Trà Hưng Phú','tiem-tra-hung-phu','Trà trái cây và cà phê pha mới mỗi ngày.','Thức uống ít ngọt, trà trái cây và bánh dùng kèm cho buổi xế.','+84910990103','https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1400&q=80','https://api.dicebear.com/9.x/shapes/svg?seed=TiemTraHungPhu&backgroundColor=ffffff',NULL,NULL,'Phường Hưng Phú','Hưng Phú',NULL,'Cần Thơ',NULL,NULL,NULL,9.9799000,105.7839000,0,25000,8,5.00,1,12.00,1,'active','2026-08-13 00:47:38',1,NULL,NULL,NULL,NULL,'2026-08-13 00:47:38','2026-08-13 01:47:48');
/*!40000 ALTER TABLE `restaurants` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `restaurant_id` bigint unsigned NOT NULL,
  `rating` tinyint unsigned NOT NULL,
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_hidden` tinyint(1) NOT NULL DEFAULT '0',
  `reply_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `reply_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `menu_item_id` bigint unsigned DEFAULT NULL,
  `is_edited` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_order_item` (`customer_id`,`order_id`,`menu_item_id`),
  UNIQUE KEY `uq_reviews_order_item` (`order_id`,`menu_item_id`),
  KEY `idx_rev_rest` (`restaurant_id`),
  KEY `idx_rev_cust` (`customer_id`),
  KEY `idx_reviews_order` (`order_id`),
  KEY `idx_reviews_menu_visible_created` (`menu_item_id`,`is_hidden`,`created_at`),
  KEY `idx_reviews_rest_visible_created` (`restaurant_id`,`menu_item_id`,`is_hidden`,`created_at`),
  CONSTRAINT `fk_rev_cust` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rev_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rev_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_menu_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6025 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,9,20,1,5,'Đế bánh được nướng cháy cạnh hoàn hảo. Salsiccia là chiếc pizza ngon nhất tôi từng ăn trong năm nay.',0,'Cảm ơn bạn rất nhiều — hẹn gặp lại nhé!','2026-05-19 21:42:10','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0),(2,10,21,1,4,'Giao hàng hơi chậm một chút nhưng đồ ăn đã bù đắp lại tất cả.',0,NULL,NULL,'2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0),(3,11,22,1,5,'Salad Burrata thật tuyệt vời. Sẽ đặt lại vào tuần tới.',0,'Cảm ơn Sky! Sẽ chuẩn bị thêm burrata tươi cho lần sau.','2026-05-08 21:42:10','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0),(6001,2001,2,2,5,'Đóng gói cẩn thận, món đến vẫn còn nóng.',0,NULL,NULL,'2026-08-12 00:00:00','2026-08-12 00:00:00',NULL,0),(6002,2001,2,2,5,'Burger đậm vị và phần ăn vừa đủ.',0,NULL,NULL,'2026-08-12 00:00:00','2026-08-12 00:00:00',6,0),(6003,2002,15,3,5,'Nguyên liệu tươi, trình bày đẹp.',0,NULL,NULL,'2026-08-11 00:00:00','2026-08-11 00:00:00',NULL,0),(6004,2002,15,3,5,'Cá tươi và cơm nắm vừa miệng.',0,NULL,NULL,'2026-08-11 00:00:00','2026-08-11 00:00:00',11,0),(6005,2003,16,5,4,'Quán chuẩn bị nhanh, đóng gói chắc chắn.',0,NULL,NULL,'2026-08-10 00:00:00','2026-08-10 00:00:00',NULL,0),(6006,2003,16,5,5,'Nước dùng thơm và béo vừa phải.',0,NULL,NULL,'2026-08-10 00:00:00','2026-08-10 00:00:00',18,0),(6007,2004,17,7,5,'Cà phê ngon, giao đúng giờ.',0,NULL,NULL,'2026-08-08 00:00:00','2026-08-08 00:00:00',NULL,0),(6008,2004,17,7,4,'Vị cà phê cân bằng, sữa mịn.',0,NULL,NULL,'2026-08-08 00:00:00','2026-08-08 00:00:00',25,0),(6009,2005,18,108,5,'Món nhà làm dễ ăn, khẩu phần hợp lý.',0,NULL,NULL,'2026-08-06 00:00:00','2026-08-06 00:00:00',NULL,0),(6010,2005,18,108,5,'Sườn mềm và ướp rất vừa vị.',0,NULL,NULL,'2026-08-06 00:00:00','2026-08-06 00:00:00',100,0),(6011,2006,19,109,4,'Quán phục vụ nhanh và thân thiện.',0,NULL,NULL,'2026-08-04 00:00:00','2026-08-04 00:00:00',NULL,0),(6012,2006,19,109,4,'Cà phê thơm, đúng yêu cầu ít đá.',0,NULL,NULL,'2026-08-04 00:00:00','2026-08-04 00:00:00',104,0),(6013,2007,20,110,5,'Đồ ăn vặt đa dạng, đóng gói sạch.',0,NULL,NULL,'2026-08-01 00:00:00','2026-08-01 00:00:00',NULL,0),(6014,2007,20,110,5,'Bánh tráng trộn đậm đà nhưng không quá cay.',0,NULL,NULL,'2026-08-01 00:00:00','2026-08-01 00:00:00',108,0),(6015,2008,21,115,5,'Nước dùng trong và quán chuẩn bị rất nhanh.',0,NULL,NULL,'2026-07-28 00:00:00','2026-07-28 00:00:00',NULL,0),(6016,2008,21,115,5,'Bún cá nhiều topping, cá không tanh.',0,NULL,NULL,'2026-07-28 00:00:00','2026-07-28 00:00:00',115,0),(6017,2009,22,116,4,'Cơm ngon, phần ăn đầy đặn.',0,NULL,NULL,'2026-07-23 00:00:00','2026-07-23 00:00:00',NULL,0),(6018,2009,22,116,5,'Da gà giòn, thịt vẫn mềm.',0,NULL,NULL,'2026-07-23 00:00:00','2026-07-23 00:00:00',119,0),(6019,2010,2,117,5,'Đồ uống đóng gói đẹp và không bị đổ.',0,NULL,NULL,'2026-07-17 00:00:00','2026-07-17 00:00:00',NULL,0),(6020,2010,2,117,4,'Trà thơm, mức đường đúng yêu cầu.',0,NULL,NULL,'2026-07-17 00:00:00','2026-07-17 00:00:00',123,0),(6021,2015,18,1,5,'Pizza nóng, đế giòn và giao rất đúng giờ.',0,NULL,NULL,'2026-08-13 09:00:00','2026-08-13 09:00:00',NULL,0),(6022,2015,18,1,5,'Margherita thơm mùi húng quế, phô mai vừa đủ.',0,NULL,NULL,'2026-08-13 09:00:00','2026-08-13 09:00:00',1,0),(6023,2016,19,1,4,'Quán đóng gói đẹp và món ăn đúng mô tả.',0,NULL,NULL,'2026-08-13 12:00:00','2026-08-13 12:00:00',NULL,0),(6024,2016,19,1,5,'Xúc xích đậm vị, phần bánh đủ cho một người.',0,NULL,NULL,'2026-08-13 12:00:00','2026-08-13 12:00:00',3,0);
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint unsigned NOT NULL,
  `role` enum('customer','merchant','driver','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `granted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`role`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,'admin','2026-05-21 21:42:10'),(2,'customer','2026-05-21 21:42:10'),(3,'customer','2026-05-21 21:42:10'),(3,'driver','2026-05-21 21:42:10'),(4,'customer','2026-05-21 21:42:10'),(4,'driver','2026-05-21 21:42:10'),(5,'driver','2026-05-21 21:42:10'),(6,'customer','2026-05-21 21:42:10'),(6,'driver','2026-05-21 21:42:10'),(7,'customer','2026-05-21 21:42:10'),(7,'merchant','2026-05-21 21:42:10'),(8,'customer','2026-05-21 21:42:10'),(8,'merchant','2026-05-21 21:42:10'),(9,'merchant','2026-05-21 21:42:10'),(10,'merchant','2026-05-21 21:42:10'),(11,'merchant','2026-05-21 21:42:10'),(12,'merchant','2026-05-21 21:42:10'),(13,'merchant','2026-05-21 21:42:10'),(14,'merchant','2026-05-21 21:42:10'),(15,'customer','2026-05-21 21:42:10'),(16,'customer','2026-05-21 21:42:10'),(17,'customer','2026-05-21 21:42:10'),(18,'customer','2026-05-21 21:42:10'),(19,'customer','2026-05-21 21:42:10'),(20,'customer','2026-05-21 21:42:10'),(21,'customer','2026-05-21 21:42:10'),(22,'customer','2026-05-21 21:42:10'),(100,'customer','2026-05-21 21:55:26'),(102,'admin','2026-05-21 22:31:26'),(103,'customer','2026-05-22 20:41:26'),(108,'customer','2026-08-12 21:13:53'),(121,'merchant','2026-08-12 22:54:00'),(122,'merchant','2026-08-12 22:54:00'),(123,'merchant','2026-08-12 22:54:00'),(132,'merchant','2026-08-13 00:47:38'),(133,'merchant','2026-08-13 00:47:38'),(134,'merchant','2026-08-13 00:47:38');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_role` enum('customer','merchant','driver','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  `status` enum('pending','active','suspended','banned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `email_verified_at` datetime DEFAULT NULL,
  `phone_verified_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `token_version` int unsigned NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `suspension_expires_at` datetime DEFAULT NULL,
  `suspension_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`),
  KEY `idx_users_role` (`primary_role`),
  KEY `idx_users_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=154 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'avery@nomnom.example','+84901000001','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Avery Park','https://api.dicebear.com/9.x/avataaars/svg?seed=Avery%20Park&radius=50','admin','active','2026-05-21 21:42:10','2026-05-21 21:42:10','2026-08-13 01:49:23',0,'2026-05-21 21:42:10','2026-08-13 01:49:23',NULL,NULL),(2,'mara@example.com','+84901000002','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Mara Chen','https://api.dicebear.com/9.x/avataaars/svg?seed=Mara%20Chen&radius=50','customer','active','2026-05-21 21:42:10','2026-05-21 21:42:10','2026-08-13 01:49:22',0,'2026-05-21 21:42:10','2026-08-13 01:49:22',NULL,NULL),(3,'owen.r@example.com','+84901000003','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Owen Reyes','https://api.dicebear.com/9.x/avataaars/svg?seed=Owen%20Reyes&radius=50','driver','active','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(4,'iris.m@example.com','+84901000004','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Iris Mendez','https://api.dicebear.com/9.x/avataaars/svg?seed=Iris%20Mendez&radius=50','driver','active','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(5,'felix.t@example.com','+84901000005','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Felix Tao','https://api.dicebear.com/9.x/avataaars/svg?seed=Felix%20Tao&radius=50','driver','active',NULL,NULL,NULL,0,'2026-05-21 21:42:10','2026-05-30 20:28:45',NULL,NULL),(6,'sasha.p@example.com','+84901000006','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Sasha Park','https://api.dicebear.com/9.x/avataaars/svg?seed=Sasha%20Park&radius=50','driver','active','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(7,'owner@cinque.example','+84901000007','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Marco Bello','https://api.dicebear.com/9.x/avataaars/svg?seed=Marco%20Bello&radius=50','merchant','active','2026-05-21 21:42:10','2026-05-21 21:42:10','2026-08-13 01:49:22',0,'2026-05-21 21:42:10','2026-08-13 01:49:22',NULL,NULL),(8,'r@junebug.example','+84901000008','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Reese Anya','https://api.dicebear.com/9.x/avataaars/svg?seed=Reese%20Anya&radius=50','merchant','active','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(9,'sora@kaiseki.example','+84901000009','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Sora Iida','https://api.dicebear.com/9.x/avataaars/svg?seed=Sora%20Iida&radius=50','merchant','active','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(10,'naomi@verdant.example','+84901000010','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Naomi Kato','https://api.dicebear.com/9.x/avataaars/svg?seed=Naomi%20Kato&radius=50','merchant','pending',NULL,NULL,NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(11,'ren@hachi.example','+84901000011','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Ren Ozaki','https://api.dicebear.com/9.x/avataaars/svg?seed=Ren%20Ozaki&radius=50','merchant','active','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(12,'lupe@carreta.example','+84901000012','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Lupe Martinez','https://api.dicebear.com/9.x/avataaars/svg?seed=Lupe%20Martinez&radius=50','merchant','suspended','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(13,'owner@buenaonda.example','+84901000013','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Bea Lopez','https://api.dicebear.com/9.x/avataaars/svg?seed=Bea%20Lopez&radius=50','merchant','active','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(14,'owner@doughdonut.example','+84901000014','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Daly Smith','https://api.dicebear.com/9.x/avataaars/svg?seed=Daly%20Smith&radius=50','merchant','active','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(15,'owen.t@example.com','+84901000015','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Owen Tran','https://api.dicebear.com/9.x/avataaars/svg?seed=Owen%20Tran&radius=50','customer','active','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(16,'rae.p@example.com','+84901000016','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Rae Pham','https://api.dicebear.com/9.x/avataaars/svg?seed=Rae%20Pham&radius=50','customer','active','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(17,'lia.d@example.com','+84901000017','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Lia Do','https://api.dicebear.com/9.x/avataaars/svg?seed=Lia%20Do&radius=50','customer','active','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(18,'sam.k@example.com','+84901000018','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Sam Kim','https://api.dicebear.com/9.x/avataaars/svg?seed=Sam%20Kim&radius=50','customer','active','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(19,'kai.v@example.com','+84901000019','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Kai Vu','https://api.dicebear.com/9.x/avataaars/svg?seed=Kai%20Vu&radius=50','customer','active','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(20,'jamie.p@example.com','+84901000020','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Jamie Phan','https://api.dicebear.com/9.x/avataaars/svg?seed=Jamie%20P.&radius=50','customer','active','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(21,'daniel.l@example.com','+84901000021','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Daniel Le','https://api.dicebear.com/9.x/avataaars/svg?seed=Daniel%20L.&radius=50','customer','active','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(22,'sky.r@example.com','+84901000022','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Sky Reyes','https://api.dicebear.com/9.x/avataaars/svg?seed=Sky%20R.&radius=50','customer','active','2026-05-21 21:42:10','2026-05-21 21:42:10',NULL,0,'2026-05-21 21:42:10','2026-05-21 21:50:17',NULL,NULL),(100,'test.customer@example.com',NULL,'$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Test Customer','https://api.dicebear.com/9.x/avataaars/svg?seed=Test%20Customer&radius=50','customer','active','2026-05-21 21:55:26',NULL,NULL,0,'2026-05-21 21:55:26','2026-05-21 21:55:26',NULL,NULL),(102,'admin.team@example.com','+84901000102','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','NomNom Admin','https://api.dicebear.com/9.x/avataaars/svg?seed=NomNom%20Admin&radius=50','admin','active','2026-05-21 22:31:26',NULL,NULL,0,'2026-05-21 22:31:26','2026-05-21 22:31:26',NULL,NULL),(103,'customer.extra@example.com',NULL,'$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Extra Customer','https://api.dicebear.com/9.x/avataaars/svg?seed=Extra%20Customer&radius=50','customer','active','2026-05-22 20:41:26',NULL,NULL,0,'2026-05-22 20:41:26','2026-05-22 20:41:26',NULL,NULL),(108,'dyna6046@emalupe.com',NULL,'$2b$10$38IfeQ6mFixM5xZOop11l.PP9/1s5r861RqHjLxEia4FAQ8BTHKUO','dyna6046@emalupe.com','https://api.dicebear.com/9.x/avataaars/svg?seed=dyna6046%40emalupe.com&radius=50','customer','active','2026-08-12 21:13:53',NULL,'2026-08-13 01:46:11',0,'2026-08-12 21:13:53','2026-08-13 01:46:11',NULL,NULL),(121,'seed.bep-song-que@nomnom.example','+84910990001','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Chủ quán Bếp Sông Quê','https://api.dicebear.com/9.x/avataaars/svg?seed=BepSongQue&radius=50','merchant','active','2026-08-12 22:54:00',NULL,NULL,0,'2026-08-12 22:54:00','2026-08-12 22:54:00',NULL,NULL),(122,'seed.ca-phe-bo-kenh@nomnom.example','+84910990002','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Chủ quán Cà Phê Bờ Kênh','https://api.dicebear.com/9.x/avataaars/svg?seed=CaPheBoKenh&radius=50','merchant','active','2026-08-12 22:54:00',NULL,NULL,0,'2026-08-12 22:54:00','2026-08-12 22:54:00',NULL,NULL),(123,'seed-an-vat-cho-chieu@nomnom.example','+84910990003','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Chủ quán Ăn Vặt Chợ Chiều','https://api.dicebear.com/9.x/avataaars/svg?seed=AnVatChoChieu&radius=50','merchant','active','2026-08-12 22:54:00',NULL,NULL,0,'2026-08-12 22:54:00','2026-08-12 22:54:00',NULL,NULL),(132,'seed.bun-ca-hung-phu@nomnom.example','+84910990101','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Chủ quán Bún Cá Hưng Phú','https://api.dicebear.com/9.x/avataaars/svg?seed=BunCaHungPhu&radius=50','merchant','active','2026-08-13 00:47:38',NULL,NULL,0,'2026-08-13 00:47:38','2026-08-13 00:47:38',NULL,NULL),(133,'seed.com-ga-truong-vinh-nguyen@nomnom.example','+84910990102','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Chủ quán Cơm Gà Trương Vĩnh Nguyên','https://api.dicebear.com/9.x/avataaars/svg?seed=ComGaTruongVinhNguyen&radius=50','merchant','active','2026-08-13 00:47:38',NULL,NULL,0,'2026-08-13 00:47:38','2026-08-13 00:47:38',NULL,NULL),(134,'seed.tiem-tra-hung-phu@nomnom.example','+84910990103','$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO','Chủ quán Tiệm Trà Hưng Phú','https://api.dicebear.com/9.x/avataaars/svg?seed=TiemTraHungPhu&radius=50','merchant','active','2026-08-13 00:47:38',NULL,NULL,0,'2026-08-13 00:47:38','2026-08-13 00:47:38',NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `uploaded_assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uploaded_assets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `owner_user_id` bigint unsigned NOT NULL,
  `public_id` varchar(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `secure_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `folder` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_uploaded_assets_public_id` (`public_id`),
  KEY `idx_uploaded_assets_owner` (`owner_user_id`,`deleted_at`),
  CONSTRAINT `fk_uploaded_assets_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

DROP TABLE IF EXISTS `voucher_redemptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voucher_redemptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `voucher_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned NOT NULL,
  `discount_amount` bigint unsigned NOT NULL,
  `status` enum('reserved','redeemed','released') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'reserved',
  `redeemed_at` datetime DEFAULT NULL,
  `released_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_voucher_redemptions_order` (`order_id`),
  KEY `idx_voucher_redemptions_usage` (`voucher_id`,`status`),
  KEY `idx_voucher_redemptions_customer` (`voucher_id`,`customer_id`,`status`),
  KEY `fk_voucher_redemptions_customer` (`customer_id`),
  CONSTRAINT `fk_voucher_redemptions_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_voucher_redemptions_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_voucher_redemptions_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `voucher_redemptions` WRITE;
/*!40000 ALTER TABLE `voucher_redemptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `voucher_redemptions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vouchers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `restaurant_id` bigint unsigned DEFAULT NULL,
  `created_by_user_id` bigint unsigned NOT NULL,
  `code` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_type` enum('percent','fixed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` bigint unsigned NOT NULL,
  `max_discount_amount` bigint unsigned DEFAULT NULL,
  `min_order_amount` bigint unsigned NOT NULL DEFAULT '0',
  `usage_limit` int unsigned DEFAULT NULL,
  `per_user_limit` int unsigned NOT NULL DEFAULT '1',
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `status` enum('draft','active','paused') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `is_public` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vouchers_code` (`code`),
  KEY `idx_vouchers_restaurant_status_window` (`restaurant_id`,`status`,`starts_at`,`ends_at`),
  KEY `idx_vouchers_created_by` (`created_by_user_id`),
  CONSTRAINT `fk_vouchers_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_vouchers_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_vouchers_per_user_limit` CHECK ((`per_user_limit` > 0)),
  CONSTRAINT `chk_vouchers_value` CHECK ((`discount_value` > 0)),
  CONSTRAINT `chk_vouchers_window` CHECK ((`ends_at` > `starts_at`))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES (1,NULL,1,'NOMNOM15','NOMNOM15','Giảm 15% cho đơn hàng trên NomNom.','percent',15,250000,0,NULL,1,'2026-01-01 00:00:00','2027-12-31 23:59:59','active',1,'2026-08-12 13:18:47','2026-08-12 13:18:47'),(2,NULL,1,'NEW50K','NEW50K','Giảm 50.000 đ cho đơn hàng đầu tiên.','fixed',50000,NULL,200000,NULL,1,'2026-01-01 00:00:00','2027-12-31 23:59:59','active',1,'2026-08-12 13:18:47','2026-08-12 13:18:47');
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `wallet_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet_transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `wallet_id` bigint unsigned NOT NULL,
  `direction` enum('credit','debit') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` bigint unsigned NOT NULL,
  `balance_after` bigint NOT NULL,
  `tx_type` enum('order_earning','commission','order_payment','withdrawal','adjustment') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` enum('order','payout','manual') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint unsigned DEFAULT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `performed_by_user_id` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wt_wallet` (`wallet_id`,`created_at`),
  KEY `idx_wt_ref` (`reference_type`,`reference_id`),
  KEY `fk_wt_admin` (`performed_by_user_id`),
  CONSTRAINT `fk_wt_admin` FOREIGN KEY (`performed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_wt_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `wallet_transactions` WRITE;
/*!40000 ALTER TABLE `wallet_transactions` DISABLE KEYS */;
INSERT INTO `wallet_transactions` VALUES (1,4,'credit',340000,340000,'order_earning','order',7,'Doanh thu đơn ORD-P9X22',NULL,'2026-05-21 21:42:10'),(2,4,'credit',861900,1201900,'order_earning','order',8,'Doanh thu đơn ORD-J11HQ',NULL,'2026-05-21 21:42:10'),(3,4,'credit',372300,1574200,'order_earning','order',9,'Doanh thu đơn ORD-RV001',NULL,'2026-05-21 21:42:10'),(4,4,'credit',287300,1861500,'order_earning','order',10,'Doanh thu đơn ORD-RV002',NULL,'2026-05-21 21:42:10'),(5,4,'credit',255000,2116500,'order_earning','order',11,'Doanh thu đơn ORD-RV003',NULL,'2026-05-21 21:42:10'),(6,4,'debit',616500,1500000,'withdrawal','payout',4,'Rút tiền PYT-004 đã hoàn tất',1,'2026-05-21 21:42:10'),(7,1,'credit',40000,40000,'order_earning','order',2,'Tiền chuyến ORD-Q3K9P',NULL,'2026-05-21 21:42:10'),(8,1,'credit',49600,89600,'order_earning','order',9,'Tiền chuyến ORD-RV001',NULL,'2026-05-21 21:42:10'),(9,2,'credit',49600,850000,'order_earning','order',7,'Tiền chuyến ORD-P9X22 (COD)',NULL,'2026-05-21 21:42:10'),(10,2,'debit',462000,388000,'order_payment','order',7,'COD: tài xế thu hộ — sẽ đối soát',NULL,'2026-05-21 21:42:10'),(11,2,'credit',462000,850000,'adjustment','manual',NULL,'Nộp lại tiền COD vào cuối ca',1,'2026-05-21 21:42:10');
/*!40000 ALTER TABLE `wallet_transactions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `wallets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `owner_type` enum('driver','merchant') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `balance` bigint NOT NULL DEFAULT '0',
  `pending_balance` bigint NOT NULL DEFAULT '0',
  `total_earned` bigint NOT NULL DEFAULT '0',
  `total_withdrawn` bigint NOT NULL DEFAULT '0',
  `is_locked` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wallet_owner` (`user_id`,`owner_type`),
  CONSTRAINT `fk_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `wallets` WRITE;
/*!40000 ALTER TABLE `wallets` DISABLE KEYS */;
INSERT INTO `wallets` VALUES (1,3,'driver',642000,49600,4580000,3938000,0,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(2,4,'driver',850000,0,5200000,4350000,0,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(3,6,'driver',320000,0,1240000,920000,0,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(4,7,'merchant',1500000,0,2116500,616500,0,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(5,8,'merchant',4300000,0,9850000,5550000,0,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(6,9,'merchant',3200000,0,7340000,4140000,0,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(7,11,'merchant',6800000,0,14120000,7320000,0,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(8,13,'merchant',1100000,0,2450000,1350000,0,'2026-05-21 21:42:10','2026-05-21 21:42:10'),(100,121,'merchant',350000,0,850000,500000,0,'2026-08-13 01:47:48','2026-08-13 01:47:48'),(101,122,'merchant',350000,0,850000,500000,0,'2026-08-13 01:47:48','2026-08-13 01:47:48'),(102,123,'merchant',350000,0,850000,500000,0,'2026-08-13 01:47:48','2026-08-13 01:47:48'),(103,132,'merchant',350000,0,850000,500000,0,'2026-08-13 01:47:48','2026-08-13 01:47:48'),(104,133,'merchant',350000,0,850000,500000,0,'2026-08-13 01:47:48','2026-08-13 01:47:48'),(105,134,'merchant',350000,0,850000,500000,0,'2026-08-13 01:47:48','2026-08-13 01:47:48');
/*!40000 ALTER TABLE `wallets` ENABLE KEYS */;
UNLOCK TABLES;

-- Final three-role demo reconciliation: delivery fee belongs to platform operations.
-- Only report seed rows are adjusted; legacy driver and user-created orders are untouched.
UPDATE orders o
JOIN restaurants r ON r.id = o.restaurant_id
LEFT JOIN vouchers v ON v.id = o.voucher_id
SET
  o.merchant_earning =
    (CASE WHEN v.restaurant_id IS NOT NULL THEN GREATEST(0, o.subtotal - o.discount_amount) ELSE o.subtotal END)
    - FLOOR(
      (CASE WHEN v.restaurant_id IS NOT NULL THEN GREATEST(0, o.subtotal - o.discount_amount) ELSE o.subtotal END)
      * r.commission_rate / 100
    ),
  o.platform_fee =
    FLOOR(
      (CASE WHEN v.restaurant_id IS NOT NULL THEN GREATEST(0, o.subtotal - o.discount_amount) ELSE o.subtotal END)
      * r.commission_rate / 100
    ) + o.delivery_fee
WHERE o.order_code LIKE 'DEMO-%'
  AND o.driver_id IS NULL
  AND COALESCE(o.driver_earning, 0) = 0;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
