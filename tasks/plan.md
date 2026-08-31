# Kế hoạch hoàn thiện NomNom trước báo cáo tốt nghiệp 03/09/2026

## 1. Mục tiêu và phạm vi chốt

Mục tiêu của đợt này là đưa NomNom từ trạng thái "đã hoàn thành chức năng" sang trạng thái
"có thể chứng minh ổn định, nhất quán và sẵn sàng trình bày". Đây là kế hoạch kiểm định và
hoàn thiện, không phải kế hoạch mở rộng tính năng.

Phạm vi sản phẩm cuối cùng chỉ gồm ba vai trò:

- **Khách hàng**: khám phá, đặt món, thanh toán, theo dõi, xác nhận nhận hàng, đánh giá và hỗ trợ.
- **Nhà hàng**: onboarding, quản lý quán/thực đơn, nhận và chuẩn bị đơn, tổ chức giao hàng,
  quản lý doanh thu/khuyến mãi và chăm sóc khách hàng.
- **Admin**: phê duyệt, giám sát, xử lý ngoại lệ/tranh chấp/hoàn tiền, đối soát và cấu hình.

### Quyết định nghiệp vụ đề xuất

Vì không còn vai trò Tài xế trong NomNom, mô hình giao hàng nên được diễn giải là
**nhà hàng tự giao hoặc sử dụng đối tác vận chuyển ngoài hệ thống**. NomNom chỉ quản lý
trạng thái giao nhận; không phân công, KYC, theo dõi vị trí, tính thu nhập hoặc quản lý ví tài xế.

Trách nhiệm cập nhật trạng thái đề xuất:

1. Nhà hàng: `placed -> accepted -> preparing -> ready_for_delivery -> delivering`.
2. Khách hàng: xác nhận `delivering -> delivered`.
3. Hệ thống: tự hoàn tất sau một khoảng chờ đã công bố, chỉ khi không có khiếu nại.
4. Admin: chỉ override khi xử lý ngoại lệ; mọi override phải có lý do và audit log.

Không nên xóa phá hủy các bảng Tài xế ngay trước ngày báo cáo. Trước 03/09, hãy khóa chúng
thành legacy/không sử dụng, loại khỏi UI, API công khai, seed demo, ERD và tài liệu phạm vi cuối.
Migration xóa vật lý chỉ thực hiện sau khi có backup, kiểm thử và buổi bảo vệ đã kết thúc.

## 2. Trạng thái thực thi có bằng chứng

| Hạng mục | Kết quả cuối ngày 31/08/2026 | Đánh giá |
|---|---:|---|
| Server unit/integration tests | 52 pass, 0 fail | Đạt gate hiện tại |
| Client unit tests | 3 pass, 0 fail | Quá ít so với quy mô UI |
| Server syntax check | 74 file pass | Đạt |
| Client production build | Pass, 701 module | Đạt |
| Client lint | 0 lỗi/cảnh báo | Đạt |
| API + DB demo | Health + smoke 3 role + quyền chéo pass | Đạt |
| Browser | Public/login 320–1440 px, console sạch | UI đăng nhập 3 role còn kiểm tra thủ công |
| Dependency audit | Client 0, server 0 vulnerability | Đạt |
| Tài liệu phạm vi | README/use case/ERD/legal/demo thống nhất 3 vai trò | Đạt |

Bằng chứng chi tiết nằm tại `docs/RELEASE_EVIDENCE_2026-08-31.md`. Các phát hiện dưới đây là
baseline ban đầu; P0/P1 đã xử lý hoặc được ghi fail-safe/accepted risk trong
`docs/KNOWN_LIMITATIONS.md`.

### Phát hiện ưu tiên

#### P0 — chặn phát hành/báo cáo

1. **Hoàn tiền không trung thực trong worker tự hủy.** Đơn VNPay đã trả tiền có thể bị worker
   đổi ngay thành `refunded` và gửi thông báo "đã hoàn lại" mà không gọi luồng refund VNPay.
   Trạng thái nội bộ có thể lệch tiền thật.
