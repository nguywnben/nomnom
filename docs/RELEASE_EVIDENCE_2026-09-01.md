# Release evidence — 01/09/2026

## Phạm vi candidate

- Ba vai trò duy nhất: Admin, Khách hàng và Nhà hàng.
- Nhà hàng tự giao hoặc thuê đối tác bên ngoài; NomNom không quản lý Tài xế.
- Đợt hardening này xử lý nhấp nháy khi đổi route/tab, giữ danh sách cũ trong lúc refresh,
  đồng bộ tab theo URL và sửa quy trình backup/restore.

## Automated release gate

Lệnh chạy cuối:

```text
node scripts/verify-release.mjs --rounds 2 --smoke
```

Cả hai vòng liên tiếp đều đạt:

| Kiểm tra | Kết quả mỗi vòng |
|---|---:|
| Client ESLint | Pass, 0 lỗi |
| Client tests | 13 pass, 0 fail |
| Client production build | Pass, 704 module |
| Server tests | 55 pass, 0 fail |
| Server syntax | 76 file pass |
| Client dependency audit | 0 vulnerability |
| Server dependency audit | 0 vulnerability |
| API smoke ba vai trò | Pass, gồm truy cập chéo trả 403 |

## UI/UX evidence

- Route của Customer, Merchant và Admin được preload khi trình duyệt rảnh; tác vụ preload có cleanup.
- Admin Content, Financial và System dùng URL làm nguồn tab duy nhất, tránh state trung gian gây double-render.
- Các danh sách Admin/Customer/Merchant chỉ thay bằng loader toàn phần ở lần tải đầu; khi lọc hoặc phân trang,
  nội dung hiện có được giữ đến khi response mới sẵn sàng.
- Trang Tìm kiếm render số skeleton bằng đúng page size, tránh thay đổi chiều cao lớn khi 12 kết quả xuất hiện.
- Chromium in-app: trang công khai không tràn ngang ở 360, 390, 768 và 1.440 px.
- Chuyển SPA Home -> Search ở 390 px: chiều cao giữ nguyên 2.598 px tại mốc 0/50/300 ms;
  route có nội dung ngay, không nháy fallback toàn trang.

## Backup và restore rehearsal

Rehearsal đã phát hiện và sửa hai lỗi khiến backup cũ không restore được:

1. Giá trị JSON từng bị tuần tự thành `[object Object]`.
2. Cột `VIRTUAL/STORED GENERATED` từng bị đưa vào câu `INSERT`.

Regression suite có 3 test cho JSON, scalar/date/buffer và generated column. Candidate cuối:

- Backup: `backups/nomnom-20260831T175230Z.sql`
- Phạm vi: 38 bảng, 1.124 dòng
- SHA-256: `d9f05202eebdce482b20ad4dbb22f8da1ecf5dbdbffd5840a2328ce479464e4d`
- `npm run verify:restore`: pass trên database tạm; database tạm được xóa sau kiểm chứng.

## Build artifact

- Artifact: `backups/releases/nomnom-client-20260901T005230.zip`
- Kích thước: 1.569.129 byte
- SHA-256: `add109bf88a5d3c48d61ffacbf8541493358e4dc1b24a796a86ff2aacee7c359`
- Artifact và backup không commit vì có build output/dữ liệu demo; manifest release ghi commit sau khi commit candidate.

## Giới hạn cần hoàn tất thủ công

- UI đăng nhập cho ba vai trò chưa được điều khiển trong browser vì chưa có xác nhận nhập credential demo.
- Edge/Firefox chưa có runner trong môi trường hiện tại.
- VNPay sandbox success/refund thật phụ thuộc credential và dịch vụ ngoài.
- Video offline, máy chiếu, âm thanh, mạng phòng báo cáo và diễn tập 8–12 phút cần nhóm thực hiện vật lý.
- Preflight ngày 03/09 phải chạy lại health, login ba vai trò và một đơn COD riêng trên dữ liệu reset.

## Kết luận

Candidate đạt **GO WITH KNOWN LIMITATIONS** cho demo local bằng Chromium + COD. Không có P0/P1
đã biết trong các gate tự động; chưa được nâng thành GO đầy đủ cho tới khi hoàn tất các mục thủ công ở trên.
