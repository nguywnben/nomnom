# 📋 KHO DỮ LIỆU COPY-PASTE THỰC TẾ PHỤC VỤ BÁO CÁO NOMNOM (03/09/2026)

> **Mục đích:** Tài liệu chứa toàn bộ dữ liệu thực tế (100% chuẩn xác với Database hiện tại và tọa độ phòng bảo vệ). Mỗi thành viên khi demo trực tiếp chỉ cần mở tài liệu này, **copy và dán thẳng vào các ô input trên website** để thao tác nhanh, chuẩn xác và mượt mà nhất.
>
> 📍 **Tọa độ điểm báo cáo (FPT Polytechnic Cần Thơ):** `9.982080, 105.758253` — Tất cả 8 nhà hàng tại Cần Thơ đều nằm trong bán kính giao hàng lý tưởng **(2.8 km – 5.1 km)**.
>
> 🌐 **Luồng Email trực tiếp:** Nhóm mở sẵn một tab **https://mail.tm/** để nhận địa chỉ email tạm và xem email mã OTP thật từ NomNom gửi về trực tiếp trước mặt hội đồng.
>
> 🔄 **Tính liền mạch xuyên suốt:** Tài khoản đăng ký ở Người 1 sẽ được **sử dụng tiếp nối cho toàn bộ Người 2, Người 3 và Người 4** (không đổi tài khoản khác giữa chừng).
>
> 📁 **Thư mục ảnh demo sẵn có:** `docs/presentation/sample-images/`

---

## 👤 NGƯỜI 1: ONG TUẤN NGHĨA — PHẠM VI, AUTH & KHÁM PHÁ

### 1. Trang `/` (Landing Page) & `/faq`, `/terms-of-service`
* **Loại trang:** 👁️ **CHỈ XEM & BẤM CHUYỂN** (Không cần nhập liệu).
* **Thao tác:** Cuộn trang giới thiệu, chỉ các khối tính năng, bấm nút CTA **"Đăng ký"** hoặc **"Bắt đầu ngay"**.

---

### 2. Trang `/register` (Đăng ký tài khoản Khách hàng mới với Mail.tm)
* **Loại trang:** ✍️ **CẦN NHẬP LIỆU & XÁC THỰC EMAIL THẬT**

* **Bước chuẩn bị:** Mở tab **https://mail.tm/**, copy địa chỉ email tạm đang hiển thị (ví dụ: `nguyenhoanglong@vmani.com`).
* **Điền form đăng ký:**
```text
Họ và tên:
Nguyễn Hoàng Long

Email:
[Dán địa chỉ email vừa copy từ trang https://mail.tm/]

Số điện thoại:
0918234567

Mật khẩu:
NomNom@2026

Xác nhận mật khẩu:
NomNom@2026
```

* **Nhận & Nhập OTP:**
  * Quay lại tab **https://mail.tm/** $\rightarrow$ Mở email mới từ **NomNom** $\rightarrow$ Copy mã **OTP 6 số thật** (hệ thống sinh ngẫu nhiên và mã hóa Bcrypt).
  * Dán mã OTP vào ô xác thực trên web NomNom để kích hoạt tài khoản thành công.

---

### 3. Trang `/login` (Đăng nhập bằng chính Tài khoản Vừa Đăng Ký)
* **Loại trang:** ✍️ **ĐĂNG NHẬP LIỀN MẠCH**

```text
Email:
[Dán chính email vừa đăng ký từ https://mail.tm/]

Mật khẩu:
NomNom@2026
```

*(Dự phòng nếu không dùng mạng/mất kết nối internet: Dùng tài khoản seed sẵn `khachhang@nomnom.local` / `password123`)*.

---

### 4. Trang `/forgot-password` (Quên mật khẩu — Giải thích logic bảo mật)
* **Loại trang:** 👁️ **GIẢI THÍCH NGHIỆP VỤ / DEMO FORM**
* Dùng email vừa tạo để chứng minh: Gửi OTP reset mật khẩu an toàn, response không tiết lộ email có tồn tại hay không.

