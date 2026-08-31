const CUSTOMER_CANCELLABLE_STATUSES = new Set(['pending_payment', 'placed']);

export function validateCustomerCancellation(order) {
  if (!CUSTOMER_CANCELLABLE_STATUSES.has(order?.status)) {
    const error = new Error('Đơn hàng đã được quán xử lý nên không thể tự hủy.');
    error.status = 409;
    error.code = 'ORDER_NOT_CANCELLABLE';
    throw error;
  }

  if (order.payment_status === 'paid') {
    const error = new Error('Đơn đã thanh toán cần được Admin xử lý hoàn tiền trước khi hủy.');
    error.status = 409;
    error.code = 'PAID_ORDER_REQUIRES_REFUND';
    throw error;
  }
}
