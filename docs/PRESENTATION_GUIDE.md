# 🍽️ KỊCH BẢN BÁO CÁO DỰ ÁN NOMNOM (DEMO WALKTHROUGH GUIDE)

> **Mục tiêu:** Bản hướng dẫn này phân chia toàn bộ **100% các trang và tính năng** của nền tảng NomNom cho **6 thành viên**, đảm bảo khối lượng đồng đều và luồng trình bày diễn ra tự nhiên như một kịch bản trải nghiệm người dùng thực tế (End-to-End User Journey).

---

## 🧭 TỔNG QUAN LUỒNG BÁO CÁO 6 BƯỚC

```
[1. Khám phá & Xác thực] ➔ [2. Tài khoản & Giỏ hàng] ➔ [3. Phí Ship & Thanh toán] ➔ [4. Theo dõi, Chat & Đánh giá] ➔ [5. Vận hành Quán ăn] ➔ [6. Quản trị & Đối soát Admin]
```

---

## 👤 NGƯỜI 1: LANDING PAGE, XÁC THỰC & KHÁM PHÁ QUÁN ĂN

* **Phân công gợi ý:** **Ong Tuấn Nghĩa** *(hoặc Nguyễn Văn Dĩ Khang)*
* **Thời lượng dự kiến:** 3.5 – 4 phút
* **Mục tiêu:** Giới thiệu nền tảng, cơ chế bảo mật xác thực tài khoản và trải nghiệm tìm kiếm, lựa chọn món ăn của khách hàng.

### Các trang phụ trách review:
1. **Trang giới thiệu & Điều khoản:**
   - `/` — **Landing Page**: Banner giới thiệu, CTA dẫn vào app, giới thiệu các tính năng cốt lõi.
   - `/faq` — **Partner FAQ**: Câu hỏi thường gặp dành cho đối tác.
   - `/terms-of-service` & `/privacy-policy` — Điều khoản sử dụng và chính sách bảo mật.
2. **Hệ thống Xác thực & Quên mật khẩu (Auth Flow):**
   - `/login` — Đăng nhập bằng Email/Password, điều hướng theo vai trò (Customer / Merchant / Admin).
   - `/register` — Đăng ký tài khoản mới kèm gửi mã xác thực.
   - `/forgot-password`, `/verify-otp`, `/reset-password` — Luồng khôi phục mật khẩu bảo mật qua Email OTP.
3. **Khám phá Trang chủ Khách hàng:**
   - `/app` — **Customer Home**: Banner khuyến mãi động, Danh mục ẩm thực (Cuisines), Danh sách quán ăn gần bạn, Món ăn thịnh hành (Trending).
4. **Tìm kiếm & Thực đơn quán:**
   - `/app/search` — **Tìm kiếm & Bộ lọc nâng cao**: Tìm theo tên món/quán, lọc theo khoảng giá, đánh giá sao, loại ẩm thực.
   - `/app/restaurant/:id` — **Chi tiết quán ăn**: Thông tin quán, thời gian hoạt động, thực đơn phân loại theo danh mục.
   - `/app/dish/:id` & `/app/dish/:id/reviews` — **Chi tiết món ăn & Đánh giá riêng của món**.

🎙️ **Lời thoại chuyển giao (Transition):**
> *"Sau khi khách hàng đã tìm kiếm và lựa chọn được các món ăn ưng ý từ quán, xin mời bạn **[Tên Người 2]** tiếp tục trình bày về phân hệ quản lý tài khoản, sổ địa chỉ nhận hàng và thao tác đưa món vào giỏ hàng."*

---

## 👤 NGƯỜI 2: HỒ SƠ KHÁCH HÀNG, SỔ ĐỊA CHỈ & GIỎ HÀNG

* **Phân công gợi ý:** **Nguyễn Thị Như Ngọc** (`ngoc-2912`)
* **Thời lượng dự kiến:** 3.5 – 4 phút
* **Mục tiêu:** Quản lý thông tin cá nhân khách hàng, thiết lập địa chỉ nhận hàng và cơ chế giỏ hàng đồng bộ cơ sở dữ liệu.

