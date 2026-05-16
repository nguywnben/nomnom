import { useMemo, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import Input, { Select, Textarea } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Switch from '../../components/Switch.jsx';
import { restaurants } from '../../data/mock.js';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';

export default function MerchantMenu() {
  const { currentMerchant, pushToast } = useApp();
  const r = restaurants.find((x) => x.id === currentMerchant.restaurantId);
  const [items, setItems] = useState(r.menu);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | item

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))),
    [items],
  );

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(query.toLowerCase()),
  );

  const upsert = (item) => {
    setItems((cur) => {
      if (cur.find((c) => c.id === item.id)) {
        return cur.map((c) => (c.id === item.id ? item : c));
      }
      return [{ ...item, id: 'new-' + Math.random().toString(36).slice(2, 8) }, ...cur];
    });
    pushToast({
      kind: 'success',
      title: 'Đã lưu món',
      message: item.name,
    });
    setEditing(null);
  };

  const toggleStock = (id) => {
    setItems((cur) => cur.map((c) => (c.id === id ? { ...c, inStock: !c.inStock } : c)));
  };

  const remove = (id) => {
    const next = items.filter((c) => c.id !== id);
    setItems(next);
    pushToast({ kind: 'info', title: 'Đã xóa món' });
  };

  return (
    <div className="space-y-base">
      <div className="flex flex-col gap-sm md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-caption-uppercase text-body">Danh mục</div>
          <h1 className="text-display-lg text-ink">Thực đơn</h1>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          <Input
            leadingIcon="search"
            placeholder="Tìm kiếm thực đơn…"
            aria-label="Tìm kiếm thực đơn"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64"
          />
          <Button leadingIcon="plus" onClick={() => setEditing('new')}>
            Thêm món
          </Button>
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {filtered.map((i) => (
          <Card key={i.id} padded={false} className="p-sm">
            <div className="flex gap-sm">
              <Image src={i.image} alt={i.name} className="h-16 w-16 rounded-md shrink-0" ratio="1" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-body-sm font-semibold text-ink truncate">{i.name}</div>
                    <div className="text-caption text-body line-clamp-2">{i.desc}</div>
                  </div>
                  <span className="nums text-title-sm text-ink shrink-0">{formatVnd(i.price)}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <Badge tone="outline">{i.category}</Badge>
                  {!i.inStock && <Badge tone="error">Hết hàng</Badge>}
                </div>
              </div>
            </div>
            <div className="mt-sm flex items-center justify-between border-t border-hairline pt-sm">
              <Switch
                checked={i.inStock}
                onChange={() => toggleStock(i.id)}
                label={i.inStock ? 'Còn hàng' : 'Hết hàng'}
                size="sm"
              />
              <div className="inline-flex items-center gap-1">
                <IconButton icon="edit" label="Sửa" size="sm" onClick={() => setEditing(i)} />
                <IconButton icon="trash" label="Xóa" size="sm" onClick={() => remove(i.id)} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop: wide table */}
      <Card padded={false} className="hidden md:block">
        <table className="w-full">
          <thead className="bg-canvas-soft text-caption-uppercase text-body">
            <tr>
              <Th className="w-[420px]">Món</Th>
              <Th>Danh mục</Th>
              <Th>Giá</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right pr-base">Thao tác</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filtered.map((i) => (
              <tr key={i.id} className="hover:bg-canvas-soft">
                <Td>
                  <div className="flex items-center gap-sm">
                    <Image src={i.image} alt={i.name} className="h-12 w-12 rounded-md" ratio="1" />
                    <div>
                      <div className="text-body-sm font-semibold text-ink">{i.name}</div>
                      <div className="text-caption text-body line-clamp-1 max-w-sm">{i.desc}</div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <Badge tone="outline">{i.category}</Badge>
                </Td>
                <Td className="nums text-body-sm text-ink">{formatVnd(i.price)}</Td>
                <Td>
                  <Switch
                    checked={i.inStock}
                    onChange={() => toggleStock(i.id)}
                    label={i.inStock ? 'Còn hàng' : 'Hết hàng'}
                    size="sm"
                  />
                </Td>
                <Td className="text-right pr-base">
                  <div className="inline-flex items-center gap-1">
                    <IconButton icon="edit" label="Sửa" onClick={() => setEditing(i)} />
                    <IconButton icon="trash" label="Xóa" onClick={() => remove(i.id)} />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ItemEditor
        item={editing === 'new' ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSave={upsert}
        categories={categories}
      />
    </div>
  );
}

function Th({ className = '', children }) {
  return <th className={`px-base py-2 text-left text-caption-uppercase ${className}`}>{children}</th>;
}
function Td({ className = '', children }) {
  return <td className={`px-base py-sm ${className}`}>{children}</td>;
}

function ItemEditor({ open, onClose, onSave, item, categories }) {
  const empty = {
    id: 'new',
    name: '',
    desc: '',
    price: 300000,
    image: '',
    category: categories[0] ?? 'Classic',
    inStock: true,
    tags: [],
  };
  const initial = item ?? empty;
  const [draft, setDraft] = useState(initial);

  // Reset when re-opening
  if (open && draft.id !== (item?.id ?? 'new')) {
    setDraft(initial);
  }

  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? 'Sửa món' : 'Thêm món vào thực đơn'}
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
      <div className="grid gap-base md:grid-cols-[140px_1fr]">
        <div className="space-y-xs">
          <div className="aspect-square overflow-hidden rounded-md border border-hairline-strong bg-canvas-soft">
            {draft.image ? (
              <img src={draft.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-body">
                <Icon name="camera" size={20} />
              </div>
            )}
          </div>
          <label className="block">
            <span className="sr-only">Tải ảnh lên</span>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-caption file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-2 file:py-1 file:text-on-primary"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = URL.createObjectURL(f);
                setField('image', url);
              }}
            />
          </label>
        </div>
        <div className="space-y-sm">
          <Input
            placeholder="Tên món · ví dụ Margherita"
            aria-label="Tên món"
            value={draft.name}
            onChange={(e) => setField('name', e.target.value)}
          />
          <Textarea
            placeholder="Mô tả — ví dụ: Cà chua San Marzano, fior di latte, húng quế."
            aria-label="Mô tả món"
            value={draft.desc}
            onChange={(e) => setField('desc', e.target.value)}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-sm">
            <Input
              placeholder="Giá (VNĐ)"
              aria-label="Giá đồng Việt Nam"
              type="number"
              step="1000"
              min="0"
              value={draft.price}
              onChange={(e) => setField('price', Number(e.target.value))}
            />
            <Select
              aria-label="Danh mục"
              value={draft.category}
              onChange={(e) => setField('category', e.target.value)}
              options={[...categories, 'Danh mục mới']}
            />
          </div>
          <Switch
            checked={draft.inStock}
            onChange={(v) => setField('inStock', v)}
            label={draft.inStock ? 'Còn hàng' : 'Hết hàng'}
            hint="Khách hàng có thể thấy và đặt món này khi còn hàng."
          />
        </div>
      </div>
    </Modal>
  );
}
