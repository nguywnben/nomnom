import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import Icon from '../../components/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';

const TABS = [
  { to: '/app', icon: 'grid', label: 'Trang chủ', end: true },
  { to: '/app/search', icon: 'search', label: 'Tìm kiếm' },
  { to: '/app/orders', icon: 'package', label: 'Đơn hàng', customerOnly: true },
  { to: '/app/profile', icon: 'user', label: 'Hồ sơ' },
];

export default function MobileBottomNav() {
  const { shopAsCustomer, user } = useApp();
  const visibleTabs = TABS.filter((tab) => !tab.customerOnly || !user || shopAsCustomer);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-canvas md:hidden">
      <div className={clsx('grid', visibleTabs.length === 3 ? 'grid-cols-3' : 'grid-cols-4')}>
        {visibleTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => clsx(
              'relative flex h-16 flex-col items-center justify-center gap-0.5 text-caption transition-colors',
              isActive ? 'text-ink' : 'text-body hover:text-ink',
            )}
          >
            {({ isActive }) => (
              <>
                <span className={clsx('grid h-8 w-12 place-items-center rounded-pill transition-colors', isActive && 'bg-ink/5')}>
                  <Icon name={tab.icon} size={20} />
                </span>
                <span className={clsx(isActive ? 'font-semibold text-ink' : 'text-body')}>{tab.label}</span>
                {tab.to === '/app/profile' && !user && <span className="absolute right-5 top-2 h-2 w-2 rounded-pill bg-error" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
      <div className="pb-safe" />
    </nav>
  );
}