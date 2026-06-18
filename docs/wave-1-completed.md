# Đợt 1 — Chức năng đã hoàn thành

Tài liệu mô tả phạm vi **đã triển khai** cho 6 issue Wave 1 (`docs/planning/groups.txt`, dòng 29–34).

**Mục tiêu đợt:** Khách tìm được quán, xem menu, quản lý địa chỉ; admin xem tổng quan + quản lý tài khoản; có API upload ảnh dùng chung cho các đợt sau.

---

## Tóm tắt nhanh

| Issue | Trạng thái | API | UI chính |
|-------|------------|-----|----------|
| INF-01 | ✅ API xong | Upload/delete Cloudinary | Helper client; chưa gắn form |
| CUS-01 | ✅ Search xong | Danh sách + lọc quán | `/app/search` |
| CUS-02 | ✅ Detail/menu xong | Chi tiết quán + menu | `/app/restaurant/:id` |
| CUS-09 | ✅ CRUD địa chỉ | `/api/v1/me/addresses` | `/app/profile/addresses` |
| ADM-01 | ✅ Hoàn chỉnh | `/api/v1/admin/overview` | `/admin` |
| ADM-02 | ✅ Hoàn chỉnh | `/api/v1/admin/users*` | `/admin/accounts` |

---

## INF-01 — Upload ảnh dùng chung

### Đã làm

