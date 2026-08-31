import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Icon from '../../components/Icon.jsx';
import Input from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import Tabs from '../../components/Tabs.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { resolveQueryTab } from '../../lib/contentTabs.js';
import {
  fetchAdminAuditLogs,
  fetchAdminConfigApi,
  updateAdminConfigApi,
} from '../../lib/api.js';

const CONFIG_LABELS = {
  default_commission_rate: {
    label: 'Hoa hồng mặc định',
    description: 'Tỷ lệ hoa hồng áp dụng cho quán sử dụng mức mặc định của nền tảng.',
    suffix: '%',
    min: 0,
    max: 50,
    step: 0.1,
  },
  max_search_radius_km: {
    label: 'Bán kính tìm kiếm tối đa',
    description: 'Khoảng cách tối đa để khách tìm và xem các quán ăn lân cận.',
    suffix: 'km',
    min: 1,
    max: 100,
    step: 0.1,
  },
  min_payout_amount: {
    label: 'Số tiền rút tối thiểu',
    description: 'Số dư khả dụng tối thiểu để quán có thể gửi yêu cầu rút tiền.',
    suffix: 'đ',
    min: 10000,
    max: 1000000000,
    step: 1000,
  },
  order_auto_cancel_minutes: {
    label: 'Thời gian tự hủy đơn',
    description: 'Đơn sẽ tự hủy nếu quán không xác nhận trong khoảng thời gian này.',
    suffix: 'phút',
    min: 1,
    max: 120,
    step: 1,
  },
};

const LOG_ACTION_LABELS = {
  login: { label: 'Đăng nhập', tone: 'outline' },
  approve_restaurant: { label: 'Duyệt mở quán', tone: 'success' },
  reject_restaurant: { label: 'Từ chối quán', tone: 'error' },
  suspend_restaurant: { label: 'Tạm khóa quán', tone: 'warning' },
  unsuspend_restaurant: { label: 'Mở khóa quán', tone: 'success' },
  update_restaurant_commission: { label: 'Sửa hoa hồng', tone: 'preview' },
  ban_user: { label: 'Khóa tài khoản', tone: 'error' },
  unban_user: { label: 'Mở tài khoản', tone: 'success' },
  suspend_user: { label: 'Khóa tạm thời', tone: 'warning' },
  unsuspend_user: { label: 'Mở khóa tạm', tone: 'success' },
  admin_reset_password: { label: 'Đặt lại mật khẩu', tone: 'preview' },
  approve_payout: { label: 'Duyệt rút tiền', tone: 'success' },
  reject_payout: { label: 'Từ chối rút tiền', tone: 'error' },
  update_config: { label: 'Đổi cấu hình', tone: 'preview' },
  admin_cancel_order: { label: 'Admin hủy đơn', tone: 'error' },
};

const LOG_TARGET_LABELS = {
  restaurant: 'Quán ăn',
  user: 'Tài khoản',
  order: 'Đơn hàng',
  payout: 'Lệnh rút tiền',
  config: 'Cấu hình hệ thống',
};

