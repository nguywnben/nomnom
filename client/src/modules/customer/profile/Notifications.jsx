import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Badge from '../../../components/Badge.jsx';
import Button from '../../../components/Button.jsx';
import Card from '../../../components/Card.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import Icon from '../../../components/Icon.jsx';
import { useApp } from '../../../context/AppContext.jsx';
import ProfileSubHeader from './ProfileSubHeader.jsx';

// ---------------------------------------------------------------------------
// Notifications inbox — danh sách thông báo gửi đến khách hàng.
// Cài đặt thông báo (toggle, kênh, master mute) được chuyển sang Settings.
// ---------------------------------------------------------------------------

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const SEED_NOTIFICATIONS = [
  {
    id: 'n-1',
    kind: 'order',
    title: 'Tài xế đang trên đường',
    body: 'Owen R. sẽ đến trong khoảng 7 phút. Theo dõi vị trí trên bản đồ trực tiếp.',
    at: Date.now() - 5 * MIN,
    icon: 'bike',
    link: '/app/track/ord-A1B2C',
    cta: 'Theo dõi đơn',
    unread: true,
  },
  {
    id: 'n-2',
    kind: 'order',
    title: 'Đơn hàng đang được chuẩn bị',
    body: 'Hachi Ramen đã xác nhận đơn #ord-A1B2C và đang chuẩn bị món của bạn.',
    at: Date.now() - 22 * MIN,
    icon: 'package',
    link: '/app/orders',
    cta: 'Xem đơn',
    unread: true,
  },
  {
    id: 'n-3',
    kind: 'promo',
    title: 'Voucher mới cho bạn',
    body: 'Áp dụng mã NOMNOM15 để giảm 15% (tối đa 250.000 ₫) cho đơn tiếp theo.',
    at: Date.now() - 4 * HOUR,
    icon: 'zap',
    link: '/app/profile/promotions',
    cta: 'Xem khuyến mãi',
    unread: true,
  },
  {
    id: 'n-4',
    kind: 'order',
    title: 'Đã giao thành công',
    body: 'Đơn #ord-Q3K9P từ Junebug Burgers đã được giao. Bạn thấy món ăn thế nào?',
    at: Date.now() - 26 * HOUR,
    icon: 'check',
    link: '/app/reviews/r-2',
    cta: 'Đánh giá',
    unread: false,
  },
  {
    id: 'n-5',
    kind: 'account',
    title: 'Đăng nhập từ thiết bị mới',
    body: 'Có người vừa đăng nhập tài khoản của bạn từ Chrome trên macOS. Nếu không phải bạn, hãy đổi mật khẩu ngay.',
    at: Date.now() - 2 * DAY - 3 * HOUR,
    icon: 'shield',
    link: '/app/profile/edit',
    cta: 'Kiểm tra bảo mật',
    unread: false,
  },
  {
    id: 'n-6',
    kind: 'promo',
    title: 'Tuần lễ ẩm thực Việt',
    body: 'Giảm tới 50.000 ₫ cho phở, bún, bánh mì từ ngày 13/05 đến 20/05.',
    at: Date.now() - 3 * DAY,
    icon: 'zap',
    link: '/app/profile/promotions',
    cta: 'Khám phá',
    unread: false,
  },
  {
    id: 'n-7',
    kind: 'system',
    title: 'Điều khoản dịch vụ cập nhật',
    body: 'Chúng tôi vừa cập nhật Điều khoản và Chính sách bảo mật. Vui lòng xem qua các thay đổi.',
    at: Date.now() - 5 * DAY,
    icon: 'alert',
    link: null,
    cta: null,
    unread: false,
  },
];

const FILTER_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'unread', label: 'Chưa đọc' },
  { id: 'order', label: 'Đơn hàng' },
  { id: 'promo', label: 'Khuyến mãi' },
];

const KIND_TONE = {
  order: 'success',
  promo: 'preview',
  account: 'warning',
  system: 'default',
};

const KIND_LABEL = {
  order: 'Đơn hàng',
  promo: 'Khuyến mãi',
  account: 'Tài khoản',
  system: 'Hệ thống',
};

function bucketOf(at) {
  const diff = Date.now() - at;
  if (diff < DAY) return 'today';
  if (diff < 7 * DAY) return 'week';
  return 'older';
}

const BUCKET_LABEL = {
  today: 'Hôm nay',
  week: 'Tuần này',
  older: 'Trước đó',
};

function formatRelative(at) {
  const diff = Date.now() - at;
  if (diff < MIN) return 'vừa xong';
  if (diff < HOUR) return `${Math.floor(diff / MIN)} phút trước`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} giờ trước`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} ngày trước`;
  return new Date(at).toLocaleDateString('vi-VN');
}

