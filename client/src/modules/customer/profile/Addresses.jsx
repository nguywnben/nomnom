import { useState } from 'react';

import Badge from '../../../components/Badge.jsx';
import Button from '../../../components/Button.jsx';
import Card from '../../../components/Card.jsx';
import EmptyState from '../../../components/EmptyState.jsx';
import Icon from '../../../components/Icon.jsx';
import Input from '../../../components/Input.jsx';
import Modal from '../../../components/Modal.jsx';
import { useApp } from '../../../context/AppContext.jsx';
import ProfileSubHeader from './ProfileSubHeader.jsx';

// UC-C12 — Quản lý sổ địa chỉ. Mock dataset, in-memory only.
const SEED = [
  {
    id: 'addr-1',
    label: 'Nhà',
    line: '120 Wythe Ave, Apt 3B',
    city: 'Brooklyn, NY 11211',
    note: 'Bấm chuông căn hộ 3B',
    icon: 'pin',
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'Văn phòng',
    line: '88 Holloway St, Tầng 4',
    city: 'Brooklyn, NY 11211',
    note: 'Để tại quầy lễ tân nếu vắng',
    icon: 'store',
    isDefault: false,
  },
];

const EMPTY_FORM = { label: '', line: '', city: '', note: '' };

export default function Addresses() {
  const { pushToast, authedRoles, user } = useApp();
  const [list, setList] = useState(SEED);
  const [editor, setEditor] = useState({ open: false, mode: 'create', id: null, values: EMPTY_FORM });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openCreate = () =>
    setEditor({ open: true, mode: 'create', id: null, values: EMPTY_FORM });

  const openEdit = (addr) =>
    setEditor({
      open: true,
      mode: 'edit',
      id: addr.id,
      values: { label: addr.label, line: addr.line, city: addr.city, note: addr.note ?? '' },
    });

  const close = () => setEditor((c) => ({ ...c, open: false }));

  const submit = (e) => {
    e.preventDefault();
    const v = editor.values;
    if (!v.label.trim() || !v.line.trim() || !v.city.trim()) {
      pushToast({ kind: 'error', title: 'Thiếu thông tin', message: 'Hãy điền đầy đủ nhãn, địa chỉ và thành phố.' });
      return;
    }
    if (editor.mode === 'create') {
      const id = `addr-${Date.now()}`;
      setList((cur) => [
        ...cur,
        { id, label: v.label, line: v.line, city: v.city, note: v.note, icon: 'pin', isDefault: cur.length === 0 },
      ]);
      pushToast({ kind: 'success', title: 'Đã thêm địa chỉ', message: v.label });
    } else {
      setList((cur) => cur.map((a) => (a.id === editor.id ? { ...a, ...v } : a)));
      pushToast({ kind: 'success', title: 'Đã cập nhật', message: v.label });
    }
    close();
  };

  const setDefault = (id) => {
    setList((cur) => cur.map((a) => ({ ...a, isDefault: a.id === id })));
    pushToast({ kind: 'success', title: 'Đã đặt mặc định', message: list.find((x) => x.id === id)?.label });
  };

  const removeAddr = () => {
    const target = list.find((a) => a.id === confirmDelete);
    if (!target) return;
    setList((cur) => {
      const next = cur.filter((a) => a.id !== target.id);
      // If we removed the default, promote the first remaining as default.
      if (target.isDefault && next.length > 0) next[0] = { ...next[0], isDefault: true };
      return next;
    });
    pushToast({ kind: 'info', title: 'Đã xoá địa chỉ', message: target.label });
    setConfirmDelete(null);
  };

  return (
    <div className="flex flex-col gap-base p-base md:container-page md:py-xl">
      <ProfileSubHeader title="Địa chỉ đã lưu" />

      <div className="flex items-center justify-between gap-sm">
        <p className="text-body-sm text-body">
          Lưu địa chỉ để đặt món nhanh hơn ở lần sau.
        </p>
        <Button size="sm" leadingIcon="plus" onClick={openCreate} disabled={!user}>
          Thêm địa chỉ
        </Button>
      </div>

      {!user ? (
        <Card padded>
          <div className="text-title-md text-ink">Cần đăng nhập</div>
          <p className="mt-1 text-body-sm text-body">
            Đăng nhập để lưu và quản lý địa chỉ giao hàng.
          </p>
        </Card>
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
                  <Icon name={a.icon} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-body-sm font-semibold text-ink truncate">{a.label}</div>
                    {a.isDefault && <Badge tone="success" dot>Mặc định</Badge>}
                  </div>
                  <div className="mt-0.5 text-body-sm text-ink truncate">{a.line}</div>
                  <div className="text-caption text-body truncate">{a.city}</div>
                  {a.note && (
                    <div className="mt-1 text-caption text-body line-clamp-2">
                      Ghi chú: {a.note}
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
            <Button variant="secondary" onClick={close}>
              Hủy
            </Button>
            <Button onClick={submit}>{editor.mode === 'create' ? 'Lưu địa chỉ' : 'Cập nhật'}</Button>
          </>
        }
      >
        <form onSubmit={submit} className="flex flex-col gap-sm">
          <Input
            leadingIcon="pin"
            placeholder="Nhãn (Nhà, Văn phòng...)"
            value={editor.values.label}
            onChange={(e) => setEditor((c) => ({ ...c, values: { ...c.values, label: e.target.value } }))}
            required
          />
          <Input
            leadingIcon="store"
            placeholder="Số nhà, đường, toà nhà"
            value={editor.values.line}
            onChange={(e) => setEditor((c) => ({ ...c, values: { ...c.values, line: e.target.value } }))}
            required
          />
          <Input
            placeholder="Quận, thành phố, mã bưu điện"
            value={editor.values.city}
            onChange={(e) => setEditor((c) => ({ ...c, values: { ...c.values, city: e.target.value } }))}
            required
          />
          <Input
            leadingIcon="edit"
            placeholder="Ghi chú cho tài xế (tuỳ chọn)"
            value={editor.values.note}
            onChange={(e) => setEditor((c) => ({ ...c, values: { ...c.values, note: e.target.value } }))}
          />
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
