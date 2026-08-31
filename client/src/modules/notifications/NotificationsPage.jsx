import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Icon from '../../components/Icon.jsx';
import Tabs from '../../components/Tabs.jsx';
import { fetchNotificationsApi, markAllNotificationsReadApi, markNotificationReadApi } from '../../lib/api.js';
import { useApp } from '../../context/AppContext.jsx';
import { announceNotificationsChanged } from '../../hooks/useUnreadNotificationCount.js';

const ICON_MAP = {
  order_delivered: { icon: 'check', tone: 'success' },
  order_picked_up: { icon: 'bike', tone: 'live' },
  order_accepted: { icon: 'package', tone: 'live' },
  order_ready: { icon: 'package', tone: 'live' },
  order_placed: { icon: 'package', tone: 'live' },
  order_cancelled: { icon: 'x', tone: 'error' },
  payment_succeeded: { icon: 'wallet', tone: 'success' },
  payment_failed: { icon: 'alert', tone: 'error' },
  payout_status: { icon: 'cash', tone: 'success' },
  kyc_status: { icon: 'shield', tone: 'warning' },
  system: { icon: 'bell', tone: 'default' },
};

function timeAgo(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return minutes + ' phút trước';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + ' giờ trước';
  const days = Math.floor(hours / 24);
  return days < 7 ? days + ' ngày trước' : new Date(value).toLocaleDateString('vi-VN');
}

export default function NotificationsPage({ audience = 'customer' }) {
  const { pushToast } = useApp();
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetchNotificationsApi({ limit: 100 });
      setItems(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải thông báo.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  const unreadCount = items.filter((item) => !item.isRead).length;
  const filtered = useMemo(() => items.filter((item) => {
    if (tab === 'unread') return !item.isRead;
    if (tab === 'order') return item.type.startsWith('order_');
    if (tab === 'system') return ['system', 'kyc_status', 'payout_status'].includes(item.type);
    return true;
  }), [items, tab]);

  const markRead = async (id) => {
    try {
      await markNotificationReadApi(id);
      setItems((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item));
      announceNotificationsChanged();
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể cập nhật', message: err.message || 'Vui lòng thử lại.' });
    }
  };

  const markAll = async () => {
    try {
      await markAllNotificationsReadApi();
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      announceNotificationsChanged();
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể cập nhật', message: err.message || 'Vui lòng thử lại.' });
    }
  };

  const customer = audience === 'customer';
  return (
    <div className={customer ? 'container-page py-xl' : 'space-y-base'}>
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">{customer ? 'Tài khoản' : 'Quản trị quán'}</div>
          <h1 className={customer ? 'text-display-md text-ink md:text-display-lg' : 'text-display-lg text-ink'}>Thông báo</h1>
          <p className="mt-xs text-body-sm text-body">{unreadCount ? 'Bạn có ' + unreadCount + ' thông báo chưa đọc.' : 'Bạn đã đọc tất cả thông báo.'}</p>
        </div>
        <Button variant="secondary" size="sm" leadingIcon="check" onClick={markAll} disabled={!unreadCount}>Đánh dấu đã đọc</Button>
      </div>

      <Tabs
        size="sm"
        className={(customer ? 'mt-base ' : '') + 'w-fit max-w-full'}
        items={[
          { value: 'all', label: 'Tất cả' },
          { value: 'unread', label: 'Chưa đọc' + (unreadCount ? ' (' + unreadCount + ')' : '') },
          { value: 'order', label: 'Đơn hàng' },
          { value: 'system', label: customer ? 'Hệ thống' : 'Vận hành' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {loading ? (
        <div className="py-section text-center text-body-sm text-body" role="status">Đang tải thông báo...</div>
      ) : error ? (
        <Card padded className="mt-base"><div className="text-title-sm text-ink">Không thể tải thông báo</div><p className="mt-1 text-body-sm text-body">{error}</p><Button className="mt-sm" variant="secondary" onClick={() => load()}>Thử lại</Button></Card>
      ) : filtered.length === 0 ? (
        <div className="mt-base"><EmptyState icon="bell" title="Không có thông báo" message="Thông báo mới về đơn hàng, thanh toán và vận hành sẽ xuất hiện ở đây." /></div>
      ) : (
        <Card padded={false} className="mt-base overflow-hidden">
          <ul className="divide-y divide-hairline">
            {filtered.map((item) => {
              const meta = ICON_MAP[item.type] || ICON_MAP.system;
              return <li key={item.id} className={item.isRead ? '' : 'bg-canvas-soft'}>
                <div className="flex items-start gap-sm p-base md:p-md">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface-card text-ink ring-1 ring-hairline"><Icon name={meta.icon} size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="text-title-md text-ink">{item.title}{!item.isRead && <Badge tone={meta.tone} className="ml-2" dot>Mới</Badge>}</div>
                      <span className="text-caption text-body">{timeAgo(item.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-body-sm text-body">{item.body}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {item.link && <Link to={item.link} onClick={() => markRead(item.id)} className="inline-flex items-center gap-1 text-button text-text-link hover:underline">Xem chi tiết <Icon name="arrowRight" size={14} /></Link>}
                      {!item.isRead && <button type="button" onClick={() => markRead(item.id)} className="text-button text-body hover:text-ink">Đánh dấu đã đọc</button>}
                    </div>
                  </div>
                </div>
              </li>;
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
