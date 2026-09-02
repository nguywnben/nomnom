import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Icon from '../../components/Icon.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import Input, { Textarea } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Switch from '../../components/Switch.jsx';
import Tabs from '../../components/Tabs.jsx';
import { useApp } from '../../context/AppContext.jsx';
import {
  createAdminCuisineApi,
  deleteAdminCuisineApi,
  fetchAdminCuisinesApi,
  fetchAdminCustomerHomeApi,
  reorderAdminCuisinesApi,
  updateAdminCuisineApi,
  updateAdminCustomerHomeApi,
} from '../../lib/api.js';
import { resolveContentTab, shouldLoadContentSection } from '../../lib/contentTabs.js';
import HomeBannersEditor from './HomeBannersEditor.jsx';
import HomeMoodsEditor from './HomeMoodsEditor.jsx';

const EMPTY_CUISINE = { name: '', iconUrl: '', isActive: true };

function toCuisineDraft(cuisine) {
  return cuisine ? { name: cuisine.name, iconUrl: cuisine.iconUrl || '', isActive: cuisine.isActive } : EMPTY_CUISINE;
}

export default function ContentManagement() {
  const { pushToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveContentTab(searchParams);

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    setSearchParams({ tab: newTab });
  };

  // ---------------------------------------------------------------------------
  // TAB 1: BỐ CỤC TRANG CHỦ KHÁCH HÀNG (CMS HOME)
  // ---------------------------------------------------------------------------
  const [homeConfig, setHomeConfig] = useState(null);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeLoaded, setHomeLoaded] = useState(false);
  const [homeSaving, setHomeSaving] = useState(false);
  const [draggedSectionId, setDraggedSectionId] = useState(null);

  const loadHome = useCallback(async () => {
    setHomeLoading(true);
    try {
      const result = await fetchAdminCustomerHomeApi();
      setHomeConfig(result.config);
      setHomeLoaded(true);
    } catch (error) {
      pushToast({ kind: 'error', title: 'Không thể tải trang chủ', message: error.message });
    } finally {
      setHomeLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    if (shouldLoadContentSection(activeTab, 'home', homeLoaded)) {
      loadHome();
    }
  }, [activeTab, homeLoaded, loadHome]);

  const setHero = (key, value) =>
    setHomeConfig((current) => ({
      ...current,
      hero: { ...current.hero, [key]: value },
    }));

  const toggleSection = (id, isVisible) =>
    setHomeConfig((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === id ? { ...section, isVisible } : section,
      ),
    }));

  const setMoods = (moods) =>
    setHomeConfig((current) => ({ ...current, moods }));

  const reorderSections = (targetId) => {
    if (!draggedSectionId || draggedSectionId === targetId) return;
    setHomeConfig((current) => {
      const sections = [...current.sections];
      const from = sections.findIndex((section) => section.id === draggedSectionId);
      const to = sections.findIndex((section) => section.id === targetId);
      sections.splice(to, 0, sections.splice(from, 1)[0]);
      return {
        ...current,
        sections: sections.map((section, index) => ({ ...section, sortOrder: index + 1 })),
      };
    });
    setDraggedSectionId(null);
  };

  const saveHome = async () => {
    setHomeSaving(true);
    try {
      const result = await updateAdminCustomerHomeApi(homeConfig);
      setHomeConfig(result.config);
      pushToast({ kind: 'success', title: 'Đã cập nhật trang chủ khách hàng' });
    } catch (error) {
      pushToast({ kind: 'error', title: 'Không thể lưu', message: error.message });
    } finally {
      setHomeSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // TAB 2: LOẠI HÌNH ẨM THỰC (CUISINES)
  // ---------------------------------------------------------------------------
  const [cuisines, setCuisines] = useState([]);
  const [cuisinesLoading, setCuisinesLoading] = useState(true);
  const [cuisinesLoaded, setCuisinesLoaded] = useState(false);
  const [cuisinesError, setCuisinesError] = useState('');
  const [cuisineEditor, setCuisineEditor] = useState(null);
  const [cuisineDraft, setCuisineDraft] = useState(EMPTY_CUISINE);
  const [cuisineFormError, setCuisineFormError] = useState('');
  const [cuisineSaving, setCuisineSaving] = useState(false);
  const [deleteCuisineTarget, setDeleteCuisineTarget] = useState(null);
  const [draggedCuisineId, setDraggedCuisineId] = useState(null);
  const [cuisineSearchQuery, setCuisineSearchQuery] = useState('');

  const loadCuisines = useCallback(async () => {
    setCuisinesLoading(true);
    try {
      const data = await fetchAdminCuisinesApi();
      setCuisines(data);
      setCuisinesLoaded(true);
      setCuisinesError('');
    } catch (err) {
      setCuisinesError(err.message || 'Không thể tải loại hình ẩm thực.');
    } finally {
      setCuisinesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (shouldLoadContentSection(activeTab, 'cuisines', cuisinesLoaded)) {
      loadCuisines();
    }
  }, [activeTab, cuisinesLoaded, loadCuisines]);

  const openCreateCuisine = () => {
    setCuisineDraft(EMPTY_CUISINE);
    setCuisineFormError('');
    setCuisineEditor({ mode: 'create' });
  };

  const openEditCuisine = (item) => {
    setCuisineDraft(toCuisineDraft(item));
    setCuisineFormError('');
    setCuisineEditor({ mode: 'edit', item });
  };

  const closeCuisineEditor = () => {
    if (!cuisineSaving) setCuisineEditor(null);
  };

  const setCuisineField = (key, value) => {
    setCuisineDraft((prev) => ({ ...prev, [key]: value }));
  };

  const saveCuisine = async () => {
    if (!cuisineDraft.name.trim()) return setCuisineFormError('Tên loại ẩm thực không được để trống.');
    setCuisineSaving(true);
    setCuisineFormError('');
    try {
      if (cuisineEditor.mode === 'create') {
        const created = await createAdminCuisineApi({
          name: cuisineDraft.name.trim(),
          iconUrl: cuisineDraft.iconUrl,
          isActive: cuisineDraft.isActive,
        });
        setCuisines((prev) => [...prev, created]);
        pushToast({ kind: 'success', title: 'Đã thêm loại hình', message: created.name });
      } else {
        const updated = await updateAdminCuisineApi(cuisineEditor.item.id, {
          name: cuisineDraft.name.trim(),
          iconUrl: cuisineDraft.iconUrl,
          isActive: cuisineDraft.isActive,
        });
        setCuisines((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        pushToast({ kind: 'success', title: 'Đã lưu thay đổi', message: updated.name });
      }
      setCuisineEditor(null);
    } catch (err) {
      setCuisineFormError(err.message || 'Không thể lưu loại hình ẩm thực.');
    } finally {
      setCuisineSaving(false);
    }
  };

  const toggleCuisineActive = async (target) => {
    try {
      const updated = await updateAdminCuisineApi(target.id, { isActive: !target.isActive });
      setCuisines((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      pushToast({
        kind: 'success',
        title: updated.isActive ? 'Đã kích hoạt' : 'Đã tạm dừng',
        message: updated.name,
      });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể cập nhật', message: err.message || 'Vui lòng thử lại.' });
    }
  };

  const removeCuisine = async () => {
    if (!deleteCuisineTarget) return;
    setCuisineSaving(true);
    try {
      await deleteAdminCuisineApi(deleteCuisineTarget.id);
      setCuisines((prev) => prev.filter((item) => item.id !== deleteCuisineTarget.id));
      pushToast({ kind: 'success', title: 'Đã xóa loại hình', message: deleteCuisineTarget.name });
      setDeleteCuisineTarget(null);
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể xóa', message: err.message || 'Chỉ xóa được khi chưa có quán dùng.' });
    } finally {
      setCuisineSaving(false);
    }
  };

  const reorderCuisines = async (targetId) => {
    if (!draggedCuisineId || draggedCuisineId === targetId) return setDraggedCuisineId(null);
    const previous = cuisines;
    const sourceIndex = previous.findIndex((item) => item.id === draggedCuisineId);
    const targetIndex = previous.findIndex((item) => item.id === targetId);
    const next = [...previous];
    [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
    setCuisines(next.map((item, index) => ({ ...item, sortOrder: index + 1 })));
    setDraggedCuisineId(null);
    try {
      await reorderAdminCuisinesApi(next.map((item) => item.id));
    } catch (err) {
      setCuisines(previous);
      pushToast({ kind: 'error', title: 'Không thể sắp xếp', message: err.message || 'Vui lòng thử lại.' });
    }
  };

  const filteredCuisines = useMemo(() => {
    if (!cuisineSearchQuery.trim()) return cuisines;
    const q = cuisineSearchQuery.toLowerCase().trim();
    return cuisines.filter((c) => c.name.toLowerCase().includes(q));
  }, [cuisines, cuisineSearchQuery]);

  return (
    <div className="space-y-base">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Giao diện & Danh mục</div>
          <h1 className="text-display-lg text-ink">Quản lý Nội dung & Danh mục</h1>
          <p className="mt-xs text-body-sm text-body">
            Tùy biến bố cục mặt tiền khách hàng, banner quảng cáo, bộ sưu tập tâm trạng và phân loại ẩm thực toàn sàn.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          {activeTab === 'home' && homeConfig && (
            <>
              <Badge tone="outline">{homeConfig.sections?.length || 0} khối bố cục</Badge>
              <Badge tone="success" dot>
                {homeConfig.sections?.filter((s) => s.isVisible).length || 0} đang hiển thị
              </Badge>
            </>
          )}
          {activeTab === 'cuisines' && (
            <>
              <Badge tone="outline">Tổng {cuisines.length} loại</Badge>
              <Badge tone="success" dot>{cuisines.filter((c) => c.isActive).length} hiển thị</Badge>
              <Badge tone="warning" dot>{cuisines.filter((c) => !c.isActive).length} đang ẩn</Badge>
            </>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs
        size="sm"
        className="w-fit max-w-full"
        items={[
          { value: 'home', label: 'Bố cục trang chủ' },
          { value: 'cuisines', label: 'Loại hình ẩm thực' },
        ]}
        value={activeTab}
        onChange={handleTabChange}
      />

      {/* TAB 1: BỐ CỤC TRANG CHỦ */}
      {activeTab === 'home' && (
        <div
          id="tabpanel-home"
          role="tabpanel"
          aria-labelledby="tab-home"
          className="space-y-base"
        >
          {homeLoading || !homeConfig ? (
            <div className="py-section text-center text-body-sm text-body">
              Đang tải cấu hình trang chủ...
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="text-body-sm text-body font-medium">
                  Tùy chỉnh thông tin trang chủ, sắp xếp vị trí và bấm lưu để áp dụng thay đổi.
                </div>
                <Button leadingIcon="check" size="sm" loading={homeSaving} onClick={saveHome}>
                  Lưu bố cục
                </Button>
              </div>

              <Card padded>
                <div className="mb-base text-title-md text-ink">Phần đầu trang</div>
                <div className="grid items-start gap-base lg:grid-cols-2">
                  <div className="space-y-sm">
                    <Input
                      label="Tiêu đề"
                      value={homeConfig.hero.title}
                      onChange={(event) => setHero('title', event.target.value)}
                    />
                    <Textarea
                      label="Mô tả"
                      rows={4}
                      value={homeConfig.hero.subtitle}
                      onChange={(event) => setHero('subtitle', event.target.value)}
                    />
                  </div>
                  <div>
                    <ImageUploader
                      value={homeConfig.hero.imageUrl}
                      onUploaded={(url) => setHero('imageUrl', url)}
                      folder="home-hero"
                      aspectRatio="video"
                      className="items-start"
                    />
                  </div>
                </div>
              </Card>

              <HomeBannersEditor maxItems={6} />

              <HomeMoodsEditor moods={homeConfig.moods} onChange={setMoods} />

              <Card padded>
                <div className="mb-base">
                  <div className="text-title-md text-ink">Các phần trong body</div>
                  <p className="mt-1 text-caption text-body">
                    Kéo một mục vào mục khác để đổi vị trí. Tắt để ẩn section đó khỏi /app.
                  </p>
                </div>
                <div className="space-y-xxs">
                  {homeConfig.sections.map((section, index) => (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={() => setDraggedSectionId(section.id)}
                      onDragEnd={() => setDraggedSectionId(null)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => reorderSections(section.id)}
                      className="flex cursor-grab items-center gap-sm rounded-md border border-hairline-strong bg-surface-card px-sm py-sm active:cursor-grabbing"
                    >
                      <span className="nums w-5 text-center text-caption text-body">{index + 1}</span>
                      <span className="flex-1 text-body-sm font-semibold text-ink">{section.label}</span>
                      <Switch
                        checked={section.isVisible}
                        onChange={(value) => toggleSection(section.id, value)}
                        label={section.isVisible ? 'Hiển thị' : 'Ẩn'}
                      />
                      <IconButton icon="menu" label={`Kéo ${section.label}`} variant="secondary" size="sm" />
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* TAB 2: LOẠI HÌNH ẨM THỰC */}
      {activeTab === 'cuisines' && (
        <div
          id="tabpanel-cuisines"
          role="tabpanel"
          aria-labelledby="tab-cuisines"
          className="space-y-base"
        >
          {/* Toolbar */}
          <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-72 shrink-0 h-9">
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-body"
              />
              <input
                value={cuisineSearchQuery}
                onChange={(e) => setCuisineSearchQuery(e.target.value)}
                placeholder="Tìm loại ẩm thực…"
                aria-label="Tìm loại ẩm thực"
                className="h-full w-full rounded-md border border-hairline-strong bg-surface-card pl-9 pr-base text-body-sm text-ink outline-none placeholder:text-muted focus:border-ink transition-colors"
              />
            </div>

            <div className="flex items-center gap-xs justify-end">
              <Button leadingIcon="plus" size="sm" onClick={openCreateCuisine}>
                Thêm loại hình
              </Button>
            </div>
          </div>

          {cuisinesError && (
            <div className="rounded-md border border-error bg-[#fbeaea] p-sm text-body-sm text-error" role="alert">
              {cuisinesError}
            </div>
          )}

          <div>
            {cuisinesLoading && !cuisines.length ? (
              <div className="py-section text-center text-body-sm text-body" role="status">
                Đang tải loại hình ẩm thực...
              </div>
            ) : filteredCuisines.length === 0 ? (
              <EmptyState
                icon="grid"
                title={cuisineSearchQuery ? 'Không tìm thấy loại hình phù hợp' : 'Chưa có loại hình ẩm thực'}
                description={
                  cuisineSearchQuery
                    ? 'Thử tìm kiếm với từ khóa khác.'
                    : 'Tạo loại đầu tiên để quán có thể lựa chọn khi đăng ký.'
                }
              />
            ) : (
              <div className="grid gap-base md:grid-cols-2 xl:grid-cols-4">
                {filteredCuisines.map((cuisine) => (
                  <Card
                    key={cuisine.id}
                    padded={false}
                    hover={false}
                    draggable={!cuisineSearchQuery}
                    onDragStart={() => setDraggedCuisineId(cuisine.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => reorderCuisines(cuisine.id)}
                    onDragEnd={() => setDraggedCuisineId(null)}
                    className={`overflow-hidden ${!cuisineSearchQuery ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  >
                    <div className="relative aspect-[4/3] bg-canvas-soft">
                      {cuisine.iconUrl ? (
                        <img draggable={false} src={cuisine.iconUrl} alt="" className="h-full w-full select-none object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center text-body">
                          <span className="text-title-md">{cuisine.name.slice(0, 1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex min-h-[116px] flex-col p-sm">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-title-md text-ink">{cuisine.name}</div>
                        <div className="text-caption text-body">{cuisine.restaurantCount} quán đang dùng</div>
                      </div>
                      <div className="mt-sm flex items-center justify-between gap-sm">
                        <Switch
                          checked={cuisine.isActive}
                          onChange={() => toggleCuisineActive(cuisine)}
                          label={cuisine.isActive ? 'Hiển thị' : 'Ẩn'}
                        />
                        <div className="flex gap-xxs">
                          <IconButton
                            icon="edit"
                            label={'Sửa ' + cuisine.name}
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditCuisine(cuisine)}
                          />
                          <IconButton
                            icon="trash"
                            label={'Xóa ' + cuisine.name}
                            size="sm"
                            className="text-error"
                            onClick={() => setDeleteCuisineTarget(cuisine)}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Modal
            open={Boolean(cuisineEditor)}
            onClose={closeCuisineEditor}
            title={cuisineEditor?.mode === 'create' ? 'Thêm loại hình ẩm thực' : 'Sửa loại hình ẩm thực'}
            size="sm"
            footer={
              <>
                <Button variant="secondary" disabled={cuisineSaving} onClick={closeCuisineEditor}>
                  Hủy
                </Button>
                <Button loading={cuisineSaving} onClick={saveCuisine}>
                  {cuisineEditor?.mode === 'create' ? 'Tạo loại' : 'Lưu thay đổi'}
                </Button>
              </>
            }
          >
            <div className="space-y-sm">
              {cuisineFormError && (
                <div className="rounded-md border border-error bg-[#fbeaea] p-sm text-body-sm text-error" role="alert">
                  {cuisineFormError}
                </div>
              )}
              <Input
                id="cuisine-name"
                label="Tên loại ẩm thực"
                required
                value={cuisineDraft.name}
                onChange={(event) => setCuisineField('name', event.target.value)}
                placeholder="Ví dụ: Món Việt"
              />
              <ImageUploader
                value={cuisineDraft.iconUrl}
                onUploaded={(url) => setCuisineField('iconUrl', url)}
                folder="cuisine"
                aspectRatio="video"
                className="items-start"
              />
              <Switch
                checked={cuisineDraft.isActive}
                onChange={(value) => setCuisineField('isActive', value)}
                label="Hiển thị cho khách hàng"
                hint="Tắt mục này sẽ ẩn loại khỏi tìm kiếm và đăng ký quán mới."
              />
            </div>
          </Modal>

          <Modal
            open={Boolean(deleteCuisineTarget)}
            onClose={() => !cuisineSaving && setDeleteCuisineTarget(null)}
            title="Xóa loại hình ẩm thực"
            size="sm"
            footer={
              <>
                <Button variant="secondary" disabled={cuisineSaving} onClick={() => setDeleteCuisineTarget(null)}>
                  Hủy
                </Button>
                <Button
                  className="border-error bg-error text-on-dark hover:bg-error/90"
                  loading={cuisineSaving}
                  onClick={removeCuisine}
                >
                  Xóa
                </Button>
              </>
            }
          >
            <p className="text-body-sm text-body">
              Xóa <strong className="text-ink">{deleteCuisineTarget?.name}</strong>? Thao tác này chỉ thực hiện được khi chưa có quán nào sử dụng loại này.
            </p>
          </Modal>
        </div>
      )}
    </div>
  );
}