function formatTimestamp(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function System() {
  const { pushToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveQueryTab(searchParams, ['config', 'logs'], 'config');

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    setSearchParams({ tab: newTab });
  };

  // ---------------------------------------------------------------------------
  // TAB 1: CẤU HÌNH NỀN TẢNG (CONFIG)
  // ---------------------------------------------------------------------------
  const [configItems, setConfigItems] = useState([]);
  const [configDraft, setConfigDraft] = useState({});
  const [configSaving, setConfigSaving] = useState('');
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState('');

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const response = await fetchAdminConfigApi();
      setConfigItems(response.data);
      setConfigDraft(Object.fromEntries(response.data.map((item) => [item.key, item.value])));
      setConfigError('');
    } catch (err) {
      setConfigError(err.message || 'Không thể tải cấu hình nền tảng.');
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'config') {
      loadConfig();
    }
  }, [activeTab, loadConfig]);

  const saveConfigItem = async (item) => {
    setConfigSaving(item.key);
    try {
      const response = await updateAdminConfigApi(item.key, configDraft[item.key]);
      setConfigItems((current) =>
        current.map((entry) => (entry.key === item.key ? response.config : entry)),
      );
      setConfigDraft((current) => ({ ...current, [item.key]: response.config.value }));
      const affected = response.affectedRestaurants
        ? ` Đã cập nhật ${response.affectedRestaurants} quán dùng mức mặc định.`
        : '';
      pushToast({
        kind: 'success',
        title: 'Đã lưu cấu hình',
        message: `${CONFIG_LABELS[item.key]?.label || item.key}.${affected}`,
      });
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không thể lưu',
        message: err.message || 'Giá trị không hợp lệ.',
      });
    } finally {
      setConfigSaving('');
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 2: NHẬT KÝ HOẠT ĐỘNG (AUDIT LOGS)
  // ---------------------------------------------------------------------------
  const [logItems, setLogItems] = useState([]);
  const [logPagination, setLogPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [logTargetType, setLogTargetType] = useState('all');
  const [logQuery, setLogQuery] = useState('');
  const [logDebouncedQuery, setLogDebouncedQuery] = useState('');
  const [logPage, setLogPage] = useState(1);
  const [logLoading, setLogLoading] = useState(true);
  const [logError, setLogError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  // Debounce tìm kiếm
  useEffect(() => {
    const handler = setTimeout(() => {
      setLogDebouncedQuery(logQuery);
      setLogPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [logQuery]);

  const loadLogs = useCallback(async () => {
    setLogLoading(true);
    try {
      const response = await fetchAdminAuditLogs({
        targetType: logTargetType === 'all' ? '' : logTargetType,
        q: logDebouncedQuery,
        page: logPage,
        limit: 20,
      });
      setLogItems(response.items ?? []);
      setLogPagination(response.pagination ?? { page: 1, limit: 20, total: 0 });
      setLogError('');
    } catch (err) {
      setLogError(err.message || 'Không thể tải lịch sử hoạt động.');
    } finally {
      setLogLoading(false);
    }
  }, [logTargetType, logDebouncedQuery, logPage]);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, loadLogs]);

  return (
    <div className="space-y-base">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Hạ tầng & Vận hành</div>
          <h1 className="text-display-lg text-ink">Hệ thống & Kiểm toán</h1>
          <p className="mt-xs text-body-sm text-body">
            Thiết lập các tham số vận hành cốt lõi toàn sàn và theo dõi nhật ký hoạt động quản trị nhằm đảm bảo an toàn, minh bạch.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          {activeTab === 'config' && (
            <>
              <Badge tone="outline">{configItems.length} tham số hệ thống</Badge>
              <Badge tone="live" dot>Áp dụng toàn sàn</Badge>
            </>
          )}
          {activeTab === 'logs' && logPagination.total > 0 && (
            <Badge tone="outline">Tổng {logPagination.total} bản ghi nhật ký</Badge>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs
        size="sm"
        className="w-fit max-w-full"
        items={[
          { value: 'config', label: 'Cấu hình nền tảng' },
          { value: 'logs', label: 'Nhật ký hoạt động' },
        ]}
        value={activeTab}
        onChange={handleTabChange}
      />

      {/* TAB 1: CẤU HÌNH NỀN TẢNG */}
      {activeTab === 'config' && (
        <div className="space-y-base">
          {configError && (
            <div className="rounded-md border border-error bg-[#fbeaea] p-sm text-body-sm text-error" role="alert">
              {configError}
            </div>
          )}

          {configLoading && !configItems.length ? (
            <div className="py-section text-center text-body-sm text-body" role="status">
              Đang tải cấu hình...
            </div>
          ) : (
            <div className="grid gap-base lg:grid-cols-2">
              {configItems.map((item) => {
                const meta = CONFIG_LABELS[item.key] || {
                  label: 'Cấu hình hệ thống',
                  description: 'Tham số vận hành của nền tảng.',
                  suffix: '',
                  step: 1,
                };
                const changed = String(configDraft[item.key]) !== String(item.value);
                return (
                  <Card key={item.key} padded>
                    <div className="text-title-md text-ink">{meta.label}</div>
                    <div className="mt-1 text-caption text-body">{meta.description}</div>
                    <div className="mt-sm flex flex-col gap-sm sm:flex-row sm:items-end">
                      <Input
                        id={`config-${item.key}`}
                        className="flex-1"
                        type="number"
                        min={meta.min}
                        max={meta.max}
                        step={meta.step}
                        label={`${meta.label} (${meta.suffix})`}
                        value={configDraft[item.key] ?? ''}
                        onChange={(event) =>
                          setConfigDraft((current) => ({
                            ...current,
                            [item.key]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        leadingIcon="check"
                        size="sm"
                        loading={configSaving === item.key}
                        disabled={!changed}
                        onClick={() => saveConfigItem(item)}
                      >
                        Lưu
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NHẬT KÝ HOẠT ĐỘNG */}
      {activeTab === 'logs' && (
        <div className="space-y-base">
          {/* Sub Toolbar: Target Tabs + Search Input */}
          <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
            <Tabs
              size="sm"
              className="max-w-full"
              items={[
                { value: 'all', label: 'Tất cả' },
                { value: 'restaurant', label: 'Quán ăn' },
                { value: 'user', label: 'Tài khoản' },
                { value: 'order', label: 'Đơn hàng' },
                { value: 'payout', label: 'Rút tiền' },
                { value: 'config', label: 'Cấu hình' },
              ]}
              value={logTargetType}
              onChange={(val) => {
                setLogTargetType(val);
                setLogPage(1);
              }}
            />
            <div className="relative w-full md:w-72 shrink-0 h-9">
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-body"
              />
              <input
                value={logQuery}
                onChange={(e) => setLogQuery(e.target.value)}
                placeholder="Tìm admin, hành động, ID..."
                aria-label="Tìm kiếm nhật ký"
                className="h-full w-full rounded-md border border-hairline-strong bg-surface-card pl-9 pr-base text-body-sm text-ink outline-none placeholder:text-muted focus:border-ink transition-colors"
              />
            </div>
          </div>

          {logError && (
            <div className="rounded-md border border-error bg-[#fbeaea] p-sm text-body-sm text-error" role="alert">
              {logError}
            </div>
          )}

          {logLoading && !logItems.length ? (
            <div className="py-section text-center text-body-sm text-body" role="status">
              Đang tải lịch sử hoạt động...
            </div>
          ) : !logItems.length ? (
            <EmptyState
              icon="shield"
              title="Không tìm thấy nhật ký nào"
              message="Chưa có hành động nào được ghi nhận hoặc không khớp với bộ lọc."
            />
          ) : (
            <Card padded={false} className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-body-sm">
                <thead className="bg-canvas-soft text-caption-uppercase text-body">
                  <tr>
                    <th className="px-base py-sm font-semibold">Thời gian</th>
                    <th className="px-base py-sm font-semibold">Quản trị viên</th>
                    <th className="px-base py-sm font-semibold">Hành động</th>
                    <th className="px-base py-sm font-semibold">Đối tượng</th>
                    <th className="px-base py-sm font-semibold">ID Đối tượng</th>
                    <th className="px-base py-sm font-semibold text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {logItems.map((log) => {
                    const actionMeta = LOG_ACTION_LABELS[log.action] || {
                      label: 'Thao tác hệ thống',
                      tone: 'outline',
                    };
                    return (
                      <tr key={log.id} className="hover:bg-canvas-soft/30 transition-colors">
                        <td className="px-base py-sm text-ink">{formatTimestamp(log.createdAt)}</td>
                        <td className="px-base py-sm">
                          <div className="font-medium text-ink">{log.adminName}</div>
                          <div className="text-caption text-body">{log.adminEmail}</div>
                        </td>
                        <td className="px-base py-sm">
                          <Badge tone={actionMeta.tone}>{actionMeta.label}</Badge>
                        </td>
                        <td className="px-base py-sm text-body">
                          {LOG_TARGET_LABELS[log.targetType] || 'Đối tượng hệ thống'}
                        </td>
                        <td className="px-base py-sm nums font-medium text-ink">{log.targetId}</td>
                        <td className="px-base py-sm text-right">
                          {log.metadata ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedLog(log)}
                            >
                              Chi tiết
                            </Button>
                          ) : (
                            <span className="text-caption text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}

          {logPagination.total > logPagination.limit && (
            <div className="mt-base flex justify-center">
              <Pagination
                page={logPagination.page}
                limit={logPagination.limit}
                total={logPagination.total}
                onChange={(p) => setLogPage(p)}
              />
            </div>
          )}

          {/* Modal Xem Metadata JSON */}
          <Modal
            open={Boolean(selectedLog)}
            onClose={() => setSelectedLog(null)}
            title="Chi tiết Nhật ký Hoạt động"
            size="md"
            footer={
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                Đóng
              </Button>
            }
          >
            {selectedLog && (
              <div className="space-y-sm">
                <div className="grid grid-cols-2 gap-sm rounded-md bg-canvas-soft p-sm text-body-sm">
                  <div>
                    <span className="text-caption text-body">Admin:</span>{' '}
                    <strong className="text-ink">{selectedLog.adminName}</strong>
                  </div>
                  <div>
                    <span className="text-caption text-body">Email:</span>{' '}
                    <strong className="text-ink">{selectedLog.adminEmail}</strong>
                  </div>
                  <div>
                    <span className="text-caption text-body">Thời gian:</span>{' '}
                    <strong className="text-ink">{formatTimestamp(selectedLog.createdAt)}</strong>
                  </div>
                  <div>
                    <span className="text-caption text-body">Hành động:</span>{' '}
                    <strong className="text-ink">
                      {LOG_ACTION_LABELS[selectedLog.action]?.label || selectedLog.action}
                    </strong>
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-caption font-semibold text-body">Dữ liệu chi tiết (Metadata JSON):</div>
                  <pre className="max-h-72 overflow-y-auto rounded-md bg-[#1e1e1e] p-sm font-mono text-caption text-[#d4d4d4]">
                    {JSON.stringify(
                      typeof selectedLog.metadata === 'string'
                        ? JSON.parse(selectedLog.metadata)
                        : selectedLog.metadata,
                      null,
                      2,
                    )}
                  </pre>
                </div>
              </div>
            )}
          </Modal>
        </div>
      )}
    </div>
  );
}
