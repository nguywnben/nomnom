import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const CONVERSATION_SELECT = "SELECT c.*, o.order_code, o.status AS order_status, r.name AS restaurant_name, u1.full_name AS participant_one_name, u1.avatar_url AS participant_one_avatar, u2.full_name AS participant_two_name, u2.avatar_url AS participant_two_avatar, (SELECT body FROM chat_messages lm WHERE lm.conversation_id = c.id ORDER BY lm.id DESC LIMIT 1) AS last_message, (SELECT created_at FROM chat_messages lm WHERE lm.conversation_id = c.id ORDER BY lm.id DESC LIMIT 1) AS last_message_created_at";
const CONVERSATION_JOINS = ' FROM conversations c JOIN orders o ON o.id = c.order_id JOIN restaurants r ON r.id = c.restaurant_id JOIN users u1 ON u1.id = c.participant_one_user_id JOIN users u2 ON u2.id = c.participant_two_user_id';

function isParticipant(row, userId) {
  return Number(row.participant_one_user_id) === Number(userId) || Number(row.participant_two_user_id) === Number(userId);
}

function serializeConversation(row, userId) {
  const mineIsOne = Number(row.participant_one_user_id) === Number(userId);
  return {
    id: Number(row.id),
    orderId: Number(row.order_id),
    orderCode: row.order_code,
    orderStatus: row.order_status || null,
    restaurantId: Number(row.restaurant_id),
    restaurantName: row.restaurant_name,
    subject: row.subject,
    lastMessage: row.last_message || null,
    lastMessageAt: row.last_message_created_at || row.last_message_at || row.created_at,
    unreadCount: Number(row.unread_count || 0),
    otherParticipant: {
      id: Number(mineIsOne ? row.participant_two_user_id : row.participant_one_user_id),
      name: mineIsOne ? row.participant_two_name : row.participant_one_name,
      avatarUrl: mineIsOne ? row.participant_two_avatar : row.participant_one_avatar,
      role: mineIsOne ? row.participant_two_role : row.participant_one_role,
    },
  };
}

async function loadConversation(conn, id) {
  const [rows] = await conn.query(
    CONVERSATION_SELECT + CONVERSATION_JOINS + ' WHERE c.id = ? LIMIT 1',
    [id],
  );
  return rows[0] || null;
}

router.get('/conversations', async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const [rows] = await pool.query(
      CONVERSATION_SELECT + ", (SELECT COUNT(*) FROM chat_messages um WHERE um.conversation_id = c.id AND um.sender_user_id <> ? AND um.read_at IS NULL) AS unread_count" + CONVERSATION_JOINS + ' WHERE (c.participant_one_user_id = ? OR c.participant_two_user_id = ?) AND (c.last_message_at IS NOT NULL OR EXISTS (SELECT 1 FROM chat_messages cm WHERE cm.conversation_id = c.id)) ORDER BY COALESCE(c.last_message_at, c.created_at) DESC, c.id DESC',
      [userId, userId, userId],
    );
    return res.json({ data: rows.map((row) => serializeConversation(row, userId)) });
  } catch (error) {
    return next(error);
  }
});

router.post('/conversations', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const orderId = Number(req.body?.orderId);
    const counterpartRole = String(req.body?.counterpartRole || 'merchant');
    if (!Number.isInteger(orderId) || orderId <= 0 || !['merchant', 'admin', 'customer'].includes(counterpartRole)) {
      return res.status(400).json({ error: 'A valid orderId and counterpartRole are required.' });
    }
    await connection.beginTransaction();
    const [orders] = await connection.query(
      'SELECT o.id, o.order_code, o.customer_id, o.restaurant_id, r.owner_user_id, r.name AS restaurant_name FROM orders o JOIN restaurants r ON r.id = o.restaurant_id WHERE o.id = ? FOR UPDATE',
      [orderId],
    );
    const order = orders[0];
    if (!order) {
      await connection.rollback();
      return res.status(404).json({ error: 'Order not found.' });
    }
    const userId = Number(req.auth.userId);
    const roles = req.auth.roles || [];
    let participantOneId = Number(order.customer_id);
    let participantTwoId;
    let participantTwoRole;
    if (counterpartRole === 'merchant' && userId === Number(order.customer_id)) {
      participantTwoId = Number(order.owner_user_id);
      participantTwoRole = 'merchant';
    } else if (counterpartRole === 'customer' && roles.includes('merchant') && userId === Number(order.owner_user_id)) {
      participantTwoId = userId;
      participantTwoRole = 'merchant';
    } else if (counterpartRole === 'customer' && roles.includes('admin')) {
      participantTwoId = userId;
      participantTwoRole = 'admin';
    } else if (counterpartRole === 'admin' && userId === Number(order.customer_id)) {
      const [admins] = await connection.query(
        "SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'admin' WHERE u.status = 'active' ORDER BY u.id ASC LIMIT 1",
      );
      if (!admins.length) {
        await connection.rollback();
        return res.status(503).json({ error: 'No administrator is available for support.' });
      }
      participantTwoId = Number(admins[0].id);
      participantTwoRole = 'admin';
    } else {
      await connection.rollback();
      return res.status(403).json({ error: 'You cannot start this order conversation.' });
    }
    if (userId !== participantOneId && userId !== participantTwoId) {
      await connection.rollback();
      return res.status(403).json({ error: 'You are not a participant in this order.' });
    }
    if (participantOneId === participantTwoId) {
      await connection.rollback();
      return res.status(400).json({ error: 'Bạn không thể tạo cuộc trò chuyện với chính mình.' });
    }
    const [existing] = await connection.query(
      'SELECT id FROM conversations WHERE order_id = ? AND participant_one_user_id = ? AND participant_two_user_id = ? LIMIT 1 FOR UPDATE',
      [order.id, participantOneId, participantTwoId],
    );
    let conversationId = existing[0]?.id;
    if (!conversationId) {
      const [result] = await connection.query(
        "INSERT INTO conversations (order_id, restaurant_id, participant_one_user_id, participant_one_role, participant_two_user_id, participant_two_role, subject) VALUES (?, ?, ?, 'customer', ?, ?, ?)",
        [order.id, order.restaurant_id, participantOneId, participantTwoId, participantTwoRole, 'Order ' + order.order_code + ' - ' + order.restaurant_name],
      );
      conversationId = result.insertId;
    }
    const conversation = await loadConversation(connection, conversationId);
    await connection.commit();
    return res.status(existing.length ? 200 : 201).json({ conversation: serializeConversation(conversation, userId) });
  } catch (error) {
    await connection.rollback();
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Conversation already exists. Refresh the conversation list.' });
    }
    return next(error);
  } finally {
    connection.release();
  }
});

