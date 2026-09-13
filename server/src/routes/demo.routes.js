import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDemoResetStatus, resetDemoDatabase } from '../lib/demoReset.js';

const router = Router();

let lastResetCallTime = 0;
const RESET_COOLDOWN_MS = 2 * 60 * 1000; // 2 phút giãn cách giữa các lần reset

router.get('/status', (_req, res) => {
  res.json({
    ok: true,
    ...getDemoResetStatus(),
  });
});

async function authorizeReset(req, res, next) {
  const resetKey = req.headers['x-demo-reset-key'];
  if (process.env.DEMO_RESET_KEY && resetKey && resetKey === process.env.DEMO_RESET_KEY) {
    return next();
  }

  return requireAuth(req, res, () => {
    if ((req.auth?.roles ?? []).includes('admin')) {
      return next();
    }
    return res.status(403).json({
      error: 'Chỉ Quản trị viên (Admin) hoặc khóa bí mật hợp lệ mới có quyền khôi phục dữ liệu mẫu.',
    });
  });
}

router.post('/reset', authorizeReset, async (_req, res, next) => {
  try {
    const now = Date.now();
    if (now - lastResetCallTime < RESET_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESET_COOLDOWN_MS - (now - lastResetCallTime)) / 1000);
      return res.status(429).json({
        error: `Hệ thống vừa được khôi phục. Vui lòng đợi thêm ${waitSeconds} giây trước khi thử lại.`,
      });
    }

    const result = await resetDemoDatabase();
    lastResetCallTime = Date.now();
    res.json({
      ok: true,
      message: 'Khôi phục dữ liệu mẫu thành công.',
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
