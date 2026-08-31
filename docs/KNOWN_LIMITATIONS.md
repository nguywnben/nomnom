# Known limitations — Bản báo cáo 03/09/2026

| Hạn chế | Mức | Cách kiểm soát trong bản demo | Hướng xử lý sau báo cáo |
|---|---|---|---|
| Bảng/enum tài xế legacy còn trong schema | P2 | Không có route, menu hay câu chuyện demo công khai | Migration xóa sau backup và rehearsal |
| Refresh token còn được client quản lý thay vì cookie HttpOnly | P1 được chấp nhận cho demo local | Không dùng tài khoản thật; CSP/header/rate limit và TTL đang bật | Chuyển HttpOnly Secure SameSite + CSRF |
| Refund `initiated` cần Admin đối soát thủ công khi timeout/sai chữ ký | P1 có fail-safe | Không retry tự động; đơn chưa bị hủy và không báo đã hoàn | Thêm job truy vấn trạng thái VNPay và màn hình reconcile |
| Worker quá hạn chạy cùng web process | P2 | Batch có giới hạn, chống chạy chồng và paid order không tự refund | Tách queue/cron có lease và monitoring |
| UI unit test còn ít; browser automation chưa bao phủ mọi trang | P2 | Quality gate, API role smoke và browser checklist trên luồng demo | Bổ sung Playwright/axe và coverage budget |
| Edge/Firefox chưa có bằng chứng tự động trong repo | P2 | Chrome desktop/mobile là browser chuẩn của buổi báo cáo | Thêm browser matrix trong CI |

Không hạn chế nào được phép che giấu lỗi sai tiền, tạo trùng đơn, vượt quyền hoặc màn trắng.
Nếu một hạn chế đi vào luồng demo chính và tạo lỗi P0/P1, trạng thái phát hành chuyển thành NO-GO.
