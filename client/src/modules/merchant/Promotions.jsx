import { useEffect, useMemo, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Input, { Select, Textarea } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';
import {
  createMerchantVoucherApi,
  deleteMerchantVoucherApi,
  fetchMerchantVouchersApi,
  updateMerchantVoucherApi,
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
  const ends = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    code: '',
    name: '',
    description: '',
    discountType: 'percent',
    discountValue: '15',
    maxDiscountAmount: '250000',
    minOrderAmount: '0',
    usageLimit: '',
    perUserLimit: '1',
    isPublic: true,
    startsAt: toDatetimeLocal(now),
    endsAt: toDatetimeLocal(ends),
    status: 'draft',
  };
}

export default function MerchantPromotions() {
  const { pushToast } = useApp();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm());

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMerchantVouchersApi();
      setVouchers(data?.vouchers ?? []);
    } catch (err) {
      setError(err.message ?? 'Không thể tải voucher.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = useMemo(() => ({
    active: vouchers.filter((voucher) => voucher.status === 'active').length,
    paused: vouchers.filter((voucher) => voucher.status === 'paused').length,
    draft: vouchers.filter((voucher) => voucher.status === 'draft').length,
  }), [vouchers]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm());
    setFormOpen(true);
  };

  const openEdit = (voucher) => {
    setEditing(voucher);
    setFormOpen(true);
    setForm({
      code: voucher.code,
      name: voucher.name,
      description: voucher.description ?? '',
      discountType: voucher.discountType,
      discountValue: String(voucher.discountValue),
      maxDiscountAmount: voucher.maxDiscountAmount === null ? '' : String(voucher.maxDiscountAmount),
      minOrderAmount: String(voucher.minOrderAmount ?? 0),
      usageLimit: voucher.usageLimit === null ? '' : String(voucher.usageLimit),
      perUserLimit: String(voucher.perUserLimit ?? 1),
      isPublic: voucher.isPublic !== false,
      startsAt: toDatetimeLocal(voucher.startsAt),
      endsAt: toDatetimeLocal(voucher.endsAt),
      status: voucher.status,
    });
  };

  const submitVoucher = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        maxDiscountAmount: form.maxDiscountAmount === '' ? null : Number(form.maxDiscountAmount),
        minOrderAmount: Number(form.minOrderAmount),
        usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
        perUserLimit: Number(form.perUserLimit),
        isPublic: Boolean(form.isPublic),
      };
      if (editing) {
        await updateMerchantVoucherApi(editing.id, payload);
        pushToast({ kind: 'success', title: 'Đã cập nhật voucher', message: form.code });
      } else {
        await createMerchantVoucherApi(payload);
        pushToast({ kind: 'success', title: 'Đã tạo voucher', message: form.code });
      }
      setEditing(null);
      setForm(defaultForm());
      setFormOpen(false);
      await loadData();
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể lưu voucher', message: err.message ?? 'Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMerchantVoucherApi(deleteId);
      pushToast({ kind: 'success', title: 'Đã xóa voucher', message: 'Voucher đã được xóa khỏi quán.' });
      setDeleteId(null);
      await loadData();
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể xóa voucher', message: err.message ?? 'Vui lòng thử lại.' });
    }
  };

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Tăng trưởng</div>
          <h1 className="text-display-lg text-ink">Khuyến mãi</h1>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          <Badge tone="outline">Tổng {vouchers.length}</Badge>
          <Badge tone="success" dot>{summary.active} hoạt động</Badge>
          <Badge tone="warning" dot>{summary.paused} tạm dừng</Badge>
          <Badge tone="outline" dot>{summary.draft} nháp</Badge>
          <Button leadingIcon="plus" size="sm" onClick={openCreate}>
            Tạo voucher
          </Button>
        </div>
      </div>

      {loading ? (
        <Card padded>
          <div className="py-xl text-center text-body">Đang tải voucher...</div>
        </Card>
      ) : error ? (
        <Card padded>
          <div className="space-y-sm text-center">
            <div className="text-title-md text-ink">Không thể tải voucher</div>
            <p className="text-body text-body-sm">{error}</p>
            <Button onClick={loadData}>Thử lại</Button>
          </div>
        </Card>
      ) : vouchers.length === 0 ? (
        <Card padded>
          <div className="py-xl text-center">
            <div className="text-title-md text-ink">Chưa có voucher nào</div>
            <p className="mt-1 text-body text-body-sm">Tạo voucher quán để khách áp dụng khi đặt món.</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-base lg:grid-cols-2 xl:grid-cols-3">
          {vouchers.map((voucher) => {
            const statusConfig = {
              active: { label: 'Hoạt động', tone: 'success' },
              paused: { label: 'Tạm dừng', tone: 'warning' },
              draft: { label: 'Nháp', tone: 'outline' },
            }[voucher.status] || { label: voucher.status, tone: 'outline' };

            return (
              <Card key={voucher.id} padded className="flex flex-col justify-between gap-sm">
                <div className="space-y-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-title-sm font-bold text-ink">{voucher.code}</span>
                        <Badge tone={voucher.isPublic ? 'outline' : 'default'}>
                          {voucher.isPublic ? 'Công khai' : 'Riêng tư'}
                        </Badge>
                      </div>
                      <h3 className="mt-1 text-body font-semibold text-ink">{voucher.name}</h3>
                    </div>
                    <Badge tone={statusConfig.tone} dot className="shrink-0">
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <p className="text-body-sm text-body line-clamp-2 min-h-[38px]">{voucher.description || 'Không có mô tả thêm.'}</p>

                  <div className="grid grid-cols-2 gap-2 text-body-sm">
                    <div className="rounded-md bg-canvas-soft px-sm py-2">
                      <div className="text-caption-uppercase text-body">Ưu đãi</div>
                      <div className="text-ink font-semibold mt-0.5">
                        {voucher.discountType === 'percent'
                          ? `Giảm ${voucher.discountValue}%${voucher.maxDiscountAmount ? ` tối đa ${formatVnd(voucher.maxDiscountAmount)}` : ''}`
                          : `Giảm ${formatVnd(voucher.discountValue)}`}
                      </div>
                    </div>
                    <div className="rounded-md bg-canvas-soft px-sm py-2">
                      <div className="text-caption-uppercase text-body">Đơn tối thiểu</div>
                      <div className="text-ink font-semibold mt-0.5">{voucher.minOrderAmount > 0 ? formatVnd(voucher.minOrderAmount) : 'Mọi đơn hàng'}</div>
                    </div>
                    <div className="rounded-md bg-canvas-soft px-sm py-2">
                      <div className="text-caption-uppercase text-body">Từ ngày</div>
                      <div className="text-ink mt-0.5">{new Date(voucher.startsAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <div className="rounded-md bg-canvas-soft px-sm py-2">
                      <div className="text-caption-uppercase text-body">Đến ngày</div>
                      <div className="text-ink mt-0.5">{new Date(voucher.endsAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-sm mt-1">
                  <div className="text-caption text-body">
                    {voucher.usageLimit ? `Giới hạn ${voucher.usageLimit} lượt` : 'Không giới hạn lượt'}
                    {' · '}
                    Mỗi khách {voucher.perUserLimit} lần
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <IconButton icon="edit" label="Sửa voucher" size="sm" variant="secondary" onClick={() => openEdit(voucher)} />
                    <IconButton icon="trash" label="Xóa voucher" size="sm" variant="secondary" className="text-error hover:!bg-error/10 hover:!border-error/30" onClick={() => setDeleteId(voucher.id)} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => {
          setEditing(null);
          setForm(defaultForm());
          setFormOpen(false);
        }}
        title={editing ? 'Chỉnh sửa voucher' : 'Tạo voucher mới'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setEditing(null); setForm(defaultForm()); setFormOpen(false); }}>
              Hủy
            </Button>
            <Button onClick={submitVoucher} loading={saving}>
              {editing ? 'Lưu thay đổi' : 'Tạo voucher'}
            </Button>
          </>
        }
      >
        <form className="grid gap-sm md:grid-cols-2" onSubmit={submitVoucher}>
          <Input label="Mã voucher" required value={form.code} onChange={(e) => setForm((cur) => ({ ...cur, code: e.target.value }))} />
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
              { value: 'draft', label: 'Nháp' },
              { value: 'active', label: 'Hoạt động' },
              { value: 'paused', label: 'Tạm dừng' },
            ]}
          />
          <Input label="Giá trị giảm" required type="number" value={form.discountValue} onChange={(e) => setForm((cur) => ({ ...cur, discountValue: e.target.value }))} />
          <Input label="Giảm tối đa" type="number" value={form.maxDiscountAmount} onChange={(e) => setForm((cur) => ({ ...cur, maxDiscountAmount: e.target.value }))} />
          <Input label="Đơn tối thiểu" type="number" value={form.minOrderAmount} onChange={(e) => setForm((cur) => ({ ...cur, minOrderAmount: e.target.value }))} />
          <Input label="Giới hạn lượt dùng" type="number" value={form.usageLimit} onChange={(e) => setForm((cur) => ({ ...cur, usageLimit: e.target.value }))} />
          <Input label="Mỗi khách dùng" type="number" value={form.perUserLimit} onChange={(e) => setForm((cur) => ({ ...cur, perUserLimit: e.target.value }))} />
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

      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Xóa voucher"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Xóa
            </Button>
          </>
        }
      >
        <p className="text-body text-body-sm">Voucher sẽ bị xóa khỏi quán và khách sẽ không dùng được nữa.</p>
      </Modal>
    </div>
  );
}
