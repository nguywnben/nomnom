# Thư viện kiến thức báo cáo NomNom

> Tài liệu tra cứu chung cho buổi bảo vệ ngày 03/09/2026. Mỗi thành viên phải đọc phần 1–8 và tài liệu chuyên trách của mình trong `docs/presentation/`. Khi tài liệu mâu thuẫn, ưu tiên theo thứ tự: code runtime → `database/nomnom.sql` → tài liệu này → tài liệu lịch sử.

## 1. NomNom giải quyết bài toán gì?

NomNom là nền tảng đặt và giao món ăn với ba vai trò runtime:

| Vai trò | Trách nhiệm |
|---|---|
| Khách hàng | Khám phá món/quán, quản lý giỏ và địa chỉ, đặt món, thanh toán, theo dõi, chat, xác nhận nhận hàng, đánh giá |
| Nhà hàng | Đăng ký đối tác, quản lý quán/thực đơn, nhận–chuẩn bị–giao đơn, voucher, phản hồi đánh giá, ví và yêu cầu rút tiền |
| Admin | Duyệt và giám sát, xử lý ngoại lệ, quản lý nội dung/cấu hình, đối soát và audit |

NomNom **không có vai trò tài xế**. Nhà hàng tự giao hoặc thuê đối tác ngoài hệ thống. NomNom quản lý phí và trạng thái giao nhận nhưng không dispatch, KYC, định vị hay trả thu nhập tài xế. Các bảng/cột tài xế còn trong schema chỉ để tương thích dữ liệu cũ và không có UI/API công khai.

## 2. Kiến trúc và đường đi dữ liệu

```text
Người dùng
  → React 19 + Vite trên Vercel
  → REST API /api/v1 trên Express/Railway
  → MySQL 8 trên Railway
                    ├─ Cloudinary: ảnh
                    ├─ SMTP: OTP email
                    ├─ OpenRouteService: geocode/route
                    ├─ Nominatim: reverse geocode
                    └─ VNPay sandbox: thanh toán/refund
```

Một thao tác UI thường đi theo chuỗi: component React → hàm trong `client/src/lib/api.js` → route Express → middleware xác thực/phân quyền → transaction/query MySQL → JSON response → cập nhật UI/toast. Không được nói dữ liệu chính được hard-code ở frontend; seed chỉ là dữ liệu khởi tạo database.

## 3. Nguồn dữ liệu và số liệu seed báo cáo

Nguồn chuẩn là `database/nomnom.sql`, được kiểm chứng bằng `npm run verify:report-seed` trong thư mục `server`.

| Chỉ số | Giá trị seed 01/09/2026 |
|---|---:|
| Bảng | 38 |
| Tài khoản | 32 |
| Nhà hàng | 14 |
| Món ăn | 53 |
| Đơn hàng | 27 |
| Đánh giá | 27 |
| Đơn từ 20/08–01/09 | 22 |
| Dữ liệu tài xế runtime | 0 |

Phân bố đơn: 19 `delivered`; mỗi trạng thái `payment_failed`, `placed`, `accepted`, `preparing`, `ready_for_pickup`, `delivering`, `cancelled`, `expired` có 1 đơn. Thanh toán: 22 `paid`, 3 `unpaid`, 1 `failed`, 1 `refunded`. Seed có món hết hàng, món ẩn và voucher còn hạn ngày báo cáo để demo trường hợp biên.

Tài khoản demo mặc định:

| Vai trò | Email | Mật khẩu seed |
|---|---|---|
| Admin | `admin@nomnom.local` | `password123` |
| Khách hàng | `khachhang@nomnom.local` | `password123` |
| Nhà hàng | `nhahang@nomnom.local` | `password123` |

Chỉ dùng các credential này trong môi trường demo kín; phải đổi mật khẩu trước khi công khai production.

## 4. Xác thực, phiên và phân quyền

- Khách hàng tự đăng ký bằng email, mật khẩu tối thiểu 8 ký tự và OTP 6 số.
- OTP được băm bcrypt, hiệu lực 10 phút, sai tối đa 5 lần; đăng ký chờ tối đa 30 phút.
- Đăng nhập trả access JWT ngắn hạn và refresh token được rotate; client tự refresh rồi retry một lần khi gặp 401.
- Quên mật khẩu không tiết lộ email có tồn tại; reset thành công thu hồi các refresh token cũ.
- Route được bảo vệ ở cả frontend và backend. Backend còn kiểm tra quyền sở hữu: khách chỉ thấy đơn/địa chỉ của mình, nhà hàng chỉ xử lý tài nguyên thuộc quán.
- Admin/merchant không tự đăng ký qua form khách hàng. Merchant bắt đầu từ tài khoản đã đăng nhập và quy trình onboarding.

