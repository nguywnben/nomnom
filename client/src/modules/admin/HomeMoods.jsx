import { useCallback, useEffect, useState } from 'react';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import Input, { Textarea } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Switch from '../../components/Switch.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { fetchAdminCustomerHomeApi, updateAdminCustomerHomeApi } from '../../lib/api.js';

const emptyMood = () => ({ id: `mood-${Date.now().toString(36)}`, label: '', subtitle: '', imageUrl: '', linkUrl: '/app/search', isVisible: true });

export default function AdminHomeMoods({ embedded = false, onSaved }) {
  const { pushToast } = useApp();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setConfig((await fetchAdminCustomerHomeApi()).config); }
    catch (error) { pushToast({ kind: 'error', title: 'Không thể tải theo tâm trạng', message: error.message }); }
    finally { setLoading(false); }
  }, [pushToast]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const clearDragState = () => setDraggedId(null);
    window.addEventListener('dragend', clearDragState);
    window.addEventListener('drop', clearDragState);
    return () => {
      window.removeEventListener('dragend', clearDragState);
      window.removeEventListener('drop', clearDragState);
    };
  }, []);

  const updateMoods = (moods) => setConfig((current) => ({ ...current, moods: moods.map((mood, index) => ({ ...mood, sortOrder: index + 1 })) }));
  const save = async () => {
    setSaving(true);
    try {
      const result = await updateAdminCustomerHomeApi(config);
      setConfig(result.config);
      await onSaved?.();
      pushToast({ kind: 'success', title: 'Đã cập nhật theo tâm trạng' });
    }
    catch (error) { pushToast({ kind: 'error', title: 'Không thể lưu', message: error.message }); }
    finally { setSaving(false); }
  };
  const reorder = (targetId) => {
    if (!draggedId || draggedId === targetId) { setDraggedId(null); return; }
    const moods = [...config.moods]; const from = moods.findIndex((mood) => mood.id === draggedId); const to = moods.findIndex((mood) => mood.id === targetId);
    moods.splice(to, 0, moods.splice(from, 1)[0]); updateMoods(moods); setDraggedId(null);
  };
  const submitDraft = () => {
    if (editingId) updateMoods(config.moods.map((mood) => mood.id === editingId ? { ...draft, id: editingId } : mood));
    else updateMoods([...config.moods, draft]);
    setDraft(null); setEditingId(null);
  };

  const removeMood = (id) => {
    if (config.moods.length <= 1) {
      pushToast({ kind: 'error', title: 'Cần giữ lại ít nhất một thẻ' });
      return;
    }
    updateMoods(config.moods.filter((mood) => mood.id !== id));
  };

  if (loading || !config) return <div className="py-section text-center text-body-sm text-body">Đang tải theo tâm trạng...</div>;
  return (
    <div className="space-y-lg">
      {!embedded && (
        <div>
          <div className="text-caption-uppercase text-body">Nội dung khách hàng</div>
          <h1 className="text-display-lg text-ink">Theo tâm trạng</h1>
        </div>
      )}
      <Card padded>
        <div className="mb-base flex flex-wrap items-end justify-between gap-sm">
          <div>
            <div className="text-title-md text-ink">Theo tâm trạng</div>
            <p className="mt-1 text-caption text-body">Kéo thả để đổi thứ tự. Tối đa 8 thẻ.</p>
          </div>
          <div className="flex flex-wrap gap-xs">
            <Button variant="secondary" leadingIcon="refresh" size="sm" onClick={load}>Làm mới</Button>
            <Button variant="secondary" leadingIcon="plus" size="sm" disabled={config.moods.length >= 8} onClick={() => { setDraft(emptyMood()); setEditingId(null); }}>Thêm thẻ</Button>
            <Button leadingIcon="check" size="sm" loading={saving} onClick={save}>Lưu thay đổi</Button>
          </div>
        </div>
        <div className="grid gap-base md:grid-cols-2 xl:grid-cols-4">
          {config.moods.map((mood) => (
            <Card
              key={mood.id}
              padded={false}
              hover={false}
              draggable
              onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; setDraggedId(mood.id); }}
              onDragEnd={() => setDraggedId(null)}
              onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
              onDrop={(event) => { event.preventDefault(); reorder(mood.id); }}
              className={`cursor-grab overflow-hidden active:cursor-grabbing ${draggedId === mood.id ? 'opacity-50' : ''}`}
            >
              <img draggable={false} src={mood.imageUrl} alt="" className="aspect-[4/3] w-full select-none object-cover" />
              <div className="space-y-xs p-sm">
                <div className="flex gap-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-title-md text-ink">{mood.label}</div>
                    <div className="line-clamp-2 text-caption text-body">{mood.subtitle}</div>
                  </div>
                  <div className="flex shrink-0 gap-xxs">
                    <IconButton icon="edit" label="Sửa thẻ" variant="secondary" size="sm" onClick={() => { setDraft({ ...mood }); setEditingId(mood.id); }} />
                    <IconButton icon="trash" label="Xóa thẻ" size="sm" className="text-error" onClick={() => removeMood(mood.id)} />
                  </div>
                </div>
                <Switch checked={mood.isVisible} onChange={(value) => updateMoods(config.moods.map((item) => item.id === mood.id ? { ...item, isVisible: value } : item))} label={mood.isVisible ? 'Hiển thị' : 'Ẩn'} />
              </div>
            </Card>
          ))}
        </div>
      </Card>
      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={editingId ? 'Sửa thẻ theo tâm trạng' : 'Thêm thẻ theo tâm trạng'}
        size="md"
        footer={<><Button variant="secondary" onClick={() => setDraft(null)}>Hủy</Button><Button disabled={!draft?.label?.trim() || !draft?.imageUrl || !draft?.linkUrl?.startsWith('/')} onClick={submitDraft}>Xong</Button></>}
      >
        <div className="space-y-sm">
          <Input label="Tiêu đề" value={draft?.label ?? ''} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
          <Textarea label="Mô tả ngắn" rows={2} value={draft?.subtitle ?? ''} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} />
          <Input label="Liên kết nội bộ" hint="Ví dụ: /app/search?cuisine=italian" value={draft?.linkUrl ?? ''} onChange={(event) => setDraft({ ...draft, linkUrl: event.target.value })} />
          <ImageUploader value={draft?.imageUrl ?? ''} onUploaded={(url) => setDraft({ ...draft, imageUrl: url })} folder="home-moods" aspectRatio="video" className="items-start" />
          <Switch checked={draft?.isVisible ?? true} onChange={(value) => setDraft({ ...draft, isVisible: value })} label="Hiển thị trên trang chủ" />
        </div>
      </Modal>
    </div>
  );
}
