# ADR-001: Mô hình giao hàng ba vai trò

## Trạng thái

Accepted

## Ngày

2026-08-31

## Bối cảnh

Thiết kế ban đầu của NomNom gồm Khách hàng, Nhà hàng, Tài xế và Admin. Phạm vi tốt nghiệp
đã loại vai trò Tài xế, trong khi schema và tài liệu lịch sử vẫn còn cấu trúc phục vụ vai trò này.
Xóa vật lý các bảng/cột ngay trước ngày báo cáo tạo rủi ro dữ liệu và rollback không cần thiết.

## Quyết định

NomNom vận hành chính thức với ba vai trò: Khách hàng, Nhà hàng và Admin.

- Nhà hàng chịu trách nhiệm tự giao hoặc thuê đơn vị vận chuyển ngoài NomNom.
- NomNom quản lý trạng thái giao nhận, không dispatch, KYC, theo dõi vị trí hay trả thu nhập tài xế.
- Nhà hàng chuyển đơn đến `delivering`; khách xác nhận `delivered`; hệ thống có thể tự hoàn tất
  sau hai giờ nếu không có khiếu nại; Admin chỉ override ngoại lệ có audit.
- Phí giao hàng hiện được xem là khoản nền tảng thu để chi trả hoạt động vận chuyển bên ngoài.
- Bảng/cột liên quan tài xế được giữ ở trạng thái legacy, không có route hoặc UI công khai.

## Phương án đã cân nhắc

### Xóa ngay schema tài xế

Giảm nhiễu nhưng có nguy cơ phá seed, báo cáo lịch sử và rollback sát ngày bảo vệ. Không chọn.

### Giữ mô hình bốn vai trò nhưng ẩn UI

Không đúng phạm vi sản phẩm và khiến nghiệp vụ giao hàng thiếu chủ thể. Không chọn.

## Hệ quả

- UI, use case, ERD và kịch bản demo chỉ trình bày ba vai trò.
- Trạng thái `ready_for_pickup`, cột `driver_id` và các bảng driver tồn tại chỉ vì tương thích dữ liệu.
- Migration contract xóa legacy chỉ được thực hiện sau báo cáo, sau backup và rehearsal restore.

