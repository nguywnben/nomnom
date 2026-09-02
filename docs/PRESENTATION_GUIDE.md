# Kịch bản báo cáo dự án NomNom — 03/09/2026

> **Mục tiêu:** Phân chia toàn bộ phạm vi NomNom cho 6 thành viên theo một hành trình end-to-end. Nhóm kiểm kê 100% trang/chức năng nhưng chỉ demo trực tiếp các điểm chứng minh nghiệp vụ; không chạy tuần tự mọi màn hình.

## Cách sử dụng bộ tài liệu

1. Cả nhóm đọc phần 1–8 và 12 trong [`PRESENTATION_LIBRARY.md`](./PRESENTATION_LIBRARY.md).
2. **Kho dữ liệu thực tế để copy-paste khi demo trực tiếp:** Mở ngay [`docs/presentation/00-KHO-DU-LIEU-COPY-PASTE.md`](./presentation/00-KHO-DU-LIEU-COPY-PASTE.md) (kèm ảnh mẫu tại `docs/presentation/sample-images/`).
3. Mỗi người học sâu cẩm nang riêng trong `docs/presentation/`.
4. Khi diễn tập, dùng tài khoản và dữ liệu đã chuẩn bị; không tạo/xóa hàng loạt dữ liệu seed.
5. COD là luồng chính ổn định. VNPay dùng live chỉ khi preflight thành công, nếu không dùng slide/video.
6. Không nói “WebSocket/realtime tức thời”: Tracking, Chat và Merchant Orders hiện cập nhật gần thời gian thực bằng polling.

## Thông điệp mở đầu bắt buộc

NomNom vận hành với **Admin – Khách hàng – Nhà hàng**. Nhà hàng tự giao hoặc thuê đối tác ngoài; NomNom không có marketplace tài xế. Luồng chuẩn là:

```text
Khách chọn món → Checkout → Nhà hàng nhận/chuẩn bị/bắt đầu giao
→ Khách xác nhận nhận hàng → Ví nhà hàng/đối soát → Admin audit
```

---

## Tổng quan luồng báo cáo 6 bước

```
[1. Phạm vi, Auth & Khám phá] → [2. Quán, Hồ sơ & Giỏ]
→ [3. Checkout, Ship & Thanh toán] → [4. Theo dõi, Chat & Đánh giá]
→ [5. Vận hành Nhà hàng] → [6. Admin, Đối soát & Hạ tầng]
```

Mỗi phần gồm 3 lớp: thao tác nhìn thấy trên UI, quy tắc backend bảo vệ nghiệp vụ và bảng dữ liệu tạo bằng chứng. Thời lượng toàn bài mục tiêu 23–25 phút, cộng thời gian hỏi đáp.

---

## Người 1 — Ong Tuấn Nghĩa: Phạm vi, xác thực và khám phá

* **Phân công:** **Ong Tuấn Nghĩa**
* **Thời lượng:** 3 phút 30 giây
* **Cẩm nang:** [`presentation/01-ong-tuan-nghia.md`](./presentation/01-ong-tuan-nghia.md)
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
4. **Tìm kiếm và chọn quán để bàn giao:**
   - `/app/search` — **Tìm kiếm & Bộ lọc nâng cao**: Tìm theo tên món/quán, lọc theo khoảng giá, đánh giá sao, loại ẩm thực.
   - Chọn một quán phù hợp và bàn giao; Người 2 trình bày sâu chi tiết quán/món.

🎙️ **Lời thoại chuyển giao (Transition):**
> *"Sau khi khách hàng đã tìm kiếm và lựa chọn được các món ăn ưng ý từ quán, xin mời bạn **[Tên Người 2]** tiếp tục trình bày về phân hệ quản lý tài khoản, sổ địa chỉ nhận hàng và thao tác đưa món vào giỏ hàng."*

---

## Người 2 — Nguyễn Thị Như Ngọc: Quán, hồ sơ, địa chỉ và giỏ hàng

* **Phân công:** **Nguyễn Thị Như Ngọc**
* **Thời lượng:** 3 phút 30 giây
* **Cẩm nang:** [`presentation/02-nguyen-thi-nhu-ngoc.md`](./presentation/02-nguyen-thi-nhu-ngoc.md)
* **Mục tiêu:** Quản lý thông tin cá nhân khách hàng, thiết lập địa chỉ nhận hàng và cơ chế giỏ hàng đồng bộ cơ sở dữ liệu.

### Các trang phụ trách review:
1. **Chi tiết quán và món:**
   - `/app/restaurant/:id` — thông tin, trạng thái mở cửa/phạm vi, voucher và menu theo danh mục.
   - `/app/dish/:id`, `/app/dish/:id/reviews`, `/app/reviews/:id` — chi tiết món, đánh giá món và quán.
2. **Quản lý Hồ sơ Khách hàng:**
   - `/app/profile` — **Trung tâm cá nhân**: Xem thông tin tổng quan, vai trò hiện tại, lối tắt quản lý.
   - `/app/profile/edit` — **Chỉnh sửa hồ sơ**: Thay đổi họ tên, số điện thoại, tải ảnh đại diện lên Cloudinary.
   - `/app/profile/settings` — **Cài đặt tài khoản**: Đổi mật khẩu, cài đặt bảo mật và thông báo.
