# Đánh giá Luồng Dự án (Project Flow Review) - NomNom

Hệ thống đặt đồ ăn **NomNom** có kiến trúc Client-Server rõ ràng, phân quyền chi tiết (customer, merchant, driver, admin) và tích hợp cổng thanh toán VNPay Sandbox. Dưới đây là phân tích chi tiết và các điểm đánh giá theo chuẩn `superpowers-review`.

---

## 🔍 Tổng Quan Luồng Nghiệp Vụ Chính (Core Flows)

### 1. Luồng Xác thực & Phân Quyền (Auth & RBAC)
- **Frontend**: 
  - `AppContext.jsx` quản lý thông tin phiên đăng nhập (`user`, `role`, `permittedRoles`). Khi tải trang, hệ thống tự động khôi phục session bằng JWT token qua `/api/v1/auth/me`.
  - Component `RequireAuth.jsx` và `RedirectIfAuthed.jsx` xử lý điều hướng thông minh dựa trên quyền thực tế trong cơ sở dữ liệu (`user_roles`).
- **Backend**:
  - Router `/api/v1/auth` xử lý đăng ký (OTP email), đăng nhập, cấp và làm mới token (Access/Refresh Token).
  - Middleware `requireAuth` kiểm tra tính hợp lệ của JWT token trước khi cho phép truy cập các tài nguyên bảo mật.

### 2. Luồng Giỏ Hàng Khách Hàng (Customer Cart)
- **Frontend**:
  - Người dùng chưa đăng nhập có thể dùng Giỏ hàng khách (Guest Cart) lưu ở LocalStorage.
  - Khi đăng nhập thành công, hệ thống tự động gộp (merge) giỏ hàng khách vào giỏ hàng trên DB (`fetchCartApi` kết hợp `addCartItemApi`).
  - Hỗ trợ các ràng buộc thông qua `customerCart.js` để ngăn tài khoản admin, merchant hoặc driver đặt đồ ăn trên phân hệ khách hàng.

### 3. Luồng Checkout & Đặt Hàng (Checkout & Order Placement)
- **Frontend**:
  - `Checkout.jsx` hỗ trợ chọn địa chỉ đã lưu hoặc tạo địa chỉ mới (lấy danh sách Tỉnh/Thành từ Open API của bên thứ ba).
  - Hỗ trợ hai phương thức thanh toán: COD (thanh toán khi nhận hàng) và VNPay.
- **Backend**:
  - Endpoint `POST /api/v1/orders` thực hiện lưu thông tin đơn hàng và chi tiết các món ăn vào cơ sở dữ liệu sử dụng **Database Transactions** để đảm bảo tính toàn vẹn dữ liệu.
  - Ghi nhận nhật ký thay đổi trạng thái đơn hàng (`order_status_logs`) và gửi thông báo (`notifications`) cho nhà hàng.
  - Trạng thái ban đầu: `placed` (với COD) và `pending_payment` (với VNPay).

### 4. Luồng Thanh Toán VNPay (VNPay Integration)
- **Quy trình thanh toán**:
  1. Người dùng chọn VNPay -> Tạo Order với trạng thái `pending_payment`.
  2. Frontend gọi `POST /api/v1/payments/vnpay/create` để nhận URL thanh toán từ Sandbox VNPay.
  3. Sau khi người dùng thanh toán trên cổng VNPay, trình duyệt chuyển hướng về URL phản hồi của Frontend (`checkout/vnpay/return`).
  4. Frontend gọi `GET /api/v1/payments/vnpay/verify` kèm query string nhận từ VNPay gửi lên Backend.
  5. Backend thực hiện xác thực chữ ký bảo mật (Secure Hash) bằng HmacSHA512. Nếu thành công, tiến hành cập nhật trạng thái đơn hàng thành `paid` và lưu lịch sử thanh toán qua hàm `confirmPaymentSuccess`.
  6. Backend hỗ trợ thêm endpoint IPN (`POST /api/v1/payments/vnpay/ipn`) để xử lý thanh toán bất đồng bộ (Server-to-Server) giúp đảm bảo đơn hàng được cập nhật kể cả khi khách hàng tắt trình duyệt lúc đang chuyển hướng.

---

## 🚫 Blockers (Lỗi nghiêm trọng cần sửa ngay)
*Không tìm thấy lỗi nghiêm trọng nào ảnh hưởng đến việc vận hành luồng cơ bản.*

---

## ⚠️ Majors (Vấn đề lớn ảnh hưởng đến trải nghiệm & bảo mật)

### 1. Phụ thuộc hoàn toàn vào API địa chỉ bên thứ ba trong Checkout
- **Chi tiết**: Trong `Checkout.jsx`, danh sách Tỉnh/Thành phố và Phường/Xã được fetch trực tiếp từ `https://provinces.open-api.vn/api/v2/p/` khi người dùng chọn tạo địa chỉ mới.
- **Rủi ro**: Nếu API này bị chậm, quá tải hoặc ngừng hoạt động (do đây là dịch vụ miễn phí), các trường chọn này sẽ bị rỗng. Người dùng không thể chọn Tỉnh/Thành hay Phường/Xã, dẫn đến việc validation form thất bại và **chặn hoàn toàn việc đặt hàng** nếu họ chưa có địa chỉ lưu sẵn.
- **Đề xuất**: Tích hợp danh sách Tỉnh/Thành phố cơ bản dạng dữ liệu tĩnh (static JSON local fallback) trong dự án để sử dụng khi API bên thứ ba gặp sự cố.

