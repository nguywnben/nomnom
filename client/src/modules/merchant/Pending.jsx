import { Link } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';

// Hiển thị khi `restaurants.status = 'pending'` hoặc `'suspended'` / `'closed'`.
// Lúc dùng API thật: prop status sẽ tới từ /merchant/me.
export default function MerchantPending({ status = 'pending', reason }) {
  const view = {
    pending: {
      tone: 'bg-canvas-soft text-ink',
      icon: 'clock',
      title: 'Hồ sơ quán đang được xét duyệt',
      message: 'Đội ngũ NomNom sẽ kiểm tra giấy phép và liên hệ trong 1-3 ngày làm việc.',
    },
    suspended: {
      tone: 'bg-[#fbeaea] text-error',
      icon: 'alert',
      title: 'Quán đang bị tạm dừng',
      message: reason || 'Quán của bạn đang tạm thời ngừng nhận đơn theo quyết định của quản trị viên.',
    },
    closed: {
      tone: 'bg-canvas-soft text-ink',
      icon: 'x',
      title: 'Quán đã đóng',
      message: 'Hồ sơ quán đã được đóng. Nếu muốn mở lại, hãy liên hệ hỗ trợ.',
    },
  }[status];

  return (
    <div className="container-page py-xxl">
      <Card padded className="mx-auto max-w-xl text-center">
        <span className={'mx-auto grid h-16 w-16 place-items-center rounded-pill ' + view.tone}>
          <Icon name={view.icon} size={28} />
        </span>
        <h1 className="mt-base text-display-sm text-ink md:text-display-md">{view.title}</h1>
        <p className="mt-xs text-body-md text-body">{view.message}</p>

        <ul className="mt-md space-y-2 text-left text-body-sm text-body">
          <li className="flex items-start gap-2">
            <Icon name="check" size={14} className="mt-1 text-ink" />
            Trong thời gian chờ, bạn vẫn có thể chỉnh sửa thực đơn — đơn hàng sẽ tự động mở khi duyệt xong.
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" size={14} className="mt-1 text-ink" />
            Bạn sẽ nhận email / thông báo trong ứng dụng khi có kết quả.
          </li>
          <li className="flex items-start gap-2">
            <Icon name="check" size={14} className="mt-1 text-ink" />
            Có thể bổ sung giấy tờ tại trang <Link to="/merchant/onboarding" className="text-text-link hover:underline">Đăng ký quán</Link>.
          </li>
        </ul>

        <div className="mt-md flex flex-col gap-2 md:flex-row md:justify-center">
          <Button as={Link} to="/merchant" variant="secondary">
            Mở Bảng điều khiển
          </Button>
          <Button as={Link} to="/merchant/menu" trailingIcon="arrowRight">
            Cập nhật thực đơn
          </Button>
        </div>
      </Card>
    </div>
  );
}
