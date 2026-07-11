# Đợt 4 - Hợp đồng triển khai

Mục tiêu: thanh toán VNPay sandbox, voucher thật, công cụ khuyến mãi/review cho merchant, và công cụ đơn hàng/kiểm duyệt review cho admin. Không bao gồm vận hành tài xế.

## Quy ước chung

- API giữ prefix `/api/v1` và lỗi tương thích với hệ thống hiện tại: `{ "error": "Thông báo" }`.
- Mọi phép tính tiền chạy ở server bằng số nguyên VND. Client chỉ hiển thị giá trị server trả về.
- Danh sách dùng `page`, `pageSize`; response gồm `data` và `pagination`.
- Route merchant phải lấy quán theo `req.auth.userId`; không nhận `restaurantId` từ body để quyết định quyền sở hữu.
- Callback VNPay là dữ liệu không tin cậy: bắt buộc kiểm tra chữ ký, số tiền, mã đơn và chống xử lý lặp.
- Migration chung phải được áp dụng trước khi tách nhánh: `database/migrations/20260711_wave4_foundation.sql`.

## CUS-05 - Thanh toán VNPay

### Phạm vi

- Bật lựa chọn VNPay ở checkout.
- Tạo payment attempt cho đơn `pending_payment`, ký URL sandbox và chuyển người dùng sang VNPay.
- Xử lý return cho UX và IPN cho trạng thái đáng tin cậy.
- Một callback hợp lệ chỉ được ghi nhận một lần; callback lặp trả kết quả thành công hiện tại mà không cộng tiền/lặp thông báo.

### API contract

| Method | Endpoint | Input / Output |
|---|---|---|
| `POST` | `/api/v1/payments/vnpay` | `{ orderId }` -> `{ paymentId, paymentUrl }` |
| `GET` | `/api/v1/payments/vnpay/return` | query VNPay -> `{ orderCode, paymentStatus }` |
| `GET` | `/api/v1/payments/vnpay/ipn` | query VNPay -> response code theo VNPay |

Khi thanh toán thành công: `payments.status='succeeded'`, `orders.payment_status='paid'`, `orders.status='placed'`, thêm status log và notification trong cùng transaction.

### Acceptance criteria

- Chọn VNPay -> sandbox -> quay lại đúng đơn và hiển thị thành công/thất bại.
- Sai chữ ký hoặc sai số tiền không được đổi trạng thái đơn.
- Refresh return hoặc gửi lại IPN không tạo side effect trùng.

### Cấu hình

Các biến `VNPAY_*` đã có trong `server/.env.example`; secret thật chỉ đặt trong `.env`/Railway.

## CUS-10 - Voucher cho khách

### Phạm vi

- Liệt kê voucher khả dụng theo quán và kiểm tra mã trước checkout.
- Tính giảm giá theo `percent` hoặc `fixed`, áp `min_order_amount`, `max_discount_amount`, thời gian, quota tổng và quota khách.
- Khi tạo đơn, khóa và kiểm tra lại voucher trong transaction; không tin kết quả preview từ client.
- COD chuyển redemption sang `redeemed` khi tạo đơn; VNPay giữ `reserved` và chỉ `redeemed` khi IPN thành công. Đơn hủy/thanh toán thất bại chuyển `released`.

### API contract

| Method | Endpoint | Input / Output |
|---|---|---|
| `GET` | `/api/v1/vouchers?restaurantId=:id` | `{ data: VoucherSummary[] }` |
| `POST` | `/api/v1/vouchers/validate` | `{ code, restaurantId, subtotal }` -> `{ voucher, discountAmount }` |
| `POST` | `/api/v1/orders` | Dùng trường `voucherCode` đã có; response thêm snapshot voucher |

`VoucherSummary`: `id`, `code`, `name`, `description`, `discountType`, `discountValue`, `maxDiscountAmount`, `minOrderAmount`, `startsAt`, `endsAt`.

### Acceptance criteria

- Mã hợp lệ giảm đúng tổng tiền và snapshot được giữ trên đơn.
- Mã sai quán, hết hạn, hết quota, dưới mức tối thiểu trả `400` và không tạo redemption.
- Hai request đồng thời không vượt `usage_limit` hoặc `per_user_limit`.

## MER-05 - Khuyến mãi và phản hồi review

### Phạm vi

- Merchant CRUD voucher thuộc quán của mình, chuyển `draft/active/paused`.
- Merchant xem review thật, lọc theo rating/trạng thái phản hồi và reply một lần hoặc cập nhật reply.
- Không cho sửa/xóa voucher làm thay đổi snapshot của đơn cũ.

### API contract

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET/POST` | `/api/v1/merchant/me/vouchers` | Danh sách / tạo voucher |
| `PATCH` | `/api/v1/merchant/me/vouchers/:id` | Sửa hoặc đổi trạng thái voucher |
| `GET` | `/api/v1/merchant/me/reviews` | Danh sách có phân trang/lọc |
| `PATCH` | `/api/v1/merchant/me/reviews/:id/reply` | `{ replyText }` -> review đã cập nhật |

### Acceptance criteria

- Merchant không đọc/sửa voucher hoặc review của quán khác.
- Voucher active của quán xuất hiện và áp dụng được ở checkout quán đó.
- Reply hiển thị trên API review công khai; review bị admin ẩn không xuất hiện công khai.

## ADM-04 - Đơn hàng và kiểm duyệt review

### Phạm vi

- Danh sách/chi tiết đơn thật với lọc trạng thái, payment, quán, mã đơn và phân trang.
- Admin hủy đơn với lý do, ghi status log và notification.
- Đơn VNPay đã paid phải đi qua quy trình refund sandbox; chỉ đặt `payment_status='refunded'` sau phản hồi refund thành công.
- Admin ẩn/hiện review và tính lại `restaurants.rating_avg/review_count` trong cùng transaction.

### API contract

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/v1/admin/orders` | Danh sách phân trang/lọc |
| `GET` | `/api/v1/admin/orders/:id` | Chi tiết đơn, payment và status log |
| `POST` | `/api/v1/admin/orders/:id/cancel` | `{ reason }` -> đơn đã hủy/refund |
| `GET` | `/api/v1/admin/reviews` | Danh sách phân trang/lọc |
| `PATCH` | `/api/v1/admin/reviews/:id` | `{ isHidden }` -> review đã cập nhật |

### Acceptance criteria

- Hủy đơn ghi đúng `cancelled_by_role='admin'`, lý do, log và notification.
- Refund thất bại không được báo đơn đã refunded; lỗi có thể retry an toàn.
- Review ẩn biến mất khỏi API công khai và KPI rating được tính lại; hiện lại đảo ngược đúng.

## Phân công đề xuất

| Người | Phạm vi |
|---|---|
| 1 | CUS-05 backend + bảo mật callback |
| 2 | CUS-05 checkout/return + kiểm thử sandbox |
| 3 | CUS-10 validate/redemption + checkout voucher |
| 4 | MER-05 voucher/review merchant |
| 5 | ADM-04 orders/refund |
| 6 | ADM-04 moderation + regression Đợt 3 |

Các nhánh dùng format `feature/<issue>-<scope>`, ví dụ `feature/cus-05-vnpay-api`. Contract trong file này được chốt trước; thay đổi contract phải được cập nhật ở đây trước khi merge code phụ thuộc.
