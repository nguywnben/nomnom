import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Drawer from '../../components/Drawer.jsx';
import Icon from '../../components/Icon.jsx';
import Logo from '../../components/Logo.jsx';
import Switch from '../../components/Switch.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { fetchMerchantRestaurantApi } from '../../lib/api.js';
import {
  isMerchantRestaurantApproved,
  isMerchantRestaurantRejected,
  isMerchantRestaurantUnderReview,
} from '../../lib/merchantStatus.js';

const links = [
  { to: '/merchant', label: 'Bảng điều khiển', icon: 'grid', end: true },
  { to: '/merchant/orders', label: 'Đơn hàng', icon: 'package' },
  { to: '/merchant/menu', label: 'Thực đơn', icon: 'list' },
  { to: '/merchant/promotions', label: 'Khuyến mãi', icon: 'zap' },
  { to: '/merchant/reviews', label: 'Đánh giá', icon: 'starFilled' },
  { to: '/merchant/wallet', label: 'Ví & rút tiền', icon: 'wallet' },
  { to: '/merchant/notifications', label: 'Thông báo', icon: 'bell' },
  { to: '/merchant/settings', label: 'Cài đặt quán', icon: 'cog' },
];

// ---------------------------------------------------------------------------
// MerchantLayout — responsive dashboard.
//   • Mobile (<768px): hamburger top header → off-canvas left Drawer.
//   • Desktop (>=768px): persistent left sidebar + top header.
// Tokens preserved: black primary CTAs, hairline borders, Inter type,
// rounded-md (8px) buttons.
// ---------------------------------------------------------------------------
export default function MerchantLayout() {
  const nav = useNavigate();
  const { currentMerchant, merchantOrders, pushToast, logout } = useApp();
  const [checkingRestaurant, setCheckingRestaurant] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const data = await fetchMerchantRestaurantApi();
        if (!active) return;
        const restaurant = data?.restaurant;
        if (!restaurant) {
          nav('/merchant/onboarding', { replace: true });
          return;
        }
        if (isMerchantRestaurantUnderReview(restaurant.status) || isMerchantRestaurantRejected(restaurant.status)) {
          nav('/merchant/pending', { replace: true });
          return;
        }
        if (!isMerchantRestaurantApproved(restaurant.status)) {
          nav('/merchant/onboarding', { replace: true });
          return;
        }
      } catch (err) {
        if (err?.status === 401) {
          await logout();
          nav('/login', { replace: true });
          return;
        }
        console.error('Error fetching restaurant status:', err);
        pushToast({
          kind: 'error',
          title: 'Lỗi kết nối',
          message: 'Không thể xác thực trạng thái nhà hàng.',
        });
      } finally {
        if (active) setCheckingRestaurant(false);
      }
    }
    check();
    return () => {
      active = false;
    };
  }, [nav, pushToast]);

  if (checkingRestaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas-soft">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-base text-body text-body-md font-medium animate-pulse">Đang xác thực thông tin quán ăn...</p>
      </div>
    );
  }

  const newCount = merchantOrders.new.length;
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex min-h-screen bg-canvas-soft">
      {/* Desktop sidebar — persistent */}
      <DesktopSidebar
        currentMerchant={currentMerchant}
        newCount={newCount}
        onSwitchRole={() => nav('/app')}
        onLogout={() => logout()}
      />

      {/* Mobile drawer sidebar — off-canvas */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Quán ăn"
        side="left"
        width="md"
      >
        <SidebarContent
          currentMerchant={currentMerchant}
          newCount={newCount}
          onItemClick={() => setDrawerOpen(false)}
          onSwitchRole={() => nav('/app')}
          onLogout={() => logout()}
        />
      </Drawer>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top header (md:hidden) */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-hairline bg-canvas px-base md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Mở danh mục"
            className="grid h-11 w-11 place-items-center -ml-2 rounded-md text-ink hover:bg-canvas-soft"
          >
            <Icon name="menu" size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-caption-uppercase text-body leading-none">{today}</div>
            <div className="text-body-sm font-semibold text-ink truncate">
              {currentMerchant.name}
            </div>
          </div>
          {newCount > 0 && <Badge tone="live" dot>{newCount}</Badge>}
          <IconButton icon="bell" label="Thông báo" size="sm" onClick={() => nav('/merchant/notifications')} />
        </header>

        {/* Desktop top header (hidden md:flex) */}
        <header className="hidden h-16 items-center justify-between border-b border-hairline bg-canvas px-xl md:flex">
          <div className="flex items-center gap-base">
            <div>
              <div className="text-caption-uppercase text-body">{today}</div>
              <div className="text-title-md text-ink">{currentMerchant.name}</div>
            </div>
            <div className="h-8 w-px bg-hairline" />
            <Switch
              checked={Boolean(currentMerchant.restaurantOpen)}
              disabled
              label={currentMerchant.restaurantOpen ? 'Mở cửa nhận đơn' : 'Chưa đồng bộ trạng thái'}
              hint="Chức năng mở/đóng quán chưa có backend thật."
            />
          </div>
          <div className="flex items-center gap-xs">
            {newCount > 0 && (
              <Badge tone="live" dot>
                {newCount} đơn hàng mới
              </Badge>
            )}
            <IconButton icon="bell" label="Thông báo" variant="secondary" onClick={() => nav('/merchant/notifications')} />
            <Button
              variant="secondary"
              leadingIcon="chat"
              onClick={() => nav('/chat/chat-merchant')}
            >
              Trò chuyện với khách hàng
            </Button>
            <Button leadingIcon="plus" onClick={() => nav('/merchant/menu')}>
              Thêm món
            </Button>
          </div>
        </header>

        {/* Mobile sub-bar: open/closed toggle (out of the top header to give it room) */}
        <div className="flex items-center justify-between border-b border-hairline bg-canvas-soft px-base py-2 md:hidden">
          <Switch
            checked={Boolean(currentMerchant.restaurantOpen)}
            disabled
            label={currentMerchant.restaurantOpen ? 'Mở cửa' : 'Chưa đồng bộ'}
            hint="Chưa có backend để thay đổi trạng thái quán."
            size="sm"
          />
          <button
            onClick={() => nav('/chat/chat-merchant')}
            className="inline-flex items-center gap-1 text-button text-text-link"
          >
            <Icon name="chat" size={14} />
            Trò chuyện với khách hàng
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-base md:p-xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function DesktopSidebar({ currentMerchant, newCount, onSwitchRole, onLogout }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[244px] flex-col border-r border-hairline bg-surface-card md:flex">
      <div className="flex h-16 items-center px-base">
        <Logo size="sm" />
      </div>
      <div className="px-sm py-2">
        <Badge tone="outline">Quán ăn</Badge>
      </div>
      <SidebarContent
        currentMerchant={currentMerchant}
        newCount={newCount}
        onSwitchRole={onSwitchRole}
        onLogout={onLogout}
      />
    </aside>
  );
}

