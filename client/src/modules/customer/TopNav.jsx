import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import Button from '../../components/Button.jsx';
import Logo from '../../components/Logo.jsx';
import Icon from '../../components/Icon.jsx';
import Avatar from '../../components/Avatar.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { loginHref } from '../../lib/auth.js';

const links = [
  { to: '/app', label: 'Trang chủ', end: true },
  { to: '/app/search', label: 'Tìm kiếm' },
];

/** Trùng Landing: khi cuộn mới hiện nền thanh; đầu trang trong suốt trên hero. */
const APP_HOME_HEADER_ELEVATE_AFTER_PX = 16;

/** Badge trên nút header (desktop): góc trên-phải của ô nút, hơi tràn ra ngoài viền (kiểu “pin” trên nút). */
const HEADER_NAV_BUTTON_BADGE =
  'pointer-events-none absolute -right-0.5 -top-0.5 z-[1] flex h-[18px] min-w-[18px] translate-x-px -translate-y-px items-center justify-center rounded-full bg-primary px-0.5 text-center font-sans text-[10px] font-semibold leading-none text-on-primary antialiased';

// top-nav per DESIGN.md — height 64, bg canvas, text ink, sticky.
// Trên /app (trang chủ): fixed + overlay hero giống trang "/".
// Hidden on mobile (replaced by <MobileTopBar /> + <MobileBottomNav />).
export default function TopNav() {
  const { pathname, search } = useLocation();
  const nav = useNavigate();
  const returnTo = pathname + search;
  const { cartCount, setCartOpen, authedRoles, currentCustomer, orders, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerElevated, setHeaderElevated] = useState(false);

  const isAppHome = pathname === '/app';
  const heroOverlay = isAppHome;

  useEffect(() => {
    if (!isAppHome) return undefined;
    const onScroll = () => {
      setHeaderElevated(window.scrollY > APP_HOME_HEADER_ELEVATE_AFTER_PX);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isAppHome]);

  const onHeroDark = heroOverlay && !headerElevated;

  const notifCount = useMemo(() => orders.filter((o) => o.status !== 'delivered').length, [orders]);

  return (
    <header
      className={clsx(
        'hidden md:block',
        heroOverlay ? 'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300 ease-out' : 'sticky top-0 z-30',
        heroOverlay
          ? headerElevated
            ? 'border-b border-hairline bg-canvas/90 backdrop-blur'
            : 'border-b border-transparent bg-transparent'
          : 'border-b border-hairline bg-canvas/90 backdrop-blur',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-base">
        <div className="flex items-center gap-xl">
          <Link to="/app" aria-label="NomNom home" className="inline-flex shrink-0 items-center">
            <Logo mono={!onHeroDark} />
          </Link>
          <nav className="hidden md:flex items-center gap-base">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  clsx(
                    'text-nav-link transition-colors duration-300 ease-out',
                    onHeroDark
                      ? isActive
                        ? 'font-semibold text-on-dark'
                        : 'text-on-dark-soft hover:text-on-dark'
                      : isActive
                        ? 'text-ink'
                        : 'text-body hover:text-ink',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-base">
          <Link
            to="/app/notifications"
            className={clsx(
              'relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-visible rounded-md transition-[background-color,border-color,color] duration-300 ease-out',
              onHeroDark
                ? 'border border-canvas/30 bg-canvas/15 text-on-dark hover:bg-canvas/20'
                : 'border border-hairline-strong bg-surface-card text-ink hover:bg-canvas-soft',
            )}
            aria-label="Thông báo"
          >
            <Icon name="bell" size={18} />
            {notifCount > 0 && (
              <span className={clsx(HEADER_NAV_BUTTON_BADGE, notifCount > 9 && 'min-w-[22px]')}>
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setCartOpen(true)}
            className={clsx(
              'relative inline-flex h-10 items-center gap-2 overflow-visible rounded-md pl-1 pr-3 text-button transition-[background-color,border-color,color] duration-300 ease-out',
              onHeroDark
                ? 'border border-canvas/30 bg-canvas/15 text-on-dark hover:bg-canvas/20'
                : 'border border-hairline-strong bg-surface-card text-ink hover:bg-canvas-soft',
            )}
            aria-label="Mở giỏ hàng"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center">
              <Icon name="cart" size={18} />
            </span>
            <span className="nums">Giỏ hàng</span>
            {cartCount > 0 && (
              <span className={clsx(HEADER_NAV_BUTTON_BADGE, cartCount > 9 && 'min-w-[22px]', cartCount > 99 && 'min-w-[26px]')}>
                {cartCount > 99 ? '99+' : cartCount}
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
                  <Link to="/app/profile" className="block rounded-sm px-sm py-2 hover:bg-canvas-soft text-ink" onClick={() => setMenuOpen(false)}>
                    Hồ sơ
                  </Link>
                  <Link to="/app/orders" className="block rounded-sm px-sm py-2 hover:bg-canvas-soft text-ink" onClick={() => setMenuOpen(false)}>
                    Đơn hàng của tôi
                  </Link>
                  <Link to="/" className="block rounded-sm px-sm py-2 hover:bg-canvas-soft text-ink" onClick={() => setMenuOpen(false)}>
                    Đổi vai trò
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setMenuOpen(false);
                      await logout();
                    }}
                    className="block w-full rounded-sm px-sm py-2 text-left text-error hover:bg-canvas-soft"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              className={clsx(
                'transition-[background-color,border-color,color] duration-300 ease-out',
                onHeroDark &&
                  '!border-canvas/30 !bg-canvas/15 !text-on-dark hover:!bg-canvas/20',
              )}
              onClick={() => nav(loginHref(returnTo))}
            >
              Đăng nhập / Đăng ký
            </Button>
          )}
        </div>
      </div>

    </header>
  );
}
