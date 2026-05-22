# Deploy server lên Railway

## Đọc log deploy

| Log | Ý nghĩa |
|-----|---------|
| `[DB] Kết nối qua MYSQL_URL` | Đúng — dùng URL nội bộ Railway |
| `[DB] Kết nối qua DB_* → host=mysql.railway.internal` | **Sai** — vẫn dùng biến copy tay, **chưa có `MYSQL_URL`** |
| `Access denied ... (using password: YES)` | Host đúng, **mật khẩu sai** |

---

## Cách 1 (khuyên dùng): một biến `MYSQL_URL`

**Service `nomnom` → Variables**

1. **Xóa hết:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
2. **New Variable** → bấm **{} Reference** (không gõ `${{...}}` tay)
3. Chọn service **MySQL** → biến **`MYSQL_URL`**
4. Tên biến trên nomnom: `MYSQL_URL`
5. **Deploy** lại

Log thành công:

```
[DB] Kết nối qua MYSQL_URL
[DB] Kết nối MySQL OK
```

---

## Cách 2: từng biến (Reference, không copy password)

Trên **nomnom**, xóa biến cũ rồi thêm Reference:

| Tên trên nomnom | Reference |
|-----------------|-----------|
| `MYSQLHOST` | `${{MySQL.MYSQLHOST}}` |
| `MYSQLPORT` | `${{MySQL.MYSQLPORT}}` |
| `MYSQLUSER` | `${{MySQL.MYSQLUSER}}` |
| `MYSQLPASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `MYSQLDATABASE` | `${{MySQL.MYSQLDATABASE}}` |

Hoặc map sang tên cũ (cùng giá trị Reference):

| `DB_HOST` | `${{MySQL.MYSQLHOST}}` |
| `DB_PORT` | `${{MySQL.MYSQLPORT}}` |
| `DB_USER` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `DB_NAME` | `${{MySQL.MYSQLDATABASE}}` |

**Không** mở MySQL → copy password → dán vào nomnom (dễ lệch 1 ký tự).

---

## Biến khác (nomnom)

```
CORS_ORIGIN=https://nomnom-beta-five.vercel.app
JWT_SECRET=<chuỗi-dài-random>
SMTP_* ...
```

`PORT` — Railway tự gán.

## Vercel

```
VITE_API_URL=https://<public-domain-của-service-nomnom>
```
