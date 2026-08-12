import { useEffect, useState } from 'react';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import Input, { Textarea } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Switch from '../../components/Switch.jsx';
import { useApp } from '../../context/AppContext.jsx';

const createEmptyMood = () => ({
  id: `mood-${Date.now().toString(36)}`,
  label: '',
  subtitle: '',
  imageUrl: '',
  linkUrl: '/app/search',
  isVisible: true,
});

export default function HomeMoodsEditor({ moods, onChange }) {
  const { pushToast } = useApp();
  const [draft, setDraft] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);

  useEffect(() => {
    const clearDragState = () => setDraggedId(null);
    window.addEventListener('dragend', clearDragState);
    window.addEventListener('drop', clearDragState);
    window.addEventListener('pointerup', clearDragState);
    return () => {
      window.removeEventListener('dragend', clearDragState);
      window.removeEventListener('drop', clearDragState);
      window.removeEventListener('pointerup', clearDragState);
    };
  }, []);

  const emit = (items) => {
    onChange(items.map((mood, index) => ({ ...mood, sortOrder: index + 1 })));
  };

  const reorder = (targetId) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    const next = [...moods];
    const from = next.findIndex((mood) => mood.id === draggedId);
    const to = next.findIndex((mood) => mood.id === targetId);
    if (from >= 0 && to >= 0) next.splice(to, 0, next.splice(from, 1)[0]);
    emit(next);
    setDraggedId(null);
  };

  const submitDraft = () => {
    if (editingId) emit(moods.map((mood) => mood.id === editingId ? { ...draft, id: editingId } : mood));
    else emit([...moods, draft]);
    setDraft(null);
    setEditingId(null);
  };

  const removeMood = (id) => {
    if (moods.length <= 1) {
      pushToast({ kind: 'error', title: 'Cần giữ lại ít nhất một thẻ' });
      return;
    }
    emit(moods.filter((mood) => mood.id !== id));
  };

  return (
    <Card padded>
      <div className="mb-base flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-title-md text-ink">Theo tâm trạng</div>
          <p className="mt-1 text-caption text-body">Kéo thả để đổi thứ tự. Tối đa 8 thẻ.</p>
        </div>
        <Button
          variant="secondary"
          leadingIcon="plus"
          size="sm"
          disabled={moods.length >= 8}
          onClick={() => { setDraft(createEmptyMood()); setEditingId(null); }}
        >
          Thêm thẻ
        </Button>
      </div>

      <div className="grid gap-base md:grid-cols-2 xl:grid-cols-4">
        {moods.map((mood) => (
          <Card
            key={mood.id}
            padded={false}
            hover={false}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move';
              setDraggedId(mood.id);
            }}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(event) => {
              event.preventDefault();
              reorder(mood.id);
            }}
            className="cursor-grab overflow-hidden active:cursor-grabbing"
          >
            <img draggable={false} src={mood.imageUrl} alt="" className="aspect-[4/3] w-full select-none object-cover" />
            <div className="flex min-h-[116px] flex-col p-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate text-title-md text-ink">{mood.label}</div>
                <div className="line-clamp-2 text-caption text-body">{mood.subtitle}</div>
              </div>
              <div className="mt-sm flex items-center justify-between gap-sm">
                <div className="shrink-0">
                  <Switch checked={mood.isVisible} onChange={(value) => emit(moods.map((item) => item.id === mood.id ? { ...item, isVisible: value } : item))} label={mood.isVisible ? 'Hiển thị' : 'Ẩn'} />
                </div>
                <div className="flex shrink-0 gap-xxs">
                  <IconButton icon="edit" label="Sửa thẻ" variant="secondary" size="sm" onClick={() => { setDraft({ ...mood }); setEditingId(mood.id); }} />
                  <IconButton icon="trash" label="Xóa thẻ" size="sm" className="text-error" onClick={() => removeMood(mood.id)} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={editingId ? 'Sửa thẻ theo tâm trạng' : 'Thêm thẻ theo tâm trạng'}
        size="md"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setDraft(null)}>Hủy</Button>
            <Button disabled={!draft?.label?.trim() || !draft?.imageUrl || !draft?.linkUrl?.startsWith('/')} onClick={submitDraft}>Xong</Button>
          </>
        )}
      >
        <div className="space-y-sm">
          <Input label="Tiêu đề" value={draft?.label ?? ''} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
          <Textarea label="Mô tả ngắn" rows={2} value={draft?.subtitle ?? ''} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} />
          <Input label="Liên kết nội bộ" hint="Ví dụ: /app/search?cuisine=italian" value={draft?.linkUrl ?? ''} onChange={(event) => setDraft({ ...draft, linkUrl: event.target.value })} />
          <ImageUploader value={draft?.imageUrl ?? ''} onUploaded={(url) => setDraft({ ...draft, imageUrl: url })} folder="home-moods" aspectRatio="video" className="items-start" />
          <Switch checked={draft?.isVisible ?? true} onChange={(value) => setDraft({ ...draft, isVisible: value })} label="Hiển thị trên trang chủ" />
        </div>
      </Modal>
    </Card>
  );
}
