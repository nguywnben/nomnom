import { useCallback, useEffect, useMemo, useState } from 'react';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import { Select, Textarea } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Tabs from '../../components/Tabs.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import TableSkeleton from '../../components/TableSkeleton.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { shouldLoadContentSection, shouldShowInitialLoader } from '../../lib/contentTabs.js';
import {
  approveAdminRestaurant,
  approveAdminRestaurantAddressChangeRequest,
  fetchAdminRestaurantAddressChangeRequests,
  fetchAdminRestaurantDetail,
  fetchAdminPendingRestaurants,
  fetchAdminRestaurantsApi,
  rejectAdminRestaurantAddressChangeRequest,
  rejectAdminRestaurant,
  updateAdminRestaurantStatusApi,
  fetchCuisinesApi,
} from '../../lib/api.js';

export default function AdminRestaurantApprovals() {
  const { pushToast } = useApp();

  // Tab State: 'pending' (Duyệt quán mới) | 'addresses' (Đổi địa chỉ) | 'all' (Tất cả quán ăn)
  const [activeTab, setActiveTab] = useState('pending');

  // Pending Onboarding State
  const [pendingItems, setPendingItems] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingLoaded, setPendingLoaded] = useState(false);
  const [qPending, setQPending] = useState('');

  // Address Change Requests State
  const [addressItems, setAddressItems] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressLoaded, setAddressLoaded] = useState(false);
  const [addressRejectOpen, setAddressRejectOpen] = useState(false);
  const [addressRejectReason, setAddressRejectReason] = useState('');
  const [selectedAddressRequest, setSelectedAddressRequest] = useState(null);

  // All Restaurants Directory State
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [allLoading, setAllLoading] = useState(false);
  const [loadedAllKey, setLoadedAllKey] = useState('');
  const [qAll, setQAll] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [cuisines, setCuisines] = useState([]);

  // Summary KPI State
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    active: 0,
    suspended: 0,
    closed: 0,
    pendingAddresses: 0,
  });

  // Modal / Action State
  const [active, setActive] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [unSuspendTarget, setUnSuspendTarget] = useState(null);
  const [addressApproveTarget, setAddressApproveTarget] = useState(null);
  const [actingId, setActingId] = useState(null);

  // Load Cuisines for Filter
  useEffect(() => {
    fetchCuisinesApi()
      .then((res) => setCuisines(res?.cuisines ?? []))
      .catch(() => setCuisines([]));
  }, []);

  // Load Pending Onboarding Restaurants
  const loadPendingItems = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await fetchAdminPendingRestaurants();
      setPendingItems(res.items ?? []);
      setPendingLoaded(true);
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không tải được danh sách chờ duyệt',
        message: err.message || 'Vui lòng thử lại sau.',
      });
    } finally {
      setPendingLoading(false);
    }
  }, [pushToast]);

  // Load Address Change Requests
  const loadAddressItems = useCallback(async () => {
    setAddressLoading(true);
    try {
      const response = await fetchAdminRestaurantAddressChangeRequests();
      setAddressItems(response.items ?? []);
      setAddressLoaded(true);
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không tải được yêu cầu đổi địa chỉ',
        message: err.message || 'Vui lòng thử lại sau.',
      });
    } finally {
      setAddressLoading(false);
    }
  }, [pushToast]);

  // Load All Platform Restaurants
  const loadAllRestaurants = useCallback(async () => {
    setAllLoading(true);
    try {
      const res = await fetchAdminRestaurantsApi({
        q: qAll,
        status: statusFilter,
        cuisineId: cuisineFilter,
        city: cityFilter,
      });
      setAllRestaurants(res.items ?? []);
      setLoadedAllKey(`${qAll}|${statusFilter}|${cuisineFilter}|${cityFilter}`);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không tải được danh sách quán',
        message: err.message || 'Vui lòng thử lại sau.',
      });
    } finally {
      setAllLoading(false);
    }
  }, [qAll, statusFilter, cuisineFilter, cityFilter, pushToast]);

  const allKey = `${qAll}|${statusFilter}|${cuisineFilter}|${cityFilter}`;

  // Reload data when active tab changes
  useEffect(() => {
    if (shouldLoadContentSection(activeTab, 'pending', pendingLoaded)) {
      loadPendingItems();
    } else if (shouldLoadContentSection(activeTab, 'addresses', addressLoaded)) {
      loadAddressItems();
    } else if (shouldLoadContentSection(activeTab, 'all', loadedAllKey === allKey)) {
      loadAllRestaurants();
    }
  }, [
    activeTab,
    addressLoaded,
    allKey,
    loadAddressItems,
    loadAllRestaurants,
    loadPendingItems,
    loadedAllKey,
    pendingLoaded,
  ]);

  // Initial load of summary data
  useEffect(() => {
    fetchAdminRestaurantsApi()
      .then((res) => {
        if (res.summary) setSummary(res.summary);
      })
      .catch(() => {});
  }, []);

  // Filtered Pending Items
  const filteredPending = useMemo(() => {
    const needle = qPending.trim().toLowerCase();
    if (!needle) return pendingItems;
    return pendingItems.filter((r) => {
      const hay = `${r.name} ${r.ownerName} ${r.city} ${r.cuisine ?? ''}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [pendingItems, qPending]);

  // Unique cities list for Filter
  const availableCities = useMemo(() => {
    const cities = new Set();
    allRestaurants.forEach((r) => {
      if (r.city) cities.add(r.city);
    });
    return Array.from(cities);
  }, [allRestaurants]);

  // Actions
  const approve = async (id) => {
    setActingId(id);
    try {
      await approveAdminRestaurant(id);
      setPendingItems((cur) => cur.filter((r) => r.id !== id));
      setApproveConfirmOpen(false);
      setActive(null);
      pushToast({
        kind: 'success',
        title: 'Đã duyệt quán',
        message: 'Quán đã chuyển sang trạng thái hoạt động và mở bán trên ứng dụng.',
      });
      const res = await fetchAdminRestaurantsApi();
      if (res.summary) setSummary(res.summary);
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
      setPendingItems((cur) => cur.filter((r) => r.id !== id));
      setActive(null);
      setRejectOpen(false);
      setRejectReason('');
      pushToast({
        kind: 'info',
        title: 'Đã từ chối hồ sơ',
        message: 'Chủ quán sẽ nhận thông báo và email kèm lý do.',
      });
      const res = await fetchAdminRestaurantsApi();
      if (res.summary) setSummary(res.summary);
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

  const confirmApproveAddressChange = async () => {
    if (!addressApproveTarget) return;
    const requestId = addressApproveTarget.id;
    setActingId(`address-${requestId}`);
    try {
      await approveAdminRestaurantAddressChangeRequest(requestId);
      setAddressItems((current) => current.filter((item) => item.id !== requestId));
      setAddressApproveTarget(null);
      pushToast({
        kind: 'success',
        title: 'Đã duyệt đổi địa chỉ',
        message: 'Địa chỉ quán đã được cập nhật thành công.',
      });
      const res = await fetchAdminRestaurantsApi();
      if (res.summary) setSummary(res.summary);
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Duyệt thất bại',
        message: err.message || 'Không thể duyệt yêu cầu này.',
      });
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
      pushToast({
        kind: 'info',
        title: 'Đã từ chối yêu cầu đổi địa chỉ',
        message: 'Lý do từ chối đã được gửi cho chủ quán.',
      });
      const res = await fetchAdminRestaurantsApi();
      if (res.summary) setSummary(res.summary);
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Từ chối thất bại',
        message: err.message || 'Không thể từ chối yêu cầu này.',
      });
    } finally {
      setActingId(null);
    }
  };

  const handleToggleSuspend = (restaurant, newStatus) => {
    if (newStatus === 'suspended') {
      setSuspendTarget(restaurant);
      setSuspendReason('');
      setSuspendModalOpen(true);
    } else {
      setUnSuspendTarget(restaurant);
    }
  };

  const confirmUnsuspend = async () => {
    if (!unSuspendTarget) return;
    setActingId(unSuspendTarget.id);
    try {
      await updateAdminRestaurantStatusApi(unSuspendTarget.id, { status: 'active' });
      pushToast({
        kind: 'success',
        title: 'Đã mở khóa quán',
        message: `Quán "${unSuspendTarget.name}" đã được mở khóa và có thể tiếp tục hoạt động.`,
      });
      if (active && active.id === unSuspendTarget.id) {
        setActive((cur) => ({ ...cur, status: 'active', rejectionReason: null }));
      }
      setUnSuspendTarget(null);
      await loadAllRestaurants();
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không thể mở khóa quán',
        message: err.message || 'Vui lòng thử lại sau.',
      });
    } finally {
      setActingId(null);
    }
  };

  const confirmSuspend = async () => {
    if (!suspendTarget || !suspendReason.trim()) return;
    setActingId(suspendTarget.id);
    try {
      await updateAdminRestaurantStatusApi(suspendTarget.id, {
        status: 'suspended',
        reason: suspendReason.trim(),
      });
      pushToast({
        kind: 'warning',
        title: 'Đã tạm khóa quán',
        message: `Quán "${suspendTarget.name}" đã bị tạm khóa và nhận được thông báo giải trình.`,
      });
      setSuspendModalOpen(false);
      setSuspendTarget(null);
      setSuspendReason('');
      if (active && active.id === suspendTarget.id) {
        setActive((cur) => ({ ...cur, status: 'suspended', rejectionReason: suspendReason.trim() }));
      }
      await loadAllRestaurants();
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không thể tạm khóa quán',
        message: err.message || 'Vui lòng thử lại sau.',
      });
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-base">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Đối tác</div>
          <h1 className="text-display-lg text-ink">Quán ăn & Đối tác</h1>
          <p className="mt-xs text-body-sm text-body">
            Kiểm duyệt hồ sơ pháp lý, phê duyệt đổi địa chỉ và giám sát vận hành danh mục quán ăn toàn sàn.
          </p>
        </div>

        {/* Summary Badges */}
        <div className="flex flex-wrap items-center gap-xs">
          <Badge tone="outline">Tổng {summary.total} quán</Badge>
          <Badge tone="warning" dot>{summary.pending} chờ duyệt</Badge>
          {summary.pendingAddresses > 0 && (
            <Badge tone="preview" dot>{summary.pendingAddresses} đổi địa chỉ</Badge>
          )}
          <Badge tone="success" dot>{summary.active} hoạt động</Badge>
          {summary.suspended > 0 && (
            <Badge tone="error" dot>{summary.suspended} tạm khóa</Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        size="sm"
        className="w-fit max-w-full"
        items={[
          { value: 'pending', label: `Duyệt quán mới (${pendingItems.length || summary.pending})` },
          { value: 'addresses', label: `Đổi địa chỉ (${addressItems.length || summary.pendingAddresses})` },
          { value: 'all', label: `Tất cả quán ăn (${summary.total})` },
        ]}
        value={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: DUYỆT QUÁN MỚI */}
      {activeTab === 'pending' && (
        <div className="space-y-base">
          {/* Toolbar */}
          <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-80 shrink-0 h-9">
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-body"
              />
              <input
                value={qPending}
                onChange={(e) => setQPending(e.target.value)}
                placeholder="Tìm theo tên quán, chủ, thành phố…"
                aria-label="Tìm kiếm quán ăn chờ duyệt"
                className="h-full w-full rounded-md border border-hairline-strong bg-surface-card pl-9 pr-base text-body-sm text-ink outline-none placeholder:text-muted focus:border-ink transition-colors"
              />
            </div>
          </div>

          {shouldShowInitialLoader(pendingLoading, pendingItems) ? (
            <TableSkeleton rows={5} cols={4} />
          ) : filteredPending.length === 0 ? (
            <EmptyState
              icon="store"
              title="Không có hồ sơ chờ duyệt"
              message={qPending ? 'Thử đổi từ khóa tìm kiếm.' : 'Tất cả hồ sơ đăng ký quán mới đã được xử lý.'}
            />
          ) : (
            <Card padded={false} className="overflow-hidden">
              <ul className="divide-y divide-hairline">
                {filteredPending.map((r) => {
                  const address = [r.addressLine, r.ward, r.district, r.city].filter(Boolean).join(', ');
                  const missingFoodSafety = !r.foodSafetyCertUrl;
                  const busy = actingId === r.id;

                  return (
                    <li key={r.id} className="grid grid-cols-1 items-center gap-sm p-base md:grid-cols-[1fr_auto_auto]">
                      <div className="flex items-center gap-sm">
                        <Avatar name={r.name} src={r.logoUrl} size="lg" />
                        <div className="min-w-0">
                          <div className="text-body-sm font-semibold text-ink truncate">{r.name}</div>
                          <div className="text-caption text-body truncate">
                            Chủ quán: {r.ownerName} · {r.cuisine || '—'} · {r.city}
                          </div>
                          <div className="text-caption text-body truncate">{address}</div>
                          <div className="text-caption text-body">
                            Nộp {new Date(r.submittedAt).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:justify-center">
                        <Badge tone="warning" dot>Chờ duyệt</Badge>
                        {missingFoodSafety && <Badge tone="warning">Thiếu VSATTP</Badge>}
                      </div>
                      <div className="flex items-center gap-2 md:justify-end">
                        <Button size="sm" onClick={() => openProfile(r)} disabled={busy}>
                          Xem hồ sơ
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: ĐỔI ĐỊA CHỈ */}
      {activeTab === 'addresses' && (
        <div className="space-y-base">
          {shouldShowInitialLoader(addressLoading, addressItems) ? (
            <TableSkeleton rows={4} cols={4} />
          ) : addressItems.length === 0 ? (
            <EmptyState
              icon="store"
              title="Không có yêu cầu đổi địa chỉ"
              message="Tất cả các yêu cầu đổi địa chỉ quán ăn đã được xử lý."
            />
          ) : (
            <Card padded={false} className="overflow-hidden">
              <ul className="divide-y divide-hairline">
                {addressItems.map((request) => {
                  const busy = actingId === `address-${request.id}`;
                  const oldAddress = Object.values(request.currentAddress || {}).filter(Boolean).join(', ');
                  const newAddress = Object.values(request.proposedAddress || {}).filter(Boolean).join(', ');
                  return (
                    <li key={request.id} className="grid gap-sm p-base md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <div className="text-body-sm font-semibold text-ink">{request.restaurantName}</div>
                        <div className="mt-1 text-caption text-body">
                          Chủ quán: {request.ownerName || '—'} · Gửi {new Date(request.createdAt).toLocaleString('vi-VN')}
                        </div>
                        <div className="mt-sm grid gap-xs text-body-sm md:grid-cols-2">
                          <div className="rounded-md bg-canvas-soft p-sm">
                            <div className="text-caption-uppercase text-body">Địa chỉ đang dùng</div>
                            <div className="mt-1 text-ink">{oldAddress}</div>
                          </div>
                          <div className="rounded-md border border-primary/30 bg-primary/5 p-sm">
                            <div className="text-caption-uppercase text-body">Địa chỉ đề xuất</div>
                            <div className="mt-1 text-ink">{newAddress}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedAddressRequest(request);
                            setAddressRejectReason('');
                            setAddressRejectOpen(true);
                          }}
                          disabled={busy}
                        >
                          Từ chối
                        </Button>
                        <Button
                          size="sm"
                          leadingIcon="check"
                          onClick={() => setAddressApproveTarget(request)}
                          disabled={busy}
                        >
                          Duyệt
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: TẤT CẢ QUÁN ĂN */}
      {activeTab === 'all' && (
        <div className="space-y-base">
          {/* Advanced Toolbar */}
          <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-80 shrink-0 h-9">
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-body"
              />
              <input
                value={qAll}
                onChange={(e) => setQAll(e.target.value)}
                placeholder="Tìm tên quán, chủ quán, SĐT, thành phố…"
                aria-label="Tìm kiếm quán ăn toàn sàn"
                className="h-full w-full rounded-md border border-hairline-strong bg-surface-card pl-9 pr-base text-body-sm text-ink outline-none placeholder:text-muted focus:border-ink transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-xs">
              <Select
                aria-label="Lọc trạng thái"
                className="w-full sm:w-auto md:w-36"
                fieldClassName="!h-9 !px-sm text-caption"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Mọi trạng thái' },
                  { value: 'active', label: 'Đang hoạt động' },
                  { value: 'suspended', label: 'Đang tạm khóa' },
                  { value: 'pending', label: 'Chờ xét duyệt' },
                ]}
              />

              <Select
                aria-label="Lọc loại ẩm thực"
                className="w-full sm:w-auto md:w-40"
                fieldClassName="!h-9 !px-sm text-caption"
                value={cuisineFilter}
                onChange={(e) => setCuisineFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Mọi loại ẩm thực' },
                  ...cuisines.map((c) => ({ value: String(c.id), label: c.name })),
                ]}
              />

              {availableCities.length > 0 && (
                <Select
                  aria-label="Lọc thành phố"
                  className="w-full sm:w-auto md:w-36"
                  fieldClassName="!h-9 !px-sm text-caption"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'Mọi thành phố' },
                    ...availableCities.map((c) => ({ value: c, label: c })),
                  ]}
                />
              )}
            </div>
          </div>

          {/* Directory List */}
          {shouldShowInitialLoader(allLoading, allRestaurants) ? (
            <TableSkeleton rows={6} cols={4} />
          ) : allRestaurants.length === 0 ? (
            <EmptyState
              icon="store"
              title="Không tìm thấy quán ăn phù hợp"
              message="Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc."
            />
          ) : (
            <Card padded={false} className="overflow-hidden">
              <ul className="divide-y divide-hairline">
                {allRestaurants.map((r) => {
                  const address = [r.addressLine, r.ward, r.district, r.city].filter(Boolean).join(', ');
                  const busy = actingId === r.id;
                  const isSuspended = r.status === 'suspended';
                  const isActive = r.status === 'active';
                  const isPending = r.status === 'pending';

                  return (
                    <li key={r.id} className="grid grid-cols-1 items-center gap-sm p-base md:grid-cols-[1fr_auto_auto]">
                      <div className="flex items-center gap-sm">
                        <Avatar name={r.name} src={r.logoUrl} size="lg" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-body-sm font-semibold text-ink truncate">{r.name}</span>
                            {r.ratingAvg > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-caption font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                <Icon name="starFilled" size={12} className="text-amber-500" />
                                {Number(r.ratingAvg).toFixed(1)} ({r.reviewCount})
                              </span>
                            )}
                          </div>
                          <div className="text-caption text-body truncate">
                            Chủ quán: {r.ownerName} · {r.phone && r.phone !== 'null' ? r.phone : r.ownerEmail} · {r.cuisine || '—'}
                          </div>
                          <div className="text-caption text-body truncate">{address}</div>
                        </div>
                      </div>

                      {/* Statuses */}
                      <div className="flex flex-wrap items-center gap-1.5 md:justify-center">
                        {isActive && <Badge tone="success" dot>Hoạt động</Badge>}
                        {isSuspended && <Badge tone="error" dot>Tạm khóa</Badge>}
                        {isPending && <Badge tone="warning" dot>Chờ duyệt</Badge>}
                        {isActive && (
                          <Badge tone={r.isOpenNow ? 'preview' : 'outline'}>
                            {r.isOpenNow ? 'Đang mở cửa' : 'Đang đóng cửa'}
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 md:justify-end">
                        <Button variant="secondary" size="sm" onClick={() => openProfile(r)} disabled={busy}>
                          Xem hồ sơ
                        </Button>

                        {isActive && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="!text-error hover:!bg-error/10"
                            onClick={() => handleToggleSuspend(r, 'suspended')}
                            disabled={busy}
                          >
                            Tạm khóa
                          </Button>
                        )}

                        {isSuspended && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="!text-success hover:!bg-success/10"
                            onClick={() => handleToggleSuspend(r, 'active')}
                            disabled={busy}
                          >
                            Mở khóa
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* MODAL: TỪ CHỐI ĐỔI ĐỊA CHỈ */}
      <Modal open={addressRejectOpen} onClose={() => setAddressRejectOpen(false)} title="Từ chối yêu cầu đổi địa chỉ" size="sm">
        <div className="flex flex-col gap-sm">
          <Textarea
            rows={4}
            label="Lý do từ chối"
            required
            placeholder="Nhập lý do từ chối để gửi thông báo cho chủ quán..."
            value={addressRejectReason}
            onChange={(event) => setAddressRejectReason(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAddressRejectOpen(false)} disabled={Boolean(actingId)}>Hủy</Button>
            <Button onClick={rejectAddressChange} disabled={!addressRejectReason.trim() || Boolean(actingId)}>Xác nhận từ chối</Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: TẠM KHÓA QUÁN ĂN */}
      <Modal open={suspendModalOpen} onClose={() => setSuspendModalOpen(false)} title={`Tạm khóa quán ${suspendTarget?.name}`} size="sm">
        <div className="flex flex-col gap-sm">
          <p className="text-body-sm text-body">
            Quán ăn sẽ bị ẩn khỏi tìm kiếm và không thể nhận đơn hàng mới cho đến khi được mở khóa lại.
          </p>
          <Textarea
            rows={4}
            label="Lý do tạm khóa"
            required
            placeholder="Nhập lý do vi phạm hoặc tạm đình chỉ hoạt động..."
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSuspendModalOpen(false)} disabled={Boolean(actingId)}>Hủy</Button>
            <Button variant="danger" onClick={confirmSuspend} disabled={!suspendReason.trim() || Boolean(actingId)}>
              Xác nhận tạm khóa
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: CHI TIẾT HỒ SƠ QUÁN */}
      <Modal open={Boolean(active)} onClose={() => setActive(null)} title={active?.name || ''} size="lg">
        {profileLoading ? (
          <div className="py-section text-center text-body-sm text-body">Đang tải hồ sơ quán...</div>
        ) : active && (
          <div className="flex flex-col gap-base">
            <div className="flex items-center justify-between border-b border-hairline pb-sm">
              <div className="flex items-center gap-sm">
                <Avatar name={active.name} src={active.logoUrl} size="lg" />
                <div>
                  <h3 className="text-title-md font-bold text-ink">{active.name}</h3>
                  <div className="text-caption text-body">
                    Mã quán #{active.id} · {active.cuisine || 'Chưa phân loại'} · {active.city}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-xs">
                {active.status === 'active' && <Badge tone="success" dot>Đang hoạt động</Badge>}
                {active.status === 'suspended' && <Badge tone="error" dot>Tạm khóa</Badge>}
                {active.status === 'pending' && <Badge tone="warning" dot>Chờ xét duyệt</Badge>}
              </div>
            </div>

            {active.rejectionReason && (
              <div className="rounded-md border border-error/30 bg-error/5 p-sm text-body-sm text-error">
                <div className="font-semibold">Lý do từ chối / Tạm khóa:</div>
                <div className="mt-0.5">{active.rejectionReason}</div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-base md:grid-cols-2">
              <Row label="Chủ quán" value={active.ownerName} />
              <Row label="Email chủ quán" value={active.ownerEmail} />
              <Row label="Loại ẩm thực" value={active.cuisine || '—'} />
              <Row label="Số điện thoại" value={active.phone && active.phone !== 'null' ? active.phone : '—'} />
              <Row label="Slogan" value={active.tagline || '—'} />
              <Row
                label="Địa chỉ"
                value={[active.addressLine, active.ward, active.district, active.city].filter((x) => x && x !== 'null').join(', ') || '—'}
              />
              <Row label="Thời điểm nộp" value={active.submittedAt ? new Date(active.submittedAt).toLocaleString('vi-VN') : '—'} />
              <Row label="Thời điểm duyệt" value={active.approvedAt ? new Date(active.approvedAt).toLocaleString('vi-VN') : 'Chưa duyệt'} />
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
              <div className="text-title-sm text-ink">Thông tin nhận tiền (Tài khoản ngân hàng)</div>
              <p className="mt-1 text-caption text-body">Phục vụ việc đối soát và chuyển tiền doanh thu cho quán.</p>
              <div className="mt-sm grid grid-cols-1 gap-base md:grid-cols-3">
                <Row label="Ngân hàng" value={active.bankName || '—'} />
                <Row label="Số tài khoản" value={active.bankAccountNo || active.bankAccountMasked || '—'} />
                <Row label="Chủ tài khoản" value={active.bankAccountHolder || '—'} />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col gap-2 border-t border-hairline pt-base md:flex-row md:justify-end">
              {active.status === 'pending' && (
                <>
                  <Button
                    variant="secondary"
                    leadingIcon="x"
                    onClick={() => setRejectOpen(true)}
                    disabled={actingId === active.id}
                  >
                    Từ chối hồ sơ
                  </Button>
                  <Button
                    leadingIcon="check"
                    onClick={() => setApproveConfirmOpen(true)}
                    disabled={actingId === active.id}
                  >
                    Duyệt quán
                  </Button>
                </>
              )}

              {active.status === 'active' && (
                <Button
                  variant="secondary"
                  className="!text-error hover:!bg-error/10"
                  onClick={() => handleToggleSuspend(active, 'suspended')}
                  disabled={actingId === active.id}
                >
                  Tạm khóa quán này
                </Button>
              )}

              {active.status === 'suspended' && (
                <Button
                  leadingIcon="check"
                  onClick={() => handleToggleSuspend(active, 'active')}
                  disabled={actingId === active.id}
                >
                  Mở khóa quán này
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: XÁC NHẬN DUYỆT QUÁN ĂN */}
      <Modal
        open={approveConfirmOpen}
        onClose={() => setApproveConfirmOpen(false)}
        title={`Xác nhận duyệt quán ${active?.name || ''}`}
        size="sm"
      >
        <div className="flex flex-col gap-base">
          <p className="text-body-sm text-body leading-relaxed">
            Bạn có chắc chắn muốn phê duyệt cho quán <span className="font-semibold text-ink">{active?.name}</span> không?
            Quán sẽ được cấp quyền kinh doanh, chuyển sang trạng thái hoạt động và bắt đầu hiển thị trên ứng dụng NomNom.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setApproveConfirmOpen(false)}
              disabled={actingId === active?.id}
            >
              Hủy
            </Button>
            <Button
              leadingIcon="check"
              onClick={() => approve(active?.id)}
              disabled={actingId === active?.id}
            >
              {actingId === active?.id ? 'Đang xử lý…' : 'Xác nhận duyệt'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: TỪ CHỐI HỒ SƠ ONBOARDING */}
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Từ chối hồ sơ đăng ký" size="sm">
        <div className="flex flex-col gap-sm">
          <Textarea
            rows={4}
            label="Lý do từ chối"
            required
            placeholder="Nhập lý do từ chối — sẽ gửi cho chủ quán qua thông báo và email..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={() => reject(active?.id)}
              disabled={!rejectReason.trim() || actingId === active?.id}
            >
              Xác nhận từ chối
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: XÁC NHẬN MỞ KHÓA QUÁN ĂN */}
      <Modal
        open={Boolean(unSuspendTarget)}
        onClose={() => setUnSuspendTarget(null)}
        title={`Mở khóa quán ${unSuspendTarget?.name || ''}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setUnSuspendTarget(null)} disabled={Boolean(actingId)}>
              Hủy
            </Button>
            <Button
              leadingIcon="check"
              onClick={confirmUnsuspend}
              loading={Boolean(actingId)}
              disabled={Boolean(actingId)}
            >
              {actingId ? 'Đang mở khóa…' : 'Xác nhận mở khóa'}
            </Button>
          </div>
        }
      >
        <div className="space-y-base">
          <p className="text-body-sm text-body leading-relaxed">
            Bạn có chắc chắn muốn mở khóa cho quán <strong className="text-ink">{unSuspendTarget?.name}</strong> hoạt động trở lại không?
          </p>
          <div className="rounded-md border border-primary/20 bg-primary/5 p-sm text-body-sm text-ink">
            Quán ăn sẽ xuất hiện trở lại trên thanh tìm kiếm và được phép mở cửa nhận đơn hàng bình thường.
          </div>
        </div>
      </Modal>

      {/* MODAL: XÁC NHẬN DUYỆT ĐỔI ĐỊA CHỈ */}
      <Modal
        open={Boolean(addressApproveTarget)}
        onClose={() => setAddressApproveTarget(null)}
        title="Xác nhận duyệt đổi địa chỉ"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAddressApproveTarget(null)} disabled={Boolean(actingId)}>
              Hủy
            </Button>
            <Button
              leadingIcon="check"
              onClick={confirmApproveAddressChange}
              loading={Boolean(actingId)}
              disabled={Boolean(actingId)}
            >
              {actingId ? 'Đang cập nhật…' : 'Xác nhận duyệt'}
            </Button>
          </div>
        }
      >
        <div className="space-y-base">
          <p className="text-body-sm text-body leading-relaxed">
            Duyệt yêu cầu đổi địa chỉ của quán <strong className="text-ink">{addressApproveTarget?.name}</strong> sang địa chỉ mới:
          </p>
          <div className="rounded-md border border-hairline-strong bg-canvas-soft p-sm text-body-sm font-medium text-ink">
            {addressApproveTarget?.newAddress}
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
      <div className="text-body-sm text-ink font-medium">{value}</div>
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