Giới hạn đã công bố: refresh token hiện được client lưu trong local/session storage; hướng production là HttpOnly Secure SameSite cookie kèm CSRF.

## 5. Vòng đời đơn hàng chuẩn

```text
VNPay: pending_payment → placed
COD:                     placed
placed → accepted → preparing → ready_for_pickup → delivering → delivered
```

| Chuyển trạng thái | Chủ thể | Quy tắc |
|---|---|---|
| Tạo `pending_payment`/`placed` | Khách | Server tính lại giá, voucher, phí và quyền sở hữu giỏ |
| `placed → accepted` | Nhà hàng | Chỉ nhà hàng sở hữu đơn |
| `accepted → preparing` | Nhà hàng | Không được bỏ bước |
| `preparing → ready_for_pickup` | Nhà hàng | Đánh dấu món sẵn sàng |
| `ready_for_pickup → delivering` | Nhà hàng | Nhà hàng bắt đầu tự giao/thuê ngoài |
| `delivering → delivered` | Khách/hệ thống | Khách xác nhận; hệ thống có thể tự hoàn tất sau thời gian chờ |
| Hủy/override | Khách, nhà hàng hoặc Admin tùy mốc | Kiểm tra trạng thái, lý do, thanh toán và audit |

`picked_up` chỉ được đọc để tương thích lịch sử. Tracking và Merchant Orders cập nhật **gần thời gian thực bằng polling**, không phải WebSocket.

## 6. Checkout, vận chuyển và voucher

### Checkout an toàn

Backend không tin tổng tiền gửi từ browser. Trong transaction, hệ thống khóa/đọc lại giỏ và tái kiểm tra:

1. Khách, địa chỉ và quyền sở hữu.
2. Quán đang hoạt động/mở cửa và trong phạm vi phục vụ.
3. Món còn bán, còn hàng, đúng quán; giá hiện tại được dùng làm snapshot.
4. Voucher đúng phạm vi, còn hạn, đạt đơn tối thiểu, quota tổng và giới hạn mỗi khách.
5. Phí giao và tổng tiền.

`Idempotency-Key` làm cho retry checkout trả lại cùng kết quả thay vì sinh đơn trùng.

### Phí giao

- Nếu có `ORS_API_KEY`, backend gọi OpenRouteService để lấy quãng đường lái xe và thời gian.
- Nếu ORS gián đoạn nhưng hai đầu có tọa độ, hệ thống ước lượng khoảng cách đường từ Haversine × 1,3.
- Công thức hiện tại: `min(50.000, 15.000 + ceil(km) × 5.000)`; phạm vi tối đa 12 km.
- ORS geocode địa chỉ nhập; Nominatim reverse-geocode vị trí hiện tại.

### Voucher

Voucher có thể do sàn hoặc quán phát hành, giảm phần trăm hoặc số tiền cố định; có mức giảm tối đa, đơn tối thiểu, thời gian, quota và giới hạn mỗi người. Server mới là nơi quyết định voucher hợp lệ và số tiền giảm.

## 7. Thanh toán, tiền và đối soát

- COD tạo đơn `placed`, tiền chưa thu tại thời điểm checkout.
- VNPay tạo đơn `pending_payment`, redirect tới sandbox; Return phục vụ giao diện, IPN/verify và chữ ký là bằng chứng cập nhật thanh toán.
- Đơn VNPay chưa được xác nhận sau 30 phút chuyển `expired`; hệ thống không tự hủy đơn đã thanh toán cần refund.
- Hủy đơn và hoàn tiền là hai quy trình riêng. Không được tuyên bố đã refund trước khi gateway xác nhận.

Công thức:

```text
total_amount = subtotal + delivery_fee - discount_amount
merchant_billable_subtotal = subtotal - merchant_funded_discount
platform_commission = floor(merchant_billable_subtotal × commission_rate / 100)
merchant_earning = merchant_billable_subtotal - platform_commission
platform_fee = platform_commission + delivery_fee
```

Voucher do sàn tài trợ không làm giảm `merchant_earning`. Tất cả tiền dùng số nguyên VND. Khi đơn hoàn tất, giao dịch ví tạo dấu vết; nhà hàng chỉ yêu cầu rút không vượt số dư khả dụng, Admin duyệt/từ chối payout và lưu tham chiếu ngoài.

## 8. Cụm dữ liệu cần nhớ

