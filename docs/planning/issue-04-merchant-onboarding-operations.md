# Hoàn thiện luồng Merchant từ onboarding đến vận hành

## Mục tiêu

Đảm bảo dữ liệu nhà hàng đi xuyên suốt từ merchant gửi đăng ký, admin xét duyệt đến dashboard merchant hoạt động bằng dữ liệu thật.

## Phạm vi thực hiện

- Xác định cấu trúc dữ liệu thống nhất cho đơn đăng ký và nhà hàng.
- Onboarding thu thập đầy đủ: thông tin chủ sở hữu/liên hệ, tên/mô tả/loại ẩm thực, địa chỉ/giờ hoạt động, phí giao/thời gian chuẩn bị, logo/banner, giấy phép kinh doanh, chứng nhận an toàn thực phẩm và thông tin ngân hàng nếu cần payout.
- Lưu toàn bộ dữ liệu đã nhập, không thay bằng dữ liệu demo.
- Hiển thị đúng trạng thái: draft, submitted, under review, approved, rejected; trạng thái rejected phải có lý do.
- Sau khi được duyệt, merchant sử dụng dữ liệu thật tại hồ sơ/cài đặt nhà hàng, menu, đơn hàng, đánh giá, voucher, dashboard và ví/payout nếu có backend.
- Chức năng chưa có backend thật phải được ẩn hoặc vô hiệu hóa rõ ràng.

## Yêu cầu backend

- Validate dữ liệu onboarding và tài liệu tải lên.
- Lưu lịch sử thay đổi trạng thái xét duyệt.
- Merchant chỉ được truy cập dữ liệu của chính nhà hàng mình.
- Không lộ menu, đơn hàng hoặc tài chính của merchant khác.

## Tiêu chí nghiệm thu

- Dữ liệu merchant gửi xuất hiện đầy đủ, đúng trường ở admin.
- Admin duyệt tạo/kích hoạt đúng nhà hàng của merchant đó.
- Merchant thấy menu, đơn hàng và số liệu thật sau khi được duyệt.
- Merchant bị từ chối thấy lý do thật và có thể sửa/gửi lại nếu được hỗ trợ.
- Dashboard merchant không có doanh thu/đơn hàng giả.

## Kiểm thử

- Tạo merchant mới và test toàn bộ quy trình.
- Test pending, approved, rejected.
- Test phân tách quyền sở hữu với hai merchant và integration test submit/approve/reject.