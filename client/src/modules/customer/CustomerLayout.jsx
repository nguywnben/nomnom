import { Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';

import { useGeolocationLocalityLabel } from '../../hooks/useGeolocationLocalityLabel.js';
import TopNav from './TopNav.jsx';
import MobileTopBar from './MobileTopBar.jsx';
import MobileBottomNav from './MobileBottomNav.jsx';
import Footer from './Footer.jsx';
import CartDrawer from './CartDrawer.jsx';
import ChatWidget from '../chat/ChatWidget.jsx';

// ---------------------------------------------------------------------------
// CustomerLayout — responsive shell.
//
// Mobile (<768px):
//   • Top: thin <MobileTopBar /> (logo + cart) — sticky
//   • Content: full-bleed, scrollable, padded-bottom so it clears the bottom nav
//   • Bottom: fixed <MobileBottomNav /> (Home / Search / Orders / Profile)
//             with iOS safe-area padding
//   • Footer is HIDDEN on mobile — bottom nav replaces footer-ish navigation
//
// Desktop (≥768px):
//   • Top: sticky <TopNav /> (logo + links + search + cart + avatar menu)
//   • Footer visible
//   • Bottom nav hidden
//
// Focused flows (checkout / order-success / live tracking) hide the bottom
// nav entirely so their own sticky action bars own the bottom edge.
// ---------------------------------------------------------------------------
export default function CustomerLayout() {
  const { pathname } = useLocation();
  const deliveryLocalityLine = useGeolocationLocalityLabel();

  // Routes where the mobile bottom nav steps aside so the page's own sticky
  // action bar (e.g. "Place order" on checkout) owns the bottom safe area.
  const isFocusedFlow =
    pathname === '/app/checkout' ||
    pathname.startsWith('/app/order/success/') ||
    pathname.startsWith('/app/track/');

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Desktop top nav — hidden on mobile */}
      <TopNav />

      {/* Mobile top bar — hidden on desktop, hidden in focused flows */}
      {!isFocusedFlow && <MobileTopBar />}

      <main
        className={clsx(
          'flex-1',
          // Add headroom on mobile so content doesn't sit under the fixed
          // bottom nav (16 + safe-area).
          !isFocusedFlow && 'pb-20 md:pb-0',
        )}
      >
        <Outlet context={{ deliveryLocalityLine }} />
      </main>

      {/* Footer is desktop-only; mobile users navigate via the bottom nav */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Mobile bottom navigation — hidden on desktop and during focused flows */}
      {!isFocusedFlow && <MobileBottomNav />}

      {/* Overlays — internally responsive (centered on desktop / bottom-sheet on mobile) */}
      <CartDrawer />
      <ChatWidget />
    </div>
  );
}
