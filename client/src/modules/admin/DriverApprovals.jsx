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
  approveAdminDriver,
  fetchAdminPendingDrivers,
  rejectAdminDriver,
} from '../../lib/api.js';

export default function AdminDriverApprovals() {
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
      const res = await fetchAdminPendingDrivers();
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
    return items.filter((d) => {
      const hay = `${d.fullName} ${d.phone} ${d.vehicleModel} ${d.licensePlate}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q]);

  const approve = async (userId) => {
    setActingId(userId);
    try {
      await approveAdminDriver(userId);
      setItems((cur) => cur.filter((d) => d.userId !== userId));
      setActive(null);
      pushToast({
        kind: 'success',
        title: 'Đã duyệt tài xế',
        message: 'Tài xế có thể bắt đầu nhận đơn trên portal.',
      });
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Duyệt thất bại',
        message: err.message || 'Không thể duyệt hồ sơ này.',
      });
    } finally {
      setActingId(null);
    }
  };

  const reject = async (userId) => {
    if (!rejectReason.trim()) return;
    setActingId(userId);
    try {
      await rejectAdminDriver(userId, rejectReason.trim());
      setItems((cur) => cur.filter((d) => d.userId !== userId));
      setActive(null);
      setRejectOpen(false);
      setRejectReason('');
      pushToast({
        kind: 'info',
        title: 'Đã từ chối',
        message: 'Tài xế sẽ nhận thông báo và email kèm lý do.',
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
          <h1 className="text-display-lg text-ink">Duyệt tài xế</h1>
          <p className="mt-xs text-body-sm text-body">
            Kiểm tra CCCD, bằng lái và ảnh chân dung trước khi cho phép nhận đơn.
          </p>
        </div>
        <Input
          className="w-full md:w-72"
          leadingIcon="search"
          placeholder="Tìm theo tên, điện thoại, biển số…"
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
          icon="bike"
          title="Không có hồ sơ chờ duyệt"
          message={q ? 'Thử đổi từ khóa tìm kiếm.' : 'Tất cả hồ sơ tài xế đã được xử lý.'}
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-hairline">
            {filtered.map((d) => {
              const missing = !d.docs.idCard || !d.docs.license || !d.docs.portrait;
              const busy = actingId === d.userId;
              const vehicleLabel = [d.vehicleModel, d.licensePlate].filter(Boolean).join(' · ');

              return (
                <li key={d.userId} className="grid grid-cols-1 items-center gap-sm p-base md:grid-cols-[1fr_auto_auto]">
                  <div className="flex items-center gap-sm">
                    <Avatar name={d.fullName} src={d.portraitUrl} />
                    <div className="min-w-0">
                      <div className="text-body-sm font-semibold text-ink truncate">{d.fullName}</div>
                      <div className="text-caption text-body truncate">
                        {d.phone || '—'} · {vehicleLabel || '—'}
                      </div>
                      <div className="text-caption text-body">{d.email}</div>
                      <div className="text-caption text-body">
                        Nộp {new Date(d.submittedAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:justify-center">
                    <Badge tone="warning">Chờ duyệt</Badge>
                    {missing && <Badge tone="warning">Thiếu giấy tờ</Badge>}
                  </div>
                  <div className="flex items-center gap-2 md:justify-end">
                    <Button variant="secondary" size="sm" onClick={() => setActive(d)} disabled={busy}>
                      Xem hồ sơ
                    </Button>
                    <Button size="sm" leadingIcon="check" onClick={() => approve(d.userId)} disabled={busy}>
                      {busy ? 'Đang xử lý…' : 'Duyệt'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.fullName || ''} size="lg">
        {active && (
          <div className="flex flex-col gap-base">
            <div className="grid grid-cols-1 gap-base md:grid-cols-2">
              <Row label="Email" value={active.email} />
              <Row label="Số điện thoại" value={active.phone || '—'} />
              <Row label="CCCD/CMND" value={active.nationalId || '—'} />
              <Row
                label="Phương tiện"
                value={`${active.vehicleModel || '—'} (${active.licensePlate || '—'})`}
              />
              <Row label="Thời điểm nộp" value={new Date(active.submittedAt).toLocaleString('vi-VN')} />
            </div>

            <div className="grid grid-cols-1 gap-base md:grid-cols-3">
              <DocBox title="CCCD/CMND" url={active.idCardUrl} />
              <DocBox title="Bằng lái" url={active.driverLicenseUrl} />
              <DocBox title="Ảnh chân dung" url={active.portraitUrl} />
            </div>

            <div className="flex flex-col gap-2 border-t border-hairline pt-base md:flex-row md:justify-end">
              <Button
                variant="secondary"
                leadingIcon="x"
                onClick={() => setRejectOpen(true)}
                disabled={actingId === active.userId}
              >
                Từ chối
              </Button>
              <Button
                leadingIcon="check"
                onClick={() => approve(active.userId)}
                disabled={actingId === active.userId}
              >
                {actingId === active.userId ? 'Đang xử lý…' : 'Duyệt tài xế'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Từ chối hồ sơ" size="sm">
        <div className="flex flex-col gap-sm">
          <Textarea
            rows={4}
            placeholder="Lý do từ chối — sẽ gửi cho tài xế qua thông báo và email"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => reject(active?.userId)}
              disabled={!rejectReason.trim() || actingId === active?.userId}
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

function DocBox({ title, url }) {
  return (
    <div className="rounded-md border border-hairline-strong p-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="text-body-sm font-medium text-ink">{title}</div>
        {url ? <Badge tone="success">Có</Badge> : <Badge tone="error">Thiếu</Badge>}
      </div>
      <div className="mt-2 overflow-hidden rounded-md bg-canvas-soft">
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="block">
            <img src={url} alt={title} className="h-28 w-full object-cover" />
            <div className="flex items-center justify-center gap-2 p-2 text-caption text-text-link">
              <Icon name="camera" size={14} /> Mở ảnh gốc
            </div>
          </a>
        ) : (
          <div className="grid h-28 place-items-center text-caption text-error">Chưa có</div>
        )}
      </div>
    </div>
  );
}
