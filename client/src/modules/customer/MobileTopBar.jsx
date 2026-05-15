import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import Logo from '../../components/Logo.jsx';
import { useApp } from '../../context/AppContext.jsx';

// Compact mobile top bar (md:hidden). 56px tall + safe-area top inset.
//   • Left: wordmark
//   • Center: delivery address pill (taps to switch — opens Search)
//   • Right: cart icon w/ badge
export default function MobileTopBar() {
  const nav = useNavigate();
  const { cartCount, setCartOpen } = useApp();

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/95 backdrop-blur md:hidden">
      <div className="pt-safe" />
      <div className="flex h-14 items-center gap-sm px-base">
        <Link to="/app" aria-label="NomNom home">
          <Logo size="sm" />
        </Link>
        <button
          onClick={() => nav('/app/search')}
          className="ml-auto flex h-10 max-w-[180px] items-center gap-1 rounded-pill border border-hairline-strong bg-canvas-soft px-2.5 text-caption text-ink hover:bg-canvas"
        >
          <Icon name="pin" size={12} className="text-body" />
          <span className="truncate">120 Wythe Ave</span>
          <Icon name="chevronDown" size={11} className="text-body" />
        </button>
        <button
          onClick={() => setCartOpen(true)}
          aria-label="Cart"
          className="relative grid h-11 w-11 place-items-center rounded-md text-ink hover:bg-canvas-soft"
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
