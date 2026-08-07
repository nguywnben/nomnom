# Hoàn thiện checkout, thanh toán và vòng đời đơn hàng

## Mục tiêu

Đảm bảo giỏ hàng chỉ bị xóa khi đơn hàng/thanh toán thành công; đơn thanh toán thất bại hoặc bị hủy có thể thanh toán lại trong 30 phút.

## Phạm vi thực hiện

- Chuẩn hóa trạng thái: `pending_payment`, `payment_failed`, `paid`, `confirmed`, `preparing`, `delivering`, `completed`, `cancelled`, `expired`.
- Với VNPAY: tạo đơn `pending_payment`, giữ giỏ đến khi backend xác nhận thanh toán thành công, sau đó mới xóa giỏ.
- Khi thanh toán bị hủy/thất bại: cho phép thanh toán lại trong 30 phút; hiển thị thời gian còn lại và nút thanh toán lại trên chi tiết/theo dõi đơn.
- Sau 30 phút, tự động chuyển đơn sang `expired` hoặc `cancelled` và chặn thanh toán lại.
- Với COD: chỉ xóa giỏ sau khi API tạo đơn thành công.
- Xử lý callback VNPAY theo hướng idempotent: refresh hoặc callback lặp lại không được tạo đơn/thanh toán trùng.
- Hiển thị rõ trạng thái thanh toán và lý do không thể thanh toán.

## Yêu cầu backend

- Dùng transaction khi tạo đơn, cập nhật thanh toán và xóa giỏ.
- Xác thực chữ ký VNPAY ở backend.
- Lưu payment attempt và mã giao dịch của nhà cung cấp.
- Có cơ chế tự hết hạn đơn chờ thanh toán.
- Merchant không được xử lý đơn chưa thanh toán hoặc đã hết hạn.

## Tiêu chí nghiệm thu

- Nhấn `Đặt hàng` không tự xóa giỏ nếu chưa có kết quả hợp lệ.
- Hủy VNPAY vẫn có thể thanh toán lại trong 30 phút và không tạo đơn trùng.
- Đơn quá 30 phút không thể thanh toán tiếp.
- Thanh toán thành công chỉ cập nhật đơn và xóa giỏ đúng một lần.
- Trạng thái đơn nhất quán ở customer, merchant và admin.

## Kiểm thử

- Test VNPAY thành công, hủy, sai chữ ký, callback lặp lại và quá hạn.
- Test COD thành công và lỗi tạo đơn.
- Viết integration test cho chuyển trạng thái đơn và logic xóa giỏ.