2. **Checkout chưa đủ an toàn.** Endpoint tạo đơn chỉ yêu cầu đăng nhập, chưa bắt buộc role
   `customer`; không khóa giỏ hàng và không có idempotency key nên có rủi ro tạo trùng đơn;
   không tái kiểm tra món còn bán/còn hàng và quán còn mở tại thời điểm chốt đơn.
3. **Mô hình ba vai trò chưa nhất quán.** Code, schema, seed, README, use case, ERD, điều khoản,
   thông báo và tên trạng thái vẫn còn nhiều dấu vết Tài xế. Hiện Admin đang thao tác thay Tài xế.
4. **Client không qua lint.** Có lỗi runtime tiềm tàng `Icon is not defined` tại Merchant Settings,
   cùng các import/state thừa và dependency React Hook chưa đúng.

#### P1 — rủi ro cao cần xử lý trong đợt hardening

5. Merchant đọc trạng thái đơn trước khi mở transaction và cập nhật không kèm điều kiện trạng thái;
   hai request đồng thời có thể ghi đè transition của nhau.
6. Chưa chốt ai hưởng phí giao hàng khi nhà hàng tự giao. Hiện `platform_fee` cộng toàn bộ phí giao,
   trong khi không có chi phí/thu nhập tài xế trong phạm vi ba vai trò.
7. Worker xử lý toàn bộ đơn quá hạn trong một transaction lớn, chạy trong process web và chưa có
   checkpoint/batch/lease rõ ràng. Đây là rủi ro khi restart hoặc chạy nhiều instance.
8. Chưa có test end-to-end cho ba hành trình chính, test concurrent checkout, test retry payment,
   test refund failure và test quyền chéo vai trò.
9. Upload delete chỉ yêu cầu đăng nhập; cần kiểm tra quyền sở hữu `publicId` trước khi cho xóa ảnh.
10. JWT access/refresh đang ở Web Storage; cần đánh giá rủi ro XSS, thời hạn token, rotation,
    revoke và chính sách đăng xuất khỏi mọi thiết bị.

#### P2 — chất lượng dài hạn

11. Nhiều file vượt 1.000 dòng (`admin.routes.js`, `merchant.routes.js`, `Menu.jsx`,
    `AppContext.jsx`, `Checkout.jsx`...), gây khó review và dễ tạo regression.
12. Polling chat/thông báo/tracking cần kiểm tra cleanup, backoff, tab ẩn và tải đồng thời.
13. Chưa có CI bắt buộc, kiểm thử trình duyệt, quan sát production, backup/restore rehearsal,
    accessibility audit và performance budget chính thức.

## 3. Nguyên tắc benchmark nghiệp vụ

NomNom không cần đạt feature parity với GrabFood/ShopeeFood trước ngày báo cáo. Chỉ áp dụng
các nguyên tắc công khai phù hợp với phạm vi đồ án:

- Đơn chỉ được xác nhận khi món còn khả dụng và địa chỉ còn nằm trong vùng phục vụ.
- Nhà hàng phải quản lý đúng giờ mở cửa, trạng thái tạm dừng và tình trạng hết món.
- Quyền hủy phụ thuộc mốc vòng đời đơn; sau khi bắt đầu chế biến không còn là thao tác hủy tự do.
- Hủy đơn, refund cho khách và bồi hoàn cho nhà hàng là ba khái niệm khác nhau.
- Mọi thay đổi giá, phí, voucher và doanh thu phải được snapshot và đối soát từ server.
- Mọi ngoại lệ tiền/đơn cần reason code, người thao tác, thời điểm và audit log.

Nguồn tham chiếu:

- GrabFood Terms: https://www.grab.com/vn/en/terms-policies/transport-delivery-logistics/
- Grab Merchant Terms: https://www.grab.com/vn/en/terms-policies/merchant-terms-and-conditions/
- Grab Merchant Code: https://www.grab.com/vn/en/terms-policies/code-of-conduct-merchant/
- ShopeeFood quản lý đơn: https://merchant.shopeefood.vn/edu/course/lam-quen-cac-cong-cu-ban-hang/quan-ly-don-hang
- ShopeeFood bồi hoàn đơn hủy: https://merchant.shopeefood.vn/edu/article/dieu-kien-hoan-tien-don-hang-huy