---

### 5. Trang `/app` (Trang chủ Khách hàng)
* **Loại trang:** 👁️ **CHỈ XEM & BẤM CHỌN** (Không cần nhập liệu).
* **Thao tác:** Xem Banner khuyến mãi động, Danh mục ẩm thực (*Việt Nam, Ý, Mỹ, Cà phê...*), Danh sách quán gần đây, bấm vào thanh tìm kiếm chuyển sang `/app/search`.

---

### 6. Trang `/app/search` (Tìm kiếm & Bộ lọc chuẩn dữ liệu DB)
* **Loại trang:** 🔍 **CẦN NHẬP TỪ KHÓA & CHỌN BỘ LỌC**

```text
Từ khóa tìm kiếm:
Cơm gà xối mỡ
```

* **Thao tác bộ lọc:**
  * Chọn danh mục: **Việt Nam**
  * Lọc mức giá: `30.000đ - 60.000đ`
  * Đánh giá: `4 sao trở lên`
  * Chọn quán có sẵn trong DB: **"Cơm Gà Trương Vĩnh Nguyên"** (hoặc quán "Bún Cá Hưng Phú") $\rightarrow$ *Bàn giao cho Người 2*.

---

## 👤 NGƯỜI 2: NGUYỄN THỊ NHƯ NGỌC — QUÁN, HỒ SƠ, ĐỊA CHỈ & GIỎ HÀNG
*(Tiếp tục sử dụng tài khoản vừa đăng nhập ở Người 1)*

### 7. Trang `/app/restaurant/116` (Chi tiết Quán Cơm Gà Trương Vĩnh Nguyên)
* **Loại trang:** 👁️ **CHỈ XEM & CHỌN MÓN** (Không cần gõ chữ).
* **Thao tác:** Bấm qua các Tab danh mục menu, xem trạng thái quán đang mở cửa (`is_open_now = 1`), khoảng cách ~3.8 km và voucher sàn.

---

### 8. Trang `/app/dish/119` (Chi tiết Món Cơm Gà Xối Mỡ & Đưa vào Giỏ)
* **Loại trang:** ✍️ **CẦN NHẬP GHI CHÚ MÓN**

* **Món chọn:** `Cơm gà xối mỡ` (Giá DB: 52.000 đ)
* **Số lượng:** Bấm dấu `+` tăng lên `2` phần (Tổng: 104.000 đ).
* **Ghi chú món ăn:**
```text
Đùi gà chiên giòn rụm, cho thêm nhiều dưa chua và 1 chén nước tương tỏi ớt giúp mình nhé
```
* **Thao tác:** Bấm nút **"Thêm vào giỏ hàng"**.

---

### 9. Component `CartDrawer` (Ngăn kéo Giỏ hàng)
* **Loại trang:** 🛒 **THAO TÁC NÚT BẤM**
* **Thao tác:** Mở giỏ hàng, tăng/giảm số lượng món, **F5 tải lại trang** để chứng minh giỏ hàng được đồng bộ và lưu trữ an toàn trong Database không bị mất dữ liệu.

---

### 10. Trang `/app/profile/edit` (Chỉnh sửa Hồ sơ Khách hàng)
* **Loại trang:** ✍️ **CẦN NHẬP LIỆU & CHỌN ẢNH**

```text
Họ và tên:
Nguyễn Hoàng Long

Số điện thoại:
0918234567
```
* **Ảnh đại diện:** Chọn file `docs/presentation/sample-images/avatar-khach-hang.png`.

---

### 11. Trang `/app/profile/addresses` (Quản lý Sổ địa chỉ Giao hàng)
* **Loại trang:** ✍️ **CẦN NHẬP LIỆU THÊM ĐỊA CHỈ (KHỚP TỌA ĐỘ BÁO CÁO)**

