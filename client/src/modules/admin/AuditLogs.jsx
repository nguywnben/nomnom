import { useCallback, useEffect, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Icon from '../../components/Icon.jsx';
import Input from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import Tabs from '../../components/Tabs.jsx';
import { fetchAdminAuditLogs } from '../../lib/api.js';

const ACTION_LABELS = {
  tao_loai_am_thuc: { label: 'Tạo loại ẩm thực', tone: 'success' },
  cap_nhat_loai_am_thuc: { label: 'Cập nhật loại ẩm thực', tone: 'outline' },
  an_loai_am_thuc: { label: 'Ẩn loại ẩm thực', tone: 'warning' },
  xoa_loai_am_thuc: { label: 'Xóa loại ẩm thực', tone: 'error' },
  sap_xep_loai_am_thuc: { label: 'Sắp xếp loại ẩm thực', tone: 'outline' },
  duyet_nha_hang: { label: 'Duyệt nhà hàng', tone: 'success' },
  tu_choi_nha_hang: { label: 'Từ chối nhà hàng', tone: 'error' },
  doi_trang_thai_tai_khoan: { label: 'Đổi trạng thái tài khoản', tone: 'warning' },
  huy_don_hang: { label: 'Hủy đơn hàng', tone: 'error' },
  duyet_rut_tien: { label: 'Duyệt rút tiền', tone: 'live' },
  tu_choi_rut_tien: { label: 'Từ chối rút tiền', tone: 'error' },
  hoan_tat_rut_tien: { label: 'Hoàn tất rút tiền', tone: 'success' },
  cap_nhat_cau_hinh: { label: 'Cập nhật cấu hình', tone: 'outline' },
};

const METADATA_LABELS = {
  tenLoai: 'Tên loại ẩm thực',
  slug: 'Định danh URL',
  iconUrl: 'Ảnh đại diện',
  sortOrder: 'Thứ tự hiển thị',
  isActive: 'Hiển thị',
  thayDoi: 'Nội dung thay đổi',
  thuTuIds: 'Thứ tự mới',
  tenNhaHang: 'Tên quán ăn',
  chuSoHuuId: 'ID chủ sở hữu',
  lyDo: 'Lý do',
  trangThaiCu: 'Trạng thái trước',
  trangThaiMoi: 'Trạng thái mới',
  maDonHang: 'Mã đơn hàng',
  soTien: 'Số tiền',
  tenNganHang: 'Ngân hàng',
  lyDoTuChoi: 'Lý do từ chối',
  maGiaoDichNgoai: 'Mã giao dịch ngân hàng',
  giaTriCu: 'Giá trị trước',
  giaTriMoi: 'Giá trị mới',
  soNhaHangAnhHuong: 'Số quán bị ảnh hưởng',
};

const VALUE_LABELS = {
  active: 'Hoạt động',
  suspended: 'Đình chỉ',
  banned: 'Đã khóa',
  pending: 'Chờ duyệt',
  true: 'Có',
  false: 'Không',
};

function parseMetadata(metadata) {
  if (!metadata) return {};
  if (typeof metadata === 'object') return metadata;
  try {
    return JSON.parse(metadata);
  } catch {
    return { thongTin: String(metadata) };
  }
}

function formatMetadataValue(key, value) {
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'soTien') return Number(value).toLocaleString('vi-VN') + ' đ';
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (typeof value === 'string' && VALUE_LABELS[value]) return VALUE_LABELS[value];
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([childKey, childValue]) => `${METADATA_LABELS[childKey] || 'Thông tin'}: ${formatMetadataValue(childKey, childValue)}`)
      .join(' · ');
  }
  return String(value);
}

const TARGET_LABELS = {
  cuisine: 'Loại ẩm thực',
  restaurant: 'Nhà hàng',
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
      </div>

      <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
        <Tabs
          size="sm"
          className="max-w-full"
          items={[
            { value: 'all', label: 'Tất cả' },
            { value: 'restaurant', label: 'Nhà hàng' },
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
        <div className="relative w-full md:w-72 shrink-0 h-9">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-body"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm admin, hành động, ID..."
            aria-label="Tìm kiếm nhật ký"
            className="h-full w-full rounded-md border border-hairline-strong bg-surface-card pl-9 pr-base text-body-sm text-ink outline-none placeholder:text-muted focus:border-ink transition-colors"
          />
        </div>
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
                const actionMeta = ACTION_LABELS[log.action] || { label: 'Thao tác hệ thống', tone: 'outline' };
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
                      {TARGET_LABELS[log.targetType] || 'Đối tượng hệ thống'}
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
                <span className="text-ink">{ACTION_LABELS[selectedLog.action]?.label || 'Thao tác hệ thống'}</span>
              </div>
              <div>
                <span className="block font-medium text-body">Đối tượng tác động:</span>
                <span className="text-ink">
                  {TARGET_LABELS[selectedLog.targetType] || 'Đối tượng hệ thống'} (ID: {selectedLog.targetId})
                </span>
              </div>
            </div>

            <div className="border-t border-hairline pt-base">
              <div className="text-body-sm font-semibold text-ink mb-2">Thông tin đi kèm</div>
              <dl className="divide-y divide-hairline rounded-md border border-hairline bg-canvas-soft px-sm">
                {Object.entries(parseMetadata(selectedLog.metadata)).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-sm py-sm text-body-sm">
                    <dt className="text-body">{METADATA_LABELS[key] || 'Thông tin'}</dt>
                    <dd className="break-words text-ink">{formatMetadataValue(key, value)}</dd>
                  </div>
                ))}
              </dl>
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
