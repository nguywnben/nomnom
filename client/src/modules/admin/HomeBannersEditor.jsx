import { useCallback, useEffect, useState } from 'react';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import Input, { Textarea } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Switch from '../../components/Switch.jsx';
import { useApp } from '../../context/AppContext.jsx';
import {
  createAdminHomeBannerApi,
  deleteAdminHomeBannerApi,
  fetchAdminHomeBannersApi,
  reorderAdminHomeBannersApi,
  updateAdminHomeBannerApi,
} from '../../lib/api.js';

const EMPTY_BANNER = {
  tag: '',
  title: '',
  subtitle: '',
  ctaLabel: '',
  imageUrl: '',
  linkUrl: '/app/search',
  isActive: true,
};

export default function HomeBannersEditor({ maxItems = 6 }) {
  const { pushToast } = useApp();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState(EMPTY_BANNER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draggedId, setDraggedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchAdminHomeBannersApi();
      setBanners(response.data ?? []);
    } catch (loadError) {
      setError(loadError.message || 'Không thể tải banner.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
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

  const save = async () => {
    if (!editor?.id && banners.length >= maxItems) {
      setError(`Chỉ được tạo tối đa ${maxItems} banner.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = editor?.id
        ? await updateAdminHomeBannerApi(editor.id, draft)
        : await createAdminHomeBannerApi(draft);
      setBanners((items) => editor?.id
        ? items.map((item) => item.id === response.banner.id ? response.banner : item)
        : [...items, response.banner]);
      setEditor(null);
      pushToast({ kind: 'success', title: 'Đã lưu banner', message: response.banner.title });
    } catch (saveError) {
      setError(saveError.message || 'Không thể lưu banner.');
    } finally {
      setSaving(false);
    }
  };

  const reorder = async (targetId) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    const next = [...banners];
    const from = next.findIndex((item) => item.id === draggedId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    next.splice(to, 0, next.splice(from, 1)[0]);
    setBanners(next);
    setDraggedId(null);
    try {
      await reorderAdminHomeBannersApi(next.map((item) => item.id));
    } catch (reorderError) {
      pushToast({ kind: 'error', title: 'Không thể đổi thứ tự', message: reorderError.message });
      load();
    }
  };

  const toggle = async (banner) => {
    try {
      const response = await updateAdminHomeBannerApi(banner.id, { isActive: !banner.isActive });
      setBanners((items) => items.map((item) => item.id === banner.id ? response.banner : item));
    } catch (toggleError) {
      pushToast({ kind: 'error', title: 'Không thể cập nhật', message: toggleError.message });
    }
  };

  const remove = async (banner) => {
    if (!confirm(`Xóa banner "${banner.title}"?`)) return;
    try {
      await deleteAdminHomeBannerApi(banner.id);
      setBanners((items) => items.filter((item) => item.id !== banner.id));
    } catch (removeError) {
      pushToast({ kind: 'error', title: 'Không thể xóa', message: removeError.message });
    }
  };

  return (
    <Card padded>
      <div className="mb-base flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-title-md text-ink">Banner chiến dịch</div>
          <p className="mt-1 text-caption text-body">Kéo thả để đổi thứ tự. Tối đa {maxItems} thẻ.</p>
        </div>
        <Button
          variant="secondary"
          leadingIcon="plus"
          size="sm"
          disabled={loading || banners.length >= maxItems}
          onClick={() => { setDraft(EMPTY_BANNER); setEditor({}); }}
        >
          Thêm banner
        </Button>
      </div>

      {error && <div className="mb-base rounded-md border border-error bg-[#fbeaea] p-sm text-body-sm text-error">{error}</div>}
      {!loading && banners.length === 0 && <p className="text-body-sm text-body">Chưa có banner chiến dịch.</p>}

      <div className="grid gap-base md:grid-cols-2 xl:grid-cols-3">
        {banners.map((banner) => (
          <Card
            key={banner.id}
            padded={false}
            hover={false}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move';
              setDraggedId(banner.id);
            }}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(event) => {
              event.preventDefault();
              reorder(banner.id);
            }}
            className="cursor-grab overflow-hidden active:cursor-grabbing"
          >
            <img draggable={false} src={banner.imageUrl} alt="" className="aspect-[4/3] w-full select-none object-cover" />
            <div className="flex min-h-[116px] flex-col p-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate text-title-md text-ink">{banner.title}</div>
                <div className="truncate text-caption text-body">{banner.tag}</div>
                <div className="line-clamp-1 text-caption text-body">{banner.subtitle}</div>
              </div>
              <div className="mt-sm flex items-center justify-between gap-sm">
                <div className="shrink-0">
                  <Switch checked={banner.isActive} onChange={() => toggle(banner)} label={banner.isActive ? 'Hiển thị' : 'Ẩn'} />
                </div>
                <div className="flex shrink-0 gap-xxs">
                  <IconButton icon="edit" label="Sửa banner" variant="secondary" size="sm" onClick={() => { setDraft({ ...banner }); setEditor(banner); }} />
                  <IconButton icon="trash" label="Xóa banner" size="sm" className="text-error" onClick={() => remove(banner)} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={Boolean(editor)}
        onClose={() => !saving && setEditor(null)}
        title={editor?.id ? 'Sửa banner' : 'Thêm banner'}
        size="md"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setEditor(null)}>Hủy</Button>
            <Button loading={saving} onClick={save}>Lưu</Button>
          </>
        )}
      >
        <div className="space-y-sm">
          <Input label="Nhãn" placeholder="VD: Món mới, Ưu đãi" value={draft.tag} onChange={(event) => setDraft({ ...draft, tag: event.target.value })} />
          <Input label="Tiêu đề" placeholder="VD: Khám phá hương vị ẩm thực mới" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          <Textarea label="Mô tả" rows={2} placeholder="VD: Giảm ngay 30% cho các món best-seller trong tuần..." value={draft.subtitle} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} />
          <Input label="Nhãn nút" placeholder="VD: Đặt món ngay" value={draft.ctaLabel} onChange={(event) => setDraft({ ...draft, ctaLabel: event.target.value })} />
          <Input label="Liên kết nội bộ" placeholder="/app/search" value={draft.linkUrl} hint="Ví dụ: /app/search" onChange={(event) => setDraft({ ...draft, linkUrl: event.target.value })} />
          <ImageUploader value={draft.imageUrl} onUploaded={(url) => setDraft({ ...draft, imageUrl: url })} folder="home-banners" aspectRatio="video" className="items-start" />
          <Switch checked={draft.isActive} onChange={(value) => setDraft({ ...draft, isActive: value })} label="Hiển thị trên trang chủ" />
        </div>
      </Modal>
    </Card>
  );
}
