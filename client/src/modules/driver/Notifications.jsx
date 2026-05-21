import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const ITEMS = [
  { id: 'd1', type: 'order_picked_up', title: 'Bạn đã nhận đơn ORD-Q8R', body: 'Hãy đến Cinque Pizzeria — 1.2 km, 4 phút.', link: '/driver/active', isRead: false, at: Date.now() - 4 * 60 * 1000 },
  { id: 'd2', type: 'payout_status', title: 'Yêu cầu rút tiền đã chuyển', body: '480.000 ₫ đã chuyển vào Techcombank · *** 1199.', link: '/driver/wallet', isRead: false, at: Date.now() - 8 * 60 * 60 * 1000 },
  { id: 'd3', type: 'kyc_status', title: 'Bằng lái sắp hết hạn', body: 'Bằng lái xe của bạn sắp hết hạn trong 20 ngày.', link: '/driver/onboarding', isRead: true, at: Date.now() - 24 * 60 * 60 * 1000 },
  { id: 'd4', type: 'system', title: 'Thưởng tuần này', body: 'Hoàn thành 30 chuyến để nhận thưởng 200.000 ₫.', link: '#', isRead: true, at: Date.now() - 3 * 24 * 60 * 60 * 1000 },
];

const ICON = {
  order_picked_up: { i: 'bike', tone: 'live' },
  payout_status: { i: 'wallet', tone: 'success' },
  kyc_status: { i: 'shield', tone: 'warning' },
  system: { i: 'bell', tone: 'default' },
};

function timeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ`;
  return `${Math.floor(h / 24)} ngày`;
}

export default function DriverNotifications() {
  const [items, setItems] = useState(ITEMS);
  const unread = items.filter((n) => !n.isRead).length;
  const mark = (id) => setItems((cur) => cur.map((n) => (n.id === id ? { ...n, isRead: true } : n)));

  return (
    <div className="px-base py-base">
      <div className="mb-base flex items-end justify-between">
        <div>
          <div className="text-caption-uppercase text-body">Tài xế</div>
          <h1 className="text-display-md text-ink">Thông báo</h1>
          {unread > 0 && (
            <p className="mt-xs text-body-sm text-body">{unread} thông báo chưa đọc</p>
          )}
        </div>
        <button
          onClick={() => setItems((cur) => cur.map((n) => ({ ...n, isRead: true })))}
          disabled={!unread}
          className="text-button text-text-link hover:underline disabled:cursor-not-allowed disabled:text-muted-soft"
        >
          Đánh dấu hết
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="bell" title="Không có thông báo" message="Khi có cập nhật về đơn hoặc thưởng, bạn sẽ thấy ở đây." />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-hairline">
            {items.map((n) => {
              const meta = ICON[n.type] || ICON.system;
              return (
                <li key={n.id} className={n.isRead ? '' : 'bg-canvas-soft'}>
                  <Link to={n.link} onClick={() => mark(n.id)} className="flex items-start gap-sm p-base">
                    <span
                      className={
                        'grid h-10 w-10 shrink-0 place-items-center rounded-md ' +
                        (meta.tone === 'success'
                          ? 'bg-[#e6f4ea] text-success'
                          : meta.tone === 'warning'
                            ? 'bg-[#fbf1de] text-accent-warning'
                            : 'bg-canvas-soft text-ink')
                      }
                    >
                      <Icon name={meta.i} size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-body-sm font-semibold text-ink">
                          {n.title}
                          {!n.isRead && <Badge tone="live" className="ml-2" dot>Mới</Badge>}
                        </div>
                        <span className="shrink-0 text-caption text-body">{timeAgo(n.at)}</span>
                      </div>
                      <p className="mt-1 text-caption text-body">{n.body}</p>
                    </div>
                    <Icon name="chevronRight" size={14} className="shrink-0 text-body" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
