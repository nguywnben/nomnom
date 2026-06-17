import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { fetchMerchantRestaurantApi } from '../../lib/api.js';

export default function MerchantPending() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const data = await fetchMerchantRestaurantApi();
        if (!active) return;
        
        if (!data || !data.restaurant) {
          // Chưa đăng ký quán nào, chuyển hướng về onboarding
          navigate('/merchant/onboarding', { replace: true });
          return;
        }

        setRestaurant(data.restaurant);

        // Nếu quán đã hoạt động, tự động chuyển hướng vào bảng điều khiển merchant
        if (data.restaurant.status === 'active') {
          navigate('/merchant', { replace: true });
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin quán ăn:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="container-page py-xxl flex flex-col items-center justify-center min-h-[50vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-base text-body text-body-md font-medium animate-pulse">Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  // Xác định giao diện dựa trên status và rejection_reason (xử lý từ chối)
  const status = restaurant.status;
  const isRejected = status === 'suspended' && restaurant.rejection_reason;

  const view = (() => {
    if (isRejected) {
      return {
        tone: 'bg-[#fbeaea] text-error border-error/20',
        icon: 'alert',
        title: 'Hồ sơ đăng ký bị từ chối',
        message: restaurant.rejection_reason,
        description: 'Vui lòng kiểm tra lại thông tin và giấy tờ đính kèm dưới đây, sau đó nhấn nút chỉnh sửa để cập nhật lại hồ sơ.',
      };
    }
    if (status === 'pending') {
      return {
        tone: 'bg-canvas-soft text-ink border-hairline-strong',
        icon: 'clock',
        title: 'Hồ sơ đang được xét duyệt',
        message: 'Đội ngũ NomNom đang kiểm tra giấy phép kinh doanh và các chứng từ liên quan của quán bạn.',
        description: 'Quá trình xét duyệt diễn ra từ 1 đến 3 ngày làm việc. Bạn sẽ nhận được thông báo ngay khi có kết quả.',
      };
    }
    if (status === 'suspended') {
      return {
        tone: 'bg-[#fbeaea] text-error border-error/20',
        icon: 'alert',
        title: 'Quán đang tạm ngưng hoạt động',
        message: 'Quán ăn của bạn đã bị quản trị viên tạm ngưng hoạt động trên hệ thống.',
        description: 'Vui lòng liên hệ với bộ phận hỗ trợ khách hàng để được giải đáp và hỗ trợ mở lại.',
      };
    }
    if (status === 'closed') {
      return {
        tone: 'bg-canvas-soft text-ink border-hairline-strong',
        icon: 'x',
        title: 'Quán đã đóng cửa',
        message: 'Quán đã đóng cửa hoặc ngừng hoạt động vĩnh viễn.',
        description: 'Nếu đây là sự nhầm lẫn hoặc bạn muốn mở lại quán, vui lòng liên hệ bộ phận hỗ trợ đối tác của chúng tôi.',
      };
    }
    return {
      tone: 'bg-canvas-soft text-ink border-hairline-strong',
      icon: 'clock',
      title: 'Đang chuẩn bị',
      message: 'Hồ sơ đang ở trạng thái không xác định.',
      description: '',
    };
  })();

  return (
    <div className="container-page py-xxl">
      <Card padded className="mx-auto max-w-xl text-center border shadow-lg rounded-xl">
        <span className={'mx-auto grid h-16 w-16 place-items-center rounded-pill ' + view.tone}>
          <Icon name={view.icon} size={28} />
        </span>
        <h1 className="mt-base text-display-sm font-bold text-ink md:text-display-md">{view.title}</h1>
        
        <div className="mt-sm p-base rounded-lg bg-canvas-soft border text-left">
          <p className="text-body-md font-semibold text-ink">Chi tiết / Lý do:</p>
          <p className="mt-xs text-body-md text-body italic">"{view.message}"</p>
        </div>

        <p className="mt-md text-body-sm text-body">{view.description}</p>

        <div className="mt-md border-t border-hairline pt-md text-left">
          <h3 className="text-body-sm font-semibold text-ink uppercase tracking-wider mb-xs">Thông tin quán đã đăng ký:</h3>
          <div className="grid grid-cols-2 gap-2 text-body-sm text-body">
            <div>Tên quán:</div>
            <div className="font-medium text-ink text-right">{restaurant.name}</div>
            <div>Số điện thoại:</div>
            <div className="font-medium text-ink text-right">{restaurant.phone}</div>
            <div>Địa chỉ:</div>
            <div className="font-medium text-ink text-right truncate max-w-[200px]">{restaurant.address_line}, {restaurant.city}</div>
          </div>
        </div>

        <div className="mt-lg flex flex-col gap-2 md:flex-row md:justify-center">
          {isRejected ? (
            <Button as={Link} to="/merchant/onboarding" variant="primary" trailingIcon="arrowRight">
              Chỉnh sửa hồ sơ & Nộp lại
            </Button>
          ) : (
            <>
              <Button as={Link} to="/app" variant="secondary">
                Về Trang chủ khách hàng
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
