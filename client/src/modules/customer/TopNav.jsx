import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import Button from '../../components/Button.jsx';
import Logo from '../../components/Logo.jsx';
import Icon from '../../components/Icon.jsx';
import Avatar from '../../components/Avatar.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { loginHref, ROLE_HOME } from '../../lib/auth.js';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount.js';

const PORTAL_LINKS = [
  { role: 'admin', label: 'Quản trị hệ thống', icon: 'shield', to: ROLE_HOME.admin },
  { role: 'merchant', label: 'Cổng quán ăn', icon: 'store', to: ROLE_HOME.merchant },
];

const links = [
  { to: '/app', label: 'Trang chủ', end: true },
  { to: '/app/search', label: 'Tìm kiếm' },
];

/** Trùng Landing: khi cuộn mới hiện nền thanh; đầu trang trong suốt trên hero. */
const APP_HOME_HEADER_ELEVATE_AFTER_PX = 16;

/** Badge trên nút header (desktop): góc trên-phải của ô nút, hơi tràn ra ngoài viền (kiểu “pin” trên nút). */
const HEADER_NAV_BUTTON_BADGE =
  'pointer-events-none absolute -right-0.5 -top-0.5 z-[1] flex h-[18px] min-w-[18px] translate-x-px -translate-y-px items-center justify-center rounded-full bg-primary px-0.5 text-center font-sans text-[10px] font-semibold leading-none text-on-primary antialiased';

const MENU_ITEM =
  'flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-body-sm font-medium text-ink transition-colors hover:bg-canvas-soft';

// top-nav per DESIGN.md — height 64, bg canvas, text ink, sticky.
// Trên /app (trang chủ): fixed + overlay hero giống trang "/".
// Hidden on mobile (replaced by <MobileTopBar /> + <MobileBottomNav />).
export default function TopNav() {
  const { pathname, search } = useLocation();
  const nav = useNavigate();
  const returnTo = pathname + search;
  const { cartCount, setCartOpen, shopAsCustomer, user, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerElevated, setHeaderElevated] = useState(false);
  const menuRef = useRef(null);

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

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const onHeroDark = heroOverlay && !headerElevated;

  const notifCount = useUnreadNotificationCount(Boolean(user));

  const accountName = user?.fullName ?? '';
  const accountEmail = user?.email ?? '';
  const accountAvatar = user?.avatarUrl;
  const portalLinks = PORTAL_LINKS.filter((p) => user?.primaryRole === p.role);

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
          {(!user || shopAsCustomer) && <button
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
          </button>}

          {user ? (
            <div className="relative ml-xs flex h-10 items-center" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu tài khoản"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className={clsx(
                  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-shadow',
                  menuOpen && 'ring-2 ring-ink/15 ring-offset-2 ring-offset-transparent',
                )}
              >
                <Avatar src={accountAvatar} name={accountName} size="md" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-lg border border-hairline-strong bg-surface-card py-1 shadow-soft-md"
                >
                  <div className="border-b border-hairline px-3 py-3">
                    <div className="truncate text-body-sm font-semibold text-ink">{accountName}</div>
                    <div className="truncate text-caption text-body">{accountEmail}</div>
                  </div>
                  <div className="p-1">
                    {portalLinks.map((p) => (
                      <Link
                        key={p.role}
                        to={p.to}
                        role="menuitem"
                        className={MENU_ITEM}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Icon name={p.icon} size={16} className="shrink-0 text-body" />
                        {p.label}
                      </Link>
                    ))}
                    {user && (
                      <>
                        <Link
                          to="/app/profile"
                          role="menuitem"
                          className={MENU_ITEM}
                          onClick={() => setMenuOpen(false)}
                        >
                          <Icon name="user" size={16} className="shrink-0 text-body" />
                          Hồ sơ tài khoản
                        </Link>
                        {shopAsCustomer && (
                          <>
                            <Link
                              to="/app/orders"
                              role="menuitem"
                              className={MENU_ITEM}
                              onClick={() => setMenuOpen(false)}
                            >
                              <Icon name="package" size={16} className="shrink-0 text-body" />
                              Đơn hàng của tôi
                            </Link>
                            <Link
                              to="/app/profile/promotions"
                              role="menuitem"
                              className={MENU_ITEM}
                              onClick={() => setMenuOpen(false)}
                            >
                              <Icon name="zap" size={16} className="shrink-0 text-body" />
                              Kho voucher của tôi
                            </Link>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <div className="border-t border-hairline p-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={async () => {
                        setMenuOpen(false);
                        await logout();
                      }}
                      className={clsx(
                        MENU_ITEM,
                        'font-semibold text-ink hover:bg-canvas-soft',
                      )}
                    >
                      <Icon name="arrowRight" size={16} className="shrink-0 text-ink" />
                      Đăng xuất
                    </button>
                  </div>
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
