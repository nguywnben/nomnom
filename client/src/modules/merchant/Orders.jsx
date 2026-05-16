import { useEffect, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';

const COLUMNS = [
  { key: 'new', label: 'Mới', tone: 'warning' },
  { key: 'preparing', label: 'Đang nấu', tone: 'default' },
  { key: 'ready', label: 'Sẵn sàng', tone: 'success' },
  { key: 'completed', label: 'Đã xong', tone: 'outline' },
];

const NEXT = {
  new: { to: 'preparing', label: 'Nhận đơn' },
  preparing: { to: 'ready', label: 'Đánh dấu đã xong' },
  ready: { to: 'completed', label: 'Đánh dấu đã lấy' },
};

export default function MerchantOrders() {
  const { merchantOrders, moveMerchantOrder, pushToast } = useApp();
  const [sound, setSound] = useState(true);

  const onAdvance = (col, id) => moveMerchantOrder(id, col, NEXT[col].to);
  const onReject = (col, id) => {
    moveMerchantOrder(id, col, 'completed');
    pushToast({ kind: 'error', title: 'Đã từ chối đơn hàng', message: `#${id}` });
  };

  return (
    <div className="space-y-base">
      <div className="flex items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Hôm nay</div>
          <h1 className="text-display-lg text-ink">Đơn hàng trực tiếp</h1>
        </div>
        <div className="flex items-center gap-xs">
          <Badge tone="live" dot>Đã kết nối WebSocket</Badge>
          <Button
            variant="secondary"
            leadingIcon={sound ? 'bell' : 'bellOff'}
            onClick={() => setSound((s) => !s)}
          >
            Âm thanh {sound ? 'bật' : 'tắt'}
          </Button>
        </div>
      </div>

      {/* Kanban — horizontal scroll on mobile, 4-col grid on lg+ */}
      <div className="-mx-base flex gap-base overflow-x-auto px-base pb-2 scrollbar-hide md:mx-0 md:px-0 md:overflow-visible lg:grid lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = merchantOrders[col.key] || [];
          return (
            <div key={col.key} className="flex w-[280px] shrink-0 flex-col gap-sm lg:w-auto lg:shrink">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge tone={col.tone}>{col.label}</Badge>
                  <span className="text-caption text-body nums">{list.length}</span>
                </div>
                {col.key === 'new' && list.length > 0 && (
                  <Badge tone="live" dot>Cần xử lý</Badge>
                )}
              </div>

              {list.length === 0 ? (
                <EmptyState
                  icon="package"
                  title="Không có đơn hàng"
                  message={col.key === 'new' ? 'Các đơn hàng mới sẽ xuất hiện ở đây.' : 'Chưa có gì ở đây.'}
                  className="!p-base"
                />
              ) : (
                <ul className="flex flex-col gap-2">
                  {list.map((o) => (
                    <OrderCard
                      key={o.id}
                      order={o}
                      stage={col.key}
                      onAdvance={() => onAdvance(col.key, o.id)}
                      onReject={() => onReject(col.key, o.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order, stage, onAdvance, onReject }) {
  const minutesAgo = useMinutesAgo(order.placedAt);
  const action = NEXT[stage];
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-sm pt-sm">
        <span className="text-caption-uppercase text-body">#{order.id}</span>
        <div className="flex items-center gap-1">
          {order.isNew && (
            <Badge tone="success" dot>Mới</Badge>
          )}
          <Badge tone="outline">{minutesAgo} phút trước</Badge>
        </div>
      </div>
      <div className="px-sm py-sm">
        <div className="text-title-sm text-ink">{order.customerName}</div>
        <ul className="mt-1 space-y-0.5 text-body-sm text-body">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-base">
              <span>
                <span className="text-ink nums">{i.quantity}×</span> {i.name}
              </span>
              <span className="nums text-body">{formatVnd(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        {order.note && (
          <div className="mt-2 rounded-md border border-hairline bg-canvas-soft px-sm py-1.5 text-caption text-body">
            <Icon name="alert" size={11} className="mr-1 inline" /> {order.note}
          </div>
        )}
        <div className="mt-sm flex items-center justify-between">
          <span className="text-caption text-body">Tổng cộng</span>
          <span className="nums text-title-sm text-ink">{formatVnd(order.total)}</span>
        </div>
      </div>
      {action && (
        <div className="flex items-center gap-1 border-t border-hairline p-sm">
          {stage === 'new' && (
            <Button variant="secondary" size="sm" onClick={onReject}>
              Từ chối
            </Button>
          )}
          <Button size="sm" className="ml-auto" onClick={onAdvance}>
            {action.label}
          </Button>
        </div>
      )}
    </Card>
  );
}

function useMinutesAgo(timestamp) {
  // Kept out of render — refreshes every 30s.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  return Math.max(1, Math.round((now - timestamp) / 60000));
}
