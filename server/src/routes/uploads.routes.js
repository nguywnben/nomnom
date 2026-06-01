import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import {
  deleteUploadedImage,
  normalizeUploadFolder,
  uploadImageBuffer,
} from '../lib/cloudinary.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const uploadWindowMs = 60 * 1000;
const maxUploadsPerWindow = 20;
const userUploadHistory = new Map();

function enforceRateLimit(userId) {
  const now = Date.now();
  const recent = (userUploadHistory.get(userId) ?? []).filter((timestamp) => now - timestamp < uploadWindowMs);

  if (recent.length >= maxUploadsPerWindow) {
    const error = new Error('Bạn chỉ được upload tối đa 20 ảnh/phút.');
    error.status = 429;
    throw error;
  }

  recent.push(now);
  userUploadHistory.set(userId, recent);
}

router.post('/', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Vui lòng chọn một file ảnh.' });
    }

    if (!allowedMimeTypes.has(file.mimetype)) {
      return res.status(400).json({ error: 'Chỉ hỗ trợ jpg, png và webp.' });
    }

    enforceRateLimit(req.auth.userId);

    const folder = normalizeUploadFolder(req.body?.folder ?? req.query?.folder);
    const result = await uploadImageBuffer({ buffer: file.buffer, folder });

    return res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:publicId', requireAuth, async (req, res, next) => {
  try {
    const publicId = String(req.params.publicId ?? '').trim();
    if (!publicId) {
      return res.status(400).json({ error: 'publicId là bắt buộc.' });
    }

    const result = await deleteUploadedImage(publicId);
    return res.json({ ok: true, result });
  } catch (error) {
    next(error);
  }
});

export default router;