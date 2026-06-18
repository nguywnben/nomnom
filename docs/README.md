# Tài liệu NomNom

## Vận hành & triển khai

| Tài liệu | Mô tả |
|----------|--------|
| [AUTH.md](./AUTH.md) | Đăng nhập, JWT, OTP, seed user |
| [RAILWAY.md](./RAILWAY.md) | Deploy server + MySQL trên Railway |

## Phân tích & thiết kế

| Tài liệu | Mô tả |
|----------|--------|
| [project-overview.md](./analysis/project-overview.md) | Tổng quan dự án, tech stack, module |
| [erd.md](./analysis/erd.md) | ERD, mô tả bảng, hướng dẫn vẽ draw.io |
| [usecase.md](./analysis/usecase.md) | Use case theo từng tác nhân |

## Kế hoạch làm việc nhóm

| Tài liệu | Mô tả |
|----------|--------|
| [groups.txt](./planning/groups.txt) | Chia 28 issue thành 5 đợt (wave) |
| [wave-1-completed.md](./wave-1-completed.md) | Chức năng đã hoàn thành — Đợt 1 (INF-01 … ADM-02) |
| [wave-2-completed.md](./wave-2-completed.md) | Chức năng đã hoàn thành — Đợt 2 (CUS-03 … ADM-03) |
| [issues.txt](./planning/issues.txt) | Chi tiết từng issue *(chưa có trong repo)* |

## Cơ sở dữ liệu

Schema + seed: [`database/nomnom.sql`](../database/nomnom.sql)

```bash
mysql -u root -p nomnom < database/nomnom.sql
```

Migration bổ sung (DB đã có từ trước):

```bash
mysql -u root -p nomnom < database/migrations/20260530_restaurant_bank.sql
```
