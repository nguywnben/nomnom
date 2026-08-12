# Thiết kế lấy địa bàn GHN và tính phí giao hàng tự động

## Mục tiêu

Thay nguồn dữ liệu hành chính hiện tại tại phần chọn địa chỉ bằng dữ liệu danh mục của GHN, đồng thời tự động tính lại phí giao hàng khi khách đổi địa chỉ ở checkout. Phạm vi này không tạo vận đơn GHN, không quản lý trạng thái giao hàng và không nhận webhook.

## Phạm vi

Bao gồm:

- Lấy tỉnh/thành, quận/huyện và phường/xã GHN qua backend NomNom.
- Lưu các mã tỉnh, quận/huyện và phường/xã GHN cùng địa chỉ khách hàng.
- Lấy các dịch vụ GHN có thể dùng cho cặp điểm lấy hàng của nhà hàng và điểm giao của khách.
- Gọi báo giá GHN, hiển thị lại phí khi checkout đổi địa chỉ.
- Lưu phí GHN đã được backend xác minh vào `delivery_fee` khi tạo đơn COD hoặc VNPay.

Không bao gồm:

- Tạo, hủy, theo dõi vận đơn GHN; webhook; đối soát COD; in phiếu giao hàng.
- Mỗi nhà hàng dùng một tài khoản GHN riêng. NomNom dùng một shop GHN đã cấu hình.
- Khối lượng/kích thước riêng theo từng món hoặc từng nhà hàng.

## Cấu hình

Môi trường server cần có các biến sau. Các giá trị bí mật không được trả về client hoặc commit vào Git:

```env
GHN_TOKEN=
GHN_SHOP_ID=
GHN_API_BASE_URL=https://online-gateway.ghn.vn/shiip/public-api
```

Khi test, dùng `https://dev-online-gateway.ghn.vn/shiip/public-api` cùng Token và Shop ID của môi trường test.

## Mô hình dữ liệu

Thêm ba cột nullable vào `customer_addresses` để tương thích địa chỉ cũ:

- `ghn_province_id` (số nguyên)
- `ghn_district_id` (số nguyên)
- `ghn_ward_code` (chuỗi)

Địa chỉ mới hoặc địa chỉ được chỉnh sửa từ giao diện khách hàng bắt buộc có đủ ba giá trị này. Địa chỉ cũ vẫn xem được, nhưng không thể báo giá GHN và không thể chọn để đặt hàng cho đến khi khách cập nhật lại.

Giai đoạn này không lưu các mã địa bàn GHN vào `orders`: snapshot địa chỉ hiện có cùng `delivery_fee` cuối cùng vẫn là dữ liệu lịch sử của đơn.

## Ranh giới backend

Tạo module client GHN độc lập, chịu trách nhiệm:

- Dùng chung base URL, header `Token` và `ShopId`.
- Chuẩn hóa dữ liệu phản hồi và lỗi từ nhà cung cấp.
- Cung cấp `getProvinces`, `getDistricts(provinceId)`, `getWards(districtId)`, `getAvailableServices(fromDistrictId, toDistrictId)` và `quote(...)`.

Mở các endpoint chỉ dành cho khách đã đăng nhập:

```text
GET  /api/v1/shipping/ghn/provinces
GET  /api/v1/shipping/ghn/districts?provinceId=:provinceId
GET  /api/v1/shipping/ghn/wards?districtId=:districtId
POST /api/v1/shipping/ghn/quote
```

Endpoint báo giá chỉ nhận `addressId`; backend tự lấy giỏ hàng đang hoạt động, nhà hàng và người dùng từ phiên đã xác thực. Không tin các giá trị client gửi lên cho điểm lấy hàng, phí, Token, Shop ID, service ID hoặc kích thước kiện hàng.

Backend lấy quận/huyện điểm lấy hàng từ shop GHN chung của NomNom, yêu cầu GHN trả các dịch vụ khả dụng theo cặp điểm lấy/giao, rồi chọn dịch vụ khả dụng đầu tiên có `service_type_id = 2` (hàng nhẹ). Sau đó gọi API tính phí với quy cách mặc định giai đoạn một:

```text
weight: 500 gram
length: 20 cm
width: 20 cm
height: 10 cm
insurance_value: 0
```

Kết quả báo giá gồm dịch vụ GHN được chọn và `fee.total`. Đây là dữ liệu hiển thị ngắn hạn, không phải giá trị client có quyền quyết định.

## Luồng checkout và tạo đơn

1. Form địa chỉ chọn tỉnh, quận/huyện, phường/xã hoàn toàn từ endpoint proxy GHN của NomNom.
2. Khách đổi `addressId` ở checkout.
3. Checkout gọi endpoint báo giá và hiển thị `total` GHN trong thời gian tải/khi thành công.
4. Nếu báo giá lỗi, giao diện giải thích lỗi và khóa nút đặt hàng.
5. Khi khách bấm đặt hàng, client chỉ gửi `addressId`, phương thức thanh toán, ghi chú và mã khuyến mãi như hiện tại.
6. Route tạo đơn tự gọi lại báo giá phía server trước khi INSERT. Kết quả này được lưu vào `orders.delivery_fee`, thay cho cách dùng `restaurants.base_delivery_fee` cố định.
7. Nếu địa chỉ thiếu mã GHN, tuyến không có service, hoặc GHN từ chối báo giá, server trả lỗi 4xx/502 và không tạo đơn.

Việc báo giá lại khi tạo đơn ngăn client giả mạo phí hoặc dùng báo giá đã cũ. Phí có thể lệch nhỏ giữa thời điểm preview và đặt đơn; backend là nguồn dữ liệu cuối cùng trước khi ghi đơn.

## Xử lý lỗi và trải nghiệm người dùng

- Kiểm tra `provinceId`, `districtId` là số hợp lệ và `wardCode` không rỗng trước khi gọi GHN.
- Chỉ hiển thị địa bàn/tuyến đang mở và được GHN hỗ trợ.
- Khi không thể báo giá, tuyệt đối không quay về `base_delivery_fee` cố định.
- Trả thông báo tiếng Việt an toàn cho khách; log chỉ chứa status/code của nhà cung cấp, không chứa Token.
- Bỏ qua kết quả báo giá cũ khi khách đổi địa chỉ liên tiếp.

## Kiểm thử

- Unit test module GHN client bằng cách mock `fetch`, kiểm tra chuẩn hóa request/response.
- Test endpoint danh mục địa bàn, query không hợp lệ và lỗi không lộ bí mật.
- Test báo giá: có dịch vụ hỗ trợ, không có dịch vụ, địa chỉ không hợp lệ và GHN lỗi.
- Test route tạo đơn dùng phí server báo giá thay vì `restaurants.base_delivery_fee`.
- Bổ sung test client cho reset chọn địa bàn theo cấp và các trạng thái loading/lỗi/thành công của báo giá.

## Tiêu chí nghiệm thu

- Khách chọn được tỉnh, quận/huyện, phường/xã GHN và các mã được lưu vào địa chỉ.
- Đổi địa chỉ ở checkout tự động báo lại phí từ GHN.
- Chỉ địa chỉ có mã quận/huyện và phường/xã GHN mới có thể đặt đơn.
- Đơn hàng lưu phí GHN đã được backend xác minh.
- Không có thông tin xác thực GHN trong mã React, payload mạng trình duyệt, log, giá trị `.env.example` hoặc lịch sử Git.
