import { useCallback, useEffect, useMemo, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
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
  
  // null | 'new' | item object
  const [editingItem, setEditingItem] = useState(null);
  // null | 'new' | category object
  const [editingCategory, setEditingCategory] = useState(null);
  // null | category object
  const [deletingCategory, setDeletingCategory] = useState(null);
  // null | item object
  const [deletingItem, setDeletingItem] = useState(null);

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

  const filteredCategories = useMemo(() => {
    if (!query.trim()) return categories;
    const lowerQuery = query.toLowerCase();
    return categories.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => item.name.toLowerCase().includes(lowerQuery)),
    })).filter((cat) => cat.items.length > 0);
  }, [categories, query]);

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

  const handleDeleteCategory = (cat) => {
    setDeletingCategory(cat);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await deleteMerchantCategoryApi(deletingCategory.id);
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
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
      <div className="flex flex-col gap-sm md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-caption-uppercase text-body">Thực đơn nhà hàng</div>
          <h1 className="text-display-lg text-ink">Quản lý thực đơn</h1>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          <Input
            leadingIcon="search"
            placeholder="Tìm kiếm món ăn…"
            aria-label="Tìm kiếm món ăn"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64"
          />
          <Button
            leadingIcon="plus"
            onClick={() => {
              if (categories.length === 0) {
                pushToast({
                  kind: 'warning',
                  title: 'Chưa có danh mục',
                  message: 'Vui lòng thêm ít nhất một danh mục trước khi thêm món ăn.',
                });
                return;
              }
              setEditingItem('new');
            }}
          >
            Thêm món
          </Button>
        </div>
      </div>

      {/* Category Management Bar */}
      <div className="flex flex-wrap items-center justify-between gap-base border-b border-hairline pb-base">
        <div className="flex flex-wrap items-center gap-xs">
          <span className="text-body-sm font-semibold text-ink">Quản lý danh mục:</span>
          {categories.map((c) => (
            <div key={c.id} className="inline-flex items-center gap-1.5 rounded-md border border-hairline-strong bg-surface-card px-2.5 py-1">
              <span className={`text-body-sm font-medium ${c.isActive ? 'text-ink' : 'text-muted line-through'}`}>
                {c.name}
              </span>
              <IconButton icon="edit" label="Sửa" size="xs" onClick={() => setEditingCategory(c)} />
              <IconButton icon="trash" label="Xóa" size="xs" onClick={() => handleDeleteCategory(c)} />
            </div>
          ))}
          <Button variant="secondary" size="sm" leadingIcon="plus" onClick={() => setEditingCategory('new')}>
            Thêm danh mục
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-xxl text-center text-body">Đang tải thực đơn…</div>
      ) : filteredCategories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hairline-strong py-xxl text-center text-body">
          Chưa có danh mục hoặc món ăn nào khớp với tìm kiếm.
        </div>
      ) : (
        <div className="space-y-lg">
          {filteredCategories.map((cat) => (
            <Card key={cat.id} padded className="space-y-sm">
              <div className="flex items-center justify-between border-b border-hairline pb-xs">
                <div className="flex items-center gap-sm">
                  <h3 className="text-title-lg text-ink">{cat.name}</h3>
                  {!cat.isActive && <Badge tone="error">Đã ẩn danh mục</Badge>}
                </div>
                <div className="text-caption text-body">
                  {cat.items.length} món ăn
                </div>
              </div>

              {cat.items.length === 0 ? (
                <div className="py-md text-center text-caption text-muted">Danh mục này chưa có món ăn.</div>
              ) : (
                <>
                  {/* Mobile list view */}
                  <div className="flex flex-col gap-2 md:hidden">
                    {cat.items.map((i) => (
                      <div key={i.id} className="flex flex-col rounded-md border border-hairline bg-canvas-soft p-sm">
                        <div className="flex gap-sm">
                          <Image src={i.imageUrl} alt={i.name} className="h-16 w-16 rounded-md shrink-0" ratio="1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-body-sm font-semibold text-ink truncate">{i.name}</div>
                                <div className="text-caption text-body line-clamp-2">{i.description}</div>
                              </div>
                              <span className="nums text-title-sm text-ink shrink-0">{formatVnd(i.price)}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              {!i.inStock && <Badge tone="error">Hết hàng</Badge>}
                              {i.status === 'hidden' && <Badge tone="default">Đã ẩn</Badge>}
                              {i.isFeatured && <Badge tone="outline">Nổi bật</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="mt-sm flex items-center justify-between border-t border-hairline-strong pt-sm">
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
                            <IconButton icon="edit" label="Sửa" size="sm" onClick={() => setEditingItem(i)} />
                            <IconButton icon="trash" label="Xóa" size="sm" onClick={() => handleDeleteItem(i)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table view */}
                  <table className="hidden md:table w-full">
                    <thead className="text-caption-uppercase text-body border-b border-hairline">
                      <tr>
                        <Th className="w-[380px] pl-0">Món</Th>
                        <Th>Giá</Th>
                        <Th>Nổi bật</Th>
                        <Th>Trạng thái bán</Th>
                        <Th>Trạng thái hiển thị</Th>
                        <Th className="text-right pr-0">Thao tác</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {cat.items.map((i) => (
                        <tr key={i.id} className="hover:bg-canvas-soft">
                          <Td className="pl-0">
                            <div className="flex items-center gap-sm">
                              <Image src={i.imageUrl} alt={i.name} className="h-12 w-12 rounded-md" ratio="1" />
                              <div>
                                <div className="text-body-sm font-semibold text-ink">{i.name}</div>
                                <div className="text-caption text-body line-clamp-1 max-w-sm">{i.description}</div>
                              </div>
                            </div>
                          </Td>
                          <Td className="nums text-body-sm text-ink">{formatVnd(i.price)}</Td>
                          <Td>
                            {i.isFeatured ? (
                              <Badge tone="default">⭐ Nổi bật</Badge>
                            ) : (
                              <span className="text-caption text-muted">—</span>
                            )}
                          </Td>
                          <Td>
                            <Switch
                              checked={i.inStock}
                              onChange={() => handleToggleStock(i)}
                              label={i.inStock ? 'Còn hàng' : 'Hết hàng'}
                              size="sm"
                            />
                          </Td>
                          <Td>
                            <Switch
                              checked={i.status === 'active'}
                              onChange={() => handleToggleStatus(i)}
                              label={i.status === 'active' ? 'Đang hiện' : 'Đã ẩn'}
                              size="sm"
                            />
                          </Td>
                          <Td className="text-right pr-0">
                            <div className="inline-flex items-center gap-1">
                              <IconButton icon="edit" label="Sửa" onClick={() => setEditingItem(i)} />
                              <IconButton icon="trash" label="Xóa" onClick={() => handleDeleteItem(i)} />
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
      />

      {/* Delete Category Confirmation Modal */}
      <Modal
        open={deletingCategory !== null}
        onClose={() => setDeletingCategory(null)}
        title="Xác nhận xóa danh mục"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingCategory(null)}>
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

function ItemEditor({ open, onClose, onSave, item, categories }) {
  const empty = {
    id: 'new',
    categoryId: categories[0]?.id ? String(categories[0].id) : '',
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
  const initial = item ?? empty;
  const [draft, setDraft] = useState(initial);

  if (open && draft.id !== (item?.id ?? 'new')) {
    setDraft(initial);
  }

  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? 'Sửa món ăn' : 'Thêm món vào thực đơn'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={() => onSave(draft)}>
            {item ? 'Lưu thay đổi' : 'Thêm vào thực đơn'}
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
              onChange={(v) => setField('isFeatured', v)}
              label="Món nổi bật"
              hint="Món nổi bật sẽ hiển thị đầu tiên trên trang nhà hàng của bạn."
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
