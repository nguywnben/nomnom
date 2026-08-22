import { useCallback, useEffect, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Input, { Select } from '../../components/Input.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { useApp } from '../../context/AppContext.jsx';
import { fetchAdminOrderDetail, fetchAdminOrders, cancelAdminOrder, updateAdminOrderShippingStatus } from '../../lib/api.js';

const ORDER_STATUS = {
  pending_payment: { label: 'Chờ thanh toán', tone: 'warning' },
  placed: { label: 'Đã đặt', tone: 'default' },
  accepted: { label: 'Quán đã nhận', tone: 'live' },
  preparing: { label: 'Đang nấu', tone: 'live' },
  ready_for_pickup: { label: 'Sẵn lấy', tone: 'live' },
  picked_up: { label: 'Đã lấy', tone: 'live' },
  delivering: { label: 'Đang giao', tone: 'live' },
  delivered: { label: 'Đã giao', tone: 'success' },
  cancelled: { label: 'Đã hủy', tone: 'error' },
  failed: { label: 'Thất bại', tone: 'error' },
  expired: { label: 'Đã hết hạn', tone: 'error' },
};

const PAY_STATUS = {
  unpaid: { label: 'Chưa thanh toán', tone: 'warning' },
  paid: { label: 'Đã thanh toán', tone: 'success' },
  failed: { label: 'Thanh toán lỗi', tone: 'error' },
  refunded: { label: 'Đã hoàn tiền', tone: 'default' },
  pending: { label: 'Đang xử lý', tone: 'warning' },
  expired: { label: 'Đã hết hạn', tone: 'error' },
};

const PAYMENT_METHODS = {
  cod: 'Tiền mặt (COD)',
  vnpay: 'VNPAY',
};

const PAYMENT_TRANSACTION_STATUS = {
  initiated: 'Đang khởi tạo',
  pending: 'Chờ thanh toán',
  succeeded: 'Thành công',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
};

const REFUND_STATUS = {
  initiated: 'Đang xử lý',
  succeeded: 'Hoàn tiền thành công',
  failed: 'Hoàn tiền thất bại',
};

const CANCELLABLE_ORDER_STATUSES = new Set(['placed', 'accepted', 'preparing', 'ready_for_pickup']);

const PAGE_SIZE = 10;

export default function AdminOrders() {
  const { pushToast } = useApp();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Debounce search text
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchText);
      setPage(1);
    }, 250);
    return () => clearTimeout(handle);
  }, [searchText]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminOrders({
        status,
        paymentMethod,
        paymentStatus,
        q: debouncedSearch,
        page,
      });
      setOrders(data.items || []);
      setTotal(data.pagination?.total ?? 0);
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Lỗi tải đơn hàng',
        message: err.message || 'Không thể kết nối tới server.',
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, paymentMethod, paymentStatus, pushToast, status]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleOpenDetail = async (order) => {
    setSelectedOrder(order);
    try {
      const data = await fetchAdminOrderDetail(order.id);
      setSelectedOrder(data.order);
    } catch (error) {
      pushToast({
        kind: 'error',
        title: 'Không thể tải chi tiết đơn',
        message: error.message || 'Vui lòng thử lại.',
      });
    }
  };

  const handleCancelClick = (o) => {
    setCancelTarget({ id: o.id, code: o.order_code, isPaid: o.payment_status === 'paid' });
    setCancelReason('');
    setCancelError('');
  };

  const handleShippingStatus = async (order, action) => {
    try {
      await updateAdminOrderShippingStatus(order.id, action);
      pushToast({
        kind: 'success',
        title: action === 'picked_up' ? 'Đã xác nhận lấy hàng' : 'Đã cập nhật đang giao',
        message: `Đơn ${order.order_code} đã được cập nhật.`,
      });
      loadOrders();
      if (selectedOrder?.id === order.id) handleOpenDetail(order);
    } catch (error) {
      pushToast({ kind: 'error', title: 'Không thể cập nhật giao vận', message: error.message });
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Vui lòng nhập lý do hủy đơn.');
      return;
    }

    setCancelling(true);
    try {
      await cancelAdminOrder(cancelTarget.id, cancelReason.trim());
      pushToast({
        kind: 'success',
        title: 'Hủy đơn hàng thành công',
        message: `Đơn ${cancelTarget.code} đã được hủy ${cancelTarget.isPaid ? 'và hoàn tiền tự động' : ''}.`,
      });
      setCancelTarget(null);
      loadOrders();
    } catch (err) {
      setCancelError(err.message || 'Hủy đơn hàng thất bại.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Vận hành</div>
          <h1 className="text-display-lg text-ink">Đơn hàng toàn hệ thống</h1>
          <p className="mt-xs text-body-sm text-body">
            Theo dõi đơn theo trạng thái và thanh toán. Hỗ trợ tra cứu, can thiệp khi cần.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
          <Input
            className="w-full md:w-80"
            leadingIcon="search"
            placeholder="Tìm mã đơn, khách hoặc quán..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-sm md:flex md:w-auto">
            <Select
              aria-label="Trạng thái đơn hàng"
              className="min-w-0 md:w-48"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'Mọi trạng thái đơn' },
                ...Object.entries(ORDER_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
              ]}
            />
            <Select
              aria-label="Phương thức thanh toán"
              className="min-w-0 md:w-48"
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'Mọi phương thức' },
                { value: 'cod', label: 'Tiền mặt (COD)' },
                { value: 'vnpay', label: 'Ví VNPAY' },
              ]}
            />
            <Select
              aria-label="Trạng thái thanh toán"
              className="col-span-2 min-w-0 md:col-auto md:w-48"
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'Mọi thanh toán' },
                ...Object.entries(PAY_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
              ]}
            />
          </div>
      </div>

      {loading ? (
        <Card padded className="text-center text-body py-xxl">
          Đang tải thông tin đơn hàng...
        </Card>
      ) : orders.length === 0 ? (
        <EmptyState icon="package" title="Không có đơn phù hợp" />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <table className="hidden w-full text-left text-body-sm md:table">
            <thead className="bg-canvas-soft text-caption-uppercase text-body">
              <tr>
                <th className="px-base py-2">Mã đơn</th>
                <th className="px-base py-2">Khách</th>
                <th className="px-base py-2">Quán</th>
                <th className="px-base py-2 text-right">Tổng cộng</th>
                <th className="px-base py-2">Trạng thái đơn</th>
                <th className="px-base py-2">Thanh toán</th>
                <th className="px-base py-2">Thời gian</th>
                <th className="px-base py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-hairline hover:bg-canvas-soft">
                  <td className="nums px-base py-3 text-ink font-medium">{o.order_code}</td>
                  <td className="px-base py-3 text-body truncate max-w-[150px]" title={o.customer_email}>
                    {o.customer_name}
                  </td>
                  <td className="px-base py-3 text-body truncate max-w-[150px]">
                    {o.restaurant_name}
                  </td>
                  <td className="px-base py-3 nums text-right text-ink font-semibold">
                    {formatVnd(Number(o.total_amount))}
                  </td>
                  <td className="px-base py-3">
                    <Badge tone={ORDER_STATUS[o.status]?.tone || 'default'}>
                      {ORDER_STATUS[o.status]?.label || o.status}
                    </Badge>
                  </td>
                  <td className="px-base py-3">
                    <Badge tone={PAY_STATUS[o.payment_status]?.tone || 'default'}>
                      {PAY_STATUS[o.payment_status]?.label || o.payment_status}
                    </Badge>
                  </td>
                  <td className="px-base py-3 text-body text-xs">
                    {new Date(o.placed_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-base py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="secondary" size="sm" onClick={() => handleOpenDetail(o)}>
                        Chi tiết
                      </Button>
                      {CANCELLABLE_ORDER_STATUSES.has(o.status) && (
                        <Button variant="secondary" size="sm" onClick={() => handleCancelClick(o)}>
                          Hủy đơn
                        </Button>
                      )}
                      {o.status === 'ready_for_pickup' && (
                        <Button variant="secondary" size="sm" onClick={() => handleShippingStatus(o, 'picked_up')}>
                          Đã lấy hàng
                        </Button>
                      )}
                      {o.status === 'picked_up' && (
                        <Button variant="secondary" size="sm" onClick={() => handleShippingStatus(o, 'delivering')}>
                          Đang giao
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile view */}
          <ul className="divide-y divide-hairline md:hidden">
            {orders.map((o) => (
              <li key={o.id} className="p-base hover:bg-canvas-soft">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="nums text-body-sm font-semibold text-ink">{o.order_code}</div>
                    <div className="text-caption text-body truncate">
                      {o.customer_name} · {o.restaurant_name}
                    </div>
                    <div className="text-caption text-body">
                      {new Date(o.placed_at).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="nums text-body-sm font-semibold text-ink">
                      {formatVnd(Number(o.total_amount))}
                    </div>
                    <Badge tone={ORDER_STATUS[o.status]?.tone || 'default'}>
                      {ORDER_STATUS[o.status]?.label || o.status}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={PAY_STATUS[o.payment_status]?.tone || 'default'}>
                    {PAY_STATUS[o.payment_status]?.label || o.payment_status}
                  </Badge>
                  <Button variant="secondary" size="sm" onClick={() => handleOpenDetail(o)}>
                    Chi tiết
                  </Button>
                  {CANCELLABLE_ORDER_STATUSES.has(o.status) && (
                    <Button variant="secondary" size="sm" onClick={() => handleCancelClick(o)}>
                      Hủy đơn
                    </Button>
                  )}
                  {o.status === 'ready_for_pickup' && (
                    <Button variant="secondary" size="sm" onClick={() => handleShippingStatus(o, 'picked_up')}>
                      Đã lấy hàng
                    </Button>
                  )}
                  {o.status === 'picked_up' && (
                    <Button variant="secondary" size="sm" onClick={() => handleShippingStatus(o, 'delivering')}>
                      Đang giao
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t border-hairline px-base py-sm">
            <Pagination total={total} pageSize={PAGE_SIZE} page={page} onChange={setPage} />
          </div>
        </Card>
      )}

      {/* Modal Hủy đơn */}
      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title={`Hủy đơn hàng ${cancelTarget?.code}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelTarget(null)} disabled={cancelling}>
              Bỏ qua
            </Button>
            <Button onClick={handleConfirmCancel} disabled={cancelling}>
              {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
            </Button>
          </>
        }
      >
        <div className="space-y-base">
          <p className="text-body-sm text-body">
            Bạn có chắc chắn muốn hủy đơn hàng <strong>{cancelTarget?.code}</strong>?
            {cancelTarget?.isPaid && (
              <span className="block mt-2 text-error font-medium">
                Đơn đã thanh toán chỉ được hủy sau khi VNPAY xác nhận hoàn tiền.
              </span>
            )}
          </p>
          <Input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            hint="Lý do hủy đơn"
            error={cancelError}
            placeholder="Nhập lý do hủy đơn (bắt buộc)..."
            required
          />
        </div>
      </Modal>

      {/* Modal Chi tiết đơn hàng */}
      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Chi tiết đơn hàng ${selectedOrder?.order_code}`}
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setSelectedOrder(null)}>
            Đóng
          </Button>
        }
      >
        {selectedOrder && (
          <div className="space-y-base text-body-sm">
            <div className="grid grid-cols-2 gap-sm border-b border-hairline pb-sm">
              <div>
                <span className="text-caption text-body block">Khách hàng</span>
                <span className="font-semibold text-ink block">{selectedOrder.customer_name}</span>
                <span className="text-caption text-body">{selectedOrder.customer_email}</span>
              </div>
              <div>
                <span className="text-caption text-body block">Cửa hàng</span>
                <span className="font-semibold text-ink block">{selectedOrder.restaurant_name}</span>
              </div>
            </div>

            <div className="border-b border-hairline pb-sm space-y-xs">
              <span className="text-caption text-body block">Địa chỉ giao hàng</span>
              <span className="text-ink leading-relaxed block">{selectedOrder.delivery_address_snapshot}</span>
              {selectedOrder.customer_note && (
                <div className="mt-xs bg-canvas-soft p-xs rounded border border-hairline text-xs">
                  <span className="font-medium text-ink">Ghi chú của khách:</span> {selectedOrder.customer_note}
                </div>
              )}
            </div>

            <div className="border-b border-hairline pb-sm space-y-xs">
              <span className="text-caption text-body block">Thông tin thanh toán & vận chuyển</span>
              <div className="grid grid-cols-2 gap-xs">
                <div>
                  <span className="text-body block">Hình thức: {PAYMENT_METHODS[selectedOrder.payment_method] || 'Chưa xác định'}</span>
                  <span className="text-body block">Khoảng cách: {selectedOrder.distance_km} km</span>
                </div>
                <div>
                  <div className="flex items-center gap-xs">
                    <span className="text-body">Đơn hàng:</span>
                    <Badge tone={ORDER_STATUS[selectedOrder.status]?.tone || 'default'}>
                      {ORDER_STATUS[selectedOrder.status]?.label || selectedOrder.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-xs mt-xs">
                    <span className="text-body">Thanh toán:</span>
                    <Badge tone={PAY_STATUS[selectedOrder.payment_status]?.tone || 'default'}>
                      {PAY_STATUS[selectedOrder.payment_status]?.label || selectedOrder.payment_status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-xs">
              <span className="text-caption text-body block">Chi tiết tài chính</span>
              <div className="bg-canvas-soft p-sm rounded-lg space-y-xs font-mono text-ink">
                <div className="flex justify-between">
                  <span>Giá trị món ăn:</span>
                  <span>{formatVnd(Number(selectedOrder.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí giao hàng:</span>
                  <span>{formatVnd(Number(selectedOrder.delivery_fee))}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Khuyến mãi:</span>
                  <span>-{formatVnd(Number(selectedOrder.discount_amount))}</span>
                </div>
                <div className="flex justify-between border-t border-hairline-strong pt-xs font-semibold text-title-sm text-ink">
                  <span>Tổng tiền thanh toán:</span>
                  <span>{formatVnd(Number(selectedOrder.total_amount))}</span>
                </div>

                <div className="border-t border-hairline pt-xs mt-xs text-xs text-body font-sans space-y-1">
                  <div className="flex justify-between">
                    <span>Quán nhận được:</span>
                    <span>{formatVnd(Number(selectedOrder.merchant_earning))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nền tảng thu:</span>
                    <span>{formatVnd(Number(selectedOrder.platform_fee))}</span>
                  </div>
                </div>
              </div>
            </div>

            {Array.isArray(selectedOrder.payments) && selectedOrder.payments.length > 0 && (
              <div className="border-t border-hairline pt-sm">
                <span className="text-caption text-body block">Lịch sử thanh toán</span>
                <div className="mt-xs space-y-xs">
                  {selectedOrder.payments.map((payment) => (
                    <div key={payment.id} className="flex flex-wrap items-center justify-between gap-sm rounded-md bg-canvas-soft p-sm">
                      <div>
                        <div className="text-ink">{PAYMENT_METHODS[payment.method] || 'Phương thức khác'} · {PAYMENT_TRANSACTION_STATUS[payment.status] || 'Không xác định'}</div>
                        <div className="mt-1 text-caption text-body">{payment.gateway_txn_id ? `Mã giao dịch: ${payment.gateway_txn_id}` : 'Chưa có mã giao dịch'}</div>
                      </div>
                      <div className="nums text-ink">{formatVnd(Number(payment.amount))}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(selectedOrder.refunds) && selectedOrder.refunds.length > 0 && (
              <div className="border-t border-hairline pt-sm">
                <span className="text-caption text-body block">Lịch sử hoàn tiền</span>
                <div className="mt-xs space-y-xs">
                  {selectedOrder.refunds.map((refund) => (
                    <div key={refund.id} className="flex flex-wrap items-center justify-between gap-sm rounded-md bg-canvas-soft p-sm">
                      <div>
                        <div className="text-ink">{REFUND_STATUS[refund.status] || 'Không xác định'}</div>
                        <div className="mt-1 text-caption text-body">{refund.gateway_txn_id ? `Mã giao dịch: ${refund.gateway_txn_id}` : refund.failure_reason || 'Đang chờ cổng thanh toán phản hồi'}</div>
                      </div>
                      <div className="nums text-ink">{formatVnd(Number(refund.amount))}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 && (
              <div className="border-t border-hairline pt-sm">
                <span className="text-caption text-body block">Món trong đơn</span>
                <div className="mt-xs space-y-xs">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-sm">
                      <span className="text-ink">{item.quantity} x {item.item_name_snapshot}</span>
                      <span>{formatVnd(Number(item.line_subtotal))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(selectedOrder.statusLogs) && selectedOrder.statusLogs.length > 0 && (
              <div className="border-t border-hairline pt-sm">
                <span className="text-caption text-body block">Lịch sử trạng thái</span>
                <ol className="mt-xs space-y-xs">
                  {selectedOrder.statusLogs.map((log) => (
                    <li key={log.id} className="flex justify-between gap-sm">
                      <span className="text-ink">{log.from_status ? (ORDER_STATUS[log.from_status]?.label || 'Chưa xác định') + ' → ' : ''}{ORDER_STATUS[log.to_status]?.label || 'Chưa xác định'}</span>
                      <span className="text-caption text-body">{new Date(log.created_at).toLocaleString('vi-VN')}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {selectedOrder.status === 'cancelled' && (
              <div className="bg-error/5 p-sm rounded-lg border border-error/20 text-xs text-error space-y-xs">
                <div className="font-semibold">Đơn hàng bị hủy:</div>
                <div>Lý do: {selectedOrder.cancel_reason || 'Không có lý do cụ thể'}</div>
                <div>Hủy lúc: {selectedOrder.cancelled_at ? new Date(selectedOrder.cancelled_at).toLocaleString() : 'Không rõ'}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
