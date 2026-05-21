import { useMemo, useState } from 'react';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Input from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import { Textarea } from '../../components/Input.jsx';
import Tabs from '../../components/Tabs.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useApp } from '../../context/AppContext.jsx';

// Duyệt tài xế — `driver_profiles.approval_status`.
const PIPELINE = [
  { id: 'dq-001', name: 'Phạm Văn Hoàng', phone: '+84 935 211 008', vehicle: 'Honda Wave Alpha', plate: '59X1 23 456', city: 'TP. Hồ Chí Minh', submittedAt: Date.now() - 3 * 60 * 60 * 1000, status: 'pending', docs: { idCard: true, license: true, portrait: true } },
  { id: 'dq-002', name: 'Đặng Thị Hồng', phone: '+84 938 887 102', vehicle: 'Yamaha Sirius', plate: '29X2 11 002', city: 'Hà Nội', submittedAt: Date.now() - 8 * 60 * 60 * 1000, status: 'pending', docs: { idCard: true, license: false, portrait: true } },
  { id: 'dq-003', name: 'Trần Quốc Bảo', phone: '+84 901 002 233', vehicle: 'Suzuki Raider', plate: '43X1 88 712', city: 'Đà Nẵng', submittedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, status: 'approved', docs: { idCard: true, license: true, portrait: true } },
  { id: 'dq-004', name: 'Hoàng Văn Nam', phone: '+84 909 776 223', vehicle: 'Honda Future', plate: '51X3 21 489', city: 'TP. Hồ Chí Minh', submittedAt: Date.now() - 4 * 24 * 60 * 60 * 1000, status: 'rejected', docs: { idCard: true, license: true, portrait: false } },
];

const STATUS = {
  pending: { label: 'Chờ duyệt', tone: 'warning' },
  approved: { label: 'Đã duyệt', tone: 'success' },
  rejected: { label: 'Từ chối', tone: 'error' },
  suspended: { label: 'Tạm dừng', tone: 'error' },
};

export default function AdminDriverApprovals() {
  const { pushToast } = useApp();
  const [items, setItems] = useState(PIPELINE);
  const [tab, setTab] = useState('pending');
  const [q, setQ] = useState('');
  const [active, setActive] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((r) => {
      if (tab !== 'all' && r.status !== tab) return false;
      if (!needle) return true;
      return `${r.name} ${r.phone} ${r.city}`.toLowerCase().includes(needle);
    });
  }, [items, tab, q]);

  const approve = (id) => {
    setItems((cur) => cur.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    setActive(null);
    pushToast({ kind: 'success', title: 'Đã duyệt tài xế', message: 'Tài xế có thể bắt đầu nhận đơn.' });
  };

  const reject = (id) => {
    if (!rejectReason.trim()) return;
    setItems((cur) => cur.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)));
    setActive(null);
    setRejectOpen(false);
    setRejectReason('');
    pushToast({ kind: 'info', title: 'Đã từ chối', message: 'Tài xế sẽ nhận thông báo và lý do.' });
  };

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Đối tác</div>
          <h1 className="text-display-lg text-ink">Duyệt tài xế</h1>
          <p className="mt-xs text-body-sm text-body">Kiểm tra CCCD, bằng lái và ảnh chân dung trước khi cho phép nhận đơn.</p>
        </div>
        <Input
          className="w-full md:w-72"
          leadingIcon="search"
          placeholder="Tìm theo tên, điện thoại, thành phố…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Tabs
        className="w-fit max-w-full"
        items={[
          { value: 'pending', label: `Chờ duyệt (${items.filter((r) => r.status === 'pending').length})` },
          { value: 'approved', label: 'Đã duyệt' },
          { value: 'rejected', label: 'Từ chối' },
          { value: 'all', label: 'Tất cả' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="bike" title="Không có hồ sơ phù hợp" />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-hairline">
            {filtered.map((d) => {
              const s = STATUS[d.status];
              const missing = Object.values(d.docs).some((v) => !v);
              return (
                <li key={d.id} className="grid grid-cols-1 items-center gap-sm p-base md:grid-cols-[1fr_auto_auto]">
                  <div className="flex items-center gap-sm">
                    <Avatar name={d.name} />
                    <div className="min-w-0">
                      <div className="text-body-sm font-semibold text-ink truncate">{d.name}</div>
                      <div className="text-caption text-body truncate">
                        {d.phone} · {d.vehicle} · {d.plate}
                      </div>
                      <div className="text-caption text-body">{d.city} · Nộp {new Date(d.submittedAt).toLocaleString('vi-VN')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:justify-center">
                    <Badge tone={s.tone}>{s.label}</Badge>
                    {missing && d.status === 'pending' && <Badge tone="warning">Thiếu giấy tờ</Badge>}
                  </div>
                  <div className="flex items-center gap-2 md:justify-end">
                    <Button variant="secondary" size="sm" onClick={() => setActive(d)}>Xem hồ sơ</Button>
                    {d.status === 'pending' && (
                      <Button size="sm" leadingIcon="check" onClick={() => approve(d.id)}>Duyệt</Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.name || ''} size="lg">
        {active && (
          <div className="flex flex-col gap-base">
            <div className="grid grid-cols-1 gap-base md:grid-cols-2">
              <Row label="Số điện thoại" value={active.phone} />
              <Row label="Phương tiện" value={`${active.vehicle} (${active.plate})`} />
              <Row label="Thành phố" value={active.city} />
              <Row label="Thời điểm nộp" value={new Date(active.submittedAt).toLocaleString('vi-VN')} />
            </div>

            <div className="grid grid-cols-3 gap-base">
              <DocBox title="CCCD/CMND" available={active.docs.idCard} />
              <DocBox title="Bằng lái" available={active.docs.license} />
              <DocBox title="Ảnh chân dung" available={active.docs.portrait} />
            </div>

            {active.status === 'pending' && (
              <div className="flex flex-col gap-2 border-t border-hairline pt-base md:flex-row md:justify-end">
                <Button variant="secondary" leadingIcon="x" onClick={() => setRejectOpen(true)}>Từ chối</Button>
                <Button leadingIcon="check" onClick={() => approve(active.id)}>Duyệt tài xế</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Từ chối hồ sơ" size="sm">
        <div className="flex flex-col gap-sm">
          <Textarea rows={4} placeholder="Lý do từ chối — sẽ gửi cho tài xế" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>Hủy</Button>
            <Button onClick={() => reject(active.id)} disabled={!rejectReason.trim()}>Xác nhận từ chối</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <div className="text-caption-uppercase text-body">{label}</div>
      <div className="text-body-sm text-ink">{value}</div>
    </div>
  );
}

function DocBox({ title, available }) {
  return (
    <div className="rounded-md border border-hairline-strong p-sm">
      <div className="text-body-sm font-medium text-ink">{title}</div>
      <div className="mt-2 grid h-28 place-items-center rounded-md bg-canvas-soft text-caption">
        {available ? (
          <span className="inline-flex items-center gap-2 text-body">
            <Icon name="camera" size={14} /> Xem (mock)
          </span>
        ) : (
          <span className="text-error">Thiếu</span>
        )}
      </div>
    </div>
  );
}
