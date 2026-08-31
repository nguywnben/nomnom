# NomNom Final Readiness Checklist — 03/09/2026

> Thứ tự bắt buộc: P0 tiền/dữ liệu/phạm vi trước, UI polish sau. Không thêm tính năng mới.

## 31/08 — Scope và release gate

- [x] Duyệt mô hình ba vai trò; chốt nhà hàng tự giao/thuê vận chuyển ngoài NomNom.
- [x] Duyệt state machine đơn và ma trận quyền hủy/refund.
- [x] Duyệt công thức phí giao, commission, voucher và merchant earning.
- [x] Sửa 24 lint errors + 5 warnings; xác minh Merchant Settings không crash.
- [x] Client test/lint/build và server test/syntax đều xanh.
- [x] Mở và xử lý P0 checkout duplicate, refund giả và driver inconsistency.

## 01/09 — Logic cốt lõi

- [x] Checkout bắt buộc customer role.
- [x] Checkout lock cart, revalidate quán/món/giá/vùng giao/voucher trong transaction.
- [x] Idempotency chống double-click và concurrent duplicate order.
- [x] Merchant transition atomic; không skip/replay/overwrite trạng thái.
- [x] Merchant là chủ thể bắt đầu giao; Admin chỉ override có reason + audit.
- [x] Refund không báo `refunded` trước gateway success; kết quả mơ hồ chờ đối soát.
- [x] Worker cancellation không tự gán refund giả; job idempotent và theo batch.
- [x] Voucher reserve/redeem/release và merchant wallet có bảo vệ ghi có lặp.
- [ ] Integration tests cho concurrent checkout, transition race, refund fail/retry pass.

### Checkpoint logic

- [x] Không còn Critical/P0 đã biết về tiền, đơn hoặc quyền.
- [ ] COD và VNPay state machine đều pass trên DB reset sạch.
- [x] Tổng tiền khách trả = merchant earning + platform revenue - khoản sàn tài trợ đúng chính sách.

## 02/09 sáng — Ba vai trò và UI/UX

- [x] Xóa/đổi toàn bộ copy và đường dẫn công khai nhắc Tài xế.
- [x] README, overview, use case, ERD, legal và presentation thống nhất ba vai trò.
- [ ] Customer E2E: home -> cart -> checkout -> tracking -> review.
- [ ] Merchant E2E: onboarding -> menu -> accept -> prepare -> deliver -> wallet.
- [ ] Admin E2E: approve -> exception -> refund -> payout -> audit.
- [ ] Kiểm tra 360/390/768/1440 px; không overflow, CTA bị che hoặc layout shift lớn.
- [ ] Kiểm tra loading/empty/error/retry, keyboard/focus/contrast và slow network.
- [x] Kiểm tra authorization cơ bản, rate limit, upload ownership và dependency audit.

## 02/09 chiều — Full gate và đóng băng

- [x] Full automated gate chạy xanh hai lần liên tiếp.
- [ ] Chrome desktop/mobile pass; Edge và Firefox smoke pass.
- [x] Không có console error/network error bất ngờ trong các màn công khai đã kiểm tra.
- [ ] Reset demo DB tạo đúng account/dữ liệu ba vai trò.
- [x] Backup DB và build artifact đã lưu; rollback đã thử bằng restore vào database tạm.
- [ ] Kịch bản demo 8–12 phút + Q&A + video offline hoàn tất. *(runbook đã có; video/rehearsal còn lại)*
- [x] Ghi accepted risks còn lại với owner và lý do.
- [ ] Freeze code/schema lúc 18:00; sau đó chỉ nhận P0 có regression test.

## 03/09 — Preflight báo cáo

- [ ] Kiểm tra API health, DB, login Admin/Khách hàng/Nhà hàng.
- [ ] Smoke một đơn COD riêng; kiểm tra notification và tracking.
- [ ] Kiểm tra VNPay sandbox; nếu không ổn dùng COD + video dự phòng.
- [ ] Kiểm tra mạng, trình duyệt, máy chiếu, font, âm thanh và nguồn điện.
- [ ] Mở sẵn tab demo theo đúng thứ tự; tắt notification cá nhân.
- [ ] Nếu có lỗi, rollback artifact đã duyệt; không sửa nóng thiếu kiểm thử.

## Go/No-Go

- [ ] GO: tất cả gate bắt buộc xanh, không còn P0/P1 chưa chấp nhận.
- [x] GO WITH KNOWN LIMITATIONS: chỉ giới hạn thủ công đã ghi rõ và không nằm trên luồng demo COD local.
- [ ] NO-GO: refund/đơn trùng/sai quyền/sai số tiền/màn trắng/tài liệu bốn vai trò còn xuất hiện.

## Sau báo cáo

- [ ] Migration xóa driver legacy sau backup và rehearsal.
- [ ] Tách file trên 1.000 dòng theo domain service/component.
- [ ] Worker độc lập + monitoring/alert/reconciliation.
- [ ] Mở rộng E2E, load test, security test và usability test thực tế.
