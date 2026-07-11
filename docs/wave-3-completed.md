# Đợt 3 - Vận hành đơn hàng đã hoàn thành

Tài liệu này chốt phạm vi sáu issue của Đợt 3 trên nhánh `dev` sau khi các PR #47-#52 đã được hợp nhất.

## Kết quả

| Issue | Trạng thái | API chính | UI chính |
|---|---|---|---|
| CUS-06 | Hoàn thành | `GET /api/v1/orders` | `/app/orders` |
| CUS-07 | Hoàn thành | `GET /api/v1/orders/:idOrCode` | `/app/track/:id` |
| CUS-08 | Hoàn thành | `POST /api/v1/orders/:idOrCode/review` | `/app/reviews/write/:id` |
| MER-02 | Hoàn thành | `GET /api/v1/merchant/me/dashboard` | `/merchant` |
| MER-03 | Hoàn thành | `GET /api/v1/merchant/me/orders`, `PATCH .../status` | `/merchant/orders` |
| MER-04 | Hoàn thành | CRUD `/api/v1/merchant/me/categories` và `/items` | `/merchant/menu` |

## Luồng đã khép kín

- Khách xem lịch sử, lọc trạng thái, mở chi tiết và đặt lại đơn.
- Trang tracking đọc đơn thật và polling cho tới trạng thái kết thúc.
- Merchant chuyển đơn theo state machine `placed -> accepted -> preparing -> ready_for_pickup`; mỗi lần đổi trạng thái có log và thông báo cho khách.
- Khách chỉ được đánh giá đơn `delivered`, mỗi đơn tối đa một review; điểm trung bình và số review của quán được tính lại từ review đang hiển thị.
- Dashboard merchant lấy KPI, doanh thu, món bán chạy và đơn gần đây từ DB.
- Merchant quản lý danh mục/món thuộc đúng quán của mình; menu công khai đọc thay đổi từ DB.

## Checkpoint Đợt 3

- [x] Đơn vừa tạo xuất hiện tại `/app/orders`.
- [x] `/app/track/:code` hiển thị timeline và tự cập nhật.
- [x] Merchant nhận đơn và chuyển `accepted -> preparing`.
- [x] Merchant chuyển `ready_for_pickup`, khách thấy bước mới.
- [x] Đơn `delivered` có thể đánh giá và cập nhật `rating_avg`.
- [x] `/merchant` hiển thị KPI từ DB.
- [x] `/merchant/menu` CRUD danh mục/món và menu khách đọc dữ liệu mới.

## Quality gate trước Đợt 4

- Backend: toàn bộ file JavaScript qua `node --check`.
- Frontend: `npm run lint` không còn lỗi; còn cảnh báo hook không chặn lệnh.
- Frontend build phải được chạy lại trên máy không chặn child process (sandbox hiện tại trả `spawn EPERM`).
- Kiểm thử end-to-end cần DB MySQL và tài khoản seed; checklist chạy tay nằm trong `tasks/todo.md`.

## Phạm vi chuyển sang Đợt 4

- VNPay hiện mới có schema `payments`, trạng thái `pending_payment` và route return phía client; chưa có ký request/callback/IPN.
- Voucher thật chưa có trong schema gốc; dùng migration `database/migrations/20260711_wave4_foundation.sql`.
- `reviews.is_hidden`, `reviews.reply_text` và `reviews.reply_at` đã sẵn để MER-05/ADM-04 sử dụng.
- Màn hình merchant promotions/reviews và admin orders/reviews đã có khung UI nhưng chưa được xem là hoàn thành cho tới khi nối API thật.
