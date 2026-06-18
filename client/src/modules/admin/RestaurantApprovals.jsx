import { useCallback, useEffect, useMemo, useState } from 'react';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Input from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import { Textarea } from '../../components/Input.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useApp } from '../../context/AppContext.jsx';
import {
  approveAdminRestaurant,
  fetchAdminPendingRestaurants,
  rejectAdminRestaurant,
} from '../../lib/api.js';

export default function AdminRestaurantApprovals() {
  const { pushToast } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actingId, setActingId] = useState(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminPendingRestaurants();
      setItems(res.items ?? []);
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không tải được danh sách',
        message: err.message || 'Vui lòng thử lại sau.',
      });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((r) => {
      const hay = `${r.name} ${r.ownerName} ${r.city} ${r.cuisine ?? ''}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q]);

  const approve = async (id) => {
    setActingId(id);
    try {
      await approveAdminRestaurant(id);
      setItems((cur) => cur.filter((r) => r.id !== id));
      setActive(null);
      pushToast({
        kind: 'success',
        title: 'Đã duyệt quán',
        message: 'Quán đã chuyển sang trạng thái hoạt động và xuất hiện trong tìm kiếm.',
      });
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Duyệt thất bại',
        message: err.message || 'Không thể duyệt quán này.',
      });
    } finally {
      setActingId(null);
    }
  };

  const reject = async (id) => {
    if (!rejectReason.trim()) return;
    setActingId(id);
    try {
      await rejectAdminRestaurant(id, rejectReason.trim());
      setItems((cur) => cur.filter((r) => r.id !== id));
      setActive(null);
      setRejectOpen(false);
      setRejectReason('');
      pushToast({
        kind: 'info',
        title: 'Đã từ chối hồ sơ',
        message: 'Chủ quán sẽ nhận thông báo và email kèm lý do.',
      });
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Từ chối thất bại',
        message: err.message || 'Không thể từ chối hồ sơ này.',
      });
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Đối tác</div>
          <h1 className="text-display-lg text-ink">Duyệt quán mới</h1>
          <p className="mt-xs text-body-sm text-body">
            Kiểm tra giấy phép kinh doanh và chứng nhận VSATTP trước khi cho phép hoạt động.
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

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="store"
          title="Không có hồ sơ chờ duyệt"
          message={q ? 'Thử đổi từ khóa tìm kiếm.' : 'Tất cả hồ sơ quán đã được xử lý.'}
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-hairline">
            {filtered.map((r) => {
              const address = [r.addressLine, r.ward, r.district, r.city].filter(Boolean).join(', ');
              const missingFoodSafety = !r.foodSafetyCertUrl;
              const busy = actingId === r.id;

              return (
                <li key={r.id} className="grid grid-cols-1 items-center gap-sm p-base md:grid-cols-[1fr_auto_auto]">
                  <div className="flex items-center gap-sm">
                    <Avatar name={r.name} src={r.logoUrl} />
                    <div className="min-w-0">
                      <div className="text-body-sm font-semibold text-ink truncate">{r.name}</div>
                      <div className="text-caption text-body truncate">
                        {r.ownerName} · {r.cuisine || '—'} · {r.city}
                      </div>
                      <div className="text-caption text-body truncate">{address}</div>
                      <div className="text-caption text-body">
                        Nộp {new Date(r.submittedAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:justify-center">
                    <Badge tone="warning">Chờ duyệt</Badge>
                    {missingFoodSafety && <Badge tone="warning">Thiếu VSATTP</Badge>}
                  </div>
                  <div className="flex items-center gap-2 md:justify-end">
                    <Button variant="secondary" size="sm" onClick={() => setActive(r)} disabled={busy}>
                      Xem hồ sơ
                    </Button>
                    <Button size="sm" leadingIcon="check" onClick={() => approve(r.id)} disabled={busy}>
                      {busy ? 'Đang xử lý…' : 'Duyệt'}
                    </Button>
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
              <Row label="Chủ quán" value={active.ownerName} />
              <Row label="Email" value={active.ownerEmail} />
              <Row label="Loại ẩm thực" value={active.cuisine || '—'} />
              <Row label="Số điện thoại" value={active.phone || '—'} />
              <Row
                label="Địa chỉ"
                value={[active.addressLine, active.ward, active.district, active.city].filter(Boolean).join(', ')}
              />
              <Row label="Thời điểm nộp" value={new Date(active.submittedAt).toLocaleString('vi-VN')} />
            </div>

            <div className="grid grid-cols-1 gap-base md:grid-cols-2">
              <DocPreview title="Giấy phép kinh doanh" url={active.businessLicenseUrl} />
              <DocPreview title="Chứng nhận VSATTP" url={active.foodSafetyCertUrl} optional />
            </div>

            <div className="flex flex-col gap-2 border-t border-hairline pt-base md:flex-row md:justify-end">
              <Button
                variant="secondary"
                leadingIcon="x"
                onClick={() => setRejectOpen(true)}
                disabled={actingId === active.id}
              >
                Từ chối
              </Button>
              <Button
                leadingIcon="check"
                onClick={() => approve(active.id)}
                disabled={actingId === active.id}
              >
                {actingId === active.id ? 'Đang xử lý…' : 'Duyệt quán'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Từ chối hồ sơ" size="sm">
        <div className="flex flex-col gap-sm">
          <Textarea
            rows={4}
            placeholder="Nhập lý do từ chối — sẽ gửi cho chủ quán qua thông báo và email"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => reject(active?.id)}
              disabled={!rejectReason.trim() || actingId === active?.id}
            >
              Xác nhận từ chối
            </Button>
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

function DocPreview({ title, url, optional }) {
  return (
    <div className="rounded-md border border-hairline-strong p-sm">
      <div className="flex items-center justify-between">
        <div className="text-body-sm font-medium text-ink">{title}</div>
        {url ? (
          <Badge tone="success">Đã tải lên</Badge>
        ) : (
          <Badge tone={optional ? 'outline' : 'error'}>{optional ? 'Tùy chọn' : 'Thiếu'}</Badge>
        )}
      </div>
      <div className="mt-2 overflow-hidden rounded-md bg-canvas-soft">
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="block">
            <img src={url} alt={title} className="h-32 w-full object-cover" />
            <div className="flex items-center justify-center gap-2 p-2 text-caption text-text-link">
              <Icon name="camera" size={14} /> Mở ảnh gốc
            </div>
          </a>
        ) : (
          <div className="grid h-32 place-items-center text-body-sm text-body">Chưa có tài liệu</div>
        )}
      </div>
    </div>
  );
}
