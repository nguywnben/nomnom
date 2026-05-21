import { useMemo, useState } from 'react';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Input from '../../components/Input.jsx';
import StarRating from '../../components/StarRating.jsx';
import Tabs from '../../components/Tabs.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useApp } from '../../context/AppContext.jsx';

// Kiểm duyệt đánh giá — `reviews.is_hidden`.
const SAMPLE = [
  { id: 'rv-1', customer: 'Mia C.', restaurant: 'Cinque Pizzeria', orderId: 'ORD-A1B2C', rating: 1, comment: 'Đồ ăn dở quá, không bao giờ quay lại — quán dùng đồ giả!', isHidden: false, at: Date.now() - 3 * 60 * 60 * 1000, flags: 4 },
  { id: 'rv-2', customer: 'Owen T.', restaurant: 'Hachi Ramen', orderId: 'ORD-K9X', rating: 5, comment: 'Súp đậm vị, giao nhanh.', isHidden: false, at: Date.now() - 24 * 60 * 60 * 1000, flags: 0 },
  { id: 'rv-3', customer: 'Rae P.', restaurant: 'Junebug Burgers', orderId: 'ORD-J7P', rating: 2, comment: 'Burger nguội, tài xế chửi rất bậy bạ — không chấp nhận được!!!', isHidden: true, at: Date.now() - 2 * 24 * 60 * 60 * 1000, flags: 2 },
  { id: 'rv-4', customer: 'Bao N.', restaurant: 'Verdant Bowls', orderId: 'ORD-T2W', rating: 4, comment: 'Ngon nhưng portion hơi nhỏ.', isHidden: false, at: Date.now() - 4 * 24 * 60 * 60 * 1000, flags: 0 },
];

export default function AdminReviewsModeration() {
  const { pushToast } = useApp();
  const [items, setItems] = useState(SAMPLE);
  const [tab, setTab] = useState('flagged');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((r) => {
      if (tab === 'flagged' && r.flags === 0) return false;
      if (tab === 'hidden' && !r.isHidden) return false;
      if (tab === 'low' && r.rating > 3) return false;
      if (!needle) return true;
      return `${r.customer} ${r.restaurant} ${r.comment}`.toLowerCase().includes(needle);
    });
  }, [items, tab, q]);

  const hide = (id) => {
    setItems((cur) => cur.map((r) => (r.id === id ? { ...r, isHidden: true } : r)));
    pushToast({ kind: 'info', title: 'Đã ẩn đánh giá', message: 'Khách hàng và quán sẽ không còn thấy.' });
  };
  const unhide = (id) => {
    setItems((cur) => cur.map((r) => (r.id === id ? { ...r, isHidden: false } : r)));
    pushToast({ kind: 'success', title: 'Đã hiện lại đánh giá', message: 'Đánh giá hiển thị bình thường.' });
  };
  const clearFlag = (id) =>
    setItems((cur) => cur.map((r) => (r.id === id ? { ...r, flags: 0 } : r)));

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Khách hàng</div>
          <h1 className="text-display-lg text-ink">Kiểm duyệt đánh giá</h1>
        </div>
        <Input
          className="w-full md:w-72"
          leadingIcon="search"
          placeholder="Tìm theo khách, quán, nội dung…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Tabs
        className="w-fit max-w-full"
        items={[
          { value: 'flagged', label: 'Bị báo cáo' },
          { value: 'low', label: '≤ 3 sao' },
          { value: 'hidden', label: 'Đã ẩn' },
          { value: 'all', label: 'Tất cả' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {list.length === 0 ? (
        <EmptyState icon="starFilled" title="Không có đánh giá phù hợp" />
      ) : (
        <ul className="space-y-base">
          {list.map((r) => (
            <Card padded as="li" key={r.id}>
              <div className="flex items-start gap-sm">
                <Avatar name={r.customer} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-body-sm font-semibold text-ink">{r.customer}</div>
                      <div className="text-caption text-body">
                        {r.restaurant} · Đơn <span className="nums">{r.orderId}</span> ·{' '}
                        {new Date(r.at).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating value={r.rating} />
                      {r.flags > 0 && <Badge tone="warning">{r.flags} báo cáo</Badge>}
                      {r.isHidden && <Badge tone="error">Đã ẩn</Badge>}
                    </div>
                  </div>
                  <p className="mt-2 text-body-sm text-ink">{r.comment}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {r.isHidden ? (
                      <Button size="sm" variant="secondary" leadingIcon="check" onClick={() => unhide(r.id)}>
                        Hiện lại
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" leadingIcon="bellOff" onClick={() => hide(r.id)}>
                        Ẩn đánh giá
                      </Button>
                    )}
                    {r.flags > 0 && (
                      <Button size="sm" variant="ghost" onClick={() => clearFlag(r.id)}>
                        Xóa cờ báo cáo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
