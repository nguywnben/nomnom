import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import Badge from '../../components/Badge.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { apiGet, apiPost } from '../../lib/api.js';
import { formatVnd } from '../../lib/formatVnd.js';

const STEPS = [
  { id: 'placed', label: 'Đã đặt', icon: 'check' },
  { id: 'accepted', label: 'Đã nhận đơn', icon: 'store' },
  { id: 'preparing', label: 'Đang chuẩn bị', icon: 'package' },
  { id: 'ready_for_pickup', label: 'Sẵn sàng lấy', icon: 'package' },
  { id: 'picked_up', label: 'Đã lấy hàng', icon: 'bike' },
  { id: 'delivering', label: 'Đang giao', icon: 'bike' },
  { id: 'delivered', label: 'Đã giao', icon: 'check' },
];

const STEP_INDEX = STEPS.reduce((acc, step, index) => ({ ...acc, [step.id]: index }), {});

function formatTime(value) {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTime(value) {
  if (!value) return '--';
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

function buildTimeline(order) {
  return STEPS.map((step) => {
    const timestampMap = {
      placed: order.placed_at ?? order.placedAt,
      accepted: order.accepted_at ?? order.acceptedAt,
      preparing: order.preparing_at ?? order.preparingAt,
      ready_for_pickup: order.ready_for_pickup_at ?? order.ready_at ?? order.readyAt,
      picked_up: order.picked_up_at ?? order.pickedUpAt,
      delivering: order.delivering_at ?? order.deliveringAt,
      delivered: order.delivered_at ?? order.deliveredAt,
    };

    return {
      status: step.id,
      at: timestampMap[step.id] ?? null,
    };
  });
}

export default function CustomerTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!order) return;
    const isUnpaid = (order.payment_method === 'vnpay' || order.paymentMethod === 'vnpay') && 
                     (order.payment_status === 'unpaid' || order.paymentStatus === 'unpaid' || order.payment_status === 'failed' || order.paymentStatus === 'failed') &&
                     (order.status === 'pending_payment' || order.status === 'payment_failed');
    if (!isUnpaid) return;

    const createdAtTime = new Date(order.created_at ?? order.createdAt).getTime();
    const expiryTime = createdAtTime + 30 * 60 * 1000;

    const updateTimer = () => {
      const remaining = Math.max(0, expiryTime - Date.now());
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order]);

  const formatTimeLeft = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    const fetchOrder = async () => {
      try {
        const data = await apiGet(`/api/v1/orders/${encodeURIComponent(id)}`);
        if (cancelled) return;

        setOrder(data);
        setError('');

        if (intervalId && (data.status === 'delivered' || data.status === 'cancelled' || data.status === 'failed')) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Không tải được trạng thái đơn hàng.');
      }
    };

    fetchOrder().finally(() => {
      if (!cancelled) {
        setLoading(false);
        intervalId = window.setInterval(fetchOrder, 5000);
      }
    });

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [id]);

  const activeStatus = order?.status ?? 'placed';
  const isDelivered = activeStatus === 'delivered';
  const isTerminal = ['delivered', 'cancelled', 'failed', 'expired'].includes(activeStatus);
  const timeline = useMemo(() => buildTimeline(order ?? {}), [order]);

  const timelineByStatus = useMemo(() => {
    const map = new Map();
    timeline.forEach((item) => {
      map.set(item.status, item.at);
    });
    return map;
  }, [timeline]);

  if (loading) {
    return <div className="container-page py-section text-center">Đang tải...</div>;
  }

  if (!order) {
    return (
      <div className="container-page py-section">
        <Card padded>
          <div className="text-title-md text-ink">Không thể tải đơn hàng.</div>
          <p className="mt-1 text-body-sm text-body">{error || 'Không có dữ liệu theo dõi để hiển thị.'}</p>
        </Card>
      </div>
    );
  }

  if (order.status === 'cancelled' || order.status === 'expired') {
    const title = order.status === 'cancelled' ? `Đơn ${order.order_code} đã bị hủy` : `Đơn ${order.order_code} đã hết hạn thanh toán`;
    const message = order.status === 'cancelled' 
      ? (order.cancel_reason || 'Vui lòng liên hệ quán hoặc hỗ trợ NomNom nếu cần thêm thông tin.') 
      : 'Đơn hàng tự động hủy vì không nhận được thanh toán trong vòng 30 phút.';
    return (
      <div className="container-page py-xl">
        <Link to="/app/orders" className="inline-flex items-center gap-1 text-button text-body hover:text-ink">
          <Icon name="chevronLeft" size={14} /> Đơn hàng của tôi
        </Link>
        <Card padded className="mt-base">
          <div className="text-title-md text-ink">{title}</div>
          <p className="mt-1 text-body-sm text-body">{message}</p>
        </Card>
      </div>
    );
  }
  return (
    <div className="container-page py-xl">
      <Link to="/app/orders" className="inline-flex items-center gap-1 text-button text-body hover:text-ink">
        <Icon name="chevronLeft" size={14} /> Đơn hàng của tôi
      </Link>

      <div className="mt-2 mb-base flex items-end justify-between">
        <div>
          <div className="text-caption-uppercase text-body">Đơn hàng #{order.order_code ?? order.orderCode ?? id}</div>
          <h1 className="text-display-lg text-ink">{isTerminal ? 'Chi tiết đơn hàng' : 'Theo dõi đơn hàng'}</h1>
          {error && <p className="mt-1 text-caption text-warning">{error}</p>}
        </div>
        <Badge tone={activeStatus === 'expired' ? 'warning' : 'live'} dot>
          {isDelivered ? 'Đã giao' : activeStatus === 'cancelled' ? 'Đã hủy' : activeStatus === 'expired' ? 'Hết hạn' : activeStatus === 'failed' ? 'Thất bại' : 'Đang xử lý'}
        </Badge>
      </div>

      <div className="grid gap-xl lg:grid-cols-[1fr_360px]">
        <div className="space-y-base lg:col-span-2">
          {((order.payment_method === 'vnpay' || order.paymentMethod === 'vnpay') && 
            (order.payment_status === 'unpaid' || order.paymentStatus === 'unpaid' || order.payment_status === 'failed' || order.paymentStatus === 'failed') &&
            (order.status === 'pending_payment' || order.status === 'payment_failed')) && (
            <Card padded style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: '1px', borderStyle: 'solid' }}>
              <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-title-md text-ink flex items-center gap-2" style={{ color: '#b45309' }}>
                    <Icon name="clock" size={18} />
                    Chờ thanh toán qua VNPay
                  </div>
                  <p className="text-body-sm text-body mt-1">
                    Vui lòng hoàn tất thanh toán trước khi đơn hàng tự động hủy sau 30 phút kể từ lúc đặt hàng.
                  </p>
                </div>
                <div className="flex flex-col items-start gap-sm md:items-end">
                  {timeLeft > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="text-title-lg font-mono font-bold" style={{ color: '#b45309' }}>
                        {formatTimeLeft(timeLeft)}
                      </div>
                      <Button
                        size="sm"
                        loading={paying}
                        onClick={async () => {
                          setPaying(true);
                          try {
                            const res = await apiPost('/api/v1/payments/vnpay/create', { orderId: order.id });
                            if (res && res.paymentUrl) {
                              window.location.href = res.paymentUrl;
                            } else {
                              throw new Error('Không nhận được link thanh toán từ server.');
                            }
                          } catch (err) {
                            alert(err.message || 'Không thể tạo liên kết thanh toán VNPay.');
                          } finally {
                            setPaying(false);
                          }
                        }}
                      >
                        Thanh toán lại
                      </Button>
                    </div>
                  ) : (
                    <div className="text-body-sm font-semibold" style={{ color: '#dc2626' }}>
                      Đơn hàng đã hết hạn thanh toán
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
          <Card padded>
            <div className="mb-base flex items-center justify-between gap-2">
              <div>
                <div className="text-title-md text-ink">Trạng thái đơn hàng</div>
                <p className="text-caption text-body">
                  Dự kiến giao lúc {formatTime(order.estimated_delivery_at ?? order.estimatedDeliveryAt)}
                </p>
              </div>
              <span className="text-caption text-body">
                Cập nhật gần nhất: {formatDateTime(timelineByStatus.get(activeStatus) ?? order.updated_at ?? order.updatedAt)}
              </span>
            </div>

            {!isTerminal && <ol className="space-y-3">
              {timeline.map((step) => {
                const done = STEP_INDEX[activeStatus] >= STEP_INDEX[step.status];
                const active = activeStatus === step.status;

                return (
                  <li key={step.status} className="flex items-start gap-3">
                    <div
                      className={
                        'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-pill border-2 transition-colors ' +
                        (done
                          ? 'bg-primary border-primary text-on-primary'
                          : 'bg-surface-card border-hairline-strong text-body')
                      }
                    >
                      <Icon name={step.status === 'preparing' || step.status === 'ready_for_pickup' ? 'package' : step.status === 'delivering' || step.status === 'picked_up' ? 'bike' : 'check'} size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className={'text-body-md font-semibold ' + (done ? 'text-ink' : 'text-body')}>
                          {STEPS.find((item) => item.id === step.status)?.label ?? step.status}
                        </div>
                        <div className="text-caption text-body">{step.at ? formatTime(step.at) : active ? 'Đang cập nhật' : '--'}</div>
                      </div>
                      {active && !isDelivered && <div className="text-caption text-success">Đang tiến hành</div>}
                    </div>
                  </li>
                );
              })}
            </ol>}
          </Card>

          <Card padded>
            <div className="text-title-md text-ink">Chi tiết đơn hàng</div>
            <div className="mt-base flex flex-col divide-y divide-hairline text-body-sm">
              {(order.items ?? []).map((item, index) => {
                const quantity = Number(item.quantity ?? item.qty ?? 1);
                const price = Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0);
                return (
                  <div key={item.id ?? item.menuItemId ?? index} className="flex items-start justify-between gap-base py-sm">
                    <span className="min-w-0 text-ink"><strong>{quantity}x</strong> {item.name ?? item.menu_item_name ?? 'Món ăn'}</span>
                    <span className="shrink-0 nums text-body">{formatVnd(price * quantity)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-base grid gap-sm border-t border-hairline pt-base text-body-sm md:grid-cols-2">
              <div><div className="text-caption-uppercase text-body">Nhà hàng</div><div className="mt-1 text-ink">{order.restaurant?.name ?? order.restaurant_name ?? 'Nhà hàng đối tác'}</div></div>
              <div><div className="text-caption-uppercase text-body">Thanh toán</div><div className="mt-1 text-ink">{(order.payment_method ?? order.paymentMethod) === 'vnpay' ? 'VNPay' : 'Thanh toán khi nhận hàng'}</div></div>
              <div><div className="text-caption-uppercase text-body">Giao đến</div><div className="mt-1 text-ink">{order.delivery_address ?? order.deliveryAddress ?? 'Địa chỉ đã chọn khi đặt đơn'}</div></div>
              <div><div className="text-caption-uppercase text-body">Tổng cộng</div><div className="mt-1 nums font-semibold text-ink">{formatVnd(Number(order.total_amount ?? order.totalAmount ?? 0))}</div></div>
            </div>
            {order.customer_note && <p className="mt-base border-t border-hairline pt-base text-caption text-body">Ghi chú: {order.customer_note}</p>}
          </Card>

          {isDelivered && (
            <Card padded>
              <div className="text-title-md text-ink mb-1">Đánh giá trải nghiệm của bạn</div>
              <p className="text-body-sm text-body">
                Hãy cho chúng tôi biết về món ăn và trải nghiệm giao hàng.
              </p>
              <Button
                className="mt-sm w-full"
                onClick={() => nav('/app/reviews/write/' + order.id)}
              >
                Để lại đánh giá
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
