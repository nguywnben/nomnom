import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import {
  deleteUploadedImage,
  normalizeUploadFolder,
  uploadImageBuffer,
} from '../lib/cloudinary.js';
import pool from '../db/pool.js';
import { canDeleteUpload, normalizeOwnedPublicId } from '../lib/uploadOwnership.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const uploadWindowMs = 60 * 1000;
const maxUploadsPerWindow = 20;
const userUploadHistory = new Map();

function isAbortedUploadError(error, req) {
  return (
    req?.aborted ||
    error?.message === 'Request aborted' ||
    error?.code === 'ECONNRESET' ||
    error?.code === 'ECONNABORTED'
  );
}

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

function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (isAbortedUploadError(err, req)) {
        return;
      }
      return next(err);
    }
    next();
  });
}

router.post('/', requireAuth, handleUpload, async (req, res, next) => {
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

    try {
      await pool.query(
        `INSERT INTO uploaded_assets (owner_user_id, public_id, secure_url, folder)
         VALUES (?, ?, ?, ?)`,
        [req.auth.userId, result.public_id, result.secure_url, folder],
      );
    } catch (error) {
      await deleteUploadedImage(result.public_id).catch(() => {});
      throw error;
    }

    return res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/', requireAuth, async (req, res, next) => {
  try {
    const publicId = normalizeOwnedPublicId(req.query.publicId);
    const [[asset]] = await pool.query(
      `SELECT id, owner_user_id
       FROM uploaded_assets
       WHERE public_id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [publicId],
    );
    if (!asset) {
      return res.status(404).json({ error: 'Không tìm thấy ảnh thuộc phạm vi quản lý.' });
    }
    if (!canDeleteUpload({
      ownerUserId: asset.owner_user_id,
      actorUserId: req.auth.userId,
      actorRoles: req.auth.roles,
    })) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa ảnh này.' });
    }

    const result = await deleteUploadedImage(publicId);
    await pool.query('UPDATE uploaded_assets SET deleted_at = NOW() WHERE id = ?', [asset.id]);
    return res.json({ ok: true, result });
  } catch (error) {
    next(error);
  }
});

export default router;
