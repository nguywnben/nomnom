import { useCallback, useEffect, useMemo, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Input, { Select, Textarea } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';
import {
  createAdminVoucherApi,
  deleteAdminVoucherApi,
  fetchAdminVouchersApi,
  updateAdminVoucherApi,
} from '../../lib/api.js';
import { formatVnd } from '../../lib/formatVnd.js';

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
    restaurantId: '',
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
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
      });
      setVouchers(res?.vouchers ?? []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách khuyến mãi.');
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter, scopeFilter]);

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
      restaurantId: v.restaurantId ? String(v.restaurantId) : '',
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
        restaurantId: form.restaurantId ? Number(form.restaurantId) : null,
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
    <div className="space-y-base p-base md:p-xl">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Hệ thống</div>
          <h1 className="text-display-md font-bold text-ink">Quản lý Khuyến mãi & Voucher</h1>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          <Badge tone="outline">Tổng {summary.total}</Badge>
          <Badge tone="preview">Toàn sàn {summary.platform}</Badge>
          <Badge tone="default">Của quán {summary.merchant}</Badge>
          <Badge tone="success" dot>{summary.active} hoạt động</Badge>
          <Button leadingIcon="plus" onClick={openCreate}>
            Tạo voucher
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card padded className="grid gap-sm sm:grid-cols-3">
        <Input
          placeholder="Tìm theo mã, tên hoặc quán…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leadingIcon="search"
        />
        <Select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Tất cả phạm vi' },
            { value: 'platform', label: '🌐 Mã Toàn sàn' },
            { value: 'merchant', label: '🏪 Mã Quán ăn' },
          ]}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Tất cả trạng thái' },
            { value: 'active', label: 'Hoạt động' },
            { value: 'paused', label: 'Tạm dừng' },
            { value: 'draft', label: 'Nháp' },
          ]}
        />
      </Card>

      {/* List */}
      {loading ? (
        <Card padded>
          <div className="py-xl text-center text-body animate-pulse">Đang tải danh sách voucher…</div>
        </Card>
      ) : error ? (
        <Card padded>
          <div className="py-xl text-center">
            <p className="text-body text-body-sm text-danger">{error}</p>
            <Button className="mt-sm" onClick={load}>Thử lại</Button>
          </div>
        </Card>
      ) : vouchers.length === 0 ? (
        <Card padded>
          <EmptyState
            icon="zap"
            title="Chưa có mã khuyến mãi nào"
            description="Không tìm thấy voucher phù hợp với bộ lọc hiện tại."
            action={<Button onClick={openCreate}>Tạo mã mới</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-base lg:grid-cols-2 xl:grid-cols-3">
          {vouchers.map((v) => {
            const isUsable = v.status === 'active' && !v.isExpired;
            return (
              <Card key={v.id} padded className={`flex flex-col gap-sm ${!isUsable ? 'opacity-70 bg-canvas-soft' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-title-sm font-bold text-ink">{v.code}</span>
                      <Badge tone={v.restaurantId ? 'default' : 'preview'}>
                        {v.restaurantId ? `Quán: ${v.restaurantName || v.restaurantId}` : '🌐 Toàn sàn'}
                      </Badge>
                      <Badge tone={v.isPublic ? 'outline' : 'default'}>
                        {v.isPublic ? 'Công khai' : 'Bí mật'}
                      </Badge>
                    </div>
                    <div className="mt-1 text-body-sm font-semibold text-ink">{v.name}</div>
                  </div>
                  <Badge tone={v.status === 'active' ? 'success' : v.status === 'paused' ? 'warning' : 'outline'} dot>
                    {v.status === 'active' ? 'Hoạt động' : v.status === 'paused' ? 'Tạm dừng' : 'Nháp'}
                  </Badge>
                </div>

                <p className="text-caption text-body line-clamp-2">{v.description || 'Ưu đãi đặt món NomNom.'}</p>

                <div className="grid grid-cols-2 gap-2 text-caption">
                  <div className="rounded bg-canvas-soft p-2">
                    <span className="text-body block">Mức giảm:</span>
                    <strong className="text-ink">
                      {v.discountType === 'percent'
                        ? `Giảm ${v.discountValue}% (tối đa ${formatVnd(v.maxDiscountAmount || 0)})`
                        : `Giảm ${formatVnd(v.discountValue)}`}
                    </strong>
                  </div>
                  <div className="rounded bg-canvas-soft p-2">
                    <span className="text-body block">Đơn tối thiểu:</span>
                    <strong className="text-ink">{formatVnd(v.minOrderAmount)}</strong>
                  </div>
                  <div className="rounded bg-canvas-soft p-2">
                    <span className="text-body block">Lượt dùng:</span>
                    <strong className="text-ink">
                      {v.usedCount} / {v.usageLimit ? v.usageLimit : '∞'}
                    </strong>
                  </div>
                  <div className="rounded bg-canvas-soft p-2">
                    <span className="text-body block">Hạn dùng:</span>
                    <strong className="text-ink">{new Date(v.endsAt).toLocaleDateString('vi-VN')}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-hairline pt-sm mt-auto">
                  <span className="text-caption text-body">
                    Tạo bởi: {v.creatorName || 'Hệ thống'}
                  </span>
                  <div className="flex items-center gap-1">
                    <IconButton icon="edit" label="Sửa" size="sm" onClick={() => openEdit(v)} />
                    <IconButton icon="trash" label="Xóa" size="sm" onClick={() => setDeleteTarget(v)} />
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
        title={editor?.mode === 'create' ? 'Tạo mã voucher mới' : `Chỉnh sửa voucher ${editor?.voucher?.code}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditor(null)} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={submitForm} loading={saving}>
              {editor?.mode === 'create' ? 'Tạo voucher' : 'Lưu thay đổi'}
            </Button>
          </>
        }
      >
        <form className="grid gap-sm md:grid-cols-2" onSubmit={submitForm}>
          <Input label="Mã voucher" required value={form.code} onChange={(e) => setForm((cur) => ({ ...cur, code: e.target.value.toUpperCase() }))} />
          <Input label="Tên voucher" required value={form.name} onChange={(e) => setForm((cur) => ({ ...cur, name: e.target.value }))} />
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
          <Input
            label="ID Nhà hàng (Để trống nếu là mã Toàn sàn)"
            type="number"
            placeholder="Để trống nếu là voucher Toàn sàn"
            value={form.restaurantId}
            onChange={(e) => setForm((cur) => ({ ...cur, restaurantId: e.target.value }))}
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
          <Input label="Giá trị giảm" required type="number" value={form.discountValue} onChange={(e) => setForm((cur) => ({ ...cur, discountValue: e.target.value }))} />
          <Input label="Giảm tối đa" type="number" value={form.maxDiscountAmount} onChange={(e) => setForm((cur) => ({ ...cur, maxDiscountAmount: e.target.value }))} />
          <Input label="Đơn tối thiểu" type="number" value={form.minOrderAmount} onChange={(e) => setForm((cur) => ({ ...cur, minOrderAmount: e.target.value }))} />
          <Input label="Giới hạn tổng lượt dùng" type="number" value={form.usageLimit} onChange={(e) => setForm((cur) => ({ ...cur, usageLimit: e.target.value }))} />
          <Input label="Mỗi khách dùng tối đa" type="number" value={form.perUserLimit} onChange={(e) => setForm((cur) => ({ ...cur, perUserLimit: e.target.value }))} />
          <Input label="Bắt đầu" type="datetime-local" value={form.startsAt} onChange={(e) => setForm((cur) => ({ ...cur, startsAt: e.target.value }))} />
          <Input label="Kết thúc" type="datetime-local" value={form.endsAt} onChange={(e) => setForm((cur) => ({ ...cur, endsAt: e.target.value }))} />
          <div className="md:col-span-2">
            <Textarea
              label="Mô tả"
              rows={3}
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
