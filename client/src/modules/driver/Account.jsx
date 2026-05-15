import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';

// ---------------------------------------------------------------------------
// Driver Account — the "Account" tab.
//   • Profile header (avatar / name / rating / trips)
//   • Quick stats (this-week earnings, deliveries, hours)
//   • Settings menu (Vehicle, Payments, Notifications, Help, Logout, Switch role)
// ---------------------------------------------------------------------------

const MENU = [
  { id: 'vehicle', label: 'Phương tiện & giấy tờ', icon: 'driverHelmet' },
  { id: 'payments', label: 'Phương thức thanh toán', icon: 'card' },
  { id: 'notifications', label: 'Thông báo', icon: 'bell' },
  { id: 'safety', label: 'Trung tâm an toàn', icon: 'shield' },
  { id: 'help', label: 'Trợ giúp & hỗ trợ', icon: 'chat', link: '/chat/chat-admin' },
  { id: 'settings', label: 'Cài đặt ứng dụng', icon: 'cog' },
];

export default function DriverAccount() {
  const nav = useNavigate();
  const { currentDriver, driverOnline, pushToast } = useApp();

  return (
    <div className="flex flex-col gap-base p-base">
      {/* Profile header */}
      <Card padded className="flex items-center gap-sm">
        <Avatar src={currentDriver.avatar} name={currentDriver.name} size="xl" />
        <div className="flex-1 min-w-0">
          <div className="text-title-md text-ink truncate">{currentDriver.name}</div>
          <div className="text-caption text-body inline-flex items-center gap-1">
            <Icon name="starFilled" size={11} /> <span className="nums">{currentDriver.rating}</span> ·{' '}
            <span className="nums">{currentDriver.trips}</span> chuyến
          </div>
          <div className="mt-1">
            <Badge tone={driverOnline ? 'success' : 'outline'} dot>
              {driverOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
            </Badge>
          </div>
        </div>
        <button
          onClick={() => pushToast({ kind: 'info', title: 'Chỉnh sửa hồ sơ', message: 'Chỉ là bản dùng thử.' })}
          className="rounded-md p-1 text-body hover:bg-canvas-soft hover:text-ink"
          aria-label="Chỉnh sửa hồ sơ"
        >
          <Icon name="edit" size={16} />
        </button>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="Thu nhập" value="$721" />
        <MiniStat label="Chuyến xe" value="42" />
        <MiniStat label="Giờ" value="38h" />
      </div>

      {/* Vehicle card */}
      <Card padded>
        <div className="flex items-center gap-sm">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-surface-strong text-ink">
            <Icon name="bike" size={18} />
          </span>
          <div className="flex-1">
            <div className="text-body-sm font-semibold text-ink">{currentDriver.vehicle}</div>
            <div className="text-caption text-body">Bảo hiểm · Bằng lái — đã xác minh</div>
          </div>
          <Icon name="check" size={16} className="text-success" />
        </div>
      </Card>

      {/* Menu list */}
      <Card padded={false}>
        <ul className="divide-y divide-hairline">
          {MENU.map((it) => {
            const inner = (
              <>
                <span className="grid h-8 w-8 place-items-center rounded-md bg-surface-strong text-ink">
                  <Icon name={it.icon} size={16} />
                </span>
                <span className="flex-1 text-body-sm text-ink">{it.label}</span>
                <Icon name="chevronRight" size={14} className="text-body" />
              </>
            );
            return (
              <li key={it.id}>
                {it.link ? (
                  <Link
                    to={it.link}
                    className="flex w-full items-center gap-sm px-sm py-2 hover:bg-canvas-soft"
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    onClick={() =>
                      pushToast({
                        kind: 'info',
                        title: it.label,
                        message: 'Chỉ là bản dùng thử — chưa được liên kết.',
                      })
                    }
                    className="flex w-full items-center gap-sm px-sm py-2 hover:bg-canvas-soft text-left"
                  >
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Sign out / switch role */}
      <div className="flex flex-col gap-2">
        <Button variant="secondary" leadingIcon="refresh" onClick={() => nav('/')}>
          Chuyển vai trò
        </Button>
        <Button
          variant="secondary"
          className="!text-error !border-error/40 hover:!bg-[#fbeaea]"
          onClick={() =>
            pushToast({ kind: 'error', title: 'Đã đăng xuất', message: 'Bạn đã đăng xuất.' })
          }
        >
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <Card padded={false} className="p-sm text-center">
      <div className="text-caption-uppercase text-body">{label}</div>
      <div className="mt-0.5 nums text-title-md text-ink">{value}</div>
    </Card>
  );
}
