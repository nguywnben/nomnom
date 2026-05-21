import { useMemo, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Tabs from '../../components/Tabs.jsx';
import StarRating from '../../components/StarRating.jsx';
import Avatar from '../../components/Avatar.jsx';
import { Textarea } from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { sampleReviews } from '../../data/mock.js';

// Trang đánh giá cho chủ quán — cho phép phản hồi từng review,
// khớp với `reviews.reply_text` + `reply_at`.
export default function MerchantReviews() {
  const { pushToast } = useApp();
  const [items, setItems] = useState(() =>
    (sampleReviews || []).map((r, i) => ({
      id: r.id || `rv-${i}`,
      customerName: r.author || r.name || 'Khách hàng',
      avatar: r.avatar,
      rating: r.rating ?? 5,
      comment: r.text || r.comment || 'Món ăn ngon, giao nhanh.',
      orderId: r.orderId || `ORD-${String(i).padStart(4, '0')}`,
      at: r.at || Date.now() - i * 86400000,
      reply: r.reply || null,
    })),
  );
  const [filter, setFilter] = useState('all');
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState('');

  const stats = useMemo(() => {
    if (items.length === 0) return { avg: 0, count: 0, dist: [0, 0, 0, 0, 0] };
    const sum = items.reduce((s, r) => s + r.rating, 0);
    const dist = [0, 0, 0, 0, 0];
    items.forEach((r) => (dist[Math.max(0, Math.min(4, r.rating - 1))] += 1));
    return { avg: sum / items.length, count: items.length, dist };
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === 'unreplied') return items.filter((r) => !r.reply);
    if (filter === 'low') return items.filter((r) => r.rating <= 3);
    return items;
  }, [items, filter]);

  const submitReply = (id) => {
    if (!draft.trim()) return;
    setItems((cur) => cur.map((r) => (r.id === id ? { ...r, reply: { text: draft, at: Date.now() } } : r)));
    setDraft('');
    setActiveId(null);
    pushToast({ kind: 'success', title: 'Đã phản hồi', message: 'Khách hàng sẽ nhận được thông báo.' });
  };

  return (
    <div className="space-y-base">
      <div>
        <div className="text-caption-uppercase text-body">Khách hàng</div>
        <h1 className="text-display-lg text-ink">Đánh giá</h1>
      </div>

      <div className="grid gap-base lg:grid-cols-[280px_1fr]">
        <Card padded>
          <div className="text-display-lg text-ink nums">{stats.avg.toFixed(1)}</div>
          <StarRating value={stats.avg} />
          <div className="mt-1 text-caption text-body">
            {stats.count} đánh giá từ khách hàng
          </div>
          <div className="mt-base space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const c = stats.dist[star - 1];
              const pct = stats.count ? Math.round((c / stats.count) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-caption">
                  <span className="w-4 text-ink">{star}</span>
                  <Icon name="starFilled" size={12} className="text-ink" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-canvas-soft">
                    <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-body nums">{c}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-base">
          <Tabs
            className="w-fit max-w-full"
            items={[
              { value: 'all', label: 'Tất cả' },
              { value: 'unreplied', label: 'Chưa phản hồi' },
              { value: 'low', label: '≤ 3★' },
            ]}
            value={filter}
            onChange={setFilter}
          />

          {filtered.length === 0 ? (
            <EmptyState
              icon="starFilled"
              title="Chưa có đánh giá phù hợp"
              message="Khi khách đánh giá xong đơn hàng, các nhận xét sẽ xuất hiện ở đây."
            />
          ) : (
            <ul className="space-y-base">
              {filtered.map((r) => (
                <Card key={r.id} padded as="li">
                  <div className="flex items-start gap-sm">
                    <Avatar src={r.avatar} name={r.customerName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-body-sm font-semibold text-ink">{r.customerName}</div>
                          <div className="text-caption text-body">
                            Đơn <span className="nums">{r.orderId}</span> · {new Date(r.at).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        <StarRating value={r.rating} />
                      </div>
                      <p className="mt-2 text-body-sm text-ink">{r.comment}</p>

                      {r.reply ? (
                        <div className="mt-sm rounded-md border border-hairline-strong bg-canvas-soft p-sm">
                          <div className="flex items-center justify-between text-caption text-body">
                            <span className="inline-flex items-center gap-1">
                              <Icon name="store" size={12} /> Phản hồi của quán
                            </span>
                            <span>{new Date(r.reply.at).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <p className="mt-1 text-body-sm text-ink">{r.reply.text}</p>
                        </div>
                      ) : activeId === r.id ? (
                        <div className="mt-sm space-y-2">
                          <Textarea
                            rows={3}
                            placeholder="Cảm ơn bạn đã đánh giá…"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => { setActiveId(null); setDraft(''); }}>Hủy</Button>
                            <Button onClick={() => submitReply(r.id)} leadingIcon="send">Gửi phản hồi</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-2">
                          <Badge tone="warning">Chưa phản hồi</Badge>
                          <button
                            onClick={() => { setActiveId(r.id); setDraft(''); }}
                            className="text-button text-text-link hover:underline"
                          >
                            Trả lời khách
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
