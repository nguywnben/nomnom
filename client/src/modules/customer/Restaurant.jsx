import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import StarRating from '../../components/StarRating.jsx';
import Avatar from '../../components/Avatar.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { restaurants, sampleReviews } from '../../data/mock.js';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';

export default function CustomerRestaurant() {
  const { id } = useParams();
  const nav = useNavigate();
  const r = restaurants.find((x) => x.id === id);
  const { addToCart, setCartOpen, pushToast } = useApp();
  const [cat, setCat] = useState('Tất cả');

  const categoriesInMenu = useMemo(
    () => ['Tất cả', ...Array.from(new Set(r?.menu.map((m) => m.category)))],
    [r],
  );

  if (!r) {
    return (
      <div className="container-page py-section">
        <EmptyState
          icon="store"
          title="Không tìm thấy quán ăn"
          message="Trang bạn đang tìm có thể đã bị di chuyển."
          action={
            <Link to="/app/search">
              <Button variant="secondary">Quay lại tìm kiếm</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const filtered = cat === 'Tất cả' ? r.menu : r.menu.filter((m) => m.category === cat);

  return (
    <div className="bg-canvas">
      {/* Banner */}
      <div className="relative">
        <Image src={r.banner} alt={r.name} ratio="21/9" className="w-full max-h-[420px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="container-page pb-lg">
            <div className="flex items-end gap-base">
              <Image
                src={r.logo}
                alt={r.name}
                className="h-20 w-20 rounded-lg border border-hairline-strong"
                ratio="1"
              />
              <div className="flex-1 text-on-dark">
                <div className="flex items-center gap-2">
                  {r.tags.map((t) => (
                    <Badge key={t} tone="default" className="!bg-canvas/15 !text-on-dark">
                      {t}
                    </Badge>
                  ))}
                  {!r.open && <Badge tone="error">Đóng cửa</Badge>}
                </div>
                <h1 className="mt-1 text-display-lg">{r.name}</h1>
                <div className="text-body-sm text-on-dark-soft">{r.tagline}</div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Button variant="dark">Lưu</Button>
                <Button variant="primary">Chia sẻ</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <section className="border-b border-hairline">
        <div className="container-page flex flex-wrap items-center gap-base py-base text-body-sm">
          <span className="inline-flex items-center gap-1 text-ink">
            <Icon name="starFilled" size={14} /> <strong className="nums">{r.rating.toFixed(1)}</strong>
            <span className="text-body">({r.reviewCount} đánh giá)</span>
          </span>
          <span className="inline-flex items-center gap-1 text-body">
            <Icon name="clock" size={14} /> {r.eta}
          </span>
          <span className="inline-flex items-center gap-1 text-body">
            <Icon name="pin" size={14} /> {r.distanceKm} km · {r.address}
          </span>
          <span className="inline-flex items-center gap-1 text-body">
            <Icon name="cash" size={14} /> phí giao {formatVnd(r.fee)}
          </span>
          <span className="ml-auto inline-flex items-center gap-1">
            {r.open ? (
              <Badge tone="success" dot>Đang mở cửa</Badge>
            ) : (
              <Badge tone="error" dot>Đóng cửa</Badge>
            )}
          </span>
        </div>
      </section>

      <div className="container-page grid gap-xl py-xl md:grid-cols-[1fr_320px]">
        {/* Menu */}
        <div>
          <div className="mb-base flex items-center gap-xs overflow-x-auto no-scrollbar">
            {categoriesInMenu.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={
                  'h-9 whitespace-nowrap rounded-md px-sm text-button transition-colors ' +
                  (cat === c
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-card border border-hairline-strong text-ink hover:bg-canvas-soft')
                }
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-base sm:grid-cols-2">
            {filtered.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                disabled={!r.open}
                onAdd={() => {
                  if (!item.inStock) {
                    pushToast({ kind: 'error', title: 'Hết hàng', message: item.name });
                    return;
                  }
                  if (!r.open) {
                    pushToast({ kind: 'error', title: 'Quán ăn đóng cửa', message: 'Vui lòng đặt hàng vào lần mở cửa tiếp theo.' });
                    return;
                  }
                  addToCart(r.id, item, 1);
                  setCartOpen(true);
                }}
              />
            ))}
          </div>

          {/* Reviews */}
          <section className="mt-xxl">
            <div className="mb-base flex items-center justify-between">
              <h2 className="text-display-sm text-ink">Đánh giá gần đây</h2>
              <Button
                variant="tertiary"
                onClick={() => nav(`/app/reviews/${r.id}`)}
              >
                Viết đánh giá
              </Button>
            </div>
            <div className="grid gap-base md:grid-cols-2">
              {sampleReviews.map((rev) => (
                <Card key={rev.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-sm">
                    <Avatar src={rev.avatar} name={rev.author} />
                    <div className="flex-1">
                      <div className="text-body-sm font-semibold text-ink">{rev.author}</div>
                      <div className="text-caption text-body">{rev.when}</div>
                    </div>
                    <StarRating value={rev.rating} />
                  </div>
                  <p className="text-body-sm text-body">{rev.text}</p>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky info card */}
        <aside className="hidden md:block">
          <Card padded className="sticky top-24 flex flex-col gap-base">
            <div>
              <div className="text-caption-uppercase text-body">Giờ hoạt động hôm nay</div>
              <div className="text-body-sm text-ink">11:30 — 22:00</div>
            </div>
            <div>
              <div className="text-caption-uppercase text-body">Ẩm thực</div>
              <div className="text-body-sm text-ink">{r.cuisine}</div>
            </div>
            <div>
              <div className="text-caption-uppercase text-body">Địa chỉ</div>
              <div className="text-body-sm text-ink">{r.address}</div>
            </div>
            <Button variant="secondary" leadingIcon="chat" onClick={() => nav('/chat/chat-merchant')}>
              Trò chuyện với quán
            </Button>
            <Button onClick={() => setCartOpen(true)}>Xem giỏ hàng</Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function MenuCard({ item, onAdd, disabled }) {
  const off = disabled || !item.inStock;
  return (
    <Card padded={false} className="flex overflow-hidden">
      <div className="flex-1 p-base">
        <div className="flex items-start justify-between gap-2">
          <div className="text-title-md text-ink">{item.name}</div>
          <span className="nums text-title-sm text-ink">{formatVnd(item.price)}</span>
        </div>
        <p className="mt-1 text-body-sm text-body line-clamp-2">{item.desc}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {item.tags?.map((t) => (
            <Badge key={t} tone="outline">{t}</Badge>
          ))}
          {!item.inStock && <Badge tone="error">Hết hàng</Badge>}
        </div>
        <div className="mt-sm">
          <Button
            variant={off ? 'secondary' : 'primary'}
            size="sm"
            leadingIcon="plus"
            disabled={off}
            onClick={onAdd}
          >
            {off ? 'Không có sẵn' : 'Thêm vào giỏ hàng'}
          </Button>
        </div>
      </div>
      <Image src={item.image} alt={item.name} className="w-32" ratio="1" />
    </Card>
  );
}
