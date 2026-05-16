import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import Icon from '../../components/Icon.jsx';
import Logo from '../../components/Logo.jsx';
import { useApp } from '../../context/AppContext.jsx';

const APP_HOME_HEADER_ELEVATE_AFTER_PX = 16;

// Compact mobile top bar (md:hidden). 56px row + safe-area top inset.
// Trên /app (trang chủ): fixed + overlay hero giống Landing "/".
export default function MobileTopBar() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { cartCount, setCartOpen } = useApp();
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
      <div className="flex h-14 items-center gap-sm px-base">
        <Link to="/app" aria-label="NomNom home" className="inline-flex shrink-0 items-center">
          <Logo size="sm" mono={!onHeroDark} />
        </Link>
        <button
          onClick={() => nav('/app/search')}
          className={clsx(
            'ml-auto flex h-10 max-w-[180px] items-center gap-1 rounded-pill border px-2.5 text-caption transition-[background-color,border-color,color] duration-300 ease-out',
            onHeroDark
              ? 'border-canvas/30 bg-canvas/10 text-on-dark hover:bg-canvas/20'
              : 'border border-hairline-strong bg-canvas-soft text-ink hover:bg-canvas',
          )}
        >
          <Icon name="pin" size={12} className={clsx(onHeroDark ? 'text-on-dark-soft' : 'text-body')} />
          <span className="truncate">120 Wythe Ave</span>
          <Icon name="chevronDown" size={11} className={clsx(onHeroDark ? 'text-on-dark-soft' : 'text-body')} />
        </button>
        <button
          onClick={() => setCartOpen(true)}
          aria-label="Cart"
          className={clsx(
            'relative grid h-11 w-11 place-items-center rounded-md',
            onHeroDark ? 'text-on-dark transition-colors duration-300 ease-out hover:bg-canvas/10' : 'text-ink transition-colors duration-300 ease-out hover:bg-canvas-soft',
          )}
        >
          <Icon name="cart" size={18} />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-pill bg-primary px-1 text-caption text-on-primary nums">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
