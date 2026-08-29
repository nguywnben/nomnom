# 🎓 CẨM NANG ÔN TẬP & PHẢN BIỆN BẢO VỆ ĐỒ ÁN THEO TỪNG THÀNH VIÊN
> **DỰ ÁN NỀN TẢNG ĐẶT & GIAO ĐỒ ĂN TRỰC TUYẾN NOMNOM (FOOD DELIVERY PLATFORM)**
> *Tài liệu phân chia chuyên sâu 6 vai trò báo cáo tương ứng với `PRESENTATION_GUIDE.md`*

---

## 📌 HƯỚNG DẪN DÀNH CHO TẤT CẢ THÀNH VIÊN
1. **Phần của mình:** Học thuộc **Logic & Nghiệp vụ cốt lõi** và nằm lòng **Bộ câu hỏi Ban Giám Khảo (BGK)** của phần mình phụ trách để trả lời trôi chảy, tự tin đạt điểm 10.
2. **Phần của bạn khác:** Đọc mục **"Tóm tắt nghiệp vụ cốt lõi"** của các bạn còn lại và xem bảng **"Hỏi Chéo Cứu Bồ" ở cuối tài liệu** để khi BGK hỏi chệch vai trò, bạn vẫn trả lời được rành mạch!

---

## 🧭 MỤC LỤC PHÂN CHIA 6 THÀNH VIÊN