* **Cách 1 (Khuyên dùng khi ngồi tại phòng bảo vệ):** Bấm nút **"Dùng vị trí hiện tại"** $\rightarrow$ Trình duyệt tự bắt GPS `9.982080, 105.758253` và tự điền địa chỉ FPT Polytechnic Cần Thơ.
* **Cách 2 (Nhập tay):** Bấm `+ Thêm địa chỉ`:
```text
Nhãn địa chỉ:
Trường học

Tên người nhận:
Nguyễn Hoàng Long

Số điện thoại:
0918234567

Tỉnh/Thành phố:
Thành phố Cần Thơ

Phường/Xã:
Phường Thường Thạnh

Địa chỉ cụ thể:
Trường Cao đẳng FPT Polytechnic, Đường Số 14A KDC Hoàng Quân

Ghi chú giao hàng:
Giao tại sảnh tòa nhà chính, gọi mình ra nhận nhé
```

---

### 12. Trang `/app/profile/promotions` & `/app/notifications`
* **Loại trang:** 👁️ **CHỈ XEM / CHỌN TAB** (Không cần nhập).
* **Thao tác:** Xem danh sách voucher sàn có sẵn (`NOMNOM15`, `NEW50K`) và trung tâm thông báo.

---

## 👤 NGƯỜI 3: TRẦN MINH ĐƯỢC — CHECKOUT, VẬN CHUYỂN & THANH TOÁN
*(Tiếp tục thao tác trên giỏ hàng và tài khoản của Người 1 & 2)*

### 13. Trang `/app/checkout` (Trang Xác nhận Thanh toán & Đặt hàng)
* **Loại trang:** ✍️ **CHỌN ĐỊA CHỈ, ÁP VOUCHER & NHẬP GHI CHÚ ĐƠN**

* **Địa chỉ giao hàng:** Chọn địa chỉ FPT Polytechnic Cần Thơ vừa thêm.
* **Kiểm tra phí ship tự động:** Khoảng cách thực tế ~3.8 km (đường bộ ~4.9 km) $\rightarrow$ Phí giao hàng tính chuẩn xác: `40.000đ`.
* **Chọn Voucher có sẵn trong DB:** Chọn mã `NOMNOM15` (Giảm 15% tiền món = giảm 15.600đ).
* **Ghi chú đơn hàng (Customer Note):**
```text
Giao khoảng 11h45 trưa nay tại sảnh lễ tân, gọi trước 5 phút giúp mình nhé
```

---

### 14. Chọn Phương thức Thanh toán
* **Lựa chọn 1 (Luồng chính demo ổn định):** Chọn **"Thanh toán khi nhận hàng (COD)"** $\rightarrow$ Bấm **"Đặt đơn hàng"**.
* **Lựa chọn 2 (Demo cổng thanh toán VNPay Sandbox):**
```text
Ngân hàng: NCB
Số thẻ: 9704198526191432198
Tên chủ thẻ: NGUYEN VAN A
Ngày phát hành: 07/15
Mã OTP: 123456
```

---

### 15. Trang `/app/order/success/:id` (Đặt hàng Thành công)
* **Loại trang:** 👁️ **CHỈ XEM & BẤM CHUYỂN**
* **Thao tác:** Xem mã đơn hàng (VD: `NNM-260903-XXXX`), kiểm tra tổng tiền và bấm **"Theo dõi đơn hàng"** $\rightarrow$ *Bàn giao cho Người 4*.

---

## 👤 NGƯỜI 4: HỒ MINH NHẬT — THEO DÕI, CHAT & ĐÁNH GIÁ
*(Tiếp tục theo dõi đúng đơn hàng vừa tạo ở Người 3)*

