# Đợt 2 — Chức năng đã hoàn thành

Tài liệu mô tả phạm vi **đã triển khai** cho 6 issue Wave 2 (`docs/planning/groups.txt`, dòng 68–73).

**Mục tiêu đợt:** Khách đặt được đơn COD end-to-end. Merchant/Driver nộp hồ sơ và chờ duyệt. Admin duyệt merchant/driver. Luồng kinh doanh cơ bản chạy được.

**Phụ thuộc đợt 1:** INF-01 (upload), CUS-01/02 (search + menu), CUS-09 (địa chỉ), ADM-01/02 (admin).

---

## Tóm tắt nhanh

| Issue | Trạng thái | API chính | UI chính |
|-------|------------|-----------|----------|
| CUS-03 | ✅ Hoàn chỉnh | `/api/v1/cart` | `AppContext` + `CartDrawer` |
| CUS-04 | ✅ Hoàn chỉnh | `POST /api/v1/orders` | `/app/checkout`, `/app/order/success/:code` |
| CUS-11 | ✅ Hoàn chỉnh | `PATCH /api/v1/me`, đổi MK | `/app/profile/edit`, `/app/profile/settings` |
| MER-01 | ✅ Hoàn chỉnh | `POST /api/v1/merchant/apply` | `/merchant/onboarding`, `/merchant/pending` |
| DRV-01 | ✅ Hoàn chỉnh | `POST /api/v1/driver/apply` | `/driver/onboarding`, `/driver/pending` |
| ADM-03 | ✅ Hoàn chỉnh | `/api/v1/admin/restaurants/*`, `/api/v1/admin/drivers/*` | `/admin/restaurants`, `/admin/drivers` |

---

## CUS-03 — Giỏ hàng lưu DB

### Đã làm