## 4. Dependency graph

```text
Chốt phạm vi 3 vai trò + chủ thể giao hàng
        |
        +--> State machine đơn + ma trận quyền
        |       |
        |       +--> Hủy/refund/voucher/ledger
        |       +--> UI tracking + thông báo + audit
        |
        +--> Thuật ngữ + tài liệu + ERD + dữ liệu demo

Release gate hiện tại
        |
        +--> Lint/runtime sạch
        +--> Checkout atomic/idempotent
        +--> Regression + E2E + browser matrix
                |
                +--> Demo rehearsal + go/no-go
```

## 5. Definition of Done toàn dự án

NomNom chỉ được coi là sẵn sàng báo cáo khi đồng thời đạt tất cả điều kiện sau:

- `npm test`, lint, production build và server syntax check đều exit code 0.
- Không còn lỗi Critical/P0 hoặc High/P1 chưa có quyết định chấp nhận rủi ro bằng văn bản.
- Ba vai trò đi hết được hành trình chính trên dữ liệu demo sạch ở mobile và desktop.
- Tạo đơn lặp/đồng thời không tạo trùng; server luôn là nguồn tính giá cuối cùng.
- Không bao giờ hiển thị `refunded` trước khi cổng thanh toán xác nhận; lỗi refund có trạng thái
  `refund_pending`/`refund_failed` hoặc tương đương và có đường xử lý lại.
- Mọi transition đơn trái phép hoặc trái role trả 403/409 và không thay đổi dữ liệu.
- Tài liệu, ERD, use case, điều khoản, seed demo và lời thuyết trình thống nhất chỉ ba vai trò.
- Có reset dữ liệu demo, backup DB, rollback release và checklist smoke trước buổi báo cáo.
- Không còn link chết, màn trắng, lỗi console nghiêm trọng hoặc nút không phản hồi trong luồng demo.

## 6. Kế hoạch triển khai theo task

### Phase A — Scope freeze và release gate

#### Task 1: Chốt hợp đồng sản phẩm ba vai trò

**Mô tả:** Lập bảng RACI và state machine duy nhất cho đặt món, giao hàng, hủy đơn,
refund, khiếu nại và ghi nhận doanh thu. Chốt rõ nhà hàng tự giao/thuê ngoài.

**Acceptance criteria:**

- [ ] Mỗi trạng thái có đúng một chủ thể được phép cập nhật và điều kiện chuyển tiếp.
- [ ] Có ma trận hủy/refund theo `order_status x payment_status x actor`.
- [ ] Chốt chính sách phí giao hàng và thời điểm ghi có ví nhà hàng.

**Verification:** Review 30 phút với cả nhóm; dùng 10 tình huống biên để walkthrough.

**Dependencies:** Không.

**Files likely touched:** `docs/analysis/usecase.md`, `docs/analysis/erd.md`, tài liệu báo cáo.

**Estimated scope:** M.

#### Task 2: Khôi phục release gate client

**Mô tả:** Xử lý 24 lint errors, 5 warnings; ưu tiên lỗi runtime và React Hook trước,
sau đó dọn import/state dead code. Không trộn với redesign.

**Acceptance criteria:**

- [ ] Merchant Settings không còn `Icon is not defined` và mở được bằng dữ liệu thật.
- [ ] Lint không lỗi/cảnh báo; các Hook không dùng closure cũ.
- [ ] Client tests và production build vẫn pass.

**Verification:** `npm run lint`, `npm test`, `npm run build`; smoke các màn đã sửa.

**Dependencies:** Không.

**Files likely touched:** Các file được ESLint liệt kê, chia thành PR nhỏ tối đa 3–5 file.

**Estimated scope:** M, phải chia theo module.

#### Task 3: Đồng bộ thuật ngữ và phạm vi ba vai trò

**Mô tả:** Loại mọi tuyên bố chức năng Tài xế khỏi phạm vi sản phẩm cuối; đổi copy
`tài xế lấy hàng` thành ngôn ngữ giao hàng trung lập/nhà hàng giao theo Task 1.

**Acceptance criteria:**

