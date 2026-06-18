import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { fetchDriverProfile } from '../../lib/api.js';

// driver_profiles.approval_status: 'pending' | 'rejected' | 'suspended'
export default function DriverPending({ status = 'pending', reason }) {
  const [liveStatus, setLiveStatus] = useState(status);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchDriverProfile();
        if (cancelled) return;
        setLiveStatus(data.approval_status ?? 'pending');
      } catch {
        if (!cancelled) setLiveStatus(status);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const view = {
    pending: {
      tone: 'bg-canvas-soft text-ink',
      icon: 'clock',
      title: 'Hồ sơ tài xế đang chờ duyệt',
      message: 'Chúng tôi đang xem xét CCCD và bằng lái của bạn — kết quả trong 24-48 giờ.',
    },
    approved: {
      tone: 'bg-[#e9f8ef] text-success',
      icon: 'check',
      title: 'Hồ sơ tài xế đã được duyệt',
      message: 'Bạn đã có thể vào khu vực tài xế để bắt đầu nhận đơn.',
    },
    rejected: {
      tone: 'bg-[#fbeaea] text-error',
      icon: 'x',
      title: 'Hồ sơ chưa được chấp nhận',
      message: reason || 'Vui lòng kiểm tra lại giấy tờ và gửi lại hồ sơ mới.',
    },
    suspended: {
      tone: 'bg-[#fbf1de] text-accent-warning',
      icon: 'alert',
      title: 'Tài khoản tài xế đang bị tạm dừng',
      message: reason || 'Tài khoản tạm thời không thể nhận đơn theo quyết định của quản trị viên.',
    },
  }[liveStatus];

  return (
    <div className="px-base py-xl">
      <Card padded className="text-center">
        <span className={'mx-auto grid h-16 w-16 place-items-center rounded-pill ' + view.tone}>
          <Icon name={view.icon} size={28} />
        </span>
        <h1 className="mt-base text-display-sm text-ink">{view.title}</h1>
        <p className="mt-xs text-body-md text-body">{view.message}</p>

        <ul className="mt-md space-y-2 text-left text-body-sm text-body">
          <li className="flex items-start gap-2">
            <Icon name="check" size={14} className="mt-1 text-ink" />
            NomNom sẽ gọi vào số bạn đã đăng ký để xác minh nếu cần.
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" size={14} className="mt-1 text-ink" />
            Trong khi chờ, bạn có thể cập nhật thông tin tại{' '}
            <Link to="/driver/onboarding" className="text-text-link hover:underline">trang đăng ký</Link>.
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" size={14} className="mt-1 text-ink" />
            Bạn sẽ nhận thông báo trong ứng dụng khi có kết quả.
          </li>
        </ul>

        <div className="mt-md flex flex-col gap-2 md:flex-row md:justify-center">
          {liveStatus === 'approved' ? (
            <Button as={Link} to="/driver" trailingIcon="arrowRight">
              Vào trang tài xế
            </Button>
          ) : (
            <>
              <Button as={Link} to="/driver/account" variant="secondary">Mở tài khoản</Button>
              <Button as={Link} to="/driver/onboarding" trailingIcon="arrowRight">Cập nhật giấy tờ</Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