**Server** (`server/src/routes/uploads.routes.js`, `server/src/lib/cloudinary.js`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `POST` | `/api/v1/uploads` | Upload `multipart/form-data`, field `file`; optional `folder` |
| `DELETE` | `/api/v1/uploads?publicId=...` | Xóa ảnh trên Cloudinary |

- Yêu cầu JWT (`Authorization: Bearer`).
- Giới hạn: 5 MB; MIME `jpeg` / `png` / `webp`; rate limit 20 upload/phút/user.
- Folder: `avatar`, `restaurant`, `menu`, `driver-kyc`, `review` → lưu `nomnom/<folder>/` trên Cloudinary.
- Response upload: `{ url, publicId }`.

**Client** (`client/src/lib/upload.js`)

- `uploadFile(file, folder)` — gọi API upload.
- `deleteUploadedFile(publicId)` — gọi API xóa.

### Chưa làm / ngoài phạm vi INF-01

- Chưa có màn hình upload (avatar, banner quán, v.v.) — `EditProfile` vẫn toast “sắp có”.
- Các issue đợt sau (MER-01, DRV-01, …) sẽ import helper này.

### Cấu hình

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Database

Không dùng bảng — ảnh lưu trên Cloudinary.

### Kiểm tra (checkpoint)

Login → Postman `POST /api/v1/uploads` + file ảnh → nhận URL mở được trên trình duyệt.

---

## CUS-01 — Danh sách & tìm kiếm nhà hàng

### Đã làm

**Server** (`server/src/routes/restaurants.routes.js`, `server/src/routes/cuisines.routes.js`)

| Method | Endpoint | Query |
|--------|----------|-------|
| `GET` | `/api/v1/restaurants` | `q`, `cuisine` (slug, phân cách `,`), `open` (`true`/`1`), `sort` (`rating` \| `fee` \| `new`), `page`, `limit` (≤50) |
| `GET` | `/api/v1/cuisines` | — (chip lọc loại món) |

- Chỉ quán `status = active`.
- Tìm theo `name`, `tagline`; lọc cuisine qua `cuisines.slug`; `open` → `is_open_now`.
- Sắp xếp: rating, phí giao, mới nhất (`created_at`).

**Client**

| Route | File | Ghi chú |
|-------|------|---------|
| `/app/search` | `client/src/modules/customer/Search.jsx` | List, filter, sort, phân trang, đồng bộ URL |
| `/app` | `client/src/modules/customer/Home.jsx` | Ô tìm kiếm hero → chuyển `/app/search?q=...` |

- Hook: `useRestaurants.js`, `useCuisines.js`.
- API: `fetchRestaurants`, `fetchCuisines` trong `client/src/lib/api.js`.

### Một phần mock

- Trang chủ `/app`: block “quán nổi bật”, “đặt lại”, trending — vẫn từ `client/src/data/mock.js` (ngoài phạm vi CUS-01).

### Database

- `restaurants`, `cuisines`

### Kiểm tra (checkpoint)

`/app/search` → danh sách từ DB, lọc + tìm kiếm hoạt động.

---

## CUS-02 — Chi tiết nhà hàng + menu

### Đã làm

**Server** (`server/src/routes/restaurants.routes.js`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `GET` | `/api/v1/restaurants/:id` | Chi tiết quán (`id` số hoặc `slug`) |
| `GET` | `/api/v1/restaurants/:id/menu` | Menu theo `menu_categories` + `menu_items` (active, in stock) |
| `GET` | `/api/v1/restaurants/:id/reviews` | 6 đánh giá mới nhất (bonus) |

**Client**

| Route | File | Hook |
|-------|------|------|
| `/app/restaurant/:id` | `client/src/modules/customer/Restaurant.jsx` | `useRestaurantDetail`, `useRestaurantMenu`, `useRestaurantReviews` |

- Hiển thị: tên, tagline, phí giao, địa chỉ, trạng thái mở/đóng, menu theo danh mục + tab lọc.
- Thêm vào giỏ: **local state** (`AppContext`) — chưa lưu DB (CUS-03 đợt 2).

### UI chưa nối backend

- Nút Lưu / Chia sẻ — chưa handler.
- Chat với quán — stub link `/chat/chat-merchant`.
- Giờ hoạt động sidebar — hiển thị ước lượng từ `avgPrepTimeMin`.

### Database

- `restaurants`, `cuisines`, `menu_categories`, `menu_items`, `reviews`, `users`

### Kiểm tra (checkpoint)

`/app/restaurant/1` (hoặc slug seed) → menu thật từ DB.

---

## CUS-09 — Sổ địa chỉ giao hàng

### Đã làm

**Server** (`server/src/routes/me.routes.js`) — tất cả cần JWT.

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `GET` | `/api/v1/me/addresses` | Danh sách địa chỉ user hiện tại |
| `POST` | `/api/v1/me/addresses` | Tạo địa chỉ |
| `PATCH` | `/api/v1/me/addresses/:id` | Cập nhật một phần |
| `DELETE` | `/api/v1/me/addresses/:id` | Xóa (clear default nếu cần) |
| `POST` | `/api/v1/me/addresses/:id/default` | Đặt mặc định + sync `customer_profiles` |

Body tạo/sửa: `label`, `recipientName`, `recipientPhone`, `line1`, `ward`, `district`, `city`, `latitude`, `longitude`, `deliveryNote`, `isDefault`.

- Địa chỉ đầu tiên tự đặt default.
- Validation SĐT VN phía client.

**Client**

| Route | File |
|-------|------|
| `/app/profile/addresses` | `client/src/modules/customer/profile/Addresses.jsx` |

- CRUD đầy đủ + đặt mặc định.
- Cần quyền `customer` trong `user_roles` (xem `docs/AUTH.md`).

### Chưa làm

- Bản đồ / geocoding (`latitude`, `longitude` có cột DB nhưng form chưa gửi).
- Checkout chưa chọn địa chỉ từ API (đợt 2).

### Database

- `customer_addresses`, `customer_profiles` (`default_address_id`)

### Kiểm tra (checkpoint)

`/app/profile/addresses` → thêm / sửa / xóa / đặt mặc định OK.

---

## ADM-01 — Tổng quan hệ thống

### Đã làm

**Server** (`server/src/routes/admin.routes.js`)

| Method | Endpoint | Query |
|--------|----------|-------|
| `GET` | `/api/v1/admin/overview` | `range`: `today` \| `week` \| `month` (mặc định `month`) |

Yêu cầu: JWT + role `admin` trong **`user_roles`** (không chỉ `primary_role`).

**Response gồm:**

- `totals` — users theo role, quán active, đơn/GMV/phí nền tảng/hoàn tiền trong khoảng thời gian.
- `pendingApprovals` — merchant `pending`, driver `approval_status = pending`.
- `recentSignups` — 10 user mới nhất.
- `chart` — đơn + GMV + phí theo ngày (Recharts).

**Client**

| Route | File |
|-------|------|
| `/admin` | `client/src/modules/admin/Overview.jsx` |

- Toggle 7 ngày / 30 ngày / hôm nay; badge “Dữ liệu từ DB”.
- Link sang `/admin/restaurants`, `/admin/drivers`, `/admin/accounts`.

### Database

- `users`, `user_roles`, `restaurants`, `orders`, `driver_profiles`

### Kiểm tra (checkpoint)

Login admin (`avery@nomnom.example` / `password123`) → `/admin` thấy KPI thật.  
*Lưu ý:* seed đơn hàng tháng 5/2026 — chọn **30 ngày** nếu “Hôm nay” = 0.

---

## ADM-02 — Quản lý tài khoản

### Đã làm

**Server** (`server/src/routes/admin.routes.js`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| `GET` | `/api/v1/admin/usersQuery` | `role`, `status`, `q`, `page`, `limit` (≤100) |
| `PATCH` | `/api/v1/admin/users/:id/status` | `{ status, suspensionDays? }` — `active` \| `suspended` \| `banned` |
| `POST` | `/api/v1/admin/users/:id/reset-password` | `{ newPassword? }` — random + email nếu bỏ trống |

**Luồng đăng nhập** (`server/src/routes/auth.routes.js`):

- User `suspended` / `banned` → login 403.
- Hết hạn suspend → tự `active` khi login.
- Admin không thể suspend/ban/reset chính mình.

**Client**

| Route | File |
|-------|------|
| `/admin/accounts` | `client/src/modules/admin/Accounts.jsx` |

- Tìm theo tên/email, lọc role + status, phân trang.
- Duyệt pending → active; suspend (có modal số ngày); ban; kích hoạt lại.
- Reset mật khẩu (nhập tay hoặc random + gửi email SMTP).

### Cấu hình (reset password email)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=NomNom
```

### Database

- `users` (`status`, `suspension_expires_at`, `password_hash`)
- `user_roles`

### Kiểm tra (checkpoint)

`/admin/accounts` → suspend 1 user → user đó login bị chặn.

---

## Phân quyền (liên quan Wave 1)

| Khái niệm | Nguồn | Dùng cho |
|-----------|-------|----------|
| `users.primary_role` | Cột `users` | Giao diện `/app`, menu avatar, redirect sau login |
| `user_roles` | Bảng `user_roles` | Vào `/admin`, API admin, CRUD địa chỉ (`customer`) |

Chi tiết: `docs/AUTH.md`.

---

## Checklist cuối đợt 1

Tham chiếu `docs/planning/groups.txt` (dòng 49–55):

- [ ] Upload ảnh qua Postman → URL hoạt động
- [ ] `/app/search` — list + lọc + tìm từ DB
- [ ] `/app/restaurant/:id` — menu thật
- [ ] `/app/profile/addresses` — CRUD + default
- [ ] `/admin` — KPI thật (admin trong `user_roles`)
- [ ] `/admin/accounts` — suspend → login bị chặn

---

## File tham chiếu

| Loại | Đường dẫn |
|------|-----------|
| Kế hoạch wave | `docs/planning/groups.txt` |
| Auth & seed | `docs/AUTH.md` |
| API server | `server/README.md` |
| Schema DB | `database/nomnom.sql` |
| Route map client | `client/src/App.jsx` |