### 16. Trang `/app/orders` (Lịch sử Đơn hàng của tôi)
* **Loại trang:** 👁️ **LỌC TRẠNG THÁI**
* **Thao tác:** Bấm lọc qua các tab *Tất cả*, *Đang giao*, *Đã giao*, chọn đơn hàng vừa đặt để vào trang chi tiết.

---

### 17. Trang `/app/track/:id` (Theo dõi Đơn hàng Thời gian thực)
* **Loại trang:** 📡 **THEO DÕI TIẾN TRÌNH & XÁC NHẬN**
* **Thao tác:**
  * Quan sát tiến trình cập nhật qua Polling: `Đã đặt` $\rightarrow$ `Quán nhận` $\rightarrow$ `Đang nấu` $\rightarrow$ `Sẵn sàng` $\rightarrow$ `Đang giao`.
  * Khi đơn hàng ở trạng thái **Đang giao (`delivering`)**, bấm nút: **"Xác nhận đã nhận hàng"**.

---

### 18. Kênh Chat 1-1 với Quán ăn (`/chat/:id` hoặc `ChatWidget`)
* **Loại trang:** 💬 **CẦN NHẬP TIN NHẮN CHAT**

* **Tin nhắn Khách hàng gửi:**
```text
Chào quán Cơm Gà Trương Vĩnh Nguyên ạ, đơn hàng của mình nhớ cho thêm nhiều nước tương tỏi ớt ăn kèm giúp mình nhé!
```
* **Tin nhắn Quán ăn phản hồi (Người 5 chat lại):**
```text
Dạ quán đã chuẩn bị đầy đủ nước tương tỏi ớt riêng cho bạn rồi nhé, shipper đang mang sang cho bạn ngay ạ!
```

---

### 19. Trang `/app/reviews/write/:id` (Viết đánh giá đơn hàng)
* **Loại trang:** ✍️ **CẦN NHẬP ĐÁNH GIÁ & CHỌN SAO**

* **Đánh giá Quán Cơm Gà:** Chọn `5 sao` ⭐⭐⭐⭐⭐
```text
Gà xối mỡ da giòn rụm thịt mềm ngọt, cơm dẻo thơm không bị ngấy mỡ. Quán đóng gói hộp giấy sạch sẽ và giao hàng rất nhanh!
```
* **Đánh giá Món Cơm Gà Xối Mỡ:** Chọn `5 sao` ⭐⭐⭐⭐⭐
```text
Đùi gà góc tư to đùng ướp vị đậm đà, nước tương chấm pha rất ngon, 10/10 điểm!
```
* **Ảnh đính kèm đánh giá (tùy chọn):** Chọn file `docs/presentation/sample-images/anh-mon-an.png`.

---

## 👤 NGƯỜI 5: NGUYỄN VĂN DĨ KHANG — VẬN HÀNH NHÀ HÀNG (MERCHANT)

### 20. Trang `/merchant/onboarding` (Đăng ký Mở Quán Mới — Demo Form)
* **Loại trang:** ✍️ **CẦN NHẬP LIỆU HỒ SƠ QUÁN**

```text
Tên nhà hàng:
Bếp Cơm Niêu Sài Gòn - Ninh Kiều

Số điện thoại quán:
0939123456

Slogan / Lời giới thiệu:
Hương vị cơm niêu truyền thống và đặc sản ba miền thơm ngon chuẩn vị gia đình

Mô tả chi tiết:
Chuyên phục vụ các món cơm niêu cháy giòn, cá kho tộ đậm đà, canh cua rau đay cà pháo và các món ăn dân dã ba miền, nguyên liệu tươi sạch mỗi ngày.

Tỉnh / Thành phố:
Thành phố Cần Thơ

Phường / Xã:
Phường An Khánh

Địa chỉ kinh doanh:
156 Nguyễn Văn Cừ Nối Dài

Thời gian chuẩn bị trung bình:
15

Đơn hàng tối thiểu:
30000

Tên ngân hàng:
Vietcombank (VCB)

Số tài khoản ngân hàng:
0111000234567

Tên chủ tài khoản:
TRAN VAN QUAN
```
* **Ảnh đại diện quán:** Chọn `docs/presentation/sample-images/anh-quan-an.png`.
* **Giấy phép ATTP / ĐKKD:** Chọn `docs/presentation/sample-images/giay-phep-kinh-doanh.png`.