### 2. Sử dụng phương thức GET để cập nhật trạng thái thanh toán
- **Chi tiết**: API `/api/v1/payments/vnpay/verify` sử dụng phương thức **GET** để thực hiện nghiệp vụ cập nhật cơ sở dữ liệu (`UPDATE orders SET payment_status = 'paid' ...` thông qua `confirmPaymentSuccess`).
- **Rủi ro**: Vi phạm nguyên lý thiết kế RESTful (GET chỉ nên dùng để truy xuất dữ liệu không gây đột biến trạng thái). Thêm vào đó, nếu người dùng vô tình tải lại (reload) trang kết quả hoặc trình duyệt lưu cache trang GET này, nó có thể dẫn đến việc thực thi lại các truy vấn DB (mặc dù đã có kiểm tra trạng thái trước đó nhưng vẫn không tối ưu và dễ gặp rủi ro CSRF).
- **Đề xuất**: Chuyển luồng xác thực và cập nhật sang phương thức **POST** hoặc **PATCH** từ client, hoặc chỉ dùng return URL để hiển thị kết quả cho khách hàng dựa trên việc truy xuất trạng thái từ DB, còn việc cập nhật trạng thái chính thức hãy để IPN (Server-to-Server POST) đảm nhận hoàn toàn.

---

## ℹ️ Minors (Vấn đề nhỏ ảnh hưởng đến chất lượng code)

### 1. Thiếu bản ghi lịch sử trạng thái khi hủy đơn hàng
- **Chi tiết**: Tại route `POST /api/v1/orders/:id/cancel` của `orders.routes.js`, khi khách hàng chọn hủy đơn hàng, hệ thống cập nhật trạng thái đơn hàng thành `cancelled` nhưng **không chèn bản ghi mới** vào bảng `order_status_logs`.
- **Ảnh hưởng**: Làm gián đoạn vết lịch sử trạng thái đơn hàng, gây khó khăn cho việc đối soát hoặc hiển thị timeline chi tiết đơn hàng cho khách hàng và admin.
- **Đề xuất**: Thêm truy vấn `INSERT INTO order_status_logs` tương tự như lúc tạo đơn hoặc thanh toán thành công để lưu lại hành động hủy đơn của khách hàng.

### 2. Trả về thành công kèm rollback giao dịch trong `confirmPaymentSuccess`
- **Chi tiết**: Trong `payments.routes.js`, nếu đơn hàng đã được thanh toán trước đó (`payment_status === 'paid'`), hàm thực hiện rollback giao dịch nhưng lại trả về `{ success: true, code: '02', ... }`.
- **Ảnh hưởng**: Dễ gây hiểu lầm trong luồng logic xử lý lỗi vì giao dịch bị rollback nhưng hàm vẫn báo `success: true`.
- **Đề xuất**: Nên phân tách rõ ràng giữa việc giao dịch thành công thực sự và việc đơn hàng đã được xử lý từ trước để tránh rollback không cần thiết hoặc trả về mã phù hợp hơn.

---

## 💡 Nits (Điểm tối ưu nhỏ giúp code sạch hơn)

### 1. Sử dụng hằng số cho danh sách vai trò (Roles) và trạng thái đơn hàng
- **Chi tiết**: Các vai trò như `'customer'`, `'merchant'`, `'driver'`, `'admin'` và trạng thái đơn hàng như `'pending_payment'`, `'placed'`, `'cancelled'` xuất hiện rải rác dưới dạng chuỗi cứng (hardcoded strings) ở cả frontend và backend.
- **Đề xuất**: Khai báo các đối tượng/hằng số enum tập trung để tăng tính dễ bảo trì và tránh gõ sai chính tả.

### 2. Đối tượng Restaurant giả định trong Checkout
- **Chi tiết**: Trong `Checkout.jsx` có khai báo `const [restaurant] = useState({ name: 'Nhà hàng' });` để làm fallback hiển thị tên quán.
- **Đề xuất**: Nên lấy trực tiếp thông tin từ giỏ hàng hiện tại hoặc lấy từ API chi tiết nhà hàng để hiển thị chính xác tên quán trên giao diện checkout.

---

## 🚀 Tóm tắt & Các bước tiếp theo (Summary & Next Actions)

1. **Khắc phục phụ thuộc API Tỉnh/Thành**: Tạo một file JSON chứa danh mục Tỉnh/Thành phố Việt Nam tĩnh ở client làm phương án dự phòng.
2. **Bổ sung log khi hủy đơn hàng**: Thêm bước chèn log vào bảng `order_status_logs` khi chạy API hủy đơn.
3. **Đồng bộ hóa luồng VNPay**: Tối ưu hóa xử lý IPN làm nguồn dữ liệu tin cậy nhất để cập nhật trạng thái đơn hàng, giảm bớt sự phụ thuộc trực tiếp vào return URL của Client.
