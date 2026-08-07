import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { Link } from 'react-router-dom';

export default function MerchantSettings() {
  const { currentMerchant } = useApp();

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Quản trị</div>
          <h1 className="text-display-lg text-ink">Cài đặt quán</h1>
          <p className="mt-xs text-body-sm text-body">
            Dữ liệu hồ sơ thật đã được đồng bộ từ backend, nhưng các tab chỉnh sửa chưa được mở.
          </p>
        </div>
      </div>

      <EmptyState
        icon="cog"
        title="Cài đặt quán đang ở chế độ chỉ xem"
        message={
          currentMerchant?.restaurantName
            ? `${currentMerchant.restaurantName} có hồ sơ nhà hàng thật, nhưng cài đặt quán, giờ mở cửa, nhân sự và phí vận hành chưa có API lưu/đồng bộ.`
            : 'Cài đặt quán, giờ mở cửa, nhân sự và phí vận hành chưa có API lưu/đồng bộ.'
        }
        action={
          <Button variant="secondary" as={Link} to="/merchant">
            Về dashboard
          </Button>
        }
      />
    </div>
  );
}
