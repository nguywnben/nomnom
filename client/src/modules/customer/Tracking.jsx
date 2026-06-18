import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import Avatar from '../../components/Avatar.jsx';
import MockMap from '../../components/MockMap.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { currentDriver } from '../../data/mock.js';
import { formatVnd } from '../../lib/formatVnd.js';
import { apiGet } from '../../lib/api.js';

const STEPS = [
  { id: 'placed', label: 'Đã đặt', icon: 'check' },
  { id: 'preparing', label: 'Đang chuẩn bị', icon: 'store' },
  { id: 'picked_up', label: 'Đã lấy hàng', icon: 'package' },
  { id: 'delivering', label: 'Đang giao', icon: 'bike' },
  { id: 'delivered', label: 'Đã giao', icon: 'check' },
];

const STEP_INDEX = STEPS.reduce((acc, s, i) => ({ ...acc, [s.id]: i }), {});

export default function CustomerTracking() {
  const { id } = useParams();
  const nav = useNavigate();
  const { setChatOpen, setActiveChatId } = useApp();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tự động chuyển tiến trình theo thời gian để demo
  const [stepId, setStepId] = useState('placed');

  useEffect(() => {
    apiGet('/api/v1/orders/' + id)
      .then(data => {
        setOrder(data);
        setStepId(data.status);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const progress = useMemo(() => (STEP_INDEX[stepId] || 1) / (STEPS.length - 1), [stepId]);

  if (loading) {
    return <div className="container-page py-section text-center">Đang tải...</div>;
  }

  if (!order) {
    return (
      <div className="container-page py-section">
        <Card padded>Không có đơn hàng nào để theo dõi.</Card>
      </div>
    );
  }

  const restaurant = order.restaurant;

  const stops = [
    { id: 'm', kind: 'merchant', x: 15, y: 78, label: restaurant?.name?.split(' ')[0] },
    { id: 'd', kind: 'driver', x: 15 + progress * 70, y: 78 - progress * 56, label: 'Tài xế' },
    { id: 'c', kind: 'customer', x: 85, y: 22, label: 'Bạn' },
  ];

  return (
    <div className="container-page py-xl">
      <Link to="/app" className="inline-flex items-center gap-1 text-button text-body hover:text-ink">
        <Icon name="chevronLeft" size={14} /> Trang chủ
      </Link>

      <div className="mt-2 mb-base flex items-end justify-between">
        <div>
          <div className="text-caption-uppercase text-body">Đơn hàng #{order.order_code}</div>
          <h1 className="text-display-lg text-ink">Theo dõi trực tiếp</h1>
        </div>
        <Badge tone="live" dot>
          {stepId === 'delivered' ? 'Đã giao' : 'Trực tiếp'}
        </Badge>
      </div>

      <div className="grid gap-xl lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-base">
          {/* Bản đồ map */}
          <MockMap stops={stops} progress={progress} />

          {/* Stepper trạng thái quá trình */}
          <Card padded>
            <div className="text-title-md text-ink mb-base">Trạng thái</div>
            <ol className="flex items-center justify-between gap-2">
              {STEPS.map((s, idx) => {
                const done = STEP_INDEX[stepId] >= idx;
                const active = STEP_INDEX[stepId] === idx;
                return (
                  <li key={s.id} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={
                        'grid h-9 w-9 place-items-center rounded-pill border-2 transition-colors ' +
                        (done
                          ? 'bg-primary border-primary text-on-primary'
                          : 'bg-surface-card border-hairline-strong text-body')
                      }
                    >
                      <Icon name={s.icon} size={16} />
                    </div>
                    <span
                      className={
                        'text-caption ' + (done ? 'text-ink font-semibold' : 'text-body')
                      }
                    >
                      {s.label}
                    </span>
                    {active && stepId !== 'delivered' && (
                      <span className="text-caption text-success">Đang tiến hành</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>

          {/* Các món hàng (Items) */}
          <Card padded>
            <div className="text-title-md text-ink mb-base">Đơn hàng của bạn</div>
            <div className="flex flex-col divide-y divide-hairline">
              {order.items.map((i) => (
                <div key={i.id} className="flex items-center gap-sm py-sm">
                  <Image src={i.image_url} alt={i.item_name_snapshot} className="h-12 w-12 rounded-md" ratio="1" />
                  <div className="flex-1">
                    <div className="text-body-sm font-semibold text-ink">{i.item_name_snapshot}</div>
                    <div className="text-caption text-body">SL {i.quantity}</div>
                  </div>
                  <span className="nums text-body-sm text-ink">
                    {formatVnd(Number(i.unit_price_snapshot) * i.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start space-y-base">
          <Card padded>
            <div className="text-title-md text-ink mb-base">Tài xế của bạn</div>
            <div className="flex items-center gap-sm">
              <Avatar src={currentDriver.avatar} name={currentDriver.name} size="lg" />
              <div className="flex-1">
                <div className="text-body-md font-semibold text-ink">{currentDriver.name}</div>
                <div className="text-caption text-body">
                  {currentDriver.vehicle} · ★ {currentDriver.rating}
                </div>
              </div>
            </div>
            <div className="mt-base grid grid-cols-2 gap-xs">
              <Button
                variant="secondary"
                leadingIcon="phone"
                onClick={() => null}
              >
                Gọi điện
              </Button>
              <Button
                variant="secondary"
                leadingIcon="chat"
                onClick={() => {
                  setActiveChatId('chat-driver');
                  setChatOpen(true);
                }}
              >
                Nhắn tin
              </Button>
            </div>
          </Card>

          <Card padded>
            <div className="text-title-md text-ink mb-base">Quán ăn</div>
            <div className="flex items-center gap-sm">
              <Image src={restaurant?.banner_url} alt={restaurant?.name} className="h-12 w-12 rounded-md" ratio="1" />
              <div className="flex-1 min-w-0">
                <div className="text-body-md font-semibold text-ink truncate">{restaurant?.name}</div>
                <div className="text-caption text-body truncate">{restaurant?.address_line}</div>
              </div>
            </div>
            <Button
              variant="secondary"
              className="mt-base w-full"
              leadingIcon="chat"
              onClick={() => {
                setActiveChatId('chat-merchant');
                setChatOpen(true);
              }}
            >
              Nhắn cho nhà bếp
            </Button>
          </Card>

          {stepId === 'delivered' && (
            <Card padded>
              <div className="text-title-md text-ink mb-1">Đánh giá trải nghiệm của bạn</div>
              <p className="text-body-sm text-body">
                Hãy cho chúng tôi biết về đồ ăn và tài xế.
              </p>
              <Button
                className="mt-sm w-full"
                onClick={() => nav('/app/reviews/' + order.restaurant_id)}
              >
                Để lại đánh giá
              </Button>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
