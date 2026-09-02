# Cẩm nang Người 6 — Nguyễn Công Ben

## Vai trò trong câu chuyện

Khép vòng quản trị, tài chính và kỹ thuật. Demo sâu các tab trọng tâm, dùng ma trận để xác nhận phần còn lại. Thời lượng mục tiêu 4 phút 30 giây.

## Phải nắm sâu

| Trang | Logic/nghiệp vụ | Nguồn dữ liệu |
|---|---|---|
| Overview | KPI theo khoảng ngày: GMV, phí/hoa hồng, đơn, user, restaurant | Admin overview; orders/payments/users/restaurants |
| Orders | Lọc/chi tiết/export; cancel/override ngoại lệ có lý do | orders/items/payments/status logs/audit |
| Restaurants | Duyệt/từ chối, tạm khóa/mở; yêu cầu đổi địa chỉ | restaurants, address requests, notifications, audit |
| Accounts | Role/status, export; khóa tạm/vĩnh viễn, mở, reset password | users/roles/refresh tokens/audit |
| Promotions | CRUD voucher sàn, giám sát voucher quán | vouchers/redemptions/audit |
| Reviews | Lọc/export; ẩn/khôi phục có lý do | reviews/audit |
| Financial + payouts | Báo cáo/export, commission/refund, duyệt/từ chối payout idempotent | payments/refunds/wallets/transactions/payouts |
| Content | `/admin/content?tab=home|cuisines`; banners/cuisine CRUD và reorder | home settings/banners/cuisines/assets |
| System | `/admin/system?tab=config|logs`; config có validate; audit truy vấn/lọc | platform_config/audit_logs |
| Notifications/chat | Thông báo Admin và hỗ trợ theo ngữ cảnh | notifications/conversations/messages |

Các URL `/admin/payouts`, `/admin/customer-home`, `/admin/cuisines`, `/admin/config`, `/admin/audit-logs` là redirect tương thích, không phải năm trang độc lập.

## Kịch bản demo

> 📋 **Kho dữ liệu copy-paste sẵn:** Mở [`./00-KHO-DU-LIEU-COPY-PASTE.md`](./00-KHO-DU-LIEU-COPY-PASTE.md#nguoi-6-nguyen-cong-ben--admin-doi-soat--ha-tang) để lấy lý do từ chối quán, lý do khóa tài khoản vi phạm, mã tham chiếu duyệt payout và thêm danh mục ẩm thực mới.

1. Overview: nêu KPI và mốc dữ liệu seed gần ngày báo cáo.
2. Restaurants: mở một hồ sơ/yêu cầu địa chỉ, giải thích approve/reject + notification + audit.
3. Financial: mở báo cáo và tab payout, giải thích số dư/commission/refund.
4. System audit: tìm action vừa nêu; chỉ ra ai–làm gì–đối tượng–thời gian–metadata.
5. Dùng slide inventory cho accounts/promotions/reviews/content/notifications.
6. Tổng kết React–Express–MySQL và Vercel–Railway; nêu gate và giới hạn trung thực.

## Quy tắc bắt buộc

- Admin không thay luồng nhà hàng thường ngày; override chỉ cho ngoại lệ, cần lý do và audit.
- Hủy order và refund payment là hai trạng thái; refund phải theo kết quả gateway.
- Payout duyệt nhiều lần không được trừ ví hai lần; mọi biến động có wallet transaction.
- Config phải validate kiểu/phạm vi; content chỉ hiển thị item active theo sort order.
- Dữ liệu seed là synthetic có tính thực tế, không gọi là dữ liệu cá nhân “thật”.

## Bằng chứng chất lượng phải thuộc

- Seed: 38 bảng, 32 user, 14 quán, 53 món, 27 đơn, 27 review; 0 dữ liệu tài xế runtime.
- Release gate gần nhất: client 13 test, server 55 test, lint/build pass, audit 0 vulnerability, smoke 3 role và cross-role 403 pass.
- Backup rehearsal: 38 bảng/1.124 dòng; có checksum và restore vào DB tạm.
- Chưa được tuyên bố production tuyệt đối trước live preflight Vercel/Railway/VNPay/SMTP/ORS.

## Câu hỏi phản biện

- **Audit log có tác dụng gì?** Truy trách nhiệm và điều tra action nhạy cảm; không thay backup.
- **GMV khác doanh thu sàn?** GMV là tổng giá trị đơn; doanh thu sàn là commission/phí theo công thức.
- **Vì sao còn bảng driver?** Legacy tương thích, zero runtime usage; migration xóa để sau báo cáo và cần backup/rehearsal.
- **Rollback?** Giữ backup DB, artifact frontend, commit phát hành và runbook; không import dump có DROP vào DB chưa backup.
- **Điểm yếu hiện tại?** Polling, token storage, worker chung process, browser coverage và phụ thuộc sandbox ngoài.

## Biết sơ lược phần còn lại

Người 6 phải hiểu toàn bộ vertical flow: auth → discovery/cart → transaction checkout → merchant transitions → customer confirm/review → wallet/payout/audit. Khi thành viên khác bí, dùng 10 câu trả lời bắt buộc trong thư viện chung để hỗ trợ.

## Câu kết

“NomNom hoàn thiện một vòng đời đặt món ba vai trò có kiểm soát quyền, transaction, snapshot và audit. Candidate đã qua gate tự động; nhóm công bố rõ giới hạn và chỉ nâng thành bản triển khai chính thức sau preflight môi trường thật.”
