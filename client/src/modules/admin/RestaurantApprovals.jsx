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

// Hàng đợi duyệt quán — `restaurants.status` (pending → active/rejected/suspended).
// Hiển thị giấy phép + VSATTP cho admin xem trước khi duyệt.
const PIPELINE = [
  {
    id: 'rq-001',
    name: 'Bún Bò Huế Mai Trang',
    owner: 'Lê Mai Trang',
    cuisine: 'Việt Nam',
    city: 'TP. Hồ Chí Minh',
    address: '23 Trần Hưng Đạo, Q.1',
    licenseUrl: '#license-1',
    foodSafetyUrl: '#food-1',
    submittedAt: Date.now() - 2 * 60 * 60 * 1000,
    status: 'pending',
  },
  {
    id: 'rq-002',
    name: 'Pho Saigon Bistro',
    owner: 'Nguyễn Quang Huy',
    cuisine: 'Việt Nam',
    city: 'TP. Hồ Chí Minh',
    address: '11 Lê Lai, Q.1',
    licenseUrl: '#license-2',
    foodSafetyUrl: null,
    submittedAt: Date.now() - 6 * 60 * 60 * 1000,
    status: 'pending',
  },
  {
    id: 'rq-003',
    name: 'Hachi Ramen Hà Nội',
    owner: 'Trần Thị Lan',
    cuisine: 'Nhật',
    city: 'Hà Nội',
    address: '54 Trần Duy Hưng, Cầu Giấy',
    licenseUrl: '#license-3',
    foodSafetyUrl: '#food-3',
    submittedAt: Date.now() - 24 * 60 * 60 * 1000,
    status: 'pending',
  },
  {
    id: 'rq-004',
    name: 'Verdant Bowls Đà Nẵng',
    owner: 'Phạm Anh Khoa',
    cuisine: 'Lành mạnh',
    city: 'Đà Nẵng',
    address: '7 Nguyễn Văn Linh',
    licenseUrl: '#license-4',
    foodSafetyUrl: '#food-4',
    submittedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    status: 'approved',
  },
];

const STATUS = {
  pending: { label: 'Chờ duyệt', tone: 'warning' },
  approved: { label: 'Đã duyệt', tone: 'success' },
  rejected: { label: 'Từ chối', tone: 'error' },
};

export default function AdminRestaurantApprovals() {
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
      const hay = `${r.name} ${r.owner} ${r.city}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, tab, q]);

  const approve = (id) => {
    setItems((cur) => cur.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    setActive(null);
    pushToast({ kind: 'success', title: 'Đã duyệt quán', message: 'Quán đã chuyển sang trạng thái hoạt động.' });
  };

  const reject = (id) => {
    if (!rejectReason.trim()) return;
    setItems((cur) => cur.map((r) => (r.id === id ? { ...r, status: 'rejected', rejectReason } : r)));
    setActive(null);
    setRejectOpen(false);
    setRejectReason('');
    pushToast({ kind: 'info', title: 'Đã từ chối hồ sơ', message: 'Quán sẽ nhận thông báo và lý do.' });
  };

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Đối tác</div>
          <h1 className="text-display-lg text-ink">Duyệt quán mới</h1>
          <p className="mt-xs text-body-sm text-body">
            Kiểm tra giấy phép kinh doanh và chứng nhận VSATTP. Tham chiếu bảng <code>restaurants</code>.
          </p>
        </div>
        <Input
          className="w-full md:w-72"
          leadingIcon="search"
          placeholder="Tìm theo tên quán, chủ, thành phố…"
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
        <EmptyState icon="store" title="Không có hồ sơ phù hợp" message="Thay đổi bộ lọc để xem thêm." />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-hairline">
            {filtered.map((r) => {
              const s = STATUS[r.status];
              return (
                <li key={r.id} className="grid grid-cols-1 items-center gap-sm p-base md:grid-cols-[1fr_auto_auto]">
                  <div className="flex items-center gap-sm">
                    <Avatar name={r.name} />
                    <div className="min-w-0">
                      <div className="text-body-sm font-semibold text-ink truncate">{r.name}</div>
                      <div className="text-caption text-body truncate">
                        {r.owner} · {r.cuisine} · {r.city}
                      </div>
                      <div className="text-caption text-body">Nộp {new Date(r.submittedAt).toLocaleString('vi-VN')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:justify-center">
                    <Badge tone={s.tone}>{s.label}</Badge>
                    {!r.foodSafetyUrl && r.status === 'pending' && (
                      <Badge tone="warning">Thiếu VSATTP</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 md:justify-end">
                    <Button variant="secondary" size="sm" onClick={() => setActive(r)}>
                      Xem hồ sơ
                    </Button>
                    {r.status === 'pending' && (
                      <Button size="sm" leadingIcon="check" onClick={() => approve(r.id)}>
                        Duyệt
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Detail modal */}
      <Modal open={!!active} onClose={() => setActive(null)} title={active?.name || ''} size="lg">
        {active && (
          <div className="flex flex-col gap-base">
            <div className="grid grid-cols-1 gap-base md:grid-cols-2">
              <Row label="Chủ quán" value={active.owner} />
              <Row label="Loại ẩm thực" value={active.cuisine} />
              <Row label="Địa chỉ" value={`${active.address}, ${active.city}`} />
              <Row label="Thời điểm nộp" value={new Date(active.submittedAt).toLocaleString('vi-VN')} />
            </div>

            <div className="grid grid-cols-1 gap-base md:grid-cols-2">
              <DocPreview title="Giấy phép kinh doanh" available={!!active.licenseUrl} />
              <DocPreview title="Chứng nhận VSATTP" available={!!active.foodSafetyUrl} />
            </div>

            {active.status === 'pending' && (
              <div className="flex flex-col gap-2 border-t border-hairline pt-base md:flex-row md:justify-end">
                <Button variant="secondary" leadingIcon="x" onClick={() => setRejectOpen(true)}>
                  Từ chối
                </Button>
                <Button leadingIcon="check" onClick={() => approve(active.id)}>
                  Duyệt quán
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Từ chối hồ sơ" size="sm">
        <div className="flex flex-col gap-sm">
          <Textarea
            rows={4}
            placeholder="Nhập lý do từ chối — sẽ gửi cho chủ quán"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
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

function DocPreview({ title, available }) {
  return (
    <div className="rounded-md border border-hairline-strong p-sm">
      <div className="flex items-center justify-between">
        <div className="text-body-sm font-medium text-ink">{title}</div>
        {available ? (
          <Badge tone="success">Đã tải lên</Badge>
        ) : (
          <Badge tone="error">Thiếu</Badge>
        )}
      </div>
      <div className="mt-2 grid h-32 place-items-center rounded-md bg-canvas-soft text-body-sm text-body">
        {available ? (
          <span className="inline-flex items-center gap-2">
            <Icon name="camera" size={16} /> Xem ảnh chứng từ (mock)
          </span>
        ) : (
          'Chưa có tài liệu'
        )}
      </div>
    </div>
  );
}