- [ ] Không có route/menu/CTA công khai cho Tài xế.
- [ ] README, overview, use case, ERD, legal pages và presentation đều nói ba vai trò.
- [ ] Schema/seed driver legacy được ghi rõ không thuộc runtime; không xóa vật lý trước báo cáo.

**Verification:** `rg -i "driver|tài xế|shipper|/driver"` chỉ còn trong archive/deprecation cho phép.

**Dependencies:** Task 1.

**Files likely touched:** Tách thành ba nhóm: docs, legal/copy UI, database seed/diagram.

**Estimated scope:** M mỗi nhóm.

### Checkpoint A

- [ ] Scope ba vai trò được team duyệt.
- [ ] Lint/test/build sạch.
- [ ] Không bắt đầu tính năng mới sau checkpoint.

### Phase B — Logic giao dịch và nghiệp vụ cốt lõi

#### Task 4: Làm checkout atomic và idempotent

**Mô tả:** Khóa giỏ hàng khi checkout; ép role customer; tái kiểm tra quán, giờ mở,
phạm vi giao, món active/in-stock, số lượng, giá và voucher trong cùng transaction.

**Acceptance criteria:**

- [ ] Merchant/Admin gọi create order bị 403.
- [ ] Hai request cùng idempotency key chỉ tạo một đơn; double-click UI không tạo trùng.
- [ ] Món hết hàng/quán đóng/giá đổi trả lỗi rõ ràng và không tạo dữ liệu dở dang.

**Verification:** Integration tests cho stale cart, cross-role, concurrent checkout và rollback.

**Dependencies:** Task 1.

**Files likely touched:** `orders.routes.js`, cart helper, schema idempotency, tests.

**Estimated scope:** M.

#### Task 5: Chuẩn hóa state machine đơn hàng ba vai trò

**Mô tả:** Thay driver-specific transition bằng merchant delivery flow; mọi transition
được kiểm tra và update atomically bằng `WHERE status = expected` hoặc row lock.

**Acceptance criteria:**

- [ ] Không thể bỏ bước, lùi bước hoặc gửi lặp làm sai trạng thái.
- [ ] Merchant chỉ sửa đơn thuộc quán; Admin override cần reason; khách chỉ xác nhận đơn mình.
- [ ] Log, timestamp và notification khớp đúng transition đã commit.

**Verification:** Table-driven state transition tests + hai request cạnh tranh cùng một đơn.

**Dependencies:** Task 1, Task 4.

**Files likely touched:** `merchantOrders.js`, merchant/admin/order routes, `orderStatus.js`, tests.

**Estimated scope:** M.

#### Task 6: Tách hủy đơn khỏi hoàn tiền

**Mô tả:** Xây refund state machine rõ ràng; không gán `refunded` hoặc thông báo đã hoàn
trước khi gateway xác nhận. Worker và Admin dùng cùng một service idempotent.

**Acceptance criteria:**

- [ ] Gateway timeout/fail không làm đơn giả vờ đã refund.
- [ ] Retry cùng request không hoàn hai lần; có request ID duy nhất và audit log.
- [ ] Voucher chỉ release/redeem một lần đúng theo kết quả cuối.

**Verification:** Tests success/failure/timeout/retry, paid COD/manual refund và worker cancellation.

**Dependencies:** Task 1, Task 5.

**Files likely touched:** Refund service, payment/admin routes, worker, tests.

**Estimated scope:** M; tách service trước, nối từng consumer sau.

#### Task 7: Chốt đối soát phí, voucher và ví nhà hàng

**Mô tả:** Viết công thức tiền duy nhất cho subtotal, delivery fee, platform/merchant voucher,
commission, merchant earning và platform revenue theo mô hình nhà hàng tự giao.

**Acceptance criteria:**

- [ ] Tổng các cấu phần luôn reconcile với số khách trả.
- [ ] `delivered` ghi có ví đúng một lần bằng unique business reference.
- [ ] Cancel/refund không tạo merchant earning; payout không vượt available balance.

**Verification:** Test COD/VNPay x voucher sàn/quán/không voucher x cancel/delivered.

**Dependencies:** Task 1, Task 6.

