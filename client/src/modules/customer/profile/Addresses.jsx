import { useState, useEffect } from 'react';

import Badge from '../../../components/Badge.jsx';
import Button from '../../../components/Button.jsx';
import Card from '../../../components/Card.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import Icon from '../../../components/Icon.jsx';
import Input from '../../../components/Input.jsx';
import Modal from '../../../components/Modal.jsx';
import { useApp } from '../../../context/AppContext.jsx';
import ProfileSubHeader from './ProfileSubHeader.jsx';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../lib/api.js';

const EMPTY_FORM = {
  label: '',
  recipientName: '',
  recipientPhone: '',
  line1: '',
  ward: '',
  city: '',
  deliveryNote: '',
};

export default function Addresses() {
  const { pushToast, permittedRoles } = useApp();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editor, setEditor] = useState({ open: false, mode: 'create', id: null, values: EMPTY_FORM, submitting: false, fieldErrors: {} });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/v2/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error('Failed to load provinces:', err));
  }, []);

  useEffect(() => {
    if (!selectedProvinceCode) {
      setWards([]);
      setSelectedWardCode('');
      return;
    }
    fetch(`https://provinces.open-api.vn/api/v2/p/${selectedProvinceCode}?depth=2`)
      .then(res => res.json())
      .then(data => setWards(data.wards || []))
      .catch(err => console.error('Failed to load wards:', err));
  }, [selectedProvinceCode]);

  useEffect(() => {
    if (permittedRoles.customer) {
      loadAddresses();
    }
  }, [permittedRoles.customer]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/v1/me/addresses');
      setList(data);
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi', message: 'Không thể tải danh sách địa chỉ.' });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setSelectedProvinceCode('');
    setSelectedWardCode('');
    setEditor({ open: true, mode: 'create', id: null, values: EMPTY_FORM, submitting: false, fieldErrors: {} });
  };

  const openEdit = (addr) => {
    // Tìm province code từ tên
    const p = provinces.find((x) => x.name === addr.city);
    if (p) setSelectedProvinceCode(p.code);

    // Ward sẽ load ở useEffect do dependency selectedProvinceCode
    // Ta xài setTimeout hoặc giữ addr.ward vào properties tạm để useEffect set lại
    setTimeout(() => {
      setEditor(c => ({...c, __initialWard: addr.ward}));
    }, 0);

    setEditor({
      open: true,
      mode: 'edit',
      id: addr.id,
      values: {
        label: addr.label || '',
        recipientName: addr.recipientName || '',
        recipientPhone: addr.recipientPhone || '',
        line1: addr.line1 || '',
        ward: addr.ward || '',
        city: addr.city || '',
        deliveryNote: addr.deliveryNote || '',
      },
      submitting: false,
      fieldErrors: {}
    });
  };

  useEffect(() => {
    // Tự set ward code khi load song wards
    if (editor.__initialWard && wards.length > 0) {
      const w = wards.find((x) => x.name === editor.__initialWard);
      if (w) setSelectedWardCode(w.code);
      setEditor(c => ({...c, __initialWard: null}));
    }
  }, [wards, editor.__initialWard]);

  const close = () => setEditor((c) => ({ ...c, open: false }));

  const submit = async (e) => {
    e.preventDefault();
    const v = editor.values;
    const newErrors = {};

    if (!v.label.trim()) {
      newErrors.label = 'Nhãn không được để trống';
    }
    if (!v.recipientName.trim()) {
      newErrors.recipientName = 'Tên người nhận không được để trống';
    }
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!v.recipientPhone.trim()) {
      newErrors.recipientPhone = 'Số điện thoại không được để trống';
    } else if (!phoneRegex.test(v.recipientPhone)) {
      newErrors.recipientPhone = 'Số điện thoại không hợp lệ';
    }
    if (!v.line1.trim()) {
      newErrors.line1 = 'Địa chỉ không được để trống';
    }
    if (!v.city.trim()) {
      newErrors.city = 'Tỉnh/Thành phố không được để trống';
    }
    if (!v.ward.trim()) {
      newErrors.ward = 'Phường/Xã không được để trống';
    }

    if (Object.keys(newErrors).length > 0) {
      setEditor((c) => ({ ...c, fieldErrors: newErrors }));
      pushToast({ kind: 'error', title: 'Thiếu thông tin', message: 'Hãy điền đầy đủ các thông tin bắt buộc.' });
      return;
    }

    setEditor((c) => ({ ...c, submitting: true, fieldErrors: {} }));
    try {
      if (editor.mode === 'create') {
        const newAddr = await apiPost('/api/v1/me/addresses', v);
        setList((cur) => [newAddr, ...cur].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)));
        pushToast({ kind: 'success', title: 'Đã thêm địa chỉ', message: v.label });
      } else {
        const updatedAddr = await apiPatch(`/api/v1/me/addresses/${editor.id}`, v);
        setList((cur) =>
          cur.map((a) => (a.id === editor.id ? updatedAddr : a)).sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
        );
        pushToast({ kind: 'success', title: 'Đã cập nhật', message: v.label });
      }
      close();
    } catch (err) {
      if (err.errors) {
        setEditor((c) => ({ ...c, fieldErrors: err.errors }));
      } else if (err.details && Array.isArray(err.details)) {
        // Handling Joi errors if returned as an array of details
        const apiErrors = {};
        err.details.forEach(detail => {
          if (detail.context && detail.context.key) {
            apiErrors[detail.context.key] = detail.message;
          }
        });
        setEditor((c) => ({ ...c, fieldErrors: apiErrors }));
      } else {
        pushToast({ kind: 'error', title: 'Lỗi', message: err.message || 'Không thể lưu địa chỉ.' });
      }
    } finally {
      setEditor((c) => ({ ...c, submitting: false }));
    }
  };

  const setDefault = async (id) => {
    try {
      await apiPost(`/api/v1/me/addresses/${id}/default`);
      setList((cur) =>
        cur.map((a) => ({ ...a, isDefault: a.id === id }))
           .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
      );
      pushToast({ kind: 'success', title: 'Đã đặt mặc định', message: list.find((x) => x.id === id)?.label });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi', message: 'Không thể đặt mặc định.' });
    }
  };

  const removeAddr = async () => {
    const target = list.find((a) => a.id === confirmDelete);
    if (!target) return;
    
    try {
      await apiDelete(`/api/v1/me/addresses/${target.id}`);
      setList((cur) => cur.filter((a) => a.id !== target.id));
      pushToast({ kind: 'info', title: 'Đã xoá địa chỉ', message: target.label });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi', message: 'Không thể xoá địa chỉ.' });
    } finally {
      setConfirmDelete(null);
    }
  };

  const getIcon = (label) => {
    const l = label.toLowerCase();
    if (l.includes('nhà')) return 'pin';
    if (l.includes('công ty') || l.includes('văn')) return 'store';
    return 'pin'; // Default
  };

  return (
    <div className="flex flex-col gap-base p-base md:container-page md:py-xl">
      <ProfileSubHeader title="Địa chỉ đã lưu" />

      <div className="flex items-center justify-between gap-sm">
        <p className="text-body-sm text-body">
          Lưu địa chỉ để đặt món nhanh hơn ở lần sau.
        </p>
        <Button size="sm" leadingIcon="plus" onClick={openCreate} disabled={!permittedRoles.customer}>
          Thêm địa chỉ
        </Button>
      </div>

      {!permittedRoles.customer ? (
        <Card padded>
          <div className="text-title-md text-ink">Cần đăng nhập</div>
          <p className="mt-1 text-body-sm text-body">
            Đăng nhập để lưu và quản lý địa chỉ giao hàng.
          </p>
        </Card>
      ) : loading ? (
        <div className="flex justify-center p-xl text-body">Đang tải...</div>
      ) : list.length === 0 ? (
        <EmptyState
          icon="pin"
          title="Chưa có địa chỉ nào"
          message="Thêm địa chỉ đầu tiên để có trải nghiệm thanh toán liền mạch."
          action={<Button onClick={openCreate}>Thêm địa chỉ</Button>}
        />
      ) : (
        <div className="flex flex-col gap-sm">
          {list.map((a) => (
            <Card key={a.id} padded>
              <div className="flex items-start gap-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface-strong text-ink">
                  <Icon name={getIcon(a.label)} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-body-sm font-semibold text-ink truncate">{a.label}</div>
                    {a.isDefault && <Badge tone="success" dot>Mặc định</Badge>}
                  </div>
                  <div className="mt-0.5 text-body-sm text-ink truncate">
                    {a.recipientName} - {a.recipientPhone}
                  </div>
                  <div className="text-caption text-body truncate">
                    {a.line1}{a.ward ? `, ${a.ward}` : ''}{a.district ? `, ${a.district}` : ''}, {a.city}
                  </div>
                  {a.deliveryNote && (
                    <div className="mt-1 text-caption text-body line-clamp-2">
                      Ghi chú: {a.deliveryNote}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-sm flex flex-wrap items-center justify-end gap-xs">
                {!a.isDefault && (
                  <Button size="sm" variant="secondary" onClick={() => setDefault(a.id)}>
                    Đặt mặc định
                  </Button>
                )}
                <Button size="sm" variant="secondary" leadingIcon="edit" onClick={() => openEdit(a)}>
                  Sửa
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  leadingIcon="trash"
                  className="!text-error !border-error/40 hover:!bg-[#fbeaea]"
                  onClick={() => setConfirmDelete(a.id)}
                >
                  Xoá
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Editor modal */}
      <Modal
        open={editor.open}
        onClose={close}
        title={editor.mode === 'create' ? 'Thêm địa chỉ mới' : 'Chỉnh sửa địa chỉ'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={editor.submitting}>
              Hủy
            </Button>
            <Button onClick={submit} disabled={editor.submitting}>
              {editor.mode === 'create' ? 'Lưu địa chỉ' : 'Cập nhật'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="flex flex-col gap-sm">
          <div className="flex flex-col gap-1">
            <label className="text-body-sm font-medium text-ink">Nhãn địa chỉ</label>
            <Input
              placeholder="Nhà, Văn phòng..."
              value={editor.values.label}
              onChange={(e) => setEditor((c) => ({ ...c, values: { ...c.values, label: e.target.value }, fieldErrors: { ...c.fieldErrors, label: undefined } }))}
              error={editor.fieldErrors?.label}
            />
          </div>
          <div className="grid grid-cols-2 gap-sm">
            <div className="flex flex-col gap-1">
              <label className="text-body-sm font-medium text-ink">Tên người nhận</label>
              <Input
                placeholder="Nguyễn Văn A"
                value={editor.values.recipientName}
                onChange={(e) => setEditor((c) => ({ ...c, values: { ...c.values, recipientName: e.target.value }, fieldErrors: { ...c.fieldErrors, recipientName: undefined } }))}
                error={editor.fieldErrors?.recipientName}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-body-sm font-medium text-ink">Số điện thoại</label>
              <Input
                placeholder="09..."
                type="tel"
                value={editor.values.recipientPhone}
                onChange={(e) => setEditor((c) => ({ ...c, values: { ...c.values, recipientPhone: e.target.value }, fieldErrors: { ...c.fieldErrors, recipientPhone: undefined } }))}
                error={editor.fieldErrors?.recipientPhone}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-sm">
            <div className="flex flex-col gap-1">
              <label className="text-body-sm font-medium text-ink">Tỉnh/Thành phố</label>
              <select
                className={`flex h-11 w-full items-center rounded-md border ${editor.fieldErrors?.city ? 'border-red-500' : 'border-hairline-strong'} bg-surface bg-transparent px-3 text-body-base text-ink focus:border-ink hover:border-ink focus:outline-none`}
                value={selectedProvinceCode}
                onChange={(e) => {
                  const code = e.target.value;
                  const name = e.target.options[e.target.selectedIndex].text;
                  setSelectedProvinceCode(code);
                  setEditor((c) => ({ ...c, values: { ...c.values, city: code ? name : '' }, fieldErrors: { ...c.fieldErrors, city: undefined } }));
                }}
              >
                <option value="">Chọn Tỉnh/Thành phố</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
              {editor.fieldErrors?.city && <div className="text-xs text-red-500 mt-1">{editor.fieldErrors.city}</div>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-body-sm font-medium text-ink">Phường/Xã</label>
              <select
                className={`flex h-11 w-full items-center rounded-md border ${editor.fieldErrors?.ward ? 'border-red-500' : 'border-hairline-strong'} bg-surface bg-transparent px-3 text-body-base text-ink focus:border-ink hover:border-ink focus:outline-none disabled:opacity-50`}
                value={selectedWardCode}
                onChange={(e) => {
                  const code = e.target.value;
                  const name = e.target.options[e.target.selectedIndex].text;
                  setSelectedWardCode(code);
                  setEditor((c) => ({ ...c, values: { ...c.values, ward: code ? name : '' }, fieldErrors: { ...c.fieldErrors, ward: undefined } }));
                }}
                disabled={!selectedProvinceCode}
              >
                <option value="">Chọn Phường/Xã</option>
                {wards.map((w) => (
                  <option key={w.code} value={w.code}>{w.name}</option>
                ))}
              </select>
              {editor.fieldErrors?.ward && <div className="text-xs text-red-500 mt-1">{editor.fieldErrors.ward}</div>}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-body-sm font-medium text-ink">Địa chỉ cụ thể</label>
            <Input
              placeholder="Số nhà, tên đường..."
              value={editor.values.line1}
              onChange={(e) => setEditor((c) => ({ ...c, values: { ...c.values, line1: e.target.value }, fieldErrors: { ...c.fieldErrors, line1: undefined } }))}
              error={editor.fieldErrors?.line1}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-body-sm font-medium text-ink">Ghi chú giao hàng</label>
            <Input
              placeholder="Ghi chú giao hàng (tuỳ chọn)..."
              value={editor.values.deliveryNote}
              onChange={(e) => setEditor((c) => ({ ...c, values: { ...c.values, deliveryNote: e.target.value } }))}
            />
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Xoá địa chỉ này?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Giữ lại
            </Button>
            <Button
              className="!bg-error !border-error hover:!bg-error/90"
              onClick={removeAddr}
            >
              Xoá địa chỉ
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-body">
          Bạn sẽ không thể khôi phục lại địa chỉ này. Các đơn hàng đã sử dụng địa chỉ vẫn được giữ nguyên.
        </p>
      </Modal>
    </div>
  );
}
