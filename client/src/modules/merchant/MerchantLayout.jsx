import { useState } from 'react';
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
  const { currentMerchant, merchantOrders, pushToast } = useApp();
  const [restaurantOpen, setRestaurantOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
        onSwitchRole={() => nav('/')}
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
          onSwitchRole={() => nav('/')}
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
              checked={restaurantOpen}
              onChange={(v) => {
                setRestaurantOpen(v);
                pushToast({
                  kind: v ? 'success' : 'warning',
                  title: v ? 'Quán đã mở cửa' : 'Quán đã đóng cửa',
                  message: v ? 'Hiện đang nhận đơn đặt hàng' : 'Khách hàng sẽ không thấy thực đơn của bạn',
                });
              }}
              label={restaurantOpen ? 'Mở cửa nhận đơn' : 'Đóng cửa'}
              hint={restaurantOpen ? 'Khách hàng có thể đặt hàng' : 'Chuyển đổi để nhận đơn'}
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
            checked={restaurantOpen}
            onChange={(v) => {
              setRestaurantOpen(v);
              pushToast({
                kind: v ? 'success' : 'warning',
                title: v ? 'Quán đã mở cửa' : 'Quán đã đóng cửa',
                message: v ? 'Hiện đang nhận đơn đặt hàng' : 'Khách hàng sẽ không thấy thực đơn của bạn',
              });
            }}
            label={restaurantOpen ? 'Mở cửa' : 'Đóng cửa'}
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

function DesktopSidebar({ currentMerchant, newCount, onSwitchRole }) {
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
      />
    </aside>
  );
}

function SidebarContent({ currentMerchant, newCount, onItemClick, onSwitchRole }) {
  return (
    <>
      <nav className="flex-1 px-sm py-2">
        {links.map((l) => (
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
        ))}
      </nav>
      <div className="border-t border-hairline p-sm">
        <div className="flex items-center gap-sm">
          <Avatar src={currentMerchant.avatar} name={currentMerchant.name} />
          <div className="min-w-0 flex-1">
            <div className="text-body-sm font-semibold text-ink truncate">{currentMerchant.name}</div>
            <div className="text-caption text-body truncate">{currentMerchant.email}</div>
          </div>
          <button
            onClick={onSwitchRole}
            className="grid h-9 w-9 place-items-center rounded-md text-body hover:bg-canvas-soft hover:text-ink"
            aria-label="Chuyển vai trò"
            title="Chuyển vai trò"
          >
            <Icon name="refresh" size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
