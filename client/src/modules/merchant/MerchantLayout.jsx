import { useRef, useState, useEffect } from 'react';
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
import { fetchMerchantOrdersApi, fetchMerchantRestaurantApi, updateMerchantSettingsApi } from '../../lib/api.js';
import {
  isMerchantRestaurantApproved,
} from '../../lib/merchantStatus.js';

const links = [
  { to: '/merchant', label: 'Bảng điều khiển', icon: 'grid', end: true },
  { to: '/merchant/orders', label: 'Đơn hàng', icon: 'package' },
  { to: '/merchant/menu', label: 'Thực đơn', icon: 'list' },
  { to: '/merchant/promotions', label: 'Khuyến mãi', icon: 'zap' },
  { to: '/merchant/reviews', label: 'Đánh giá', icon: 'starFilled' },
  { to: '/merchant/wallet', label: 'Ví & rút tiền', icon: 'wallet' },
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
  const { currentMerchant, pushToast, logout, setMerchantRestaurant } = useApp();
  const [checkingRestaurant, setCheckingRestaurant] = useState(true);
  const [restaurantOpen, setRestaurantOpen] = useState(true);
  const [restaurantProfile, setRestaurantProfile] = useState(null);
  const [changingOpen, setChangingOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const prevNewCount = useRef(0);

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
        setRestaurantProfile(data.restaurant);
        setMerchantRestaurant?.(data.restaurant);
        const ordersResponse = await fetchMerchantOrdersApi({ status: 'placed' });
        if (!active) return;
        const ordersArray = Array.isArray(ordersResponse?.orders)
          ? ordersResponse.orders
          : Array.isArray(ordersResponse?.data)
            ? ordersResponse.data
            : Array.isArray(ordersResponse)
              ? ordersResponse
              : [];
        const nextCount = ordersArray.filter((order) => order.status === 'placed').length;
        if (nextCount > prevNewCount.current && prevNewCount.current > 0) {
          playNewOrderBeep();
        }
        prevNewCount.current = nextCount;
        setNewCount(nextCount);
        setRestaurantOpen(Boolean(data.restaurant.is_open_now));
        if (data.restaurant.status !== 'active') {
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
  }, [logout, nav, pushToast, setMerchantRestaurant]);

  const changeOpenStatus = async (value) => {
    const previous = restaurantOpen;
    setRestaurantOpen(value);
    setRestaurantProfile((prev) => (prev ? { ...prev, is_open_now: value } : prev));
    setMerchantRestaurant?.((prev) => (prev ? { ...prev, is_open_now: value } : prev));
    setChangingOpen(true);
    try {
      await updateMerchantSettingsApi({ isOpenNow: value });
      pushToast({
        kind: value ? 'success' : 'warning',
        title: value ? 'Quán đã mở cửa' : 'Quán đã đóng cửa',
        message: value ? 'Quán đang nhận đơn đặt hàng.' : 'Quán tạm ngừng nhận đơn mới.',
      });
    } catch (error) {
      setRestaurantOpen(previous);
      setRestaurantProfile((prev) => (prev ? { ...prev, is_open_now: previous } : prev));
      setMerchantRestaurant?.((prev) => (prev ? { ...prev, is_open_now: previous } : prev));
      pushToast({ kind: 'error', title: 'Không thể cập nhật', message: error.message || 'Vui lòng thử lại.' });
    } finally {
      setChangingOpen(false);
    }
  };

  if (checkingRestaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas-soft">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-base text-body text-body-md font-medium animate-pulse">Đang xác thực thông tin quán ăn...</p>
      </div>
    );
  }

  const merchantIdentity = {
    ...currentMerchant,
    name: restaurantProfile?.name || currentMerchant.name,
    avatar: restaurantProfile?.logo_url || currentMerchant.avatar,
  };

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex min-h-screen bg-canvas-soft">
      {/* Desktop sidebar — persistent */}
      <DesktopSidebar
        currentMerchant={merchantIdentity}
        restaurantSlug={restaurantProfile?.slug || restaurantProfile?.id}
        newCount={newCount}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
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
          currentMerchant={merchantIdentity}
          restaurantSlug={restaurantProfile?.slug || restaurantProfile?.id}
          newCount={newCount}
          onItemClick={() => setDrawerOpen(false)}
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
              {merchantIdentity.name}
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
              <div className="text-title-md text-ink">{merchantIdentity.name}</div>
            </div>
            <div className="h-8 w-px bg-hairline" />
            <Switch
              checked={restaurantOpen}
              onChange={changeOpenStatus}
            disabled={changingOpen}
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
              onClick={() => nav('/chat/inbox')}
            >
              Trò chuyện với khách hàng
            </Button>
          </div>
        </header>

        {/* Mobile sub-bar: open/closed toggle (out of the top header to give it room) */}
        <div className="flex items-center justify-between border-b border-hairline bg-canvas-soft px-base py-2 md:hidden">
          <Switch
            checked={restaurantOpen}
            onChange={changeOpenStatus}
              disabled={changingOpen}
            label={restaurantOpen ? 'Mở cửa' : 'Đóng cửa'}
            size="sm"
          />
          <button
            onClick={() => nav('/chat/inbox')}
            className="inline-flex items-center gap-1 text-button text-text-link"
          >
            <Icon name="chat" size={14} />
            Trò chuyện với khách hàng
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-base md:p-xl">
          <Outlet context={{ restaurantOpen, setRestaurantOpen, changeOpenStatus, restaurantProfile }} />
        </main>
      </div>
    </div>
  );
}

function playNewOrderBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {
    // Trình duyệt không hỗ trợ audio — bỏ qua
  }
}

function DesktopSidebar({ currentMerchant, restaurantSlug, newCount, collapsed, onToggleCollapse }) {
  return (
    <aside
      className={clsx(
        'sticky top-0 hidden h-screen flex-col border-r border-hairline bg-surface-card transition-[width] duration-200 md:flex',
        collapsed ? 'w-[68px]' : 'w-[244px]',
      )}
    >
      <div className="flex h-16 items-center justify-between px-base">
        {!collapsed && <Logo size="sm" />}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="grid h-9 w-9 place-items-center rounded-md text-body hover:bg-canvas-soft hover:text-ink"
          aria-label="Bật/tắt thanh bên"
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={14} />
        </button>
      </div>
      {!collapsed && (
        <div className="px-sm py-2">
          <Badge tone="outline">Quán ăn</Badge>
        </div>
      )}
      <SidebarContent
        currentMerchant={currentMerchant}
        restaurantSlug={restaurantSlug}
        newCount={newCount}
        collapsed={collapsed}
      />
    </aside>
  );
}

function SidebarContent({ currentMerchant, restaurantSlug, newCount, collapsed = false, onItemClick }) {
  return (
    <>
      <nav className="flex-1 px-sm py-2 overflow-y-auto no-scrollbar">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onItemClick}
            className={({ isActive }) =>
              clsx(
                'flex h-12 items-center gap-2 rounded-md px-sm text-button transition-colors',
                isActive ? 'bg-primary text-on-primary' : 'text-ink hover:bg-canvas-soft',
              )
            }
          >
            <Icon name={link.icon} size={16} />
            {!collapsed && <span className="flex-1">{link.label}</span>}
            {link.label === 'Đơn hàng' && newCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-pill bg-surface-card text-ink px-1 text-caption nums">
                {newCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-hairline p-sm space-y-2">
        {restaurantSlug && (
          <NavLink
            to={`/app/restaurant/${encodeURIComponent(restaurantSlug)}`}
            onClick={onItemClick}
            className="flex h-10 items-center gap-2 rounded-md border border-hairline-strong bg-canvas-soft px-sm text-button text-ink transition-colors hover:bg-canvas hover:border-ink/40"
          >
            <Icon name="store" size={16} className="shrink-0" />
            {!collapsed && <span className="flex-1 truncate">Xem quán ăn</span>}
            {!collapsed && <Icon name="chevronRight" size={14} className="text-body shrink-0" />}
          </NavLink>
        )}
        <div className="flex items-center gap-sm">
          <Avatar src={currentMerchant.avatar} name={currentMerchant.name} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-body-sm font-semibold text-ink truncate">{currentMerchant.name}</div>
              <div className="text-caption text-body truncate">{currentMerchant.email}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
