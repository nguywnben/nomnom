import { useCallback, useEffect, useMemo, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Input, { Select, Textarea } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Tabs from '../../components/Tabs.jsx';
import { useApp } from '../../context/AppContext.jsx';
import {
  createAdminVoucherApi,
  deleteAdminVoucherApi,
  fetchAdminVouchersApi,
  updateAdminVoucherApi,
} from '../../lib/api.js';
import { formatVnd } from '../../lib/formatVnd.js';
import { shouldShowInitialLoader } from '../../lib/contentTabs.js';

function toDatetimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function defaultForm() {
  const now = new Date();
  const ends = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    code: '',
    name: '',
    description: '',
    discountType: 'percent',
    discountValue: '15',
    maxDiscountAmount: '50000',
    minOrderAmount: '0',
    usageLimit: '',
    perUserLimit: '1',
    isPublic: true,
    startsAt: toDatetimeLocal(now),
    endsAt: toDatetimeLocal(ends),
    status: 'active',
  };
}

export default function AdminPromotions() {
  const { pushToast } = useApp();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [publicFilter, setPublicFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAdminVouchersApi({
        q: query,
        status: statusFilter,
        scope: scopeFilter,
        discountType: discountTypeFilter,
        isPublic: publicFilter,
        sortBy,
      });
      setVouchers(res?.vouchers ?? []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách khuyến mãi.');
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter, scopeFilter, discountTypeFilter, publicFilter, sortBy]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    return {
      total: vouchers.length,
      platform: vouchers.filter((v) => !v.restaurantId).length,
      merchant: vouchers.filter((v) => Boolean(v.restaurantId)).length,
      active: vouchers.filter((v) => v.status === 'active' && !v.isExpired).length,
      paused: vouchers.filter((v) => v.status === 'paused').length,
    };
  }, [vouchers]);

  const openCreate = () => {
    setEditor({ mode: 'create' });
    setForm(defaultForm());
  };

  const openEdit = (v) => {
    setEditor({ mode: 'edit', voucher: v });
    setForm({
      code: v.code,
      name: v.name,
      description: v.description ?? '',
      discountType: v.discountType,
      discountValue: String(v.discountValue),
      maxDiscountAmount: v.maxDiscountAmount === null ? '' : String(v.maxDiscountAmount),
      minOrderAmount: String(v.minOrderAmount ?? 0),
      usageLimit: v.usageLimit === null ? '' : String(v.usageLimit),
      perUserLimit: String(v.perUserLimit ?? 1),
      isPublic: v.isPublic !== false,
      startsAt: toDatetimeLocal(v.startsAt),
      endsAt: toDatetimeLocal(v.endsAt),
      status: v.status,
    });
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        maxDiscountAmount: form.maxDiscountAmount === '' ? null : Number(form.maxDiscountAmount),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
        perUserLimit: Number(form.perUserLimit) || 1,
        isPublic: Boolean(form.isPublic),
      };

      if (editor.mode === 'create') {
        await createAdminVoucherApi(payload);
        pushToast({ kind: 'success', title: 'Đã tạo voucher thành công', message: form.code });
      } else {
        await updateAdminVoucherApi(editor.voucher.id, payload);
        pushToast({ kind: 'success', title: 'Đã cập nhật voucher', message: form.code });
      }

      setEditor(null);
      await load();
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể lưu voucher', message: err.message || 'Vui lòng kiểm tra lại.' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteAdminVoucherApi(deleteTarget.id);
      pushToast({ kind: 'success', title: 'Thành công', message: res.message || 'Đã xử lý voucher.' });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi', message: err.message || 'Không thể xóa voucher.' });
    }
  };

  return (
    <div className="space-y-base">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Tiếp thị & Khuyến mãi</div>
          <h1 className="text-display-lg text-ink">Quản lý Khuyến mãi Toàn sàn</h1>
          <p className="mt-xs text-body-sm text-body">
            Thiết lập mã giảm giá toàn hệ thống, mã ưu đãi vận chuyển và giám sát các chương trình khuyến mãi của quán ăn.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          <Badge tone="outline">Tổng {summary.total}</Badge>
          <Badge tone="preview">Toàn sàn {summary.platform}</Badge>
          <Badge tone="default">Của quán {summary.merchant}</Badge>
          <Badge tone="success" dot>{summary.active} hoạt động</Badge>
          <Badge tone="warning" dot>{summary.paused} tạm dừng</Badge>
        </div>
      </div>

      {/* Filter Bar / Toolbar */}
      <div className="flex flex-col gap-sm">
        {/* Row 1: Scope Tabs */}
        <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            size="sm"
            className="w-fit max-w-full"
            items={[
              { value: 'all', label: `Tất cả (${summary.total})` },
              { value: 'platform', label: `Toàn sàn (${summary.platform})` },
              { value: 'merchant', label: `Của quán (${summary.merchant})` },
            ]}
            value={scopeFilter}
            onChange={setScopeFilter}
          />
        </div>

        {/* Row 2: Search Input (trái) + Dropdown Filters & Action Button (phải) */}
        <div className="flex flex-col gap-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-72 shrink-0 h-9">
            <Icon
              name="search"
              size={16}
              className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-body"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo mã, tên hoặc quán…"
              aria-label="Tìm kiếm khuyến mãi"
              className="h-full w-full rounded-md border border-hairline-strong bg-surface-card pl-9 pr-base text-body-sm text-ink outline-none placeholder:text-muted focus:border-ink transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-xs">
            <Select
              aria-label="Loại giảm giá"
              className="w-full sm:w-auto md:w-36"
              fieldClassName="!h-9 !px-sm text-caption"
              value={discountTypeFilter}
              onChange={(e) => setDiscountTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Mọi loại giảm' },
                { value: 'percent', label: 'Giảm theo %' },
                { value: 'fixed', label: 'Giảm cố định' },
              ]}
            />
            <Select
              aria-label="Lọc hiển thị"
              className="w-full sm:w-auto md:w-36"
              fieldClassName="!h-9 !px-sm text-caption"
              value={publicFilter}
              onChange={(e) => setPublicFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Mọi hiển thị' },
                { value: 'public', label: 'Công khai' },
                { value: 'private', label: 'Bí mật' },
              ]}
            />
            <Select
              aria-label="Lọc trạng thái"
              className="w-full sm:w-auto md:w-36"
              fieldClassName="!h-9 !px-sm text-caption"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Mọi trạng thái' },
                { value: 'active', label: 'Hoạt động' },
                { value: 'paused', label: 'Tạm dừng' },
                { value: 'draft', label: 'Nháp' },
                { value: 'expired', label: 'Đã hết hạn' },
              ]}
            />
            <Select
              aria-label="Sắp xếp"
              className="w-full sm:w-auto md:w-40"
              fieldClassName="!h-9 !px-sm text-caption"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'newest', label: 'Mới nhất' },
                { value: 'expiring_soon', label: 'Sắp hết hạn' },
                { value: 'discount_high', label: 'Ưu đãi cao nhất' },
                { value: 'min_order_low', label: 'Đơn tối thiểu thấp' },
              ]}
            />
            <Button leadingIcon="plus" size="sm" onClick={openCreate}>
              Tạo voucher
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      {shouldShowInitialLoader(loading, vouchers) ? (
        <Card padded>
          <div className="py-xl text-center text-body">Đang tải danh sách voucher…</div>
        </Card>
      ) : error && vouchers.length === 0 ? (
        <Card padded>
          <div className="py-xl text-center space-y-sm">
            <div className="text-title-md text-ink">Không thể tải voucher</div>
            <p className="text-body text-body-sm">{error}</p>
            <Button onClick={load}>Thử lại</Button>
          </div>
        </Card>
      ) : vouchers.length === 0 ? (
        <Card padded>
          <div className="py-xl text-center space-y-sm">
            <div className="text-title-md text-ink">Chưa có mã khuyến mãi nào</div>
            <Button leadingIcon="plus" size="sm" onClick={openCreate}>Tạo voucher</Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-base lg:grid-cols-2 xl:grid-cols-3">
          {vouchers.map((v) => {
            const statusConfig = {
              active: { label: 'Hoạt động', tone: 'success' },
              paused: { label: 'Tạm dừng', tone: 'warning' },
              draft: { label: 'Nháp', tone: 'outline' },
            }[v.status] || { label: v.status, tone: 'outline' };

            return (
              <Card key={v.id} padded className="flex flex-col justify-between gap-sm">
                <div className="space-y-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-title-sm font-bold text-ink">{v.code}</span>
                        <Badge tone={v.restaurantId ? 'default' : 'preview'}>
                          {v.restaurantId ? `Quán: ${v.restaurantName || v.restaurantId}` : 'Toàn sàn'}
                        </Badge>
                        <Badge tone={v.isPublic ? 'outline' : 'default'}>
                          {v.isPublic ? 'Công khai' : 'Bí mật'}
                        </Badge>
                      </div>
                      <h3 className="mt-1 text-body font-semibold text-ink">{v.name}</h3>
                    </div>
                    <Badge tone={statusConfig.tone} dot className="shrink-0">
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <p className="text-body-sm text-body line-clamp-2 min-h-[38px]">{v.description || 'Ưu đãi đặt món NomNom.'}</p>

                  <div className="grid grid-cols-2 gap-2 text-body-sm">
                    <div className="rounded-md bg-canvas-soft px-sm py-2">
                      <div className="text-caption-uppercase text-body">Ưu đãi</div>
                      <div className="text-ink font-semibold mt-0.5">
                        {v.discountType === 'percent'
                          ? `Giảm ${v.discountValue}%${v.maxDiscountAmount ? ` (tối đa ${formatVnd(v.maxDiscountAmount)})` : ''}`
                          : `Giảm ${formatVnd(v.discountValue)}`}
                      </div>
                    </div>
                    <div className="rounded-md bg-canvas-soft px-sm py-2">
                      <div className="text-caption-uppercase text-body">Đơn tối thiểu</div>
                      <div className="text-ink font-semibold mt-0.5">{v.minOrderAmount > 0 ? formatVnd(v.minOrderAmount) : 'Mọi đơn hàng'}</div>
                    </div>
                    <div className="rounded-md bg-canvas-soft px-sm py-2">
                      <div className="text-caption-uppercase text-body">Lượt dùng</div>
                      <div className="text-ink font-semibold mt-0.5">{v.usedCount ?? 0} / {v.usageLimit ? v.usageLimit : '∞'}</div>
                    </div>
                    <div className="rounded-md bg-canvas-soft px-sm py-2">
                      <div className="text-caption-uppercase text-body">Hạn dùng</div>
                      <div className="text-ink font-semibold mt-0.5">{new Date(v.endsAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-sm mt-1">
                  <div className="text-caption text-body">
                    Tạo bởi: {v.creatorName || 'Hệ thống'}
                    {v.perUserLimit ? ` · Mỗi khách ${v.perUserLimit} lần` : ''}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <IconButton icon="edit" label="Sửa" size="sm" onClick={() => openEdit(v)} />
                    <IconButton icon="trash" label="Xóa" size="sm" className="text-body hover:text-error" onClick={() => setDeleteTarget(v)} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      <Modal
        open={Boolean(editor)}
        onClose={() => { if (!saving) setEditor(null); }}
        title={editor?.mode === 'create' ? 'Tạo mã voucher toàn sàn' : `Chỉnh sửa voucher ${editor?.voucher?.code}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditor(null)} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={submitForm} loading={saving}>
              {editor?.mode === 'create' ? 'Tạo voucher toàn sàn' : 'Lưu thay đổi'}
            </Button>
          </>
        }
      >
        <form className="grid gap-sm md:grid-cols-2" onSubmit={submitForm}>
          <Input
            label="Mã voucher"
            required
            placeholder="VD: NOMNOM50, FREESHIP"
            value={form.code}
            onChange={(e) => setForm((cur) => ({ ...cur, code: e.target.value.toUpperCase() }))}
          />
          <Input
            label="Tên voucher"
            required
            placeholder="VD: Giảm 50K cho đơn đầu tiên"
            value={form.name}
            onChange={(e) => setForm((cur) => ({ ...cur, name: e.target.value }))}
          />
          <Select
            label="Kênh phát hành"
            required
            value={form.isPublic ? 'public' : 'private'}
            onChange={(e) => setForm((cur) => ({ ...cur, isPublic: e.target.value === 'public' }))}
            options={[
              { value: 'public', label: 'Công khai' },
              { value: 'private', label: 'Riêng tư' },
            ]}
          />
          <Select
            label="Loại giảm giá"
            required
            value={form.discountType}
            onChange={(e) => setForm((cur) => ({ ...cur, discountType: e.target.value }))}
            options={[
              { value: 'percent', label: 'Giảm theo %' },
              { value: 'fixed', label: 'Giảm cố định' },
            ]}
          />
          <Select
            label="Trạng thái"
            required
            value={form.status}
            onChange={(e) => setForm((cur) => ({ ...cur, status: e.target.value }))}
            options={[
              { value: 'active', label: 'Hoạt động' },
              { value: 'paused', label: 'Tạm dừng' },
              { value: 'draft', label: 'Nháp' },
            ]}
          />
          <Input
            label="Giá trị giảm"
            required
            type="number"
            placeholder={form.discountType === 'percent' ? 'VD: 15 (nghĩa là 15%)' : 'VD: 50000'}
            value={form.discountValue}
            onChange={(e) => setForm((cur) => ({ ...cur, discountValue: e.target.value }))}
          />
          <Input
            label="Giảm tối đa"
            type="number"
            placeholder="VD: 50000 (để trống nếu không giới hạn)"
            value={form.maxDiscountAmount}
            onChange={(e) => setForm((cur) => ({ ...cur, maxDiscountAmount: e.target.value }))}
          />
          <Input
            label="Đơn tối thiểu"
            type="number"
            placeholder="VD: 100000 (0 là mọi đơn)"
            value={form.minOrderAmount}
            onChange={(e) => setForm((cur) => ({ ...cur, minOrderAmount: e.target.value }))}
          />
          <Input
            label="Giới hạn tổng lượt dùng"
            type="number"
            placeholder="VD: 100 (để trống nếu không giới hạn)"
            value={form.usageLimit}
            onChange={(e) => setForm((cur) => ({ ...cur, usageLimit: e.target.value }))}
          />
          <Input
            label="Mỗi khách dùng tối đa"
            type="number"
            placeholder="VD: 1"
            value={form.perUserLimit}
            onChange={(e) => setForm((cur) => ({ ...cur, perUserLimit: e.target.value }))}
          />
          <Input
            label="Bắt đầu"
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm((cur) => ({ ...cur, startsAt: e.target.value }))}
          />
          <Input
            label="Kết thúc"
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => setForm((cur) => ({ ...cur, endsAt: e.target.value }))}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Mô tả"
              rows={3}
              placeholder="Nhập mô tả chi tiết, điều kiện áp dụng voucher..."
              value={form.description}
              onChange={(e) => setForm((cur) => ({ ...cur, description: e.target.value }))}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Xác nhận xóa voucher"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Hủy</Button>
            <Button variant="danger" onClick={confirmDelete}>Xác nhận</Button>
          </>
        }
      >
        <p className="text-body-sm text-body">
          Bạn có chắc chắn muốn xóa voucher <strong className="text-ink">{deleteTarget?.code}</strong> không?
        </p>
      </Modal>
    </div>
  );
}
