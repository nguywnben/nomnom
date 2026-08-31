# Release evidence — 31/08/2026

## Automated gate

Gate được chạy trên code commit `78c2087` bằng:

```text
node scripts/verify-release.mjs --rounds 2 --smoke
```

Hai vòng liên tiếp cùng đạt:

| Kiểm tra | Kết quả mỗi vòng |
|---|---:|
| Client ESLint | Pass, 0 lỗi |
| Client tests | 3 pass, 0 fail |
| Client production build | Pass, 701 module |
| Server tests | 52 pass, 0 fail |
| Server syntax | 74 file pass |
| Client dependency audit | 0 vulnerability |
| Server dependency audit | 0 vulnerability |
| API smoke ba vai trò | Pass, gồm truy cập chéo trả 403 |

## Database evidence

- Đã đối soát 16 đơn `DEMO-*`; không còn chênh lệch theo công thức ba vai trò.
- Migration đối soát chạy lần hai có `changedRows = 0`.
- Backup local: `backups/nomnom-20260831T163629Z.sql`.
- Phạm vi backup: 38 bảng, 1.094 dòng, 292.994 byte.
- SHA-256: `96e4da892a46b8fa778e1d18773c2cbef8c90aa6ed5165c8b335e93a3c4feac3`.
- Backup không được commit vì có thể chứa dữ liệu người dùng.

## Browser evidence

Đã kiểm tra bằng Chromium in-app trên `http://localhost:5173`:

- landing page tại 360, 390, 768 và 1.440 px: không horizontal overflow;
- login tại 320 px: không overflow, H1 duy nhất, input có accessible name;
- landing/login: không có console error hoặc warning;
- ảnh có `alt`, nút có accessible name trong các màn công khai đã kiểm tra;
- route `/admin` khi chưa đăng nhập chuyển đúng tới `/login?next=%2Fadmin`;
- copy không còn tuyên bố số lượng quán hoặc thời gian giao không có bằng chứng.

## Chưa được coi là pass tự động

- Browser UI đăng nhập cho ba vai trò cần nhập credential demo và kiểm tra thủ công.
- Edge/Firefox chưa có runner trong môi trường hiện tại.
- VNPay sandbox success/refund thật phụ thuộc credential và dịch vụ ngoài.
- Restore backup vào database tạm cần MySQL CLI trên máy diễn tập.
- Video offline và kiểm tra máy chiếu/âm thanh là công việc vật lý của nhóm.

Trạng thái hiện tại: **GO WITH KNOWN LIMITATIONS** cho demo local bằng Chrome + COD. Chỉ chuyển
thành GO đầy đủ sau khi nhóm hoàn tất các mục thủ công phía trên.