**Server** (`server/src/routes/cart.routes.js`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `GET` | `/api/v1/cart` | Giỏ active + `baseDeliveryFee` từ `restaurants` |
| `POST` | `/api/v1/cart/items` | Thêm/cộng dồn món (`menuItemId`, `quantity`, `note?`) |
| `PATCH` | `/api/v1/cart/items/:itemId` | Cập nhật số lượng / ghi chú (`quantity=0` → xóa) |
| `DELETE` | `/api/v1/cart/items/:itemId` | Xóa một dòng |
| `DELETE` | `/api/v1/cart` | Xóa toàn bộ giỏ |

- Yêu cầu JWT + role `customer`.
- Một giỏ active mỗi khách; đổi quán → xóa giỏ cũ (server + toast client).
- `unit_price` snapshot từ `menu_items.price` khi thêm.

**Client** (`client/src/context/AppContext.jsx`, `client/src/lib/guestCart.js`, `client/src/modules/customer/CartDrawer.jsx`)

- Đã login: mọi thao tác giỏ gọi API; reload trang → `fetchCartApi()` khôi phục giỏ.
- Chưa login (guest): giỏ lưu `localStorage` (`nomnom_guest_cart`); reload vẫn còn.
- Sau login / đăng ký xong: merge giỏ guest vào DB (lặp `POST /cart/items`) rồi fetch lại.
- `CartDrawer`: modal xác nhận trước khi xóa món; hiển thị tên quán/logo từ giỏ DB.

### Lưu ý vận hành

- Checkout yêu cầu đăng nhập (giỏ server).
- Guest chỉ dùng giỏ cục bộ; không đồng bộ đa thiết bị cho đến khi login.

### Database

- `carts`, `cart_items`, `menu_items`, `restaurants`

### Kiểm tra (checkpoint)

Login → thêm món → reload trình duyệt → giỏ còn nguyên.

---

## CUS-04 — Đặt đơn (Checkout COD) + xem đơn vừa đặt

### Đã làm

**Server** (`server/src/routes/orders.routes.js`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `POST` | `/api/v1/orders` | Tạo đơn từ giỏ active |
| `GET` | `/api/v1/orders/:idOrCode` | Chi tiết đơn theo id hoặc mã (vd. `ORD-A1B2C`) |

Body tạo đơn: `addressId`, `paymentMethod` (`cod` \| `vnpay`), `customerNote?`, `voucherCode?`.

- Đọc giỏ + items từ DB; `delivery_fee` = `restaurants.base_delivery_fee`.
- Snapshot địa chỉ giao từ `customer_addresses`.
- Sau tạo đơn: xóa giỏ active, tạo `order_items`, mã đơn `ORD-XXXXX`.
- VNPay: endpoint có nhưng UI checkout disable (đợt sau).

**Client**

| Route | File |
|-------|------|
| `/app/checkout` | `client/src/modules/customer/Checkout.jsx` |
| `/app/order/success/:code` | `client/src/modules/customer/OrderSuccess.jsx` |

- Chọn địa chỉ từ `GET /api/v1/me/addresses` hoặc nhập địa chỉ mới.
- Form địa chỉ mới: dropdown tỉnh/thành + phường/xã qua [`provinces.open-api.vn`](https://provinces.open-api.vn/) (cùng nguồn với [CUS-09](./wave-1-completed.md#cus-09--sổ-địa-chỉ-giao-hàng)).
- Phí giao hiển thị từ `cart.baseDeliveryFee` (khớp server).
- COD → redirect success page với mã đơn thật.

### Chưa làm / đợt sau

- VNPay thanh toán online (CUS-05+).
- Voucher thật từ DB (client vẫn mock promo trong `AppContext`).

### Database

- `orders`, `order_items`, `carts`, `cart_items`, `customer_addresses`, `restaurants`

### Kiểm tra (checkpoint)

Login → 2 món → `/app/checkout` → COD → `/app/order/success/:code` OK; tổng tiền khớp phí giao quán.

---

## CUS-11 — Hồ sơ + đổi mật khẩu

### Đã làm

**Server** (`server/src/routes/me.routes.js`, `server/src/routes/auth.routes.js`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `PATCH` | `/api/v1/me` | `fullName`, `phone`, `avatarUrl` |
| `POST` | `/api/v1/me/change-password` | Đổi mật khẩu (cần mật khẩu hiện tại) |
| `POST` | `/api/v1/auth/logout-all` | Thu hồi mọi refresh token |

**Client**

| Route | File | Ghi chú |
|-------|------|---------|
| `/app/profile/edit` | `client/src/modules/customer/profile/EditProfile.jsx` | Upload avatar qua INF-01 (`folder=avatar`) |
| `/app/profile/settings` | `client/src/modules/customer/profile/Settings.jsx` | Đổi MK, đăng xuất mọi thiết bị |

### Kiểm tra (checkpoint)

`/app/profile/edit` → upload avatar thật → Lưu → avatar cập nhật.

---

## MER-01 — Đăng ký quán + chờ duyệt

### Đã làm

**Server** (`server/src/routes/merchant.routes.js`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `POST` | `/api/v1/merchant/apply` | Nộp / nộp lại hồ sơ quán (`status=pending`) |
| `GET` | `/api/v1/merchant/me/restaurant` | Quán của user hiện tại |

Body apply gồm: thông tin quán, địa chỉ, `baseDeliveryFee`, `minOrderAmount`, URL giấy tờ (logo, banner, license, VSATTP), **ngân hàng** (`bankName`, `bankAccountNo`, `bankAccountHolder`).

- Gán role `merchant` vào `user_roles` nếu chưa có.
- Thông báo admin qua bảng `notifications`.

**Client**

| Route | File |
|-------|------|
| `/merchant/onboarding` | `client/src/modules/merchant/Onboarding.jsx` |
| `/merchant/pending` | `client/src/modules/merchant/Pending.jsx` |

- Upload ảnh qua INF-01 (`folder=restaurant`), không upload trực tiếp Cloudinary client.
- `MerchantLayout` chặn user chưa `active` → redirect `/merchant/pending`.

### Database

- `restaurants` (thêm `bank_account_no`, `bank_name`, `bank_account_holder` — xem migration bên dưới)
- `user_roles`, `notifications`

### Migration (DB đã tồn tại trước 2026-05-30)

```bash
mysql -u root -p nomnom < database/migrations/20260530_restaurant_bank.sql
```

### Kiểm tra (checkpoint)

Customer apply → `/merchant/pending` hiển thị trạng thái chờ duyệt.

---

## DRV-01 — Đăng ký tài xế + chờ duyệt

### Đã làm

**Server** (`server/src/routes/driver.routes.js`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `GET` | `/api/v1/driver/me/profile` | Hồ sơ + `approval_status` |
| `POST` | `/api/v1/driver/apply` | Nộp hồ sơ KYC + ngân hàng |
| `PATCH` | `/api/v1/driver/me/profile` | Cập nhật draft (trước khi duyệt) |

**Client**

| Route | File |
|-------|------|
| `/driver/onboarding` | `client/src/modules/driver/Onboarding.jsx` |
| `/driver/pending` | `client/src/modules/driver/Pending.jsx` |

- Upload KYC qua INF-01 (`folder=driver-kyc`).
- `DriverShell` kiểm tra `approval_status`; chưa `approved` → `/driver/pending`.

### Database

- `driver_profiles`, `user_roles`, `notifications`

### Kiểm tra (checkpoint)

User apply driver → `/driver/pending` OK; tài xế `pending` không vào portal `/driver/*`.

---

## ADM-03 — Duyệt nhà hàng & tài xế

### Đã làm

**Server** (`server/src/routes/admin.routes.js`, `server/src/lib/adminApprovals.js`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `GET` | `/api/v1/admin/restaurants/pending` | Danh sách quán chờ duyệt |
| `POST` | `/api/v1/admin/restaurants/:id/approve` | Duyệt → `active`, tạo wallet merchant, email + notification |
| `POST` | `/api/v1/admin/restaurants/:id/reject` | Từ chối → `suspended` + `rejection_reason` |
| `GET` | `/api/v1/admin/drivers/pending` | Danh sách tài xế chờ duyệt |
| `POST` | `/api/v1/admin/drivers/:userId/approve` | Duyệt → `approved`, wallet driver |
| `POST` | `/api/v1/admin/drivers/:userId/reject` | Từ chối → `rejected` |

**Client**

| Route | File |
|-------|------|
| `/admin/restaurants` | `client/src/modules/admin/RestaurantApprovals.jsx` |
| `/admin/drivers` | `client/src/modules/admin/DriverApprovals.jsx` |

### Kiểm tra (checkpoint)

- Admin approve quán → quán `active` → xuất hiện `/app/search`.
- Admin approve driver → `approval_status = approved`.

---

## Luồng end-to-end đợt 2

```
Khách: search → restaurant → thêm món → (login) → checkout COD → order success
Merchant: onboarding → pending → [admin approve] → merchant dashboard
Driver:   onboarding → pending → [admin approve] → driver portal
Admin:    /admin/restaurants + /admin/drivers → approve/reject
```

---

## Checklist cuối đợt 2

Tham chiếu `docs/planning/groups.txt` (dòng 90–97):

- [x] Khách: 2 món → checkout → COD → `/app/order/success/:code` OK
- [x] Cart lưu DB, reload còn giỏ (đã login; guest: localStorage)
- [x] `/app/profile/edit` → upload avatar thật, lưu OK
- [x] Customer apply merchant → `/merchant/pending` đúng
- [x] Apply driver → `/driver/pending` đúng
- [x] Admin approve quán → quán trong `/app/search`
- [x] Admin approve driver → trạng thái `approved`

---

## File tham chiếu

| Loại | Đường dẫn |
|------|-----------|
| Đợt 1 | [wave-1-completed.md](./wave-1-completed.md) |
| Kế hoạch wave | `docs/planning/groups.txt` |
| Guest cart | `client/src/lib/guestCart.js` |
| Cart API | `server/src/routes/cart.routes.js` |
| Orders API | `server/src/routes/orders.routes.js` |
| Admin duyệt | `server/src/lib/adminApprovals.js` |
| Migration banking | `database/migrations/20260530_restaurant_bank.sql` |
| Schema DB | `database/nomnom.sql` |
