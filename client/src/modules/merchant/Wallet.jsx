import { useMemo, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Modal from '../../components/Modal.jsx';
import Tabs from '../../components/Tabs.jsx';
import Input, { Select } from '../../components/Input.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { useApp } from '../../context/AppContext.jsx';

// Ví quán + lịch sử giao dịch + yêu cầu rút tiền —
// khớp `wallets`, `wallet_transactions`, `payout_requests` (owner_type='merchant').
const TX_LIST = [
  { id: 't1', type: 'order_earning', amount: 245_000, balanceAfter: 4_120_000, ref: 'ORD-A1B2C', at: Date.now() - 30 * 60 * 1000 },
  { id: 't2', type: 'commission', amount: -36_750, balanceAfter: 3_875_000, ref: 'ORD-A1B2C', at: Date.now() - 30 * 60 * 1000 },
  { id: 't3', type: 'order_earning', amount: 380_000, balanceAfter: 3_911_750, ref: 'ORD-K9X', at: Date.now() - 4 * 60 * 60 * 1000 },
  { id: 't4', type: 'withdrawal', amount: -2_000_000, balanceAfter: 3_531_750, ref: 'PYT-008', at: Date.now() - 24 * 60 * 60 * 1000 },
  { id: 't5', type: 'order_earning', amount: 168_000, balanceAfter: 5_531_750, ref: 'ORD-J7P', at: Date.now() - 2 * 24 * 60 * 60 * 1000 },
];

const TYPE_LABEL = {
  order_earning: { label: 'Doanh thu đơn', tone: 'success' },
  commission: { label: 'Hoa hồng nền tảng', tone: 'default' },
  order_payment: { label: 'Khách thanh toán', tone: 'default' },
  withdrawal: { label: 'Rút tiền', tone: 'warning' },
  adjustment: { label: 'Điều chỉnh', tone: 'default' },
};

const PAYOUTS = [
  { id: 'PYT-008', amount: 2_000_000, status: 'completed', at: Date.now() - 24 * 60 * 60 * 1000, bank: 'Vietcombank · *** 2839' },
  { id: 'PYT-007', amount: 1_500_000, status: 'completed', at: Date.now() - 8 * 24 * 60 * 60 * 1000, bank: 'Vietcombank · *** 2839' },
  { id: 'PYT-006', amount: 1_200_000, status: 'pending', at: Date.now() - 2 * 60 * 60 * 1000, bank: 'Vietcombank · *** 2839' },
];

export default function MerchantWallet() {
  const { pushToast } = useApp();
  const [tab, setTab] = useState('transactions');
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [draft, setDraft] = useState({ amount: 500_000, bank: 'Vietcombank · *** 2839' });

  const balance = useMemo(() => TX_LIST[0].balanceAfter, []);

  const requestPayout = () => {
    setPayoutOpen(false);
    pushToast({
      kind: 'success',
      title: 'Đã gửi yêu cầu rút tiền',
      message: `${formatVnd(draft.amount)} sẽ về tài khoản trong 1-2 ngày làm việc.`,
    });
  };

  return (
    <div className="space-y-base">
      <div>
        <div className="text-caption-uppercase text-body">Tài chính</div>
        <h1 className="text-display-lg text-ink">Ví quán & rút tiền</h1>
      </div>

      {/* Balance card */}
      <Card padded variant="dark" className="grid gap-base md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="text-caption-uppercase text-on-dark-soft">Số dư có thể rút</div>
          <div className="mt-1 text-display-md text-on-dark nums md:text-display-lg">{formatVnd(balance)}</div>
          <div className="mt-1 text-caption text-on-dark-soft">
            Đối soát tự động lúc 0:00 hằng ngày. Hoa hồng nền tảng 15%.
          </div>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <Button variant="secondary" leadingIcon="download" onClick={() => setPayoutOpen(true)}>
            Yêu cầu rút tiền
          </Button>
          <Button variant="dark" leadingIcon="refresh">
            Đối soát thủ công
          </Button>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid gap-base md:grid-cols-3">
        <Kpi title="Doanh thu hôm nay" value={formatVnd(1_245_000)} hint="+18% so với hôm qua" />
        <Kpi title="Đơn hoàn tất hôm nay" value="14" hint="+3 so với hôm qua" />
        <Kpi title="Đã rút trong tháng" value={formatVnd(8_700_000)} hint="3 lần rút thành công" />
      </div>

      <Tabs
        className="w-fit max-w-full"
        items={[
          { value: 'transactions', label: 'Lịch sử giao dịch' },
          { value: 'payouts', label: 'Lịch sử rút tiền' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'transactions' && (
        <Card padded={false} className="overflow-hidden">
          {/* Desktop table */}
          <table className="hidden w-full text-left text-body-sm md:table">
            <thead className="bg-canvas-soft text-caption-uppercase text-body">
              <tr>
                <th className="px-base py-2">Loại</th>
                <th className="px-base py-2">Tham chiếu</th>
                <th className="px-base py-2 text-right">Số tiền</th>
                <th className="px-base py-2 text-right">Số dư sau</th>
                <th className="px-base py-2">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {TX_LIST.map((t) => {
                const meta = TYPE_LABEL[t.type] || TYPE_LABEL.adjustment;
                return (
                  <tr key={t.id} className="border-t border-hairline">
                    <td className="px-base py-2">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </td>
                    <td className="px-base py-2 nums text-body">{t.ref}</td>
                    <td className={'px-base py-2 nums text-right ' + (t.amount >= 0 ? 'text-success' : 'text-error')}>
                      {t.amount >= 0 ? '+' : ''}{formatVnd(t.amount)}
                    </td>
                    <td className="px-base py-2 nums text-right text-ink">{formatVnd(t.balanceAfter)}</td>
                    <td className="px-base py-2 text-body">{new Date(t.at).toLocaleString('vi-VN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Mobile cards */}
          <ul className="divide-y divide-hairline md:hidden">
            {TX_LIST.map((t) => {
              const meta = TYPE_LABEL[t.type] || TYPE_LABEL.adjustment;
              return (
                <li key={t.id} className="flex items-center justify-between gap-2 p-base">
                  <div className="min-w-0">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <div className="mt-1 nums text-caption text-body truncate">{t.ref}</div>
                    <div className="text-caption text-body">{new Date(t.at).toLocaleString('vi-VN')}</div>
                  </div>
                  <div className="text-right">
                    <div className={'nums text-body-sm font-semibold ' + (t.amount >= 0 ? 'text-success' : 'text-error')}>
                      {t.amount >= 0 ? '+' : ''}{formatVnd(t.amount)}
                    </div>
                    <div className="nums text-caption text-body">{formatVnd(t.balanceAfter)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {tab === 'payouts' && (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-hairline">
            {PAYOUTS.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-base p-base">
                <div className="min-w-0">
                  <div className="text-body-sm font-semibold text-ink nums">{p.id}</div>
                  <div className="text-caption text-body truncate">{p.bank}</div>
                  <div className="text-caption text-body">{new Date(p.at).toLocaleString('vi-VN')}</div>
                </div>
                <div className="text-right">
                  <div className="nums text-body-sm font-semibold text-ink">{formatVnd(p.amount)}</div>
                  <Badge tone={p.status === 'completed' ? 'success' : 'warning'}>
                    {p.status === 'completed' ? 'Đã chuyển' : 'Chờ duyệt'}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={payoutOpen}
        onClose={() => setPayoutOpen(false)}
        title="Yêu cầu rút tiền"
        size="sm"
      >
        <div className="flex flex-col gap-sm">
          <Input
            type="number"
            placeholder="Số tiền muốn rút (VND)"
            aria-label="Số tiền"
            value={draft.amount}
            onChange={(e) => setDraft((d) => ({ ...d, amount: Number(e.target.value) }))}
            hint={`Tối thiểu ${formatVnd(100_000)} mỗi lần (min_payout_amount).`}
          />
          <Select
            aria-label="Tài khoản nhận"
            options={[
              { value: 'Vietcombank · *** 2839', label: 'Vietcombank · *** 2839' },
              { value: 'Techcombank · *** 1147', label: 'Techcombank · *** 1147' },
            ]}
            value={draft.bank}
            onChange={(e) => setDraft((d) => ({ ...d, bank: e.target.value }))}
          />
          <div className="rounded-md border border-hairline-strong bg-canvas-soft p-sm text-caption text-body">
            <Icon name="alert" size={12} className="mr-1 inline" />
            Phí chuyển khoản (nếu có) sẽ trừ vào số tiền nhận thực tế.
          </div>
          <div className="flex justify-end gap-2 pt-xs">
            <Button variant="secondary" onClick={() => setPayoutOpen(false)}>Hủy</Button>
            <Button onClick={requestPayout} leadingIcon="check">Gửi yêu cầu</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Kpi({ title, value, hint }) {
  return (
    <Card padded>
      <div className="text-caption-uppercase text-body">{title}</div>
      <div className="mt-1 text-display-sm text-ink nums">{value}</div>
      {hint && <div className="mt-1 text-caption text-body">{hint}</div>}
    </Card>
  );
}
