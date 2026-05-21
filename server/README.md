# NomNom Server

API Node.js (Express + MySQL) cho frontend NomNom.

## Yêu cầu

- Node.js 18+
- MySQL 8 với database `nomnom` (import `database.sql` ở thư mục gốc repo)

## Cài đặt & chạy

```bash
cd server
cp .env.example .env
# Sửa DB_PASSWORD trong .env
npm install
npm run dev
```

API mặc định: `http://localhost:3001`

## Endpoints

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/health` | Health check |
| GET | `/api/v1/home/categories` | Carousel "Khám phá theo món ăn" — từ `menu_items` (`/app`) |
| GET | `/api/v1/home/promos` | 3 banner khuyến mãi — từ `home_promo_banners` (`/app`) |

Nếu DB cũ thiếu bảng banner:

```bash
mysql -u root -p nomnom < sql/002_home_promo_banners.sql
```

## Frontend

Vite proxy `/api` → `localhost:3001` (xem `client/vite.config.js`).

Chạy song song:

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```
