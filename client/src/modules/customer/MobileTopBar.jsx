import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import clsx from 'clsx';
import Icon from '../../components/Icon.jsx';
import Logo from '../../components/Logo.jsx';
import { useApp } from '../../context/AppContext.jsx';

const APP_HOME_HEADER_ELEVATE_AFTER_PX = 16;

// Compact mobile top bar (md:hidden). 56px row + safe-area top inset.
// Trên /app (trang chủ): fixed + overlay hero giống Landing "/".
const HEADER_ICON_BADGE =
  'pointer-events-none absolute right-px top-px box-border flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-0.5 text-center font-sans text-[10px] font-semibold leading-none text-on-primary antialiased';

export default function MobileTopBar() {
  const { pathname } = useLocation();
  const { cartCount, setCartOpen, orders } = useApp();
  const [headerElevated, setHeaderElevated] = useState(false);

  const isAppHome = pathname === '/app';
  const heroOverlay = isAppHome;
  const onHeroDark = heroOverlay && !headerElevated;

  useEffect(() => {
    if (!isAppHome) return undefined;
    const onScroll = () => {
      setHeaderElevated(window.scrollY > APP_HOME_HEADER_ELEVATE_AFTER_PX);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isAppHome]);

  const notifCount = useMemo(() => orders.filter((o) => o.status !== 'delivered').length, [orders]);

  return (
    <header
      className={clsx(
        'md:hidden',
        heroOverlay ? 'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300 ease-out' : 'sticky top-0 z-30',
        heroOverlay
          ? headerElevated
            ? 'border-b border-hairline bg-canvas/90 backdrop-blur'
            : 'border-b border-transparent bg-transparent'
          : 'border-b border-hairline bg-canvas/90 backdrop-blur',
      )}
    >
      <div className="pt-safe" />
      <div className="flex h-14 items-center justify-between gap-sm px-base">
        <Link to="/app" aria-label="NomNom home" className="inline-flex shrink-0 items-center">
          <Logo size="sm" mono={!onHeroDark} />
        </Link>
        <div className="flex items-center gap-0.5">
          <Link
            to="/app/notifications"
            className={clsx(
              'relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md',
              onHeroDark ? 'text-on-dark transition-colors duration-300 ease-out hover:bg-canvas/10' : 'text-ink transition-colors duration-300 ease-out hover:bg-canvas-soft',
            )}
            aria-label="Thông báo"
          >
            <Icon name="bell" size={18} />
            {notifCount > 0 && (
              <span className={clsx(HEADER_ICON_BADGE, notifCount > 9 && 'min-w-[22px]')}>
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setCartOpen(true)}
            aria-label="Cart"
            className={clsx(
              'relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md',
              onHeroDark ? 'text-on-dark transition-colors duration-300 ease-out hover:bg-canvas/10' : 'text-ink transition-colors duration-300 ease-out hover:bg-canvas-soft',
            )}
          >
            <Icon name="cart" size={18} />
            {cartCount > 0 && (
              <span className={clsx(HEADER_ICON_BADGE, cartCount > 9 && 'min-w-[22px]')}>{cartCount}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