---

### 21. Trang `/merchant` (Bảng điều khiển Doanh thu Quán)
* **Loại trang:** 📊 **CHỈ XEM & LỌC THỜI GIAN**
* **Thao tác:** Xem tổng doanh thu trong ngày, số lượng đơn hoàn tất, biểu đồ biến động doanh số và danh sách món bán chạy nhất.

---

### 22. Trang `/merchant/menu` (Quản lý Thực đơn Món ăn)
* **Loại trang:** ✍️ **CẦN NHẬP MÓN ĂN MỚI**

* **Thao tác:** Bấm `+ Thêm món ăn`:
```text
Tên món ăn:
Cá Bông Lau Kho Tộ Đậm Đà

Danh mục món:
Món kho & Món mặn

Giá bán (VND):
65000

Mô tả món ăn:
Cá bông lau tươi kho tộ nước màu dừa Bến Tre sánh quyện, thơm nồng tiêu sọ Phú Quốc và ớt hiểm, ăn cùng cơm cháy giòn cực kỳ bắt cơm.
```
* **Ảnh món ăn:** Chọn `docs/presentation/sample-images/anh-mon-an.png`.
* **Trạng thái:** Bật `Còn hàng` và gạt công tắc `Món nổi bật`.

---

### 23. Trang `/merchant/orders` (Xử lý Đơn hàng Kanban)
* **Loại trang:** 📋 **THAO TÁC CHUYỂN TRẠNG THÁI ĐƠN & IN PHIẾU**
* **Thao tác tuần tự:**
  1. Ở cột **Chờ xác nhận**: Bấm nút **"Nhận đơn"** (`accepted`).
  2. Bấm nút **"Bắt đầu nấu"** (`preparing`).
  3. Bấm nút **"Món đã sẵn sàng"** (`ready_for_pickup`).
  4. Bấm nút **"Bắt đầu giao hàng"** (`delivering`) *(Nhà hàng tự giao hoặc gửi shipper đối tác ngoài)*.
  5. Bấm icon **Máy in** trên thẻ đơn để mở **Phiếu chế biến / Hóa đơn in nhiệt** chuẩn chỉnh.

---

### 24. Trang `/merchant/promotions` (Tạo Voucher Quán)
* **Loại trang:** ✍️ **CẦN NHẬP TẠO VOUCHER**

```text
Mã khuyến mãi:
BEPNIEU15K

Tên chương trình:
Ưu đãi 15K Đơn Đầu Tiên Bếp Niêu

Loại giảm giá:
Số tiền cố định (VND)

Mức giảm:
15000

Đơn hàng tối thiểu:
80000

Tổng lượt sử dụng:
100

Lượt dùng mỗi khách:
1
```

---

### 25. Trang `/merchant/wallet` (Ví Doanh thu & Tạo Lệnh Rút Tiền)
* **Loại trang:** ✍️ **CẦN NHẬP LỆNH RÚT TIỀN**

* **Thao tác:** Bấm `+ Yêu cầu rút tiền`:
```text
Số tiền muốn rút (VND):
500000

Tài khoản nhận tiền:
Vietcombank - ****4567

Ghi chú rút tiền:
Rút doanh thu đơn hàng tuần 1 tháng 9/2026
```

---

## 👤 NGƯỜI 6: NGUYỄN CÔNG BEN — ADMIN, ĐỐI SOÁT & HẠ TẦNG

