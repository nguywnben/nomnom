import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { apiGet } from '../../lib/api.js';

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
  const [error, setError] = useState('');

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
  const timeline = useMemo(() => buildTimeline(order ?? {}), [order]);

  const timelineByStatus = useMemo(() => {
    const map = new Map();
    timeline.forEach((item) => {
      map.set(item.status, item.at);
    });
    return map;
  }, [timeline]);

  const progress = useMemo(() => {
    const index = STEP_INDEX[activeStatus];
    return Number.isFinite(index) ? index / (STEPS.length - 1) : 0;
  }, [activeStatus]);

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

  return (
    <div className="container-page py-xl">
      <Link to="/app" className="inline-flex items-center gap-1 text-button text-body hover:text-ink">
        <Icon name="chevronLeft" size={14} /> Trang chủ
      </Link>

      <div className="mt-2 mb-base flex items-end justify-between">
        <div>
          <div className="text-caption-uppercase text-body">Đơn hàng #{order.order_code ?? order.orderCode ?? id}</div>
          <h1 className="text-display-lg text-ink">Theo dõi trực tiếp</h1>
          {error && <p className="mt-1 text-caption text-warning">{error}</p>}
        </div>
        <Badge tone="live" dot>
          {isDelivered ? 'Đã giao' : 'Trực tiếp'}
        </Badge>
      </div>

      <div className="grid gap-xl lg:grid-cols-[1fr_360px]">
        <div className="space-y-base lg:col-span-2">
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

            <ol className="space-y-3">
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
            </ol>
          </Card>

          {isDelivered && (
            <Card padded>
              <div className="text-title-md text-ink">Đơn hàng đã hoàn tất</div>
              <p className="mt-1 text-body-sm text-body">Bạn có thể mở trang đánh giá từ lịch sử đơn hàng.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
