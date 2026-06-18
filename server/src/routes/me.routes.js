import { Router } from 'express';
import bcrypt from 'bcrypt';
import { requireAuth } from '../middleware/auth.js';
import db from '../db/pool.js';
import { normalizeRoles } from '../lib/roles.js';

const router = Router();
router.use(requireAuth);

async function loadRoles(userId) {
  const [rows] = await db.query('SELECT role FROM user_roles WHERE user_id = ? ORDER BY role', [userId]);
  return rows.map((r) => r.role);
}

function serializeUser(row, roles) {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    primaryRole: row.primary_role,
    status: row.status,
    suspensionExpiresAt: row.suspension_expires_at ?? null,
    roles,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, email, phone, full_name, avatar_url, primary_role, status, suspension_expires_at
       FROM users WHERE id = ? LIMIT 1`,
      [req.auth.userId],
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Tài khoản chưa được kích hoạt hoặc đã bị khóa.' });
    }
    const roles = normalizeRoles(await loadRoles(user.id));
    res.json({ user: serializeUser(user, roles) });
  } catch (err) {
    next(err);
  }
});

router.patch('/', async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const fullName = req.body?.fullName === undefined ? undefined : String(req.body.fullName).trim();
    const phoneValue = req.body?.phone === undefined ? undefined : String(req.body.phone).trim();
    const avatarUrl = req.body?.avatarUrl === undefined ? undefined : String(req.body.avatarUrl).trim();

    const [currentRows] = await db.query(
      'SELECT id, full_name, phone, avatar_url FROM users WHERE id = ? LIMIT 1',
      [userId],
    );
    const current = currentRows[0];
    if (!current) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const nextFullName = fullName === undefined ? current.full_name : fullName;
    const nextPhone = phoneValue === undefined ? current.phone : phoneValue || null;
    const nextAvatarUrl = avatarUrl === undefined ? current.avatar_url : avatarUrl || null;

    if (!nextFullName) {
      return res.status(400).json({ error: 'Họ tên là bắt buộc.' });
    }

    if (nextPhone !== null) {
      const [phoneRows] = await db.query(
        'SELECT id FROM users WHERE phone = ? AND id <> ? LIMIT 1',
        [nextPhone, userId],
      );
      if (phoneRows.length) {
        return res.status(409).json({ error: 'Số điện thoại này đã được sử dụng.' });
      }
    }

    const updates = [];
    const values = [];
    if (nextFullName !== current.full_name) {
      updates.push('full_name = ?');
      values.push(nextFullName);
    }
    if (nextPhone !== current.phone) {
      updates.push('phone = ?');
      values.push(nextPhone);
    }
    if (nextAvatarUrl !== current.avatar_url) {
      updates.push('avatar_url = ?');
      values.push(nextAvatarUrl);
    }

    if (updates.length) {
      values.push(userId);
      await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [updatedRows] = await db.query(
      `SELECT id, email, phone, full_name, avatar_url, primary_role, status, suspension_expires_at
       FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );
    const roles = normalizeRoles(await loadRoles(userId));
    res.json({ user: serializeUser(updatedRows[0], roles) });
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Số điện thoại này đã được sử dụng.' });
    }
    next(err);
  }
});

