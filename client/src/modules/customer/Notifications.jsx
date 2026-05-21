import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Tabs from '../../components/Tabs.jsx';
import EmptyState from '../../components/EmptyState.jsx';

// Trang Notifications cho khách hàng — khớp bảng `notifications`
// (type, title, body, link_url, is_read, read_at).
const MOCK_NOTIFICATIONS = [
  {
    id: 'n-1',
    type: 'order_delivered',
    title: 'Đơn hàng đã giao',
    body: 'Đơn ORD-A1B2C đã được giao tới bạn. Hãy đánh giá tài xế nhé!',
    link: '/app/reviews/ord-a1b2c',
    isRead: false,
    at: Date.now() - 5 * 60 * 1000,
  },
  {
    id: 'n-2',
    type: 'order_picked_up',
    title: 'Tài xế đã lấy hàng',
    body: 'Tài xế Hoàng đang trên đường đến địa chỉ của bạn.',
    link: '/app/track/ord-a1b2c',
    isRead: false,
    at: Date.now() - 25 * 60 * 1000,
  },
  {
    id: 'n-3',
    type: 'order_accepted',
    title: 'Quán đã xác nhận đơn',
    body: 'Cinque Pizzeria đã nhận đơn ORD-A1B2C, dự kiến giao trong 25 phút.',
    link: '/app/track/ord-a1b2c',
    isRead: false,
    at: Date.now() - 40 * 60 * 1000,
  },
  {
    id: 'n-4',
    type: 'payment_succeeded',
    title: 'Thanh toán thành công',
    body: 'Thanh toán VNPay cho đơn ORD-A1B2C đã hoàn tất.',
    link: '/app/orders',
    isRead: true,
    at: Date.now() - 6 * 60 * 60 * 1000,
  },
  {
    id: 'n-5',
    type: 'system',
    title: 'Ưu đãi mới: NOMNOM15',
    body: 'Giảm 15% cho đơn hàng tiếp theo trong tuần này.',
    link: '/app/profile/promotions',
    isRead: true,
    at: Date.now() - 26 * 60 * 60 * 1000,
  },
  {
    id: 'n-6',
    type: 'order_cancelled',
    title: 'Đơn hàng bị hủy',
    body: 'Đơn ORD-Z9Y8X đã bị hủy theo yêu cầu của bạn. Hoàn tiền trong 1-2 ngày.',
    link: '/app/orders',
    isRead: true,
    at: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
];

const ICON_MAP = {
  order_delivered: { icon: 'check', tone: 'success' },
  order_picked_up: { icon: 'bike', tone: 'live' },
  order_accepted: { icon: 'package', tone: 'live' },
  order_ready: { icon: 'package', tone: 'live' },
  order_cancelled: { icon: 'x', tone: 'error' },
  payment_succeeded: { icon: 'wallet', tone: 'success' },
  payment_failed: { icon: 'alert', tone: 'error' },
  payout_status: { icon: 'cash', tone: 'default' },
  kyc_status: { icon: 'shield', tone: 'default' },
  system: { icon: 'bell', tone: 'default' },
};

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(ts).toLocaleDateString('vi-VN');
}

export default function CustomerNotifications() {
  const [items, setItems] = useState(MOCK_NOTIFICATIONS);
  const [tab, setTab] = useState('all');

  const filtered = useMemo(() => {
    if (tab === 'unread') return items.filter((n) => !n.isRead);
    if (tab === 'order') return items.filter((n) => n.type.startsWith('order_'));
    if (tab === 'system') return items.filter((n) => n.type === 'system');
    return items;
  }, [items, tab]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const markRead = (id) =>
    setItems((cur) => cur.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  const markAllRead = () =>
    setItems((cur) => cur.map((n) => ({ ...n, isRead: true })));
  const remove = (id) => setItems((cur) => cur.filter((n) => n.id !== id));

  return (
    <div className="container-page py-xl">
      <div className="mb-base flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Tài khoản</div>
          <h1 className="text-display-md text-ink md:text-display-lg">Thông báo</h1>
          <p className="mt-xs text-body-md text-body">
            Cập nhật đơn hàng, thanh toán và ưu đãi.
            {unreadCount > 0 && (
              <>
                {' '}
                Bạn có <span className="font-medium text-ink">{unreadCount}</span> thông báo chưa đọc.
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-xs">
          <Button variant="secondary" leadingIcon="check" onClick={markAllRead} disabled={unreadCount === 0}>
            Đánh dấu đã đọc
          </Button>
        </div>
      </div>

      <Tabs
        className="mb-base w-fit max-w-full"
        items={[
          { value: 'all', label: 'Tất cả' },
          { value: 'unread', label: `Chưa đọc${unreadCount ? ` (${unreadCount})` : ''}` },
          { value: 'order', label: 'Đơn hàng' },
          { value: 'system', label: 'Hệ thống' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon="bell"
          title="Không có thông báo"
          message="Khi có cập nhật đơn hàng hay khuyến mãi mới, bạn sẽ thấy ở đây."
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-hairline">
            {filtered.map((n) => {
              const meta = ICON_MAP[n.type] || ICON_MAP.system;
              return (
                <li key={n.id} className={n.isRead ? '' : 'bg-canvas-soft'}>
                  <div className="flex items-start gap-sm p-base md:p-md">
                    <span
                      className={
                        'grid h-10 w-10 shrink-0 place-items-center rounded-md ' +
                        (meta.tone === 'success'
                          ? 'bg-[#e6f4ea] text-success'
                          : meta.tone === 'error'
                            ? 'bg-[#fbeaea] text-error'
                            : meta.tone === 'live'
                              ? 'bg-canvas-soft text-ink'
                              : 'bg-canvas-soft text-ink')
                      }
                    >
                      <Icon name={meta.icon} size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-title-md text-ink">
                          {n.title}
                          {!n.isRead && (
                            <Badge tone="live" className="ml-2" dot>
                              Mới
                            </Badge>
                          )}
                        </div>
                        <span className="shrink-0 text-caption text-body">{timeAgo(n.at)}</span>
                      </div>
                      <p className="mt-1 text-body-sm text-body">{n.body}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => markRead(n.id)}
                            className="inline-flex items-center gap-1 text-button text-text-link hover:underline"
                          >
                            Xem chi tiết <Icon name="arrowRight" size={14} />
                          </Link>
                        )}
                        {!n.isRead && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="text-button text-body hover:text-ink"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                        <button
                          onClick={() => remove(n.id)}
                          className="text-button text-body hover:text-ink"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
