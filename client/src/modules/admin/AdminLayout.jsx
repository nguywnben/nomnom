import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Drawer from '../../components/Drawer.jsx';
import Icon from '../../components/Icon.jsx';
import Logo from '../../components/Logo.jsx';
import { useApp } from '../../context/AppContext.jsx';

const links = [
  { to: '/admin', label: 'Tổng quan', icon: 'grid', end: true },
  { to: '/admin/accounts', label: 'Tài khoản', icon: 'user' },
  { to: '/admin/restaurants', label: 'Duyệt quán', icon: 'store' },
  { to: '/admin/orders', label: 'Đơn hàng', icon: 'package' },
  { to: '/admin/payouts', label: 'Rút tiền', icon: 'cash' },
  { to: '/admin/reviews', label: 'Đánh giá', icon: 'starFilled' },
  { to: '/admin/financial', label: 'Tài chính', icon: 'wallet' },
  { to: '/admin/config', label: 'Cấu hình', icon: 'cog' },
];

// ---------------------------------------------------------------------------
// AdminLayout — responsive dashboard.
//   • Mobile (<768px): hamburger → off-canvas left Drawer.
//   • Desktop (>=768px): collapsible persistent sidebar.
//   • Header on both: search bar (collapsed to icon on mobile).
// ---------------------------------------------------------------------------
export default function AdminLayout() {
  const nav = useNavigate();
  const { currentAdmin, logout } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas-soft">
      {/* Desktop sidebar — persistent, collapsible */}
      <aside
        className={clsx(
          'sticky top-0 hidden h-screen border-r border-hairline bg-surface-card transition-[width] duration-200 md:flex md:flex-col',
          collapsed ? 'w-[68px]' : 'w-[244px]',
        )}
      >
        <div className="flex h-16 items-center justify-between px-base">
          {!collapsed && <Logo size="sm" />}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="grid h-9 w-9 place-items-center rounded-md text-body hover:bg-canvas-soft hover:text-ink"
            aria-label="Bật/tắt thanh bên"
          >
            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={14} />
          </button>
        </div>
        {!collapsed && (
          <div className="px-sm py-2">
            <Badge tone="outline">Quản trị viên</Badge>
          </div>
        )}
        <SidebarLinks collapsed={collapsed} />
        {!collapsed && (
          <SidebarFooter
            currentAdmin={currentAdmin}
            onSwitchRole={() => nav('/app')}
            onLogout={() => logout()}
          />
        )}
      </aside>

      {/* Mobile drawer sidebar */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Quản trị viên"
        side="left"
        width="md"
      >
        <SidebarLinks collapsed={false} onItemClick={() => setDrawerOpen(false)} />
        <SidebarFooter
          currentAdmin={currentAdmin}
          onSwitchRole={() => nav('/app')}
          onLogout={() => logout()}
        />
      </Drawer>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-hairline bg-canvas px-base md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Mở menu"
            className="grid h-11 w-11 place-items-center -ml-2 rounded-md text-ink hover:bg-canvas-soft"
          >
            <Icon name="menu" size={18} />
          </button>          <div className="flex-1 leading-tight">
            <div className="text-caption-uppercase text-body">Quản trị viên</div>
            <div className="text-body-sm font-semibold text-ink">Tổng quan nền tảng</div>
          </div>
          <IconButton icon="bell" label="Thông báo" size="sm" onClick={() => nav('/app/notifications')} />
        </header>

        {/* Desktop header */}
        <header className="hidden h-16 items-center gap-base border-b border-hairline bg-canvas px-xl md:flex">
          <div className="shrink-0">
            <div className="text-caption-uppercase text-body">Quản trị viên cấp cao</div>
            <div className="text-title-md text-ink">Tổng quan nền tảng</div>
          </div>
          <div className="flex shrink-0 items-center gap-xs">
            <IconButton icon="bell" variant="secondary" label="Thông báo" onClick={() => nav('/app/notifications')} />
            <Button variant="secondary" leadingIcon="chat" onClick={() => nav('/chat/inbox')}>
              Hỗ trợ
            </Button>
            <Button leadingIcon="cog" onClick={() => nav('/admin/config')}>Cài đặt</Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-base md:p-xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarLinks({ collapsed, onItemClick }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-sm py-2">
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
          {!collapsed && <span>{l.label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarFooter({ currentAdmin, onSwitchRole, onLogout }) {
  return (
    <div className="border-t border-hairline p-sm">
      <div className="flex items-center gap-sm">
        <Avatar src={currentAdmin.avatar} name={currentAdmin.name} />
        <div className="min-w-0 flex-1">
          <div className="text-body-sm font-semibold text-ink truncate">{currentAdmin.name}</div>
          <div className="text-caption text-body truncate">{currentAdmin.role}</div>
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
  );
}
