import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import Badge from '../../components/Badge.jsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import Input, { Select, Textarea } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Switch from '../../components/Switch.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import {
  fetchMerchantMenuApi,
  createMerchantCategoryApi,
  updateMerchantCategoryApi,
  deleteMerchantCategoryApi,
  createMerchantMenuItemApi,
  updateMerchantMenuItemApi,
  deleteMerchantMenuItemApi,
} from '../../lib/api.js';

export default function MerchantMenu() {
  const { pushToast } = useApp();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'in_stock' | 'out_of_stock' | 'featured' | 'hidden'
  
  // null | 'new' | item object | { id: 'new', categoryId: string }
  const [editingItem, setEditingItem] = useState(null);
  // null | 'new' | category object
  const [editingCategory, setEditingCategory] = useState(null);
  // null | category object
  const [deletingCategory, setDeletingCategory] = useState(null);
  // null | item object
  const [deletingItem, setDeletingItem] = useState(null);
  // boolean
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMerchantMenuApi();
      setCategories(data.categories || []);
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi tải thực đơn', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Overall stats
  const stats = useMemo(() => {
    let total = 0;
    let inStock = 0;
    let outOfStock = 0;
    let hidden = 0;
    let featured = 0;
    for (const cat of categories) {
      for (const it of cat.items || []) {
        total++;
        if (it.inStock) inStock++;
        else outOfStock++;
        if (it.status === 'hidden') hidden++;
        if (it.isFeatured) featured++;
      }
    }
    return { total, inStock, outOfStock, hidden, featured };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    let result = categories;

    // 1. Filter by selected category tab
    if (selectedCategoryTab !== 'all') {
      result = result.filter((cat) => String(cat.id) === String(selectedCategoryTab));
    }

    // 2. Filter by search query and status
    const lowerQuery = query.trim().toLowerCase();

    return result
      .map((cat) => {
        let items = cat.items || [];

        if (lowerQuery) {
          items = items.filter(
            (item) =>
              item.name.toLowerCase().includes(lowerQuery) ||
              (item.description && item.description.toLowerCase().includes(lowerQuery)),
          );
        }

        if (statusFilter === 'in_stock') {
          items = items.filter((i) => i.inStock);
        } else if (statusFilter === 'out_of_stock') {
          items = items.filter((i) => !i.inStock);
        } else if (statusFilter === 'featured') {
          items = items.filter((i) => i.isFeatured);
        } else if (statusFilter === 'hidden') {
          items = items.filter((i) => i.status === 'hidden');
        }

        return {
          ...cat,
          items,
        };
      })
      .filter((cat) =>
        selectedCategoryTab !== 'all' || query.trim() || statusFilter !== 'all'
          ? cat.items.length > 0
          : true,
      );
  }, [categories, selectedCategoryTab, query, statusFilter]);

  // CATEGORY OPERATIONS
  const handleSaveCategory = async (draftCat) => {
    try {
      if (draftCat.id === 'new') {
        const newCat = await createMerchantCategoryApi({
          name: draftCat.name,
          sortOrder: draftCat.sortOrder,
        });
        setCategories((prev) => [...prev, newCat]);
        pushToast({ kind: 'success', title: 'Đã thêm danh mục', message: draftCat.name });
      } else {
        await updateMerchantCategoryApi(draftCat.id, {
          name: draftCat.name,
          sortOrder: draftCat.sortOrder,
          isActive: draftCat.isActive,
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === draftCat.id ? { ...c, ...draftCat } : c))
        );
        pushToast({ kind: 'success', title: 'Đã cập nhật danh mục', message: draftCat.name });
      }
      setEditingCategory(null);
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi thao tác danh mục', message: err.message });
    }
  };

  const handleToggleCategoryActive = async (cat) => {
    try {
      const nextActive = !cat.isActive;
      await updateMerchantCategoryApi(cat.id, { isActive: nextActive });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: nextActive } : c)),
      );
      pushToast({
        kind: 'info',
        title: nextActive ? 'Đang hiển thị danh mục' : 'Đã ẩn danh mục',
        message: cat.name,
      });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi cập nhật danh mục', message: err.message });
    }
  };

  const handleRenameCategory = async (catId, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      await updateMerchantCategoryApi(catId, { name: trimmed });
      setCategories((prev) =>
        prev.map((c) => (c.id === catId ? { ...c, name: trimmed } : c)),
      );
      pushToast({ kind: 'success', title: 'Đã đổi tên danh mục', message: trimmed });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi cập nhật tên', message: err.message });
    }
  };

  const [draggedCatIndex, setDraggedCatIndex] = useState(null);

  const handleDropCategory = async (targetIndex) => {
    if (draggedCatIndex === null || draggedCatIndex === targetIndex) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(draggedCatIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    // Re-assign sortOrder
    const updated = reordered.map((cat, idx) => ({
      ...cat,
      sortOrder: idx + 1,
    }));
    setCategories(updated);
    setDraggedCatIndex(null);

    // Call API in parallel
    try {
      await Promise.all(
        updated.map((cat) =>
          updateMerchantCategoryApi(cat.id, { sortOrder: cat.sortOrder }),
        ),
      );
      pushToast({ kind: 'success', title: 'Đã cập nhật thứ tự danh mục' });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi lưu thứ tự', message: err.message });
    }
  };

  const handleDeleteCategory = (cat) => {
    setDeletingCategory(cat);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await deleteMerchantCategoryApi(deletingCategory.id);
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      if (String(selectedCategoryTab) === String(deletingCategory.id)) {
        setSelectedCategoryTab('all');
      }
      pushToast({ kind: 'info', title: 'Đã xóa danh mục', message: deletingCategory.name });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể xóa danh mục', message: err.message });
    } finally {
      setDeletingCategory(null);
    }
  };

  // MENU ITEM OPERATIONS
  const handleSaveItem = async (draftItem) => {
    try {
      const categoryId = draftItem.categoryId ?? '';
      const name = draftItem.name.trim();
      if (!categoryId || !name) {
        throw new Error('Vui lòng chọn danh mục và nhập tên món.');
      }

      if (draftItem.id === 'new') {
        const newItem = await createMerchantMenuItemApi({
          categoryId,
          name,
          description: draftItem.description,
          imageUrl: draftItem.imageUrl,
          price: draftItem.price,
          prepTimeMin: draftItem.prepTimeMin,
          isFeatured: draftItem.isFeatured,
          sortOrder: draftItem.sortOrder,
        });
        setCategories((prev) =>
          prev.map((c) => {
            if (String(c.id) === String(categoryId)) {
              return { ...c, items: [...c.items, newItem] };
            }
            return c;
          })
        );
        pushToast({ kind: 'success', title: 'Đã thêm món ăn', message: name });
      } else {
        await updateMerchantMenuItemApi(draftItem.id, {
          categoryId,
          name,
          description: draftItem.description,
          imageUrl: draftItem.imageUrl,
          price: draftItem.price,
          prepTimeMin: draftItem.prepTimeMin,
          isFeatured: draftItem.isFeatured,
          sortOrder: draftItem.sortOrder,
          inStock: draftItem.inStock,
          status: draftItem.status,
        });
        await loadMenu();
        pushToast({ kind: 'success', title: 'Đã cập nhật món ăn', message: name });
      }
      setEditingItem(null);
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi thao tác món ăn', message: err.message });
    }
  };

  const handleToggleStock = async (item) => {
    try {
      const nextStock = !item.inStock;
      await updateMerchantMenuItemApi(item.id, { inStock: nextStock });
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          items: c.items.map((i) => (i.id === item.id ? { ...i, inStock: nextStock } : i)),
        }))
      );
      pushToast({
        kind: 'info',
        title: nextStock ? 'Đã chuyển thành Còn hàng' : 'Đã chuyển thành Hết hàng',
        message: item.name,
      });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi cập nhật', message: err.message });
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      const nextStatus = item.status === 'active' ? 'hidden' : 'active';
      await updateMerchantMenuItemApi(item.id, { status: nextStatus });
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          items: c.items.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i)),
        }))
      );
      pushToast({
        kind: 'info',
        title: nextStatus === 'active' ? 'Đang hiển thị món ăn' : 'Đã ẩn món ăn',
        message: item.name,
      });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi cập nhật', message: err.message });
    }
  };

  const handleToggleFeatured = async (item) => {
    try {
      const nextFeatured = !item.isFeatured;
      if (nextFeatured && stats.featured >= 5) {
        pushToast({
          kind: 'warning',
          title: 'Đã đạt tối đa 5 món nổi bật',
          message: 'Mỗi quán chỉ được đặt tối đa 5 món nổi bật. Vui lòng bỏ ghim bớt một món trước khi chọn thêm.',
        });
        return;
      }
      await updateMerchantMenuItemApi(item.id, { isFeatured: nextFeatured });
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          items: c.items.map((i) => (i.id === item.id ? { ...i, isFeatured: nextFeatured } : i)),
        })),
      );
      pushToast({
        kind: 'info',
        title: nextFeatured ? 'Đã ghim Món nổi bật ⭐' : 'Đã bỏ ghim Món nổi bật',
        message: item.name,
      });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi cập nhật', message: err.message });
    }
  };

  const handleDeleteItem = (item) => {
    setDeletingItem(item);
  };

  const confirmDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      await deleteMerchantMenuItemApi(deletingItem.id);
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          items: c.items.filter((i) => i.id !== deletingItem.id),
        }))
      );
      pushToast({ kind: 'info', title: 'Đã xóa món ăn khỏi thực đơn', message: deletingItem.name });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Lỗi xóa món', message: err.message });
    } finally {
      setDeletingItem(null);
    }
  };

  return (
    <div className="space-y-base">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Thực đơn & Món ăn</div>
          <h1 className="text-display-lg text-ink">Quản lý Thực đơn</h1>
          <p className="mt-xs text-body-sm text-body">
            Thêm món mới, cập nhật giá bán, nhóm món và kiểm soát trạng thái còn hàng hoặc hết món theo thời gian thực.
          </p>
        </div>
      </div>

      {/* Toolbar: Search + Status Filter */}
      <div className="flex flex-wrap items-center justify-end gap-xs">
        <div className="relative w-full sm:w-64 md:w-72 shrink-0 h-9">
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-body"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm món trong thực đơn…"
            aria-label="Tìm trong thực đơn"
            className="h-full w-full rounded-md border border-hairline-strong bg-surface-card pl-9 pr-base text-body-sm text-ink outline-none placeholder:text-muted focus:border-ink transition-colors"
          />
        </div>
        <select
          className="h-9 rounded-md border border-hairline-strong bg-surface-card px-3 text-body-sm text-ink outline-none cursor-pointer focus:border-ink transition-colors"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Lọc trạng thái món ăn"
        >
          <option value="all">Tất cả trạng thái ({stats.total})</option>
          <option value="in_stock">Còn hàng ({stats.inStock})</option>
          <option value="out_of_stock">Hết hàng ({stats.outOfStock})</option>
          <option value="featured">Món nổi bật ⭐ ({stats.featured}/5)</option>
          <option value="hidden">Đang ẩn ({stats.hidden})</option>
        </select>
      </div>

      {/* Category Tabs & Actions */}
      <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between border-b border-hairline pb-sm">
        {/* Horizontal Category Scroll Tabs */}
        <div className="flex max-w-full items-center gap-xs overflow-x-auto no-scrollbar flex-1 min-w-0 pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategoryTab('all')}
            className={clsx(
              'h-9 inline-flex items-center justify-center whitespace-nowrap rounded-md px-sm text-button transition-colors shrink-0',
              selectedCategoryTab === 'all'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-card border border-hairline-strong text-ink hover:bg-canvas-soft',
            )}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategoryTab(String(c.id))}
              className={clsx(
                'h-9 inline-flex items-center justify-center whitespace-nowrap rounded-md px-sm text-button transition-colors shrink-0',
                String(selectedCategoryTab) === String(c.id)
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-card border border-hairline-strong text-ink hover:bg-canvas-soft',
                !c.isActive && 'opacity-60 line-through',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Category Actions */}
        <div className="flex items-center gap-xs shrink-0">
          <Button
            variant="secondary"
            size="sm"
            leadingIcon="cog"
            onClick={() => setIsCategoryModalOpen(true)}
          >
            Quản lý danh mục
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leadingIcon="plus"
            onClick={() => setEditingCategory('new')}
          >
            Thêm danh mục
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-xxl text-center text-body">Đang tải thực đơn…</div>
      ) : filteredCategories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hairline-strong py-xxl text-center text-body space-y-2">
          <div className="text-body-md font-medium text-ink">Chưa có món ăn nào phù hợp</div>
          <div className="text-caption text-body">Hãy thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác.</div>
        </div>
      ) : (
        <div className="space-y-lg">
          {filteredCategories.map((cat) => (
            <Card key={cat.id} padded className="space-y-sm overflow-hidden">
              {/* Category Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-title-lg font-bold text-ink">{cat.name}</h2>
                  <Badge tone="outline" className="text-caption font-semibold nums">
                    {cat.items?.length || 0} món
                  </Badge>
                  {!cat.isActive && <Badge tone="error">Đã ẩn</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    leadingIcon="plus"
                    onClick={() => setEditingItem({ id: 'new', categoryId: String(cat.id) })}
                  >
                    Thêm món
                  </Button>
                </div>
              </div>

              {cat.items.length === 0 ? (
                <div className="py-md text-center text-caption text-muted">
                  Danh mục này chưa có món ăn nào khớp với bộ lọc.
                </div>
              ) : (
                <>
                  {/* Mobile list view */}
                  <div className="flex flex-col gap-2 md:hidden">
                    {cat.items.map((i) => (
                      <div
                        key={i.id}
                        className="flex flex-col rounded-md border border-hairline bg-canvas-soft/60 p-sm"
                      >
                        <div className="flex gap-sm">
                          <div className="relative shrink-0">
                            <Image
                              src={i.imageUrl}
                              alt={i.name}
                              className="h-16 w-16 rounded-md object-cover border border-hairline"
                              ratio="1"
                            />
                            {i.isFeatured && (
                              <span
                                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white shadow-xs"
                                title="Món nổi bật"
                              >
                                ★
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-body-sm font-semibold text-ink truncate">
                                    {i.name}
                                  </span>
                                  {i.isFeatured && (
                                    <span className="rounded bg-amber-500/10 px-1 py-0.2 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                                      Nổi bật
                                    </span>
                                  )}
                                </div>
                                {i.description && (
                                  <div className="text-caption text-body line-clamp-2 mt-0.5">
                                    {i.description}
                                  </div>
                                )}
                              </div>
                              <span className="nums text-title-sm font-bold text-ink shrink-0">
                                {formatVnd(i.price)}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              {!i.inStock && <Badge tone="error">Hết hàng</Badge>}
                              {i.status === 'hidden' && <Badge tone="default">Đã ẩn</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="mt-sm flex items-center justify-between border-t border-hairline pt-sm">
                          <div className="flex items-center gap-base">
                            <Switch
                              checked={i.inStock}
                              onChange={() => handleToggleStock(i)}
                              label={i.inStock ? 'Còn hàng' : 'Hết hàng'}
                              size="sm"
                            />
                            <Switch
                              checked={i.status === 'active'}
                              onChange={() => handleToggleStatus(i)}
                              label={i.status === 'active' ? 'Hiện' : 'Ẩn'}
                              size="sm"
                            />
                          </div>
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleFeatured(i)}
                              title={i.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
                              className={clsx(
                                'p-1 rounded-md transition-colors',
                                i.isFeatured ? 'text-amber-500' : 'text-muted hover:text-amber-500',
                              )}
                            >
                              <Icon name={i.isFeatured ? 'starFilled' : 'star'} size={18} />
                            </button>
                            <IconButton
                              icon="edit"
                              label="Sửa"
                              size="sm"
                              onClick={() => setEditingItem(i)}
                            />
                            <IconButton
                              icon="trash"
                              label="Xóa"
                              size="sm"
                              onClick={() => handleDeleteItem(i)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table view */}
                  <table className="hidden md:table w-full text-left">
                    <thead className="text-caption-uppercase text-body border-b border-hairline">
                      <tr>
                        <Th className="pl-0">Món ăn</Th>
                        <Th className="w-32 whitespace-nowrap">Giá bán</Th>
                        <Th className="w-36 whitespace-nowrap">Trạng thái bán</Th>
                        <Th className="w-32 whitespace-nowrap">Hiển thị</Th>
                        <Th className="w-20 text-center whitespace-nowrap">Nổi bật</Th>
                        <Th className="w-24 text-right pr-0 whitespace-nowrap">Thao tác</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {cat.items.map((i) => (
                        <tr key={i.id} className="hover:bg-canvas-soft/60 transition-colors">
                          <Td className="pl-0 py-3">
                            <div className="flex items-center gap-sm">
                              <div className="relative shrink-0">
                                <Image
                                  src={i.imageUrl}
                                  alt={i.name}
                                  className="h-12 w-12 rounded-md object-cover border border-hairline"
                                  ratio="1"
                                />
                                {i.isFeatured && (
                                  <span
                                    className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white shadow-xs"
                                    title="Món nổi bật"
                                  >
                                    ★
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 max-w-md">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-body-sm font-semibold text-ink">
                                    {i.name}
                                  </span>
                                  {i.isFeatured && (
                                    <span className="rounded bg-amber-500/10 px-1.5 py-0.2 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                      Nổi bật
                                    </span>
                                  )}
                                </div>
                                {i.description && (
                                  <div className="text-caption text-body line-clamp-1 mt-0.5">
                                    {i.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Td>
                          <Td className="nums text-body-sm font-semibold text-ink py-3 whitespace-nowrap">
                            {formatVnd(i.price)}
                          </Td>
                          <Td className="py-3 whitespace-nowrap">
                            <Switch
                              checked={i.inStock}
                              onChange={() => handleToggleStock(i)}
                              label={i.inStock ? 'Còn hàng' : 'Hết hàng'}
                              size="sm"
                            />
                          </Td>
                          <Td className="py-3 whitespace-nowrap">
                            <Switch
                              checked={i.status === 'active'}
                              onChange={() => handleToggleStatus(i)}
                              label={i.status === 'active' ? 'Đang hiện' : 'Đã ẩn'}
                              size="sm"
                            />
                          </Td>
                          <Td className="text-center py-3">
                            <button
                              type="button"
                              onClick={() => handleToggleFeatured(i)}
                              title={i.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu món nổi bật'}
                              className={clsx(
                                'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                                i.isFeatured
                                  ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                                  : 'text-body hover:text-amber-500 hover:bg-canvas-soft',
                              )}
                            >
                              <Icon name={i.isFeatured ? 'starFilled' : 'star'} size={18} />
                            </button>
                          </Td>
                          <Td className="text-right pr-0 py-3 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <IconButton
                                icon="edit"
                                label="Sửa món"
                                onClick={() => setEditingItem(i)}
                              />
                              <IconButton
                                icon="trash"
                                label="Xóa món"
                                onClick={() => handleDeleteItem(i)}
                              />
                            </div>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Category Management Modal */}
      <Modal
        open={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Quản lý toàn bộ danh mục"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              leadingIcon="plus"
              onClick={() => setEditingCategory('new')}
            >
              Tạo danh mục mới
            </Button>
            <Button onClick={() => setIsCategoryModalOpen(false)}>Đóng</Button>
          </div>
        }
      >
        <div className="space-y-sm">
          <p className="text-body-sm text-body">
            Kéo thả biểu tượng <strong className="text-ink">⋮⋮</strong> để đổi thứ tự. Nhấp vào tên danh mục để đổi tên trực tiếp.
          </p>
          <div className="divide-y divide-hairline rounded-lg border border-hairline overflow-hidden max-h-[380px] overflow-y-auto">
            {categories.map((c, idx) => (
              <div
                key={c.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  setDraggedCatIndex(idx);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropCategory(idx);
                }}
                className={clsx(
                  'flex items-center justify-between p-2.5 transition-colors group select-none',
                  draggedCatIndex === idx ? 'opacity-40 bg-canvas-soft' : 'hover:bg-canvas-soft/80',
                )}
              >
                {/* Drag handle + Name input */}
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                  <div
                    className="cursor-grab active:cursor-grabbing p-1 text-muted hover:text-ink shrink-0 rounded transition-colors"
                    title="Kéo thả để đổi thứ tự"
                  >
                    <Icon name="grip" size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <CategoryNameInput
                      category={c}
                      onSave={(newName) => handleRenameCategory(c.id, newName)}
                    />
                    <div className="text-caption text-body pl-2 flex items-center gap-1.5 mt-0.5">
                      <span>{c.items?.length || 0} món ăn</span>
                      {!c.isActive && <span className="text-error font-medium">· Đã ẩn</span>}
                    </div>
                  </div>
                </div>

                {/* Actions: ONLY ICON BUTTONS, NO TEXT */}
                <div className="flex items-center gap-1 shrink-0">
                  <IconButton
                    icon={c.isActive ? 'eye' : 'eyeOff'}
                    label={c.isActive ? 'Đang hiện (Bấm để ẩn danh mục)' : 'Đang ẩn (Bấm để hiện danh mục)'}
                    size="sm"
                    variant="secondary"
                    className={!c.isActive ? 'text-muted hover:text-ink' : 'text-ink'}
                    onClick={() => handleToggleCategoryActive(c)}
                  />
                  <IconButton
                    icon="trash"
                    label="Xóa danh mục"
                    size="sm"
                    variant="secondary"
                    className="text-error hover:!bg-error/10 hover:!border-error/30"
                    onClick={() => handleDeleteCategory(c)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <CategoryEditor
        category={editingCategory === 'new' ? null : editingCategory}
        open={editingCategory !== null}
        onClose={() => setEditingCategory(null)}
        onSave={handleSaveCategory}
      />

      <ItemEditor
        item={editingItem === 'new' ? null : editingItem}
        open={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveItem}
        categories={categories}
        featuredCount={stats.featured}
      />

      {/* Delete Category Confirmation Modal */}
      <Modal
        open={deletingCategory !== null}
        onClose={() => setDeletingCategory(null)}
        title="Xác nhận xóa danh mục"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeletingCategory(null)}
            >
              Hủy
            </Button>
            <Button
              className="!bg-[#ea4335] !border-[#ea4335] hover:!bg-[#d32f2f] hover:!border-[#d32f2f] text-white"
              onClick={confirmDeleteCategory}
            >
              Xóa danh mục
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-body">
          Bạn có chắc chắn muốn xóa danh mục <strong className="text-ink font-semibold">"{deletingCategory?.name}"</strong>?
          Hành động này chỉ có thể thực hiện nếu danh mục không còn món ăn nào và không thể hoàn tác.
        </p>
      </Modal>

      {/* Delete Item Confirmation Modal */}
      <Modal
        open={deletingItem !== null}
        onClose={() => setDeletingItem(null)}
        title="Xác nhận xóa món ăn"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingItem(null)}>
              Hủy
            </Button>
            <Button
              className="!bg-[#ea4335] !border-[#ea4335] hover:!bg-[#d32f2f] hover:!border-[#d32f2f] text-white"
              onClick={confirmDeleteItem}
            >
              Xóa món
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-body">
          Bạn có chắc chắn muốn xóa món <strong className="text-ink font-semibold">"{deletingItem?.name}"</strong> khỏi thực đơn?
          Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </div>
  );
}

function Th({ className = '', children }) {
  return <th className={`px-base py-2 text-left text-caption-uppercase ${className}`}>{children}</th>;
}
function Td({ className = '', children }) {
  return <td className={`px-base py-sm ${className}`}>{children}</td>;
}

function CategoryNameInput({ category, onSave }) {
  const [val, setVal] = useState(category.name);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setVal(category.name);
  }, [category.name]);

  const commit = () => {
    setEditing(false);
    if (val.trim() && val.trim() !== category.name) {
      onSave(val.trim());
    } else {
      setVal(category.name);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="group flex items-center gap-1.5 text-left rounded px-1.5 py-0.5 hover:bg-canvas-soft transition-colors cursor-pointer"
          title="Nhấp để đổi tên"
        >
          <span
            className={clsx(
              'text-body-sm font-semibold text-ink',
              !category.isActive && 'line-through opacity-60',
            )}
          >
            {category.name}
          </span>
          <Icon
            name="edit"
            size={12}
            className="text-muted opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit();
          } else if (e.key === 'Escape') {
            setVal(category.name);
            setEditing(false);
          }
        }}
        placeholder="Nhập tên nhóm..."
        aria-label="Tên danh mục"
        className="text-body-sm font-semibold text-ink px-2 py-0.5 rounded outline-none bg-surface-card border border-ink shadow-xs w-full max-w-[240px]"
      />
    </div>
  );
}

function CategoryEditor({ open, onClose, onSave, category }) {
  const empty = {
    id: 'new',
    name: '',
    sortOrder: 0,
    isActive: true,
  };
  const initial = category ?? empty;
  const [draft, setDraft] = useState(initial);

  if (open && draft.id !== (category?.id ?? 'new')) {
    setDraft(initial);
  }

  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? 'Sửa danh mục' : 'Thêm danh mục mới'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={() => onSave(draft)}>
            {category ? 'Lưu thay đổi' : 'Tạo danh mục'}
          </Button>
        </>
      }
    >
      <div className="space-y-sm">
        <Input
          placeholder="Tên danh mục · ví dụ Món chính, Món tráng miệng"
          aria-label="Tên danh mục"
          label="Tên danh mục"
          value={draft.name}
          onChange={(e) => setField('name', e.target.value)}
          required
        />
        <Input
          placeholder="Thứ tự sắp xếp (số)"
          aria-label="Thứ tự sắp xếp"
          label="Thứ tự sắp xếp"
          type="number"
          value={draft.sortOrder}
          onChange={(e) => setField('sortOrder', Number(e.target.value))}
        />
        {category && (
          <Switch
            checked={draft.isActive}
            onChange={(v) => setField('isActive', v)}
            label="Hoạt động"
            hint="Ẩn danh mục sẽ ẩn toàn bộ món ăn bên trong đối với khách hàng."
          />
        )}
      </div>
    </Modal>
  );
}

function createEmptyMenuItem(item, categories) {
  return {
    id: 'new',
    categoryId: item?.categoryId ? String(item.categoryId) : (categories[0]?.id ? String(categories[0].id) : ''),
    name: '',
    description: '',
    price: 30000,
    imageUrl: '',
    prepTimeMin: 15,
    isFeatured: false,
    inStock: true,
    sortOrder: 0,
    status: 'active',
  };
}

function ItemEditor({ open, onClose, onSave, item, categories, featuredCount = 0 }) {
  const [draft, setDraft] = useState(() => createEmptyMenuItem(item, categories));

  useEffect(() => {
    if (!open) return;
    setDraft(
      item
        ? {
            ...createEmptyMenuItem(item, categories),
            ...item,
            categoryId: String(item.categoryId ?? (categories[0]?.id ? String(categories[0].id) : '')),
          }
        : createEmptyMenuItem(item, categories),
    );
  }, [open, item, categories]);

  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item && item.id !== 'new' ? 'Sửa món ăn' : 'Thêm món vào thực đơn'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={() => onSave(draft)}>
            {item && item.id !== 'new' ? 'Lưu thay đổi' : 'Thêm vào thực đơn'}
          </Button>
        </>
      }
    >
      <div className="grid gap-base md:grid-cols-[160px_1fr]">
        <div className="flex flex-col items-center">
          <ImageUploader
            value={draft.imageUrl}
            onUploaded={(url) => setField('imageUrl', url)}
            folder="menu"
            aspectRatio="square"
            className="w-full"
          />
        </div>
        <div className="space-y-sm">
          <Input
            placeholder="Tên món · ví dụ Margherita"
            aria-label="Tên món"
            label="Tên món ăn"
            value={draft.name}
            onChange={(e) => setField('name', e.target.value)}
            required
          />
          <Textarea
            placeholder="Mô tả — ví dụ: Cà chua San Marzano, fior di latte, húng quế."
            aria-label="Mô tả món"
            label="Mô tả món ăn"
            value={draft.description}
            onChange={(e) => setField('description', e.target.value)}
            rows={2}
          />
          <div className="grid grid-cols-2 gap-sm">
            <Input
              placeholder="Giá (VNĐ)"
              aria-label="Giá món ăn"
              label="Giá món ăn (VNĐ)"
              type="number"
              step="1000"
              min="0"
              value={draft.price}
              onChange={(e) => setField('price', Number(e.target.value))}
              required
            />
            <Select
              aria-label="Danh mục"
              label="Danh mục"
              value={draft.categoryId}
              onChange={(e) => setField('categoryId', e.target.value)}
              options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-sm">
            <Input
              placeholder="Thời gian chuẩn bị (phút)"
              aria-label="Thời gian chuẩn bị"
              label="Chuẩn bị (phút)"
              type="number"
              min="1"
              value={draft.prepTimeMin}
              onChange={(e) => setField('prepTimeMin', Number(e.target.value))}
            />
            <Input
              placeholder="Thứ tự sắp xếp"
              aria-label="Thứ tự sắp xếp"
              label="Thứ tự sắp xếp"
              type="number"
              value={draft.sortOrder}
              onChange={(e) => setField('sortOrder', Number(e.target.value))}
            />
          </div>
          <div className="flex flex-wrap gap-base pt-xxs">
            <Switch
              checked={draft.isFeatured}
              onChange={(v) => {
                if (v && !draft.isFeatured && (!item || !item.isFeatured) && featuredCount >= 5) {
                  return;
                }
                setField('isFeatured', v);
              }}
              label={`Món nổi bật ⭐ (${draft.isFeatured ? (item?.isFeatured ? featuredCount : featuredCount + 1) : featuredCount}/5)`}
              hint={
                !draft.isFeatured && (!item || !item.isFeatured) && featuredCount >= 5
                  ? 'Quán đã đạt tối đa 5/5 món nổi bật. Vui lòng bỏ ghim bớt món trước khi bật.'
                  : 'Tối đa 5 món nổi bật. Món nổi bật sẽ được ưu tiên hiển thị trên trang chủ và đầu thực đơn quán.'
              }
              disabled={!draft.isFeatured && (!item || !item.isFeatured) && featuredCount >= 5}
            />
            {item && (
              <>
                <Switch
                  checked={draft.inStock}
                  onChange={(v) => setField('inStock', v)}
                  label="Còn hàng"
                  hint="Nếu hết hàng, khách hàng sẽ không thể đặt món này."
                />
                <Switch
                  checked={draft.status === 'active'}
                  onChange={(v) => setField('status', v ? 'active' : 'hidden')}
                  label="Hiển thị"
                  hint="Cho phép hiển thị món trên thực đơn của khách."
                />
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