router.get('/conversations/:id/messages', async (req, res, next) => {
  try {
    const conversation = await loadConversation(pool, req.params.id);
    if (!conversation || !isParticipant(conversation, req.auth.userId)) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    const afterId = Math.max(0, Number.parseInt(req.query.afterId, 10) || 0);
    const [rows] = await pool.query(
      'SELECT m.id, m.sender_user_id, m.body, m.read_at, m.created_at, u.full_name AS sender_name, u.avatar_url AS sender_avatar FROM chat_messages m JOIN users u ON u.id = m.sender_user_id WHERE m.conversation_id = ? AND m.id > ? ORDER BY m.id ASC LIMIT 100',
      [conversation.id, afterId],
    );
    return res.json({
      conversation: serializeConversation(conversation, req.auth.userId),
      data: rows.map((row) => ({ id: Number(row.id), senderUserId: Number(row.sender_user_id), senderName: row.sender_name, senderAvatarUrl: row.sender_avatar, text: row.body, readAt: row.read_at, createdAt: row.created_at })),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/conversations/:id/messages', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const text = String(req.body?.text || '').trim();
    if (!text || text.length > 2000) return res.status(400).json({ error: 'Message must contain 1 to 2000 characters.' });
    await connection.beginTransaction();
    const [conversations] = await connection.query('SELECT * FROM conversations WHERE id = ? FOR UPDATE', [req.params.id]);
    const conversation = conversations[0];
    if (!conversation || !isParticipant(conversation, req.auth.userId)) {
      await connection.rollback();
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    const [result] = await connection.query(
      'INSERT INTO chat_messages (conversation_id, sender_user_id, body) VALUES (?, ?, ?)',
      [conversation.id, req.auth.userId, text],
    );
    await connection.query('UPDATE conversations SET last_message_at = NOW() WHERE id = ?', [conversation.id]);
    const recipientId = Number(conversation.participant_one_user_id) === Number(req.auth.userId)
      ? Number(conversation.participant_two_user_id)
      : Number(conversation.participant_one_user_id);
    if (recipientId && recipientId !== Number(req.auth.userId)) {
      await connection.query(
        "INSERT INTO notifications (user_id, type, title, body, link_url) VALUES (?, 'system', 'New order message', ?, ?)",
        [recipientId, text.slice(0, 500), '/chat/' + conversation.id],
      );
    }
    const [messages] = await connection.query(
      'SELECT m.id, m.sender_user_id, m.body, m.read_at, m.created_at, u.full_name AS sender_name, u.avatar_url AS sender_avatar FROM chat_messages m JOIN users u ON u.id = m.sender_user_id WHERE m.id = ?',
      [result.insertId],
    );
    await connection.commit();
    const row = messages[0];
    return res.status(201).json({ message: { id: Number(row.id), senderUserId: Number(row.sender_user_id), senderName: row.sender_name, senderAvatarUrl: row.sender_avatar, text: row.body, readAt: row.read_at, createdAt: row.created_at } });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

router.post('/conversations/:id/read', async (req, res, next) => {
  try {
    const conversation = await loadConversation(pool, req.params.id);
    if (!conversation || !isParticipant(conversation, req.auth.userId)) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    const [result] = await pool.query(
      'UPDATE chat_messages SET read_at = NOW() WHERE conversation_id = ? AND sender_user_id <> ? AND read_at IS NULL',
      [conversation.id, req.auth.userId],
    );
    return res.json({ ok: true, updated: Number(result.affectedRows) });
  } catch (error) {
    return next(error);
  }
});

export default router;
