import { useEffect, useState, useCallback } from 'react';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Input, { Select, Textarea } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import Tabs from '../../components/Tabs.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import TableSkeleton from '../../components/TableSkeleton.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { downloadCsv } from '../../lib/csv.js';
import { shouldShowInitialLoader } from '../../lib/contentTabs.js';
import {
  queryAdminUsers,
  fetchAdminUserDetailApi,
  updateAdminUserStatus,
  resetAdminUserPassword,
} from '../../lib/api.js';

const STATUS_TONE = {
  active: 'success',
  suspended: 'warning',
  banned: 'error',
};

const STATUS_LABEL = {
  active: 'Hoạt động',
  suspended: 'Đình chỉ',
  banned: 'Đã khóa',
};

const ROLE_LABEL = {
  customer: 'Khách hàng',
  merchant: 'Quán ăn',
  admin: 'Quản trị viên',
};

const ROLE_TONE = {
  customer: 'outline',
  merchant: 'preview',
  admin: 'dark',
};

const SUSPENSION_PRESET_REASONS = [
  'Gian lận khuyến mãi / lạm dụng voucher',
  'Spam đơn hàng / đánh giá tiêu cực bất thường',
  'Vi phạm tiêu chuẩn cộng đồng và quy tắc ứng xử',
  'Bị báo cáo nhiều lần bởi khách hàng hoặc quán ăn',
  'Tạm ngưng để xác minh thông tin và hoạt động tài khoản',
];

const BAN_PRESET_REASONS = [
  'Gian lận thanh toán hoặc chiếm đoạt tài sản',
  'Tạo tài khoản giả mạo / phát tán nội dung độc hại',
  'Vi phạm nghiêm trọng chính sách và điều khoản dịch vụ',
  'Theo yêu cầu của cơ quan chức năng / pháp luật',
  'Hành vi phá hoại hệ thống hoặc gian lận có tổ chức',
];

const PAGE_SIZE = 12;