### Các trang phụ trách review:
1. **Quản lý Hồ sơ Khách hàng:**
   - `/app/profile` — **Trung tâm cá nhân**: Xem thông tin tổng quan, vai trò hiện tại, lối tắt quản lý.
   - `/app/profile/edit` — **Chỉnh sửa hồ sơ**: Thay đổi họ tên, số điện thoại, tải ảnh đại diện lên Cloudinary.
   - `/app/profile/settings` — **Cài đặt tài khoản**: Đổi mật khẩu, cài đặt bảo mật và thông báo.
2. **Sổ địa chỉ Giao hàng:**
   - `/app/profile/addresses` — **Quản lý sổ địa chỉ**: Thêm địa chỉ mới, chỉnh sửa/xóa địa chỉ, gắn nhãn (Nhà riêng / Công ty), tính năng tự động nhận diện tọa độ định vị vị trí, chọn địa chỉ mặc định.
3. **Kho khuyến mãi cá nhân & Thông báo:**
   - `/app/profile/promotions` — **Kho voucher**: Xem các voucher đang sở hữu và điều kiện áp dụng.
   - `/app/notifications` — **Trung tâm thông báo**: Danh sách thông báo cập nhật đơn hàng và khuyến mãi.
4. **Vận hành Giỏ hàng:**
   - `CartDrawer` (Ngăn kéo giỏ hàng) — Thêm món ăn vào giỏ, tùy chỉnh tăng/giảm số lượng, thêm ghi chú cho món ăn, cơ chế cảnh báo khi thêm món từ quán khác, chứng minh giỏ hàng được lưu đồng bộ trong Database (reload trang không bị mất).

🎙️ **Lời thoại chuyển giao (Transition):**
> *"Khi giỏ hàng và địa chỉ nhận hàng đã được xác định, xin mời bạn **[Tên Người 3]** tiếp tục hướng dẫn quy trình tính phí vận chuyển theo khoảng cách thực tế, áp mã giảm giá và thanh toán trực tuyến qua cổng VNPay."*

---

## 👤 NGƯỜI 3: PHÍ VẬN CHUYỂN, VOUCHER & THANH TOÁN VNPAY / COD

* **Phân công gợi ý:** **Trần Minh Được** (`Tokary2006`)
* **Thời lượng dự kiến:** 3.5 – 4 phút
* **Mục tiêu:** Trình bày quy trình Checkout toàn diện, cơ chế tính phí ship động theo bản đồ thực tế và tích hợp cổng thanh toán trực tuyến.

### Các trang phụ trách review:
1. **Trang Checkout Đặt hàng:**
   - `/app/checkout` — **Xác nhận đặt hàng**: Kiểm tra danh sách món, người nhận, số điện thoại, ghi chú giao hàng.
2. **Tính phí Vận chuyển Động (OpenRouteService API):**
   - Giải thuật và giao diện tính khoảng cách thực tế (km) từ tọa độ Quán ăn đến Địa chỉ nhận hàng của khách.
   - Tự động tính toán mức phí vận chuyển dựa trên cấu hình cước phí sàn.
3. **Áp dụng Mã giảm giá (Voucher Management):**
   - Modal chọn voucher khả dụng (giảm theo %, giảm số tiền cố định).
   - Kiểm tra điều kiện đơn tối thiểu, mức giảm tối đa và cập nhật tổng tiền thanh toán ngay lập tức.
4. **Cổng Thanh toán Trực tuyến:**
   - Lựa chọn phương thức thanh toán: **COD** (Tiền mặt khi nhận) hoặc **VNPay Sandbox**.
   - Demo luồng redirect sang cổng VNPay $\rightarrow$ quét mã / nhập thông tin thẻ test $\rightarrow$ xử lý chữ ký bảo mật Hash Checksum.
