import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Tabs from '../../components/Tabs.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const ITEMS = [
  { id: 'n1', type: 'order_placed', title: 'Đơn hàng mới', body: 'Mia đặt đơn ORD-Q8R7 với 3 món.', link: '/merchant/orders', isRead: false, at: Date.now() - 5 * 60 * 1000 },
  { id: 'n2', type: 'payout_status', title: 'Yêu cầu rút tiền đã được duyệt', body: 'Khoản 2.000.000 ₫ sẽ về tài khoản trong 1-2 ngày.', link: '/merchant/wallet', isRead: false, at: Date.now() - 6 * 60 * 60 * 1000 },
  { id: 'n3', type: 'kyc_status', title: 'Giấy phép sắp hết hạn', body: 'Giấy phép VSATTP sắp hết hạn trong 30 ngày. Hãy cập nhật.', link: '/merchant/onboarding', isRead: false, at: Date.now() - 24 * 60 * 60 * 1000 },
  { id: 'n4', type: 'order_cancelled', title: 'Khách hủy đơn', body: 'Đơn ORD-K1M2 đã bị khách hủy trước khi quán xác nhận.', link: '/merchant/orders', isRead: true, at: Date.now() - 2 * 24 * 60 * 60 * 1000 },
  { id: 'n5', type: 'system', title: 'Cập nhật chính sách', body: 'Chính sách hoa hồng mới áp dụng từ tháng sau (15% → 14%).', link: '#', isRead: true, at: Date.now() - 7 * 24 * 60 * 60 * 1000 },
];

const ICON = {
  order_placed: { i: 'package', tone: 'live' },
  order_cancelled: { i: 'x', tone: 'error' },
  payout_status: { i: 'wallet', tone: 'success' },
  kyc_status: { i: 'shield', tone: 'warning' },
  system: { i: 'bell', tone: 'default' },
};

function timeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

export default function MerchantNotifications() {
  const [items, setItems] = useState(ITEMS);
  const [tab, setTab] = useState('all');
  const unread = items.filter((n) => !n.isRead).length;
  const list = items.filter((n) => (tab === 'unread' ? !n.isRead : true));

  const markAll = () => setItems((cur) => cur.map((n) => ({ ...n, isRead: true })));
  const mark = (id) => setItems((cur) => cur.map((n) => (n.id === id ? { ...n, isRead: true } : n)));

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Quản trị</div>
          <h1 className="text-display-lg text-ink">Thông báo</h1>
          {unread > 0 && (
            <p className="mt-xs text-body-sm text-body">
              Có <span className="font-medium text-ink">{unread}</span> thông báo chưa đọc.
            </p>
          )}
        </div>
        <Button variant="secondary" leadingIcon="check" onClick={markAll} disabled={!unread}>
          Đánh dấu đã đọc
        </Button>
      </div>

      <Tabs
        className="w-fit max-w-full"
        items={[{ value: 'all', label: 'Tất cả' }, { value: 'unread', label: `Chưa đọc${unread ? ` (${unread})` : ''}` }]}
        value={tab}
        onChange={setTab}
      />

      {list.length === 0 ? (
        <EmptyState icon="bell" title="Không có thông báo" message="Quay lại sau khi có đơn hàng hoặc thông tin từ NomNom." />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-hairline">
            {list.map((n) => {
              const meta = ICON[n.type] || ICON.system;
              return (
                <li key={n.id} className={n.isRead ? '' : 'bg-canvas-soft'}>
                  <div className="flex items-start gap-sm p-base">
                    <span
                      className={
                        'grid h-10 w-10 shrink-0 place-items-center rounded-md ' +
                        (meta.tone === 'success'
                          ? 'bg-[#e6f4ea] text-success'
                          : meta.tone === 'error'
                            ? 'bg-[#fbeaea] text-error'
                            : meta.tone === 'warning'
                              ? 'bg-[#fbf1de] text-accent-warning'
                              : 'bg-canvas-soft text-ink')
                      }
                    >
                      <Icon name={meta.i} size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-title-md text-ink">
                          {n.title}
                          {!n.isRead && <Badge tone="live" className="ml-2" dot>Mới</Badge>}
                        </div>
                        <span className="shrink-0 text-caption text-body">{timeAgo(n.at)}</span>
                      </div>
                      <p className="mt-1 text-body-sm text-body">{n.body}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => mark(n.id)}
                            className="inline-flex items-center gap-1 text-button text-text-link hover:underline"
                          >
                            Xem chi tiết <Icon name="arrowRight" size={14} />
                          </Link>
                        )}
                        {!n.isRead && (
                          <button onClick={() => mark(n.id)} className="text-button text-body hover:text-ink">
                            Đánh dấu đã đọc
                          </button>
                        )}
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