**Files likely touched:** Pricing/ledger helpers, order creation, merchant finance, tests.

**Estimated scope:** M.

#### Task 8: Làm worker an toàn và quan sát được

**Mô tả:** Chia worker thành job có batch, lease/lock, retry, timeout và log; tránh một
transaction chứa mọi loại tác vụ. Tách lifecycle khỏi web process nếu chạy nhiều instance.

**Acceptance criteria:**

- [ ] Restart/chạy hai instance không xử lý một đơn hai lần.
- [ ] Mỗi batch có giới hạn, số lượng xử lý, thời gian và lỗi được log.
- [ ] Có cách tắt worker ở demo và chạy manual recovery có audit.

**Verification:** Test idempotency/restart; chạy trên snapshot DB với job quá hạn mẫu.

**Dependencies:** Task 6, Task 7.

**Files likely touched:** `index.js`, worker module, config, tests.

**Estimated scope:** M.

### Checkpoint B

- [ ] Checkout, vòng đời đơn, refund và ledger pass happy path + edge path.
- [ ] Không còn Critical/P0 liên quan tiền hoặc dữ liệu.
- [ ] DB snapshot trước/sau mỗi scenario đối soát bằng 0 chênh lệch.

### Phase C — UI/UX theo từng hành trình

#### Task 9: Customer journey audit

**Mô tả:** Kiểm tra dọc từ home -> search -> restaurant -> cart -> checkout -> payment
-> tracking -> review trên 360/390/768/1440 px.

**Acceptance criteria:**

- [ ] Phí, ETA, quán đóng/hết món và điều kiện voucher hiển thị trước nút đặt hàng.
- [ ] Submit có loading/disabled/idempotent; lỗi giữ dữ liệu đã nhập và có retry.
- [ ] Tracking dùng thuật ngữ ba vai trò, không hứa map/vị trí tài xế không tồn tại.

**Verification:** Browser checklist + screenshot bốn breakpoint; COD và VNPay success/fail.

**Dependencies:** Task 3–7.

**Files likely touched:** Từng route customer, tối đa một vertical slice mỗi PR.

**Estimated scope:** M mỗi slice.

#### Task 10: Merchant journey audit

**Mô tả:** Kiểm tra onboarding -> open/pause -> menu/inventory -> receive/prepare/deliver
-> cancellation -> wallet/payout -> review/chat.

**Acceptance criteria:**

- [ ] Nút hành động chỉ xuất hiện ở state hợp lệ và có confirm cho thao tác mất dữ liệu/tiền.
- [ ] Đơn mới nổi bật, có SLA rõ, âm thanh không lặp; hết món/tạm đóng thao tác nhanh.
- [ ] Wallet phân biệt pending/available/reserved và giải thích thời điểm ghi nhận.

**Verification:** Browser checklist mobile/tablet/desktop với đơn mới, đơn lỗi và empty state.

**Dependencies:** Task 3, Task 5–8.

**Files likely touched:** Order board, settings, menu, wallet, shared components.

**Estimated scope:** M mỗi slice.

#### Task 11: Admin journey audit

**Mô tả:** Kiểm tra approval -> account -> order exception/refund -> finance/payout
-> review moderation -> config/audit log.

**Acceptance criteria:**

- [ ] Hành động nguy hiểm có reason, confirm, loading lock và kết quả audit.
- [ ] Refund hiển thị pending/succeeded/failed; không dùng nhãn thành công khi chưa chắc chắn.
- [ ] Filter/pagination/export dùng server data và không lộ thông tin nhạy cảm quá mức.

**Verification:** Browser checklist với admin demo và negative test bằng account thường.

**Dependencies:** Task 3, Task 5–8.

**Files likely touched:** Admin orders, financial, accounts, approvals, audit UI.

**Estimated scope:** M mỗi slice.

#### Task 12: Shared UX, accessibility và responsive

**Mô tả:** Rà loading/empty/error/success, keyboard, focus, contrast, touch target,
overflow, text dài, ảnh lỗi và mất mạng trên component dùng chung.

**Acceptance criteria:**

