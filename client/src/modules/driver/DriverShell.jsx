import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import Icon from '../../components/Icon.jsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import { IconButton } from '../../components/Button.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { fetchDriverProfile } from '../../lib/api.js';
import DriverDesktopBlock from './DriverDesktopBlock.jsx';
import { useDriverLayoutMode } from './useDriverLayoutMode.js';

// ---------------------------------------------------------------------------
// Driver shell — full-viewport mobile UI on native + narrow web; desktop web
// shows DriverDesktopBlock (no phone frame / preview chrome).
// Bottom nav is fixed to the viewport bottom with safe-area inset.
// ---------------------------------------------------------------------------

const TABS = [
  { to: '/driver', label: 'Trang chủ', icon: 'grid', end: true },
  { to: '/driver/trips', label: 'Chuyến', icon: 'package' },
  { to: '/driver/wallet', label: 'Thu nhập', icon: 'wallet' },
  { to: '/driver/account', label: 'Tài khoản', icon: 'user' },
];

export default function DriverShell() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { currentDriver, driverOnline, activeDriverJob, pushToast } = useApp();
  const { showDesktopBlock } = useDriverLayoutMode();
  const [checkingProfile, setCheckingProfile] = useState(true);

  const isActiveScreen = pathname === '/driver/active';

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const data = await fetchDriverProfile();
        if (!active) return;
        if (!data?.profile) {
          nav('/driver/onboarding', { replace: true });
          return;
        }
        const status = data.approval_status ?? data.profile.approvalStatus ?? 'pending';
        if (status !== 'approved') {
          nav('/driver/pending', { replace: true, state: { approvalStatus: status } });
        }
      } catch (err) {
        if (err?.status === 401) {
          nav('/login', { replace: true });
          return;
        }
        console.error('Error fetching driver profile:', err);
        pushToast({
          kind: 'error',
          title: 'Lỗi kết nối',
          message: 'Không thể xác thực trạng thái tài xế.',
        });
      } finally {
        if (active) setCheckingProfile(false);
      }
    }
    check();
    return () => {
      active = false;
    };
  }, [nav, pushToast]);

  if (checkingProfile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas-soft">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-base text-body text-body-md font-medium animate-pulse">Đang xác thực hồ sơ tài xế...</p>
      </div>
    );
  }

  if (showDesktopBlock) {
    return <DriverDesktopBlock />;
  }

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-canvas text-ink">
      {!isActiveScreen && (
        <header className="flex shrink-0 items-center justify-between border-b border-hairline px-base py-sm">
          <div className="flex items-center gap-sm">
            <Avatar src={currentDriver.avatar} name={currentDriver.name} size="sm" />
            <div className="leading-tight">
              <div className="text-body-sm font-semibold text-ink">Chào {currentDriver.name.split(' ')[0]}</div>
              <div className="text-caption text-body inline-flex items-center gap-1">
                <Icon name="starFilled" size={10} /> {currentDriver.rating} ·{' '}
                <span className="nums">{currentDriver.trips}</span> chuyến
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge tone={driverOnline ? 'success' : 'outline'} dot>
              {driverOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
            </Badge>
            <IconButton icon="bell" label="Thông báo" size="sm" onClick={() => nav('/driver/notifications')} />
          </div>
        </header>
      )}

      <main
        className={clsx(
          'min-h-0 flex-1',
          isActiveScreen
            ? 'flex min-h-0 flex-col overflow-hidden'
            : clsx(
                'overflow-y-auto bg-canvas',
                activeDriverJob
                  ? 'pb-44'
                  : 'pb-32',
              ),
        )}
      >
        <Outlet />
      </main>

      {activeDriverJob && !isActiveScreen && (
        <button
          onClick={() => nav('/driver/active')}
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-20 flex items-center justify-between border-t border-hairline bg-primary px-base py-2 text-left text-on-primary"
        >
          <div className="flex items-center gap-sm">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-surface-dark-elevated">
              <Icon name="bike" size={14} />
            </span>
            <div className="leading-tight">
              <div className="text-caption-uppercase text-on-dark-soft">Giao hàng đang thực hiện</div>
              <div className="text-body-sm font-semibold">
                {activeDriverJob.restaurantName.length > 22
                  ? activeDriverJob.restaurantName.slice(0, 22) + '…'
                  : activeDriverJob.restaurantName}
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-caption text-on-dark-soft">
            Tiếp tục <Icon name="chevronRight" size={14} />
          </span>
        </button>
      )}

      {!isActiveScreen && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-canvas">
          <div className="grid grid-cols-4">
            {TABS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  clsx(
                    'flex flex-col items-center gap-1 py-2 text-caption transition-colors',
                    isActive ? 'text-ink' : 'text-body hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={clsx(
                        'grid h-9 w-9 place-items-center rounded-md transition-colors',
                        isActive ? 'bg-primary text-on-primary' : 'text-ink',
                      )}
                    >
                      <Icon name={l.icon} size={16} />
                    </span>
                    <span className={clsx(isActive ? 'text-ink font-semibold' : 'text-body')}>{l.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
          <div className="pb-safe" />
        </nav>
      )}
    </div>
  );
}
