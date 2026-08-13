import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import Badge from '../../components/Badge.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import { apiGet, apiPost, confirmOrderDeliveryApi } from '../../lib/api.js';
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
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
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
  const orderNotice =
    activeStatus === 'cancelled'
      ? {
          title: `Đơn ${order?.order_code ?? order?.orderCode ?? id} đã bị hủy`,
          message: order?.cancel_reason || 'Liên hệ quán ăn hoặc hỗ trợ NomNom nếu bạn cần thêm thông tin.',
        }
      : activeStatus === 'expired'
        ? {
            title: `Đơn ${order?.order_code ?? order?.orderCode ?? id} đã hết hạn thanh toán`,
            message: 'Đơn hàng tự động hủy vì không nhận được thanh toán trong vòng 30 phút.',
          }
      : activeStatus === 'payment_failed'
          ? {
              title: 'Thanh toán chưa thành công',
              message: 'Bạn có thể thử thanh toán lại trong thời gian đơn hàng còn hiệu lực.',
            }
          : activeStatus === 'failed'
            ? {
                title: 'Đơn hàng không thể xử lý',
                message: 'Đơn hàng này đã kết thúc. Liên hệ hỗ trợ NomNom nếu bạn cần thêm thông tin.',
              }
          : null;
  const timeline = useMemo(() => buildTimeline(order ?? {}), [order]);
  const subtotal = Number(order?.subtotal ?? order?.sub_total ?? 0);
  const deliveryFee = Number(order?.delivery_fee ?? order?.deliveryFee ?? 0);
  const discountAmount = Number(order?.discount_amount ?? order?.discountAmount ?? 0);
  const totalAmount = Number(order?.total_amount ?? order?.totalAmount ?? 0);

  const confirmDelivery = async () => {
    setConfirmingDelivery(true);
    try {
      await confirmOrderDeliveryApi(order.order_code ?? order.orderCode ?? order.id);
      setOrder((current) => ({ ...current, status: 'delivered', delivered_at: new Date().toISOString() }));
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể xác nhận đã nhận hàng.');
    } finally {
      setConfirmingDelivery(false);
    }
  };

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
        <Card padded hover={false}>
          <div className="text-title-md text-ink">Không thể tải đơn hàng.</div>
          <p className="mt-1 text-body-sm text-body">{error || 'Không có dữ liệu theo dõi để hiển thị.'}</p>
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
        <Badge tone={['cancelled', 'expired', 'failed', 'payment_failed'].includes(activeStatus) ? 'critical' : 'live'} dot>
          {isDelivered ? 'Đã giao' : activeStatus === 'cancelled' ? 'Đã hủy' : activeStatus === 'expired' ? 'Hết hạn' : activeStatus === 'payment_failed' ? 'Thanh toán chưa thành công' : activeStatus === 'failed' ? 'Thất bại' : 'Đang xử lý'}
        </Badge>
      </div>

      <div className="grid gap-xl lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-base lg:col-span-2">
          {orderNotice && (
            <Card padded hover={false}>
              <div className="text-title-md text-ink">{orderNotice.title}</div>
              <p className="mt-1 text-body-sm text-body">{orderNotice.message}</p>
            </Card>
          )}
          {activeStatus === 'delivering' && (
            <Card padded hover={false}>
              <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-title-md text-ink">Bạn đã nhận được đơn hàng?</div>
                  <p className="mt-1 text-body-sm text-body">Hãy xác nhận khi đã nhận đủ món. Đơn sẽ tự hoàn tất sau 2 giờ nếu bạn không phản hồi.</p>
                </div>
                <Button onClick={confirmDelivery} loading={confirmingDelivery} leadingIcon="check">
                  Xác nhận đã nhận hàng
                </Button>
              </div>
            </Card>
          )}
          {((order.payment_method === 'vnpay' || order.paymentMethod === 'vnpay') && 
            (order.payment_status === 'unpaid' || order.paymentStatus === 'unpaid' || order.payment_status === 'failed' || order.paymentStatus === 'failed') &&
            (order.status === 'pending_payment' || order.status === 'payment_failed')) && (
            <Card padded hover={false} style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: '1px', borderStyle: 'solid' }}>
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
          <Card padded hover={false} className="order-2">
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

          <Card padded hover={false} className="order-1">
            <div className="text-title-md text-ink">Chi tiết đơn hàng</div>
            <div className="mt-base flex flex-col divide-y divide-hairline text-body-sm">
              {(order.items ?? []).map((item, index) => {
                const quantity = Number(item.quantity ?? item.qty ?? 1);
                const price = Number(item.unitPrice ?? item.unit_price_snapshot ?? item.unit_price ?? item.price ?? 0);
                return (
                  <div key={item.id ?? item.menuItemId ?? index} className="flex items-center justify-between gap-base py-sm">
                    <div className="flex min-w-0 items-center gap-sm">
                      <Image
                        src={item.imageUrl ?? item.image_url ?? item.image}
                        alt={item.name ?? item.item_name_snapshot ?? item.menu_item_name ?? 'Món ăn'}
                        fallbackSeed={item.id ?? item.menuItemId ?? index}
                        ratio="1"
                        className="h-14 w-14 shrink-0 rounded-md object-cover"
                      />
                      <span className="min-w-0 truncate text-ink"><strong>{quantity}x</strong> {item.name ?? item.item_name_snapshot ?? item.menu_item_name ?? 'Món ăn'}</span>
                    </div>
                    <span className="shrink-0 nums text-body">{formatVnd(price * quantity)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-base grid gap-sm border-t border-hairline pt-base text-body-sm md:grid-cols-2">
              <div><div className="text-caption-uppercase text-body">Quán ăn</div><div className="mt-1 text-ink">{order.restaurant?.name ?? order.restaurant_name ?? 'Quán ăn đối tác'}</div></div>
              <div><div className="text-caption-uppercase text-body">Thanh toán</div><div className="mt-1 text-ink">{(order.payment_method ?? order.paymentMethod) === 'vnpay' ? 'VNPay' : 'Thanh toán khi nhận hàng'}</div></div>
              <div><div className="text-caption-uppercase text-body">Giao đến</div><div className="mt-1 text-ink">{order.delivery_address ?? order.deliveryAddress ?? 'Địa chỉ đã chọn khi đặt đơn'}</div></div>
            </div>
            <div className="mt-base space-y-2 border-t border-hairline pt-base text-body-sm">
              {subtotal > 0 && <div className="flex justify-between gap-base"><span className="text-body">Tạm tính</span><span className="nums text-ink">{formatVnd(subtotal)}</span></div>}
              <div className="flex justify-between gap-base"><span className="text-body">Phí giao hàng</span><span className="nums text-ink">{formatVnd(deliveryFee)}</span></div>
              {discountAmount > 0 && <div className="flex justify-between gap-base"><span className="text-body">Giảm giá</span><span className="nums text-success">-{formatVnd(discountAmount)}</span></div>}
              <div className="flex justify-between gap-base border-t border-hairline pt-sm text-title-md"><span className="text-ink">Tổng cộng</span><span className="nums text-ink">{formatVnd(totalAmount)}</span></div>
            </div>
            {order.customer_note && <p className="mt-base border-t border-hairline pt-base text-caption text-body">Ghi chú: {order.customer_note}</p>}
          </Card>

          {isDelivered && (
            <Card padded hover={false} className="order-3">
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