5. **Xử lý Kết quả & Hoàn tất Đơn:**
   - `/app/checkout/vnpay/return` — Trang xử lý phản hồi từ VNPay (Success/Failed).
   - `/app/order/success/:id` — **Trang đặt hàng thành công**: Mã đơn hàng, tóm tắt thanh toán và nút chuyển sang theo dõi đơn.

🎙️ **Lời thoại chuyển giao (Transition):**
> *"Đơn hàng đã được khởi tạo và thanh toán thành công vào hệ thống. Tiếp theo, bạn **[Tên Người 4]** sẽ demo tính năng theo dõi tiến trình đơn hàng thời gian thực, kênh chat trực tiếp với quán và tính năng đánh giá sau khi nhận món."*

---

## 👤 NGƯỜI 4: THEO DÕI ĐƠN REALTIME, CHAT 1-1 & ĐÁNH GIÁ

* **Phân công gợi ý:** **Hồ Minh Nhật**
* **Thời lượng dự kiến:** 3.5 – 4 phút
* **Mục tiêu:** Trải nghiệm sau khi đặt hàng, vòng đời trạng thái đơn, kênh liên lạc tức thời và hệ thống đánh giá chất lượng.

### Các trang phụ trách review:
1. **Lịch sử & Quản lý Đơn hàng:**
   - `/app/orders` — **Danh sách đơn hàng của tôi**: Lọc theo trạng thái (Tất cả / Đang xử lý / Hoàn tất / Đã hủy), xem chi tiết đơn cũ.
2. **Theo dõi Đơn hàng Thời gian thực (Realtime Tracking):**
   - `/app/track/:id` — **Theo dõi hành trình đơn**: Stepper tiến trình trực quan (Chờ thanh toán $\rightarrow$ Đã đặt $\rightarrow$ Quán nhận $\rightarrow$ Đang nấu $\rightarrow$ Sẵn sàng giao $\rightarrow$ Đang giao $\rightarrow$ Đã giao).
   - Hiển thị thông tin tài xế/quán ăn, dự kiến thời gian giao và chi tiết đơn hàng.
3. **Hệ thống Nhắn tin Chat 1-1:**
   - `/chat/:id` & `ChatWidget` — **Kênh chat trực tiếp giữa Khách hàng và Quán ăn**: Nhắn tin trao đổi về yêu cầu món ăn, thời gian nhận hàng, lưu trữ lịch sử tin nhắn.
4. **Đánh giá & Phản hồi (Reviews & Rating):**
   - `/app/reviews/write/:id` — **Viết đánh giá đơn hàng**: Đánh giá số sao cho quán, đánh giá riêng từng món ăn kèm nhận xét chi tiết.
   - `/app/reviews/:id` — **Trang tổng hợp đánh giá của quán**: Xem điểm sao trung bình, biểu đồ phân bố sao và các bình luận từ cộng đồng.

🎙️ **Lời thoại chuyển giao (Transition):**
> *"Chúng ta đã đi trọn vẹn hành trình của một Khách hàng. Bây giờ, xin mời bạn **[Tên Người 5]** chuyển sang góc nhìn của Đối tác Quán ăn (Merchant) để xem cách họ tiếp nhận đơn, chuẩn bị món và quản lý doanh thu."*

---

## 👤 NGƯỜI 5: VẬN HÀNH TOÀN DIỆN ĐỐI TÁC QUÁN ĂN (MERCHANT)

* **Phân công gợi ý:** **Nguyễn Văn Dĩ Khang** *(hoặc Hồ Minh Nhật)*
* **Thời lượng dự kiến:** 3.5 – 4 phút
* **Mục tiêu:** Giới thiệu luồng đăng ký đối tác, quản lý thực đơn món ăn, quy trình xử lý đơn hàng trên Kanban và ví tài chính của quán.

