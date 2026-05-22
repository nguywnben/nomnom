# Deploy server lên Railway

## Lỗi `ER_ACCESS_DENIED` user `root`

MySQL **đã nhận kết nối** nhưng **từ chối mật khẩu** → gần như luôn do **sai password** trên service **nomnom** (copy tay lệch 1–2 ký tự).

### Cách đúng (không gõ password)

**Service `nomnom` → Variables → New Variable:**

| Tên | Giá trị (Reference) |
|-----|---------------------|
| `MYSQL_URL` | `${{MySQL.MYSQL_URL}}` |

(`MySQL` = tên service database trong project — chọn từ dropdown **Add Reference**, không paste text.)

**Xóa** các biến copy tay (nếu có): `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

Redeploy service **nomnom**.

Log deploy thành công sẽ có:

```
[DB] Kết nối qua MYSQL_URL
[DB] Kết nối MySQL OK
```

### Không dùng

- `MYSQL_PUBLIC_URL` — dùng cho máy ngoài Railway; service nomnom dùng **`MYSQL_URL`** (host `mysql.railway.internal`).
- Password gõ tay từ màn hình MySQL Variables.

### Biến khác (nomnom)

```
PORT          → Railway tự gán (8080)
CORS_ORIGIN   → https://nomnom-beta-five.vercel.app
JWT_SECRET    → chuỗi random dài
SMTP_*        → Gmail app password
```

### Client Vercel

```
VITE_API_URL=https://<domain-public-của-railway-nomnom>
```

Không có `/` ở cuối.
