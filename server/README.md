# NomNom Server

API Node.js (Express + MySQL) cho frontend NomNom.

## Yêu cầu

- Node.js 18+
- MySQL 8 với database `nomnom` (import `database/nomnom.sql` từ thư mục gốc repo)
- Nếu dùng upload ảnh, cấu hình thêm Cloudinary trong `.env`

## Cài đặt & chạy

```bash
cd server
cp .env.example .env
# Sửa DB_PASSWORD trong .env
npm install
npm run dev
```

API mặc định: `http://localhost:3000`

## Upload ảnh (INF-01)

Yêu cầu header `Authorization: Bearer <accessToken>`.

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/v1/uploads` | `multipart/form-data`, field `file`; optional `folder` (body hoặc query) |
| DELETE | `/api/v1/uploads?publicId=<id>` | Xoá ảnh trên Cloudinary (`publicId` có thể chứa `/`) |

## Hồ sơ & bảo mật (CUS-11)

Yêu cầu header `Authorization: Bearer <accessToken>`.

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/v1/me` | Hồ sơ user hiện tại |
| PATCH | `/api/v1/me` | `{ fullName?, phone?, avatarUrl? }` |
| POST | `/api/v1/me/change-password` | `{ currentPassword, newPassword }` |
| POST | `/api/v1/auth/logout-all` | Thu hồi mọi refresh token (đăng xuất tất cả thiết bị) |

Folder upload: `avatar`, `restaurant`, `menu`, `driver-kyc`, `review` (mặc định `avatar`).

Biến môi trường (thêm vào `.env`):

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Test nhanh bằng Postman: login → lấy token → POST file ảnh → nhận `{ url, publicId }`.

## Endpoints

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/health` | Health check |
| GET | `/api/v1/home/categories` | Carousel "Khám phá theo món ăn" — từ `menu_items` (`/app`) |
| GET | `/api/v1/home/promos` | 3 banner khuyến mãi — từ `home_promo_banners` (`/app`) |
| GET | `/api/v1/admin/overview?range=month` | KPI tổng quan admin (`/admin`) — cần role admin |
| GET | `/api/v1/admin/restaurants/pending` | Danh sách quán chờ duyệt (ADM-03) |
| POST | `/api/v1/admin/restaurants/:id/approve` | Duyệt quán → `active`, tạo wallet merchant |
| POST | `/api/v1/admin/restaurants/:id/reject` | Từ chối quán — body `{ reason }` |
| GET | `/api/v1/admin/drivers/pending` | Danh sách tài xế chờ duyệt (ADM-03) |
| POST | `/api/v1/admin/drivers/:userId/approve` | Duyệt tài xế → tạo wallet driver |
| POST | `/api/v1/admin/drivers/:userId/reject` | Từ chối tài xế — body `{ reason }` |

Tất cả endpoint `/api/v1/admin/*` (trừ khi ghi chú khác) yêu cầu `Authorization: Bearer` và role `admin` trong `user_roles`.

Approve/reject tự động: insert `notifications`, gửi email (nodemailer / log DEV nếu chưa cấu SMTP).

Nếu DB cũ thiếu bảng banner:

```bash
mysql -u root -p nomnom < sql/002_home_promo_banners.sql
```

## Frontend

Vite proxy `/api` → `localhost:3000` (xem `client/vite.config.js`).

Chạy song song:

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```

## Wave 4 Runtime

Apply both Wave 4 migrations after the base database import:

```bash
mysql -u root -p nomnom < ../database/migrations/20260711_wave4_foundation.sql
mysql -u root -p nomnom < ../database/migrations/20260803_wave4_completion.sql
```

Configure `VNPAY_TMN_CODE` and `VNPAY_HASH_SECRET` in `server/.env`. Sandbox URLs already have defaults in `.env.example`; never commit the real secret.

Run backend regression tests with:

```bash
npm test
```

Wave 4 API contracts and verification evidence are documented in:

- `docs/planning/issues-wave-4.md`
- `docs/wave-4-completed.md`
- `tasks/todo.md`
