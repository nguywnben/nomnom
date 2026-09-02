# Cẩm nang Người 4 — Hồ Minh Nhật

## Vai trò trong câu chuyện

Phụ trách trải nghiệm sau checkout: lịch sử, trạng thái, hủy/đặt lại, tracking gần thời gian thực, chat, xác nhận nhận và đánh giá. Thời lượng mục tiêu 3 phút 30 giây.

## Phải nắm sâu

| Phần | Logic/nghiệp vụ | Nguồn dữ liệu |
|---|---|---|
| `/app/orders` | Tìm/lọc; xem chi tiết; hủy ở mốc hợp lệ; đặt lại món còn bán | Me/Orders/Cart APIs; orders/items/menu |
| `/app/track/:id` | Timeline từ status log; polling 5 giây; ETA; trạng thái payment; confirm delivery | `orders`, `order_status_logs`, `payments` |
| Chat | Chỉ bên thuộc đơn; conversation theo order; polling hội thoại 5 giây/tin 3 giây; mark read | `conversations`, `chat_messages` |
| Write review | Chỉ đơn delivered/đúng customer; rating quán và từng món | `reviews`, `orders`, `order_items` |
| Restaurant/dish reviews | Lọc/phân bố; merchant reply; khách sửa review một lần | Reviews APIs; `reviews.is_edited` |

Không nói có GPS tài xế hoặc WebSocket. Icon xe chỉ biểu thị giai đoạn giao; NomNom không theo dõi vị trí người giao.

## Kịch bản demo

> 📋 **Kho dữ liệu copy-paste sẵn:** Mở [`./00-KHO-DU-LIEU-COPY-PASTE.md`](./00-KHO-DU-LIEU-COPY-PASTE.md#nguoi-4-ho-minh-nhat--theo-doi-chat--danh-gia) để lấy nội dung tin nhắn chat 1-1 và bài đánh giá 5 sao cho quán và món ăn.

1. Mở đơn vừa tạo ở danh sách và tracking.
2. Chuyển nhanh sang cửa sổ Merchant để Người 5 cập nhật hoặc dùng đơn đã chuẩn bị sẵn; quay lại cho thấy polling cập nhật.
3. Mở chat, gửi một tin ngắn và chỉ lịch sử gắn với đơn.
4. Ở đơn `delivering`, khách xác nhận đã nhận.
5. Mở form đánh giá quán/món; dùng dữ liệu chuẩn bị sẵn nếu thiếu thời gian.

## Trường hợp biên cần trả lời

- Customer chỉ xem/xác nhận/review đơn của mình.
- Không thể confirm trước `delivering`; không review trước `delivered`.
- Hủy phụ thuộc trạng thái và payment; đơn đang giao/đã giao không hủy tự do.
- Đặt lại có thể loại/từ chối món đã ẩn, hết hàng hoặc đổi quán trạng thái.
- Chat không phải kênh thanh toán và không thay audit nghiệp vụ.

## Câu hỏi phản biện

- **Realtime bằng gì?** Polling 3–5 giây; phù hợp scope đồ án, có thể nâng WebSocket/SSE sau này.
- **Ai xác nhận giao xong?** Khách; hệ thống có auto-complete dự phòng sau thời gian chờ.
- **Chống review giả?** Review gắn order delivered và customer sở hữu order.
- **Sửa review ra sao?** Cho sửa một lần, giữ cờ `is_edited` để minh bạch.

## Biết sơ lược phần còn lại

Người 3 tạo đơn; Người 5 là bên tạo các transition giao; Người 6 nhìn cùng đơn ở cấp hệ thống và dòng tiền. Hiểu cơ bản auth/cart để giải thích quyền sở hữu đầu-cuối.

## Câu chuyển giao

“Hành trình khách hàng kết thúc khi khách xác nhận và đánh giá. Dĩ Khang sẽ chuyển sang phía nhà hàng — nơi thực đơn, trạng thái đơn và việc tự tổ chức giao hàng được vận hành.”
