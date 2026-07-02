import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Image from '../../components/Image.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Tabs from '../../components/Tabs.jsx';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import { apiGet, apiPost } from '../../lib/api.js';
import { formatVnd } from '../../lib/formatVnd.js';
import { useApp } from '../../context/AppContext.jsx';

const STATUS_TONE = {
  pending_payment: 'warning',
  placed: 'warning',
  accepted: 'warning',
  preparing: 'warning',
  ready_for_pickup: 'warning',
  picked_up: 'delivering',
  delivering: 'success',
  delivered: 'default',
  cancelled: 'critical',
  failed: 'critical',
};

const STATUS_LABEL = {
  pending_payment: 'Chờ thanh toán',
  placed: 'Đã đặt',
  accepted: 'Đã nhận đơn',
  preparing: 'Đang chuẩn bị',
  ready_for_pickup: 'Sẵn sàng lấy',
  picked_up: 'Tài xế đã lấy',
  delivering: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  failed: 'Thất bại',
};

export default function CustomerOrders() {
  const navigate = useNavigate();
  const { addToCart, clearCart, setCartOpen, pushToast } = useApp();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);

  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [cancellingId, setCancellingId] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (filterStatus !== 'all') {
      query.set('status', filterStatus);
    }
    query.set('page', page.toString());
    query.set('limit', pageSize.toString());

    apiGet('/api/v1/me/orders?' + query.toString())
      .then((res) => {
        setOrders(res?.data || []);
        setTotal(res?.pagination?.total || 0);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [filterStatus, page, pageSize, refetchTrigger]);

  const handleCardClick = (o) => {
    const isActive = o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'failed';
    if (isActive) {
      navigate(`/app/track/${o.orderCode}`);
    } else if (o.status === 'delivered') {
      setSelectedOrder(o);
    }
  };

  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);
    try {
      await apiPost(`/api/v1/me/orders/${orderId}/cancel`);
      pushToast({
        kind: 'success',
        title: 'Đã hủy đơn hàng',
        message: 'Đơn hàng của bạn đã được hủy thành công.',
      });
      setOrderToCancel(null);
      setPage(1);
      setRefetchTrigger((prev) => prev + 1);
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Lỗi hủy đơn',
        message: err.message || 'Không thể hủy đơn hàng này.',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const handleReorder = async (o) => {
    setReorderingId(o.id);
    try {
      await clearCart();
      for (const item of o.items) {
        await addToCart(
          o.restaurantId,
          {
            id: item.menuItemId,
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.unitPrice,
          },
          item.quantity,
          {
            restaurantName: o.restaurantName,
            restaurantLogo: o.restaurantLogo,
          }
        );
      }
      pushToast({
        kind: 'success',
        title: 'Đã đặt lại đơn',
        message: `Các món từ ${o.restaurantName} đã được thêm vào giỏ hàng.`,
      });
      setCartOpen(true);
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Lỗi đặt lại đơn',
        message: err.message || 'Không thể đặt lại đơn hàng này.',
      });
    } finally {
      setReorderingId(null);
    }
  };

  return (
    <div className="container-page py-xl">
      <div className="mb-base flex flex-col justify-between gap-base md:flex-row md:items-end">
        <div>
          <div className="text-caption-uppercase text-body">Lịch sử</div>
          <h1 className="text-display-lg text-ink">Đơn hàng của bạn</h1>
        </div>
        <div className="shrink-0">
          <Tabs
            items={[
              { value: 'all', label: 'Tất cả' },
              { value: 'active', label: 'Đang giao' },
              { value: 'delivered', label: 'Đã giao' },
              { value: 'cancelled', label: 'Đã huỷ' },
            ]}
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-section">Đang tải...</div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="package"
          title="Chưa có đơn hàng nào"
          message="Sau khi bạn đặt món, trạng thái đơn hàng sẽ hiển thị trực tiếp ở đây."
          action={
            <Link to="/app/search">
              <Button>Tìm quán ăn</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-base">
          <div className="flex flex-col gap-base">
            {orders.map((o) => {
              const statusLabel = STATUS_LABEL[o.status] || o.status;
              const toneColor = STATUS_TONE[o.status] || 'default';
              const isActive = o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'failed';
              const canCancel = o.status === 'pending_payment' || o.status === 'placed';
              const isDelivered = o.status === 'delivered';

              return (
                <Card
                  key={o.id}
                  padded
                  hover={isDelivered || isActive}
                  onClick={() => handleCardClick(o)}
                  className={
                    'flex flex-col gap-sm md:flex-row md:items-center md:gap-base transition-all duration-200 ' +
                    (isDelivered || isActive ? 'cursor-pointer hover:border-ink/20' : 'cursor-default')
                  }
                >
                  <Image src={o.restaurantBanner} alt={o.restaurantName} className="h-24 w-32 rounded-md object-cover animate-fade-in" ratio="4/3" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-title-md text-ink truncate">{o.restaurantName || 'Nhà hàng'}</div>
                      <Badge tone={toneColor} dot>{statusLabel}</Badge>
                    </div>
                    <div className="text-body-sm text-body truncate mt-1">
                      {o.items?.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-base gap-y-1 text-caption text-body">
                      <span>#{o.orderCode}</span>
                      <span>{new Date(o.placedAt).toLocaleString('vi-VN')}</span>
                      <span className="nums font-semibold text-ink">{formatVnd(Number(o.totalAmount))}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-xs md:self-center" onClick={(e) => e.stopPropagation()}>
                    {isActive && (
                      <Link to={`/app/track/${o.orderCode}`}>
                        <Button size="sm">Theo dõi</Button>
                      </Link>
                    )}
                    {canCancel && (
                      <Button
                        size="sm"
                        variant="critical"
                        onClick={() => setOrderToCancel(o)}
                      >
                        Hủy đơn
                      </Button>
                    )}
                    {isDelivered && (
                      <>
                        <Button size="sm" onClick={() => setSelectedOrder(o)}>
                          Chi tiết
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={reorderingId === o.id}
                          onClick={() => handleReorder(o)}
                        >
                          {reorderingId === o.id ? 'Đang thêm...' : 'Đặt lại'}
                        </Button>
                        <Link to={`/app/reviews/${o.restaurantId}`}>
                          <Button size="sm" variant="secondary">
                            Đánh giá
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <Pagination
            total={total}
            pageSize={pageSize}
            page={page}
            onChange={setPage}
            className="mt-lg border-t border-hairline pt-base"
          />
        </div>
      )}

      {/* Chi tiết đơn hàng Modal */}
      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Chi tiết đơn hàng #${selectedOrder?.orderCode}`}
      >
        {selectedOrder && (
          <div className="flex flex-col gap-base">
            <div className="flex items-center gap-sm">
              <div className="h-12 w-12 rounded-md bg-canvas-soft overflow-hidden border border-hairline shrink-0">
                {selectedOrder.restaurantLogo ? (
                  <Image src={selectedOrder.restaurantLogo} alt={selectedOrder.restaurantName} className="h-full w-full object-cover animate-fade-in" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-title-md bg-primary text-on-primary font-bold">
                    {selectedOrder.restaurantName?.[0]}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-title-md text-ink truncate">{selectedOrder.restaurantName}</div>
                <div className="text-body-sm text-body">
                  Đặt lúc: {new Date(selectedOrder.placedAt).toLocaleString('vi-VN')}
                </div>
              </div>
            </div>

            <div className="border-t border-hairline-strong pt-base">
              <div className="text-title-sm text-ink mb-xs">Món đã đặt</div>
              <div className="flex flex-col gap-sm max-h-48 overflow-y-auto pr-xs">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-body-sm gap-4">
                    <div className="text-ink truncate">
                      <span className="font-semibold text-body-sm">{item.quantity}x</span> {item.name}
                    </div>
                    <div className="nums text-body shrink-0">{formatVnd(item.unitPrice * item.quantity)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-hairline pt-base flex flex-col gap-xs">
              <div className="flex justify-between text-body-sm text-body">
                <span>Phương thức thanh toán</span>
                <span className="text-ink">{selectedOrder.paymentMethod === 'vnpay' ? 'VNPay' : 'COD'}</span>
              </div>
              <div className="flex justify-between text-body-sm text-body">
                <span>Trạng thái thanh toán</span>
                <Badge tone={selectedOrder.paymentStatus === 'paid' ? 'success' : 'warning'}>
                  {selectedOrder.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </Badge>
              </div>
              <div className="flex justify-between text-body-sm text-body">
                <span>Trạng thái đơn hàng</span>
                <Badge tone={STATUS_TONE[selectedOrder.status] || 'default'}>
                  {STATUS_LABEL[selectedOrder.status] || selectedOrder.status}
                </Badge>
              </div>
              {selectedOrder.deliveredAt && (
                <div className="flex justify-between text-body-sm text-body">
                  <span>Thời gian giao hàng</span>
                  <span className="text-ink">
                    {new Date(selectedOrder.deliveredAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-hairline-strong pt-base flex justify-between items-center">
              <span className="text-title-sm text-ink">Tổng cộng</span>
              <span className="nums text-title-md text-primary font-bold">
                {formatVnd(selectedOrder.totalAmount)}
              </span>
            </div>

            <div className="mt-base flex justify-end gap-sm border-t border-hairline pt-base">
              <Link to={`/app/reviews/${selectedOrder.restaurantId}`} onClick={() => setSelectedOrder(null)}>
                <Button variant="secondary">Đánh giá quán</Button>
              </Link>
              <Button onClick={() => setSelectedOrder(null)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal xác nhận hủy đơn */}
      <Modal
        open={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        title="Xác nhận hủy đơn hàng"
      >
        {orderToCancel && (
          <div className="flex flex-col gap-base">
            <p className="text-body text-ink">
              Bạn có chắc chắn muốn hủy đơn hàng <strong>#{orderToCancel.orderCode}</strong> từ{' '}
              <strong>{orderToCancel.restaurantName}</strong> không? Hành động này không thể hoàn tác.
            </p>
            <div className="mt-base flex justify-end gap-sm border-t border-hairline pt-base">
              <Button
                variant="secondary"
                disabled={cancellingId === orderToCancel.id}
                onClick={() => setOrderToCancel(null)}
              >
                Bỏ qua
              </Button>
              <Button
                variant="critical"
                disabled={cancellingId === orderToCancel.id}
                onClick={() => handleCancelOrder(orderToCancel.id)}
              >
                {cancellingId === orderToCancel.id ? 'Đang hủy...' : 'Hủy đơn'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
