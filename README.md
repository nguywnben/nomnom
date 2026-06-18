# NomNom — Premium Food Delivery Ecosystem

NomNom is a comprehensive, multi-sided food delivery platform designed with a modern, editorial-feel UI/UX. It provides a seamless experience for all participants in the food delivery lifecycle through specialized modules.

## Repository Structure

Monorepo: React client + Express API + MySQL.

```
nomnom/
├── client/          # React/Vite frontend
├── server/          # Express API (see server/README.md)
├── database/        # Schema + seed (nomnom.sql)
└── docs/            # Project documentation (see docs/README.md)
```

| Path | Description |
|------|-------------|
| [client/](./client) | Customer, Merchant, Driver, and Admin UI |
| [server/](./server) | REST API, auth, uploads, admin |
| [database/](./database) | MySQL schema and seed data |
| [docs/](./docs) | Auth guide, planning waves, ERD, use cases |

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, React Router v6, Context API
- **Backend**: Node.js, Express, MySQL 8, JWT, Cloudinary
- **Docs**: Vietnamese localization throughout the product

## Getting Started

### 1. Database

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS nomnom"
mysql -u root -p nomnom < database/nomnom.sql
```

### 2. Server

```bash
cd server
cp .env.example .env   # fill MYSQL_URL, JWT secrets, Cloudinary, etc.
npm install
npm run dev
```

See [docs/AUTH.md](./docs/AUTH.md) for login, OTP, and seed users (`password123`).

### 3. Client

```bash
cd client
npm install
npm run dev
```

---
© 2026 NomNom. Built with passion.
