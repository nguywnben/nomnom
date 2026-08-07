# Rà soát Profile và phân quyền theo vai trò

## Mục tiêu

Biến `/app/profile/*` thành khu vực tài khoản khách hàng gọn gàng, hoạt động thật; đồng thời chặn merchant/admin truy cập các chức năng chỉ dành cho customer.

## Phạm vi thực hiện

- Rà soát mọi route trong `/app/profile`.
- Chỉ giữ các tính năng phù hợp với customer: thông tin cá nhân, địa chỉ giao hàng, địa chỉ mặc định, voucher, phương thức thanh toán nếu đã có backend, bảo mật tài khoản và tùy chọn thông báo nếu được lưu thật.
- Xóa, ẩn hoặc đánh dấu chưa khả dụng các nội dung demo/tĩnh.
- Sửa logic địa chỉ mặc định: địa chỉ tạo trong checkout phải xuất hiện trong `/app/profile/addresses`; tổng quan profile phải hiển thị đúng địa chỉ mặc định; người dùng có thể chọn/thay đổi địa chỉ mặc định.
- Customer-only: địa chỉ, thanh toán, voucher customer, giỏ hàng, checkout và đơn hàng customer.
- Merchant/admin chỉ được sửa thông tin tài khoản và bảo mật chung; không có địa chỉ giao hàng, thanh toán, voucher customer, giỏ hàng hoặc checkout.
- Logout từ route cần đăng nhập phải chuyển về `/app`, xóa dữ liệu riêng của phiên cũ và không ép về `/login`.

## Yêu cầu backend

- Kiểm tra phân quyền tại API, không chỉ ở route frontend.
- API sai role trả `403` nhất quán.
- Địa chỉ mặc định phải được lưu/truy vấn từ database.

## Tiêu chí nghiệm thu

- Mỗi role chỉ thấy các mục profile liên quan.
- Địa chỉ đồng bộ giữa checkout, profile và tạo đơn.
- Merchant/admin không gọi được API customer-only.
- Logout không để lại thông tin phiên cũ.
- Không có giao diện demo trông như dữ liệu đã lưu thật.

## Kiểm thử

- Test riêng customer, merchant và admin.
- Test tạo/sửa/xóa/chọn địa chỉ mặc định.
- Test truy cập trực tiếp route/API trái quyền và route guard.