export default function AdminAccounts() {
  const { pushToast, user: currentAdmin } = useApp();
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Summary State from Backend
  const [summary, setSummary] = useState({
    total: 0,
    customers: 0,
    merchants: 0,
    admins: 0,
    active: 0,
    suspended: 0,
    banned: 0,
  });

  // Modal: Suspension State
  const [suspensionTarget, setSuspensionTarget] = useState(null);
  const [suspensionDays, setSuspensionDays] = useState('7');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionError, setSuspensionError] = useState('');
  const [suspending, setSuspending] = useState(false);

  // Modal: Ban / Lock State
  const [banTarget, setBanTarget] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banError, setBanError] = useState('');
  const [banning, setBanning] = useState(false);

  // Modal: Reset Password State
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  // Modal: Activate Confirmation State
  const [activateTarget, setActivateTarget] = useState(null);
  const [activating, setActivating] = useState(false);

  // Modal: Detail Profile State
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Debounced search query
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setQuery(searchText);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchText]);

  // Load Accounts List
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await queryAdminUsers({ role, status, q: query, page, limit: PAGE_SIZE });
      setUsers(data.items ?? []);
      setTotal(data.total ?? 0);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Lấy danh sách thất bại',
        message: err.message ?? 'Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  }, [role, status, query, page, pushToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filter setters
  const setRoleAndReset = (value) => {
    setRole(value);
    setPage(1);
  };

  const setStatusAndReset = (value) => {
    setStatus(value);
    setPage(1);
  };

  // Open Detail Modal
  const openDetailModal = async (account) => {
    setSelectedAccount(account);
    setDetailLoading(true);
    try {
      const response = await fetchAdminUserDetailApi(account.id);
      setSelectedAccount(response.account);
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không thể tải chi tiết',
        message: err.message || 'Vui lòng thử lại.',
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Reset Password Modal
  const openResetModal = (account) => {
    setResetTarget(account);
    setResetPasswordValue('');
    setResetError('');
  };

  const closeResetModal = () => {
    setResetTarget(null);
    setResetPasswordValue('');
    setResetError('');
  };

  const handleConfirmResetPassword = async () => {
    if (!resetTarget) return;
    setResetting(true);
    setResetError('');
    try {
      const result = await resetAdminUserPassword(resetTarget.id, resetPasswordValue.trim() || undefined);
      pushToast({
        kind: 'success',
        title: 'Đặt lại mật khẩu thành công',
        message: result.newPassword
          ? `Mật khẩu mới cho ${resetTarget.fullName}: ${result.newPassword}`
          : `Mật khẩu của ${resetTarget.fullName} đã được cập nhật.`,
      });
      closeResetModal();
    } catch (err) {
      setResetError(err.message ?? 'Vui lòng thử lại.');
    } finally {
      setResetting(false);
    }
  };

  // Open Suspension Modal
  const openSuspendModal = (account) => {
    setSuspensionTarget(account);
    setSuspensionDays('7');
    setSuspensionReason('');
    setSuspensionError('');
  };

  const closeSuspensionModal = () => {
    setSuspensionTarget(null);
    setSuspensionDays('7');
    setSuspensionReason('');
    setSuspensionError('');
  };

  const handleConfirmSuspend = async () => {
    if (!suspensionTarget) return;

    const days = Number(suspensionDays.trim());
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      setSuspensionError('Số ngày phải là số nguyên từ 1 đến 365.');
      return;
    }

    if (!suspensionReason.trim()) {
      setSuspensionError('Vui lòng nhập lý do đình chỉ.');
      return;
    }

    setSuspending(true);
    try {
      const result = await updateAdminUserStatus(
        suspensionTarget.id,
        'suspended',
        days,
        suspensionReason.trim(),
      );
      setUsers((cur) =>
        cur.map((u) =>
          u.id === suspensionTarget.id
            ? {
                ...u,
                status: 'suspended',
                suspensionExpiresAt: result.suspensionExpiresAt,
                suspensionReason: result.suspensionReason,
              }
            : u,
        ),
      );
      if (selectedAccount && selectedAccount.id === suspensionTarget.id) {
        setSelectedAccount((cur) => ({
          ...cur,
          status: 'suspended',
          suspensionExpiresAt: result.suspensionExpiresAt,
          suspensionReason: result.suspensionReason,
        }));
      }
      pushToast({
        kind: 'warning',
        title: 'Đã đình chỉ tài khoản',
        message: `${suspensionTarget.fullName} đã bị đình chỉ trong ${days} ngày.`,
      });
      closeSuspensionModal();
      loadUsers();
    } catch (err) {
      setSuspensionError(err.message ?? 'Vui lòng thử lại.');
    } finally {
      setSuspending(false);
    }
  };

  // Open Ban Confirmation Modal
  const openBanModal = (account) => {
    setBanTarget(account);
    setBanReason('');
    setBanError('');
  };

  const closeBanModal = () => {
    setBanTarget(null);
    setBanReason('');
    setBanError('');
  };

  const handleConfirmBan = async () => {
    if (!banTarget) return;

    if (!banReason.trim()) {
      setBanError('Vui lòng chọn hoặc nhập lý do khóa tài khoản.');
      return;
    }

    setBanning(true);
    setBanError('');
    try {
      await updateAdminUserStatus(banTarget.id, 'banned', null, banReason.trim());
      setUsers((cur) =>
        cur.map((u) =>
          u.id === banTarget.id
            ? { ...u, status: 'banned', suspensionExpiresAt: null, suspensionReason: banReason.trim() }
            : u,
        ),
      );
      if (selectedAccount && selectedAccount.id === banTarget.id) {
        setSelectedAccount((cur) => ({
          ...cur,
          status: 'banned',
          suspensionExpiresAt: null,
          suspensionReason: banReason.trim(),
        }));
      }
      pushToast({
        kind: 'error',
        title: 'Đã khóa tài khoản',
        message: `Tài khoản ${banTarget.fullName} đã bị khóa quyền truy cập.`,
      });
      closeBanModal();
      loadUsers();
    } catch (err) {
      setBanError(err.message ?? 'Vui lòng thử lại.');
    } finally {
      setBanning(false);
    }
  };

  // Handle Activate Confirmation
  const handleConfirmActivate = async () => {
    if (!activateTarget) return;
    setActivating(true);
    try {
      await updateAdminUserStatus(activateTarget.id, 'active');
      setUsers((cur) =>
        cur.map((u) =>
          u.id === activateTarget.id
            ? { ...u, status: 'active', suspensionExpiresAt: null, suspensionReason: null }
            : u,
        ),
      );
      if (selectedAccount && selectedAccount.id === activateTarget.id) {
        setSelectedAccount((cur) => ({ ...cur, status: 'active', suspensionExpiresAt: null, suspensionReason: null }));
      }
      pushToast({
        kind: 'success',
        title: 'Kích hoạt tài khoản thành công',
        message: `Tài khoản ${activateTarget.fullName} đã hoạt động trở lại.`,
      });
      setActivateTarget(null);
      loadUsers();
    } catch (err) {
      pushToast({ kind: 'error', title: 'Kích hoạt thất bại', message: err.message ?? 'Vui lòng thử lại.' });
    } finally {
      setActivating(false);
    }
  };

  // Export CSV Handler
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const data = await queryAdminUsers({ role, status, q: query, export: 1 });
      const items = data.items || [];
      if (!items.length) {
        pushToast({ kind: 'info', title: 'Không có dữ liệu', message: 'Không có tài khoản nào để xuất CSV.' });
        return;
      }
      const csvRows = items.map((u) => ({
        'ID': u.id,
        'Họ và tên': u.fullName,
        'Email': u.email,
        'Số điện thoại': u.phone && u.phone !== 'null' ? u.phone : 'Chưa cập nhật',
        'Vai trò': (u.roles || []).map((r) => ROLE_LABEL[r] || r).join(', '),
        'Trạng thái': STATUS_LABEL[u.status] || u.status,
        'Thời hạn đình chỉ': u.suspensionExpiresAt ? new Date(u.suspensionExpiresAt).toLocaleDateString('vi-VN') : '',
        'Lý do đình chỉ / khóa': u.suspensionReason || '',
        'Ngày tham gia': u.joinedAt ? new Date(u.joinedAt).toLocaleDateString('vi-VN') : '',
        'Đăng nhập gần nhất': u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('vi-VN') : '',
      }));
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadCsv(`Danh_sach_tai_khoan_NomNom_${dateStr}.csv`, csvRows);
      pushToast({ kind: 'success', title: 'Xuất CSV thành công', message: `Đã xuất ${items.length} tài khoản.` });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Xuất CSV thất bại', message: err.message || 'Vui lòng thử lại.' });
    } finally {
      setExporting(false);
    }
  };

  const effectivePage = Math.min(page, Math.max(1, Math.ceil((total || 0) / PAGE_SIZE)));
  const isProtectedAdmin = (acc) => acc?.roles?.includes('admin');
  const isSelf = (acc) => currentAdmin?.id !== undefined && acc?.id === currentAdmin?.id;

  return (
    <div className="space-y-base">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Hệ thống</div>
          <h1 className="text-display-lg text-ink">Quản lý Tài khoản</h1>
          <p className="mt-xs text-body-sm text-body">
            Theo dõi, phân quyền, đặt lại mật khẩu và xử lý vi phạm tài khoản người dùng toàn sàn.
          </p>
        </div>

        {/* Global Summary Badges - Minimal & Clean */}
        <div className="flex flex-wrap items-center gap-xs">
          <Badge tone="outline">Tổng {summary.total} tài khoản</Badge>
          {summary.suspended > 0 && (
            <Badge tone="warning" dot>{summary.suspended} đình chỉ</Badge>
          )}
          {summary.banned > 0 && (
            <Badge tone="error" dot>{summary.banned} đã khóa</Badge>
          )}
        </div>
      </div>

      {/* Filters & Actions Toolbar (Nằm ngoài table giống /admin/orders) */}
      <div className="space-y-sm">
        {/* Row 1: Role Tabs + CSV Export Button */}
        <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
          <Tabs
            size="sm"
            className="w-fit max-w-full"
            items={[
              { value: 'all', label: `Tất cả (${summary.total})` },
              { value: 'merchant', label: `Quán ăn (${summary.merchants})` },
              { value: 'customer', label: `Khách hàng (${summary.customers})` },
              { value: 'admin', label: `Admin (${summary.admins})` },
            ]}
            value={role}
            onChange={setRoleAndReset}
          />

          <Button
            variant="secondary"
            size="sm"
            leadingIcon="download"
            onClick={handleExportCsv}
            loading={exporting}
            disabled={total === 0 || exporting}
          >
            {exporting ? 'Đang xuất…' : 'Xuất CSV'}
          </Button>
        </div>

        {/* Row 2: Search Input (trái) + Status Select (phải) */}
        <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-80 shrink-0 h-9">
            <Icon
              name="search"
              size={16}
              className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-body"
            />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm theo tên, email, SĐT..."
              aria-label="Tìm kiếm tài khoản"
              className="h-full w-full rounded-md border border-hairline-strong bg-surface-card pl-9 pr-base text-body-sm text-ink outline-none placeholder:text-muted focus:border-ink transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-xs">
            <Select
              aria-label="Lọc trạng thái"
              className="w-full sm:w-auto md:w-44"
              fieldClassName="!h-9 !px-sm text-caption"
              value={status}
              onChange={(e) => setStatusAndReset(e.target.value)}
              options={[
                { value: 'all', label: 'Mọi trạng thái' },
                { value: 'active', label: 'Đang hoạt động' },
                { value: 'suspended', label: 'Bị đình chỉ' },
                { value: 'banned', label: 'Đã bị khóa' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table / Content View */}
      {shouldShowInitialLoader(loading, users) ? (
        <TableSkeleton rows={6} cols={5} />
      ) : users.length === 0 ? (
        <EmptyState
          icon="user"
          title="Không tìm thấy tài khoản phù hợp"
          message={searchText ? 'Thử đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc.' : 'Chưa có tài khoản nào thuộc nhóm này.'}
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          {/* Mobile Cards */}
          <ul className="flex flex-col divide-y divide-hairline md:hidden">
            {users.map((a) => (
              <li
                key={a.id}
                onClick={() => openDetailModal(a)}
                className="p-base cursor-pointer hover:bg-canvas-soft transition-colors"
              >
                <div className="flex items-center justify-between gap-sm">
                  <div className="flex items-center gap-sm min-w-0">
                    <Avatar src={a.avatarUrl} name={a.fullName} size="md" />
                    <div className="min-w-0">
                      <div className="text-body-sm font-semibold text-ink truncate">{a.fullName}</div>
                      <div className="text-caption text-body truncate">{a.email}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <RoleBadge account={a} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge tone={STATUS_TONE[a.status]} dot upper={false}>
                      {STATUS_LABEL[a.status] || a.status}
                    </Badge>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailModal(a);
                      }}
                    >
                      Chi tiết
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop Table - Minimalist & Clean */}
          <table className="hidden w-full md:table">
            <thead className="bg-canvas-soft text-caption-uppercase text-body">
              <tr>
                <Th>Tài khoản</Th>
                <Th>Vai trò</Th>
                <Th>Trạng thái</Th>
                <Th className="text-right pr-base">Thao tác</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {users.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => openDetailModal(a)}
                  className="hover:bg-canvas-soft/80 transition-colors cursor-pointer group"
                >
                  <Td>
                    <div className="flex items-center gap-sm">
                      <Avatar src={a.avatarUrl} name={a.fullName} size="sm" />
                      <div className="min-w-0">
                        <div className="text-body-sm font-semibold text-ink group-hover:text-primary transition-colors">
                          {a.fullName}
                        </div>
                        <div className="text-caption text-body">{a.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <RoleBadge account={a} />
                  </Td>
                  <Td>
                    <div className="flex flex-col items-start gap-1">
                      <Badge tone={STATUS_TONE[a.status]} dot upper={false}>
                        {STATUS_LABEL[a.status] || a.status}
                      </Badge>
                      {a.status === 'suspended' && a.suspensionExpiresAt && (
                        <div className="text-caption text-error">
                          Mở lại: {new Date(a.suspensionExpiresAt).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>
                  </Td>
                  <Td className="text-right pr-base">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailModal(a);
                      }}
                    >
                      Xem chi tiết
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="border-t border-hairline px-base py-sm">
            <Pagination total={total} pageSize={PAGE_SIZE} page={effectivePage} onChange={setPage} />
          </div>
        </Card>
      )}

      {/* MODAL: CHI TIẾT TÀI KHOẢN & THAO TÁC QUẢN TRỊ */}
      <Modal
        open={Boolean(selectedAccount)}
        onClose={() => setSelectedAccount(null)}
        title="Chi tiết tài khoản"
        size="md"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leadingIcon="key"
                onClick={() => openResetModal(selectedAccount)}
              >
                Đặt lại mật khẩu
              </Button>

              {selectedAccount?.status === 'active' && !isProtectedAdmin(selectedAccount) && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isSelf(selectedAccount)}
                    onClick={() => openSuspendModal(selectedAccount)}
                  >
                    Đình chỉ
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="!text-error hover:!bg-error/10"
                    disabled={isSelf(selectedAccount)}
                    onClick={() => openBanModal(selectedAccount)}
                  >
                    Khóa tài khoản
                  </Button>
                </>
              )}

              {(selectedAccount?.status === 'suspended' || selectedAccount?.status === 'banned') && (
                <Button
                  size="sm"
                  leadingIcon="check"
                  onClick={() => setActivateTarget(selectedAccount)}
                >
                  Kích hoạt lại
                </Button>
              )}
            </div>

            <Button variant="secondary" onClick={() => setSelectedAccount(null)}>
              Đóng
            </Button>
          </div>
        }
      >
        <div className="space-y-base">
          {/* User Header */}
          <div className="flex items-center gap-sm">
            <Avatar src={selectedAccount?.avatarUrl} name={selectedAccount?.fullName} size="lg" />
            <div className="min-w-0">
              <div className="text-title-md font-bold text-ink">{selectedAccount?.fullName}</div>
              <div className="truncate text-body-sm text-body">{selectedAccount?.email}</div>
            </div>
          </div>

          {detailLoading && (
            <div className="text-body-sm text-body py-sm" role="status">
              Đang tải thông tin chi tiết...
            </div>
          )}

          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 gap-sm border-y border-hairline py-sm text-body-sm">
            <div>
              <div className="text-caption text-body">Vai trò</div>
              <div className="mt-1"><RoleBadge account={selectedAccount || {}} /></div>
            </div>
            <div>
              <div className="text-caption text-body">Trạng thái</div>
              <div className="mt-1">
                <Badge tone={STATUS_TONE[selectedAccount?.status]} dot upper={false}>
                  {STATUS_LABEL[selectedAccount?.status] || selectedAccount?.status}
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-caption text-body">Số điện thoại</div>
              <div className="mt-1 text-ink font-medium">
                {selectedAccount?.phone && selectedAccount.phone !== 'null' ? selectedAccount.phone : 'Chưa cập nhật'}
              </div>
            </div>
            <div>
              <div className="text-caption text-body">Ngày tham gia</div>
              <div className="mt-1 text-ink">
                {selectedAccount?.joinedAt ? new Date(selectedAccount.joinedAt).toLocaleDateString('vi-VN') : '—'}
              </div>
            </div>
            {selectedAccount?.suspensionExpiresAt && (
              <div>
                <div className="text-caption text-error font-medium">Thời hạn đình chỉ đến</div>
                <div className="mt-1 text-error font-medium">
                  {new Date(selectedAccount.suspensionExpiresAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            )}
            <div>
              <div className="text-caption text-body">Đăng nhập gần nhất</div>
              <div className="mt-1 text-ink">
                {selectedAccount?.lastLoginAt ? new Date(selectedAccount.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
              </div>
            </div>
          </div>

          {/* Suspension / Ban Reason Callout */}
          {selectedAccount?.suspensionReason && (
            <div className="rounded-md border border-error/30 bg-error/5 p-sm text-body-sm text-error">
              <div className="font-semibold">Lý do đình chỉ / khóa:</div>
              <p className="mt-1">{selectedAccount.suspensionReason}</p>
            </div>
          )}

          {/* Customer Summary */}
          {selectedAccount?.customerSummary && (
            <div className="space-y-xs">
              <div className="text-title-sm text-ink font-semibold">Hoạt động khách hàng</div>
              <div className="grid grid-cols-2 gap-sm text-body-sm bg-canvas-soft p-sm rounded-md">
                <div>
                  <div className="text-caption text-body">Đơn hàng hoàn tất</div>
                  <div className="mt-1 font-semibold text-ink">{selectedAccount.customerSummary.orderCount} đơn</div>
                </div>
                <div>
                  <div className="text-caption text-body">Tổng chi tiêu</div>
                  <div className="mt-1 font-semibold text-ink">
                    {Number(selectedAccount.customerSummary.totalSpent).toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>
              {selectedAccount.customerSummary.defaultAddress && (
                <div className="text-caption text-body">
                  Địa chỉ mặc định: {[
                    selectedAccount.customerSummary.defaultAddress.line1,
                    selectedAccount.customerSummary.defaultAddress.ward,
                    selectedAccount.customerSummary.defaultAddress.district,
                    selectedAccount.customerSummary.defaultAddress.city,
                  ].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Merchant Owned Restaurants */}
          {selectedAccount?.restaurants?.length > 0 && (
            <div className="space-y-xs">
              <div className="text-title-sm text-ink font-semibold">Quán ăn sở hữu</div>
              <div className="space-y-xs">
                {selectedAccount.restaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    className="flex items-center justify-between gap-sm text-body-sm p-sm rounded-md border border-hairline"
                  >
                    <div>
                      <div className="font-semibold text-ink">{restaurant.name}</div>
                      <div className="text-caption text-body">
                        {restaurant.cuisineName || 'Chưa phân loại'} · ⭐ {Number(restaurant.ratingAvg).toFixed(1)} ({restaurant.reviewCount} đánh giá)
                      </div>
                    </div>
                    <Badge tone={restaurant.status === 'active' ? 'success' : 'warning'} upper={false}>
                      {restaurant.status === 'active' ? 'Hoạt động' : restaurant.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Merchant Wallet */}
          {selectedAccount?.wallet && (
            <div className="space-y-xs">
              <div className="text-title-sm text-ink font-semibold">Ví doanh thu đối tác</div>
              <div className="grid grid-cols-2 gap-sm text-body-sm bg-canvas-soft p-sm rounded-md">
                <div>
                  <div className="text-caption text-body">Số dư khả dụng</div>
                  <div className="mt-1 font-semibold text-ink">
                    {Number(selectedAccount.wallet.balance).toLocaleString('vi-VN')} đ
                  </div>
                </div>
                <div>
                  <div className="text-caption text-body">Tổng thu nhập</div>
                  <div className="mt-1 font-semibold text-ink">
                    {Number(selectedAccount.wallet.totalEarned).toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL: ĐÌNH CHỈ TÀI KHOẢN */}
      <Modal
        open={Boolean(suspensionTarget)}
        onClose={closeSuspensionModal}
        title={`Đình chỉ ${suspensionTarget?.fullName ?? 'người dùng'}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeSuspensionModal} disabled={suspending}>
              Hủy
            </Button>
            <Button
              onClick={handleConfirmSuspend}
              disabled={!suspensionReason.trim() || suspending}
            >
              {suspending ? 'Đang xử lý…' : 'Xác nhận đình chỉ'}
            </Button>
          </div>
        }
      >
        <div className="space-y-base">
          <p className="text-body-sm text-body">
            Tài khoản sẽ bị tạm khóa đăng nhập trong khoảng thời gian chỉ định. Hết thời gian này, tài khoản sẽ tự động được mở lại.
          </p>
          <Input
            type="number"
            min="1"
            max="365"
            label="Số ngày đình chỉ (1–365)"
            value={suspensionDays}
            onChange={(e) => setSuspensionDays(e.target.value)}
            placeholder="7"
          />
          <Select
            label="Chọn mẫu lý do vi phạm"
            value=""
            onChange={(e) => {
              if (e.target.value) {
                setSuspensionReason(e.target.value);
                if (suspensionError) setSuspensionError('');
              }
            }}
            options={[
              { value: '', label: '— Chọn mẫu lý do nhanh hoặc tự gõ —' },
              ...SUSPENSION_PRESET_REASONS.map((r) => ({ value: r, label: r })),
            ]}
          />
          <Textarea
            rows={3}
            label="Lý do đình chỉ"
            required
            value={suspensionReason}
            onChange={(e) => {
              setSuspensionReason(e.target.value);
              if (suspensionError) setSuspensionError('');
            }}
            error={suspensionError}
            placeholder="Nhập lý do vi phạm hoặc tạm đình chỉ..."
          />
        </div>
      </Modal>

      {/* MODAL: KHÓA TÀI KHOẢN VĨNH VIỄN */}
      <Modal
        open={Boolean(banTarget)}
        onClose={closeBanModal}
        title={`Khóa tài khoản ${banTarget?.fullName ?? ''}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeBanModal} disabled={banning}>
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmBan}
              disabled={!banReason.trim() || banning}
            >
              {banning ? 'Đang xử lý…' : 'Xác nhận khóa vĩnh viễn'}
            </Button>
          </div>
        }
      >
        <div className="space-y-base">
          <div className="rounded-md border border-error/30 bg-error/5 p-sm text-body-sm text-error">
            <div className="font-semibold">Cảnh báo nghiêm trọng:</div>
            <p className="mt-0.5">
              Tài khoản này sẽ bị vô hiệu hóa quyền đăng nhập vĩnh viễn và chấm dứt mọi hoạt động trên nền tảng NomNom.
            </p>
          </div>
          <Select
            label="Chọn mẫu lý do vi phạm"
            value=""
            onChange={(e) => {
              if (e.target.value) {
                setBanReason(e.target.value);
                if (banError) setBanError('');
              }
            }}
            options={[
              { value: '', label: '— Chọn mẫu lý do nhanh hoặc tự gõ —' },
              ...BAN_PRESET_REASONS.map((r) => ({ value: r, label: r })),
            ]}
          />
          <Textarea
            rows={3}
            label="Lý do khóa tài khoản"
            required
            value={banReason}
            onChange={(e) => {
              setBanReason(e.target.value);
              if (banError) setBanError('');
            }}
            error={banError}
            placeholder="Nhập lý do vi phạm nghiêm trọng..."
          />
        </div>
      </Modal>

      {/* MODAL: ĐẶT LẠI MẬT KHẨU */}
      <Modal
        open={Boolean(resetTarget)}
        onClose={closeResetModal}
        title={`Đặt lại mật khẩu cho ${resetTarget?.fullName ?? 'tài khoản'}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeResetModal} disabled={resetting}>
              Hủy
            </Button>
            <Button onClick={handleConfirmResetPassword} disabled={resetting}>
              {resetting ? 'Đang cập nhật…' : 'Xác nhận'}
            </Button>
          </div>
        }
      >
        <div className="space-y-base">
          <p className="text-body-sm text-body leading-relaxed">
            Nhập mật khẩu mới cụ thể (tối thiểu 6 ký tự) hoặc <span className="font-medium text-ink">để trống</span> để hệ thống tự động tạo mật khẩu ngẫu nhiên an toàn và gửi qua email cho tài khoản.
          </p>
          <Input
            type="text"
            label="Mật khẩu mới (Không bắt buộc)"
            value={resetPasswordValue}
            onChange={(e) => setResetPasswordValue(e.target.value)}
            error={resetError}
            placeholder="Để trống để tạo ngẫu nhiên hoặc nhập mật khẩu..."
          />
        </div>
      </Modal>

      {/* MODAL: XÁC NHẬN KÍCH HOẠT LẠI TÀI KHOẢN */}
      <Modal
        open={Boolean(activateTarget)}
        onClose={() => setActivateTarget(null)}
        title={`Kích hoạt lại tài khoản ${activateTarget?.fullName ?? ''}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setActivateTarget(null)} disabled={activating}>
              Hủy
            </Button>
            <Button
              leadingIcon="check"
              onClick={handleConfirmActivate}
              loading={activating}
              disabled={activating}
            >
              {activating ? 'Đang kích hoạt…' : 'Xác nhận kích hoạt'}
            </Button>
          </div>
        }
      >
        <div className="space-y-base">
          <p className="text-body-sm text-body">
            Bạn có chắc chắn muốn kích hoạt lại tài khoản <strong className="text-ink">{activateTarget?.fullName}</strong> ({activateTarget?.email}) không?
          </p>
          <div className="rounded-md border border-primary/20 bg-primary/5 p-sm text-body-sm text-ink">
            Tài khoản này sẽ ngay lập tức được khôi phục toàn bộ quyền đăng nhập và tiếp tục hoạt động trên hệ thống.
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Th({ className = '', children }) {
  return <th className={`px-base py-2 text-left text-caption-uppercase ${className}`}>{children}</th>;
}
function Td({ className = '', children }) {
  return <td className={`px-base py-sm ${className}`}>{children}</td>;
}

function RoleBadge({ account }) {
  const role = account?.primaryRole || account?.role || account?.roles?.[0] || 'customer';
  return (
    <Badge tone={ROLE_TONE[role] || 'outline'} upper={false}>
      {ROLE_LABEL[role] || role}
    </Badge>
  );
}

