import { useCallback, useState, useEffect } from 'react';

import Badge from '../../../components/Badge.jsx';
import Button from '../../../components/Button.jsx';
import Card from '../../../components/Card.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import Icon from '../../../components/Icon.jsx';
import Input, { Select } from '../../../components/Input.jsx';
import Modal from '../../../components/Modal.jsx';
import Skeleton from '../../../components/Skeleton.jsx';
import { useApp } from '../../../context/AppContext.jsx';
import ProfileSubHeader from './ProfileSubHeader.jsx';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../lib/api.js';
import { createAdministrativeLocationsApi } from '../../../lib/administrativeLocations.js';

const locationsApi = createAdministrativeLocationsApi(apiGet);

const EMPTY_FORM = {
  label: '',
  recipientName: '',
  recipientPhone: '',
  line1: '',
  ward: '',
  district: '',
  city: '',
  deliveryNote: '',
};


function normalizeLocationName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(thanh pho|tp\.|tinh|quan|huyen|thi xa|phuong|xa|thi tran)\s+/i, '')
    .trim();
}

function findMatchingLocation(list, targetName) {
  if (!list?.length || !targetName) return null;
  const targetNorm = normalizeLocationName(targetName);
  let found = list.find((item) => normalizeLocationName(item.name) === targetNorm);
  if (found) return found;
  found = list.find(
    (item) =>
      normalizeLocationName(item.name).includes(targetNorm) ||
      targetNorm.includes(normalizeLocationName(item.name))
  );
  return found || null;
}

export default function Addresses() {
  const { pushToast, permittedRoles } = useApp();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editor, setEditor] = useState({ open: false, mode: 'create', id: null, values: EMPTY_FORM, submitting: false, fieldErrors: {} });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDefault, setConfirmDefault] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');

  useEffect(() => { locationsApi.getProvinces().then(setProvinces).catch(() => setProvinces([])); }, []);
  useEffect(() => { if (!selectedProvinceCode) { setWards([]); return; } locationsApi.getWards(selectedProvinceCode).then(setWards).catch(() => setWards([])); }, [selectedProvinceCode]);


  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/v1/me/addresses');
      setList(data);
    } catch {
      pushToast({ kind: 'error', title: 'Lỗi', message: 'Không thể tải danh sách địa chỉ.' });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    if (permittedRoles.customer) {
      loadAddresses();
    }
  }, [loadAddresses, permittedRoles.customer]);

  const openCreate = () => {
    setSelectedProvinceCode('');
    setSelectedWardCode('');
    setEditor({ open: true, mode: 'create', id: null, values: EMPTY_FORM, submitting: false, fieldErrors: {} });
  };

  const openEdit = async (addr) => {
    setEditor({
      open: true,
      mode: 'edit',
      id: addr.id,
      values: {
        label: addr.label || '',
        recipientName: addr.recipientName || '',
        recipientPhone: addr.recipientPhone && addr.recipientPhone !== 'null' ? addr.recipientPhone : '',
        line1: addr.line1 || '',
        ward: addr.ward || '',
        district: addr.district || '',
        city: addr.city || '',
        deliveryNote: addr.deliveryNote || '',
      },
      submitting: false,
      fieldErrors: {}
    });

    let provList = provinces;
    if (!provList.length) {
      try {
        provList = await locationsApi.getProvinces();
        setProvinces(provList);
      } catch {
        provList = [];
      }
    }

    const matchedProvince = findMatchingLocation(provList, addr.city);
    if (matchedProvince) {
      setSelectedProvinceCode(matchedProvince.code);
      try {
        const wardList = await locationsApi.getWards(matchedProvince.code);
        setWards(wardList);
        const matchedWard = findMatchingLocation(wardList, addr.ward);
        if (matchedWard) {
          setSelectedWardCode(matchedWard.code);
        } else {
          setSelectedWardCode('');
        }
      } catch {
        setWards([]);
        setSelectedWardCode('');
      }
    } else {
      setSelectedProvinceCode('');
      setSelectedWardCode('');
    }
  };

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
    } catch {
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
    } catch {
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
        <div className="flex flex-col gap-sm">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} padded>
              <div className="flex items-start gap-sm">
                <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16 rounded-pill" />
                  </div>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3.5 w-64" />
                </div>
              </div>
            </Card>
          ))}
        </div>
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
                    {a.recipientName}{a.recipientPhone && a.recipientPhone !== 'null' ? ` - ${a.recipientPhone}` : ''}
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
                  <Button size="sm" variant="secondary" onClick={() => setConfirmDefault(a.id)}>
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
              <Select value={selectedProvinceCode} options={[{ value: '', label: 'Chọn Tỉnh/Thành phố' }, ...provinces.map((item) => ({ value: item.code, label: item.name }))]} onChange={(e) => { const item = provinces.find((value) => value.code === e.target.value); setSelectedProvinceCode(e.target.value); setSelectedWardCode(''); setEditor((c) => ({ ...c, values: { ...c.values, city: item?.name ?? '', district: '', ward: '' }, fieldErrors: { ...c.fieldErrors, city: undefined } })); }} error={editor.fieldErrors?.city} />
              {editor.fieldErrors?.city && <div className="text-xs text-red-500 mt-1">{editor.fieldErrors.city}</div>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-body-sm font-medium text-ink">Phường/Xã</label>
              <Select value={selectedWardCode} disabled={!selectedProvinceCode} options={[{ value: '', label: selectedProvinceCode ? 'Chọn Phường/Xã' : 'Chọn Tỉnh/Thành phố trước' }, ...wards.map((item) => ({ value: item.code, label: item.name }))]} onChange={(e) => { const item = wards.find((value) => value.code === e.target.value); setSelectedWardCode(e.target.value); setEditor((c) => ({ ...c, values: { ...c.values, ward: item?.name ?? '' }, fieldErrors: { ...c.fieldErrors, ward: undefined } })); }} error={editor.fieldErrors?.ward} />
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

      {/* Set Default confirmation */}
      <Modal
        open={Boolean(confirmDefault)}
        onClose={() => setConfirmDefault(null)}
        title="Đặt làm địa chỉ mặc định"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDefault(null)}>
              Hủy
            </Button>
            <Button
              onClick={async () => {
                const id = confirmDefault;
                setConfirmDefault(null);
                await setDefault(id);
              }}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-body">
          Bạn có chắc chắn muốn đặt địa chỉ{' '}
          <strong className="text-ink">
            {list.find((x) => x.id === confirmDefault)?.label || 'này'}
          </strong>{' '}
          làm địa chỉ mặc định cho các đơn hàng tiếp theo không?
        </p>
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