- [ ] Không có màn trắng; ErrorBoundary và retry đưa người dùng về trạng thái phục hồi được.
- [ ] Modal, tabs, form, toast dùng bàn phím; input có label và lỗi liên kết bằng ARIA.
- [ ] Không horizontal overflow ở 320 px; touch target tối thiểu 44x44 theo chuẩn nội bộ.

**Verification:** Keyboard-only, screen-reader smoke, zoom 200%, slow network và offline test.

**Dependencies:** Task 2, Task 9–11.

**Files likely touched:** Shared components; sửa theo component, không sửa hàng loạt page.

**Estimated scope:** M.

### Checkpoint C

- [ ] Ba journey có video/screenshot evidence.
- [ ] Không lỗi console/network bất ngờ trong luồng demo.
- [ ] Các trạng thái loading/empty/error đều đã được thử.

### Phase D — Security, performance, vận hành và báo cáo

#### Task 13: Security và quyền truy cập tối thiểu

**Mô tả:** Test authorization theo resource ownership, rate limit endpoint nhạy cảm,
upload ownership, token rotation/revoke, secrets/CORS và dữ liệu log.

**Acceptance criteria:**

- [ ] Bảng role x endpoint x own/other resource pass 401/403/404 đúng.
- [ ] Login/OTP/reset/upload/chat có rate limit; file được kiểm tra MIME thực.
- [ ] Không có secret/OTP/token/PII nhạy cảm trong repo hoặc log demo.

**Verification:** Negative tests, dependency audit có triage, secret scan và manual IDOR test.

**Dependencies:** Task 4–8.

**Files likely touched:** Auth, upload, logging/config, security tests.

**Estimated scope:** M; chia theo bề mặt tấn công.

#### Task 14: Performance và reliability budget

**Mô tả:** Đo trang customer chính, query list/dashboard, polling và API dưới tải demo.

**Acceptance criteria:**

- [ ] Target nội bộ: LCP <= 2,5s, CLS <= 0,1, INP <= 200ms trên profile mobile đã chọn.
- [ ] List API có limit/pagination; không có N+1 rõ ràng trong order/menu/dashboard.
- [ ] Polling dừng khi unmount/tab ẩn hoặc backoff khi lỗi; API có timeout/retry có kiểm soát.

**Verification:** Lighthouse/DevTools trace, query log, load smoke và bundle report.

**Dependencies:** Task 9–12.

**Files likely touched:** Từng hook/API query nóng; không tối ưu suy đoán toàn hệ thống.

**Estimated scope:** M.

#### Task 15: Bộ test phát hành và ma trận trình duyệt

**Mô tả:** Tạo smoke/E2E tối thiểu cho ba role và gom mọi gate vào một lệnh/CI.

**Acceptance criteria:**

- [ ] CI chạy client test/lint/build, server test/syntax và migration check.
- [ ] E2E có COD, VNPay callback giả lập, merchant fulfill, customer confirm,
  admin refund failure/success và authorization negative path.
- [ ] Pass Chrome desktop/mobile; smoke Edge và Firefox; lưu kết quả theo commit.

**Verification:** Chạy hai lần liên tiếp trên DB reset sạch; không test flaky.

**Dependencies:** Task 2–14.

**Files likely touched:** Test config/specs, CI workflow, seed/reset scripts.

**Estimated scope:** M.

#### Task 16: Demo data, tài liệu và diễn tập báo cáo

**Mô tả:** Chuẩn hóa DB demo, account, câu chuyện trình bày, backup/restore và rollback.

**Acceptance criteria:**

- [ ] Một lệnh reset tạo đủ dữ liệu ba role, không có driver trong câu chuyện demo.
- [ ] README/use case/ERD/slides khớp đúng UI và API đang chạy.
- [ ] Có demo 8–12 phút, phương án offline, video dự phòng và Q&A về việc bỏ driver.

**Verification:** Hai người khác nhau chạy demo từ máy sạch; diễn tập ít nhất hai lần.

**Dependencies:** Task 1–15.

**Files likely touched:** Demo seed, docs, presentation guide, deployment runbook.

**Estimated scope:** M.

### Final checkpoint — Go/No-Go

