import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { Link } from 'react-router-dom';

export default function MerchantWallet() {
  const { currentMerchant } = useApp();

  return (
    <div className="space-y-base">
      <div>
        <div className="text-caption-uppercase text-body">Tài chính</div>
        <h1 className="text-display-lg text-ink">Ví quán & rút tiền</h1>
      </div>

      <EmptyState
        icon="wallet"
        title="Ví & rút tiền chưa sẵn sàng"
        message={
          currentMerchant?.restaurantName
            ? `${currentMerchant.restaurantName} chưa được nối với backend payout thật. Tạm thời không hiển thị số dư, lịch sử giao dịch hay nút rút tiền giả.`
            : 'Chức năng ví chưa được nối với backend payout thật. Tạm thời không hiển thị số dư, lịch sử giao dịch hay nút rút tiền giả.'
        }
        action={
          <Button variant="secondary" as={Link} to="/merchant/orders">
            Xem đơn hàng thật
          </Button>
        }
      />
    </div>
  );
}