router.post('/change-password', async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const currentPassword = String(req.body?.currentPassword ?? '');
    const newPassword = String(req.body?.newPassword ?? '');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
    }

    const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [userId]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng.' });
    }

    const nextHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [nextHash, userId]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get('/addresses', async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const [rows] = await db.query(
      `SELECT id, label, recipient_name AS recipientName, recipient_phone AS recipientPhone, 
              line1, ward, district, city, latitude, longitude, delivery_note AS deliveryNote, is_default AS isDefault
       FROM customer_addresses 
       WHERE customer_id = ?
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    const formattedRows = rows.map((r) => ({
      ...r,
      isDefault: Boolean(r.isDefault),
      latitude: r.latitude ? Number(r.latitude) : null,
      longitude: r.longitude ? Number(r.longitude) : null,
    }));
    res.json(formattedRows);
  } catch (err) {
    next(err);
  }
});

router.post('/addresses', async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { userId } = req.auth;
    let { 
      label, recipientName, recipientPhone, line1, 
      ward, district, city, latitude, longitude, 
      deliveryNote, isDefault 
    } = req.body;

    // Check if this is the first address
    const [existing] = await connection.query(
      'SELECT COUNT(*) as cnt FROM customer_addresses WHERE customer_id = ?',
      [userId]
    );
    if (existing[0].cnt === 0) {
      isDefault = true;
    }

    if (isDefault) {
      await connection.query(
        'UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?',
        [userId]
      );
    }

    const [result] = await connection.query(
      `INSERT INTO customer_addresses 
        (customer_id, label, recipient_name, recipient_phone, line1, ward, district, city, latitude, longitude, delivery_note, is_default) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, label || '', recipientName || '', recipientPhone || '', line1 || '',
        ward || null, district || null, city || '', latitude || null, longitude || null,
        deliveryNote || null, isDefault ? 1 : 0
      ]
    );

    const newId = result.insertId;

    if (isDefault) {
      await connection.query(
        'INSERT INTO customer_profiles (user_id, default_address_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE default_address_id = ?',
        [userId, newId, newId]
      );
    }

    await connection.commit();
    
    // Return the newly created address
    const [newAddr] = await connection.query(
      `SELECT id, label, recipient_name AS recipientName, recipient_phone AS recipientPhone, 
              line1, ward, district, city, latitude, longitude, delivery_note AS deliveryNote, is_default AS isDefault
       FROM customer_addresses WHERE id = ?`,
      [newId]
    );
    res.status(201).json({
      ...newAddr[0],
      isDefault: Boolean(newAddr[0].isDefault),
      latitude: newAddr[0].latitude ? Number(newAddr[0].latitude) : null,
      longitude: newAddr[0].longitude ? Number(newAddr[0].longitude) : null,
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.patch('/addresses/:id', async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { userId } = req.auth;
    const { id } = req.params;
    const data = req.body;

    await connection.beginTransaction();

    const [addrList] = await connection.query(
      'SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [id, userId]
    );
    if (addrList.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Address not found' });
    }

    if (data.isDefault) {
      await connection.query(
        'UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?',
        [userId]
      );
      await connection.query(
        'INSERT INTO customer_profiles (user_id, default_address_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE default_address_id = ?',
        [userId, id, id]
      );
    }

    const fields = [];
    const values = [];

    const fieldMap = {
      label: 'label',
      recipientName: 'recipient_name',
      recipientPhone: 'recipient_phone',
      line1: 'line1',
      ward: 'ward',
      district: 'district',
      city: 'city',
      latitude: 'latitude',
      longitude: 'longitude',
      deliveryNote: 'delivery_note',
      isDefault: 'is_default'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        fields.push(`${dbField} = ?`);
        values.push(key === 'isDefault' ? (data[key] ? 1 : 0) : data[key]);
      }
    }

    if (fields.length > 0) {
      values.push(id);
      values.push(userId);
      await connection.query(
        `UPDATE customer_addresses SET ${fields.join(', ')} WHERE id = ? AND customer_id = ?`,
        values
      );
    }
    
    await connection.commit();

    const [updatedRow] = await connection.query(
      `SELECT id, label, recipient_name AS recipientName, recipient_phone AS recipientPhone, 
              line1, ward, district, city, latitude, longitude, delivery_note AS deliveryNote, is_default AS isDefault
       FROM customer_addresses WHERE id = ?`,
      [id]
    );
    res.json({
      ...updatedRow[0],
      isDefault: Boolean(updatedRow[0].isDefault),
      latitude: updatedRow[0].latitude ? Number(updatedRow[0].latitude) : null,
      longitude: updatedRow[0].longitude ? Number(updatedRow[0].longitude) : null,
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.delete('/addresses/:id', async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { userId } = req.auth;
    const { id } = req.params;
    
    await connection.beginTransaction();

    const [addrList] = await connection.query(
      'SELECT is_default FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [id, userId]
    );
    if (addrList.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Address not found' });
    }

    // Always allow delete based on requirement
    await connection.query('DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?', [id, userId]);

    if (addrList[0].is_default) {
      await connection.query(
        'UPDATE customer_profiles SET default_address_id = NULL WHERE user_id = ?',
        [userId]
      );
    }
    
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.post('/addresses/:id/default', async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { userId } = req.auth;
    const { id } = req.params;

    await connection.beginTransaction();

    const [addrList] = await connection.query(
      'SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?',
      [id, userId]
    );
    if (addrList.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Address not found' });
    }

    await connection.query('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?', [userId]);
    await connection.query('UPDATE customer_addresses SET is_default = 1 WHERE id = ?', [id]);
    await connection.query(
      'INSERT INTO customer_profiles (user_id, default_address_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE default_address_id = ?',
      [userId, id, id]
    );
    
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

export default router;
