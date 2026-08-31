# Cẩm nang Người 2 — Nguyễn Thị Như Ngọc

## Vai trò trong câu chuyện

Đưa lựa chọn món thành một giỏ hàng hợp lệ kèm danh tính, địa chỉ và voucher sẵn sàng cho checkout. Thời lượng mục tiêu 3 phút 30 giây.

## Phải nắm sâu

| Phần | Logic/nghiệp vụ | Nguồn dữ liệu |
|---|---|---|
| Restaurant/dish/reviews | Chỉ món active; hiển thị mở cửa, khoảng cách, min order, tồn kho, menu và rating | `restaurants`, `menu_categories`, `menu_items`, `reviews`, `vouchers` |
| Profile/edit/settings | Sửa tên/SĐT/avatar; email không sửa; ảnh qua upload có ownership; đổi mật khẩu/logout all | Me/Auth/Uploads APIs; `users`, `uploaded_assets`, `refresh_tokens` |
| Addresses | CRUD đúng owner, tỉnh/phường, tọa độ, địa chỉ mặc định duy nhất | Me/Locations APIs; `customer_addresses`, `customer_profiles` |
| Promotions | Lưu mã công khai/đúng code, xóa mã lưu, dọn mã hết hạn | Vouchers/Me APIs; saved/dismissed vouchers, redemptions |
| Notifications | Lọc, đọc một/đọc tất cả; gắn đúng user | Notifications API; `notifications` |
| CartDrawer | Một active cart/một quán; thêm/tăng/giảm/xóa/ghi chú; đổi quán phải xác nhận; reload không mất | Cart API; `carts`, `cart_items`, `menu_items` |

Frontend có thể hiển thị giá và cảnh báo, nhưng checkout backend vẫn tái kiểm tra giá/tồn kho/quán/voucher. Giỏ persistent không có nghĩa snapshot giá đã được khóa.

## Kịch bản demo

1. Từ quán Người 1 vừa mở, cho xem menu theo danh mục, trạng thái hết hàng và voucher quán.
2. Mở chi tiết món, đánh giá món; thêm món với số lượng/ghi chú.
3. Mở CartDrawer, thay số lượng và giải thích quy tắc một quán.
4. Mở địa chỉ mặc định hoặc thêm nhanh địa chỉ; nhắc tọa độ phục vụ tính ship.
5. Reload để chứng minh cart từ DB, rồi chuyển checkout.

## Trường hợp biên cần trả lời

- Không thêm món hết hàng/quán đóng/ngoài phạm vi; server vẫn kiểm tra lại.
- Thêm món quán khác yêu cầu xác nhận thay giỏ, tránh checkout trộn nhiều nhà hàng.
- Chỉ chủ tài khoản CRUD địa chỉ; xóa default sẽ được xử lý lại theo quy tắc API.
- Voucher lưu trong kho chưa chắc dùng được cho giỏ hiện tại; tính hợp lệ xác định ở checkout.

## Câu hỏi phản biện

- **Vì sao một giỏ chỉ có một quán?** Một đơn có một điểm chuẩn bị, một phí giao, một vòng đời và một đối soát.
- **Tại sao lưu tọa độ cùng địa chỉ?** Để tính khoảng cách, phí và kiểm tra phạm vi ổn định.
- **Giá đổi sau khi thêm giỏ thì sao?** Backend dùng giá mới khi checkout và tạo snapshot; không tin giá cũ ở client.
- **Ảnh có an toàn không?** Upload cần auth, kiểm loại/kích thước và lưu ownership để chỉ chủ sở hữu/Admin xóa hợp lệ.

## Biết sơ lược phần còn lại

Người 1 tạo hành trình khám phá; Người 3 khóa giỏ và tạo payment/order; Người 4 quản lý hậu đặt; Người 5 nhận đúng đơn của quán; Người 6 kiểm soát ngoại lệ. Đọc phần 5–9 và 12 của thư viện chung.

## Câu chuyển giao

“Giỏ hàng, địa chỉ và lựa chọn voucher đã sẵn sàng, nhưng chưa phải số tiền cuối. Minh Được sẽ cho thấy backend tái kiểm tra toàn bộ và tạo đơn COD/VNPay an toàn.”
