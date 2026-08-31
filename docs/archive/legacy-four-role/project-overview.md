# Phân tích Dự án NomNom — Premium Food Delivery Ecosystem

## Project Identity

- **Institution:** FPT Polytechnic
- **Project type:** Graduation Project
- **Team size:** 6 members
- **Team leader:** Nguyễn Công Ben
- **Team members:** Hồ Minh Nhật, Nguyễn Văn Dĩ Khang, Ong Tuấn Nghĩa, Trần Minh Được, Nguyễn Thị Như Ngọc

## 1. Tổng quan dự án
**NomNom** là một hệ sinh thái giao đồ ăn đa bên (multi-sided platform), được thiết kế để kết nối bốn nhóm đối tượng chính: Khách hàng, Nhà hàng, Tài xế và Quản trị viên. Dự án hướng tới trải nghiệm người dùng cao cấp (premium) với giao diện hiện đại, mượt mà và quy trình vận hành chặt chẽ.

### Mục tiêu chính:
- Cung cấp nền tảng đặt món ăn nhanh chóng, tiện lợi cho Khách hàng.
- Giúp Nhà hàng quản lý thực đơn và đơn hàng hiệu quả.
- Tối ưu hóa việc nhận đơn và giao hàng cho Tài xế.
- Cung cấp công cụ giám sát và quản lý tài chính toàn diện cho Quản trị viên.

---

## 2. Công nghệ sử dụng (Tech Stack)

### Frontend (Client)
- **Framework**: React.js với Vite (đảm bảo tốc độ build và runtime nhanh).
- **Styling**: Tailwind CSS (tối ưu hóa giao diện responsive và tùy biến cao).
- **Routing**: React Router v6.
- **State Management**: React Context API.
- **UI/UX**: Thiết kế theo phong cách editorial, sử dụng micro-animations để tăng cảm giác cao cấp.

### Backend (Server)
- **Runtime**: Node.js (đang trong kế hoạch phát triển).
- **Cơ sở dữ liệu**: MySQL (quan hệ), thiết kế theo mô hình monolithic relational.
- **Xác thực**: JWT (JSON Web Token) với cơ chế rotation và OTP qua Email/SĐT.

---

## 3. Cấu trúc thư mục dự án
Dự án được tổ chức theo mô hình Monorepo:
- `/client`: Chứa mã nguồn frontend React.
  - `/src/modules`: Chia theo vai trò (admin, customer, driver, merchant).
  - `/src/components`: Các thành phần giao diện dùng chung (UI kit).
- `/server`: Chứa mã nguồn backend (Node.js + Express + MySQL).
- `/database/nomnom.sql`: Script khởi tạo schema + seed.
- `/docs`: Tài liệu dự án (xem `docs/README.md`).
  - `/docs/analysis`: ERD, use case, tổng quan.
  - `/docs/planning`: Kế hoạch wave (`groups.txt`).

---

## 4. Các Module chức năng chính

### 4.1. Module Khách hàng (Customer)
- Tìm kiếm nhà hàng theo từ khóa, món ăn, vị trí.
- Quản lý giỏ hàng thông minh (cảnh báo khi đặt từ nhiều nhà hàng).
- Theo dõi đơn hàng theo thời gian thực (Real-time tracking).
- Đánh giá và nhận xét sau khi hoàn tất đơn hàng.

### 4.2. Module Nhà hàng (Merchant)
- Đăng ký và quản lý thông tin nhà hàng (địa chỉ, giờ mở cửa, ảnh banner).
- Quản lý thực đơn đa cấp (Danh mục -> Món ăn).
- Tiếp nhận và xử lý đơn hàng qua các trạng thái (Accepted -> Preparing -> Ready).
- Quản lý doanh thu và yêu cầu rút tiền (Payout).

### 4.3. Module Tài xế (Driver)
- Đăng ký đối tác và xác minh danh tính (KYC).
- Nhận đơn hàng theo cơ chế "ai đến trước nhận trước" (First-come-first-serve).
- Chụp ảnh xác nhận giao hàng thành công.
- Quản lý ví tài xế và lịch sử thu nhập.

### 4.4. Module Quản trị viên (Admin)
- Dashboard tổng quan về hoạt động của toàn hệ thống (GMV, số lượng đơn, người dùng).
- Duyệt hồ sơ nhà hàng và tài xế mới.
- Quản lý các yêu cầu rút tiền và đối soát tài chính.
- Cấu hình các tham số hệ thống (phí dịch vụ, hoa hồng).

---

## 5. Điểm nổi bật trong thiết kế Cơ sở dữ liệu
Hệ thống sử dụng 24 bảng được thiết kế chặt chẽ:
- **Snapshot dữ liệu**: Giá món ăn và địa chỉ giao hàng được lưu bản sao (snapshot) vào bảng `orders` và `order_items` để đảm bảo tính bất biến của dữ liệu lịch sử.
- **Hệ thống Ví (Wallet) & Sổ cái (Ledger)**: Sử dụng bảng `wallet_transactions` theo cơ chế append-only để ghi lại mọi biến động số dư, đảm bảo tính minh bạch và dễ dàng đối soát.
- **Xử lý Race Condition**: Sử dụng UNIQUE constraint trên bảng `driver_assignments` để đảm bảo một đơn hàng chỉ có duy nhất một tài xế nhận được tại một thời điểm.

---

## 6. Đánh giá UI/UX
- **Phong cách**: Hiện đại, sạch sẽ (clean design), tập trung vào hình ảnh món ăn để kích thích vị giác.
- **Trải nghiệm**: Các hiệu ứng hover, chuyển cảnh mượt mà. Localized hoàn toàn sang tiếng Việt với giọng văn gần gũi.
- **Responsive**: Tương thích tốt trên cả Mobile và Desktop, ưu tiên trải nghiệm "app-like" trên thiết bị di động cho Khách hàng và Tài xế.

---

## 7. Kết luận
NomNom là một dự án có quy mô hoàn chỉnh, từ việc phân tích Use Case, ERD cho đến việc triển khai giao diện và cấu trúc dữ liệu. Với thiết kế chú trọng vào tính chuyên nghiệp và khả năng mở rộng, đây là một nền tảng tiềm năng cho mô hình kinh doanh Delivery hiện đại.
