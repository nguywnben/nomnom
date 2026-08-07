# Hoàn thiện khu vực Admin bằng dữ liệu thật và nhật ký thao tác

## Mục tiêu

Biến admin workspace thành khu vực vận hành đáng tin cậy: dữ liệu thật, thao tác thật, số liệu đúng và có audit log cho hành động quan trọng.

## Phạm vi thực hiện

- Rà soát toàn bộ route sidebar admin và phân loại: đã hoạt động bằng dữ liệu thật, còn thiếu, hoặc chưa triển khai cần ẩn khỏi UI.
- Thay số liệu dashboard tĩnh bằng aggregate query thật: tổng đơn theo trạng thái, GMV/doanh thu, customer/merchant/nhà hàng đang hoạt động, đơn đăng ký nhà hàng chờ duyệt, thanh toán và payout.
- Hoàn thiện thao tác admin: duyệt/từ chối đơn nhà hàng, quản lý user, xem danh sách/chi tiết đơn, hủy đơn có lý do, kiểm duyệt đánh giá, quản lý voucher/cấu hình chỉ khi có persistence thật và xử lý payout nếu có backend.
- Mọi thao tác admin phải cập nhật đúng customer và merchant.
- Thêm audit log cho duyệt/từ chối nhà hàng, khóa tài khoản, hủy đơn, xử lý payout và thay đổi cấu hình.

## Yêu cầu backend

- Toàn bộ API admin cần authorization nghiêm ngặt.
- Dashboard dùng aggregate query hiệu quả; danh sách có phân trang.
- Response dashboard/list/detail dùng cấu trúc nhất quán.
- Audit log lưu admin thực hiện, hành động, đối tượng, thời điểm và metadata cần thiết.

## Tiêu chí nghiệm thu

- Mọi mục admin hiển thị đều dùng dữ liệu thật hoặc được ẩn có chủ đích.
- Dashboard khớp với dữ liệu đơn hàng/người dùng thực tế.
- Duyệt/từ chối nhà hàng cập nhật đúng trạng thái merchant.
- Hủy đơn cập nhật đúng customer và merchant.
- Hành động quan trọng có audit log.
- Không còn số liệu, tài khoản hoặc tài chính mock trong admin UI.

## Kiểm thử

- Test bằng dữ liệu seed thật cho customer, merchant và admin.
- Test phân trang, empty state và API sai quyền.
- Viết integration test cho approve/reject, cancel order và audit log.