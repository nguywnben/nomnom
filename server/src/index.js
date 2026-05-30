import cors from 'cors';
import express from 'express';
import 'dotenv/config';
import homeRoutes from './routes/home.routes.js';
import authRoutes from './routes/auth.routes.js';
import meRoutes from './routes/me.routes.js';
import restaurantRoutes from './routes/restaurants.routes.js';
import cuisinesRoutes from './routes/cuisines.routes.js';
import adminRoutes from './routes/admin.routes.js';
import pool, { verifyDbConnection } from './db/pool.js';

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'nomnom-api' });
});

app.use('/api/v1/home', homeRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/me', meRoutes);
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/cuisines', cuisinesRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status ?? 500;
  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && err.code ? { code: err.code } : {}),
  });
});

async function ensureSuspensionColumn() {
  const [rows] = await pool.query("SHOW COLUMNS FROM users LIKE 'suspension_expires_at'");
  if (!rows.length) {
    console.log('[DB] Thêm cột suspension_expires_at vào bảng users');
    await pool.query("ALTER TABLE users ADD COLUMN suspension_expires_at datetime DEFAULT NULL");
  }
}

async function start() {
  try {
    await verifyDbConnection();
    await ensureSuspensionColumn();
  } catch (err) {
    console.error('[DB] Kết nối MySQL THẤT BẠI:', err.message);
    console.error(
      '[DB] Railway: service nomnom → Variables → MYSQL_URL = ${{MySQL.MYSQL_URL}} (internal). Xóa DB_PASSWORD copy tay.',
    );
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`NomNom API http://localhost:${port}`);
  });
}

start();
