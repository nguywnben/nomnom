import { useCallback, useEffect, useMemo, useState } from 'react';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Input from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Tabs from '../../components/Tabs.jsx';
import { Textarea } from '../../components/Input.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import {
  approveAdminRestaurant,
  approveAdminRestaurantAddressChangeRequest,
  fetchAdminRestaurantAddressChangeRequests,
  fetchAdminRestaurantDetail,
  fetchAdminPendingRestaurants,
  rejectAdminRestaurantAddressChangeRequest,
  rejectAdminRestaurant,
} from '../../lib/api.js';

export default function AdminRestaurantApprovals() {
  const { pushToast } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actingId, setActingId] = useState(null);
  const [approvalTab, setApprovalTab] = useState('restaurants');
  const [addressItems, setAddressItems] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressRejectOpen, setAddressRejectOpen] = useState(false);
  const [addressRejectReason, setAddressRejectReason] = useState('');
  const [selectedAddressRequest, setSelectedAddressRequest] = useState(null);

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

  const loadAddressItems = useCallback(async () => {
    setAddressLoading(true);
    try {
      const response = await fetchAdminRestaurantAddressChangeRequests();
      setAddressItems(response.items ?? []);
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không tải được yêu cầu đổi địa chỉ', message: err.message || 'Vui lòng thử lại sau.' });
    } finally {
      setAddressLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    if (approvalTab === 'addresses') loadAddressItems();
  }, [approvalTab, loadAddressItems]);

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

  const openProfile = async (restaurant) => {
    setActive(restaurant);
    setProfileLoading(true);
    try {
      const response = await fetchAdminRestaurantDetail(restaurant.id);
      setActive(response.restaurant);
    } catch (err) {
      setActive(null);
      pushToast({
        kind: 'error',
        title: 'Không tải được hồ sơ quán',
        message: err.message || 'Vui lòng thử lại sau.',
      });
    } finally {
      setProfileLoading(false);
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

  const approveAddressChange = async (requestId) => {
    setActingId(`address-${requestId}`);
    try {
      await approveAdminRestaurantAddressChangeRequest(requestId);
      setAddressItems((current) => current.filter((item) => item.id !== requestId));
      pushToast({ kind: 'success', title: 'Đã duyệt đổi địa chỉ', message: 'Địa chỉ quán đã được cập nhật và chủ quán đã nhận thông báo.' });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Duyệt thất bại', message: err.message || 'Không thể duyệt yêu cầu này.' });
    } finally {
      setActingId(null);
    }
  };

  const rejectAddressChange = async () => {
    if (!selectedAddressRequest || !addressRejectReason.trim()) return;
    setActingId(`address-${selectedAddressRequest.id}`);
    try {
      await rejectAdminRestaurantAddressChangeRequest(selectedAddressRequest.id, addressRejectReason.trim());
      setAddressItems((current) => current.filter((item) => item.id !== selectedAddressRequest.id));
      setAddressRejectOpen(false);
      setAddressRejectReason('');
      setSelectedAddressRequest(null);
      pushToast({ kind: 'info', title: 'Đã từ chối yêu cầu đổi địa chỉ', message: 'Lý do từ chối đã được gửi cho chủ quán.' });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Từ chối thất bại', message: err.message || 'Không thể từ chối yêu cầu này.' });
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

      <Tabs
        className="w-fit max-w-full"
        items={[
          { value: 'restaurants', label: 'Duyệt quán mới' },
          { value: 'addresses', label: 'Đổi địa chỉ' },
        ]}
        value={approvalTab}
        onChange={setApprovalTab}
      />

      {approvalTab === 'addresses' ? (
        addressLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : addressItems.length === 0 ? (
          <EmptyState icon="store" title="Không có yêu cầu đổi địa chỉ" message="Các yêu cầu đang chờ duyệt sẽ xuất hiện tại đây." />
        ) : (
          <Card padded={false} className="overflow-hidden">
            <ul className="divide-y divide-hairline">
              {addressItems.map((request) => {
                const busy = actingId === `address-${request.id}`;
                const oldAddress = Object.values(request.currentAddress).filter(Boolean).join(', ');
                const newAddress = Object.values(request.proposedAddress).filter(Boolean).join(', ');
                return (
                  <li key={request.id} className="grid gap-sm p-base md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <div className="text-body-sm font-semibold text-ink">{request.restaurantName}</div>
                      <div className="mt-1 text-caption text-body">Chủ quán: {request.ownerName || '—'} · Gửi {new Date(request.createdAt).toLocaleString('vi-VN')}</div>
                      <div className="mt-sm grid gap-xs text-body-sm md:grid-cols-2">
                        <div className="rounded-md bg-canvas-soft p-sm"><div className="text-caption-uppercase text-body">Địa chỉ đang dùng</div><div className="mt-1 text-ink">{oldAddress}</div></div>
                        <div className="rounded-md border border-primary/30 bg-primary/5 p-sm"><div className="text-caption-uppercase text-body">Địa chỉ đề xuất</div><div className="mt-1 text-ink">{newAddress}</div></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:justify-end">
                      <Button variant="secondary" size="sm" onClick={() => { setSelectedAddressRequest(request); setAddressRejectReason(''); setAddressRejectOpen(true); }} disabled={busy}>Từ chối</Button>
                      <Button size="sm" leadingIcon="check" onClick={() => approveAddressChange(request.id)} disabled={busy}>{busy ? 'Đang xử lý…' : 'Duyệt'}</Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )
      ) : loading ? (
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
                    <Button variant="secondary" size="sm" onClick={() => openProfile(r)} disabled={busy}>
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

      <Modal open={addressRejectOpen} onClose={() => setAddressRejectOpen(false)} title="Từ chối yêu cầu đổi địa chỉ" size="sm">
        <div className="flex flex-col gap-sm">
          <Textarea
            rows={4}
            label="Lý do từ chối"
            required
            placeholder="Nhập lý do từ chối để gửi cho chủ quán"
            value={addressRejectReason}
            onChange={(event) => setAddressRejectReason(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAddressRejectOpen(false)} disabled={Boolean(actingId)}>Hủy</Button>
            <Button onClick={rejectAddressChange} disabled={!addressRejectReason.trim() || Boolean(actingId)}>Xác nhận từ chối</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.name || ''} size="lg">
        {profileLoading ? (
          <div className="py-section text-center text-body-sm text-body">Đang tải hồ sơ quán...</div>
        ) : active && (
          <div className="flex flex-col gap-base">
            <div className="grid grid-cols-1 gap-base md:grid-cols-2">
              <Row label="Chủ quán" value={active.ownerName} />
              <Row label="Email" value={active.ownerEmail} />
              <Row label="Loại ẩm thực" value={active.cuisine || '—'} />
              <Row label="Số điện thoại" value={active.phone && active.phone !== 'null' ? active.phone : '—'} />
              <Row label="Slogan" value={active.tagline || '—'} />
              <Row
                label="Địa chỉ"
                value={[active.addressLine, active.ward, active.district, active.city].filter((x) => x && x !== 'null').join(', ') || '—'}
              />
              <Row label="Thời điểm nộp" value={new Date(active.submittedAt).toLocaleString('vi-VN')} />
            </div>

            <InfoBlock title="Giới thiệu quán" value={active.description || 'Chủ quán chưa cung cấp giới thiệu.'} />

            <div className="grid grid-cols-1 gap-base md:grid-cols-2">
              <Row label="Đơn tối thiểu" value={formatVnd(active.minOrderAmount)} />
              <Row label="Chuẩn bị trung bình" value={active.avgPrepTimeMin ? `${active.avgPrepTimeMin} phút` : '—'} />
            </div>

            {(active.latitude !== null && active.longitude !== null) && (
              <Row label="Tọa độ quán" value={`${active.latitude}, ${active.longitude}`} />
            )}

            <div className="grid grid-cols-1 gap-base md:grid-cols-2">
              <DocPreview title="Ảnh bìa quán" url={active.bannerUrl} />
              <DocPreview title="Giấy phép kinh doanh" url={active.businessLicenseUrl} />
              <DocPreview title="Chứng nhận VSATTP" url={active.foodSafetyCertUrl} optional />
            </div>

            <div className="border-t border-hairline pt-base">
              <div className="text-title-sm text-ink">Thông tin nhận tiền</div>
              <p className="mt-1 text-caption text-body">Chỉ hiển thị trong hồ sơ chi tiết để phục vụ việc duyệt và đối soát.</p>
              <div className="mt-sm grid grid-cols-1 gap-base md:grid-cols-3">
                <Row label="Ngân hàng" value={active.bankName || '—'} />
                <Row label="Số tài khoản" value={active.bankAccountNo || active.bankAccountMasked || '—'} />
                <Row label="Chủ tài khoản" value={active.bankAccountHolder || '—'} />
              </div>
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

function InfoBlock({ title, value }) {
  return (
    <div className="border-t border-hairline pt-base">
      <div className="text-caption-uppercase text-body">{title}</div>
      <p className="mt-1 whitespace-pre-wrap text-body-sm leading-relaxed text-ink">{value}</p>
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
