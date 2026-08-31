# Cẩm nang Người 3 — Trần Minh Được

## Vai trò trong câu chuyện

Giải thích phần có rủi ro nghiệp vụ cao nhất: checkout, khoảng cách/phí giao, voucher, COD/VNPay, transaction và chống tạo đơn trùng. Thời lượng mục tiêu 4 phút.

## Phải nắm sâu

| Phần | Logic/nghiệp vụ | Nguồn dữ liệu |
|---|---|---|
| `/app/checkout` | Chọn/nhập địa chỉ, quote ship, voucher, recipient, note, payment; server tính tổng | Cart, addresses, shipping, vouchers, orders APIs |
| Shipping | ORS route nếu có key; fallback Haversine ×1,3; 12 km; `min(50k, 15k + ceil(km)×5k)` | Tọa độ restaurant/address; `shippingQuote.js` |
| Voucher | Kiểm phạm vi sàn/quán, thời gian, status, min order, quota/per-user, max discount | `vouchers`, `voucher_redemptions` |
| Checkout transaction | Khóa và tái kiểm tra cart/quán/món/giá/voucher/địa chỉ; snapshot; idempotency | `orders`, `order_items`, status logs, checkout idempotency |
| COD | Tạo `placed`, payment method COD; chưa thu tiền tại checkout | `orders`, `payments` |
| VNPay | Tạo `pending_payment`, redirect; Return hiển thị; verify/IPN và chữ ký cập nhật payment | `payments`, `orders`; VNPay sandbox |
| Result/success | Không suy đoán thành công; hiển thị theo kết quả server rồi dẫn tracking | Payment verify và order detail |

## Kịch bản demo

1. Chọn địa chỉ và chỉ khoảng cách, ETA, nguồn quote; áp voucher hợp lệ.
2. Giải thích công thức tổng và việc server tính lại.
3. Luồng chính dùng COD để ổn định; nhấn đặt một lần và mở success.
4. Dùng slide/video cho VNPay: pending → redirect → signature verify → placed/failed.
5. Nêu `Idempotency-Key`: double-click/retry không tạo đơn thứ hai.

## Trường hợp biên cần trả lời

- Giá/tồn kho/quán/voucher đổi trước checkout: transaction từ chối hoặc tính lại, không tạo hóa đơn sai.
- ORS lỗi: fallback nếu đã có tọa độ; geocode địa chỉ mới cần ORS và có thể báo dịch vụ chưa sẵn sàng.
- VNPay thất bại tạo `payment_failed`; quá 30 phút chưa xác nhận thành `expired`.
- Hủy đơn đã trả không đồng nghĩa refund; phải đối soát gateway.
- Voucher sàn không giảm thu nhập quán; voucher quán giảm phần billable của quán.

## Câu hỏi phản biện

- **Transaction bảo vệ gì?** Tránh race giữa giá/tồn/voucher/cart và đảm bảo order/items/redemption/log nhất quán.
- **Return URL có đủ tin không?** Không; phải kiểm chữ ký và ưu tiên nguồn xác nhận server/IPN.
- **Tại sao snapshot?** Hóa đơn cũ không đổi khi địa chỉ, món hoặc giá cập nhật.
- **Ai tính tổng?** Backend; số gửi từ UI không phải nguồn sự thật.

## Biết sơ lược phần còn lại

Người 1–2 tạo giỏ hợp lệ; Người 4 tiêu thụ order/timeline; Người 5 transition đơn; Người 6 đối soát payment/refund/payout. Phải thuộc phần 5–7 và 12 của thư viện chung.

## Câu chuyển giao

“Đơn đã được tạo nhất quán và có trạng thái thanh toán rõ ràng. Minh Nhật sẽ theo dõi chính đơn này qua các bước do nhà hàng cập nhật, chat và kết thúc bằng xác nhận nhận hàng, đánh giá.”