### 26. Trang `/admin` (Tổng quan Sàn Thương mại Điện tử)
* **Loại trang:** 📊 **CHỈ XEM & GIẢI THÍCH CHỈ SỐ**
* **Thao tác:** Trình bày các KPI cốt lõi: Tổng giá trị giao dịch (GMV), Doanh thu hoa hồng sàn thực thu, Tỷ lệ hủy đơn, Tăng trưởng người dùng mới.

---

### 27. Trang `/admin/restaurants` (Kiểm duyệt Hồ sơ Quán & Địa chỉ)
* **Loại trang:** ⚖️ **THẨM ĐỊNH & PHÊ DUYỆT**
* **Thao tác Phê duyệt:** Bấm **"Duyệt hồ sơ"** quán `Bếp Cơm Niêu Sài Gòn`.
* **Thao tác Từ chối (nếu demo từ chối hồ sơ chưa đạt):**
```text
Lý do từ chối:
Ảnh chụp Giấy chứng nhận Vệ sinh ATTP bị mờ góc dưới và đã hết hạn hiệu lực, vui lòng chụp lại bản gốc còn hiệu lực để hoàn tất xét duyệt.
```

---

### 28. Trang `/admin/accounts` (Quản lý Tài khoản & Phân quyền)
* **Loại trang:** 🛡️ **TÌM KIẾM & KHÓA TÀI KHOẢN VI PHẠM**
* **Thao tác:** Tìm tài khoản `Trần Minh Quân` $\rightarrow$ Bấm **"Khóa tài khoản"**:
```text
Lý do khóa:
Tài khoản có dấu hiệu đặt đơn ảo và hủy đơn nhiều lần liên tiếp không lý do, tạm khóa 7 ngày để xác minh theo điều khoản sàn.
```

---

### 29. Trang `/admin/financial` (Đối soát Tài chính & Duyệt Payout)
* **Loại trang:** 💳 **ĐỐI SOÁT & DUYỆT RÚT TIỀN**
* **Thao tác:** Mở tab **Yêu cầu rút tiền (`payouts`)** $\rightarrow$ Chọn lệnh rút `500.000đ` của quán $\rightarrow$ Bấm **"Phê duyệt"**:
```text
Mã tham chiếu ngân hàng:
FT260903889912
```

---

### 30. Trang `/admin/content` (Quản lý Danh mục & Bố cục Trang chủ)
* **Loại trang:** 🎨 **THÊM LOẠI HÌNH & KÉO THẢ SẮP XẾP**
* **Thao tác:** Bấm `+ Thêm loại hình ẩm thực`:
```text
Tên loại hình:
Lẩu & Nướng BBQ

Mô tả:
Các món lẩu hải sản, lẩu thái chua cay và nướng than hoa thơm lừng
```
* **Ảnh đại diện:** Chọn `docs/presentation/sample-images/anh-mon-an.png`.
* Kéo thả thay đổi thứ tự hiển thị ưu tiên ngoài Trang chủ.

---

### 31. Trang `/admin/system?tab=logs` (Nhật ký Kiểm toán / Audit Logs)
* **Loại trang:** 🔍 **TRUY VẾT & CHỨNG MINH TÍNH MINH BẠCH**
* **Thao tác:** Lọc theo các hành động vừa thực hiện trong buổi demo:
  * `duyet_nha_hang` $\rightarrow$ Thấy rõ Quản trị viên thực hiện, ID nhà hàng, thời gian chính xác tới từng giây.
  * `doi_trang_thai_tai_khoan` $\rightarrow$ Ghi nhận lý do khóa và IP thực hiện.
  * `duyet_rut_tien` $\rightarrow$ Ghi nhận mã tham chiếu giao dịch ngân hàng và biến động số dư ví.
* **Tổng kết hạ tầng:** Trình bày cấu trúc vận hành React 19 (Vercel) + Express REST API (Railway) + MySQL 8 + các cổng tích hợp (Cloudinary, OpenRouteService, Nominatim, VNPay Sandbox, SMTP).
