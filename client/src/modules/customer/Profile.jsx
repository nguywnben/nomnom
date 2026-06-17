import { Link, useLocation, useNavigate } from 'react-router-dom';
import Avatar from '../../components/Avatar.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { loginHref } from '../../lib/auth.js';

// Customer profile — reached from the mobile bottom nav (and surfaced on
// desktop via the avatar menu in the top nav).
const SETTINGS = [
  { id: 'addresses', label: 'Địa chỉ đã lưu', icon: 'pin', link: '/app/profile/addresses' },
  { id: 'payments', label: 'Phương thức thanh toán', icon: 'card', link: '/app/profile/payments' },
  { id: 'promotions', label: 'Khuyến mãi & voucher', icon: 'zap', link: '/app/profile/promotions' },
  { id: 'notifications', label: 'Thông báo', icon: 'bell', link: '/app/profile/notifications' },
  { id: 'help', label: 'Trợ giúp & hỗ trợ', icon: 'chat', link: '/chat/chat-admin' },
  { id: 'settings', label: 'Cài đặt ứng dụng', icon: 'cog', link: '/app/profile/settings' },
];

export default function CustomerProfile() {
  const { pathname, search } = useLocation();
  const nav = useNavigate();
  const { currentCustomer, orders, authedRoles, logout, user } = useApp();

  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const activeCount = orders.length - deliveredCount;

  return (
    <div className="flex flex-col gap-base p-base md:container-page md:py-xl">
      <div className="md:mb-base">
        <div className="text-caption-uppercase text-body">Tài khoản</div>
        <h1 className="text-display-md text-ink md:text-display-lg">Hồ sơ</h1>
      </div>

      {/* Identity */}
      <Card padded className="flex items-center gap-sm">
        {user ? (
          <>
            <Avatar src={currentCustomer.avatar} name={currentCustomer.name} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="text-title-md text-ink truncate">{currentCustomer.name}</div>
              <div className="text-caption text-body truncate">{currentCustomer.email}</div>
              <div className="text-caption text-body truncate">{currentCustomer.phone}</div>
            </div>
            <Link to="/app/profile/edit" aria-label="Chỉnh sửa hồ sơ">
              <Button size="sm" variant="secondary" leadingIcon="edit">
                Sửa
              </Button>
            </Link>
          </>
        ) : (
          <div className="flex-1">
            <div className="text-title-md text-ink">Tham gia NomNom</div>
            <div className="text-caption text-body">
              Đăng nhập hoặc tạo tài khoản khách hàng miễn phí — lưu địa chỉ, theo dõi đơn và đồng bộ giỏ hàng.
            </div>
            <Button className="mt-sm" onClick={() => nav(loginHref(pathname + search))}>
              Đăng nhập hoặc đăng ký
            </Button>
          </div>
        )}
      </Card>

      {/* Order stats */}
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Đơn hàng đang hoạt động" value={activeCount} icon="bike" link="/app/orders" />
        <Stat label="Đã giao" value={deliveredCount} icon="check" link="/app/orders" />
      </div>

      {/* Address card */}
      {user && (
        <Link to="/app/profile/addresses" className="block">
          <Card padded hover>
            <div className="flex items-center gap-sm">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-surface-strong text-ink">
                <Icon name="pin" size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-caption-uppercase text-body">Địa chỉ mặc định</div>
                <div className="text-body-sm font-semibold text-ink truncate">
                  {currentCustomer.address}
                </div>
              </div>
              <Icon name="chevronRight" size={14} className="text-body" />
            </div>
          </Card>
        </Link>
      )}

      {/* Settings list */}
      <Card padded={false}>
        <ul className="divide-y divide-hairline">
          {SETTINGS.map((it) => {
            const inner = (
              <>
                <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-strong text-ink">
                  <Icon name={it.icon} size={16} />
                </span>
                <span className="flex-1 text-body-sm text-ink">{it.label}</span>
                <Icon name="chevronRight" size={14} className="text-body" />
              </>
            );
            return (
              <li key={it.id}>
                <Link
                  to={it.link}
                  className="flex w-full items-center gap-sm px-base py-3 hover:bg-canvas-soft"
                >
                  {inner}
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Other roles */}
      <Card padded>
        <div className="text-caption-uppercase text-body mb-sm">Các nền tảng khác</div>
        <div className="grid grid-cols-3 gap-xs">
          <RoleTile to="/merchant" icon="store" label="Quán ăn" />
          <RoleTile to="/driver" icon="bike" label="Tài xế" />
          <RoleTile to="/admin" icon="shield" label="Quản trị" />
        </div>
      </Card>

      {user && (
        <Button
          variant="secondary"
          className="!text-error !border-error/40 hover:!bg-[#fbeaea]"
          onClick={() => logout()}
        >
          Đăng xuất
        </Button>
      )}

    </div>
  );
}

function Stat({ label, value, icon, link }) {
  return (
    <Link
      to={link}
      className="rounded-lg border border-hairline-strong bg-surface-card p-sm hover:shadow-soft transition-shadow"
    >
      <div className="flex items-center justify-between">
        <span className="text-caption-uppercase text-body">{label}</span>
        <span className="grid h-7 w-7 place-items-center rounded-md bg-surface-strong text-body">
          <Icon name={icon} size={12} />
        </span>
      </div>
      <div className="mt-1 nums text-display-md text-ink leading-none">{value}</div>
    </Link>
  );
}

function RoleTile({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1 rounded-md border border-hairline-strong bg-surface-card py-sm hover:bg-canvas-soft"
    >
      <Icon name={icon} size={16} />
      <span className="text-caption text-ink">{label}</span>
    </Link>
  );
}
