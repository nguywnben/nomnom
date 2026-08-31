import { useCallback, useEffect, useMemo, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Icon from '../../components/Icon.jsx';
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
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredCuisines = useMemo(() => {
    if (!searchQuery.trim()) return cuisines;
    const q = searchQuery.toLowerCase().trim();
    return cuisines.filter((c) => c.name.toLowerCase().includes(q));
  }, [cuisines, searchQuery]);

  return (
    <div className="space-y-base">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Danh mục & Phân loại</div>
          <h1 className="text-display-lg text-ink">Loại hình Ẩm thực</h1>
          <p className="mt-xs text-body-sm text-body">
            Quản lý danh sách phân loại ẩm thực hiển thị trên trang chủ khách hàng và biểu mẫu đăng ký mở quán.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          <Badge tone="outline">Tổng {cuisines.length} loại</Badge>
          <Badge tone="success" dot>{cuisines.filter((c) => c.isActive).length} hiển thị</Badge>
          <Badge tone="warning" dot>{cuisines.filter((c) => !c.isActive).length} đang ẩn</Badge>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72 shrink-0 h-9">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-body"
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm loại ẩm thực…"
            aria-label="Tìm loại ẩm thực"
            className="h-full w-full rounded-md border border-hairline-strong bg-surface-card pl-9 pr-base text-body-sm text-ink outline-none placeholder:text-muted focus:border-ink transition-colors"
          />
        </div>

        <div className="flex items-center gap-xs justify-end">
          <Button leadingIcon="plus" size="sm" onClick={openCreate}>
            Thêm loại hình
          </Button>
        </div>
      </div>

      {error && <div className="rounded-md border border-error bg-[#fbeaea] p-sm text-body-sm text-error" role="alert">{error}</div>}
      <div>
        {loading && !cuisines.length ? (
          <div className="py-section text-center text-body-sm text-body" role="status">Đang tải loại hình ẩm thực...</div>
        ) : filteredCuisines.length === 0 ? (
          <EmptyState
            icon="grid"
            title={searchQuery ? 'Không tìm thấy loại hình phù hợp' : 'Chưa có loại hình ẩm thực'}
            description={searchQuery ? 'Thử tìm kiếm với từ khóa khác.' : 'Tạo loại đầu tiên để quán có thể lựa chọn khi đăng ký.'}
            action={!searchQuery && <Button leadingIcon="plus" size="sm" onClick={openCreate}>Thêm loại</Button>}
          />
        ) : (
          <div className="grid gap-base md:grid-cols-2 xl:grid-cols-4">
            {filteredCuisines.map((cuisine) => (
              <Card
                key={cuisine.id}
                padded={false}
                hover={false}
                draggable={!searchQuery}
                onDragStart={() => setDraggedId(cuisine.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => reorder(cuisine.id)}
                onDragEnd={() => setDraggedId(null)}
                className={`overflow-hidden ${!searchQuery ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                <div className="relative aspect-[4/3] bg-canvas-soft">
                  {cuisine.iconUrl ? (
                    <img draggable={false} src={cuisine.iconUrl} alt="" className="h-full w-full select-none object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-body"><span className="text-title-md">{cuisine.name.slice(0, 1)}</span></div>
                  )}
                </div>
                <div className="flex min-h-[116px] flex-col p-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-title-md text-ink">{cuisine.name}</div>
                    <div className="text-caption text-body">{cuisine.restaurantCount} quán đang dùng</div>
                  </div>
                  <div className="mt-sm flex items-center justify-between gap-sm">
                    <Switch checked={cuisine.isActive} onChange={() => toggleActive(cuisine)} label={cuisine.isActive ? 'Hiển thị' : 'Ẩn'} />
                    <div className="flex gap-xxs">
                      <IconButton icon="edit" label={'Sửa ' + cuisine.name} variant="secondary" size="sm" onClick={() => openEdit(cuisine)} />
                      <IconButton icon="trash" label={'Xóa ' + cuisine.name} size="sm" className="text-error" onClick={() => setDeleteTarget(cuisine)} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
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
