import { useEffect, useMemo, useState } from 'react';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Input from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import Tabs from '../../components/Tabs.jsx';
import { useApp } from '../../context/AppContext.jsx';
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
  merchant: 'Nhà hàng',
  admin: 'Quản trị viên',
};

const ROLE_TONE = {
  customer: 'outline',
  merchant: 'preview',
  admin: 'dark',
};

const PAGE_SIZE = 12;

export default function AdminAccounts() {
  const { pushToast, user } = useApp();
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suspensionTarget, setSuspensionTarget] = useState(null);
  const [suspensionDays, setSuspensionDays] = useState('7');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionError, setSuspensionError] = useState('');
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetError, setResetError] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    queryAdminUsers({ role, status, q: query, page, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setUsers(data.items);
        setTotal(data.total);
      })
      .catch((err) => {
        if (cancelled) return;
        pushToast({ kind: 'error', title: 'Lấy danh sách thất bại', message: err.message ?? 'Vui lòng thử lại.' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [role, status, query, page, pushToast]);

  const setRoleAndReset = (value) => {
    setRole(value);
    setPage(1);
  };

  const setStatusAndReset = (value) => {
    setStatus(value);
    setPage(1);
  };

  const setQueryAndReset = (value) => {
    setSearchText(value);
    setPage(1);
  };

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setQuery(searchText);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchText]);

  const closeSuspensionModal = () => {
    setSuspensionTarget(null);
    setSuspensionDays('7');
    setSuspensionReason('');
    setSuspensionError('');
  };

  const openResetPasswordModal = async (account) => {
    setSelectedAccount(account);
    setDetailLoading(true);
    try {
      const response = await fetchAdminUserDetailApi(account.id);
      setSelectedAccount(response.account);
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể tải chi tiết', message: err.message || 'Vui lòng thử lại.' });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeResetPasswordModal = () => {
    setResetTarget(null);
    setResetPasswordValue('');
    setResetError('');
  };

  const handleUpdateStatus = async (userId, nextStatus, name) => {
    try {
      if (nextStatus === 'suspended') {
        const user = users.find((u) => u.id === userId);
        setSuspensionTarget({ id: userId, name: name ?? user?.fullName });
        setSuspensionDays('7');
        setSuspensionReason('');
        setSuspensionError('');
        return;
      }

      await updateAdminUserStatus(userId, nextStatus);
      setUsers((cur) => cur.map((u) => (u.id === userId ? { ...u, status: nextStatus, suspensionExpiresAt: null, suspensionReason: null } : u)));
      pushToast({ kind: nextStatus === 'active' ? 'success' : 'error', title: 'Cập nhật trạng thái', message: `${name} → ${STATUS_LABEL[nextStatus]}` });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Cập nhật thất bại', message: err.message ?? 'Vui lòng thử lại.' });
    }
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
      pushToast({ kind: 'error', title: 'Cập nhật trạng thái', message: `${suspensionTarget.name} → ${STATUS_LABEL.suspended}` });
      closeSuspensionModal();
    } catch (err) {
      setSuspensionError(err.message ?? 'Vui lòng thử lại.');
    }
  };

  const handleResetPassword = (account) => {
    openResetPasswordModal(account);
  };

  const handleConfirmResetPassword = async () => {
    if (!resetTarget) return;

    try {
      const result = await resetAdminUserPassword(resetTarget.id, resetPasswordValue.trim() || undefined);
      setUsers((cur) =>
        cur.map((u) =>
          u.id === resetTarget.id ? { ...u, status: u.status } : u,
        ),
      );
      pushToast({
        kind: 'success',
        title: 'Reset mật khẩu thành công',
        message: result.newPassword
          ? `Mật khẩu mới cho ${resetTarget.name}: ${result.newPassword}`
          : `Mật khẩu của ${resetTarget.name} đã được cập nhật`,
      });
      closeResetPasswordModal();
    } catch (err) {
      setResetError(err.message ?? 'Vui lòng thử lại.');
    }
  };

  const counts = useMemo(() => {
    const c = { customer: 0, merchant: 0, admin: 0, suspended: 0, banned: 0 };
    for (const user of users) {
      if (user.status === 'suspended') c.suspended += 1;
      if (user.status === 'banned') c.banned += 1;
    }
    return c;
  }, [users]);

  const effectivePage = Math.min(page, Math.max(1, Math.ceil(total / PAGE_SIZE)));

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Quản lý</div>
          <h1 className="text-display-lg text-ink">Tài khoản</h1>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          <Badge tone="outline">Tổng {total} người dùng</Badge>
          {counts.suspended > 0 && <Badge tone="warning" dot>{counts.suspended} bị đình chỉ</Badge>}
          {counts.banned > 0 && <Badge tone="error" dot>{counts.banned} đã khóa</Badge>}
        </div>
      </div>

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-xs border-b border-hairline px-base py-sm">
          <Tabs
            items={[
              { value: 'all', label: 'Tất cả' },
              { value: 'merchant', label: 'Quán ăn' },
              { value: 'customer', label: 'Khách hàng' },
              { value: 'admin', label: 'Admin' },
            ]}
            value={role}
            onChange={setRoleAndReset}
          />
          <Tabs
            items={[
              { value: 'all', label: 'Mọi trạng thái' },
              { value: 'active', label: 'Hoạt động' },
              { value: 'suspended', label: 'Đình chỉ' },
              { value: 'banned', label: 'Khóa' },
            ]}
            value={status}
            onChange={setStatusAndReset}
          />
          <Input
            leadingIcon="search"
            placeholder="Tìm email, tên..."
            aria-label="Tìm tài khoản"
            value={searchText}
            onChange={(e) => setQueryAndReset(e.target.value)}
            className="w-full md:ml-auto md:w-64"
          />
        </div>

        {loading ? (
          <div className="grid place-items-center py-xxl text-body">Đang tải danh sách...</div>
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-hairline md:hidden">
              {users.map((a) => (
                <li key={a.id} className="p-base">
                  <div className="flex items-start gap-sm">
                    <Avatar src={a.avatarUrl} name={a.fullName} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-body-sm font-semibold text-ink truncate">{a.fullName}</div>
                          <div className="text-caption text-body truncate">{a.email}</div>
                        </div>
                        <Badge tone={STATUS_TONE[a.status]} dot upper={false}>{STATUS_LABEL[a.status] || a.status}</Badge>
                      </div>
                      {a.status === 'suspended' && a.suspensionExpiresAt && (
                        <div className="mt-1 text-caption text-body">Mở lại: {new Date(a.suspensionExpiresAt).toLocaleDateString()}</div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-caption text-body">
                        <RoleBadges account={a} />
                        <span className="nums">Tham gia {new Date(a.joinedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-sm flex flex-wrap gap-2 justify-end">
                    <RowActions
                      account={a}
                      currentAdminId={user?.id}
                      onChangeStatus={handleUpdateStatus}
                      onResetPassword={handleResetPassword}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <table className="hidden w-full md:table">
              <thead className="bg-canvas-soft text-caption-uppercase text-body">
                <tr>
                  <Th>Tài khoản</Th>
                  <Th>Vai trò</Th>
                  <Th>Tham gia</Th>
                  <Th>Trạng thái</Th>
                  <Th className="text-right pr-base">Thao tác</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {users.map((a) => (
                  <tr key={a.id} className="hover:bg-canvas-soft">
                    <Td>
                      <div className="flex items-center gap-sm">
                        <Avatar src={a.avatarUrl} name={a.fullName} size="sm" />
                        <div>
                          <div className="text-body-sm font-semibold text-ink">{a.fullName}</div>
                          <div className="text-caption text-body">{a.email}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <RoleBadges account={a} />
                    </Td>
                    <Td className="text-body-sm text-body nums">{new Date(a.joinedAt).toLocaleDateString()}</Td>
                    <Td>
                      <div className="flex flex-col items-start gap-1">
                        <Badge tone={STATUS_TONE[a.status]} dot upper={false}>{STATUS_LABEL[a.status] || a.status}</Badge>
                        {a.status === 'suspended' && a.suspensionExpiresAt && (
                          <div className="text-caption text-body">Mở lại: {new Date(a.suspensionExpiresAt).toLocaleDateString()}</div>
                        )}
                      </div>
                    </Td>
                    <Td className="text-right pr-base">
                      <div className="flex flex-wrap justify-end gap-1">
                        <RowActions
                          account={a}
                          currentAdminId={user?.id}
                          onChangeStatus={handleUpdateStatus}
                          onResetPassword={handleResetPassword}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="grid place-items-center py-xxl text-body-sm text-body">
                <Icon name="search" size={20} className="mb-2" />
                Không có tài khoản khớp bộ lọc.
              </div>
            )}

            {users.length > 0 && (
              <div className="border-t border-hairline px-base py-sm">
                <Pagination total={total} pageSize={PAGE_SIZE} page={effectivePage} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>

      <Modal
        open={Boolean(selectedAccount)}
        onClose={() => setSelectedAccount(null)}
        title="Chi tiết tài khoản"
        size="sm"
        footer={<Button onClick={() => setSelectedAccount(null)}>Đóng</Button>}
      >
        <div className="space-y-base">
          <div className="flex items-center gap-sm">
            <Avatar src={selectedAccount?.avatarUrl} name={selectedAccount?.fullName} size="lg" />
            <div className="min-w-0"><div className="text-title-md text-ink">{selectedAccount?.fullName}</div><div className="truncate text-body-sm text-body">{selectedAccount?.email}</div></div>
          </div>
          {detailLoading && <div className="text-body-sm text-body" role="status">Đang tải thông tin chi tiết...</div>}
          <div className="grid grid-cols-2 gap-sm border-y border-hairline py-sm text-body-sm">
            <div><div className="text-caption text-body">Vai trò</div><div className="mt-1"><RoleBadges account={selectedAccount || {}} /></div></div>
            <div><div className="text-caption text-body">Trạng thái</div><div className="mt-1"><Badge tone={STATUS_TONE[selectedAccount?.status]} dot upper={false}>{STATUS_LABEL[selectedAccount?.status] || selectedAccount?.status}</Badge></div></div>
            <div><div className="text-caption text-body">Ngày tham gia</div><div className="mt-1 text-ink">{selectedAccount?.joinedAt ? new Date(selectedAccount.joinedAt).toLocaleDateString() : '—'}</div></div>
            {selectedAccount?.suspensionExpiresAt && <div><div className="text-caption text-body">Mở lại</div><div className="mt-1 text-ink">{new Date(selectedAccount.suspensionExpiresAt).toLocaleDateString()}</div></div>}
            <div><div className="text-caption text-body">Số điện thoại</div><div className="mt-1 text-ink">{selectedAccount?.phone || 'Chưa cập nhật'}</div></div>
            <div><div className="text-caption text-body">Đăng nhập gần nhất</div><div className="mt-1 text-ink">{selectedAccount?.lastLoginAt ? new Date(selectedAccount.lastLoginAt).toLocaleString() : 'Chưa có'}</div></div>
          </div>
          {selectedAccount?.customerSummary && <div><div className="text-title-sm text-ink">Hoạt động khách hàng</div><div className="mt-xs grid grid-cols-2 gap-sm text-body-sm"><div><div className="text-caption text-body">Đơn hợp lệ</div><div className="mt-1 text-ink">{selectedAccount.customerSummary.orderCount}</div></div><div><div className="text-caption text-body">Tổng chi tiêu</div><div className="mt-1 text-ink">{selectedAccount.customerSummary.totalSpent.toLocaleString('vi-VN')} đ</div></div></div>{selectedAccount.customerSummary.defaultAddress && <div className="mt-sm text-body-sm text-body">Địa chỉ mặc định: {selectedAccount.customerSummary.defaultAddress.line1}, {selectedAccount.customerSummary.defaultAddress.district}, {selectedAccount.customerSummary.defaultAddress.city}</div>}</div>}
          {selectedAccount?.restaurants?.length > 0 && <div><div className="text-title-sm text-ink">Nhà hàng sở hữu</div><div className="mt-xs space-y-xs">{selectedAccount.restaurants.map((restaurant) => <div key={restaurant.id} className="flex items-center justify-between gap-sm text-body-sm"><div><div className="font-medium text-ink">{restaurant.name}</div><div className="text-caption text-body">{restaurant.cuisineName || 'Chưa phân loại'} · {restaurant.reviewCount} đánh giá</div></div><Badge tone={restaurant.status === 'active' ? 'success' : 'warning'} upper={false}>{restaurant.status === 'active' ? 'Hoạt động' : restaurant.status}</Badge></div>)}</div></div>}
          {selectedAccount?.wallet && <div><div className="text-title-sm text-ink">Ví nhà hàng</div><div className="mt-xs grid grid-cols-2 gap-sm text-body-sm"><div><div className="text-caption text-body">Số dư khả dụng</div><div className="mt-1 text-ink">{selectedAccount.wallet.balance.toLocaleString('vi-VN')} đ</div></div><div><div className="text-caption text-body">Tổng đã nhận</div><div className="mt-1 text-ink">{selectedAccount.wallet.totalEarned.toLocaleString('vi-VN')} đ</div></div></div></div>}
          {selectedAccount?.suspensionReason && <div><div className="text-caption text-body">Lý do đình chỉ</div><p className="mt-1 text-body-sm text-ink">{selectedAccount.suspensionReason}</p></div>}
        </div>
      </Modal>

      <Modal
        open={!!suspensionTarget}
        onClose={closeSuspensionModal}
        title={`Đình chỉ ${suspensionTarget?.name ?? 'người dùng'}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={closeSuspensionModal}>
              Hủy
            </Button>
            <Button onClick={handleConfirmSuspend}>Xác nhận</Button>
          </>
        }
      >
        <div className="space-y-base">
          <div className="text-body text-body-sm">
            Nhập số ngày đình chỉ (1–365). Sau thời hạn này tài khoản sẽ tự động mở lại.
          </div>
          <Input
            type="number"
            min="1"
            max="365"
            value={suspensionDays}
            onChange={(e) => setSuspensionDays(e.target.value)}
            hint="Số ngày đình chỉ"
            placeholder="7"
          />
          <Input
            value={suspensionReason}
            onChange={(e) => setSuspensionReason(e.target.value)}
            hint="Lý do đình chỉ"
            error={suspensionError}
            placeholder="Nhập lý do đình chỉ"
          />
        </div>
      </Modal>

      <Modal
        open={!!resetTarget}
        onClose={closeResetPasswordModal}
        title={`Reset mật khẩu ${resetTarget?.name ?? 'người dùng'}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={closeResetPasswordModal}>
              Hủy
            </Button>
            <Button onClick={handleConfirmResetPassword}>Xác nhận</Button>
          </>
        }
      >
        <div className="space-y-base">
          <div className="text-body text-body-sm">
            Nhập mật khẩu mới hoặc để trống để tạo mật khẩu random và gửi email cho tài khoản.
          </div>
          <Input
            type="password"
            value={resetPasswordValue}
            onChange={(e) => setResetPasswordValue(e.target.value)}
            hint="Mật khẩu mới (không bắt buộc)"
            error={resetError}
            placeholder="********"
          />
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

function RoleBadges({ account }) {
  const roles = [...new Set(account.roles ?? [])];
  if (!roles.length) {
    return <Badge tone="warning" upper={false}>Chưa gán vai trò</Badge>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge key={role} tone={ROLE_TONE[role] || 'outline'} upper={false}>
          {ROLE_LABEL[role] || role}
        </Badge>
      ))}
    </div>
  );
}

function RowActions({ account, currentAdminId, onChangeStatus, onResetPassword }) {
  const isSelf = currentAdminId !== undefined && account.id === currentAdminId;
  const isProtectedAdmin = account.roles?.includes('admin');
  return (
    <div className="flex flex-wrap justify-end gap-1">
      {account.status === 'active' && !isProtectedAdmin && (
        <>
          <Button
            variant="secondary"
            size="sm"
            disabled={isSelf}
            onClick={() => onChangeStatus(account.id, 'suspended', account.fullName)}
          >
            Đình chỉ
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={isSelf}
            onClick={() => onChangeStatus(account.id, 'banned', account.fullName)}
          >
            Khóa
          </Button>
        </>
      )}
      {(account.status === 'suspended' || account.status === 'banned') && (
        <Button variant="secondary" size="sm" onClick={() => onChangeStatus(account.id, 'active', account.fullName)}>
          Kích hoạt
        </Button>
      )}
      <IconButton icon="eye" label={'Xem chi tiết ' + account.fullName} size="sm" onClick={() => onResetPassword(account)} />
    </div>
  );
}
