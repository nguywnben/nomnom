import { useState } from 'react';

import Badge from '../../../components/Badge.jsx';
import Button from '../../../components/Button.jsx';
import Card from '../../../components/Card.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import Icon from '../../../components/Icon.jsx';
import Input from '../../../components/Input.jsx';
import Modal from '../../../components/Modal.jsx';
import { useApp } from '../../../context/AppContext.jsx';
import ProfileSubHeader from './ProfileSubHeader.jsx';

// Phương thức thanh toán — UI demo, không kết nối với cổng thật.
const SEED = [
  {
    id: 'pm-1',
    kind: 'card',
    brand: 'Visa',
    last4: '4242',
    expiry: '12/27',
    holder: 'Mara Chen',
    isDefault: true,
  },
  {
    id: 'pm-2',
    kind: 'wallet',
    brand: 'VNPay',
    label: 'Ví VNPay liên kết',
    isDefault: false,
  },
  {
    id: 'pm-3',
    kind: 'cash',
    brand: 'Tiền mặt',
    label: 'Trả khi nhận hàng',
    isDefault: false,
  },
];

const ICON_MAP = {
  card: 'card',
  wallet: 'wallet',
  cash: 'cash',
};

export default function Payments() {
  const { pushToast, authedRoles } = useApp();
  const [list, setList] = useState(SEED);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ holder: '', number: '', expiry: '', cvc: '' });

  const setDefault = (id) => {
    setList((cur) => cur.map((p) => ({ ...p, isDefault: p.id === id })));
    pushToast({
      kind: 'success',
      title: 'Đã đặt làm mặc định',
      message: list.find((p) => p.id === id)?.brand,
    });
  };

  const remove = (id) => {
    const target = list.find((p) => p.id === id);
    if (!target) return;
    if (target.kind === 'cash') {
      pushToast({
        kind: 'info',
        title: 'Không thể xoá',
        message: 'Tuỳ chọn trả tiền mặt luôn khả dụng.',
      });
      return;
    }
    setList((cur) => {
      const next = cur.filter((p) => p.id !== id);
      if (target.isDefault && next.length > 0) next[0] = { ...next[0], isDefault: true };
      return next;
    });
    pushToast({ kind: 'info', title: 'Đã xoá phương thức', message: target.brand });
  };

  const submitCard = (e) => {
    e.preventDefault();
    const digits = form.number.replace(/\s+/g, '');
    if (digits.length < 12 || !form.expiry || !form.cvc || !form.holder) {
      pushToast({ kind: 'error', title: 'Thiếu thông tin', message: 'Vui lòng kiểm tra lại thông tin thẻ.' });
      return;
    }
    const last4 = digits.slice(-4);
    const brand = digits.startsWith('4') ? 'Visa' : digits.startsWith('5') ? 'Mastercard' : 'Thẻ';
    const id = `pm-${Date.now()}`;
    setList((cur) => [
      ...cur,
      { id, kind: 'card', brand, last4, expiry: form.expiry, holder: form.holder, isDefault: false },
    ]);
    pushToast({ kind: 'success', title: 'Đã thêm thẻ', message: `${brand} •• ${last4}` });
    setAdding(false);
    setForm({ holder: '', number: '', expiry: '', cvc: '' });
  };

  return (
    <div className="flex flex-col gap-base p-base md:container-page md:py-xl">
      <ProfileSubHeader title="Phương thức thanh toán" />

      <div className="flex items-center justify-between gap-sm">
        <p className="text-body-sm text-body">Quản lý thẻ và ví dùng để thanh toán đơn hàng.</p>
        <Button size="sm" leadingIcon="plus" onClick={() => setAdding(true)} disabled={!authedRoles.customer}>
          Thêm thẻ
        </Button>
      </div>

      {!authedRoles.customer ? (
        <Card padded>
          <div className="text-title-md text-ink">Cần đăng nhập</div>
          <p className="mt-1 text-body-sm text-body">
            Đăng nhập để lưu và quản lý phương thức thanh toán.
          </p>
        </Card>
      ) : list.length === 0 ? (
        <EmptyState
          icon="card"
          title="Chưa có phương thức nào"
          message="Thêm thẻ hoặc liên kết ví để thanh toán nhanh khi đặt món."
          action={<Button onClick={() => setAdding(true)}>Thêm thẻ</Button>}
        />
      ) : (
        <div className="flex flex-col gap-sm">
          {list.map((p) => (
            <Card key={p.id} padded>
              <div className="flex items-start gap-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface-strong text-ink">
                  <Icon name={ICON_MAP[p.kind]} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-body-sm font-semibold text-ink">{p.brand}</div>
                    {p.isDefault && <Badge tone="success" dot>Mặc định</Badge>}
                    {p.kind === 'card' && <Badge tone="outline">•• {p.last4}</Badge>}
                  </div>
                  <div className="mt-0.5 text-caption text-body truncate">
                    {p.kind === 'card' && (
                      <>
                        {p.holder} · Hết hạn {p.expiry}
                      </>
                    )}
                    {p.kind !== 'card' && p.label}
                  </div>
                </div>
              </div>

              <div className="mt-sm flex flex-wrap items-center justify-end gap-xs">
                {!p.isDefault && (
                  <Button size="sm" variant="secondary" onClick={() => setDefault(p.id)}>
                    Đặt mặc định
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  leadingIcon="trash"
                  className="!text-error !border-error/40 hover:!bg-[#fbeaea]"
                  onClick={() => remove(p.id)}
                >
                  Xoá
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Security note */}
      <Card padded variant="soft">
        <div className="flex items-start gap-sm">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-surface-card text-ink">
            <Icon name="shield" size={16} />
          </span>
          <div className="min-w-0">
            <div className="text-body-sm font-semibold text-ink">Thanh toán an toàn</div>
            <p className="text-caption text-body">
              NomNom không lưu trữ số thẻ đầy đủ. Mọi giao dịch được mã hoá và xử lý qua đối tác cổng
              thanh toán đạt chuẩn PCI DSS.
            </p>
          </div>
        </div>
      </Card>

      {/* Add-card modal */}
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Thêm thẻ mới"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Hủy
            </Button>
            <Button onClick={submitCard}>Lưu thẻ</Button>
          </>
        }
      >
        <form onSubmit={submitCard} className="flex flex-col gap-sm">
          <Input
            leadingIcon="user"
            placeholder="Tên trên thẻ"
            value={form.holder}
            onChange={(e) => setForm((c) => ({ ...c, holder: e.target.value }))}
            required
          />
          <Input
            leadingIcon="card"
            placeholder="0000 0000 0000 0000"
            inputMode="numeric"
            value={form.number}
            onChange={(e) =>
              setForm((c) => ({
                ...c,
                number: e.target.value.replace(/[^0-9 ]/g, '').slice(0, 19),
              }))
            }
            required
          />
          <div className="grid grid-cols-2 gap-sm">
            <Input
              placeholder="MM/YY"
              inputMode="numeric"
              value={form.expiry}
              onChange={(e) => setForm((c) => ({ ...c, expiry: e.target.value.slice(0, 5) }))}
              required
            />
            <Input
              placeholder="CVC"
              inputMode="numeric"
              value={form.cvc}
              onChange={(e) =>
                setForm((c) => ({ ...c, cvc: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) }))
              }
              required
            />
          </div>
          <p className="text-caption text-body">
            Đây là biểu mẫu mô phỏng — không có thông tin nào được gửi đi.
          </p>
        </form>
      </Modal>
    </div>
  );
}
