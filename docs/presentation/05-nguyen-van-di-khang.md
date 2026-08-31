# Cẩm nang Người 5 — Nguyễn Văn Dĩ Khang

## Vai trò trong câu chuyện

Chứng minh nhà hàng có thể gia nhập, vận hành catalog và hoàn thành đơn trong mô hình không có tài xế nội bộ. Thời lượng mục tiêu 4 phút; demo sâu 4 màn hình, phần còn lại nói bằng inventory.

## Phải nắm sâu

| Phần | Logic/nghiệp vụ | Nguồn dữ liệu |
|---|---|---|
| Onboarding/pending | User đăng nhập nộp hồ sơ/ảnh/ngân hàng; Admin duyệt; pending/rejected/suspended | Merchant/Uploads APIs; users, restaurants, assets |
| Dashboard | KPI/doanh thu/đơn/món bán chạy theo khoảng ngày | Merchant dashboard; orders/items/payments |
| Menu | CRUD/sắp xếp/ẩn danh mục; CRUD món, giá, tồn, featured, ảnh | categories/menu items/uploads |
| Orders | Polling; chỉ đơn của quán; transition đúng thứ tự; từ chối/hủy có lý do | merchant orders; orders/status logs/notifications |
| Promotions/reviews | CRUD voucher của quán; lọc và reply review | vouchers/redemptions/reviews |
| Wallet | Số dư, pending, earned/withdrawn, lịch sử và yêu cầu payout | wallets, transactions, payout requests |
| Settings | Hồ sơ, min order/prep time, ngân hàng, giờ và mở cửa; địa chỉ phải gửi yêu cầu duyệt | restaurants, address change requests |
| Notifications/chat | Thông báo đúng owner; chat với khách theo order | notifications, conversations/messages |

## Kịch bản demo

1. Dùng slide tóm tắt onboarding → Admin duyệt; không nộp hồ sơ thật trong buổi demo.
2. Mở Dashboard và giải thích KPI lấy từ orders/payments.
3. Mở Menu: trạng thái hết hàng/ẩn và quản lý danh mục; không tạo/xóa dài dòng.
4. Mở Orders, xử lý một đơn: nhận → chuẩn bị → sẵn sàng → bắt đầu giao.
5. Mở Wallet để nối `delivered` với doanh thu; nói nhanh promotions/reviews/settings.

## Quy tắc bắt buộc

- Nhà hàng chỉ xử lý đơn/tài nguyên thuộc quán; middleware và query ownership cùng bảo vệ.
- Không được bỏ bước trạng thái hoặc sửa đơn `delivered/cancelled` như luồng thường.
- `ready_for_pickup → delivering` nghĩa là nhà hàng bắt đầu giao/tổ chức giao, không bàn giao cho tài xế NomNom.
- Thay đổi địa chỉ ảnh hưởng quote nên phải qua yêu cầu Admin; đóng/mở cửa có thể cập nhật vận hành nhanh.
- Payout không vượt available balance; số dư pending không rút được.

## Câu hỏi phản biện

- **Vì sao có Kanban?** Ánh xạ trực tiếp state machine, giảm bỏ sót đơn và giúp thao tác theo giai đoạn.
- **Ai giao hàng?** Nhà hàng hoặc đối tác họ thuê; NomNom chỉ quản lý trạng thái/phí.
- **Vì sao địa chỉ cần duyệt?** Nó ảnh hưởng phạm vi, phí, khách hàng và tính tin cậy hồ sơ.
- **Doanh thu quán khi voucher sàn?** Không bị trừ phần sàn tài trợ; công thức dùng snapshot funding/commission.

## Biết sơ lược phần còn lại

Phải hiểu giỏ một quán, checkout snapshot/idempotency và customer confirm delivery. Người 6 duyệt hồ sơ/địa chỉ/payout và audit hành động nhạy cảm.

## Câu chuyển giao

“Nhà hàng đã hoàn thành trách nhiệm vận hành và tạo doanh thu. Công Ben sẽ cho thấy Admin kiểm soát toàn sàn, duyệt payout, lưu audit và tổng kết kiến trúc, chất lượng triển khai.”
