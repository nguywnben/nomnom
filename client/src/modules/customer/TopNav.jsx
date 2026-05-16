import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

/** Trùng Landing: khi cuộn mới hiện nền thanh; đầu trang trong suốt trên hero. */
const APP_HOME_HEADER_ELEVATE_AFTER_PX = 16;

// top-nav per DESIGN.md — height 64, bg canvas, text ink, sticky.
// Trên /app (trang chủ): fixed + overlay hero giống trang "/".
// Hidden on mobile (replaced by <MobileTopBar /> + <MobileBottomNav />).
export default function TopNav() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { cartCount, setCartOpen, authedRoles, setAuthModal, currentCustomer, setChatOpen } = useApp();
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

        {/* Address — center, desktop only */}
        <button
          onClick={() => nav('/app/search')}
          className={clsx(
            'hidden min-w-[260px] items-center gap-2 rounded-md px-sm py-2 text-body-sm transition-[background-color,border-color,color] duration-300 ease-out lg:flex',
            onHeroDark
              ? 'border border-canvas/30 bg-canvas/15 text-on-dark hover:bg-canvas/20'
              : 'border border-hairline-strong bg-canvas text-ink hover:bg-canvas-soft',
          )}
        >
          <Icon name="pin" size={14} />
          <span className="flex-1 truncate text-left">120 Wythe Ave, Brooklyn</span>
          <Badge
            tone="outline"
            className={clsx(
              onHeroDark &&
                '!border-canvas/40 !bg-canvas/15 !text-on-dark transition-[background-color,border-color,color] duration-300 ease-out',
            )}
          >
            15 phút
          </Badge>
        </button>

        <div className="flex items-center gap-xs">
          <IconButton
            icon="chat"
            label="Mở trò chuyện"
            onClick={() => setChatOpen(true)}
            className={clsx(
              onHeroDark && 'text-on-dark transition-colors duration-300 ease-out hover:bg-canvas/10',
            )}
          />
          <button
            onClick={() => setCartOpen(true)}
            className={clsx(
              'relative inline-flex h-10 items-center gap-2 rounded-md px-sm text-button transition-[background-color,border-color,color] duration-300 ease-out',
              onHeroDark
                ? 'border border-canvas/30 bg-canvas/15 text-on-dark hover:bg-canvas/20'
                : 'border border-hairline-strong bg-surface-card text-ink hover:bg-canvas-soft',
            )}
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
                className={clsx(
                  'transition-[background-color,border-color,color] duration-300 ease-out',
                  onHeroDark &&
                    '!border-canvas/30 !bg-canvas/15 !text-on-dark hover:!bg-canvas/20',
                )}
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
