import { useMemo, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Input from '../../components/Input.jsx';
import Tabs from '../../components/Tabs.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import { Textarea } from '../../components/Input.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { useApp } from '../../context/AppContext.jsx';

// Duyệt yêu cầu rút tiền — `payout_requests` (status: pending → approved → completed | rejected).
const ITEMS = [
  { id: 'PYT-008', user: 'Cinque Pizzeria', role: 'merchant', amount: 2_000_000, bank: 'Vietcombank · *** 2839', holder: 'NGUYEN VAN A', status: 'pending', at: Date.now() - 2 * 60 * 60 * 1000 },
  { id: 'PYT-D-014', user: 'Phạm Văn Hoàng', role: 'driver', amount: 480_000, bank: 'Techcombank · *** 1199', holder: 'PHAM VAN HOANG', status: 'pending', at: Date.now() - 6 * 60 * 60 * 1000 },
  { id: 'PYT-007', user: 'Junebug Burgers', role: 'merchant', amount: 1_500_000, bank: 'BIDV · *** 4480', holder: 'JUNEBUG VN CO', status: 'approved', at: Date.now() - 8 * 60 * 60 * 1000 },
  { id: 'PYT-D-013', user: 'Trần Quốc Bảo', role: 'driver', amount: 1_200_000, bank: 'Techcombank · *** 1199', holder: 'TRAN QUOC BAO', status: 'completed', at: Date.now() - 24 * 60 * 60 * 1000 },
  { id: 'PYT-D-012', user: 'Hoàng Văn Nam', role: 'driver', amount: 350_000, bank: 'ACB · *** 9912', holder: 'HOANG VAN NAM', status: 'rejected', at: Date.now() - 3 * 24 * 60 * 60 * 1000, reason: 'Số tài khoản không khớp với chủ tài khoản đăng ký.' },
];

const STATUS = {
  pending: { label: 'Chờ duyệt', tone: 'warning' },
  approved: { label: 'Đã duyệt — chờ chuyển', tone: 'live' },
  completed: { label: 'Đã chuyển', tone: 'success' },
  rejected: { label: 'Từ chối', tone: 'error' },
};

export default function AdminPayouts() {
  const { pushToast } = useApp();
  const [items, setItems] = useState(ITEMS);
  const [tab, setTab] = useState('pending');
  const [q, setQ] = useState('');
  const [rejectOf, setRejectOf] = useState(null);
  const [reason, setReason] = useState('');
  const [refOf, setRefOf] = useState(null);
  const [externalRef, setExternalRef] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((p) => {
      if (tab !== 'all' && p.status !== tab) return false;
      if (!needle) return true;
      return `${p.id} ${p.user} ${p.bank}`.toLowerCase().includes(needle);
    });
  }, [items, tab, q]);

  const approve = (id) =>
    setItems((cur) => cur.map((p) => (p.id === id ? { ...p, status: 'approved' } : p))) ||
    pushToast({ kind: 'success', title: 'Đã duyệt', message: 'Chuyển sang trạng thái chờ chuyển khoản.' });

  const complete = (id) => {
    if (!externalRef.trim()) return;
    setItems((cur) => cur.map((p) => (p.id === id ? { ...p, status: 'completed', externalRef } : p)));
    setRefOf(null);
    setExternalRef('');
    pushToast({ kind: 'success', title: 'Đã hoàn tất', message: 'Khoản tiền đã được đánh dấu là đã chuyển.' });
  };

  const reject = (id) => {
    if (!reason.trim()) return;
    setItems((cur) => cur.map((p) => (p.id === id ? { ...p, status: 'rejected', reason } : p)));
    setRejectOf(null);
    setReason('');
    pushToast({ kind: 'info', title: 'Đã từ chối', message: 'Người yêu cầu sẽ nhận thông báo.' });
  };

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Tài chính</div>
          <h1 className="text-display-lg text-ink">Duyệt rút tiền</h1>
        </div>
        <Input
          className="w-full md:w-72"
          leadingIcon="search"
          placeholder="Tìm theo mã, người yêu cầu, ngân hàng…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Tabs
        className="w-fit max-w-full"
        items={[
          { value: 'pending', label: `Chờ duyệt (${items.filter((p) => p.status === 'pending').length})` },
          { value: 'approved', label: 'Chờ chuyển' },
          { value: 'completed', label: 'Đã chuyển' },
          { value: 'rejected', label: 'Từ chối' },
          { value: 'all', label: 'Tất cả' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="wallet" title="Không có yêu cầu phù hợp" />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-hairline">
            {filtered.map((p) => {
              const s = STATUS[p.status];
              return (
                <li key={p.id} className="p-base">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="nums text-body-sm font-semibold text-ink">{p.id}</div>
                      <div className="text-caption text-body truncate">
                        {p.user} · {p.role === 'driver' ? 'Tài xế' : 'Chủ quán'}
                      </div>
                      <div className="text-caption text-body truncate">
                        {p.bank} · {p.holder}
                      </div>
                      <div className="text-caption text-body">{new Date(p.at).toLocaleString('vi-VN')}</div>
                    </div>
                    <div className="text-right">
                      <div className="nums text-body-sm font-semibold text-ink">{formatVnd(p.amount)}</div>
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </div>
                  </div>

                  {p.reason && (
                    <div className="mt-2 rounded-md border border-hairline-strong bg-[#fbeaea] p-2 text-caption text-error">
                      Lý do: {p.reason}
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.status === 'pending' && (
                      <>
                        <Button size="sm" leadingIcon="check" onClick={() => approve(p.id)}>Duyệt</Button>
                        <Button size="sm" variant="secondary" leadingIcon="x" onClick={() => { setRejectOf(p); setReason(''); }}>
                          Từ chối
                        </Button>
                      </>
                    )}
                    {p.status === 'approved' && (
                      <Button size="sm" leadingIcon="check" onClick={() => { setRefOf(p); setExternalRef(''); }}>
                        Đánh dấu đã chuyển
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Modal open={!!rejectOf} onClose={() => setRejectOf(null)} title="Từ chối yêu cầu" size="sm">
        <div className="flex flex-col gap-sm">
          <Textarea rows={4} placeholder="Lý do từ chối" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectOf(null)}>Hủy</Button>
            <Button onClick={() => reject(rejectOf.id)} disabled={!reason.trim()}>Xác nhận từ chối</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!refOf} onClose={() => setRefOf(null)} title="Xác nhận đã chuyển khoản" size="sm">
        <div className="flex flex-col gap-sm">
          <Input
            placeholder="Mã giao dịch ngân hàng (external_ref)"
            value={externalRef}
            onChange={(e) => setExternalRef(e.target.value)}
            hint="Lưu trong cột external_ref để đối soát sau."
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRefOf(null)}>Hủy</Button>
            <Button onClick={() => complete(refOf.id)} disabled={!externalRef.trim()} leadingIcon="check">
              Xác nhận
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
