-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Máy chủ: localhost
-- Thời gian đã tạo: Th5 21, 2026 lúc 03:49 PM
-- Phiên bản máy phục vụ: 8.0.44
-- Phiên bản PHP: 8.2.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `nomnom`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `carts`
--

CREATE TABLE `carts` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `restaurant_id` bigint UNSIGNED NOT NULL,
  `status` enum('active','converted','abandoned') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `cart_items`
--

CREATE TABLE `cart_items` (
  `id` bigint UNSIGNED NOT NULL,
  `cart_id` bigint UNSIGNED NOT NULL,
  `menu_item_id` bigint UNSIGNED NOT NULL,
  `quantity` smallint UNSIGNED NOT NULL DEFAULT '1',
  `unit_price` bigint UNSIGNED NOT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `cuisines`
--

CREATE TABLE `cuisines` (
  `id` smallint UNSIGNED NOT NULL,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `cuisines`
--

INSERT INTO `cuisines` (`id`, `name`, `slug`, `icon_url`, `sort_order`, `created_at`) VALUES
(1, 'Ý', 'italian', NULL, 1, '2026-05-21 21:42:10'),
(2, 'Mỹ', 'american', NULL, 2, '2026-05-21 21:42:10'),
(3, 'Nhật', 'japanese', NULL, 3, '2026-05-21 21:42:10'),
(4, 'Lành mạnh', 'healthy', NULL, 4, '2026-05-21 21:42:10'),
(5, 'Mexico', 'mexican', NULL, 5, '2026-05-21 21:42:10'),
(6, 'Cà phê', 'coffee', NULL, 6, '2026-05-21 21:42:10'),
(7, 'Tiệm bánh', 'bakery', NULL, 7, '2026-05-21 21:42:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `customer_addresses`
--

CREATE TABLE `customer_addresses` (
  `id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `label` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `line1` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ward` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `delivery_note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `customer_addresses`
--

INSERT INTO `customer_addresses` (`id`, `customer_id`, `label`, `recipient_name`, `recipient_phone`, `line1`, `ward`, `district`, `city`, `latitude`, `longitude`, `delivery_note`, `is_default`, `created_at`, `updated_at`) VALUES
(1, 2, 'Nhà', 'Mara Chen', '+84901000002', '120 Wythe Ave, Apt 3B', 'P. Bến Nghé', 'Q.1', 'TP. Hồ Chí Minh', 10.7795000, 106.6991000, 'Bấm chuông căn hộ 3B', 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(2, 2, 'Văn phòng', 'Mara Chen', '+84901000002', '88 Holloway St, Tầng 4', 'P. Bến Thành', 'Q.1', 'TP. Hồ Chí Minh', 10.7715000, 106.6981000, 'Để tại quầy lễ tân nếu vắng', 0, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(3, 15, 'Nhà', 'Owen Tran', '+84901000015', '301 Carroll St', 'P. Đa Kao', 'Q.1', 'TP. Hồ Chí Minh', 10.7873000, 106.6919000, NULL, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(4, 16, 'Nhà', 'Rae Pham', '+84901000016', '14 W 10th St', 'P. 6', 'Q. Bình Thạnh', 'TP. Hồ Chí Minh', 10.8030000, 106.7100000, NULL, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(5, 17, 'Nhà', 'Lia Do', '+84901000017', '24 Bedford Ave', 'P. 17', 'Q. Bình Thạnh', 'TP. Hồ Chí Minh', 10.8055000, 106.7068000, NULL, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(6, 18, 'Nhà', 'Sam Kim', '+84901000018', '6 Smith St', 'P. Tân Định', 'Q.1', 'TP. Hồ Chí Minh', 10.7896000, 106.6907000, NULL, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(7, 19, 'Nhà', 'Kai Vu', '+84901000019', '88 W 4th St', 'P. Cô Giang', 'Q.1', 'TP. Hồ Chí Minh', 10.7660000, 106.6960000, NULL, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(8, 20, 'Nhà', 'Jamie Phan', '+84901000020', '15 Greenpoint Ave', 'P. Tân Phong', 'Q.7', 'TP. Hồ Chí Minh', 10.7305000, 106.7218000, NULL, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(9, 21, 'Nhà', 'Daniel Le', '+84901000021', '209 Avenue B', 'P. 12', 'Q. Tân Bình', 'TP. Hồ Chí Minh', 10.8004000, 106.6437000, NULL, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(10, 22, 'Nhà', 'Sky Reyes', '+84901000022', '4 Sakura Ln', 'P. 9', 'Q. Phú Nhuận', 'TP. Hồ Chí Minh', 10.7990000, 106.6791000, NULL, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `customer_profiles`
--

CREATE TABLE `customer_profiles` (
  `user_id` bigint UNSIGNED NOT NULL,
  `default_address_id` bigint UNSIGNED DEFAULT NULL,
  `preferred_language` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'vi',
  `marketing_opt_in` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `customer_profiles`
--

INSERT INTO `customer_profiles` (`user_id`, `default_address_id`, `preferred_language`, `marketing_opt_in`, `created_at`, `updated_at`) VALUES
(2, 1, 'vi', 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(3, NULL, 'vi', 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(4, NULL, 'vi', 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(6, NULL, 'vi', 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(7, NULL, 'vi', 0, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(8, NULL, 'vi', 0, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(15, 3, 'vi', 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(16, 4, 'vi', 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(17, 5, 'vi', 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(18, 6, 'vi', 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(19, 7, 'vi', 0, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(20, 8, 'vi', 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(21, 9, 'vi', 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(22, 10, 'vi', 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(100, NULL, 'vi', 1, '2026-05-21 21:55:26', '2026-05-21 21:55:26'),
(102, NULL, 'vi', 1, '2026-05-21 22:31:26', '2026-05-21 22:31:26');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `driver_assignments`
--

CREATE TABLE `driver_assignments` (
  `id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `driver_id` bigint UNSIGNED NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `arrived_pickup_at` datetime DEFAULT NULL,
  `picked_up_at` datetime DEFAULT NULL,
  `arrived_dropoff_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `status` enum('assigned','en_route_pickup','at_pickup','picked_up','en_route_dropoff','at_dropoff','delivered','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'assigned',
  `distance_km` decimal(6,2) NOT NULL DEFAULT '0.00',
  `earning_amount` bigint UNSIGNED NOT NULL DEFAULT '0',
  `proof_photo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `driver_assignments`
--

INSERT INTO `driver_assignments` (`id`, `order_id`, `driver_id`, `assigned_at`, `arrived_pickup_at`, `picked_up_at`, `arrived_dropoff_at`, `delivered_at`, `status`, `distance_km`, `earning_amount`, `proof_photo_url`, `created_at`, `updated_at`) VALUES
(1, 1, 3, '2026-05-21 21:32:10', '2026-05-21 21:36:10', '2026-05-21 21:39:10', NULL, NULL, 'en_route_dropoff', 3.40, 49600, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(2, 2, 3, '2026-05-20 19:57:10', '2026-05-20 20:12:10', '2026-05-20 20:22:10', '2026-05-20 20:37:10', '2026-05-20 20:42:10', 'delivered', 1.80, 40000, 'https://placehold.co/600x400?text=Proof+Q3K9P', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(3, 7, 4, '2026-05-21 20:52:10', '2026-05-21 21:04:10', '2026-05-21 21:12:10', '2026-05-21 21:24:10', '2026-05-21 21:27:10', 'delivered', 2.10, 49600, 'https://placehold.co/600x400?text=Proof+P9X22', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(4, 8, 6, '2026-05-21 20:22:10', '2026-05-21 20:37:10', '2026-05-21 20:47:10', '2026-05-21 21:00:10', '2026-05-21 21:02:10', 'delivered', 1.40, 49600, 'https://placehold.co/600x400?text=Proof+J11HQ', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(5, 9, 3, '2026-05-18 21:42:10', '2026-05-18 21:42:10', '2026-05-18 21:42:10', '2026-05-18 21:42:10', '2026-05-18 21:42:10', 'delivered', 5.40, 49600, 'https://placehold.co/600x400?text=Proof+RV001', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(6, 10, 4, '2026-05-14 21:42:10', '2026-05-14 21:42:10', '2026-05-14 21:42:10', '2026-05-14 21:42:10', '2026-05-14 21:42:10', 'delivered', 6.80, 49600, 'https://placehold.co/600x400?text=Proof+RV002', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(7, 11, 6, '2026-05-07 21:42:10', '2026-05-07 21:42:10', '2026-05-07 21:42:10', '2026-05-07 21:42:10', '2026-05-07 21:42:10', 'delivered', 3.10, 49600, 'https://placehold.co/600x400?text=Proof+RV003', '2026-05-21 21:42:10', '2026-05-21 21:42:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `driver_profiles`
--

CREATE TABLE `driver_profiles` (
  `user_id` bigint UNSIGNED NOT NULL,
  `national_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_license_no` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_type` enum('motorbike','bicycle','car') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'motorbike',
  `vehicle_model` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_plate` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_card_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_license_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `portrait_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_no` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_holder` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating_avg` decimal(3,2) NOT NULL DEFAULT '0.00',
  `total_trips` int UNSIGNED NOT NULL DEFAULT '0',
  `approval_status` enum('pending','approved','rejected','suspended') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_at` datetime DEFAULT NULL,
  `approved_by_admin_id` bigint UNSIGNED DEFAULT NULL,
  `is_online` tinyint(1) NOT NULL DEFAULT '0',
  `current_lat` decimal(10,7) DEFAULT NULL,
  `current_lng` decimal(10,7) DEFAULT NULL,
  `last_location_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `driver_profiles`
--

INSERT INTO `driver_profiles` (`user_id`, `national_id`, `driver_license_no`, `vehicle_type`, `vehicle_model`, `license_plate`, `id_card_url`, `driver_license_url`, `portrait_url`, `bank_account_no`, `bank_name`, `bank_account_holder`, `rating_avg`, `total_trips`, `approval_status`, `approved_at`, `approved_by_admin_id`, `is_online`, `current_lat`, `current_lng`, `last_location_at`, `created_at`, `updated_at`) VALUES
(3, '079203011234', 'B2-1234567', 'motorbike', 'Honda CB300R', '59X1-12345', 'https://placehold.co/600x400?text=ID+Owen', 'https://placehold.co/600x400?text=DL+Owen', 'https://placehold.co/600x400?text=Owen', '1903456789', 'Techcombank', 'OWEN REYES', 4.92, 1840, 'approved', '2026-05-21 21:42:10', 1, 1, 10.7790000, 106.6995000, '2026-05-21 21:42:10', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(4, '079203011235', 'A2-2233445', 'motorbike', 'Yamaha Sirius', '59A1-44882', 'https://placehold.co/600x400?text=ID+Iris', 'https://placehold.co/600x400?text=DL+Iris', 'https://placehold.co/600x400?text=Iris', '060034882001', 'Vietcombank', 'IRIS MENDEZ', 4.88, 1102, 'approved', '2026-05-21 21:42:10', 1, 0, 10.7700000, 106.7000000, '2026-05-21 21:42:10', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(5, '079203011236', NULL, 'motorbike', 'Honda Wave', '51X3-66120', 'https://placehold.co/600x400?text=ID+Felix', NULL, NULL, NULL, NULL, NULL, 0.00, 0, 'pending', NULL, NULL, 0, NULL, NULL, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(6, '079203011237', 'A2-1199223', 'motorbike', 'Honda Future', '51X1-89712', 'https://placehold.co/600x400?text=ID+Sasha', 'https://placehold.co/600x400?text=DL+Sasha', 'https://placehold.co/600x400?text=Sasha', '1119876543', 'BIDV', 'SASHA PARK', 4.85, 768, 'approved', '2026-05-21 21:42:10', 1, 1, 10.7820000, 106.6960000, '2026-05-21 21:42:10', '2026-05-21 21:42:10', '2026-05-21 21:42:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `home_promo_banners`
--

CREATE TABLE `home_promo_banners` (
  `id` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tag` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cta_label` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `link_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `home_promo_banners`
--

INSERT INTO `home_promo_banners` (`id`, `tag`, `title`, `subtitle`, `cta_label`, `image_url`, `link_url`, `sort_order`, `is_active`, `created_at`) VALUES
('promo-lunch', 'Trưa · 11–2', 'Miễn phí giao hàng cho đơn từ 500.000 ₫', 'Tránh giờ cao điểm văn phòng · T2–T6', 'Đặt bữa trưa', 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1000&q=80', '/app/search', 2, 1, '2026-05-21 21:42:10'),
('promo-new', 'Mới mở', '5 bếp mới tuần này', 'Thử ngay trước khi kín chỗ', 'Khám phá', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1000&q=80', '/app/search', 3, 1, '2026-05-21 21:42:10'),
('promo-nomnom15', 'Sử dụng NOMNOM15', 'Giảm 15% cho đơn hàng đầu tiên', 'Mỗi khách hàng một mã khuyến mãi · Giảm tối đa 250.000 ₫', 'Nhận ngay', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=80', '/app/profile/promotions', 1, 1, '2026-05-21 21:42:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `menu_categories`
--

CREATE TABLE `menu_categories` (
  `id` bigint UNSIGNED NOT NULL,
  `restaurant_id` bigint UNSIGNED NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `menu_categories`
--

INSERT INTO `menu_categories` (`id`, `restaurant_id`, `name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Cổ điển', NULL, 1, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(2, 1, 'Đặc sản', NULL, 2, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(3, 1, 'Món phụ', NULL, 3, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(4, 1, 'Tráng miệng', NULL, 4, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(5, 2, 'Hamburger', NULL, 1, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(6, 2, 'Bánh mì kẹp', NULL, 2, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(7, 2, 'Món phụ', NULL, 3, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(8, 2, 'Đồ uống', NULL, 4, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(9, 3, 'Nigiri', NULL, 1, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(10, 3, 'Tô trộn', NULL, 2, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(11, 3, 'Cuộn', NULL, 3, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(12, 3, 'Món phụ', NULL, 4, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(13, 4, 'Tô trộn', NULL, 1, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(14, 4, 'Đồ uống', NULL, 2, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(15, 5, 'Ramen', NULL, 1, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(16, 5, 'Món phụ', NULL, 2, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(17, 6, 'Tacos', NULL, 1, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(18, 6, 'Burritos', NULL, 2, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(19, 6, 'Món phụ', NULL, 3, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(20, 6, 'Đồ uống', NULL, 4, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(21, 7, 'Cà phê', NULL, 1, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(22, 7, 'Bánh ngọt', NULL, 2, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(23, 7, 'Brunch', NULL, 3, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(24, 8, 'Donuts', NULL, 1, 1, '2026-05-21 21:42:10', '2026-05-21 21:42:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `menu_items`
--

CREATE TABLE `menu_items` (
  `id` bigint UNSIGNED NOT NULL,
  `restaurant_id` bigint UNSIGNED NOT NULL,
  `category_id` bigint UNSIGNED NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` bigint UNSIGNED NOT NULL,
  `prep_time_min` smallint UNSIGNED NOT NULL DEFAULT '15',
  `in_stock` tinyint(1) NOT NULL DEFAULT '1',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` smallint NOT NULL DEFAULT '0',
  `total_sold` int UNSIGNED NOT NULL DEFAULT '0',
  `rating_avg` decimal(3,2) NOT NULL DEFAULT '0.00',
  `status` enum('active','hidden') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `menu_items`
--

INSERT INTO `menu_items` (`id`, `restaurant_id`, `category_id`, `name`, `description`, `image_url`, `price`, `prep_time_min`, `in_stock`, `is_featured`, `sort_order`, `total_sold`, `rating_avg`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Margherita', 'Cà chua San Marzano, phô mai tươi, húng quế.', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80', 338000, 18, 1, 1, 1, 184, 4.80, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(2, 1, 1, 'Funghi', 'Nấm Crimini, phô mai taleggio, cỏ xạ hương, dầu truffle.', 'https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&w=800&q=80', 400000, 20, 1, 0, 2, 96, 4.70, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(3, 1, 2, 'Salsiccia', 'Xúc xích thì là, phô mai mozzarella xông khói, ớt.', 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?auto=format&fit=crop&w=800&q=80', 438000, 22, 1, 1, 1, 71, 4.90, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(4, 1, 3, 'Burrata Salad', 'Cà chua gia truyền, dầu húng quế, muối biển.', 'https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=800&q=80', 300000, 10, 1, 0, 1, 58, 4.60, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(5, 1, 4, 'Tiramisu', 'Phô mai Mascarpone, espresso, ca cao.', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80', 188000, 5, 0, 0, 1, 42, 4.50, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(6, 2, 5, 'Cổ điển', 'Thịt bò đập dập gấp đôi, phô mai Mỹ, sốt bí mật.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', 288000, 14, 1, 1, 1, 220, 4.80, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(7, 2, 5, 'Cheddar Bacon', 'Phô mai Cheddar ủ, thịt xông khói ngào đường, dưa chuột muối.', 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=80', 325000, 16, 1, 0, 2, 144, 4.70, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(8, 2, 6, 'Gà giòn', 'Gà chiên sữa bơ, salad bắp cải, mật ong cay.', 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80', 313000, 18, 1, 0, 1, 92, 4.60, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(9, 2, 7, 'Khoai tây chiên', 'Cắt tay, muối biển, thảo mộc.', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80', 113000, 8, 1, 0, 1, 320, 4.50, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(10, 2, 8, 'Vanilla Shake', 'Vani Madagascar, kem tươi.', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80', 138000, 5, 1, 0, 1, 88, 4.70, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(11, 3, 9, 'Set Nigiri (8 miếng)', 'Cá ngừ, cá hồi, cá đuôi vàng, tôm.', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', 650000, 30, 1, 1, 1, 144, 4.95, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(12, 3, 10, 'Cơm bát cá hồi', 'Cơm sushi, cá hồi, bơ, đậu nành Nhật.', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80', 450000, 25, 1, 0, 1, 92, 4.85, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(13, 3, 11, 'Spicy Tuna Roll', 'Cá ngừ vây vàng, dầu ớt, hành lá.', 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=800&q=80', 350000, 20, 1, 0, 1, 68, 4.80, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(14, 3, 12, 'Súp Miso', 'Miso trắng, đậu phụ, hành lá.', 'https://images.unsplash.com/photo-1607301405390-d831c242f59b?auto=format&fit=crop&w=800&q=80', 113000, 8, 1, 0, 1, 110, 4.60, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(15, 4, 13, 'Tô mùa vụ', 'Diêm mạch, cải xoăn, bí đỏ, sốt mè.', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', 325000, 12, 1, 1, 1, 64, 4.65, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(16, 4, 13, 'Buddha Bowl', 'Cơm lứt, đậu phụ, đậu nành Nhật, gừng.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', 313000, 14, 1, 0, 2, 52, 4.55, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(17, 4, 14, 'Sinh tố xanh', 'Cải xoăn, chuối, hạnh nhân, hạt gai dầu.', 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=800&q=80', 163000, 5, 1, 0, 1, 38, 4.40, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(18, 5, 15, 'Tonkotsu Ramen', 'Nước dùng xương heo, xá xíu, trứng ngâm tương.', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80', 400000, 18, 1, 1, 1, 268, 4.85, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(19, 5, 15, 'Miso Ramen', 'Miso đỏ, thịt heo xay, ngô.', 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=800&q=80', 388000, 18, 1, 0, 2, 174, 4.70, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(20, 5, 16, 'Gyoza (6 miếng)', 'Sủi cảo heo, sốt ponzu.', 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80', 188000, 8, 1, 0, 1, 220, 4.60, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(21, 6, 17, 'Tacos al Pastor (3 chiếc)', 'Dứa, ngò rí, hành tây.', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80', 275000, 12, 1, 1, 1, 184, 4.55, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(22, 6, 18, 'Burrito Carnitas', 'Thịt heo ninh nhừ, cơm, đậu, sốt salsa xanh.', 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80', 313000, 15, 1, 0, 1, 96, 4.50, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(23, 6, 19, 'Elote', 'Ngô nướng cháy cạnh, chanh, phô mai cotija.', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', 125000, 8, 1, 0, 1, 70, 4.40, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(24, 6, 20, 'Horchata', 'Sữa gạo, quế, vani.', 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=800&q=80', 100000, 4, 1, 0, 1, 52, 4.35, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(25, 7, 21, 'Flat White', 'Cà phê espresso kép, bọt sữa mịn.', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80', 120000, 5, 1, 1, 1, 410, 4.85, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(26, 7, 22, 'Bánh sừng bò hạnh nhân', 'Kem frangipane, hạnh nhân nướng.', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80', 113000, 3, 1, 0, 1, 220, 4.75, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(27, 7, 23, 'Bánh mì bơ', 'Bánh mì men tự nhiên, ớt, chanh, muối biển.', 'https://plus.unsplash.com/premium_photo-1675604221056-91821ac2df07?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 238000, 10, 1, 0, 1, 154, 4.70, 'active', '2026-05-21 21:42:10', '2026-05-21 22:35:38'),
(28, 8, 24, 'Donut phủ đường cổ điển', 'Lớp phủ vani, bánh donut men.', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', 75000, 4, 1, 1, 1, 88, 4.55, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(29, 8, 24, 'Maple Bacon', 'Lớp phủ phong, thịt xông khói ngào đường.', 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80', 113000, 5, 1, 0, 2, 46, 4.50, 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `type` enum('order_placed','order_accepted','order_ready','order_picked_up','order_delivered','order_cancelled','payment_succeeded','payment_failed','payout_status','kyc_status','system') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `link_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `body`, `link_url`, `is_read`, `read_at`, `created_at`) VALUES
(1, 2, 'order_delivered', 'Đơn hàng đã giao', 'Đơn ORD-A1B2C đã được giao tới bạn. Hãy đánh giá tài xế nhé!', '/app/reviews/ord-a1b2c', 0, NULL, '2026-05-21 21:37:10'),
(2, 2, 'order_picked_up', 'Tài xế đã lấy hàng', 'Tài xế Owen đang trên đường đến địa chỉ của bạn.', '/app/track/ord-a1b2c', 0, NULL, '2026-05-21 21:17:10'),
(3, 2, 'order_accepted', 'Quán đã xác nhận đơn', 'Hachi Ramen đã nhận đơn ORD-A1B2C, dự kiến giao trong 25 phút.', '/app/track/ord-a1b2c', 0, NULL, '2026-05-21 21:02:10'),
(4, 2, 'payment_succeeded', 'Thanh toán thành công', 'Thanh toán VNPay cho đơn ORD-A1B2C đã hoàn tất.', '/app/orders', 1, '2026-05-21 18:42:10', '2026-05-21 15:42:10'),
(5, 2, 'system', 'Ưu đãi mới: NOMNOM15', 'Giảm 15% cho đơn hàng tiếp theo trong tuần này.', '/app/profile/promotions', 1, '2026-05-21 09:42:10', '2026-05-20 19:42:10'),
(6, 2, 'order_cancelled', 'Đơn hàng bị hủy', 'Đơn ORD-Z9Y8X đã bị hủy theo yêu cầu của bạn. Hoàn tiền trong 1-2 ngày.', '/app/orders', 1, '2026-05-19 21:42:10', '2026-05-18 21:42:10'),
(7, 7, 'order_placed', 'Đơn hàng mới', 'Mara đặt đơn ORD-7T2RD với 2 món.', '/merchant/orders', 0, NULL, '2026-05-21 21:40:10'),
(8, 7, 'order_placed', 'Đơn hàng mới', 'Owen Tran đặt đơn ORD-K9XR1 với 1 món.', '/merchant/orders', 0, NULL, '2026-05-21 21:38:10'),
(9, 7, 'payout_status', 'Yêu cầu rút tiền đã hoàn tất', 'Khoản 2.000.000 ₫ đã được chuyển vào tài khoản Vietcombank · *** 8822.', '/merchant/wallet', 1, '2026-05-20 21:42:10', '2026-05-17 21:42:10'),
(10, 7, 'kyc_status', 'Giấy phép sắp hết hạn', 'Giấy phép VSATTP sắp hết hạn trong 30 ngày. Hãy cập nhật.', '/merchant/onboarding', 0, NULL, '2026-05-20 21:42:10'),
(11, 7, 'system', 'Cập nhật chính sách', 'Chính sách hoa hồng mới áp dụng từ tháng sau (15% → 14%).', NULL, 1, '2026-05-16 21:42:10', '2026-05-14 21:42:10'),
(12, 3, 'order_picked_up', 'Bạn đã nhận đơn ORD-A1B2C', 'Hãy đến Hachi Ramen — 1.2 km, 4 phút.', '/driver/active', 0, NULL, '2026-05-21 21:38:10'),
(13, 3, 'payout_status', 'Yêu cầu rút tiền đang chờ duyệt', 'Khoản 480.000 ₫ đang chờ NomNom xét duyệt.', '/driver/payouts', 0, NULL, '2026-05-21 19:42:10'),
(14, 3, 'kyc_status', 'Bằng lái sắp hết hạn', 'Bằng lái xe của bạn sắp hết hạn trong 20 ngày.', '/driver/onboarding', 1, '2026-05-21 09:42:10', '2026-05-20 21:42:10'),
(15, 3, 'system', 'Thưởng tuần này', 'Hoàn thành 30 chuyến để nhận thưởng 200.000 ₫.', NULL, 1, '2026-05-19 21:42:10', '2026-05-18 21:42:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orders`
--

CREATE TABLE `orders` (
  `id` bigint UNSIGNED NOT NULL,
  `order_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `restaurant_id` bigint UNSIGNED NOT NULL,
  `driver_id` bigint UNSIGNED DEFAULT NULL,
  `delivery_address_id` bigint UNSIGNED NOT NULL,
  `delivery_address_snapshot` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_lat` decimal(10,7) NOT NULL,
  `delivery_lng` decimal(10,7) NOT NULL,
  `pickup_lat` decimal(10,7) NOT NULL,
  `pickup_lng` decimal(10,7) NOT NULL,
  `distance_km` decimal(6,2) NOT NULL DEFAULT '0.00',
  `subtotal` bigint UNSIGNED NOT NULL,
  `delivery_fee` bigint UNSIGNED NOT NULL DEFAULT '0',
  `discount_amount` bigint UNSIGNED NOT NULL DEFAULT '0',
  `total_amount` bigint UNSIGNED NOT NULL,
  `driver_earning` bigint UNSIGNED NOT NULL DEFAULT '0',
  `merchant_earning` bigint UNSIGNED NOT NULL DEFAULT '0',
  `platform_fee` bigint UNSIGNED NOT NULL DEFAULT '0',
  `status` enum('pending_payment','placed','accepted','preparing','ready_for_pickup','picked_up','delivering','delivered','cancelled','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_payment',
  `payment_status` enum('unpaid','paid','failed','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `payment_method` enum('cod','vnpay') COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimated_delivery_at` datetime DEFAULT NULL,
  `placed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `accepted_at` datetime DEFAULT NULL,
  `ready_at` datetime DEFAULT NULL,
  `picked_up_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `cancelled_by_role` enum('customer','merchant','driver','admin','system') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cancel_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `orders`
--

INSERT INTO `orders` (`id`, `order_code`, `customer_id`, `restaurant_id`, `driver_id`, `delivery_address_id`, `delivery_address_snapshot`, `delivery_lat`, `delivery_lng`, `pickup_lat`, `pickup_lng`, `distance_km`, `subtotal`, `delivery_fee`, `discount_amount`, `total_amount`, `driver_earning`, `merchant_earning`, `platform_fee`, `status`, `payment_status`, `payment_method`, `customer_note`, `estimated_delivery_at`, `placed_at`, `accepted_at`, `ready_at`, `picked_up_at`, `delivered_at`, `cancelled_at`, `cancelled_by_role`, `cancel_reason`, `created_at`, `updated_at`) VALUES
(1, 'ORD-A1B2C', 2, 5, 3, 1, '120 Wythe Ave, Apt 3B, P. Bến Nghé, Q.1, TP. Hồ Chí Minh', 10.7795000, 106.6991000, 10.7680000, 106.6920000, 3.40, 588000, 62000, 0, 650000, 49600, 499800, 100600, 'delivering', 'paid', 'vnpay', NULL, '2026-05-21 21:50:10', '2026-05-21 21:30:10', '2026-05-21 21:31:10', '2026-05-21 21:38:10', '2026-05-21 21:39:10', NULL, NULL, NULL, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(2, 'ORD-Q3K9P', 2, 2, 3, 1, '120 Wythe Ave, Apt 3B, P. Bến Nghé, Q.1, TP. Hồ Chí Minh', 10.7795000, 106.6991000, 10.7710000, 106.6985000, 1.80, 689000, 50000, 89000, 650000, 40000, 585650, 113350, 'delivered', 'paid', 'vnpay', NULL, NULL, '2026-05-20 19:42:10', '2026-05-20 19:52:10', '2026-05-20 20:12:10', '2026-05-20 20:22:10', '2026-05-20 20:42:10', NULL, NULL, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(3, 'ORD-7T2RD', 2, 1, NULL, 1, '120 Wythe Ave, Apt 3B, P. Bến Nghé, Q.1, TP. Hồ Chí Minh', 10.7795000, 106.6991000, 10.7765000, 106.7010000, 0.50, 638000, 62000, 0, 700000, 49600, 542300, 108100, 'placed', 'paid', 'vnpay', 'Làm ơn không lấy húng quế', '2026-05-21 22:07:10', '2026-05-21 21:40:10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(4, 'ORD-K9XR1', 15, 1, NULL, 3, '301 Carroll St, P. Đa Kao, Q.1, TP. Hồ Chí Minh', 10.7873000, 106.6919000, 10.7765000, 106.7010000, 1.20, 800000, 62000, 0, 862000, 49600, 680000, 132400, 'placed', 'paid', 'vnpay', NULL, '2026-05-21 22:10:10', '2026-05-21 21:38:10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(5, 'ORD-A41QM', 16, 1, NULL, 4, '14 W 10th St, P. 6, Q. Bình Thạnh, TP. Hồ Chí Minh', 10.8030000, 106.7100000, 10.7765000, 106.7010000, 2.80, 776000, 62000, 0, 838000, 49600, 659600, 128800, 'preparing', 'paid', 'vnpay', 'Thêm dầu ớt', '2026-05-21 22:02:10', '2026-05-21 21:33:10', '2026-05-21 21:34:10', NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(6, 'ORD-V2HHJ', 17, 1, NULL, 5, '24 Bedford Ave, P. 17, Q. Bình Thạnh, TP. Hồ Chí Minh', 10.8055000, 106.7068000, 10.7765000, 106.7010000, 3.30, 526000, 62000, 0, 588000, 49600, 447100, 91300, 'ready_for_pickup', 'paid', 'vnpay', NULL, '2026-05-21 21:57:10', '2026-05-21 21:26:10', '2026-05-21 21:27:10', '2026-05-21 21:39:10', NULL, NULL, NULL, NULL, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(7, 'ORD-P9X22', 18, 1, 4, 6, '6 Smith St, P. Tân Định, Q.1, TP. Hồ Chí Minh', 10.7896000, 106.6907000, 10.7765000, 106.7010000, 2.10, 400000, 62000, 0, 462000, 49600, 340000, 72400, 'delivered', 'paid', 'cod', NULL, NULL, '2026-05-21 20:42:10', '2026-05-21 20:44:10', '2026-05-21 21:02:10', '2026-05-21 21:12:10', '2026-05-21 21:27:10', NULL, NULL, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(8, 'ORD-J11HQ', 19, 1, 6, 7, '88 W 4th St, P. Cô Giang, Q.1, TP. Hồ Chí Minh', 10.7660000, 106.6960000, 10.7765000, 106.7010000, 1.40, 1014000, 62000, 0, 1076000, 49600, 861900, 164500, 'delivered', 'paid', 'vnpay', 'Không gluten — đế không gluten', NULL, '2026-05-21 20:12:10', '2026-05-21 20:14:10', '2026-05-21 20:42:10', '2026-05-21 20:47:10', '2026-05-21 21:02:10', NULL, NULL, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(9, 'ORD-RV001', 20, 1, 3, 8, '15 Greenpoint Ave, P. Tân Phong, Q.7, TP. Hồ Chí Minh', 10.7305000, 106.7218000, 10.7765000, 106.7010000, 5.40, 438000, 62000, 0, 500000, 49600, 372300, 78100, 'delivered', 'paid', 'vnpay', NULL, NULL, '2026-05-18 21:42:10', '2026-05-18 21:42:10', '2026-05-18 21:42:10', '2026-05-18 21:42:10', '2026-05-18 21:42:10', NULL, NULL, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(10, 'ORD-RV002', 21, 1, 4, 9, '209 Avenue B, P. 12, Q. Tân Bình, TP. Hồ Chí Minh', 10.8004000, 106.6437000, 10.7765000, 106.7010000, 6.80, 338000, 62000, 0, 400000, 49600, 287300, 63100, 'delivered', 'paid', 'vnpay', 'Giao chậm một chút cũng được', NULL, '2026-05-14 21:42:10', '2026-05-14 21:42:10', '2026-05-14 21:42:10', '2026-05-14 21:42:10', '2026-05-14 21:42:10', NULL, NULL, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(11, 'ORD-RV003', 22, 1, 6, 10, '4 Sakura Ln, P. 9, Q. Phú Nhuận, TP. Hồ Chí Minh', 10.7990000, 106.6791000, 10.7765000, 106.7010000, 3.10, 300000, 62000, 0, 362000, 49600, 255000, 57400, 'delivered', 'paid', 'cod', NULL, NULL, '2026-05-07 21:42:10', '2026-05-07 21:42:10', '2026-05-07 21:42:10', '2026-05-07 21:42:10', '2026-05-07 21:42:10', NULL, NULL, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `menu_item_id` bigint UNSIGNED NOT NULL,
  `item_name_snapshot` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price_snapshot` bigint UNSIGNED NOT NULL,
  `quantity` smallint UNSIGNED NOT NULL,
  `line_subtotal` bigint UNSIGNED NOT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `menu_item_id`, `item_name_snapshot`, `unit_price_snapshot`, `quantity`, `line_subtotal`, `note`, `created_at`) VALUES
(1, 1, 18, 'Tonkotsu Ramen', 400000, 1, 400000, NULL, '2026-05-21 21:42:10'),
(2, 1, 20, 'Gyoza (6 miếng)', 188000, 1, 188000, NULL, '2026-05-21 21:42:10'),
(3, 2, 6, 'Cổ điển', 288000, 2, 576000, NULL, '2026-05-21 21:42:10'),
(4, 2, 9, 'Khoai tây chiên', 113000, 1, 113000, NULL, '2026-05-21 21:42:10'),
(5, 3, 1, 'Margherita', 338000, 1, 338000, NULL, '2026-05-21 21:42:10'),
(6, 3, 4, 'Burrata Salad', 300000, 1, 300000, NULL, '2026-05-21 21:42:10'),
(7, 4, 2, 'Funghi', 400000, 2, 800000, NULL, '2026-05-21 21:42:10'),
(8, 5, 3, 'Salsiccia', 438000, 1, 438000, NULL, '2026-05-21 21:42:10'),
(9, 5, 1, 'Margherita', 338000, 1, 338000, NULL, '2026-05-21 21:42:10'),
(10, 6, 1, 'Margherita', 338000, 1, 338000, NULL, '2026-05-21 21:42:10'),
(11, 6, 5, 'Tiramisu', 188000, 1, 188000, NULL, '2026-05-21 21:42:10'),
(12, 7, 2, 'Funghi', 400000, 1, 400000, NULL, '2026-05-21 21:42:10'),
(13, 8, 1, 'Margherita', 338000, 3, 1014000, 'Đế không gluten', '2026-05-21 21:42:10'),
(14, 9, 3, 'Salsiccia', 438000, 1, 438000, NULL, '2026-05-21 21:42:10'),
(15, 10, 1, 'Margherita', 338000, 1, 338000, NULL, '2026-05-21 21:42:10'),
(16, 11, 4, 'Burrata Salad', 300000, 1, 300000, NULL, '2026-05-21 21:42:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_status_logs`
--

CREATE TABLE `order_status_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `from_status` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_status` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by_role` enum('customer','merchant','driver','admin','system') COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by_user_id` bigint UNSIGNED DEFAULT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_status_logs`
--

INSERT INTO `order_status_logs` (`id`, `order_id`, `from_status`, `to_status`, `changed_by_role`, `changed_by_user_id`, `note`, `created_at`) VALUES
(1, 1, NULL, 'pending_payment', 'customer', 2, 'Khách tạo đơn', '2026-05-21 21:42:10'),
(2, 1, 'pending_payment', 'placed', 'system', NULL, 'VNPay xác nhận thanh toán', '2026-05-21 21:42:10'),
(3, 1, 'placed', 'accepted', 'merchant', 11, 'Hachi Ramen xác nhận đơn', '2026-05-21 21:42:10'),
(4, 1, 'accepted', 'preparing', 'merchant', 11, 'Bắt đầu nấu', '2026-05-21 21:42:10'),
(5, 1, 'preparing', 'ready_for_pickup', 'merchant', 11, 'Sẵn sàng cho tài xế lấy', '2026-05-21 21:42:10'),
(6, 1, 'ready_for_pickup', 'picked_up', 'driver', 3, 'Owen đã lấy hàng', '2026-05-21 21:42:10'),
(7, 1, 'picked_up', 'delivering', 'driver', 3, 'Đang giao đến khách', '2026-05-21 21:42:10'),
(8, 2, 'preparing', 'delivered', 'driver', 3, NULL, '2026-05-21 21:42:10'),
(9, 3, 'pending_payment', 'placed', 'system', NULL, 'VNPay xác nhận', '2026-05-21 21:42:10'),
(10, 4, 'pending_payment', 'placed', 'system', NULL, 'VNPay xác nhận', '2026-05-21 21:42:10'),
(11, 5, 'placed', 'accepted', 'merchant', 7, NULL, '2026-05-21 21:42:10'),
(12, 5, 'accepted', 'preparing', 'merchant', 7, NULL, '2026-05-21 21:42:10'),
(13, 6, 'preparing', 'ready_for_pickup', 'merchant', 7, NULL, '2026-05-21 21:42:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `otp_codes`
--

CREATE TABLE `otp_codes` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `destination` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` enum('email','sms') COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose` enum('register','login','reset_password') COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `expires_at` datetime NOT NULL,
  `consumed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payments`
--

CREATE TABLE `payments` (
  `id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `method` enum('cod','vnpay') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` bigint UNSIGNED NOT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VND',
  `gateway` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway_txn_id` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('initiated','pending','succeeded','failed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'initiated',
  `failure_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `raw_response` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `method`, `amount`, `currency`, `gateway`, `gateway_txn_id`, `status`, `failure_reason`, `paid_at`, `raw_response`, `created_at`, `updated_at`) VALUES
(1, 1, 'vnpay', 650000, 'VND', 'vnpay', 'VNP14829381', 'succeeded', NULL, '2026-05-21 21:30:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(2, 2, 'vnpay', 650000, 'VND', 'vnpay', 'VNP14771209', 'succeeded', NULL, '2026-05-20 19:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(3, 3, 'vnpay', 700000, 'VND', 'vnpay', 'VNP14855001', 'succeeded', NULL, '2026-05-21 21:40:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(4, 4, 'vnpay', 862000, 'VND', 'vnpay', 'VNP14854999', 'succeeded', NULL, '2026-05-21 21:38:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(5, 5, 'vnpay', 838000, 'VND', 'vnpay', 'VNP14854810', 'succeeded', NULL, '2026-05-21 21:33:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(6, 6, 'vnpay', 588000, 'VND', 'vnpay', 'VNP14854711', 'succeeded', NULL, '2026-05-21 21:26:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(7, 7, 'cod', 462000, 'VND', NULL, NULL, 'succeeded', NULL, '2026-05-21 21:27:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(8, 8, 'vnpay', 1076000, 'VND', 'vnpay', 'VNP14852201', 'succeeded', NULL, '2026-05-21 20:12:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(9, 9, 'vnpay', 500000, 'VND', 'vnpay', 'VNP14809921', 'succeeded', NULL, '2026-05-18 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(10, 10, 'vnpay', 400000, 'VND', 'vnpay', 'VNP14761023', 'succeeded', NULL, '2026-05-14 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(11, 11, 'cod', 362000, 'VND', NULL, NULL, 'succeeded', NULL, '2026-05-07 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payout_requests`
--

CREATE TABLE `payout_requests` (
  `id` bigint UNSIGNED NOT NULL,
  `wallet_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `amount` bigint UNSIGNED NOT NULL,
  `bank_account_no` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_account_holder` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','completed','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `reviewed_by_admin_id` bigint UNSIGNED DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `reject_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_ref` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `payout_requests`
--

INSERT INTO `payout_requests` (`id`, `wallet_id`, `user_id`, `amount`, `bank_account_no`, `bank_name`, `bank_account_holder`, `status`, `reviewed_by_admin_id`, `reviewed_at`, `reject_reason`, `external_ref`, `requested_at`, `completed_at`) VALUES
(1, 1, 3, 480000, '1903456789', 'Techcombank', 'OWEN REYES', 'pending', NULL, NULL, NULL, NULL, '2026-05-21 19:42:10', NULL),
(2, 5, 8, 1500000, '060011223344', 'BIDV', 'JUNEBUG BURGERS', 'pending', NULL, NULL, NULL, NULL, '2026-05-21 15:42:10', NULL),
(3, 2, 4, 1200000, '060034882001', 'Vietcombank', 'IRIS MENDEZ', 'completed', 1, '2026-05-20 21:42:10', NULL, 'VCB20260520-9911', '2026-05-19 21:42:10', '2026-05-20 21:42:10'),
(4, 4, 7, 2000000, '037000118822', 'Vietcombank', 'MARCO BELLO', 'completed', 1, '2026-05-17 21:42:10', NULL, 'VCB20260518-7723', '2026-05-16 21:42:10', '2026-05-17 21:42:10'),
(5, 3, 6, 350000, '1119876543', 'BIDV', 'SASHA PARK', 'rejected', 1, '2026-05-18 21:42:10', 'Số tài khoản không khớp với chủ tài khoản đăng ký.', NULL, '2026-05-18 21:42:10', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `platform_config`
--

CREATE TABLE `platform_config` (
  `config_key` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_value` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_type` enum('string','int','decimal','boolean','json') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'string',
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by_admin_id` bigint UNSIGNED DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `platform_config`
--

INSERT INTO `platform_config` (`config_key`, `config_value`, `data_type`, `description`, `updated_by_admin_id`, `updated_at`) VALUES
('default_commission_rate', '15', 'decimal', 'Hoa hồng nền tảng (%) mặc định cho nhà hàng', NULL, '2026-05-21 21:42:10'),
('default_driver_share', '80', 'decimal', '% phí giao hàng tài xế nhận được', NULL, '2026-05-21 21:42:10'),
('max_search_radius_km', '8', 'decimal', 'Bán kính tìm kiếm tối đa (km)', NULL, '2026-05-21 21:42:10'),
('min_payout_amount', '100000', 'int', 'Số tiền tối thiểu mỗi lần rút (VND)', NULL, '2026-05-21 21:42:10'),
('order_auto_cancel_minutes', '5', 'int', 'Số phút huỷ tự động nếu nhà hàng không xác nhận', NULL, '2026-05-21 21:42:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `token_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `user_agent`, `ip_address`, `expires_at`, `revoked_at`, `created_at`) VALUES
(1, 2, '0128365ebd4486fd1d466f6a612a714acb764a96aa8346ea215d9219aaeddc57', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8457', '::1', '2026-06-20 21:50:22', NULL, '2026-05-21 21:50:22'),
(2, 100, '4147cf7bd7f14b7658f334cc11aed00a377d048d3caa87894c082ccc869d7d3a', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8457', '::1', '2026-06-20 21:55:26', NULL, '2026-05-21 21:55:26'),
(3, 102, 'd638788d5f5bc817c6ea0ace2489f08b1bd775ab7a39fe1bc13ee42784278728', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '::1', '2026-06-20 22:31:26', '2026-05-21 22:32:31', '2026-05-21 22:31:26'),
(4, 102, '531914862bb6d2d02157a8ade84d592596ec1960e5b01101886e9601b0cb2364', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '::1', '2026-06-20 22:32:49', NULL, '2026-05-21 22:32:49'),
(5, 102, '79d78363972ec6c8d961836fc8045182e2bdb2e06d256682b6832c60606f7fc6', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '::1', '2026-06-20 22:34:31', NULL, '2026-05-21 22:34:30');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `restaurants`
--

CREATE TABLE `restaurants` (
  `id` bigint UNSIGNED NOT NULL,
  `owner_user_id` bigint UNSIGNED NOT NULL,
  `cuisine_id` smallint UNSIGNED DEFAULT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tagline` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `banner_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_license_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `food_safety_cert_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ward` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `base_delivery_fee` bigint UNSIGNED NOT NULL DEFAULT '0',
  `min_order_amount` bigint UNSIGNED NOT NULL DEFAULT '0',
  `avg_prep_time_min` smallint UNSIGNED NOT NULL DEFAULT '20',
  `rating_avg` decimal(3,2) NOT NULL DEFAULT '0.00',
  `review_count` int UNSIGNED NOT NULL DEFAULT '0',
  `commission_rate` decimal(5,2) NOT NULL DEFAULT '15.00',
  `is_open_now` tinyint(1) NOT NULL DEFAULT '1',
  `status` enum('pending','active','suspended','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_at` datetime DEFAULT NULL,
  `approved_by_admin_id` bigint UNSIGNED DEFAULT NULL,
  `rejection_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `restaurants`
--

INSERT INTO `restaurants` (`id`, `owner_user_id`, `cuisine_id`, `name`, `slug`, `tagline`, `description`, `phone`, `banner_url`, `logo_url`, `business_license_url`, `food_safety_cert_url`, `address_line`, `ward`, `district`, `city`, `latitude`, `longitude`, `base_delivery_fee`, `min_order_amount`, `avg_prep_time_min`, `rating_avg`, `review_count`, `commission_rate`, `is_open_now`, `status`, `approved_at`, `approved_by_admin_id`, `rejection_reason`, `created_at`, `updated_at`) VALUES
(1, 7, 1, 'Cinque Pizzeria', 'cinque-pizzeria', 'Pizza nướng lò củi kiểu Neapolitan từ năm 2017.', 'Pizza Neapolitan, đế nướng cháy cạnh, nguyên liệu nhập từ Ý.', '+84281234001', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=Cinque&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8', 'https://placehold.co/600x400?text=License+Cinque', 'https://placehold.co/600x400?text=VSATTP+Cinque', '12 Linden Ave', 'P. Bến Nghé', 'Q.1', 'TP. Hồ Chí Minh', 10.7765000, 106.7010000, 62000, 80000, 25, 4.80, 1240, 15.00, 1, 'active', '2026-05-21 21:42:10', 1, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(2, 8, 2, 'Junebug Burgers', 'junebug-burgers', 'Thịt bò đập dập trên bánh mì khoai tây.', 'Smash burger, sốt đặc trưng, mở đến nửa đêm.', '+84281234002', 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=Junebug&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8', 'https://placehold.co/600x400?text=License+Junebug', 'https://placehold.co/600x400?text=VSATTP+Junebug', '88 Holloway St', 'P. Bến Thành', 'Q.1', 'TP. Hồ Chí Minh', 10.7710000, 106.6985000, 50000, 60000, 20, 4.70, 982, 15.00, 1, 'active', '2026-05-21 21:42:10', 1, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(3, 9, 3, 'Kaiseki & Co.', 'kaiseki-and-co', 'Omakase, phong cách edomae.', 'Sushi omakase cao cấp, cá nhập trực tiếp từ chợ Toyosu.', '+84281234003', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=Kaiseki&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8', 'https://placehold.co/600x400?text=License+Kaiseki', 'https://placehold.co/600x400?text=VSATTP+Kaiseki', '4 Sakura Ln', 'P. 9', 'Q. Phú Nhuận', 'TP. Hồ Chí Minh', 10.7995000, 106.6790000, 100000, 200000, 35, 4.90, 654, 18.00, 1, 'active', '2026-05-21 21:42:10', 1, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(4, 10, 4, 'Verdant Bowls', 'verdant-bowls', 'Tô ngũ cốc theo mùa.', 'Tô trộn theo mùa, nguyên liệu hữu cơ tại địa phương.', '+84281234004', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=Verdant&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8', 'https://placehold.co/600x400?text=License+Verdant', NULL, '15 Greenpoint Ave', 'P. Tân Phong', 'Q.7', 'TP. Hồ Chí Minh', 10.7305000, 106.7218000, 50000, 60000, 18, 4.60, 432, 15.00, 0, 'pending', NULL, NULL, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(5, 11, 3, 'Hachi Ramen', 'hachi-ramen', 'Nước dùng xương heo ninh trong 14 giờ.', 'Ramen tonkotsu chuẩn vị Hakata, không hương liệu nhân tạo.', '+84281234005', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=Hachi&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8', 'https://placehold.co/600x400?text=License+Hachi', 'https://placehold.co/600x400?text=VSATTP+Hachi', '101 Mott St', 'P. Phạm Ngũ Lão', 'Q.1', 'TP. Hồ Chí Minh', 10.7680000, 106.6920000, 62000, 80000, 22, 4.70, 1102, 15.00, 1, 'active', '2026-05-21 21:42:10', 1, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(6, 12, 5, 'La Carreta', 'la-carreta', 'Tacos al pastor, phục vụ cả ngày.', 'Tacos & burritos kiểu Mexico City, cay nhẹ tới cay đậm.', '+84281234006', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=LaCarreta&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8', 'https://placehold.co/600x400?text=License+LaCarreta', 'https://placehold.co/600x400?text=VSATTP+LaCarreta', '209 Avenue B', 'P. 12', 'Q. Tân Bình', 'TP. Hồ Chí Minh', 10.8004000, 106.6437000, 37000, 50000, 20, 4.50, 765, 16.00, 0, 'suspended', '2026-05-21 21:42:10', 1, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(7, 13, 6, 'Buena Onda Cafe', 'buena-onda-cafe', 'Cà phê, bánh ngọt, buổi sáng thư thái.', 'Cà phê specialty, bánh ngọt nướng trong ngày.', '+84281234007', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=Buena&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8', 'https://placehold.co/600x400?text=License+Buena', 'https://placehold.co/600x400?text=VSATTP+Buena', '24 Bedford Ave', 'P. 17', 'Q. Bình Thạnh', 'TP. Hồ Chí Minh', 10.8055000, 106.7068000, 37000, 40000, 15, 4.80, 510, 12.00, 1, 'active', '2026-05-21 21:42:10', 1, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(8, 14, 7, 'Dough & Donut', 'dough-and-donut', 'Bánh donut men phủ đường.', 'Donut men ủ qua đêm, phủ đường thủ công.', '+84281234008', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1400&q=80', 'https://api.dicebear.com/9.x/shapes/svg?seed=Dough&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8', 'https://placehold.co/600x400?text=License+Dough', 'https://placehold.co/600x400?text=VSATTP+Dough', '6 Smith St', 'P. Tân Định', 'Q.1', 'TP. Hồ Chí Minh', 10.7896000, 106.6907000, 37000, 40000, 15, 4.60, 322, 12.00, 0, 'closed', '2026-05-21 21:42:10', 1, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reviews`
--

CREATE TABLE `reviews` (
  `id` bigint UNSIGNED NOT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `customer_id` bigint UNSIGNED NOT NULL,
  `restaurant_id` bigint UNSIGNED NOT NULL,
  `rating` tinyint UNSIGNED NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `is_hidden` tinyint(1) NOT NULL DEFAULT '0',
  `reply_text` text COLLATE utf8mb4_unicode_ci,
  `reply_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

--
-- Đang đổ dữ liệu cho bảng `reviews`
--

INSERT INTO `reviews` (`id`, `order_id`, `customer_id`, `restaurant_id`, `rating`, `comment`, `is_hidden`, `reply_text`, `reply_at`, `created_at`, `updated_at`) VALUES
(1, 9, 20, 1, 5, 'Đế bánh được nướng cháy cạnh hoàn hảo. Salsiccia là chiếc pizza ngon nhất tôi từng ăn trong năm nay.', 0, 'Cảm ơn bạn rất nhiều — hẹn gặp lại nhé!', '2026-05-19 21:42:10', '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(2, 10, 21, 1, 4, 'Giao hàng hơi chậm một chút nhưng đồ ăn đã bù đắp lại tất cả.', 0, NULL, NULL, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(3, 11, 22, 1, 5, 'Salad Burrata thật tuyệt vời. Sẽ đặt lại vào tuần tới.', 0, 'Cảm ơn Sky! Sẽ chuẩn bị thêm burrata tươi cho lần sau.', '2026-05-08 21:42:10', '2026-05-21 21:42:10', '2026-05-21 21:42:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `email` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_role` enum('customer','merchant','driver','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  `status` enum('pending','active','suspended','banned') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `email_verified_at` datetime DEFAULT NULL,
  `phone_verified_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `email`, `phone`, `password_hash`, `full_name`, `avatar_url`, `primary_role`, `status`, `email_verified_at`, `phone_verified_at`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 'avery@nomnom.example', '+84901000001', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Avery Park', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Avery%20Park&radius=50', 'admin', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(2, 'mara@example.com', '+84901000002', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Mara Chen', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Mara%20Chen&radius=50', 'customer', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', '2026-05-21 21:50:22', '2026-05-21 21:42:10', '2026-05-21 21:50:22'),
(3, 'owen.r@example.com', '+84901000003', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Owen Reyes', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Owen%20Reyes&radius=50', 'driver', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(4, 'iris.m@example.com', '+84901000004', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Iris Mendez', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Iris%20Mendez&radius=50', 'driver', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(5, 'felix.t@example.com', '+84901000005', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Felix Tao', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix%20Tao&radius=50', 'driver', 'pending', NULL, NULL, NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(6, 'sasha.p@example.com', '+84901000006', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Sasha Park', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sasha%20Park&radius=50', 'driver', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(7, 'owner@cinque.example', '+84901000007', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Marco Bello', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Marco%20Bello&radius=50', 'merchant', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(8, 'r@junebug.example', '+84901000008', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Reese Anya', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Reese%20Anya&radius=50', 'merchant', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(9, 'sora@kaiseki.example', '+84901000009', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Sora Iida', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sora%20Iida&radius=50', 'merchant', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(10, 'naomi@verdant.example', '+84901000010', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Naomi Kato', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Naomi%20Kato&radius=50', 'merchant', 'pending', NULL, NULL, NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(11, 'ren@hachi.example', '+84901000011', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Ren Ozaki', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ren%20Ozaki&radius=50', 'merchant', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(12, 'lupe@carreta.example', '+84901000012', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Lupe Martinez', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Lupe%20Martinez&radius=50', 'merchant', 'suspended', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(13, 'owner@buenaonda.example', '+84901000013', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Bea Lopez', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bea%20Lopez&radius=50', 'merchant', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(14, 'owner@doughdonut.example', '+84901000014', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Daly Smith', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Daly%20Smith&radius=50', 'merchant', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(15, 'owen.t@example.com', '+84901000015', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Owen Tran', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Owen%20Tran&radius=50', 'customer', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(16, 'rae.p@example.com', '+84901000016', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Rae Pham', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Rae%20Pham&radius=50', 'customer', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(17, 'lia.d@example.com', '+84901000017', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Lia Do', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Lia%20Do&radius=50', 'customer', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(18, 'sam.k@example.com', '+84901000018', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Sam Kim', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sam%20Kim&radius=50', 'customer', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(19, 'kai.v@example.com', '+84901000019', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Kai Vu', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Kai%20Vu&radius=50', 'customer', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(20, 'jamie.p@example.com', '+84901000020', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Jamie Phan', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Jamie%20P.&radius=50', 'customer', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(21, 'daniel.l@example.com', '+84901000021', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Daniel Le', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Daniel%20L.&radius=50', 'customer', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(22, 'sky.r@example.com', '+84901000022', '$2b$10$CJ7Jw5i.tGECVqMW/dpzreHp4n.oQPZzbZI9LY9N6uZPNG4vrIfEO', 'Sky Reyes', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sky%20R.&radius=50', 'customer', 'active', '2026-05-21 21:42:10', '2026-05-21 21:42:10', NULL, '2026-05-21 21:42:10', '2026-05-21 21:50:17'),
(100, 'testusere023e465@example.com', NULL, '$2b$10$MhvRBtHmaoWCcsMGaSxSZ.AliPOd1SE.HMjkZI7mjYPKl5eGNJc5e', 'Test User', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Test%20User&radius=50', 'customer', 'active', '2026-05-21 21:55:26', NULL, '2026-05-21 21:55:26', '2026-05-21 21:55:26', '2026-05-21 21:55:26'),
(102, 'nben940665@gmail.com', '0352245283', '$2b$10$CB.2vKDhM0.2oqYmAZCMtODggFmpFJP9MzhvQFZfHSiQ9gYugtQ4y', 'Nguyễn Công Ben', 'https://api.dicebear.com/9.x/avataaars/svg?seed=Nguy%E1%BB%85n%20C%C3%B4ng%20Ben&radius=50', 'customer', 'active', '2026-05-21 22:31:26', NULL, '2026-05-21 22:34:30', '2026-05-21 22:31:26', '2026-05-21 22:34:30');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` bigint UNSIGNED NOT NULL,
  `role` enum('customer','merchant','driver','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `granted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `role`, `granted_at`) VALUES
(1, 'admin', '2026-05-21 21:42:10'),
(2, 'customer', '2026-05-21 21:42:10'),
(3, 'customer', '2026-05-21 21:42:10'),
(3, 'driver', '2026-05-21 21:42:10'),
(4, 'customer', '2026-05-21 21:42:10'),
(4, 'driver', '2026-05-21 21:42:10'),
(5, 'driver', '2026-05-21 21:42:10'),
(6, 'customer', '2026-05-21 21:42:10'),
(6, 'driver', '2026-05-21 21:42:10'),
(7, 'customer', '2026-05-21 21:42:10'),
(7, 'merchant', '2026-05-21 21:42:10'),
(8, 'customer', '2026-05-21 21:42:10'),
(8, 'merchant', '2026-05-21 21:42:10'),
(9, 'merchant', '2026-05-21 21:42:10'),
(10, 'merchant', '2026-05-21 21:42:10'),
(11, 'merchant', '2026-05-21 21:42:10'),
(12, 'merchant', '2026-05-21 21:42:10'),
(13, 'merchant', '2026-05-21 21:42:10'),
(14, 'merchant', '2026-05-21 21:42:10'),
(15, 'customer', '2026-05-21 21:42:10'),
(16, 'customer', '2026-05-21 21:42:10'),
(17, 'customer', '2026-05-21 21:42:10'),
(18, 'customer', '2026-05-21 21:42:10'),
(19, 'customer', '2026-05-21 21:42:10'),
(20, 'customer', '2026-05-21 21:42:10'),
(21, 'customer', '2026-05-21 21:42:10'),
(22, 'customer', '2026-05-21 21:42:10'),
(100, 'customer', '2026-05-21 21:55:26'),
(102, 'customer', '2026-05-21 22:31:26');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `wallets`
--

CREATE TABLE `wallets` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `owner_type` enum('driver','merchant') COLLATE utf8mb4_unicode_ci NOT NULL,
  `balance` bigint NOT NULL DEFAULT '0',
  `pending_balance` bigint NOT NULL DEFAULT '0',
  `total_earned` bigint NOT NULL DEFAULT '0',
  `total_withdrawn` bigint NOT NULL DEFAULT '0',
  `is_locked` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `wallets`
--

INSERT INTO `wallets` (`id`, `user_id`, `owner_type`, `balance`, `pending_balance`, `total_earned`, `total_withdrawn`, `is_locked`, `created_at`, `updated_at`) VALUES
(1, 3, 'driver', 642000, 49600, 4580000, 3938000, 0, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(2, 4, 'driver', 850000, 0, 5200000, 4350000, 0, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(3, 6, 'driver', 320000, 0, 1240000, 920000, 0, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(4, 7, 'merchant', 1500000, 0, 2116500, 616500, 0, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(5, 8, 'merchant', 4300000, 0, 9850000, 5550000, 0, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(6, 9, 'merchant', 3200000, 0, 7340000, 4140000, 0, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(7, 11, 'merchant', 6800000, 0, 14120000, 7320000, 0, '2026-05-21 21:42:10', '2026-05-21 21:42:10'),
(8, 13, 'merchant', 1100000, 0, 2450000, 1350000, 0, '2026-05-21 21:42:10', '2026-05-21 21:42:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `wallet_transactions`
--

CREATE TABLE `wallet_transactions` (
  `id` bigint UNSIGNED NOT NULL,
  `wallet_id` bigint UNSIGNED NOT NULL,
  `direction` enum('credit','debit') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` bigint UNSIGNED NOT NULL,
  `balance_after` bigint NOT NULL,
  `tx_type` enum('order_earning','commission','order_payment','withdrawal','adjustment') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` enum('order','payout','manual') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint UNSIGNED DEFAULT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `performed_by_user_id` bigint UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `wallet_transactions`
--

INSERT INTO `wallet_transactions` (`id`, `wallet_id`, `direction`, `amount`, `balance_after`, `tx_type`, `reference_type`, `reference_id`, `description`, `performed_by_user_id`, `created_at`) VALUES
(1, 4, 'credit', 340000, 340000, 'order_earning', 'order', 7, 'Doanh thu đơn ORD-P9X22', NULL, '2026-05-21 21:42:10'),
(2, 4, 'credit', 861900, 1201900, 'order_earning', 'order', 8, 'Doanh thu đơn ORD-J11HQ', NULL, '2026-05-21 21:42:10'),
(3, 4, 'credit', 372300, 1574200, 'order_earning', 'order', 9, 'Doanh thu đơn ORD-RV001', NULL, '2026-05-21 21:42:10'),
(4, 4, 'credit', 287300, 1861500, 'order_earning', 'order', 10, 'Doanh thu đơn ORD-RV002', NULL, '2026-05-21 21:42:10'),
(5, 4, 'credit', 255000, 2116500, 'order_earning', 'order', 11, 'Doanh thu đơn ORD-RV003', NULL, '2026-05-21 21:42:10'),
(6, 4, 'debit', 616500, 1500000, 'withdrawal', 'payout', 4, 'Rút tiền PYT-004 đã hoàn tất', 1, '2026-05-21 21:42:10'),
(7, 1, 'credit', 40000, 40000, 'order_earning', 'order', 2, 'Tiền chuyến ORD-Q3K9P', NULL, '2026-05-21 21:42:10'),
(8, 1, 'credit', 49600, 89600, 'order_earning', 'order', 9, 'Tiền chuyến ORD-RV001', NULL, '2026-05-21 21:42:10'),
(9, 2, 'credit', 49600, 850000, 'order_earning', 'order', 7, 'Tiền chuyến ORD-P9X22 (COD)', NULL, '2026-05-21 21:42:10'),
(10, 2, 'debit', 462000, 388000, 'order_payment', 'order', 7, 'COD: tài xế thu hộ — sẽ đối soát', NULL, '2026-05-21 21:42:10'),
(11, 2, 'credit', 462000, 850000, 'adjustment', 'manual', NULL, 'Nộp lại tiền COD vào cuối ca', 1, '2026-05-21 21:42:10');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cart_active` (`customer_id`,`restaurant_id`,`status`),
  ADD KEY `fk_cart_rest` (`restaurant_id`);

--
-- Chỉ mục cho bảng `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ci_cart` (`cart_id`),
  ADD KEY `fk_ci_item` (`menu_item_id`);

--
-- Chỉ mục cho bảng `cuisines`
--
ALTER TABLE `cuisines`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Chỉ mục cho bảng `customer_addresses`
--
ALTER TABLE `customer_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_addr_customer` (`customer_id`);

--
-- Chỉ mục cho bảng `customer_profiles`
--
ALTER TABLE `customer_profiles`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `fk_cust_default_addr` (`default_address_id`);

--
-- Chỉ mục cho bảng `driver_assignments`
--
ALTER TABLE `driver_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_id` (`order_id`),
  ADD KEY `idx_da_driver` (`driver_id`,`status`);

--
-- Chỉ mục cho bảng `driver_profiles`
--
ALTER TABLE `driver_profiles`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `national_id` (`national_id`),
  ADD KEY `idx_drv_online` (`is_online`),
  ADD KEY `idx_drv_status` (`approval_status`),
  ADD KEY `fk_drv_approver` (`approved_by_admin_id`);

--
-- Chỉ mục cho bảng `home_promo_banners`
--
ALTER TABLE `home_promo_banners`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hpb_sort` (`sort_order`);

--
-- Chỉ mục cho bảng `menu_categories`
--
ALTER TABLE `menu_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_mcat_rest` (`restaurant_id`);

--
-- Chỉ mục cho bảng `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_item_rest` (`restaurant_id`),
  ADD KEY `idx_item_category` (`category_id`),
  ADD KEY `idx_item_status` (`status`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notif_user` (`user_id`,`is_read`,`created_at`);

--
-- Chỉ mục cho bảng `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_code` (`order_code`),
  ADD KEY `idx_ord_customer` (`customer_id`,`placed_at`),
  ADD KEY `idx_ord_rest` (`restaurant_id`,`status`),
  ADD KEY `idx_ord_driver` (`driver_id`,`status`),
  ADD KEY `idx_ord_status` (`status`),
  ADD KEY `fk_ord_address` (`delivery_address_id`);

--
-- Chỉ mục cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_oi_order` (`order_id`),
  ADD KEY `fk_oi_item` (`menu_item_id`);

--
-- Chỉ mục cho bảng `order_status_logs`
--
ALTER TABLE `order_status_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_osl_order` (`order_id`,`created_at`),
  ADD KEY `fk_osl_user` (`changed_by_user_id`);

--
-- Chỉ mục cho bảng `otp_codes`
--
ALTER TABLE `otp_codes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_otp_destination` (`destination`),
  ADD KEY `fk_otp_user` (`user_id`);

--
-- Chỉ mục cho bảng `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pay_order` (`order_id`),
  ADD KEY `idx_pay_status` (`status`);

--
-- Chỉ mục cho bảng `payout_requests`
--
ALTER TABLE `payout_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_payout_user` (`user_id`),
  ADD KEY `idx_payout_status` (`status`),
  ADD KEY `fk_payout_wallet` (`wallet_id`),
  ADD KEY `fk_payout_admin` (`reviewed_by_admin_id`);

--
-- Chỉ mục cho bảng `platform_config`
--
ALTER TABLE `platform_config`
  ADD PRIMARY KEY (`config_key`),
  ADD KEY `fk_cfg_admin` (`updated_by_admin_id`);

--
-- Chỉ mục cho bảng `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token_hash` (`token_hash`),
  ADD KEY `idx_refresh_user` (`user_id`);

--
-- Chỉ mục cho bảng `restaurants`
--
ALTER TABLE `restaurants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_rest_owner` (`owner_user_id`),
  ADD KEY `idx_rest_status` (`status`),
  ADD KEY `idx_rest_city` (`city`),
  ADD KEY `fk_rest_cuisine` (`cuisine_id`),
  ADD KEY `fk_rest_approver` (`approved_by_admin_id`);

--
-- Chỉ mục cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_id` (`order_id`),
  ADD KEY `idx_rev_rest` (`restaurant_id`),
  ADD KEY `idx_rev_cust` (`customer_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD KEY `idx_users_role` (`primary_role`),
  ADD KEY `idx_users_status` (`status`);

--
-- Chỉ mục cho bảng `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role`);

--
-- Chỉ mục cho bảng `wallets`
--
ALTER TABLE `wallets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_wallet_owner` (`user_id`,`owner_type`);

--
-- Chỉ mục cho bảng `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_wt_wallet` (`wallet_id`,`created_at`),
  ADD KEY `idx_wt_ref` (`reference_type`,`reference_id`),
  ADD KEY `fk_wt_admin` (`performed_by_user_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `carts`
--
ALTER TABLE `carts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `cuisines`
--
ALTER TABLE `cuisines`
  MODIFY `id` smallint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT cho bảng `customer_addresses`
--
ALTER TABLE `customer_addresses`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT cho bảng `driver_assignments`
--
ALTER TABLE `driver_assignments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT cho bảng `menu_categories`
--
ALTER TABLE `menu_categories`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT cho bảng `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT cho bảng `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT cho bảng `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT cho bảng `order_status_logs`
--
ALTER TABLE `order_status_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT cho bảng `otp_codes`
--
ALTER TABLE `otp_codes`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT cho bảng `payout_requests`
--
ALTER TABLE `payout_requests`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT cho bảng `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `restaurants`
--
ALTER TABLE `restaurants`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT cho bảng `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=103;

--
-- AUTO_INCREMENT cho bảng `wallets`
--
ALTER TABLE `wallets`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT cho bảng `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- Ràng buộc đối với các bảng kết xuất
--

--
-- Ràng buộc cho bảng `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `fk_cart_cust` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cart_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_ci_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ci_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE RESTRICT;

--
-- Ràng buộc cho bảng `customer_addresses`
--
ALTER TABLE `customer_addresses`
  ADD CONSTRAINT `fk_addr_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `customer_profiles`
--
ALTER TABLE `customer_profiles`
  ADD CONSTRAINT `fk_cust_default_addr` FOREIGN KEY (`default_address_id`) REFERENCES `customer_addresses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_cust_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `driver_assignments`
--
ALTER TABLE `driver_assignments`
  ADD CONSTRAINT `fk_da_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_da_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `driver_profiles`
--
ALTER TABLE `driver_profiles`
  ADD CONSTRAINT `fk_drv_approver` FOREIGN KEY (`approved_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_drv_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `menu_categories`
--
ALTER TABLE `menu_categories`
  ADD CONSTRAINT `fk_mcat_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `menu_items`
--
ALTER TABLE `menu_items`
  ADD CONSTRAINT `fk_item_cat` FOREIGN KEY (`category_id`) REFERENCES `menu_categories` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_item_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_ord_address` FOREIGN KEY (`delivery_address_id`) REFERENCES `customer_addresses` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_ord_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_ord_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ord_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE RESTRICT;

--
-- Ràng buộc cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_oi_item` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `order_status_logs`
--
ALTER TABLE `order_status_logs`
  ADD CONSTRAINT `fk_osl_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_osl_user` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `otp_codes`
--
ALTER TABLE `otp_codes`
  ADD CONSTRAINT `fk_otp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_pay_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT;

--
-- Ràng buộc cho bảng `payout_requests`
--
ALTER TABLE `payout_requests`
  ADD CONSTRAINT `fk_payout_admin` FOREIGN KEY (`reviewed_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_payout_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_payout_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`) ON DELETE RESTRICT;

--
-- Ràng buộc cho bảng `platform_config`
--
ALTER TABLE `platform_config`
  ADD CONSTRAINT `fk_cfg_admin` FOREIGN KEY (`updated_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `fk_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `restaurants`
--
ALTER TABLE `restaurants`
  ADD CONSTRAINT `fk_rest_approver` FOREIGN KEY (`approved_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_rest_cuisine` FOREIGN KEY (`cuisine_id`) REFERENCES `cuisines` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_rest_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT;

--
-- Ràng buộc cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_rev_cust` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rev_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rev_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `wallets`
--
ALTER TABLE `wallets`
  ADD CONSTRAINT `fk_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD CONSTRAINT `fk_wt_admin` FOREIGN KEY (`performed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_wt_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`) ON DELETE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
