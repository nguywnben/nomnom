const ACTION_MAP = {
  accept: { from: 'placed', to: 'accepted', setAcceptedAt: true },
  start_preparing: { from: 'accepted', to: 'preparing' },
  ready: { from: 'preparing', to: 'ready_for_pickup', setReadyAt: true },
};

const CANCELLABLE = new Set(['placed', 'accepted', 'preparing', 'ready_for_pickup']);

export function parseOrderDate(value) {
  if (!value) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const err = new Error('Tham số date phải có định dạng YYYY-MM-DD.');
    err.status = 400;
    throw err;
  }
  return String(value);
}

export function resolveStatusAction(action, order) {
  if (action === 'cancel') {
    if (!CANCELLABLE.has(order.status)) {
      const err = new Error('Không thể hủy đơn ở trạng thái hiện tại.');
      err.status = 409;
      throw err;
    }
    return { from: order.status, to: 'cancelled', cancel: true };
  }

  const rule = ACTION_MAP[action];
  if (!rule) {
    const err = new Error('Hành động không hợp lệ.');
    err.status = 400;
    throw err;
  }
  if (order.status !== rule.from) {
    const err = new Error(`Không thể thực hiện "${action}" khi đơn đang ở trạng thái "${order.status}".`);
    err.status = 409;
    throw err;
  }
  return rule;
}

export function serializeMerchantOrder(row, items, customer) {
  return {
    id: Number(row.id),
    orderCode: row.order_code,
    status: row.status,
    customerId: Number(row.customer_id),
    customerName: customer?.full_name ?? 'Khách hàng',
    customerPhone: customer?.phone ?? null,
    customerNote: row.customer_note ?? null,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    discountAmount: Number(row.discount_amount),
    totalAmount: Number(row.total_amount),
    deliveryAddressSnapshot: row.delivery_address_snapshot,
    estimatedDeliveryAt: row.estimated_delivery_at ?? null,
    placedAt: row.placed_at,
    acceptedAt: row.accepted_at ?? null,
    readyAt: row.ready_at ?? null,
    pickedUpAt: row.picked_up_at ?? null,
    deliveredAt: row.delivered_at ?? null,
    cancelledAt: row.cancelled_at ?? null,
    items: items.map((item) => ({
      id: Number(item.id),
      menuItemId: Number(item.menu_item_id),
      name: item.item_name_snapshot,
      unitPrice: Number(item.unit_price_snapshot),
      quantity: Number(item.quantity),
      lineSubtotal: Number(item.line_subtotal),
      note: item.note ?? null,
    })),
  };
}

export function customerNotificationForAction(action, orderCode, restaurantName) {
  const trackLink = `/app/track/${orderCode}`;
  switch (action) {
    case 'accept':
      return {
        type: 'order_accepted',
        title: 'Quán đã xác nhận đơn',
        body: `${restaurantName} đã nhận đơn ${orderCode}.`,
        linkUrl: trackLink,
      };
    case 'start_preparing':
      return {
        type: 'order_accepted',
        title: 'Quán đang chuẩn bị',
        body: `${restaurantName} đang chuẩn bị đơn ${orderCode}.`,
        linkUrl: trackLink,
      };
    case 'ready':
      return {
        type: 'order_ready',
        title: 'Đơn sẵn sàng giao',
        body: `Đơn ${orderCode} đã sẵn sàng — tài xế sẽ đến lấy hàng.`,
        linkUrl: trackLink,
      };
    case 'cancel':
      return {
        type: 'order_cancelled',
        title: 'Đơn hàng bị hủy',
        body: `Đơn ${orderCode} đã bị hủy bởi quán.`,
        linkUrl: '/app/orders',
      };
    default:
      return null;
  }
}

export async function creditMerchantForDeliveredOrder(conn, order) {
  if (!order || Number(order.merchant_earning || 0) <= 0) return;

  const [restaurantRows] = await conn.query(
    'SELECT owner_user_id FROM restaurants WHERE id = ? LIMIT 1',
    [order.restaurant_id],
  );
  const ownerUserId = restaurantRows[0]?.owner_user_id;
  if (!ownerUserId) return;

  // Đảm bảo ví merchant tồn tại
  await conn.query(
    "INSERT INTO wallets (user_id, owner_type) VALUES (?, 'merchant') ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
    [ownerUserId],
  );
  const [walletRows] = await conn.query(
    "SELECT * FROM wallets WHERE user_id = ? AND owner_type = 'merchant' LIMIT 1 FOR UPDATE",
    [ownerUserId],
  );
  const wallet = walletRows[0];
  if (!wallet) return;

  // Kiểm tra chống cộng trùng lặp giao dịch
  const [existingTx] = await conn.query(
    "SELECT id FROM wallet_transactions WHERE wallet_id = ? AND reference_type = 'order' AND reference_id = ? AND tx_type = 'order_earning' LIMIT 1",
    [wallet.id, order.id],
  );
  if (existingTx.length > 0) return;

  const amount = Number(order.merchant_earning);
  const balanceAfter = Number(wallet.balance) + amount;

  await conn.query(
    'UPDATE wallets SET balance = balance + ?, total_earned = total_earned + ?, updated_at = NOW() WHERE id = ?',
    [amount, amount, wallet.id],
  );

  await conn.query(
    `INSERT INTO wallet_transactions (
      wallet_id, direction, amount, balance_after, tx_type, reference_type, reference_id, description, created_at
    ) VALUES (?, 'credit', ?, ?, 'order_earning', 'order', ?, ?, NOW())`,
    [wallet.id, amount, balanceAfter, order.id, `Doanh thu đơn ${order.order_code}`],
  );
}
