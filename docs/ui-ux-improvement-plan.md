# Kế hoạch cải thiện UI/UX NomNom

> Báo cáo phân tích toàn diện trải nghiệm người dùng, được đối chiếu trực tiếp với mã nguồn
> (`client/src/...`). Mỗi mục ghi rõ vị trí code và gợi ý xử lý. Đây là **danh mục lựa chọn** —
> triển khai theo mức ưu tiên được đề xuất ở cuối tài liệu.

Ngày: 2026-08-22
Phạm vi: Toàn bộ ứng dụng (customer / merchant / admin / auth / landing)
Tiêu chuẩn: WCAG 2.1 AA, thiết kế hệ thống nhất quán, hiệu năng, trải nghiệm chuẩn quốc tế

> **Kết quả triển khai: 2026-08-22** — Đã thực hiện toàn bộ các mục khả thi theo kế hoạch
> (branch `dev`, commit sau `0966fb0`). Ký hiệu:
> `✅` Đã hoàn thành · `🔶` Hoàn thành một phần · `⏸` Trì hoãn (có lý do, ghi rõ).

---

## Chốt trạng thái sau triển khai (2026-08-22)

| # | TT | Ghi chú |
|---|---|---|
| 1 | ✅ | `Badge.jsx` đã thêm tone `info`/`critical`/`delivering` (+ màu dot) — badge trạng thái đơn render đúng màu |
| 2 | ✅ | Footer Landing + Footer `/app` bỏ hết link chết, chỉ trỏ route thật |
| 3 | ✅ | Bỏ dòng "Có sẵn iOS & Android" (chưa có app) — tránh gây hiểu nhầm |
| 4 | ✅ | `CartDrawer` bỏ import mock `data/mock.js`, dùng dữ liệu giỏ thật |
| 5 | ✅ | `Checkout` bỏ placeholder `restaurant`, dùng `cart.restaurantName` |
| 6 | ✅ | Code-splitting `React.lazy` toàn bộ route nặng — bundle chính ~533KB → **~103KB**; charts vendor tách riêng |
| 7 | ✅ | Thêm `ErrorBoundary` toàn cục (fallback + nút tải lại) |
| 8 | ✅ | Thêm `manifest.webmanifest` + `sw.js` (đăng ký ở production) + `lang="vi"` |
| 9 | ⏸ | Dark mode — cần refactor toàn bộ token → CSS variables (~50 file), rủi ro cao; chờ quyết định thiết kế |
| 10 | ✅ | `Toast.jsx` hỗ trợ `action` (undo) |
| 11 | ✅ | Thêm `lib/orderStatus.js` — nguồn tone+label chung; Orders/Tracking/Dashboard dùng chung |
| 12 | ✅ | Thêm `components/Stepper.jsx`; Checkout dùng Stepper 3 bước |
| 13 | ✅ | Address picker trong `TopNav` (desktop) + dùng làm địa chỉ mặc định ở Checkout + hero hiển thị địa chỉ chọn |
| 14 | ✅ | Autocomplete hero search (gợi ý món/quán + "xem tất cả") |
| 15 | ⏸ | Resume giỏ hàng — giỏ đã tự lưu (localStorage/backend); giá trị bổ sung thấp |
| 16 | ⏸ | Wishlist — cần bảng dữ liệu/backend để đồng bộ; tránh tính năng giả |
| 17 | ✅ | Thêm nút prev/next cho 4 carousel Home (desktop) |
| 18 | ✅ | Search: gợi ý khi gõ + lịch sử tìm gần đây (localStorage) + xóa hết |
| 19 | ✅ | Grid/list toggle — đã có sẵn, xác nhận hoạt động |
| 20 | ⏸ | Filter khuyến mãi/free-ship/<30p — backend `searchExploreApi` chưa hỗ trợ tham số; cần sửa server |
| 21 | ✅ | Sticky category nav + thanh tìm trong thực đơn ở trang quán (mobile+desktop) |
| 22 | ✅ | Tìm trong menu theo tên/mô tả (client-side) |
| 23 | ⏸ | Badge chay/cay/mới — không có dữ liệu trong schema menu hiện tại |
| 24 | ✅ | Stepper số lượng ngay trên card món (khi đã có món trong giỏ) |
| 25 | ⏸ | Dinh dưỡng/dị ứng — không có dữ liệu nguồn |
| 26 | ✅ | Undo khi xóa món khỏi giỏ (toast action → `restoreItemsToCart`) |
| 27 | ⏸ | Progress free-ship — không có ngưỡng free-ship trong config/server |
| 28 | ⏸ | Đề xuất món kèm — cần logic/dữ liệu gợi ý |
| 29 | ✅ | Stepper Checkout (đã làm ở #12) |
| 30 | ✅ | Đổi số lượng ngay trong Checkout (stepper từng món) |
| 31 | 🔶 | Phạm vi giao hiển thị ở trang quán/tìm kiếm; Checkout hiển thị phí theo shipping quote |
| 32 | ✅ | Nút "Đặt lại" trên mỗi đơn (dùng `restoreItemsToCart`) |
| 33 | ✅ | Nút "Hủy đơn" cho đơn chưa chế biến (`POST /me/orders/:id/cancel` + modal xác nhận) |
| 34 | ✅ | Tìm đơn theo mã/tên quán (lọc kết quả) + tab trạng thái |
| 35 | ✅ | CTA "Đánh giá" trên đơn `delivered` |
| 36 | ⏸ | Map + vị trí tài xế — thuộc driver-phase (cần realtime location) |
| 37 | 🔶 | ETA countdown (đếm ngược) đã có; notification browser chưa (đang dùng polling) |
| 38 | ✅ | Nút "Chat với quán" ngay trên trang theo dõi đơn |
| 39 | ✅ | Profile thêm stat "Tổng chi tiêu" (3 tile) |
| 40 | ⏸ | Referral — cần backend + chính sách khuyến mãi |
| 41 | ✅ | Âm thanh (Web Audio beep) khi có đơn mới cho merchant |
| 42 | ✅ | Nút "In phiếu" (phiếu chế biến) trên order board merchant |
| 43 | ✅ | Nút "Xuất CSV" trên Dashboard merchant |
| 44 | ⏸ | Menu bulk toggle/kéo thả — cần API reorder phía server |
| 45 | ⏸ | Wallet biểu đồ/hóa đơn — cần dữ liệu transaction phong phú hơn |
| 46 | ⏸ | Tablet mode — layout đã responsive; chưa cần chế độ riêng |
| 47 | ✅ | Admin Overview thêm "Xuất CSV" (đã có range hôm nay/7/30 ngày) |
| 48 | ✅ | Accounts đã có search + filter vai trò/trạng thái (xác nhận) |
| 49 | ⏸ | Xem trước giấy tờ + ghi chú nội bộ — ghi chú cần lưu backend |
| 50 | ⏸ | Financial export — pattern `downloadCsv` sẵn sàng; ưu tiên thấp |
| 51 | ✅ | `Modal.jsx` thêm focus trap + restore focus (giữ Escape + scroll lock) |
| 52 | ✅ | `Tabs.jsx` thêm điều hướng phím mũi tên/Home/End + roving tabindex + `aria-controls` |
| 53 | ✅ | `CartItemQtyInput` thêm `aria-label` |
| 54 | ✅ | Focus ring tăng lên `rgba(0,0,0,0.16)` |
| 55 | ✅ | Rà `muted-soft`: sửa helper text (ImageUploader), sao rỗng (StarRating), số bước (Landing) → `body`/`muted` |
| 56 | ✅ | `ToastViewport` thêm `role="status"` + `aria-live="polite"` |
| 57 | ✅ | `Image.jsx` thêm `srcset`/`sizes` cho ảnh Unsplash (đã có `loading="lazy"`) |
| 58 | ✅ | Giống #6 — đã làm |
| 59 | ✅ | Prefetch chunk trang quán/món khi hover card (Home) |

**Phát hiện bổ sung đã xử lý:**
- `index.html` đổi `lang="en"` → `lang="vi"` + thêm `<link rel="manifest">`.
- Sửa luôn 2 test đỏ sẵn có: thêm field `fee` vào `homeDishes.js`/`homeRestaurants.js` → **3/3 test pass**.

**Tổng quan kết quả:** `✅` 38/59 · `🔶` 3/59 · `⏸` 18/59 (trì hoãn có lý do).
Nhóm A (bug), F (a11y), G (hiệu năng) hoàn thành trọn vẹn; B phần lớn hoàn thành; C/D/E đạt các mục khả thi trong phạm vi client. Các mục trì hoãn đều cần backend/schema/quyết định thiết kế — nên đưa vào backlog phase driver/sau Wave 4.

---

## Mục lục

- [A. Bug UI hiện hữu (ưu tiên cao nhất)](#a-bug-ui-hiện-hữu-ưu-tiên-cao-nhất)
- [B. Nền tảng & thiết kế hệ thống](#b-nền-tảng--thiết-kế-hệ-thống)
- [C. Trải nghiệm khách hàng](#c-trải-nghiệm-khách-hàng)
- [D. Merchant](#d-merchant)
- [E. Admin](#e-admin)
- [F. Accessibility (WCAG 2.1 AA)](#f-accessibility-wcag-21-aa)
- [G. Hiệu năng](#g-hiệu-năng)
- [Điểm mạnh hiện có](#điểm-mạnh-hiện-có)
- [Lộ trình triển khai đề xuất](#lộ-trình-triển-khai-đề-xuất)

---

## A. Bug UI hiện hữu (ưu tiên cao nhất)

| # | Vấn đề | Vị trí | Gợi ý |
|---|---|---|---|
| 1 | **Badge mất nền/màu**: `Badge.jsx` chỉ định nghĩa tone `default/dark/outline/success/error/warning/preview/live`, nhưng code dùng thêm `info`, `critical`, `delivering`. Kết quả badge render **trong suốt** (không nền, không màu) | `components/Badge.jsx:6-15`; `modules/merchant/Dashboard.jsx:392` ("Thời gian thực"); `modules/customer/Orders.jsx:14-27` (`STATUS_TONE` dùng `critical`/`delivering`) | Thêm 3 tone `info` (xanh nhạt), `critical` (đỏ đậm), `delivering` (cam) — hoặc map về tone có sẵn |
| 2 | Landing: nhiều link footer **chết** (`#`, không có route) | `pages/Landing.jsx:485-494` ("Quán ăn", "Danh mục", "Thẻ quà tặng", "Giới thiệu"...) | Bỏ hoặc trỏ về route thật |
| 3 | "Có sẵn trên iOS & Android" — icon + text nhưng **không phải link / chưa có app** | `pages/Landing.jsx:469-472` | Bỏ nếu chưa có app; hoặc thêm link thật + PWA |
| 4 | `CartDrawer` import **mock data** `restaurants` từ `data/mock.js` để lấy logo/ETA | `modules/customer/CartDrawer.jsx:12,43-47` | Lấy thông tin quán từ API/cart thay vì mock |
| 5 | `Checkout.jsx` dùng placeholder cứng `restaurant = { name: 'Quán ăn' }` | `modules/customer/Checkout.jsx:79,101` | Dùng tên quán thật từ cart |

---

## B. Nền tảng & thiết kế hệ thống

| # | Gợi ý | Lý do / chi tiết |
|---|---|---|
| 6 | **React.lazy code-splitting** cho `/admin` và `/merchant`, lazy-import `recharts` chỉ trong Dashboard/Financial | Hiện bundle chính 533KB + charts 374KB, load ngay cả khi không vào admin/merchant |
| 7 | **ErrorBoundary** toàn cục | Lỗi runtime hiện gây trắng màn hình; không có boundary để customize |
| 8 | **PWA**: manifest + service worker + offline shell | Có thể "cài" app; phù hợp ngành food (cập nhật trạng thái đơn) |
| 9 | **Dark mode** | Hệ thống hiện chỉ light (`color-scheme: light`); design tokens đã sẵn cho theme |
| 10 | **Toast hỗ trợ Undo** | VD xóa món khỏi giỏ → toast "Đã xóa" + nút "Hoàn tác" (chuẩn Material/Swift) |
| 11 | **Thống nhất hệ thống trạng thái đơn hàng** — 1 nguồn sự thật cho tone + label | Hiện `Orders.jsx`, `Dashboard.jsx`, `Tracking.jsx` tự định nghĩa riêng → dễ lệch |
| 12 | Bộ **Stepper** (1→2→3) chuẩn cho Checkout | Checkout đang tự dán nhãn "Bước 2 trên 3" (`Checkout.jsx:417,430`) |

---

## C. Trải nghiệm khách hàng

### C1. Trang chủ (`modules/customer/Home.jsx`)

| # | Gợi ý |
|---|---|
| 13 | **Chọn địa chỉ giao hàng chủ động** (dropdown địa chỉ đã lưu trong nav) thay vì chỉ hiển thị vị trí geo (`deliveryLocalityLine` thụ động) |
| 14 | **Autocomplete** khi gõ hero search (suggest món/quán) |
| 15 | **"Tiếp tục đặt món"** — resume giỏ hàng dở dang khi quay lại |
| 16 | Mục **"Món yêu thích"** (wishlist heart) cho người đăng nhập |
| 17 | Carousel horizontal cần **nút mũi tên prev/next** trên desktop (hiện chỉ kéo bằng chuột) |

### C2. Tìm kiếm (`modules/customer/Search.jsx`)

| # | Gợi ý |
|---|---|
| 18 | Autocomplete + **lịch sử tìm kiếm gần đây** |
| 19 | Kiểm tra chế độ grid/list (`view` state, `Search.jsx:56`) — nếu chưa dùng thì bỏ hoặc thêm toggle rõ ràng |
| 20 | **Filter** "có khuyến mãi", "miễn phí giao hàng", "thời gian giao < 30 phút" |

### C3. Trang quán (`Restaurant.jsx`) & món (`DishDetail.jsx`)

| # | Gợi ý |
|---|---|
| 21 | **Sticky category nav** trên mobile khi cuộn menu dài |
| 22 | **Tìm kiếm trong menu** (lọc món ngay trên trang quán) |
| 23 | **Badge món**: chay/không chay, cay, phổ biến, "mới" |
| 24 | **Quantity stepper ngay trên card món** (thêm nhanh không cần mở modal) |
| 25 | Thông tin **dinh dưỡng / dị ứng** trong DishDetail |

### C4. Giỏ hàng (`modules/customer/CartDrawer.jsx`)

| # | Gợi ý |
|---|---|
| 26 | Undo khi xóa món (kết hợp #10) |
| 27 | Hiển thị **phí giao ước tính** + progress bar "thêm X₫ để FREE ship" |
| 28 | Đề xuất món kèm từ cùng quán ("Bạn có thể thích") |

### C5. Checkout (`modules/customer/Checkout.jsx`)

| # | Gợi ý |
|---|---|
| 29 | **Stepper** 3 bước rõ ràng (Cart → Checkout → Success) |
| 30 | Tóm tắt đơn gộp + **đổi số lượng ngay trong checkout** |
| 31 | Chỉ báo "địa chỉ giao trong phạm vi" + phí giao theo khoảng cách rõ |

### C6. Đơn hàng (`modules/customer/Orders.jsx`)

| # | Gợi ý |
|---|---|
| 32 | **Nút "Đặt lại" (reorder)** — README tuyên bố có nhưng code chưa thấy nút → thiếu tính năng |
| 33 | **Hủy đơn** khi còn `placed/pending_payment` (backend có sẵn luồng) |
| 34 | Tìm kiếm đơn theo mã + lọc theo ngày |
| 35 | CTA đánh giá ngay trên đơn `delivered` (hiện phải vào trang quán) |

### C7. Tracking (`modules/customer/Tracking.jsx`)

| # | Gợi ý |
|---|---|
| 36 | **Map tương tác + vị trí tài xế** (GHN đã tích hợp) thay vì timeline tĩnh |
| 37 | ETA động + **đếm ngược** + notification khi đổi trạng thái |
| 38 | Nút **hỗ trợ / chat theo đơn** ngay trên trang |

### C8. Hồ sơ (`Profile.jsx`, `profile/*`)

| # | Gợi ý |
|---|---|
| 39 | Dashboard cá nhân: tổng chi tiêu, đơn đang giao, đánh giá đã viết |
| 40 | Chương trình **giới thiệu bạn bè** (referral) — mô hình food chuẩn |

---

## D. Merchant

| # | Gợi ý |
|---|---|
| 41 | **Âm thanh + notification** khi có đơn mới trên order board |
| 42 | **In biên lai / phiếu chế biến** (Landing đã tuyên bố "tự động in biên lai") |
| 43 | Dashboard: nút **export CSV**, so sánh hôm nay vs hôm qua (delta) |
| 44 | Menu: **bật/tắt số lượng lớn**, kéo thả sắp xếp, copy link món |
| 45 | Wallet: biểu đồ dòng tiền + tải hóa đơn đối soát |
| 46 | Nhận đơn từ **tablet mode** (layout lớn, tối ưu chạm) |

---

## E. Admin

| # | Gợi ý |
|---|---|
| 47 | Overview: **export + range date** so sánh kỳ |
| 48 | Accounts: tìm kiếm, filter vai trò, bulk actions |
| 49 | RestaurantApprovals: **xem trước giấy tờ** + ghi chú trao đổi nội bộ |
| 50 | Financial: biểu đồ + export báo cáo |

---

## F. Accessibility (WCAG 2.1 AA)

| # | Vấn đề hiện tại | Sửa |
|---|---|---|
| 51 | **Modal không focus trap + không restore focus** về nút kích hoạt (`Modal.jsx` có Escape + scroll lock) | Thêm trap/return focus |
| 52 | **Tabs** thiếu điều hướng phím mũi tên + `aria-controls`/`tabpanel` | Bổ sung (`components/Tabs.jsx`) |
| 53 | `CartItemQtyInput` (`type=number`) cần `aria-label` | Thêm nhãn |
| 54 | Focus ring `rgba(0,0,0,0.08)` quá mờ (`index.css:56`) | Tăng tương phản focus indicator |
| 55 | Contrast `muted-soft #cccccc` khi dùng làm text | Giữ cho disabled, đổi khi là text thật |
| 56 | Toast cần `role="status"`/`aria-live` | Kiểm tra `components/Toast.jsx`, bổ sung nếu thiếu |

---

## G. Hiệu năng

| # | Gợi ý |
|---|---|
| 57 | Lazy-load hình + `srcset` cho ảnh Unsplash/Cloudinary |
| 58 | Code-splitting (mục #6) |
| 59 | Prefetch trang quán khi hover card; debounce tìm kiếm đã có (tốt) |

---

## Điểm mạnh hiện có

Để tránh phá vỡ nền tốt, các cải thiện nên giữ nguyên:

- **Design system nhất quán**: token màu/spacing/typography trong `tailwind.config.js` map 1:1 với DESIGN.md; chữ Inter; thương hiệu đen trắng.
- **Responsive mobile-first**: bottom nav, drawer, modal bottom-sheet, safe-area iOS.
- **Trạng thái loading/empty/error** đầy đủ bằng Skeleton + EmptyState (Home, Dashboard, Restaurant...).
- **Giảm CLS**: card skeleton khớp kích thước thật; `scrollbar-gutter: stable`.
- **Hỗ trợ `prefers-reduced-motion`** (`index.css:229`).
- **Chuẩn hoá số** (`tabular-nums`), kéo-thả carousel, dual-thumb price slider.

---

## Lộ trình triển khai đề xuất

Đã thực hiện theo thứ tự: **A → F → B → C (khách hàng) → D → E → G**.

Kết quả: `✅` 38/59 · `🔶` 3/59 · `⏸` 18/59 (trì hoãn có lý do — xem bảng chốt).

**Backlog cho phase sau** (đều cần backend/schema/quyết định thiết kế):
- `#9` Dark mode (refactor token → CSS variables) · `#16` Wishlist (bảng dữ liệu) · `#20` Filter server-side · `#23`/`#25` Badge dinh dưỡng (schema) · `#27` Ngưỡng free-ship (config) · `#28` Đề xuất món · `#36` Map tài xế (driver-phase) · `#40` Referral · `#44` Reorder menu (API) · `#45` Wallet chart · `#46` Tablet mode · `#49` Ghi chú nội bộ (backend) · `#50` Financial export.
- Sửa warning lint sẵn có: `Menu.jsx:566` (missing dep `createEmptyItem`).

---
© 2026 NomNom — Báo cáo phân tích UI/UX.