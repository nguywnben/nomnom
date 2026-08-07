# Hoàn thiện khám phá, tìm kiếm và trang chi tiết món ăn

## Mục tiêu

Biến toàn bộ hành trình khám phá món ăn của khách hàng thành dữ liệu thật từ database/API: trang chủ, tìm kiếm, bộ lọc và trang chi tiết món ăn.

## Phạm vi thực hiện

- Thay dữ liệu mock còn lại trên `/app` bằng dữ liệu từ API.
- Quy định logic dữ liệu cho các khu vực:
  - `Khám phá theo món ăn`: món ăn hoặc danh mục còn khả dụng.
  - `Quán nổi bật`: nhà hàng đã duyệt, đang mở cửa; ưu tiên đánh giá và số lượng đánh giá.
  - `Các món thịnh hành`: món ăn thật theo quy tắc xếp hạng rõ ràng, ví dụ số lượt đặt rồi đến đánh giá.
  - `Đặt lại món`: chỉ hiển thị cho khách hàng đã đăng nhập và có lịch sử đơn.
  - `Theo tâm trạng`: liên kết đến kết quả lọc theo loại ẩm thực thật.
- Nâng cấp `/app/search` để tìm đồng thời nhà hàng và món ăn theo từ khóa.
- Hỗ trợ lọc theo loại món ăn, khoảng giá, đánh giá, đang mở cửa và sắp xếp; đồng bộ trạng thái vào URL.
- Xóa các nhãn nội bộ như `is_open_now` khỏi giao diện.
- Tạo `/app/menu-items/:id`, hiển thị ảnh, tên, mô tả, giá, nhà hàng, tình trạng còn hàng, số lượng, ghi chú và nút thêm vào giỏ.
- Không cho đặt món khi món hoặc nhà hàng không khả dụng.

## Yêu cầu backend

- Tạo/mở rộng API tìm kiếm món ăn và lấy chi tiết món ăn.
- Kiểm tra hợp lệ query parameter, trả response nhất quán và có phân trang khi cần.
- Không trả về nhà hàng chưa duyệt hoặc món không thể đặt như lựa chọn khả dụng.

## Tiêu chí nghiệm thu

- Mọi khu vực khám phá trên `/app` lấy dữ liệu từ database/API.
- Tìm kiếm trả về được cả nhà hàng và món ăn; bộ lọc tác động đến API thật.
- Có thể mở chi tiết món và thêm món vào giỏ hàng.
- Có loading, empty và error state rõ ràng; không gây trắng trang.
- Không còn dữ liệu mock trong luồng khám phá món ăn.

## Kiểm thử

- Test từ khóa khớp nhà hàng, món ăn, cả hai và không khớp.
- Test món/nhà hàng hết hàng hoặc đóng cửa.
- Viết test cho API filter, mapping dữ liệu frontend và trang chi tiết món.