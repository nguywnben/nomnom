import { useCallback, useEffect, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Input from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import Tabs from '../../components/Tabs.jsx';
import { fetchAdminAuditLogs } from '../../lib/api.js';

const ACTION_LABELS = {
  duyet_nha_hang: { label: 'Duyệt nhà hàng', tone: 'success' },
  tu_choi_nha_hang: { label: 'Từ chối nhà hàng', tone: 'error' },
  duyet_tai_xe: { label: 'Duyệt tài xế', tone: 'success' },
  tu_choi_tai_xe: { label: 'Từ chối tài xế', tone: 'error' },
  doi_trang_thai_tai_khoan: { label: 'Đổi trạng thái tài khoản', tone: 'warning' },
  huy_don_hang: { label: 'Hủy đơn hàng', tone: 'error' },
  duyet_rut_tien: { label: 'Duyệt rút tiền', tone: 'live' },
  tu_choi_rut_tien: { label: 'Từ chối rút tiền', tone: 'error' },
  hoan_tat_rut_tien: { label: 'Hoàn tất rút tiền', tone: 'success' },
  cap_nhat_cau_hinh: { label: 'Cập nhật cấu hình', tone: 'outline' },
};

const TARGET_LABELS = {
  restaurant: 'Nhà hàng',
  driver: 'Tài xế',
  user: 'Tài khoản',
  order: 'Đơn hàng',
  payout: 'Yêu cầu rút tiền',
  config: 'Cấu hình hệ thống',
};

function formatTimestamp(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function AdminAuditLogs() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [targetType, setTargetType] = useState('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  // Debounce tìm kiếm
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAdminAuditLogs({
        targetType: targetType === 'all' ? '' : targetType,
        q: debouncedQuery,
        page,
        limit: 20,
      });
      setItems(response.items ?? []);
      setPagination(response.pagination ?? { page: 1, limit: 20, total: 0 });
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử hoạt động.');
    } finally {
      setLoading(false);
    }
  }, [targetType, debouncedQuery, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Hệ thống</div>
          <h1 className="text-display-lg text-ink">Lịch sử hoạt động</h1>
          <p className="mt-xs text-body-sm text-body">
            Nhật ký đối soát ghi nhận các hành động quan trọng thực hiện bởi quản trị viên.
          </p>
        </div>
        <Button variant="secondary" leadingIcon="refresh" loading={loading} onClick={load}>
          Làm mới
        </Button>
      </div>

      <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
        <Tabs
          className="max-w-full"
          items={[
            { value: 'all', label: 'Tất cả' },
            { value: 'restaurant', label: 'Nhà hàng' },
            { value: 'driver', label: 'Tài xế' },
            { value: 'user', label: 'Tài khoản' },
            { value: 'order', label: 'Đơn hàng' },
            { value: 'payout', label: 'Rút tiền' },
            { value: 'config', label: 'Cấu hình' },
          ]}
          value={targetType}
          onChange={(val) => {
            setTargetType(val);
            setPage(1);
          }}
        />
        <Input
          leadingIcon="search"
          aria-label="Tìm kiếm nhật ký"
          placeholder="Tìm admin, hành động, ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full md:w-72"
        />
      </div>

      {error && (
        <div className="rounded-md border border-error bg-[#fbeaea] p-sm text-body-sm text-error" role="alert">
          {error}
        </div>
      )}

      {loading && !items.length ? (
        <div className="py-section text-center text-body-sm text-body" role="status">
          Đang tải lịch sử hoạt động...
        </div>
      ) : !items.length ? (
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
              {items.map((log) => {
                const actionMeta = ACTION_LABELS[log.action] || { label: log.action, tone: 'outline' };
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
                      {TARGET_LABELS[log.targetType] || log.targetType}
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
                        <span className="text-caption text-body-soft">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {pagination.total > pagination.limit && (
        <Pagination
          total={pagination.total}
          pageSize={pagination.limit}
          page={pagination.page}
          onChange={setPage}
        />
      )}

      <Modal
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Thông tin chi tiết hành động"
        size="md"
      >
        {selectedLog && (
          <div className="space-y-base">
            <div className="grid grid-cols-2 gap-sm text-body-sm">
              <div>
                <span className="block font-medium text-body">Quản trị viên:</span>
                <span className="text-ink">{selectedLog.adminName} ({selectedLog.adminEmail})</span>
              </div>
              <div>
                <span className="block font-medium text-body">Thời gian:</span>
                <span className="text-ink">{formatTimestamp(selectedLog.createdAt)}</span>
              </div>
              <div>
                <span className="block font-medium text-body">Hành động:</span>
                <span className="text-ink">{ACTION_LABELS[selectedLog.action]?.label || selectedLog.action}</span>
              </div>
              <div>
                <span className="block font-medium text-body">Đối tượng tác động:</span>
                <span className="text-ink">
                  {TARGET_LABELS[selectedLog.targetType] || selectedLog.targetType} (ID: {selectedLog.targetId})
                </span>
              </div>
            </div>

            <div className="border-t border-hairline pt-base">
              <div className="text-body-sm font-semibold text-ink mb-2">Dữ liệu đi kèm (Metadata)</div>
              <pre className="p-base bg-canvas-soft rounded-md text-caption text-ink font-mono overflow-auto max-h-64 whitespace-pre-wrap">
                {JSON.stringify(
                  typeof selectedLog.metadata === 'string'
                    ? JSON.parse(selectedLog.metadata)
                    : selectedLog.metadata,
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="flex justify-end pt-sm">
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