1. [👤 NGƯỜI 1: Landing Page, Xác thực & Khám phá Quán ăn](#-người-1-landing-page-xác-thực--khám-phá-quán-ăn)
2. [👤 NGƯỜI 2: Hồ sơ Khách hàng, Sổ địa chỉ & Giỏ hàng](#-người-2-hồ-sơ-khách-hàng-sổ-địa-chỉ--giỏ-hàng)
3. [👤 NGƯỜI 3: Phí Vận chuyển, Voucher & Thanh toán VNPay / COD](#-người-3-phí-vận-chuyển-voucher--thanh-toán-vnpay--cod)
4. [👤 NGƯỜI 4: Theo dõi Đơn Realtime, Chat 1-1 & Đánh giá](#-người-4-theo-dõi-đơn-realtime-chat-1-1--đánh-giá)
5. [👤 NGƯỜI 5: Vận hành Toàn diện Đối tác Quán ăn (Merchant)](#-người-5-vận-hành-toàn-diện-đối-tác-quán-ăn-merchant)
6. [👤 NGƯỜI 6: Quản trị Sàn, Đối soát Tài chính & Hạ tầng (Admin)](#-người-6-quản-trị-sàn-đối-soát-tài-chính--hạ-tầng-admin)
7. [⚡ BẢNG TỔNG HỢP "HỎI CHÉO CỨU BỒ" (QUICK CHEAT SHEET)](#-bảng-tổng-hợp-hỏi-chéo-cứu-bồ-quick-cheat-sheet)

---

## 👤 NGƯỜI 1: LANDING PAGE, XÁC THỰC & KHÁM PHÁ QUÁN ĂN

* **Phân công gợi ý:** **Ong Tuấn Nghĩa** *(hoặc Nguyễn Văn Dĩ Khang)*
* **Các trang phụ trách review:**
  * Giới thiệu & Điều khoản: `/`, `/faq`, `/terms-of-service`, `/privacy-policy`
  * Hệ thống Auth: `/login`, `/register`, `/forgot-password`, `/verify-otp`, `/reset-password`
  * Khám phá: `/app`, `/app/search`, `/app/restaurant/:id`, `/app/dish/:id`

---

### 🧠 Logic & Nghiệp vụ chuyên sâu cần nắm vững:
1. **Cơ chế Xác thực (Authentication & Role-based Access Control):**
   * Sử dụng **JWT (JSON Web Token)** lưu trong `HttpOnly Cookie` an toàn chống tấn công XSS (Cross-Site Scripting).
   * Phân quyền 3 Role (`customer`, `merchant`, `admin`). Khi đăng nhập thành công, hệ thống tự động điều hướng đúng Portal tương ứng (`/app`, `/merchant`, hoặc `/admin`).
2. **Luồng Khôi phục Mật khẩu qua Email OTP (Forgot Password Flow):**
   * Người dùng nhập email $\rightarrow$ Backend tạo mã OTP 6 chữ số ngẫu nhiên lưu vào CSDL kèm `expires_at` (thời hạn 10 phút).
   * Gửi email thực tế qua dịch vụ SMTP / Nodemailer.
   * Xác thực OTP hợp lệ mới cấp Token tạm thời để cho phép đổi mật khẩu mới (Mật khẩu được băm bảo mật bằng thuật toán **bcrypt** trước khi lưu vào DB).
3. **Thuật toán Tìm kiếm & Bộ lọc nâng cao (`/app/search`):**
   * **Debounce (300ms):** Ngăn chặn việc gửi request liên tục lên server mỗi khi gõ từng ký tự.
   * Tìm kiếm đa chiều: Khớp theo tên món, tên quán ăn, danh mục ẩm thực (`cuisines`).
   * Kết hợp bộ lọc: Khoảng giá (`minPrice`, `maxPrice`), xếp hạng sao ($\ge 4$ sao), và khoảng cách địa lý.
4. **Hiển thị Thực đơn Quán ăn (`/app/restaurant/:id`):**
   * Kiểm tra giờ mở/đóng cửa (`opening_hours`): Nếu quán đang ngoài giờ hoạt động, hiển thị nhãn *"Tạm đóng cửa"* và vô hiệu hóa nút đặt món.
   * Phân nhóm món ăn theo danh mục (`categories`). Món nào bị quán tắt (`is_available = 0`) sẽ bị làm mờ và gắn nhãn *"Hết hàng"*.

---

### 🎯 5 Câu hỏi Ban Giám Khảo CHẮC CHẮN SẼ HỎI & Câu trả lời chuẩn:

#### ❓ Câu 1.1: *"Tại sao nhóm lại lưu JWT trong HttpOnly Cookie thay vì lưu trong LocalStorage?"*
> **💡 Trả lời:**
> *"Dạ thưa Thầy/Cô, lưu JWT trong `LocalStorage` rất dễ bị tin tặc đánh cắp token thông qua các lỗ hổng mã độc XSS (chỉ cần chạy đoạn mã `localStorage.getItem('token')`). Bằng cách sử dụng **`HttpOnly Cookie`**, mã JavaScript trên trình duyệt hoàn toàn không thể đọc được token, chỉ có trình duyệt tự động đính kèm cookie khi gửi request lên backend, giúp bảo mật tuyệt đối phiên đăng nhập của người dùng."*

#### ❓ Câu 1.2: *"Làm thế nào để hệ thống ngăn chặn người dùng gửi liên tục hàng nghìn request tìm kiếm làm sập server?"*
> **💡 Trả lời:**
> *"Dạ, ở phía Frontend em sử dụng kỹ thuật **Debounce 300ms** (chỉ gửi request khi người dùng ngừng gõ phím sau 300ms). Ở phía Backend, hệ thống áp dụng middleware **Rate Limiting** để giới hạn số lượng request tối đa trên mỗi IP trong một khoảng thời gian nhất định."*

#### ❓ Câu 1.3: *"Khi khách hàng chưa đăng nhập thì có được xem menu và thêm món vào giỏ không?"*
> **💡 Trả lời:**
> *"Dạ, khách hàng vãng lai vẫn có thể tự do khám phá trang chủ, tìm kiếm quán ăn và xem chi tiết thực đơn. Tuy nhiên, khi khách hàng thực hiện hành động cần lưu vết như **thêm món vào giỏ hàng, lưu voucher hoặc tiến hành thanh toán**, hệ thống sẽ tự động hiển thị thông báo yêu cầu đăng nhập và tự động chuyển hướng lại đúng trang đang xem dở sau khi đăng nhập thành công nhờ tham số `returnTo`."*

#### ❓ Câu 1.4: *"Mật khẩu của người dùng được lưu trữ như thế nào trong cơ sở dữ liệu?"*
> **💡 Trả lời:**
> *"Dạ, hệ thống không bao giờ lưu mật khẩu dạng Plain Text. Mật khẩu được băm một chiều (One-way Hash) bằng thuật toán **bcrypt với Salt rounds = 10**. Kể cả khi cơ sở dữ liệu bị lộ, kẻ xấu cũng không thể giải mã ngược lại mật khẩu gốc của người dùng."*

#### ❓ Câu 1.5: *"Nếu một quán ăn vừa mới đổi tên hoặc đổi danh mục thì kết quả tìm kiếm có cập nhật ngay không?"*
> **💡 Trả lời:**
> *"Dạ có ạ. Do câu lệnh tìm kiếm truy vấn trực tiếp vào cơ sở dữ liệu MySQL qua câu lệnh `SELECT ... JOIN` có gắn index tìm kiếm, nên ngay khi quán ăn cập nhật thông tin, kết quả tìm kiếm của khách hàng sẽ được cập nhật thời gian thực ngay lập tức."*

---

## 👤 NGƯỜI 2: HỒ SƠ KHÁCH HÀNG, SỔ ĐỊA CHỈ & GIỎ HÀNG

* **Phân công gợi ý:** **Nguyễn Thị Như Ngọc** (`ngoc-2912`)
* **Các trang phụ trách review:**
  * Hồ sơ cá nhân: `/app/profile`, `/app/profile/edit`, `/app/profile/settings`
  * Sổ địa chỉ: `/app/profile/addresses`
  * Kho voucher & Thông báo: `/app/profile/promotions`, `/app/notifications`
  * Giỏ hàng: `CartDrawer` (Ngăn kéo giỏ hàng)

---

### 🧠 Logic & Nghiệp vụ chuyên sâu cần nắm vững:
1. **Quản lý Sổ Địa chỉ & Tọa độ Địa lý:**
   * Mỗi địa chỉ gồm: Tên người nhận, Số điện thoại, Địa chỉ chi tiết, Nhãn (`Nhà riêng` / `Văn phòng`), Cờ mặc định (`is_default`), và cặp Tọa độ `(latitude, longitude)`.
   * **Đảm bảo tính nhất quán của `is_default`:** Khi người dùng đánh dấu 1 địa chỉ là mặc định, Backend dùng Transaction để tự động chuyển toàn bộ các địa chỉ khác của user đó về `is_default = 0`.
2. **Vận hành Giỏ hàng Đồng bộ Database (`CartDrawer`):**
   * Giỏ hàng được lưu trong bảng `cart_items` tại Server (gắn với `customer_id`), **reload trang hay đổi thiết bị giỏ hàng không bị mất**.
   * **Ràng buộc 1 quán ăn duy nhất (Single-Restaurant Cart):** Nếu trong giỏ đang có món của Quán A mà khách bấm thêm món của Quán B $\rightarrow$ Bật Modal cảnh báo xóa giỏ hàng cũ trước khi tạo giỏ mới.
   * Tính toán giá món chính xác: $\text{Giá} = (\text{Giá gốc} + \sum \text{Giá Topping}) \times \text{Số lượng}$.
3. **Kho Voucher Cá nhân (`/app/profile/promotions`):**
   * **Phân tầng thông minh:**
     * **Nhóm Khả dụng (Mục trên):** Hiển thị các voucher còn dùng được, có **Phân trang 6 voucher/trang**.
     * **Nhóm Hết hạn / Đã dùng (Mục dưới):** Tự động thu gọn vào Accordion.
   * **Phân biệt rõ 3 nhãn lỗi:** `Bạn đã sử dụng` vs `Hết lượt toàn sàn` vs `Hết hạn sử dụng`.
   * **Tính năng Dọn dẹp:** Sử dụng bảng `customer_dismissed_vouchers` để ẩn triệt để 100% các mã hết hạn/đã dùng (kể cả mã toàn sàn) kèm **Modal xác nhận an toàn**.
4. **Cài đặt & Modal Xác nhận Đăng xuất:**
   * Nút Đăng xuất ở TopNav và Cài đặt đều kích hoạt **Modal xác nhận đăng xuất** sử dụng `createPortal(..., document.body)` để luôn căn giữa màn hình tuyệt đối, không bị kẹt trong header.

---

### 🎯 5 Câu hỏi Ban Giám Khảo CHẮC CHẮN SẼ HỎI & Câu trả lời chuẩn:

#### ❓ Câu 2.1: *"Tại sao giỏ hàng lại lưu trên Database thay vì lưu trong LocalStorage của trình duyệt?"*
> **💡 Trả lời:**
> *"Dạ thưa Thầy/Cô, lưu giỏ hàng trên Database mang lại 3 ưu điểm vượt trội:
> 1. **Đồng bộ đa thiết bị (Cross-device Sync):** Khách chọn món trên máy tính ở công ty, khi về nhà mở điện thoại lên giỏ hàng vẫn còn nguyên.
> 2. **Kiểm tra tính hợp lệ thời gian thực (Real-time Validation):** Backend luôn kiểm tra được giá món mới nhất và tình trạng còn/hết hàng của quán trước khi chuyển sang bước thanh toán.
> 3. **Phân tích hành vi (Abandoned Cart):** Hệ thống có thể theo dõi các giỏ hàng chưa hoàn tất để gửi thông báo nhắc nhở khách hàng."*

#### ❓ Câu 2.2: *"Nếu khách hàng xóa một địa chỉ mà địa chỉ đó đã từng được dùng để giao hàng cho đơn cũ thì đơn cũ có bị lỗi không?"*
> **💡 Trả lời:**
> *"Dạ không bị ảnh hưởng ạ. Khi tạo đơn hàng, hệ thống thực hiện **Lưu bản sao tĩnh (Snapshot)** toàn bộ chuỗi địa chỉ giao hàng vào bản ghi đơn hàng (`orders.delivery_address`). Bảng sổ địa chỉ `user_addresses` chỉ dùng để gợi ý chọn nhanh khi đặt đơn mới, việc chỉnh sửa hay xóa địa chỉ trong sổ không làm thay đổi lịch sử đơn cũ."*

#### ❓ Câu 2.3: *"Khi khách bấm 'Dọn dẹp tất cả' trong kho voucher thì hệ thống xử lý thế nào đối với các mã toàn sàn công khai?"*
> **💡 Trả lời:**
> *"Dạ, các mã toàn sàn công khai vốn không nằm trong bảng lưu riêng của khách. Do đó, hệ thống đã thiết kế thêm bảng **`customer_dismissed_vouchers` (Mã đã dọn dẹp)**. Khi bấm dọn dẹp, ID của voucher hết hạn sẽ được ghi vào bảng này để câu lệnh `SELECT` ở các lần sau tự động loại trừ ra, giúp kho voucher của khách luôn sạch sẽ và ngăn nắp."*

#### ❓ Câu 2.4: *"Làm sao hệ thống xử lý trường hợp khách hàng bấm nút giảm số lượng món về 0 trong giỏ hàng?"*
> **💡 Trả lời:**
> *"Dạ, khi khách bấm giảm số lượng từ 1 về 0, hệ thống hiển thị **Modal xác nhận xóa món khỏi giỏ hàng**. Nếu khách xác nhận, backend sẽ gọi API `DELETE /api/v1/cart/items/:id` để xóa hẳn dòng món đó ra khỏi giỏ hàng."*

#### ❓ Câu 2.5: *"Khi đổi mật khẩu trong trang Cài đặt, hệ thống có những bước kiểm tra bảo mật nào?"*
> **💡 Trả lời:**
> *"Dạ, hệ thống bắt buộc kiểm tra 3 yếu tố:
> 1. Nhập chính xác Mật khẩu hiện tại (so sánh hash bcrypt với DB).
> 2. Mật khẩu mới phải có độ dài tối thiểu 8 ký tự và khác mật khẩu cũ.
> 3. Nhập lại mật khẩu mới phải khớp 100%. Ngoài ra còn có tính năng 'Đăng xuất khỏi mọi thiết bị' để vô hiệu hóa toàn bộ session cũ khi nghi ngờ tài khoản bị xâm nhập."*

---

## 👤 NGƯỜI 3: PHÍ VẬN CHUYỂN, VOUCHER & THANH TOÁN VNPAY / COD

* **Phân công gợi ý:** **Trần Minh Được** (`Tokary2006`)
* **Các trang phụ trách review:**
  * Trang Checkout: `/app/checkout`
  * Thuật toán Tính Phí Vận chuyển (ORS + Haversine)
  * Động cơ Áp dụng & Tính toán Voucher
  * Cổng Thanh toán VNPay Sandbox & COD
  * Xử lý Phản hồi: `/app/checkout/vnpay/return`, `/app/order/success/:id`

---

### 🧠 Logic & Nghiệp vụ chuyên sâu cần nắm vững:
1. **Công thức Tính Phí Giao hàng Động (Shipping Quote Engine):**
   * Lấy tọa độ Quán `[lon1, lat1]` và Địa chỉ khách `[lon2, lat2]`.
   * **OpenRouteService API:** Lấy khoảng cách xe chạy thực tế $d_{\text{km}}$.
   * **Fallback Haversine:** $d = \text{Haversine} \times 1.3$.
   * Giới hạn bán kính phục vụ: $\le 12.0\text{ km}$.
   * Công thức cước phí: $\text{Phí ship} = \min(50.000\text{đ}, \; 15.000\text{đ} + \lceil d \rceil \times 5.000\text{đ})$.
2. **Động cơ Xác thực & Tính Voucher (Voucher Validation Engine):**
   * Kiểm tra đồng thời 4 điều kiện: Thời gian hiệu lực, Ngân sách tổng sàn/quán (`usage_limit`), Giới hạn tài khoản (`per_user_limit`), và Giá trị đơn tối thiểu (`min_order_amount`).
   * Giảm theo % có mức trần: $\text{Giảm} = \min(\text{max\_discount}, \; \text{round}(\text{Subtotal} \times \text{amount} / 100))$.
   * Phân định ngân sách: Sàn tài trợ (Quán nhận đủ tiền món) vs Quán tài trợ (Trừ vào doanh thu quán).
3. **Cổng Thanh toán VNPay & Chữ ký số HMAC-SHA512:**
   * Sắp xếp tham số theo alphabet (ASCII Sort), băm `HMAC-SHA512` với `HashSecret`.
   * Kiểm tra toàn vẹn dữ liệu: `vnp_Amount / 100 === order.total_amount`.
   * Xử lý mã phản hồi `vnp_ResponseCode === '00'` (Thành công).
4. **Hoàn tiền Tự động VNPay (Automated Refund API):**
   * Gửi gói tin Refund Type 02 kèm chữ ký số sang VNPay để hoàn tiền khi đơn hủy hợp lệ.

---

### 🎯 5 Câu hỏi Ban Giám Khảo CHẮC CHẮN SẼ HỎI & Câu trả lời chuẩn:

#### ❓ Câu 3.1: *"Nếu người dùng mở F12 chỉnh sửa số tiền thanh toán từ 500.000đ thành 1.000đ trên trình duyệt thì hệ thống xử lý thế nào?"*
> **💡 Trả lời:**
> *"Dạ thưa Thầy/Cô, Client hoàn toàn không có quyền quyết định số tiền thanh toán. Khi người dùng bấm Đặt hàng, Client chỉ gửi danh sách món và mã voucher lên. **Backend sẽ tự động truy vấn giá gốc từng món trong Database, tự tính lại phí ship theo tọa độ và tự áp voucher để ra số tiền cuối cùng `total_amount`**. Sau đó Backend mới băm số tiền này với Secret Key để gửi sang VNPay. Mọi hành vi sửa đổi trên Client đều vô nghĩa."*

#### ❓ Câu 3.2: *"Sau khi quét mã VNPay trừ tiền thành công, nếu khách hàng bị rớt mạng hoặc tắt trình duyệt thì đơn hàng có được xác nhận không?"*
> **💡 Trả lời:**
> *"Dạ, đơn hàng vẫn được xác nhận thành công 100% nhờ cơ chế **IPN (Instant Payment Notification) Webhook**. Máy chủ VNPay sẽ gọi độc lập một HTTP Request ngầm trực tiếp đến máy chủ backend NomNom (`/api/v1/checkout/vnpay/ipn`) để thông báo kết quả thanh toán kèm chữ ký số. Backend nhận được tín hiệu sẽ tự động cập nhật đơn hàng sang trạng thái `paid` và chuyển cho quán làm món."*

#### ❓ Câu 3.3: *"Hai khách hàng cùng áp dụng 1 voucher chỉ còn đúng 1 lượt duy nhất vào cùng 1 thời điểm, làm sao hệ thống không bị âm số lượng?"*
> **💡 Trả lời:**
> *"Dạ, Backend sử dụng **Database Transaction kết hợp Row Locking (`SELECT ... FOR UPDATE`)**. Khi một giao dịch đang kiểm tra và ghi nhận voucher vào bảng `voucher_redemptions`, giao dịch thứ hai bắt buộc phải chờ. Request đầu tiên chiếm được lượt dùng cuối cùng thì request thứ hai kiểm tra sẽ thấy số lượng đã hết và bị từ chối ngay lập tức."*

#### ❓ Câu 3.4: *"Tại sao khoảng cách đường chim bay lại phải nhân với hệ số 1.3?"*
> **💡 Trả lời:**
> *"Dạ, công thức Haversine tính khoảng cách theo đường thẳng chim bay xuyên qua chướng ngại vật. Trong thực tế đô thị Việt Nam, đường phố có nhiều khúc cua, ngã tư và vòng xuyến. Theo các nghiên cứu chuẩn ngành giao vận, **hệ số uốn lượn $1.3$ (Road Curvature Factor)** phản ánh chính xác 90-95% quãng đường thực tế mà tài xế phải di chuyển khi không có kết nối tới Routing Server."*

#### ❓ Câu 3.5: *"Khi đơn hàng thanh toán online bị hủy, quy trình hoàn tiền diễn ra như thế nào?"*
> **💡 Trả lời:**
> *"Dạ, khi đơn hàng thỏa mãn điều kiện hủy (ví dụ: quán chưa tiếp nhận đơn), Backend sẽ tự động gọi **API Hoàn tiền (VNPay Refund API)** với loại giao dịch `02` (Hoàn toàn phần). Gói tin hoàn tiền được ký số HMAC-SHA512 gửi sang VNPay để hoàn tiền trực tiếp về tài khoản ngân hàng của khách, đồng thời chuyển trạng thái đơn sang `payment_status = 'refunded'`."*

---

## 👤 NGƯỜI 4: THEO DÕI ĐƠN REALTIME, CHAT 1-1 & ĐÁNH GIÁ

* **Phân công gợi ý:** **Hồ Minh Nhật**
* **Các trang phụ trách review:**
  * Lịch sử đơn hàng: `/app/orders` (5 tab bộ lọc, nút Thanh toán ngay)
  * Theo dõi hành trình đơn: `/app/track/:id` (Stepper tiến trình thời gian thực)
  * Kênh chat trực tiếp: `/chat/:id`, `ChatWidget`
  * Đánh giá chất lượng: `/app/reviews/write/:id`, `/app/reviews/:id`

---

### 🧠 Logic & Nghiệp vụ chuyên sâu cần nắm vững:
1. **Máy trạng thái Đơn hàng (State Machine):**
   * Luồng 12 trạng thái: `pending_payment` $\rightarrow$ `placed` $\rightarrow$ `accepted` $\rightarrow$ `preparing` $\rightarrow$ `ready_for_pickup` $\rightarrow$ `picked_up` $\rightarrow$ `delivering` $\rightarrow$ `delivered` (hoặc `cancelled`, `expired`, `failed`).
   * **Phân loại 5 Tab bộ lọc (`/app/orders`):** `Tất cả`, `Chờ thanh toán` (kèm nút *Thanh toán ngay*), `Đang giao`, `Đã giao`, `Đã hủy`.
2. **Quy tắc Hủy đơn & Quyền lực các bên:**
   * **Khách hàng:** Chỉ được hủy khi đơn ở `pending_payment`, `payment_failed`, hoặc `placed` (quán chưa nhận).
   * **Khóa nút hủy của khách:** Khi đơn đã sang `accepted`, `preparing`, `delivering` để bảo vệ chi phí nấu nướng của quán.
   * **Tự động hoàn trả:** Khi đơn hủy hợp lệ $\rightarrow$ Hoàn tiền VNPay + Hoàn lại 100% lượt dùng voucher (`status = 'released'`).
3. **Kênh Chat 1-1 Khách hàng - Quán ăn (`/chat/:id`):**
   * Phòng chat được cô lập theo `order_id`. Chỉ Khách hàng sở hữu đơn và Quán nhận đơn mới có quyền truy cập (xác thực token 2 chiều).
   * Hỗ trợ trao đổi ghi chú món ăn tức thời.
4. **Hệ thống Đánh giá 2 tầng (Verified Purchase Reviews):**
   * **Chỉ đánh giá khi `delivered`:** Ngăn chặn tuyệt đối việc đánh giá ảo.
   * Đánh giá Quán (1-5 sao + bình luận + ảnh) & Đánh giá từng món ăn riêng lẻ trong đơn.

---

### 🎯 5 Câu hỏi Ban Giám Khảo CHẮC CHẮN SẼ HỎI & Câu trả lời chuẩn:

#### ❓ Câu 4.1: *"Tại sao khách hàng không thể tự hủy đơn hàng khi quán đang nấu (`preparing`)?"*
> **💡 Trả lời:**
> *"Dạ thưa Thầy/Cô, đây là quy tắc nghiệp vụ sống còn của sàn giao đồ ăn. Khi đơn chuyển sang `preparing`, quán đã lấy thực phẩm tươi sống ra nấu nướng. Nếu cho khách tự ý hủy, quán sẽ mất trắng tiền nguyên liệu và công làm. Vì vậy hệ thống tự động ẩn nút Hủy của khách từ trạng thái `accepted` trở đi. Nếu có sự cố bất khả kháng, bắt buộc phải qua sự đồng ý của Quán hoặc Admin can thiệp."*

#### ❓ Câu 4.2: *"Hệ thống làm thế nào để đảm bảo người lạ không thể đọc trộm tin nhắn trong phòng chat giữa khách và quán?"*
> **💡 Trả lời:**
> *"Dạ, mỗi khi có request lấy tin nhắn hoặc gửi tin nhắn vào `/api/v1/chat/:orderId`, Backend đều chạy middleware kiểm tra quyền sở hữu: **Người gửi request bắt buộc phải là `customer_id` của đơn hàng đó HOẶC là `merchant_id` của quán nhận đơn đó**. Nếu là người dùng khác, hệ thống sẽ trả về lỗi `403 Forbidden` ngay lập tức."*

#### ❓ Câu 4.3: *"Làm sao hệ thống ngăn chặn tình trạng quán ăn tự tạo tài khoản ảo để tự đánh giá 5 sao cho chính mình?"*
> **💡 Trả lời:**
> *"Dạ, NomNom có 3 lớp bảo vệ:
> 1. Chỉ tài khoản có đơn hàng hoàn tất `delivered` thực tế mới được đánh giá.
> 2. Mỗi đơn hàng chỉ được gửi đánh giá 1 lần duy nhất.
> 3. Hệ thống thu phí hoa hồng trên mỗi đơn hàng thành công, nên việc quán tự tạo đơn ảo để tự đánh giá sẽ khiến quán phải chịu mất phí sàn, triệt tiêu động cơ gian lận."*

#### ❓ Câu 4.4: *"Nếu khách hàng đặt đơn VNPay nhưng không quét mã thanh toán thì đơn hàng có bị treo vĩnh viễn không?"*
> **💡 Trả lời:**
> *"Dạ không ạ. Hệ thống có tiến trình chạy ngầm **`expiry.worker.js`**. Cứ mỗi phút, worker sẽ quét các đơn hàng `pending_payment` quá 30 phút để tự động chuyển sang `expired`, đồng thời giải phóng voucher và tồn kho món ăn trả lại cho hệ thống."*

#### ❓ Câu 4.5: *"Khi đơn hàng bị hủy, số sao đánh giá cũ của quán có bị ảnh hưởng không?"*
> **💡 Trả lời:**
> *"Dạ, đơn hàng bị hủy (`cancelled`) không thể thực hiện đánh giá. Điểm sao trung bình của quán chỉ được tính toán dựa trên các đánh giá của các đơn hàng đã giao thành công (`delivered`), đảm bảo phản ánh đúng trải nghiệm chất lượng ẩm thực thực tế."*

---

## 👤 NGƯỜI 5: VẬN HÀNH TOÀN DIỆN ĐỐI TÁC QUÁN ĂN (MERCHANT)

* **Phân công gợi ý:** **Nguyễn Văn Dĩ Khang** *(hoặc Hồ Minh Nhật)*
* **Các trang phụ trách review:**
  * Đăng ký đối tác: `/merchant/onboarding`, `/merchant/pending`
  * Tổng quan: `/merchant` (Dashboard doanh thu, món bán chạy)
  * Quản lý thực đơn: `/merchant/menu` (Thêm/sửa món, danh mục, bật/tắt món)
  * Bảng điều khiển đơn hàng: `/merchant/orders` (Kanban xử lý đơn)
  * Khuyến mãi & Đánh giá: `/merchant/promotions`, `/merchant/reviews`
  * Cài đặt & Ví tài chính: `/merchant/settings`, `/merchant/wallet`

---

### 🧠 Logic & Nghiệp vụ chuyên sâu cần nắm vững:
1. **Quy trình Đăng ký & Xét duyệt Đối tác Quán ăn (Merchant Onboarding):**
   * Chủ quán điền thông tin, địa chỉ, định vị tọa độ GPS, tải ảnh giấy phép/mặt tiền quán lên Cloudinary, nhập số tài khoản ngân hàng nhận tiền.
   * Hồ sơ chuyển sang trạng thái `pending` chờ Admin thẩm định.
2. **Quy trình Bếp trên Bảng Kanban (`/merchant/orders`):**
   * Quán nhận đơn mới (`placed`) $\rightarrow$ Bấm Nhận (`accepted`) $\rightarrow$ Bấm Nấu (`preparing`) $\rightarrow$ Báo Nấu xong (`ready_for_pickup`) $\rightarrow$ Bàn giao Shipper (`delivering`) $\rightarrow$ Giao thành công (`delivered`).
   * Nếu hết món, quán có quyền bấm **Từ chối / Hủy đơn** (Hệ thống tự động kích hoạt hoàn tiền VNPay cho khách).
3. **Quản lý Thực đơn & Bật/Tắt Hết hàng Tức thì:**
   * Quán có thể chuyển đổi công tắc `is_available` để báo món tạm hết trong ngày mà không cần xóa món.
4. **Ví Tài chính & Cơ chế Rút tiền (Merchant Wallet & Payouts):**
   * **Doanh thu ròng:** $\text{Doanh thu thuần} = \text{Tiền món} - (\text{Tiền món} \times \text{Commission Rate})$.
   * **Quy tắc rút tiền an toàn:** Rút tối thiểu $50.000\text{đ}$, số nguyên dương.
   * **Khóa số dư (`locked_balance`):** Khi lệnh rút đang chờ duyệt, số tiền rút bị khóa tạm thời để ngăn lỗi rút tiền 2 lần (Double Spending).

---

### 🎯 5 Câu hỏi Ban Giám Khảo CHẮC CHẮN SẼ HỎI & Câu trả lời chuẩn:

#### ❓ Câu 5.1: *"Khi nào tiền bán hàng thực sự được cộng vào ví của chủ quán ăn?"*
> **💡 Trả lời:**
> *"Dạ thưa Thầy/Cô, tiền chỉ được cộng vào ví của quán **ngay khi đơn hàng chuyển sang trạng thái `delivered` (Giao hàng thành công)**. Số tiền cộng vào là Doanh thu ròng đã được khấu trừ tỷ lệ hoa hồng sàn (`merchantBillableSubtotal - platform_commission`). Nếu đơn hàng chưa hoàn tất hoặc bị hủy, tiền không bao giờ được cộng vào ví quán để đảm bảo an toàn tài chính."*

#### ❓ Câu 5.2: *"Làm thế nào để hệ thống ngăn chặn việc chủ quán bấm rút tiền liên tục để rút vượt quá số dư hiện có?"*
> **💡 Trả lời:**
> *"Dạ, hệ thống áp dụng cơ chế **`locked_balance` (Số dư bị khóa)**. Khi quán tạo yêu cầu rút 2 triệu đồng từ số dư 3 triệu, hệ thống sẽ tăng `locked_balance` lên 2 triệu, số dư khả dụng còn lại chỉ là $3 - 2 = 1\text{ triệu đồng}$. Nếu quán cố tình gửi thêm 1 lệnh rút 2 triệu nữa, hệ thống kiểm tra `1 triệu < 2 triệu` và từ chối lệnh rút ngay lập tức."*

#### ❓ Câu 5.3: *"Tại sao khi quán ăn muốn thay đổi địa chỉ kinh doanh thì phải gửi yêu cầu chờ Admin duyệt mà không được tự ý đổi ngay?"*
> **💡 Trả lời:**
> *"Dạ thưa Thầy/Cô, địa chỉ quán ăn gắn liền với **tọa độ địa lý GPS để tính phí ship và bán kính phục vụ 12km**. Nếu cho quán tự do đổi địa chỉ mà không kiểm duyệt, quán có thể dời địa điểm sang vị trí quá xa khiến việc tính phí giao hàng bị sai lệch hoặc vi phạm thỏa thuận kinh doanh ban đầu."*

#### ❓ Câu 5.4: *"Nếu quán ăn tạo mã khuyến mãi giảm 50% cho khách thì chi phí giảm giá đó do ai chi trả?"*
> **💡 Trả lời:**
> *"Dạ, mã khuyến mãi do quán tự tạo trong trang `/merchant/promotions` là chương trình riêng của quán để hút khách, do đó **quán ăn tự chi trả 100% khoản giảm giá này**. Doanh thu tính phí của quán sẽ là `Tiền món - Tiền voucher quán`."*

#### ❓ Câu 5.5: *"Khi quán ăn nhận được đơn hàng nhưng bất ngờ bị hết gas hoặc mất điện không nấu được thì xử lý thế nào?"*
> **💡 Trả lời:**
> *"Dạ, chủ quán có thể bấm nút **'Từ chối đơn / Hủy đơn'** ngay trên bảng Kanban và chọn lý do. Hệ thống sẽ ngay lập tức gửi thông báo hủy cho khách, tự động hoàn 100% tiền online qua VNPay cho khách và hoàn lại lượt dùng voucher về ví của khách."*

---

## 👤 NGƯỜI 6: QUẢN TRỊ SÀN, ĐỐI SOÁT TÀI CHÍNH & HẠ TẦNG (ADMIN)

* **Phân công gợi ý:** **Nguyễn Công Ben** *(Trưởng nhóm)*
* **Các trang phụ trách review:**
  * Tổng quan KPI sàn: `/admin` (GMV, Doanh thu hoa hồng, Tăng trưởng)
  * Kiểm duyệt đối tác: `/admin/restaurants` (Duyệt quán mới & duyệt đổi địa chỉ)
  * Quản lý tài khoản: `/admin/accounts` (Phân quyền, khóa/mở khóa)
  * Giám sát đơn & Đánh giá: `/admin/orders`, `/admin/reviews`
  * Đối soát tài chính: `/admin/financial`, `/admin/payouts`
  * Cấu hình hệ thống: `/admin/cuisines`, `/admin/customer-home`, `/admin/config`
  * Nhật ký kiểm toán & Hạ tầng: `/admin/audit-logs`, Báo cáo Deploy Vercel & Railway

---

### 🧠 Logic & Nghiệp vụ chuyên sâu cần nắm vững:
1. **Chỉ số KPI & Dòng tiền Toàn Sàn (Financial Dashboard):**
   * **GMV (Gross Merchandise Value):** Tổng giá trị hàng hóa giao dịch trên toàn sàn.
   * **Doanh thu thực của Sàn NomNom:** $\text{Doanh thu Sàn} = \sum \text{Hoa hồng sàn (Commission)} + \sum \text{Phí giao hàng (Delivery Fee)}$.
2. **Quy trình Thẩm định & Phê duyệt Lệnh Rút tiền (Payout Processing):**
   * Admin xem danh sách yêu cầu rút tiền $\rightarrow$ Kiểm tra thông tin tài khoản ngân hàng (được Mask an toàn `****1234`).
   * Thực hiện chuyển khoản ngân hàng $\rightarrow$ Bấm **"Duyệt lệnh rút tiền"** $\rightarrow$ Hệ thống trừ vĩnh viễn số dư trong ví quán và giải phóng `locked_balance`.
   * Nếu phát hiện gian lận $\rightarrow$ Bấm **"Từ chối"** $\rightarrow$ Số tiền bị khóa được hoàn trả lại về ví quán.
3. **Cấu hình Động Tham số Toàn sàn (`/admin/config`):**
   * Cho phép chỉnh sửa Tỷ lệ hoa hồng mặc định `default_commission_rate` (0 - 50%), Bán kính giao hàng tối đa (km), Cước phí cơ bản.
4. **Nhật ký Kiểm toán Bất biến (`audit_logs`):**
   * Mọi hành động của Admin (Duyệt quán, Khóa tài khoản, Hủy đơn, Duyệt tiền) đều được lưu vết chi tiết: `admin_id`, `action`, `target_id`, `details`, `ip_address`, `timestamp`.
5. **Hạ tầng Triển khai Thực tế (Production Architecture):**
   * **Frontend:** React SPA deploy trên **Vercel** (CDN toàn cầu, tốc độ tải dưới 1s).
   * **Backend:** Node.js Express API deploy trên **Railway** kết nối **MySQL Database Cloud** và chạy nền **Cron Expiry Worker**.

---

### 🎯 5 Câu hỏi Ban Giám Khảo CHẮC CHẮN SẼ HỎI & Câu trả lời chuẩn:

#### ❓ Câu 6.1: *"Làm thế nào để Admin phát hiện và ngăn chặn hành vi gian lận tài chính trong nội bộ?"*
> **💡 Trả lời:**
> *"Dạ thưa Thầy/Cô, hệ thống có bảng **`audit_logs` (Nhật ký kiểm toán)** hoạt động theo nguyên tắc ghi nhận bất biến. Bất kỳ Admin nào thực hiện duyệt rút tiền, thay đổi tỷ lệ hoa hồng hay hủy đơn đều bị ghi lại danh tính, địa chỉ IP và dấu thời gian chính xác. Không một Admin nào có quyền xóa hoặc sửa đổi các dòng nhật ký này."*

#### ❓ Câu 6.2: *"Nếu Admin khóa tài khoản của một quán ăn đang vi phạm thì các đơn hàng đang giao của quán đó được xử lý ra sao?"*
> **💡 Trả lời:**
> *"Dạ, hệ thống áp dụng cơ chế xử lý thông minh:
> 1. Ngay lập tức ẩn quán khỏi trang tìm kiếm để không nhận thêm đơn mới.
> 2. Các đơn hàng đang thực hiện dở dang (`delivering`, `preparing`) vẫn được giữ nguyên để shipper giao xong cho khách nhằm bảo vệ quyền lợi người mua.
> 3. Tiền thanh toán của quán bị giữ lại trong ví, quán không thể tạo lệnh rút tiền cho đến khi Admin mở khóa."*

#### ❓ Câu 6.3: *"Tại sao hệ thống lại che giấu (Masking) số tài khoản ngân hàng của quán ăn trên giao diện Admin?"*
> **💡 Trả lời:**
> *"Dạ, theo chuẩn an toàn bảo mật thông tin tài chính (PCI-DSS), việc hiển thị toàn bộ số tài khoản ngân hàng có thể dẫn đến nguy cơ lộ dữ liệu nhạy cảm nếu nhân viên trực màn hình bị nhìn trộm. Hệ thống chỉ hiển thị 4 chữ số cuối (ví dụ `****5678`) để đối soát cơ bản, đảm bảo tính riêng tư cho đối tác."*

#### ❓ Câu 6.4: *"Hạ tầng của nhóm xử lý thế nào nếu lượng người truy cập tăng đột biến vào giờ cao điểm ăn trưa?"*
> **💡 Trả lời:**
> *"Dạ, hệ thống được thiết kế theo mô hình **Tách biệt Stateless Architecture**:
> * Frontend SPA được phân phối qua mạng lưới CDN của Vercel giúp chịu tải hàng chục nghìn lượt truy cập đồng thời mà không tốn tài nguyên server.
> * Backend Express được tối ưu hóa Connection Pool MySQL và phân trang dữ liệu ở Server, giúp xử lý các truy vấn đặt hàng với độ trễ cực thấp (dưới 50ms)."*

#### ❓ Câu 6.5: *"Điểm nổi bật nhất về mặt kỹ thuật và nghiệp vụ của NomNom so với các đồ án thông thường là gì?"*
> **💡 Trả lời:**
> *"Dạ thưa Thầy/Cô, NomNom không dừng lại ở mức giao diện CRUD đơn giản mà đã giải quyết trọn vẹn **toàn bộ bài toán vận hành thực tế của một sàn thương mại điện tử F&B**:
> 1. Tính phí ship động theo bản đồ thực tế và giới hạn bán kính bảo vệ đồ ăn.
> 2. Tích hợp thanh toán online VNPay có chữ ký số HMAC-SHA512 và API hoàn tiền tự động.
> 3. Vòng đời voucher khép kín và phân định dòng tiền tài trợ giữa Sàn và Quán.
> 4. Quản lý ví doanh thu ròng, hoa hồng sàn và cơ chế khóa số dư chống rút tiền 2 lần."*

---

## ⚡ BẢNG TỔNG HỢP "HỎI CHÉO CỨU BỒ" (QUICK CHEAT SHEET)

*Khi Ban Giám Khảo hỏi bất ngờ vào phần của bạn khác, hãy nhớ các từ khóa cốt lõi này để tự tin trả lời:*

| Chủ đề | Từ khóa cốt lõi & Câu trả lời siêu ngắn |
| :--- | :--- |
| **Bảo mật Auth (Người 1)** | JWT HttpOnly Cookie chống XSS, mật khẩu băm bcrypt 10 rounds, OTP email 10 phút. |
| **Giỏ hàng & Địa chỉ (Người 2)** | Giỏ hàng lưu Database đồng bộ đa thiết bị, chỉ đặt được 1 quán/đơn, địa chỉ lưu tọa độ GPS WGS84. |
| **Phí ship & Voucher (Người 3)** | Định tuyến OpenRouteService API + Haversine x1.3, Bán kính max 12km, voucher 4 cấp bảo vệ, voucher sàn bù vs quán tự chịu. |
| **VNPay & Hoàn tiền (Người 3)** | Ký số HMAC-SHA512 ASCII sort, Webhook IPN chống rớt mạng, tự động gọi VNPay Refund API Type 02 khi hủy đơn. |
| **Hủy đơn & State Machine (Người 4)** | 12 trạng thái, khóa nút hủy khi quán đang nấu (`preparing`) để bảo vệ thực phẩm, hủy đơn hợp lệ hoàn 100% tiền + hoàn lượt voucher. |
| **Ví Quán & Rút tiền (Người 5)** | Doanh thu ròng = Tiền món - Phí hoa hồng sàn, cộng tiền ví khi `delivered`, khóa số dư `locked_balance` chống rút 2 lần. |
| **Quản trị & Hạ tầng (Người 6)** | Audit Logs bất biến, che số tài khoản `****1234`, deploy Frontend Vercel + Backend Railway + Worker tự hủy đơn 30 phút. |

---

> 🏆 **CHÚC NHÓM TỰ TIN THUYẾT TRÌNH XUẤT SẮC VÀ ĐẠT ĐIỂM TỐI ĐA!** 🚀