export default function Notifications() {
  const { authedRoles, pushToast, user } = useApp();
  const [items, setItems] = useState(SEED_NOTIFICATIONS);
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'unread') return items.filter((n) => n.unread);
    return items.filter((n) => n.kind === filter);
  }, [items, filter]);

  const unreadCount = items.filter((n) => n.unread).length;

  const buckets = useMemo(() => {
    const out = { today: [], week: [], older: [] };
    [...filtered]
      .sort((a, b) => b.at - a.at)
      .forEach((n) => out[bucketOf(n.at)].push(n));
    return out;
  }, [filtered]);

  const markRead = (id) =>
    setItems((cur) => cur.map((n) => (n.id === id ? { ...n, unread: false } : n)));

  const markAllRead = () => {
    if (!unreadCount) return;
    setItems((cur) => cur.map((n) => ({ ...n, unread: false })));
    pushToast({ kind: 'success', title: 'Đã đánh dấu tất cả là đã đọc' });
  };

  const remove = (id) => {
    setItems((cur) => cur.filter((n) => n.id !== id));
    pushToast({ kind: 'info', title: 'Đã xoá thông báo', duration: 1800 });
  };

  if (!user) {
    return (
      <div className="flex flex-col gap-base p-base md:container-page md:py-xl">
        <ProfileSubHeader title="Thông báo" />
        <Card padded>
          <div className="text-title-md text-ink">Cần đăng nhập</div>
          <p className="mt-1 text-body-sm text-body">
            Đăng nhập để xem thông báo về đơn hàng, ưu đãi và tài khoản của bạn.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-base p-base md:container-page md:py-xl">
      <ProfileSubHeader title="Thông báo" />

      {/* Action bar */}
      <div className="flex items-center justify-between gap-sm">
        <div className="text-body-sm text-body">
          {unreadCount > 0 ? (
            <>
              Bạn có <strong className="text-ink">{unreadCount}</strong> thông báo chưa đọc.
            </>
          ) : (
            'Tất cả thông báo đã được đọc.'
          )}
        </div>
        <div className="flex items-center gap-xs">
          <Link to="/app/profile/settings" className="hidden md:inline-flex">
            <Button size="sm" variant="secondary" leadingIcon="cog">
              Tuỳ chỉnh
            </Button>
          </Link>
          <Button
            size="sm"
            variant="secondary"
            leadingIcon="check"
            onClick={markAllRead}
            disabled={!unreadCount}
          >
            Đánh dấu đã đọc
          </Button>
        </div>
      </div>

      {/* Filter tabs — horizontal scroll trên mobile */}
      <div className="-mx-base overflow-x-auto px-base md:mx-0 md:px-0">
        <div className="inline-flex items-center gap-1 rounded-md border border-hairline-strong bg-surface-card p-1">
          {FILTER_TABS.map((t) => {
            const active = filter === t.id;
            const count =
              t.id === 'all'
                ? items.length
                : t.id === 'unread'
                  ? unreadCount
                  : items.filter((n) => n.kind === t.id).length;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={
                  'inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-sm px-sm text-button transition-colors ' +
                  (active ? 'bg-primary text-on-primary' : 'text-ink hover:bg-canvas-soft')
                }
              >
                {t.label}
                <span
                  className={
                    'inline-flex min-w-[18px] items-center justify-center rounded-pill px-1 text-[10px] font-semibold leading-none ' +
                    (active ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-strong text-body')
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inbox */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="bell"
          title="Không có thông báo"
          message={
            filter === 'all'
              ? 'Khi có cập nhật đơn hàng, ưu đãi hoặc cảnh báo bảo mật, chúng sẽ xuất hiện ở đây.'
              : 'Hãy thử chuyển sang bộ lọc khác để xem thêm.'
          }
        />
      ) : (
        <div className="flex flex-col gap-base">
          {Object.entries(buckets).map(([bucket, list]) =>
            list.length === 0 ? null : (
              <section key={bucket} className="flex flex-col gap-xs">
                <div className="text-caption-uppercase text-body px-1">{BUCKET_LABEL[bucket]}</div>
                <Card padded={false}>
                  <ul className="divide-y divide-hairline">
                    {list.map((n) => (
                      <li key={n.id}>
                        <NotificationRow
                          item={n}
                          onMarkRead={() => markRead(n.id)}
                          onRemove={() => remove(n.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function NotificationRow({ item, onMarkRead, onRemove }) {
  const tone = KIND_TONE[item.kind] ?? 'default';
  const body = (
    <div className="flex items-start gap-sm px-base py-3">
      {/* Unread dot rail */}
      <span
        aria-hidden
        className={
          'mt-1.5 h-2 w-2 shrink-0 rounded-full ' + (item.unread ? 'bg-primary' : 'bg-transparent')
        }
      />
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface-strong text-ink">
        <Icon name={item.icon} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-body-sm font-semibold text-ink truncate">{item.title}</div>
          <Badge tone={tone}>{KIND_LABEL[item.kind]}</Badge>
        </div>
        <p className="mt-0.5 text-body-sm text-body line-clamp-2 md:line-clamp-3">{item.body}</p>
        <div className="mt-1 flex flex-wrap items-center gap-base text-caption text-body">
          <span>{formatRelative(item.at)}</span>
          {item.cta && item.link && (
            <span className="inline-flex items-center gap-1 text-text-link">
              {item.cta}
              <Icon name="chevronRight" size={12} />
            </span>
          )}
        </div>
      </div>

      {/* Per-row actions — chỉ hiện trên md, mobile có swipe-style remove ở dưới */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        aria-label="Xoá thông báo"
        className="hidden h-9 w-9 shrink-0 place-items-center rounded-md text-body hover:bg-canvas-soft hover:text-ink md:grid"
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  );

  const handleActivate = () => {
    if (item.unread) onMarkRead();
  };

  if (item.link) {
    return (
      <Link to={item.link} onClick={handleActivate} className="block hover:bg-canvas-soft">
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={handleActivate}
      className="block w-full text-left hover:bg-canvas-soft"
    >
      {body}
    </button>
  );
}