### Các trang phụ trách review:
1. **Đăng ký Đối tác & Chờ duyệt:**
   - `/merchant/onboarding` — **Đăng ký mở quán**: Điền thông tin nhà hàng, địa chỉ kinh doanh, tải ảnh giấy phép/mặt tiền, thông tin tài khoản ngân hàng nhận tiền.
   - `/merchant/pending` — **Trang chờ duyệt**: Hiển thị trạng thái hồ sơ đang được Admin thẩm định.
2. **Tổng quan Vận hành Quán:**
   - `/merchant` — **Merchant Dashboard**: Thống kê doanh thu trong ngày, số lượng đơn hàng, món bán chạy, biểu đồ hiệu suất.
3. **Quản lý Thực đơn (Menu Management):**
   - `/merchant/menu` — Quản lý danh mục món ăn, thêm món mới (tên, giá, mô tả, tải ảnh Cloudinary), chuyển đổi trạng thái Bật/Tắt món (hết hàng/còn hàng).
4. **Xử lý Đơn hàng (Order Kanban Flow):**
   - `/merchant/orders` — Giao diện bảng Kanban xử lý đơn hàng theo thời gian thực: Nhận đơn mới $\rightarrow$ Chấp nhận/Từ chối $\rightarrow$ Đang nấu $\rightarrow$ Báo sẵn sàng giao $\rightarrow$ Bàn giao giao hàng.
5. **Khuyến mãi, Đánh giá & Cài đặt:**
   - `/merchant/promotions` — Tạo và quản lý mã khuyến mãi riêng cho quán.
   - `/merchant/reviews` — Theo dõi các đánh giá của thực khách và gửi phản hồi.
   - `/merchant/settings` — Cài đặt giờ mở/đóng cửa, cập nhật thông tin quán, gửi yêu cầu thay đổi địa chỉ quán lên Admin.
   - `/merchant/notifications` — Trung tâm thông báo đơn hàng và hệ thống cho chủ quán.
6. **Ví Tài chính & Rút tiền:**
   - `/merchant/wallet` — **Ví doanh thu**: Xem số dư khả dụng, doanh thu thuần (đã khấu trừ phí sàn), lịch sử giao dịch và tạo lệnh rút tiền về tài khoản ngân hàng đã liên kết.

🎙️ **Lời thoại chuyển giao (Transition):**
> *"Để toàn bộ hệ thống vận hành minh bạch, an toàn và dòng tiền đối tác được đối soát chuẩn xác, xin mời bạn **[Tên Người 6]** trình bày phân hệ Quản trị viên Tối cao (Admin Module) và tổng kết hạ tầng dự án."*

---

## 👤 NGƯỜI 6: QUẢN TRỊ VIÊN HỆ THỐNG, ĐỐI SOÁT & HẠ TẦNG (ADMIN)

* **Phân công gợi ý:** **Nguyễn Công Ben** *(Trưởng nhóm)*
* **Thời lượng dự kiến:** 4 phút
* **Mục tiêu:** Quản trị toàn diện sàn thương mại điện tử, kiểm duyệt đối tác, đối soát tài chính, cấu hình hệ thống, nhật ký kiểm toán và báo cáo triển khai.

### Các trang phụ trách review:
1. **Tổng quan Sàn Thương Mại:**
   - `/admin` — **Admin Overview Dashboard**: Các chỉ số KPI tổng thể (Tổng doanh thu sàn GMV, hoa hồng thực thu, số lượng đơn hoàn tất, tăng trưởng người dùng).
2. **Kiểm duyệt Đối tác & Yêu cầu:**
   - `/admin/restaurants` — **Duyệt nhà hàng & Địa chỉ**: Xem hồ sơ đăng ký quán mới (duyệt/từ chối kèm lý do), thẩm định và duyệt các yêu cầu thay đổi địa chỉ quán ăn.
3. **Quản lý Tài khoản & Phân quyền:**
   - `/admin/accounts` — Xem danh sách toàn bộ người dùng, lọc theo vai trò (Customer / Merchant / Admin), thực hiện khóa tạm thời hoặc mở khóa tài khoản vi phạm.
