import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import Icon from '../../components/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';

// Fixed bottom navigation (md:hidden). 4 tabs with 64px touch height each
// and a safe-area pad for iOS home indicator.
const TABS = [
  { to: '/app', icon: 'grid', label: 'Trang chủ', end: true },
  { to: '/app/search', icon: 'search', label: 'Tìm kiếm' },
  { to: '/app/orders', icon: 'package', label: 'Đơn hàng' },
  { to: '/app/profile', icon: 'user', label: 'Hồ sơ' },
];

export default function MobileBottomNav() {
  const { orders, authedRoles } = useApp();
  const pendingBadge = orders.filter((o) => o.status !== 'delivered').length;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-canvas md:hidden">
      <div className="grid grid-cols-4">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              clsx(
                'relative flex h-16 flex-col items-center justify-center gap-0.5 text-caption transition-colors',
                isActive ? 'text-ink' : 'text-body hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={clsx(
                    'grid h-8 w-12 place-items-center rounded-pill transition-colors',
                    isActive ? 'bg-ink/5' : '',
                  )}
                >
                  <Icon name={t.icon} size={20} />
                </span>
                <span className={clsx(isActive ? 'text-ink font-semibold' : 'text-body')}>{t.label}</span>
                {t.to === '/app/orders' && pendingBadge > 0 && (
                  <span className="absolute right-5 top-2 grid h-4 min-w-4 place-items-center rounded-pill bg-primary px-1 text-[10px] font-semibold text-on-primary leading-none nums">
                    {pendingBadge}
                  </span>
                )}
                {t.to === '/app/profile' && !authedRoles.customer && (
                  <span className="absolute right-5 top-2 h-2 w-2 rounded-pill bg-error" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
      <div className="pb-safe" />
    </nav>
  );
}
