# Đợt 4 - Checklist thực thi

## Khởi động

- [ ] Team review và chấp thuận `docs/planning/issues-wave-4.md` cùng `tasks/plan.md`.
- [ ] Pull nhánh `dev`; xác nhận working tree sạch.
- [ ] Backup DB dev.
- [ ] Chạy `mysql -u root -p nomnom < database/migrations/20260711_wave4_foundation.sql`.
- [ ] Kiểm tra `SHOW TABLES LIKE 'vouchers'` và `SHOW COLUMNS FROM orders LIKE 'voucher_id'`.
- [ ] Điền `VNPAY_*` vào `server/.env`/Railway, không commit secret.
- [ ] Chạy server health, frontend lint/build và luồng COD smoke test.
- [ ] Chốt người phụ trách từng lát và tạo nhánh `feature/<issue>-<scope>`.

## CUS-05

- [ ] Backend tạo payment URL và lưu payment attempt.
- [ ] Return/IPN kiểm tra chữ ký, amount, order, idempotency.
- [ ] Checkout/return page nối API thật.
- [ ] Test success, failure, tamper, duplicate callback.

## CUS-10

- [ ] API list/validate voucher.
- [ ] Order transaction áp voucher và snapshot.
- [ ] Reservation lifecycle đúng với COD/VNPay/cancel/failure.
- [ ] Test rule, quota và concurrency.

## MER-05

- [ ] CRUD voucher thật và ownership test.
- [ ] Trang promotions nối API.
- [ ] List/reply review thật và ownership test.
- [ ] Reply hiển thị ở review công khai.

## ADM-04

- [ ] List/detail đơn thật, filter và pagination.
- [ ] Cancel COD và refund VNPay với audit/notification.
- [ ] List/hide/unhide review thật.
- [ ] Recompute rating/count và test public visibility.

## Checkpoint cuối đợt

- [ ] VNPay sandbox -> return -> đơn paid.
- [ ] Voucher giảm đúng và merchant voucher chỉ dùng đúng quán.
- [ ] Merchant reply review hiển thị cho khách.
- [ ] Admin hủy paid -> refunded + notification.
- [ ] Admin ẩn review -> review biến mất và rating đúng.
- [ ] Regression toàn bộ checkpoint Đợt 3.
- [ ] `node --check` backend, test suite, frontend lint/build đều pass.
- [ ] Không có secret/debug output/build artifact trong diff.
- [ ] Demo, merge, tag `wave-4-done`, retro.

## Rollback

- [ ] Tắt lựa chọn VNPay/voucher ở client nếu cần rollback ứng dụng.
- [ ] Revert code theo commit/PR độc lập.
- [ ] Chỉ khi chưa có dữ liệu cần giữ: chạy `database/migrations/20260711_wave4_foundation_rollback.sql` trên DB đã backup.