function SidebarContent({ currentMerchant, newCount, onItemClick, onSwitchRole, onLogout }) {
  const linksWithFlags = links.map((link) => ({
    ...link,
    disabled: link.to === '/merchant/wallet' || link.to === '/merchant/settings',
  }));

  return (
    <>
      <nav className="flex-1 px-sm py-2">
        {linksWithFlags.map((l) =>
          l.disabled ? (
            <div
              key={l.to}
              className="flex h-12 items-center gap-2 rounded-md px-sm text-button text-body opacity-60"
              aria-disabled="true"
              title="Chưa có backend thật"
            >
              <Icon name={l.icon} size={16} />
              <span className="flex-1">{l.label}</span>
              <Badge tone="outline">Khóa</Badge>
            </div>
          ) : (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={onItemClick}
              className={({ isActive }) =>
                clsx(
                  'flex h-12 items-center gap-2 rounded-md px-sm text-button transition-colors',
                  isActive ? 'bg-primary text-on-primary' : 'text-ink hover:bg-canvas-soft',
                )
              }
            >
              <Icon name={l.icon} size={16} />
              <span className="flex-1">{l.label}</span>
              {l.label === 'Đơn hàng' && newCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-pill bg-surface-card text-ink px-1 text-caption nums">
                  {newCount}
                </span>
              )}
            </NavLink>
          ),
        )}
      </nav>
      <div className="border-t border-hairline p-sm">
        <div className="flex items-center gap-sm">
          <Avatar src={currentMerchant.avatar} name={currentMerchant.name} />
          <div className="min-w-0 flex-1">
            <div className="text-body-sm font-semibold text-ink truncate">{currentMerchant.name}</div>
            <div className="text-caption text-body truncate">{currentMerchant.email}</div>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <button
              type="button"
              onClick={onSwitchRole}
              className="grid h-9 w-9 place-items-center rounded-md text-body hover:bg-canvas-soft hover:text-ink"
              aria-label="Chuyển vai trò"
              title="Chuyển vai trò"
            >
              <Icon name="refresh" size={14} />
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="grid h-9 w-9 place-items-center rounded-md text-error hover:bg-canvas-soft"
                aria-label="Đăng xuất"
                title="Đăng xuất"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
