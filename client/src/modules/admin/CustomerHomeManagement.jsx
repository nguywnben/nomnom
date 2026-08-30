import { useCallback, useEffect, useState } from 'react';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import Input, { Textarea } from '../../components/Input.jsx';
import Switch from '../../components/Switch.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { fetchAdminCustomerHomeApi, updateAdminCustomerHomeApi } from '../../lib/api.js';
import HomeBannersEditor from './HomeBannersEditor.jsx';
import HomeMoodsEditor from './HomeMoodsEditor.jsx';

export default function CustomerHomeManagement() {
  const { pushToast } = useApp();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminCustomerHomeApi();
      setConfig(result.config);
    } catch (error) {
      pushToast({ kind: 'error', title: 'Không thể tải trang chủ', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => { load(); }, [load]);

  const setHero = (key, value) => setConfig((current) => ({
    ...current,
    hero: { ...current.hero, [key]: value },
  }));

  const toggleSection = (id, isVisible) => setConfig((current) => ({
    ...current,
    sections: current.sections.map((section) => section.id === id ? { ...section, isVisible } : section),
  }));

  const setMoods = (moods) => setConfig((current) => ({ ...current, moods }));

  const reorder = (targetId) => {
    if (!draggedId || draggedId === targetId) return;
    setConfig((current) => {
      const sections = [...current.sections];
      const from = sections.findIndex((section) => section.id === draggedId);
      const to = sections.findIndex((section) => section.id === targetId);
      sections.splice(to, 0, sections.splice(from, 1)[0]);
      return { ...current, sections: sections.map((section, index) => ({ ...section, sortOrder: index + 1 })) };
    });
    setDraggedId(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      const result = await updateAdminCustomerHomeApi(config);
      setConfig(result.config);
      pushToast({ kind: 'success', title: 'Đã cập nhật trang chủ khách hàng' });
    } catch (error) {
      pushToast({ kind: 'error', title: 'Không thể lưu', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) return <div className="py-section text-center text-body-sm text-body">Đang tải cấu hình trang chủ...</div>;

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Nội dung khách hàng</div>
          <h1 className="text-display-lg text-ink">Trang chủ khách hàng</h1>
          <p className="mt-xs text-body-sm text-body">Quản lý body của /app; header và footer không thay đổi ở đây.</p>
        </div>
        <div className="flex gap-xs">
          <Button leadingIcon="check" loading={saving} onClick={save}>Lưu bố cục</Button>
        </div>
      </div>

      <Card padded>
        <div className="mb-base text-title-md text-ink">Phần đầu trang</div>
        <div className="grid items-start gap-base lg:grid-cols-2">
          <div className="space-y-sm">
            <Input label="Tiêu đề" value={config.hero.title} onChange={(event) => setHero('title', event.target.value)} />
            <Textarea label="Mô tả" rows={4} value={config.hero.subtitle} onChange={(event) => setHero('subtitle', event.target.value)} />
          </div>
          <div><ImageUploader value={config.hero.imageUrl} onUploaded={(url) => setHero('imageUrl', url)} folder="home-hero" aspectRatio="video" className="items-start" /></div>
        </div>
      </Card>

      <HomeBannersEditor maxItems={6} />

      <HomeMoodsEditor moods={config.moods} onChange={setMoods} />

      <Card padded>
        <div className="mb-base">
          <div className="text-title-md text-ink">Các phần trong body</div>
          <p className="mt-1 text-caption text-body">Kéo một mục vào mục khác để đổi vị trí. Tắt để ẩn section đó khỏi /app.</p>
        </div>
        <div className="space-y-xxs">
          {config.sections.map((section, index) => (
            <div key={section.id} draggable onDragStart={() => setDraggedId(section.id)} onDragEnd={() => setDraggedId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorder(section.id)} className="flex cursor-grab items-center gap-sm rounded-md border border-hairline-strong bg-surface-card px-sm py-sm active:cursor-grabbing">
              <span className="nums w-5 text-center text-caption text-body">{index + 1}</span>
              <span className="flex-1 text-body-sm font-semibold text-ink">{section.label}</span>
              <Switch checked={section.isVisible} onChange={(value) => toggleSection(section.id, value)} label={section.isVisible ? 'Hiển thị' : 'Ẩn'} />
              <IconButton icon="menu" label={`Kéo ${section.label}`} variant="secondary" size="sm" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