3. **Sổ địa chỉ Giao hàng:**
   - `/app/profile/addresses` — **Quản lý sổ địa chỉ**: Thêm địa chỉ mới, chỉnh sửa/xóa địa chỉ, gắn nhãn (Nhà riêng / Công ty), tính năng tự động nhận diện tọa độ định vị vị trí, chọn địa chỉ mặc định.
4. **Kho khuyến mãi cá nhân & Thông báo:**
   - `/app/profile/promotions` — **Kho voucher**: Xem các voucher đang sở hữu và điều kiện áp dụng.
   - `/app/notifications` — **Trung tâm thông báo**: Danh sách thông báo cập nhật đơn hàng và khuyến mãi.
5. **Vận hành Giỏ hàng:**
   - `CartDrawer` (Ngăn kéo giỏ hàng) — Thêm món ăn vào giỏ, tùy chỉnh tăng/giảm số lượng, thêm ghi chú cho món ăn, cơ chế cảnh báo khi thêm món từ quán khác, chứng minh giỏ hàng được lưu đồng bộ trong Database (reload trang không bị mất).

🎙️ **Lời thoại chuyển giao (Transition):**
> *"Khi giỏ hàng và địa chỉ nhận hàng đã được xác định, xin mời bạn **[Tên Người 3]** tiếp tục hướng dẫn quy trình tính phí vận chuyển theo khoảng cách thực tế, áp mã giảm giá và thanh toán trực tuyến qua cổng VNPay."*

---

## Người 3 — Trần Minh Được: Checkout, vận chuyển và thanh toán

* **Phân công:** **Trần Minh Được**
* **Thời lượng:** 4 phút
* **Cẩm nang:** [`presentation/03-tran-minh-duoc.md`](./presentation/03-tran-minh-duoc.md)
* **Mục tiêu:** Trình bày quy trình Checkout toàn diện, cơ chế tính phí ship động theo bản đồ thực tế và tích hợp cổng thanh toán trực tuyến.

### Các trang phụ trách review:
1. **Trang Checkout Đặt hàng:**
   - `/app/checkout` — **Xác nhận đặt hàng**: Kiểm tra danh sách món, người nhận, số điện thoại, ghi chú giao hàng.
2. **Tính phí Vận chuyển Động:**
   - Ưu tiên OpenRouteService; nếu dịch vụ route gián đoạn và đã có tọa độ, dùng ước lượng Haversine × 1,3.
   - Phạm vi tối đa 12 km; công thức hiện tại `min(50.000, 15.000 + ceil(km) × 5.000)`.
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

## Người 4 — Hồ Minh Nhật: Theo dõi, chat và đánh giá

* **Phân công:** **Hồ Minh Nhật**
* **Thời lượng:** 3 phút 30 giây
* **Cẩm nang:** [`presentation/04-ho-minh-nhat.md`](./presentation/04-ho-minh-nhat.md)
* **Mục tiêu:** Trải nghiệm sau khi đặt hàng, vòng đời trạng thái đơn, kênh liên lạc tức thời và hệ thống đánh giá chất lượng.

### Các trang phụ trách review:
1. **Lịch sử & Quản lý Đơn hàng:**
   - `/app/orders` — **Danh sách đơn hàng của tôi**: Lọc theo trạng thái (Tất cả / Đang xử lý / Hoàn tất / Đã hủy), xem chi tiết đơn cũ.
2. **Theo dõi Đơn hàng gần thời gian thực:**
   - `/app/track/:id` — **Theo dõi hành trình đơn**: Stepper tiến trình trực quan (Chờ thanh toán $\rightarrow$ Đã đặt $\rightarrow$ Quán nhận $\rightarrow$ Đang nấu $\rightarrow$ Sẵn sàng giao $\rightarrow$ Đang giao $\rightarrow$ Đã giao).
   - Hiển thị thông tin quán ăn, dự kiến thời gian giao và chi tiết đơn hàng.
3. **Hệ thống Nhắn tin Chat 1-1:**
   - `/chat/:id` & `ChatWidget` — chat giữa các bên thuộc đơn; lịch sử lưu DB, polling hội thoại/tin nhắn định kỳ.
4. **Đánh giá & Phản hồi (Reviews & Rating):**
   - `/app/reviews/write/:id` — **Viết đánh giá đơn hàng**: Đánh giá số sao cho quán, đánh giá riêng từng món ăn kèm nhận xét chi tiết.
   - `/app/reviews/:id` — **Trang tổng hợp đánh giá của quán**: Xem điểm sao trung bình, biểu đồ phân bố sao và các bình luận từ cộng đồng.

🎙️ **Lời thoại chuyển giao (Transition):**
> *"Chúng ta đã đi trọn vẹn hành trình của một Khách hàng. Bây giờ, xin mời bạn **[Tên Người 5]** chuyển sang góc nhìn của Đối tác Quán ăn (Merchant) để xem cách họ tiếp nhận đơn, chuẩn bị món và quản lý doanh thu."*