| Cụm | Bảng chính | Ý nghĩa |
|---|---|---|
| Danh tính | `users`, `user_roles`, `refresh_tokens`, `otp_codes`, `registration_pending` | Tài khoản, role, phiên và OTP |
| Khách hàng | `customer_profiles`, `customer_addresses`, `carts`, `cart_items` | Hồ sơ, địa chỉ và giỏ persistent |
| Nhà hàng | `restaurants`, `restaurant_address_change_requests`, `menu_categories`, `menu_items`, `cuisines` | Hồ sơ và catalog |
| Đơn | `orders`, `order_items`, `order_status_logs`, `order_checkout_idempotency` | Snapshot, state machine và retry |
| Thanh toán | `payments`, `payment_refunds`, `vouchers`, `voucher_redemptions` | Thu tiền, hoàn tiền, ưu đãi |
| Tài chính | `wallets`, `wallet_transactions`, `payout_requests`, `platform_config` | Doanh thu, hoa hồng, rút tiền |
| Tương tác | `reviews`, `notifications`, `conversations`, `chat_messages` | Hậu mãi và trao đổi |
| Quản trị | `audit_logs`, `home_page_settings`, `home_promo_banners`, `uploaded_assets` | Audit, nội dung và ảnh |

`orders` và `order_items` lưu snapshot địa chỉ, món, giá, phí và voucher tại thời điểm đặt. Vì thế thay giá món sau này không làm sai hóa đơn cũ.

## 9. Bản đồ chức năng toàn hệ thống

### Công khai và khách hàng

| Trang | Chức năng và nguồn chính |
|---|---|
| `/`, `/faq`, trang pháp lý | Nội dung giới thiệu, hợp tác và điều khoản; route công khai |
| Auth | `auth.routes.js`; `users`, `user_roles`, `otp_codes`, `registration_pending`, `refresh_tokens` |
| `/app` | Home API; cuisines, banners, restaurants, menu items, vouchers và lịch sử đặt lại |
| `/app/search` | Tìm món/quán; bộ lọc vị trí, giá, cuisine, rating |
| Restaurant/dish/reviews | Restaurant/menu/review API; lưu voucher; trạng thái mở và bán |
| Profile/address/settings | Me API; hồ sơ, Cloudinary avatar, đổi mật khẩu, logout mọi thiết bị |
| Promotions/notifications | Voucher đã lưu/ẩn và thông báo theo user |
| `CartDrawer` | Cart API; một giỏ active/một quán, số lượng, ghi chú, persistent DB |
| Checkout/result/success | Orders, shipping, voucher, VNPay và snapshot |
| Orders/tracking | Danh sách, lọc/tìm, hủy, đặt lại, polling và xác nhận nhận |
| Chat/reviews | Hội thoại theo đơn; polling tin nhắn; đánh giá quán/món và sửa một lần |

### Nhà hàng

| Trang | Chức năng và nguồn chính |
|---|---|
| Onboarding/pending | Nộp hồ sơ, ảnh, ngân hàng; xem pending/rejected/suspended |
| Dashboard | KPI, biểu đồ theo khoảng ngày, món bán chạy |
| Orders | Kanban, polling, transition hợp lệ, hủy có lý do |
| Menu | CRUD/sắp xếp/ẩn danh mục; CRUD, tồn kho, trạng thái, ảnh món |
| Promotions | CRUD voucher phạm vi quán |
| Reviews | Lọc đánh giá quán/món, phản hồi |
| Wallet | Số dư, giao dịch, payout |
| Settings | Hồ sơ, giờ mở, trạng thái mở cửa, ngân hàng, yêu cầu đổi địa chỉ |
| Notifications/chat | Thông báo theo user và hội thoại thuộc đơn của quán |

### Admin

| Trang chính | Chức năng và nguồn chính |
|---|---|
| `/admin` | KPI GMV, hoa hồng, đơn, tài khoản, nhà hàng theo khoảng ngày |
| Orders | Tra cứu, export CSV, xem chi tiết, hủy/override ngoại lệ có lý do |
| Restaurants | Duyệt/từ chối, tạm khóa/mở, duyệt yêu cầu đổi địa chỉ |
| Accounts | Lọc/export, khóa tạm/vĩnh viễn, mở khóa, đặt lại mật khẩu |
| Promotions | CRUD voucher toàn sàn và giám sát voucher quán |
| Reviews | Lọc/export, ẩn/khôi phục nội dung vi phạm |
| Financial | Báo cáo/export và tab payout |
| Content | Tab home/banner và cuisine; CRUD/sắp xếp |
| System | Tab config và audit logs |
| Notifications/chat | Thông báo quản trị và hỗ trợ theo ngữ cảnh |

