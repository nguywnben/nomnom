# Implementation Plan: Đợt 4

> **Implementation update (August 3, 2026):** Wave 4 code, migrations, unit tests, build, syntax checks, and authenticated API smoke tests are complete. See [the completion report](../docs/wave-4-completed.md). Live VNPay payment/refund acceptance remains pending `VNPAY_TMN_CODE` and `VNPAY_HASH_SECRET`.

## Overview

Đợt 4 bổ sung VNPay sandbox, voucher, công cụ merchant và kiểm duyệt admin trên trục đơn hàng hiện có. Cách triển khai là contract-first, sau đó chia lát dọc để mỗi nhánh có API, UI và kiểm thử riêng.

## Architecture decisions

- `orders` là nguồn sự thật cho tổng tiền/trạng thái; `payments` lưu từng lần thử thanh toán.
- Return URL phục vụ UX, còn IPN đã xác minh chữ ký mới là nguồn sự thật cho thanh toán.
- Voucher dùng reservation để tránh vượt quota và giữ snapshot trên đơn để lịch sử không đổi.
- Review ẩn/hiện và cập nhật rating chạy chung transaction.
- API mới giữ error shape `{ error: string }` để không phá client hiện tại.

## Dependency graph

```text
Migration + API contract (đã chuẩn bị)
  ├─ CUS-05 VNPay ───────────────┐
  ├─ CUS-10 Voucher ─────────────┼─ ADM-04 cancel/refund
  └─ Review schema hiện có ─ MER-05/ADM-04 moderation
                                  └─ Regression + checkpoint
```

## Phase 0: Shared foundation

- [x] Task 0.1: Chốt contract API Đợt 4.
- [x] Task 0.2: Thêm migration voucher và rollback.
- [x] Task 0.3: Bổ sung cấu hình VNPay mẫu.
- [x] Task 0.4: Áp migration trên DB dev và chạy smoke query.

Verification: xem `tasks/todo.md`, mục Khởi động.

## Phase 1: Risk-first payment slice

### Task 1: CUS-05 - VNPay backend

**Acceptance criteria:** ký URL đúng; xác minh signature/amount/order; IPN idempotent; cập nhật payment/order/log/notification trong transaction.

**Verification:** unit test ký/xác minh; integration test callback hợp lệ, sai chữ ký, callback lặp.

**Dependencies:** Phase 0. Files dự kiến: route payment, lib VNPay, đăng ký route, test payment, env docs.

### Task 2: CUS-05 - Checkout và return

**Acceptance criteria:** bật VNPay; redirect sandbox; return hiển thị trạng thái lấy từ API; retry được khi failed.

**Verification:** build/lint và một vòng sandbox end-to-end.

**Dependencies:** Task 1. Files dự kiến: checkout, return page, API client, route tests.

### Checkpoint A

- [ ] COD không regression.
- [ ] VNPay sandbox thành công/thất bại đúng.
- [ ] Callback lặp không tạo side effect trùng.

## Phase 2: Voucher and merchant slice

### Task 3: CUS-10 - Voucher validation/redemption

**Acceptance criteria:** validate đủ rule; áp lại trong transaction tạo đơn; reservation/redeem/release đúng COD và VNPay; chống vượt quota đồng thời.

**Verification:** test percent/fixed/cap/minimum/expiry/quota/race; checkout hiển thị tổng server trả về.

**Dependencies:** Phase 0; tích hợp trạng thái với Task 1. Files dự kiến: voucher route/lib, orders route, checkout/cart, tests.

### Task 4: MER-05 - Voucher merchant

**Acceptance criteria:** CRUD đúng ownership; trạng thái draft/active/paused; voucher active áp dụng được ở đúng quán.

**Verification:** integration test cross-tenant bị 403/404; browser test create -> apply at checkout.

**Dependencies:** Phase 0 contract, có thể chạy song song Task 3. Files dự kiến: merchant routes, promotion page, API client, tests.

### Task 5: MER-05 - Reply review

**Acceptance criteria:** list review thật; reply đúng ownership; reply hiển thị công khai khi review không bị ẩn.

**Verification:** integration ownership + browser test reply.

**Dependencies:** schema review hiện có. Files dự kiến: merchant routes, reviews page, public review serializer, tests.

### Checkpoint B

- [ ] Merchant tạo voucher, khách áp dụng đúng quán.
- [ ] COD và VNPay cùng ghi redemption đúng.
- [ ] Merchant reply review và khách thấy reply.

## Phase 3: Admin operations slice

### Task 6: ADM-04 - Order operations/refund

**Acceptance criteria:** list/detail phân trang; hủy có audit/notification; paid VNPay chỉ chuyển refunded khi gateway xác nhận; retry idempotent.

**Verification:** integration test COD cancel, paid refund success/failure/retry; browser test admin filters/detail.

**Dependencies:** Task 1. Files dự kiến: admin routes/lib, orders page, API client, tests.

### Task 7: ADM-04 - Review moderation

**Acceptance criteria:** list phân trang; hide/unhide; public API lọc review ẩn; rating/count tính lại nguyên tử.

**Verification:** integration test hide/unhide và aggregate; browser test moderation.

**Dependencies:** schema review hiện có; có thể chạy song song Task 6. Files dự kiến: admin routes, moderation page, restaurant routes, tests.

### Checkpoint C: Đợt 4 hoàn tất

- [ ] Sáu checkpoint nghiệp vụ trong `docs/planning/waves-remaining.txt` đều pass.
- [ ] Backend syntax/tests, frontend lint/build đều pass.
- [ ] Regression checkpoint Đợt 3 pass.
- [ ] Secrets không nằm trong git; rollback migration đã dry-run trên DB test.
- [ ] Leader review, merge và tạo tag `wave-4-done`.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Tin return URL thay vì IPN | Cao | Signature + amount validation, IPN là nguồn sự thật |
| Callback/refund lặp | Cao | Transaction, unique attempt/txn id, idempotent transitions |
| Voucher vượt quota | Cao | Row lock và đếm reserved+redeemed trong transaction |
| Merchant truy cập chéo quán | Cao | Resolve restaurant từ JWT owner, test cross-tenant |
| Rating lệch sau moderation | Trung bình | Recompute aggregate trong cùng transaction |

## Open questions for kickoff

- Tài khoản VNPay sandbox và `VNPAY_TMN_CODE/HASH_SECRET` do ai quản lý?
- Refund sandbox sẽ gọi API thật hay dùng adapter giả lập có cùng contract trong môi trường demo?
- Ngày bắt đầu/kết thúc và tên sáu thành viên để chốt phân công cuối cùng.