4. **Giám sát Đơn hàng & Kiểm duyệt Đánh giá:**
   - `/admin/orders` — Tra cứu toàn bộ đơn hàng trên toàn hệ thống, can thiệp hủy đơn khẩn cấp nếu có sự cố.
   - `/admin/reviews` — Kiểm duyệt các bình luận, xử lý đánh giá xấu/spam vi phạm tiêu chuẩn cộng đồng.
5. **Đối soát Tài chính & Rút tiền (Finance & Payouts):**
   - `/admin/financial` — Thống kê doanh thu toàn sàn, dòng tiền vào/ra, hoa hồng trích lập.
   - `/admin/payouts` — Danh sách yêu cầu rút tiền của các chủ quán $\rightarrow$ Thao tác Phê duyệt / Từ chối lệnh chi tiền.
6. **Cấu hình Hệ thống & Bố cục Trang chủ:**
   - `/admin/cuisines` — Quản lý danh mục ẩm thực (Thêm, sửa, đổi icon, sắp xếp thứ tự hiển thị).
   - `/admin/customer-home` — Chỉnh sửa banner quảng cáo trang chủ, cấu hình các khối hiển thị cho khách hàng.
   - `/admin/config` — Cấu hình thông số sàn (Tỷ lệ phí hoa hồng %, bán kính giao hàng tối đa, cước phí giao hàng).
7. **Nhật ký Kiểm toán & Tổng kết Hạ tầng:**
   - `/admin/audit-logs` — **Audit Logs**: Nhật ký lưu vết toàn bộ thao tác nhạy cảm của Admin (Duyệt quán, khóa tài khoản, duyệt tiền, hủy đơn) để đảm bảo tính minh bạch.
   - **Báo cáo Hạ tầng Triển khai:** Tóm tắt kiến trúc đã deploy thực tế (**Vercel** cho React Frontend + **Railway** cho Express API & MySQL Database).

---

## 📊 BẢNG TỔNG HỢP PHÂN CHIA TRANG & THỜI LƯỢNG

| Người | Vai trò phụ trách | Danh sách các Routes chính | Thời lượng |
| :---: | :--- | :--- | :---: |
| **1** | Landing, Auth & Khám phá | `/`, `/faq`, `/terms-of-service`, `/privacy-policy`, `/login`, `/register`, `/forgot-password`, `/app`, `/app/search`, `/app/restaurant/:id`, `/app/dish/:id` | 3.5 – 4m |
| **2** | Hồ sơ, Sổ địa chỉ & Giỏ hàng | `/app/profile`, `/app/profile/edit`, `/app/profile/settings`, `/app/profile/addresses`, `/app/profile/promotions`, `/app/notifications`, `CartDrawer` | 3.5 – 4m |
| **3** | Phí Ship, Voucher & VNPay | `/app/checkout`, `Tính phí ship ORS`, `Mã giảm giá`, `VNPay Sandbox Gateway`, `/app/checkout/vnpay/return`, `/app/order/success/:id` | 3.5 – 4m |
| **4** | Theo dõi đơn, Chat & Đánh giá | `/app/orders`, `/app/track/:id`, `/chat/:id`, `ChatWidget`, `/app/reviews/write/:id`, `/app/reviews/:id` | 3.5 – 4m |
| **5** | Vận hành Đối tác Quán ăn | `/merchant/onboarding`, `/merchant/pending`, `/merchant`, `/merchant/orders` (Kanban), `/merchant/menu`, `/merchant/promotions`, `/merchant/reviews`, `/merchant/wallet`, `/merchant/settings`, `/merchant/notifications` | 3.5 – 4m |
| **6** | Quản trị Sàn, Đối soát & Deploy | `/admin`, `/admin/restaurants`, `/admin/accounts`, `/admin/orders`, `/admin/reviews`, `/admin/financial`, `/admin/payouts`, `/admin/cuisines`, `/admin/customer-home`, `/admin/config`, `/admin/audit-logs`, `Deploy Vercel & Railway` | 4m |
