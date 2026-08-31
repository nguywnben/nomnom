import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { fetchMerchantRestaurantApi } from '../../lib/api.js';
import {
  isMerchantRestaurantApproved,
  isMerchantRestaurantRejected,
  isMerchantRestaurantUnderReview,
  normalizeMerchantRestaurantStatus,
} from '../../lib/merchantStatus.js';

function formatAddress(restaurant) {
  return [restaurant.address_line, restaurant.ward, restaurant.district, restaurant.city]
    .filter(Boolean)
    .join(', ');
}

function formatSubmittedAt(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resolveView(restaurant) {
  const rawStatus = String(restaurant.status ?? '').trim().toLowerCase();
  const status = normalizeMerchantRestaurantStatus(restaurant.status);
  const rejectionReason = restaurant.rejection_reason?.trim();

  if (rawStatus === 'suspended') {
    return {
      key: 'suspended',
      badge: { tone: 'error', label: 'Tạm khóa', dot: true },
      icon: 'alert',
      iconWrap: 'bg-[#fbeaea] text-error border-hairline',
      title: 'Quán đang bị tạm khóa hoạt động',
      message: rejectionReason || 'Quán ăn của bạn đã bị quản trị viên tạm khóa do vi phạm quy định vận hành.',
      description:
        'Vui lòng liên hệ bộ phận hỗ trợ đối tác hoặc quản trị viên NomNom để được giải đáp và hỗ trợ mở khóa lại quán.',
      steps: null,
      primaryAction: { to: '/app', label: 'Về trang khách hàng' },
      secondaryAction: null,
    };
  }

  if (status === 'rejected' && rejectionReason) {
    return {
      key: 'rejected',
      badge: { tone: 'error', label: 'Bị từ chối', dot: true },
      icon: 'alert',
      iconWrap: 'bg-[#fbeaea] text-error border-hairline',
      title: 'Hồ sơ đăng ký bị từ chối',
      message: rejectionReason,
      description:
        'Vui lòng kiểm tra lại thông tin và giấy tờ, sau đó cập nhật hồ sơ để gửi lại cho bộ phận duyệt.',
      steps: null,
      primaryAction: { to: '/merchant/onboarding', label: 'Chỉnh sửa & nộp lại', icon: 'arrowRight' },
      secondaryAction: { to: '/app', label: 'Về trang khách hàng' },
    };
  }

  if (status === 'under_review') {
    return {
      key: 'pending',
      badge: { tone: 'warning', label: 'Chờ duyệt', dot: true },
      icon: 'clock',
      iconWrap: 'bg-canvas-soft text-ink border-hairline-strong',
      title: 'Hồ sơ đang được xét duyệt',
      message:
        'Đội ngũ NomNom đang kiểm tra giấy phép kinh doanh và các chứng từ liên quan của quán bạn.',
      description: null,
      steps: [
        'Thời gian xét duyệt thường từ 1 đến 3 ngày làm việc.',
        'Chúng tôi có thể gọi xác minh qua số điện thoại quán nếu cần.',
        'Bạn sẽ nhận thông báo trong ứng dụng ngay khi có kết quả.',
      ],
      primaryAction: { to: '/app', label: 'Về trang khách hàng' },
      secondaryAction: null,
    };
  }

  if (status === 'closed') {
    return {
      key: 'closed',
      badge: { tone: 'outline', label: 'Đã đóng cửa' },
      icon: 'store',
      iconWrap: 'bg-canvas-soft text-body border-hairline-strong',
      title: 'Quán đã đóng cửa',
      message: 'Quán đã đóng cửa hoặc ngừng hoạt động trên NomNom.',
      description:
        'Nếu đây là sự nhầm lẫn hoặc bạn muốn mở lại quán, vui lòng liên hệ bộ phận hỗ trợ đối tác.',
      steps: null,
      primaryAction: { to: '/app', label: 'Về trang khách hàng' },
      secondaryAction: null,
    };
  }

  return {
    key: 'unknown',
    badge: { tone: 'outline', label: status || 'unknown' },
    icon: 'clock',
    iconWrap: 'bg-canvas-soft text-ink border-hairline-strong',
    title: 'Đang chuẩn bị',
    message: 'Hồ sơ đang ở trạng thái không xác định.',
    description: null,
    steps: null,
    primaryAction: { to: '/app', label: 'Về trang khách hàng' },
    secondaryAction: null,
  };
}

export default function MerchantPending() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setLoadError(false);
      try {
        const data = await fetchMerchantRestaurantApi();
        if (!active) return;

        if (!data?.restaurant) {
          navigate('/merchant/onboarding', { replace: true });
          return;
        }

        if (isMerchantRestaurantApproved(data.restaurant.status)) {
          navigate('/merchant', { replace: true });
          return;
        }

        if (isMerchantRestaurantRejected(data.restaurant.status) || isMerchantRestaurantUnderReview(data.restaurant.status)) {
          setRestaurant(data.restaurant);
          return;
        }

        setRestaurant(data.restaurant);
      } catch (err) {
        if (active) setLoadError(true);
        console.error('Lỗi khi tải thông tin quán ăn:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [navigate, loadAttempt]);

  const view = useMemo(() => (restaurant ? resolveView(restaurant) : null), [restaurant]);

  if (loading) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-xl">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-base animate-pulse text-body-md font-medium text-body">Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center py-xl">
        <Card padded className="w-full max-w-lg text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-md border border-hairline bg-[#fbeaea] text-error">
            <Icon name="alert" size={24} />
          </span>
          <h1 className="mt-base text-display-sm text-ink">Không thể tải hồ sơ quán</h1>
          <p className="mt-xs text-body-md text-body">
            Kết nối đến hệ thống đang gián đoạn. Vui lòng thử lại sau ít phút.
          </p>
          <div className="mt-base flex justify-center">
            <Button onClick={() => setLoadAttempt((attempt) => attempt + 1)} leadingIcon="refresh">
              Thử lại
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!restaurant || !view) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center py-xl">
        <Card padded className="w-full max-w-lg text-center">
          <h1 className="text-display-sm text-ink">Chưa tìm thấy hồ sơ quán</h1>
          <p className="mt-xs text-body-md text-body">Vui lòng gửi hồ sơ đăng ký quán để tiếp tục.</p>
          <div className="mt-base flex justify-center">
            <Button as={Link} to="/merchant/onboarding">Đăng ký quán</Button>
          </div>
        </Card>
      </div>
    );
  }

  const showReason = view.key === 'rejected';

  return (
    <div className="container-page py-xl">
      <div className="mx-auto max-w-2xl">
        <div className="mb-base">
          <div className="text-caption-uppercase text-body">Đối tác NomNom</div>
          <h1 className="text-display-md text-ink md:text-display-lg">Trạng thái hồ sơ quán</h1>
          <p className="mt-xs text-body-md text-body">
            Theo dõi tiến trình xét duyệt đối tác quán ăn của bạn trên NomNom.
          </p>
        </div>

        <Card padded className="space-y-base">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
            <span
              className={clsx(
                'grid h-14 w-14 shrink-0 place-items-center rounded-md border',
                view.iconWrap,
              )}
            >
              <Icon name={view.icon} size={24} />
            </span>
            <div className="mt-sm sm:mt-0 sm:ml-base sm:flex-1">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
                <Badge tone={view.badge.tone} dot={view.badge.dot}>
                  {view.badge.label}
                </Badge>
              </div>
              <h2 className="mt-sm text-display-sm text-ink">{view.title}</h2>
              <p className="mt-xs text-body-md text-body">{view.message}</p>
              {view.description && (
                <p className="mt-xs text-body-sm text-body">{view.description}</p>
              )}
            </div>
          </div>

          {showReason && (
            <div className="rounded-md border border-hairline bg-canvas-soft p-base">
              <div className="text-caption-uppercase text-body">Lý do từ chối</div>
              <p className="mt-1 text-body-sm text-ink">{restaurant.rejection_reason}</p>
            </div>
          )}

          {view.steps && (
            <ul className="space-y-2 border-t border-hairline pt-base text-left text-body-sm text-body">
              {view.steps.map((step) => (
                <li key={step} className="flex items-start gap-2">
                  <Icon name="check" size={14} className="mt-0.5 shrink-0 text-ink" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-hairline pt-base">
            <div className="mb-sm flex items-center justify-between gap-2">
              <h3 className="text-body-sm font-semibold text-ink">Thông tin đã gửi</h3>
              {restaurant.logo_url && (
                <img
                  src={restaurant.logo_url}
                  alt=""
                  className="h-10 w-10 rounded-md border border-hairline object-cover"
                />
              )}
            </div>
            <dl className="space-y-0">
              <InfoRow label="Tên quán" value={restaurant.name} />
              <InfoRow label="Số điện thoại" value={restaurant.phone && restaurant.phone !== 'null' ? restaurant.phone : 'Chưa cập nhật'} />
              <InfoRow label="Địa chỉ" value={formatAddress(restaurant)} />
              <InfoRow label="Ngày gửi hồ sơ" value={formatSubmittedAt(restaurant.created_at)} />
              {restaurant.bank_name && (
                <InfoRow
                  label="Ngân hàng"
                  value={`${restaurant.bank_name} · ${restaurant.bank_account_no || '—'}`}
                />
              )}
            </dl>
          </div>

          <div className="flex flex-col gap-2 border-t border-hairline pt-base sm:flex-row sm:justify-end">
            {view.secondaryAction && (
              <Button as={Link} to={view.secondaryAction.to} variant="secondary">
                {view.secondaryAction.label}
              </Button>
            )}
            <Button
              as={Link}
              to={view.primaryAction.to}
              variant="primary"
              trailingIcon={view.primaryAction.icon}
            >
              {view.primaryAction.label}
            </Button>
          </div>
        </Card>

        <p className="mt-base text-center text-caption text-body">
          Cần hỗ trợ?{' '}
          <Link to="/app/profile/settings" className="text-text-link hover:underline">
            Liên hệ đội ngũ NomNom
          </Link>
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-base border-b border-hairline py-2 last:border-0">
      <dt className="text-caption-uppercase text-body">{label}</dt>
      <dd className="max-w-[60%] text-right text-body-sm font-medium text-ink">{value || '—'}</dd>
    </div>
  );
}
