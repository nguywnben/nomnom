import cors from 'cors';
import express from 'express';
import 'dotenv/config';
import homeRoutes from './routes/home.routes.js';
import authRoutes from './routes/auth.routes.js';

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

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status ?? 500;
  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && err.code ? { code: err.code } : {}),
  });
});

app.listen(port, () => {
  console.log(`NomNom API http://localhost:${port}`);
});
