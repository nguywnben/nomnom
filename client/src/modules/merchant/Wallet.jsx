import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Input from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Tabs from '../../components/Tabs.jsx';
import { fetchMerchantWalletApi, requestMerchantPayoutApi } from '../../lib/api.js';
import { formatVnd } from '../../lib/formatVnd.js';
import { useApp } from '../../context/AppContext.jsx';

const TYPE_LABEL = {
  order_earning: 'Doanh thu đơn',
  commission: 'Hoa hồng nền tảng',
  order_payment: 'Khách thanh toán',
  withdrawal: 'Rút tiền',
  adjustment: 'Điều chỉnh',
};
const PAYOUT_LABEL = { pending: 'Chờ duyệt', approved: 'Chờ chuyển', completed: 'Đã chuyển', rejected: 'Từ chối' };
const PAYOUT_TONE = { pending: 'warning', approved: 'live', completed: 'success', rejected: 'error' };

export default function MerchantWallet() {
  const { pushToast } = useApp();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('transactions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchMerchantWalletApi());
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu ví.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const requestPayout = async () => {
    setSubmitting(true);
    try {
      await requestMerchantPayoutApi(Number(amount));
      setPayoutOpen(false);
      setAmount('');
      pushToast({ kind: 'success', title: 'Đã gửi yêu cầu rút tiền', message: 'Admin sẽ xem xét yêu cầu trong danh sách payout.' });
      await load();
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể rút tiền', message: err.message || 'Vui lòng kiểm tra số dư và thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) return <div className="py-section text-center text-body-sm text-body" role="status">Đang tải ví...</div>;
  if (error && !data) return <Card padded><div className="text-title-md text-ink">Không thể tải ví</div><p className="mt-1 text-body-sm text-body">{error}</p><Button className="mt-sm" variant="secondary" onClick={load}>Thử lại</Button></Card>;

  const { wallet, settings, stats } = data;
  const canRequest = settings.bankConfigured && !wallet.isLocked && wallet.availableBalance >= settings.minPayoutAmount;

  return (
    <div className="space-y-base">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Tài chính & Doanh thu</div>
          <h1 className="text-display-lg text-ink">Ví Doanh thu & Rút tiền</h1>
          <p className="mt-xs text-body-sm text-body">
            Kiểm tra số dư khả dụng, lịch sử thu nhập từ đơn hàng và gửi yêu cầu rút tiền về tài khoản ngân hàng.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          <Badge tone={wallet.isLocked ? 'error' : 'success'} dot>
            {wallet.isLocked ? 'Ví bị tạm khóa' : 'Ví đang hoạt động'}
          </Badge>
          <Badge tone={settings.bankConfigured ? 'outline' : 'warning'}>
            {settings.bankConfigured ? 'Đã liên kết ngân hàng' : 'Chưa liên kết ngân hàng'}
          </Badge>
        </div>
      </div>

      <Card padded variant="dark" className="grid gap-base md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="text-caption-uppercase text-on-dark-soft">Số dư có thể rút</div>
          <div className="mt-1 text-display-md text-on-dark nums md:text-display-lg">{formatVnd(wallet.availableBalance)}</div>
          <div className="mt-1 text-caption text-on-dark-soft">Số dư ví {formatVnd(wallet.balance)} · đang giữ {formatVnd(wallet.pendingBalance)} · hoa hồng {settings.commissionRate}%</div>
        </div>
        <Button variant="secondary" size="sm" leadingIcon="download" disabled={!canRequest} onClick={() => setPayoutOpen(true)}>
          Yêu cầu rút tiền
        </Button>
      </Card>

      {!settings.bankConfigured && (
        <div className="flex flex-wrap items-center justify-between gap-sm rounded-md border border-hairline-strong bg-canvas-soft p-base">
          <div>
            <div className="text-title-sm text-ink">Chưa có tài khoản nhận tiền</div>
            <p className="text-body-sm text-body">Cập nhật ngân hàng, số tài khoản và chủ tài khoản trước khi rút.</p>
          </div>
          <Link to="/merchant/settings">
            <Button variant="secondary" size="sm" leadingIcon="cog">Mở cài đặt</Button>
          </Link>
        </div>
      )}

      <div className="grid gap-base md:grid-cols-3">
        <Kpi title="Doanh thu hôm nay" value={formatVnd(stats.todayRevenue)} hint={stats.deliveredOrdersToday + ' đơn đã giao'} />
        <Kpi title="Đã rút trong tháng" value={formatVnd(stats.withdrawnThisMonth)} hint={stats.payoutCountThisMonth + ' payout hoàn tất'} />
        <Kpi title="Tổng thu nhập" value={formatVnd(wallet.totalEarned)} hint={'Đã rút ' + formatVnd(wallet.totalWithdrawn)} />
      </div>

      <Tabs
        size="sm"
        className="w-fit max-w-full"
        items={[
          { value: 'transactions', label: `Lịch sử giao dịch (${data.transactions.length})` },
          { value: 'payouts', label: `Lịch sử rút tiền (${data.payouts.length})` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'transactions' && (
        data.transactions.length ? (
          <Card padded={false} className="overflow-hidden">
            <ul className="divide-y divide-hairline">
              {data.transactions.map((item) => {
                const credit = item.direction === 'credit';
                return (
                  <li key={item.id} className="grid gap-2 p-base sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <div>
                      <div className="text-body-sm font-semibold text-ink">{TYPE_LABEL[item.type] || item.type}</div>
                      <div className="text-caption text-body">{item.description || 'Giao dịch ví'} · {new Date(item.createdAt).toLocaleString('vi-VN')}</div>
                    </div>
                    <div className={'nums text-body-sm font-semibold ' + (credit ? 'text-success' : 'text-error')}>
                      {credit ? '+' : '-'}{formatVnd(item.amount)}
                    </div>
                    <div className="nums text-caption text-body sm:text-right">Còn {formatVnd(item.balanceAfter)}</div>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : (
          <EmptyState icon="wallet" title="Chưa có giao dịch" message="Doanh thu đơn và các lần rút tiền sẽ xuất hiện ở đây." />
        )
      )}

      {tab === 'payouts' && (
        data.payouts.length ? (
          <Card padded={false} className="overflow-hidden">
            <ul className="divide-y divide-hairline">
              {data.payouts.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-sm p-base">
                  <div>
                    <div className="text-body-sm font-semibold text-ink nums">{item.code}</div>
                    <div className="text-caption text-body">{item.bankName} · {item.bankAccountMasked} · {new Date(item.requestedAt).toLocaleString('vi-VN')}</div>
                    {item.rejectReason && <div className="mt-1 text-caption text-error">{item.rejectReason}</div>}
                  </div>
                  <div className="text-right">
                    <div className="nums text-body-sm font-semibold text-ink">{formatVnd(item.amount)}</div>
                    <Badge tone={PAYOUT_TONE[item.status]}>{PAYOUT_LABEL[item.status]}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState icon="cash" title="Chưa có yêu cầu rút tiền" message="Yêu cầu đầu tiên sẽ xuất hiện tại đây sau khi gửi." />
        )
      )}

      <Modal
        open={payoutOpen}
        onClose={() => setPayoutOpen(false)}
        title="Yêu cầu rút tiền"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setPayoutOpen(false)}>
              Hủy
            </Button>
            <Button leadingIcon="check" size="sm" loading={submitting} disabled={!Number(amount)} onClick={requestPayout}>
              Gửi yêu cầu
            </Button>
          </>
        }
      >
        <div className="space-y-sm">
          <Input
            type="number"
            min={settings.minPayoutAmount}
            max={wallet.availableBalance}
            step="1000"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-label="Số tiền rút"
            placeholder="Số tiền muốn rút"
            hint={'Tối thiểu ' + formatVnd(settings.minPayoutAmount) + ' · khả dụng ' + formatVnd(wallet.availableBalance)}
          />
          <div className="rounded-md border border-hairline-strong bg-canvas-soft p-sm text-body-sm text-body">
            Nhận tại {settings.bankName} · {settings.bankAccountMasked}. Admin chỉ hoàn tất sau khi nhập mã chuyển khoản.
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Kpi({ title, value, hint }) {
  return <Card padded><div className="text-caption-uppercase text-body">{title}</div><div className="mt-1 text-display-sm text-ink nums">{value}</div><div className="mt-1 text-caption text-body">{hint}</div></Card>;
}
