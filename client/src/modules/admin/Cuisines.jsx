import { useCallback, useEffect, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Input from '../../components/Input.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import Modal from '../../components/Modal.jsx';
import Switch from '../../components/Switch.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { createAdminCuisineApi, deleteAdminCuisineApi, fetchAdminCuisinesApi, reorderAdminCuisinesApi, updateAdminCuisineApi } from '../../lib/api.js';

const EMPTY_CUISINE = { name: '', iconUrl: '', isActive: true };

function toDraft(cuisine) {
  return cuisine ? { name: cuisine.name, iconUrl: cuisine.iconUrl || '', isActive: cuisine.isActive } : EMPTY_CUISINE;
}

export default function AdminCuisines() {
  const { pushToast } = useApp();
  const [cuisines, setCuisines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [draft, setDraft] = useState(EMPTY_CUISINE);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [draggedId, setDraggedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAdminCuisinesApi();
      setCuisines(response.data ?? []);
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải loại hình ẩm thực.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditor({ mode: 'create' }); setDraft(EMPTY_CUISINE); setFormError(''); };
  const openEdit = (cuisine) => { setEditor({ mode: 'edit', cuisine }); setDraft(toDraft(cuisine)); setFormError(''); };
  const closeEditor = () => { if (!saving) setEditor(null); };
  const setField = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    setFormError('');
    const payload = { ...draft };
    try {
      const response = editor.mode === 'create' ? await createAdminCuisineApi(payload) : await updateAdminCuisineApi(editor.cuisine.id, payload);
      const saved = response.cuisine;
      setCuisines((current) => {
        const next = editor.mode === 'create' ? [...current, saved] : current.map((item) => (item.id === saved.id ? saved : item));
        return next.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      });
      setEditor(null);
      pushToast({ kind: 'success', title: editor.mode === 'create' ? 'Đã tạo loại ẩm thực' : 'Đã lưu thay đổi', message: saved.name });
    } catch (err) {
      setFormError(err.message || 'Không thể lưu loại hình ẩm thực.');
    } finally { setSaving(false); }
  };

  const toggleActive = async (cuisine) => {
    try {
      const response = await updateAdminCuisineApi(cuisine.id, { isActive: !cuisine.isActive });
      setCuisines((current) => current.map((item) => (item.id === cuisine.id ? response.cuisine : item)));
      pushToast({ kind: 'success', title: response.cuisine.isActive ? 'Đã hiển thị loại ẩm thực' : 'Đã ẩn loại ẩm thực', message: response.cuisine.name });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể cập nhật', message: err.message || 'Vui lòng thử lại.' });
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteAdminCuisineApi(deleteTarget.id);
      setCuisines((current) => current.filter((item) => item.id !== deleteTarget.id));
      pushToast({ kind: 'success', title: 'Đã xóa loại ẩm thực', message: deleteTarget.name });
      setDeleteTarget(null);
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể xóa', message: err.message || 'Loại ẩm thực này có thể đang được sử dụng.' });
    } finally { setSaving(false); }
  };

  const reorder = async (targetId) => {
    if (!draggedId || draggedId === targetId) return setDraggedId(null);
    const previous = cuisines;
    const sourceIndex = previous.findIndex((item) => item.id === draggedId);
    const targetIndex = previous.findIndex((item) => item.id === targetId);
    const next = [...previous];
    [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
    setCuisines(next.map((item, index) => ({ ...item, sortOrder: index + 1 })));
    setDraggedId(null);
    try {
      await reorderAdminCuisinesApi(next.map((item) => item.id));
    } catch (err) {
      setCuisines(previous);
      pushToast({ kind: 'error', title: 'Không thể sắp xếp', message: err.message || 'Vui lòng thử lại.' });
    }
  };

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Danh mục nền tảng</div>
          <h1 className="text-display-lg text-ink">Loại hình ẩm thực</h1>
          <p className="mt-xs text-body-sm text-body">Quản lý danh sách hiển thị cho khách hàng và biểu mẫu đăng ký quán.</p>
        </div>
        <div className="flex gap-xs"><Button variant="secondary" leadingIcon="refresh" loading={loading} onClick={load}>Làm mới</Button><Button leadingIcon="plus" onClick={openCreate}>Thêm loại</Button></div>
      </div>

      {error && <div className="rounded-md border border-error bg-[#fbeaea] p-sm text-body-sm text-error" role="alert">{error}</div>}
      <div>
        {loading && !cuisines.length ? <div className="py-section text-center text-body-sm text-body" role="status">Đang tải loại hình ẩm thực...</div> : cuisines.length === 0 ? (
          <EmptyState icon="grid" title="Chưa có loại hình ẩm thực" description="Tạo loại đầu tiên để quán có thể lựa chọn khi đăng ký." action={<Button leadingIcon="plus" onClick={openCreate}>Thêm loại</Button>} />
        ) : <div className="grid gap-xs p-sm sm:grid-cols-4 xl:grid-cols-5">
          {cuisines.map((cuisine) => <Card key={cuisine.id} padded={false} hover={false} draggable onDragStart={() => setDraggedId(cuisine.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorder(cuisine.id)} onDragEnd={() => setDraggedId(null)} className={'overflow-hidden cursor-grab active:cursor-grabbing ' + (draggedId === cuisine.id ? 'opacity-50' : '')}>
            <div className="relative aspect-[4/3] bg-canvas-soft">
              {cuisine.iconUrl ? <img src={cuisine.iconUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-body"><span className="text-title-md">{cuisine.name.slice(0, 1)}</span></div>}
              <div className="absolute right-sm top-sm"><Badge tone={cuisine.isActive ? 'success' : 'outline'}>{cuisine.isActive ? 'Hiển thị' : 'Đang ẩn'}</Badge></div>
            </div>
            <div className="p-sm">
              <div className="truncate text-body-md font-semibold text-ink">{cuisine.name}</div>
              <div className="mt-1 text-caption text-body">{cuisine.restaurantCount} quán đang dùng</div>
              <div className="mt-sm flex items-center justify-between gap-xxs border-t border-hairline pt-xs"><Switch checked={cuisine.isActive} onChange={() => toggleActive(cuisine)} label={cuisine.isActive ? 'Hiển thị' : 'Ẩn'} /><div className="flex gap-xxs"><IconButton icon="edit" label={'Sửa ' + cuisine.name} variant="secondary" size="sm" onClick={() => openEdit(cuisine)} /><IconButton icon="trash" label={'Xóa ' + cuisine.name} size="sm" className="text-error hover:bg-[#fbeaea]" onClick={() => setDeleteTarget(cuisine)} /></div></div>
            </div>
          </Card>)}
        </div>}
      </div>

      <Modal open={Boolean(editor)} onClose={closeEditor} title={editor?.mode === 'create' ? 'Thêm loại hình ẩm thực' : 'Sửa loại hình ẩm thực'} size="sm" footer={<><Button variant="secondary" disabled={saving} onClick={closeEditor}>Hủy</Button><Button loading={saving} onClick={save}>{editor?.mode === 'create' ? 'Tạo loại' : 'Lưu thay đổi'}</Button></>}>
        <div className="space-y-sm">
          {formError && <div className="rounded-md border border-error bg-[#fbeaea] p-sm text-body-sm text-error" role="alert">{formError}</div>}
          <Input id="cuisine-name" label="Tên loại ẩm thực" required value={draft.name} onChange={(event) => setField('name', event.target.value)} placeholder="Ví dụ: Món Việt" />
          <ImageUploader value={draft.iconUrl} onUploaded={(url) => setField('iconUrl', url)} folder="cuisine" aspectRatio="video" className="items-start" />
          <Switch checked={draft.isActive} onChange={(value) => setField('isActive', value)} label="Hiển thị cho khách hàng" hint="Tắt mục này sẽ ẩn loại khỏi tìm kiếm và đăng ký quán mới." />
        </div>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => !saving && setDeleteTarget(null)} title="Xóa loại hình ẩm thực" size="sm" footer={<><Button variant="secondary" disabled={saving} onClick={() => setDeleteTarget(null)}>Hủy</Button><Button className="border-error bg-error text-on-dark hover:bg-error/90" loading={saving} onClick={remove}>Xóa</Button></>}>
        <p className="text-body-sm text-body">Xóa <strong className="text-ink">{deleteTarget?.name}</strong>? Thao tác này chỉ thực hiện được khi chưa có quán nào sử dụng loại này.</p>
      </Modal>
    </div>
  );
}
