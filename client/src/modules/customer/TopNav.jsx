import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import clsx from 'clsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Logo from '../../components/Logo.jsx';
import Icon from '../../components/Icon.jsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import { useApp } from '../../context/AppContext.jsx';

const links = [
  { to: '/app', label: 'Trang chủ', end: true },
  { to: '/app/search', label: 'Tìm kiếm' },
  { to: '/app/orders', label: 'Đơn hàng' },
];

// top-nav per DESIGN.md — height 64, bg canvas, text ink, sticky.
// Hidden on mobile (replaced by <MobileTopBar /> + <MobileBottomNav />).
export default function TopNav() {
  const nav = useNavigate();
  const { cartCount, setCartOpen, authedRoles, setAuthModal, currentCustomer, setChatOpen } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 hidden border-b border-hairline bg-canvas/90 backdrop-blur md:block">
      <div className="container-page flex h-16 items-center justify-between gap-base">
        <div className="flex items-center gap-xl">
          <Link to="/app" aria-label="NomNom home">
            <Logo />
          </Link>
          <nav className="hidden md:flex items-center gap-base">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  clsx(
                    'text-nav-link transition-colors',
                    isActive ? 'text-ink' : 'text-body hover:text-ink',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Address — center, desktop only */}
        <button
          onClick={() => nav('/app/search')}
          className="hidden lg:flex items-center gap-2 rounded-md border border-hairline-strong bg-canvas px-sm py-2 text-body-sm text-ink hover:bg-canvas-soft min-w-[260px]"
        >
          <Icon name="pin" size={14} />
          <span className="flex-1 truncate text-left">120 Wythe Ave, Brooklyn</span>
          <Badge tone="outline">15 phút</Badge>
        </button>

        <div className="flex items-center gap-xs">
          <IconButton icon="chat" label="Mở trò chuyện" onClick={() => setChatOpen(true)} />
          <button
            onClick={() => setCartOpen(true)}
            className="relative inline-flex h-10 items-center gap-2 rounded-md border border-hairline-strong bg-surface-card px-sm text-button text-ink hover:bg-canvas-soft"
            aria-label="Mở giỏ hàng"
          >
            <Icon name="cart" size={16} />
            <span className="nums">Giỏ hàng</span>
            {cartCount > 0 && (
              <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-pill bg-primary px-1 text-caption text-on-primary nums">
                {cartCount}
              </span>
            )}
          </button>

          {authedRoles.customer ? (
            <div className="relative ml-xs">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="User menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar src={currentCustomer.avatar} name={currentCustomer.name} size="sm" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1 w-56 rounded-md border border-hairline-strong bg-surface-card p-xs shadow-soft-md text-body-sm"
                >
                  <div className="px-sm py-2">
                    <div className="font-semibold text-ink truncate">{currentCustomer.name}</div>
                    <div className="text-caption text-body truncate">{currentCustomer.email}</div>
                  </div>
                  <div className="h-px bg-hairline" />
                  <Link to="/app/orders" className="block rounded-sm px-sm py-2 hover:bg-canvas-soft text-ink" onClick={() => setMenuOpen(false)}>
                    Đơn hàng của tôi
                  </Link>
                  <Link to="/" className="block rounded-sm px-sm py-2 hover:bg-canvas-soft text-ink" onClick={() => setMenuOpen(false)}>
                    Đổi vai trò
                  </Link>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="block w-full rounded-sm px-sm py-2 text-left hover:bg-canvas-soft text-ink"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAuthModal({ open: true, mode: 'login' })}
              >
                Đăng nhập
              </Button>
              <Button size="sm" onClick={() => setAuthModal({ open: true, mode: 'register' })}>
                Đăng ký
              </Button>
            </>
          )}
        </div>
      </div>

    </header>
  );
}