- [ ] Tag/commit demo đã đóng băng; DB backup và artifact build được lưu.
- [ ] Definition of Done đạt; accepted risk có owner và cách né trong demo.
- [ ] Rollback đã thử; không deploy sau 18:00 ngày 02/09 trừ lỗi P0.

## 7. Lịch ưu tiên đến 03/09/2026

### 31/08 — Chốt đúng sản phẩm

- Chốt Task 1, ma trận trạng thái/quyền/tiền; xử lý Task 2 và khóa tính năng.
- Bắt đầu Task 4 và Task 6 vì đây là rủi ro dữ liệu/tiền cao nhất.

### 01/09 — Đóng logic cốt lõi

- Hoàn tất Task 4–8 và regression tests; đồng bộ runtime/copy ba vai trò ở Task 3.
- Checkpoint B cuối ngày; nếu không pass thì dừng toàn bộ polish P2.

### 02/09 buổi sáng — UX và bằng chứng

- Chạy Task 9–12 theo ba luồng demo, chỉ sửa lỗi P0/P1.
- Security/performance smoke; hoàn thiện ERD/use case/slides ba vai trò.

### 02/09 buổi chiều — Đóng băng

- Full gate + E2E hai lần trên DB sạch; backup, build artifact, video và rehearsal.
- Sau 18:00: không refactor, không đổi schema, không thêm tính năng.

### 03/09 trước báo cáo

- Smoke health/login ba role/COD order bằng dữ liệu riêng.
- Kiểm tra VNPay, mạng, trình duyệt, máy chiếu và video offline.
- Nếu smoke fail, rollback artifact đã duyệt; không sửa nóng thiếu test.

## 8. Phân công song song cho nhóm sáu người

1. **BE Transaction:** checkout, state machine, concurrency.
2. **BE Finance/Security:** refund, voucher, ledger, payout, auth/upload.
3. **FE Customer:** hành trình đặt món và tracking.
4. **FE Merchant/Admin:** order board, refund/finance, responsive.
5. **QA:** test matrix, E2E, browser, evidence và bug triage.
6. **Docs/Demo:** three-role consistency, ERD/use case, seed, rehearsal và rollback.

Team Lead giữ quyền merge, dependency và go/no-go. Không để hai nhánh cùng sửa state
machine/finance contract trước khi Task 1 được merge.

## 9. Không làm trước buổi báo cáo

- Không thêm Driver, map realtime, WebSocket, wishlist, referral, dark mode hoặc native app.
- Không refactor toàn bộ file lớn chỉ để đẹp code; không xóa vật lý bảng driver sát deadline.
- Không đổi dependency hàng loạt; không dùng dữ liệu/secret thật trong slide, log hoặc video.
- Không đánh dấu pass chỉ vì build thành công; phải kiểm tra hành trình và dữ liệu sau giao dịch.

## 10. Rủi ro và giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Refund nội bộ lệch VNPay | Critical | Service idempotent, pending/fail, reconciliation |
| Tạo trùng đơn | Critical | Cart lock, idempotency key, unique constraint, disable double-submit |
| Ba-role nhưng còn driver | High | Scope freeze, content sweep, legacy deprecation note |
| Regression sát deadline | High | PR nhỏ, gate bắt buộc, freeze 02/09, rollback artifact |
| Demo phụ thuộc mạng/VNPay | High | COD path chính, sandbox preflight, video + DB local dự phòng |
| Dữ liệu demo lệch/treo | High | Reset script, DB snapshot, rehearsal từ trạng thái sạch |
| Test hiện quá ít | High | Ưu tiên E2E đường tiền/đơn/quyền thay vì coverage hình thức |
| File lớn khó sửa | Medium | Chỉ extract nơi cần cho P0; refactor rộng sau báo cáo |

## 11. Backlog sau báo cáo

- Migration loại bỏ hoàn toàn driver role/profile/assignment và các enum legacy.
- Tách route/service lớn; cân nhắc type/schema validation ở API boundary.
- HTTP-only refresh cookie + CSRF strategy nếu chuyển kiến trúc auth.
- Queue/cron độc lập, observability, alert và reconciliation dashboard.
- E2E/load/security testing rộng hơn và usability test với khách/nhà hàng thật.
