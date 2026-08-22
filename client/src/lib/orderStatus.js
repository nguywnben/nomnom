// Nguồn sự thật duy nhất cho tone + nhãn trạng thái đơn hàng.
// Dùng chung ở: customer Orders/Tracking, merchant Dashboard, admin.
// Tone phải nằm trong tập hợp `Badge.jsx` đã định nghĩa.

export const ORDER_STATUS = {
  pending_payment: { tone: 'warning', label: 'Chờ thanh toán' },
  payment_failed: { tone: 'critical', label: 'Thanh toán chưa thành công' },
  placed: { tone: 'warning', label: 'Đã đặt' },
  accepted: { tone: 'info', label: 'Đã nhận đơn' },
  preparing: { tone: 'warning', label: 'Đang chuẩn bị' },
  ready_for_pickup: { tone: 'warning', label: 'Sẵn sàng lấy' },
  picked_up: { tone: 'delivering', label: 'Tài xế đã lấy' },
  delivering: { tone: 'delivering', label: 'Đang giao' },
  delivered: { tone: 'success', label: 'Đã giao' },
  cancelled: { tone: 'critical', label: 'Đã hủy' },
  failed: { tone: 'critical', label: 'Thất bại' },
  expired: { tone: 'critical', label: 'Hết hạn' },
};

export function orderStatusTone(status) {
  return ORDER_STATUS[status]?.tone ?? 'default';
}

export function orderStatusLabel(status) {
  return ORDER_STATUS[status]?.label ?? status ?? '—';
}

/** Các trạng thái "đang hoạt động" (chưa kết thúc). */
export const ACTIVE_ORDER_STATUSES = [
  'pending_payment',
  'payment_failed',
  'placed',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'picked_up',
  'delivering',
];

/** Trạng thái khách có thể hủy (đơn chưa được chế biến xong). */
export const CANCELLABLE_ORDER_STATUSES = [
  'pending_payment',
  'payment_failed',
  'placed',
  'accepted',
];