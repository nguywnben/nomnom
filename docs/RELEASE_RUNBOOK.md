# NomNom Release Runbook — Báo cáo 03/09/2026

## Phạm vi bản phát hành

NomNom chỉ công bố ba vai trò: **Admin, Khách hàng và Nhà hàng**. Nhà hàng tự giao hoặc
thuê đơn vị vận chuyển ngoài NomNom; hệ thống không phân công hay quản lý tài xế.

## 1. Preflight

1. Dùng Node.js 22+ và MySQL đang chạy; không dùng tài khoản hoặc secret production trong demo.
2. Kiểm tra `GET /api/health` trả `200` và client dùng đúng `VITE_API_URL`.
3. Kiểm tra `CORS_ORIGIN` đúng origin client, VNPay đang dùng sandbox và đồng hồ máy chính xác.
4. Dừng thêm tính năng. Chỉ sửa P0/P1 có regression test và rollback rõ ràng.

## 2. Backup trước mọi migration/reset

Từ thư mục `server`:

```powershell
npm run backup:db
```

Lệnh tạo SQL dump nhất quán trong `backups/` và in SHA-256. Ghi lại tên file, checksum,
commit và người thực hiện. Không đưa backup chứa dữ liệu người dùng lên Git.

Khôi phục khi cần (cần MySQL CLI trên máy vận hành):

```powershell
mysql -u root -p nomnom < backups/nomnom-YYYYMMDDTHHMMSSZ.sql
```

Luôn khôi phục thử vào database tạm trước; không ghi đè database đang chạy khi chưa có
backup mới và người phụ trách xác nhận.

## 3. Migration

Với database đã tồn tại, áp migration theo thứ tự trong `docs/README.md`. Các migration
ngày 31/08 gồm idempotency checkout, ownership upload và đối soát tài chính demo.
Migration đối soát tài chính chỉ tác động `order_code LIKE 'DEMO-%'`; rollback chính xác nằm
tại `database/migrations/20260831_reconcile_demo_finance_rollback.sql`.

## 4. Quality gate bắt buộc

Khởi động API trước nếu chạy kèm smoke test. Mật khẩu demo chỉ truyền qua biến môi trường:

```powershell
$env:NOMNOM_DEMO_PASSWORD = '<demo-password>'
node scripts/verify-release.mjs --rounds 2 --smoke
Remove-Item Env:NOMNOM_DEMO_PASSWORD
```

Mỗi vòng chạy client lint/test/build, server tests/syntax, audit dependency và authorization
smoke cho ba vai trò. Chỉ GO khi hai vòng liên tiếp cùng xanh.

## 5. Build artifact

Sau gate cuối, dùng đúng thư mục `client/dist` vừa tạo. Lưu artifact cùng:

- commit SHA;
- thời điểm build;
- SHA-256 của file nén;
- checksum backup database;
- kết quả hai vòng gate.

Không build lại sau khi đã chốt checksum. Nếu code đổi, hủy artifact cũ và chạy lại toàn bộ gate.

## 6. Rollback

Rollback ứng dụng bằng cách triển khai lại commit đã duyệt trước đó; không dùng `git reset --hard`
trên workspace có thay đổi. Nếu migration đã chạy, dùng rollback migration tương ứng hoặc khôi phục
backup đã kiểm tra. Sau rollback phải kiểm tra health, login ba vai trò và một truy vấn đơn hàng.

Rollback ngay khi có một trong các dấu hiệu:

- sai số tiền, đơn trùng hoặc trạng thái refund không chắc chắn bị ghi là thành công;
- lỗi quyền cho phép truy cập chéo vai trò;
- màn trắng hoặc API lỗi trên luồng demo chính;
- migration làm thay đổi đơn không thuộc dữ liệu demo.

## 7. Go/No-Go

**GO** khi gate hai vòng xanh, backup và artifact có checksum, smoke ba vai trò pass, không còn P0/P1.

**GO WITH KNOWN LIMITATIONS** chỉ áp dụng cho hạn chế P2 đã ghi trong `KNOWN_LIMITATIONS.md` và
không nằm trên luồng demo.

**NO-GO** nếu thiếu backup, refund/checkout/authorization chưa chắc chắn, hoặc tài liệu/UI còn mô tả
NomNom có vai trò Tài xế.
