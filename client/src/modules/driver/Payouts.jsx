import { useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Modal from '../../components/Modal.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Input, { Select } from '../../components/Input.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { useApp } from '../../context/AppContext.jsx';

// Yêu cầu rút tiền cho tài xế — `payout_requests` (status: pending/approved/completed/rejected).
const HISTORY = [
  { id: 'PYT-D-014', amount: 480_000, status: 'completed', at: Date.now() - 12 * 60 * 60 * 1000, bank: 'Techcombank · *** 1199' },
  { id: 'PYT-D-013', amount: 1_200_000, status: 'completed', at: Date.now() - 4 * 24 * 60 * 60 * 1000, bank: 'Techcombank · *** 1199' },
  { id: 'PYT-D-012', amount: 350_000, status: 'rejected', at: Date.now() - 8 * 24 * 60 * 60 * 1000, bank: 'Techcombank · *** 1199', reject: 'Số tài khoản không hợp lệ' },
  { id: 'PYT-D-011', amount: 980_000, status: 'pending', at: Date.now() - 60 * 60 * 1000, bank: 'Techcombank · *** 1199' },
];

const STATUS = {
  pending: { label: 'Chờ duyệt', tone: 'warning' },
  approved: { label: 'Đã duyệt', tone: 'live' },
  completed: { label: 'Đã chuyển', tone: 'success' },
  rejected: { label: 'Từ chối', tone: 'error' },
};

export default function DriverPayouts() {
  const { pushToast } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ amount: 200_000, bank: 'Techcombank · *** 1199' });
  const balance = 642_000;

  const request = () => {
    if (draft.amount < 100_000) {
      pushToast({ kind: 'error', title: 'Tối thiểu 100.000 ₫', message: 'Hệ thống yêu cầu số tiền rút tối thiểu là 100.000 ₫.' });
      return;
    }
    setOpen(false);
    pushToast({
      kind: 'success',
      title: 'Đã gửi yêu cầu rút tiền',
      message: `${formatVnd(draft.amount)} đang chờ NomNom xét duyệt.`,
    });
  };

  return (
    <div className="px-base py-base">
      <div className="mb-base">
        <div className="text-caption-uppercase text-body">Thu nhập</div>
        <h1 className="text-display-md text-ink">Rút tiền</h1>
      </div>

      <Card padded variant="dark" className="mb-base">
        <div className="text-caption-uppercase text-on-dark-soft">Số dư khả dụng</div>
        <div className="mt-1 text-display-md text-on-dark nums">{formatVnd(balance)}</div>
        <p className="mt-1 text-caption text-on-dark-soft">
          Tiền vào ví sau mỗi chuyến hoàn tất. Mức rút tối thiểu 100.000 ₫.
        </p>
        <Button variant="secondary" className="mt-base w-full" leadingIcon="download" onClick={() => setOpen(true)}>
          Tạo yêu cầu rút tiền
        </Button>
      </Card>

      <h2 className="mb-2 text-title-md text-ink">Lịch sử yêu cầu</h2>
      {HISTORY.length === 0 ? (
        <EmptyState icon="wallet" title="Chưa có yêu cầu nào" message="Yêu cầu rút tiền mới sẽ xuất hiện ở đây." />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-hairline">
            {HISTORY.map((p) => {
              const s = STATUS[p.status];
              return (
                <li key={p.id} className="p-base">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="nums text-body-sm font-semibold text-ink">{p.id}</div>
                      <div className="text-caption text-body truncate">{p.bank}</div>
                      <div className="text-caption text-body">{new Date(p.at).toLocaleString('vi-VN')}</div>
                    </div>
                    <div className="text-right">
                      <div className="nums text-body-sm font-semibold text-ink">{formatVnd(p.amount)}</div>
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </div>
                  </div>
                  {p.reject && (
                    <div className="mt-2 rounded-md border border-hairline-strong bg-[#fbeaea] p-2 text-caption text-error">
                      Lý do: {p.reject}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Yêu cầu rút tiền" size="sm">
        <div className="flex flex-col gap-sm">
          <Input
            type="number"
            placeholder="Số tiền (VND)"
            aria-label="Số tiền"
            value={draft.amount}
            onChange={(e) => setDraft((d) => ({ ...d, amount: Number(e.target.value) }))}
            hint={`Số dư khả dụng: ${formatVnd(balance)}.`}
          />
          <Select
            aria-label="Tài khoản nhận"
            options={[
              { value: 'Techcombank · *** 1199', label: 'Techcombank · *** 1199' },
              { value: 'Vietcombank · *** 4488', label: 'Vietcombank · *** 4488' },
            ]}
            value={draft.bank}
            onChange={(e) => setDraft((d) => ({ ...d, bank: e.target.value }))}
          />
          <div className="rounded-md border border-hairline-strong bg-canvas-soft p-sm text-caption text-body">
            <Icon name="alert" size={12} className="mr-1 inline" />
            Yêu cầu sẽ được duyệt và chuyển trong vòng 24 giờ.
          </div>
          <div className="flex justify-end gap-2 pt-xs">
            <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={request} leadingIcon="check">Gửi yêu cầu</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