---

## Người 5 — Nguyễn Văn Dĩ Khang: Vận hành nhà hàng

* **Phân công:** **Nguyễn Văn Dĩ Khang**
* **Thời lượng:** 4 phút
* **Cẩm nang:** [`presentation/05-nguyen-van-di-khang.md`](./presentation/05-nguyen-van-di-khang.md)
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
   - `/merchant/orders` — Kanban polling: Nhận đơn → Chấp nhận/Từ chối → Đang nấu → Sẵn sàng → Nhà hàng bắt đầu tự giao/thuê ngoài.
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

## Người 6 — Nguyễn Công Ben: Admin, đối soát và hạ tầng

* **Phân công:** **Nguyễn Công Ben**
* **Thời lượng:** 4 phút 30 giây
* **Cẩm nang:** [`presentation/06-nguyen-cong-ben.md`](./presentation/06-nguyen-cong-ben.md)
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
   - `/admin/promotions` — CRUD voucher toàn sàn và giám sát voucher của quán.
5. **Đối soát Tài chính & Rút tiền (Finance & Payouts):**
   - `/admin/financial` — Thống kê doanh thu toàn sàn, dòng tiền vào/ra, hoa hồng trích lập.
   - `/admin/financial?tab=payouts` — Danh sách yêu cầu rút tiền; phê duyệt/từ chối có kiểm tra số dư và audit.
6. **Cấu hình Hệ thống & Bố cục Trang chủ:**
   - `/admin/content?tab=cuisines` — Quản lý danh mục ẩm thực.
   - `/admin/content?tab=home` — Banner và cấu hình khối trang chủ.
   - `/admin/system?tab=config` — Cấu hình thông số sàn có validate.
7. **Nhật ký Kiểm toán & Tổng kết Hạ tầng:**
   - `/admin/system?tab=logs` — Audit log thao tác nhạy cảm.
   - `/admin/notifications` — Thông báo quản trị.
   - **Báo cáo Hạ tầng Triển khai:** Tóm tắt kiến trúc đã deploy thực tế (**Vercel** cho React Frontend + **Railway** cho Express API & MySQL Database).

---

## Bảng tổng hợp phạm vi và thời lượng

| Người | Vai trò phụ trách | Danh sách các Routes chính | Thời lượng |
| :---: | :--- | :--- | :---: |
| **1 – Nghĩa** | Phạm vi, Landing, Auth, Home, Search | Công khai + khám phá | 3m30 |
| **2 – Ngọc** | Quán/món, Profile, Address, Voucher, Notification, Cart | Chuẩn bị giỏ hợp lệ | 3m30 |
| **3 – Được** | Checkout, ORS/fallback, Voucher validation, COD/VNPay | Tạo đơn an toàn | 4m |
| **4 – Nhật** | Orders, Tracking, Chat, Confirm delivery, Review | Hậu đặt hàng | 3m30 |
| **5 – Khang** | Onboarding, Dashboard, Menu, Orders, Wallet, Settings | Vận hành nhà hàng | 4m |
| **6 – Ben** | Admin, Finance, Content/System, Audit, Quality, Deploy | Quản trị và tổng kết | 4m30 |

## Nguyên tắc cân bằng trình bày

- Cân bằng theo độ khó và thời gian, không theo số route.
- Người 1 không mở từng trang pháp lý/auth; Người 5 và 6 demo sâu tối đa 4–5 màn hình.
- Các chức năng phụ được kiểm kê trên slide và giải thích trong cẩm nang, không thao tác CRUD dài dòng.
- Người 3 và 6 có thêm thời gian vì thanh toán/tài chính là phần dễ bị phản biện.

## Checklist diễn tập chung

### Trước báo cáo

- [ ] Chạy release gate, health check và smoke đăng nhập ba vai trò.
- [ ] Reset/import đúng seed, backup trước mọi import; xác nhận số liệu trong thư viện.
- [ ] Mở ba cửa sổ riêng Customer/Merchant/Admin và đúng đơn cho từng trạng thái.
- [ ] Preflight VNPay, SMTP, Cloudinary, ORS; nếu lỗi chuyển COD/video.
- [ ] Chuẩn bị ERD, architecture, video offline và bản build dự phòng.

### Trong báo cáo

- [ ] Một đơn duy nhất được theo từ Customer → Merchant → Customer → Admin/Wallet.
- [ ] Mỗi người nói đủ UI → quy tắc backend → bảng dữ liệu.
- [ ] Không gọi polling là WebSocket; không nhắc tài xế như vai trò runtime.
- [ ] Không tạo refund/payout hoặc xóa dữ liệu đang dùng nếu chưa preflight.
- [ ] Nêu giới hạn trung thực và phân biệt release candidate với production SLA.

### Sau khi demo

- [ ] Người 6 chốt số liệu, gate chất lượng và kế hoạch rollback.
- [ ] Mỗi người sẵn sàng trả lời 10 câu bắt buộc trong thư viện chung.
