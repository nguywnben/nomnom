# Tài liệu NomNom

> Phạm vi chính thức cho báo cáo 03/09/2026 chỉ gồm **Khách hàng — Nhà hàng — Admin**.
> Các báo cáo Wave cũ là lịch sử triển khai, không phải mô tả phạm vi hiện hành.

## Project Identity

NomNom is a graduation project developed at **FPT Polytechnic** by a six-member team led by **Nguyễn Công Ben**. The team also includes Hồ Minh Nhật, Nguyễn Văn Dĩ Khang, Ong Tuấn Nghĩa, Trần Minh Được, and Nguyễn Thị Như Ngọc.

## Open Source Community

| Document | Purpose |
|---|---|
| [README](../README.md) | Public project overview and setup guide |
| [CONTRIBUTING](../CONTRIBUTING.md) | Development and pull request workflow |
| [SECURITY](../SECURITY.md) | Private vulnerability reporting policy |
| [CODE_OF_CONDUCT](../CODE_OF_CONDUCT.md) | Community participation standards |
| [LICENSE](../LICENSE) | MIT License |

## Vận hành & triển khai

| Tài liệu | Mô tả |
|----------|--------|
| [AUTH.md](./AUTH.md) | Đăng nhập, JWT, OTP, seed user |
| [RAILWAY.md](./RAILWAY.md) | Deploy server + MySQL trên Railway |
| [RELEASE_RUNBOOK.md](./RELEASE_RUNBOOK.md) | Backup, quality gate, build, rollback và go/no-go |
| [DEMO_RUNBOOK.md](./DEMO_RUNBOOK.md) | Kịch bản báo cáo 8–12 phút và phương án dự phòng |
| [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) | Rủi ro đã biết, cách kiểm soát và backlog sau báo cáo |

## Phân tích & thiết kế

| Tài liệu | Mô tả |
|----------|--------|
| [project-overview.md](./analysis/project-overview.md) | Tổng quan dự án, tech stack, module |
| [erd.md](./analysis/erd.md) | ERD, mô tả bảng, hướng dẫn vẽ draw.io |
| [usecase.md](./analysis/usecase.md) | Use case theo từng tác nhân |
| [ADR-001](./decisions/ADR-001-three-role-delivery-model.md) | Quyết định mô hình giao hàng ba vai trò và legacy schema |

## Lịch sử làm việc nhóm

| Tài liệu | Mô tả |
|----------|--------|
| [groups.txt](./planning/groups.txt) | Kế hoạch Đợt 1–2 (đã xong) |
| [waves-remaining.txt](./planning/waves-remaining.txt) | Kế hoạch Đợt 3–5 (không gồm vận hành tài xế) |
| [wave-1-completed.md](./wave-1-completed.md) | Chức năng đã hoàn thành — Đợt 1 (INF-01 … ADM-02) |
| [wave-2-completed.md](./wave-2-completed.md) | Chức năng đã hoàn thành — Đợt 2 (CUS-03 … ADM-03) |
| [wave-3-completed.md](./wave-3-completed.md) | Chức năng đã hoàn thành — Đợt 3 (CUS-06 … MER-04) |
| [wave-4-completed.md](./wave-4-completed.md) | Wave 4 implementation, migrations, verification evidence, and sandbox gate |
| [issues-wave-4.md](./planning/issues-wave-4.md) | Hợp đồng và tiêu chí nhận việc Wave 4 |
| [wave-5-completed.md](./wave-5-completed.md) | Wave 5 finance, settings, notifications, chat, and verification evidence |
| [issues-wave-5.md](./planning/issues-wave-5.md) | Wave 5 issue contracts and acceptance criteria |
| [`tasks/plan.md`](../tasks/plan.md) | Thứ tự triển khai và dependency Wave 5 |
| [`tasks/todo.md`](../tasks/todo.md) | Checklist khởi động, checkpoint và bàn giao Wave 5 |
| [legacy-four-role](./archive/legacy-four-role/README.md) | Tài liệu thiết kế bốn vai trò đã ngừng sử dụng |

## Cơ sở dữ liệu

Schema + seed: [`database/nomnom.sql`](../database/nomnom.sql)

```bash
mysql -u root -p nomnom < database/nomnom.sql
```

Migration bổ sung (DB đã có từ trước):

```bash
mysql -u root -p nomnom < database/migrations/20260530_restaurant_bank.sql
```

Migrations for Waves 4-5:

```bash
mysql -u root -p nomnom < database/migrations/20260711_wave4_foundation.sql
mysql -u root -p nomnom < database/migrations/20260803_wave4_completion.sql
mysql -u root -p nomnom < database/migrations/20260804_wave5_completion.sql
mysql -u root -p nomnom < database/migrations/20260831_checkout_idempotency.sql
mysql -u root -p nomnom < database/migrations/20260831_upload_ownership.sql
mysql -u root -p nomnom < database/migrations/20260831_reconcile_demo_finance.sql
```