Các URL cũ `/admin/payouts`, `/admin/customer-home`, `/admin/cuisines`, `/admin/config`, `/admin/audit-logs` chỉ redirect đến tab trong trang chính.

## 10. Chất lượng, triển khai và giới hạn

Bằng chứng release gần nhất: client 13 test; server 55 test; lint/build pass; dependency audit 0 vulnerability; smoke ba vai trò pass và truy cập chéo trả 403. Backup rehearsal có 38 bảng/1.124 dòng. Đây là **release candidate có giới hạn đã biết**, không phải cam kết SLA production.

Triển khai: frontend Vercel cần `VITE_API_URL`; backend Railway cần `MYSQL_URL`, `JWT_SECRET`, `CORS_ORIGIN`, cấu hình VNPay/SMTP/Cloudinary/ORS. Import `nomnom.sql` vào database mới hoặc đã backup vì dump có `DROP TABLE IF EXISTS`.

Các giới hạn cần nói trung thực: polling thay WebSocket; refresh token chưa ở HttpOnly cookie; worker expiry chung web process; refund timeout cần Admin đối soát; browser automation chưa bao phủ mọi trang; VNPay và dịch vụ bản đồ phụ thuộc mạng/credential.

## 11. Ma trận bàn giao giữa 6 người

| Người | Phải nắm sâu | Phải hiểu để nối flow |
|---|---|---|
| 1 – Ong Tuấn Nghĩa | Phạm vi, landing, auth, home, search | Giỏ tạo đầu vào cho checkout |
| 2 – Nguyễn Thị Như Ngọc | Restaurant/dish, profile, địa chỉ, voucher, cart | Điều kiện địa chỉ/giỏ cho Người 3 |
| 3 – Trần Minh Được | Checkout, shipping, voucher validation, COD/VNPay | Đơn tạo ra cho Người 4 và Merchant |
| 4 – Hồ Minh Nhật | Orders, tracking, chat, nhận hàng, reviews | Trạng thái do Merchant tạo; review quay lại Merchant |
| 5 – Nguyễn Văn Dĩ Khang | Onboarding, dashboard, menu, orders, settings | Doanh thu/payout chuyển Admin |
| 6 – Nguyễn Công Ben | Admin, tài chính, nội dung, audit, kiến trúc/deploy | Tổng kết tính nhất quán toàn hệ thống |

## 12. Câu trả lời ngắn bắt buộc ai cũng biết

1. **Vì sao bỏ tài xế?** Thu hẹp phạm vi để hoàn thiện sâu ba vai trò; nhà hàng tự giao/thuê ngoài, NomNom không giả vờ có marketplace tài xế.
2. **Ai tính tiền?** Backend; frontend chỉ hiển thị.
3. **Chống đặt trùng thế nào?** Transaction và `Idempotency-Key`.
4. **Realtime bằng gì?** Polling 3–5 giây, nên gọi là gần thời gian thực.
5. **Vì sao lưu snapshot?** Giữ đúng hóa đơn lịch sử dù món/địa chỉ/voucher thay đổi.
6. **Ai kết thúc giao hàng?** Khách xác nhận nhận; hệ thống có timeout dự phòng.
7. **Hủy có đồng nghĩa refund?** Không; refund phải có kết quả gateway/đối soát.
8. **Dữ liệu có phải dữ liệu thật?** Là dữ liệu seed tổng hợp, an toàn, có tính thực tế và mốc thời gian phù hợp; không dùng dữ liệu cá nhân thật.
9. **Nếu mất mạng?** Demo COD/video offline; không sửa nóng hoặc tuyên bố VNPay thành công khi chưa có xác nhận.
10. **NomNom đã production-ready tuyệt đối chưa?** Là release candidate đạt gate tự động và sẵn sàng demo/deploy sau preflight, còn các giới hạn đã công bố.

## 13. Tài liệu liên quan

- `docs/PRESENTATION_GUIDE.md`: kịch bản nói và demo.
- `docs/presentation/01-ong-tuan-nghia.md` … `06-nguyen-cong-ben.md`: cẩm nang cá nhân.
- `docs/analysis/usecase.md`, `docs/analysis/erd.md`: use case và ERD.
- `docs/decisions/ADR-001-three-role-delivery-model.md`: quyết định bỏ tài xế.
- `docs/DEMO_RUNBOOK.md`, `docs/RELEASE_RUNBOOK.md`: demo và vận hành.
- `docs/KNOWN_LIMITATIONS.md`: giới hạn phải công bố trung thực.
