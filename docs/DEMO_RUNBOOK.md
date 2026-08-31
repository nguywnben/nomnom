# Kịch bản demo NomNom — 8 đến 12 phút

## Chuẩn bị trước khi vào phòng

- Chạy backup và quality gate theo `RELEASE_RUNBOOK.md`.
- Mở sẵn API, client và ba cửa sổ riêng cho Admin, Khách hàng, Nhà hàng.
- Dùng dữ liệu demo riêng; không chỉnh các đơn mẫu dùng cho biểu đồ báo cáo.
- Chọn COD làm luồng chính. VNPay sandbox chỉ trình bày khi preflight thành công.
- Chuẩn bị video quay màn hình và ảnh ERD offline phòng khi mất mạng.

## Trình tự trình bày

### 0:00–1:00 — Bài toán và phạm vi

Giới thiệu NomNom là nền tảng đặt món ba vai trò. Nêu rõ nhà hàng chịu trách nhiệm tự giao hoặc
thuê đối tác ngoài; NomNom quản lý vòng đời đơn, thanh toán, đối soát và ngoại lệ.

### 1:00–4:00 — Khách hàng đặt món

1. Vào trang chủ, tìm quán và xem trạng thái mở cửa/phạm vi giao.
2. Chọn món, thay đổi số lượng và mở giỏ hàng.
3. Tại checkout, chỉ ra địa chỉ, phí giao, voucher, tổng tiền và ETA trước khi đặt.
4. Đặt đơn COD; nhấn một lần và giải thích idempotency ngăn tạo đơn trùng.
5. Mở lịch sử/tracking để thấy trạng thái mới.

### 4:00–6:30 — Nhà hàng hoàn tất đơn

1. Đăng nhập cổng Nhà hàng, mở bảng đơn và chọn đơn vừa tạo.
2. Thực hiện tuần tự: nhận đơn → chuẩn bị → sẵn sàng → bắt đầu giao.
3. Giải thích hệ thống khóa transition, không cho bỏ bước hoặc sửa đơn của quán khác.
4. Mở ví/doanh thu và trình bày công thức commission, voucher và phí giao.

### 6:30–7:30 — Khách hàng xác nhận

Khách hàng xác nhận đã nhận món, sau đó mở đánh giá. Nhấn mạnh khách là chủ thể kết thúc
luồng giao trong mô hình ba vai trò.

### 7:30–9:30 — Admin và xử lý ngoại lệ

1. Mở overview, danh sách nhà hàng và đơn hàng.
2. Cho thấy action nguy hiểm cần lý do và được ghi audit log.
3. Trình bày refund theo ba trạng thái: chờ đối soát, thành công, thất bại.
4. Không gọi refund thật trong demo nếu VNPay sandbox chưa được preflight.

### 9:30–11:00 — Kiến trúc và bằng chứng chất lượng

Trình bày ERD/use case, transaction checkout, idempotency key, authorization và quality gate.
Nêu kết quả test, build, dependency audit, backup và rollback.

## Phương án dự phòng

- API không lên: dùng video offline và ERD, không sửa nóng trong phòng.
- VNPay lỗi: chuyển sang COD và giải thích sandbox phụ thuộc dịch vụ ngoài.
- Dữ liệu demo lệch: dừng thao tác ghi, dùng snapshot/backup đã duyệt.
- Trình duyệt lỗi cache: mở cửa sổ riêng tư hoặc dùng artifact build đã đóng băng.

## Câu hỏi dự kiến: Vì sao bỏ Tài xế?

Trả lời: nhóm thu hẹp phạm vi để hoàn thiện sâu chuỗi đặt món–nhà hàng–quản trị. Giao hàng vẫn
được thực hiện bởi nhà hàng hoặc đối tác ngoài, nhưng NomNom không tuyên bố cung cấp marketplace
tài xế. Schema cũ được giữ ở trạng thái legacy để tránh migration phá hủy ngay trước bảo vệ.
