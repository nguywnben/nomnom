import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import Input from '../../components/Input.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Tabs from '../../components/Tabs.jsx';
import { categories, restaurants } from '../../data/mock.js';

const PRICES = [1, 2, 3, 4];

export default function CustomerSearch() {
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get('q') || '';
  const initialCat = params.get('cat') || '';

  const [q, setQ] = useState(initialQuery);
  const [tags, setTags] = useState(initialCat ? [initialCat] : []);
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(5);
  const [prices, setPrices] = useState([]);
  const [view, setView] = useState('grid');

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      if (q && !`${r.name} ${r.tagline} ${r.cuisine} ${r.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      if (tags.length) {
        const restTags = [...r.tags, r.cuisine.toLowerCase()].map((t) => t.toLowerCase());
        // match if any selected tag is in this restaurant
        const wanted = tags.map((t) => t.toLowerCase());
        const hit = wanted.some((t) => restTags.some((rt) => rt.includes(t)) || categoryToTag(t) === r.cuisine.toLowerCase());
        if (!hit) return false;
      }
      if (r.rating < minRating) return false;
      if (r.distanceKm > maxDistance) return false;
      if (prices.length && !prices.includes(r.priceLevel)) return false;
      return true;
    });
  }, [q, tags, minRating, maxDistance, prices]);

  const toggle = (setter, list, v) =>
    setter(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="container-page py-xl">
      <div className="mb-base flex flex-col gap-2">
        <div className="text-caption-uppercase text-body">Khám phá</div>
        <h1 className="text-display-lg text-ink">Tìm bữa ăn tiếp theo của bạn.</h1>
      </div>

      {/* Search */}
      <div className="mb-base flex flex-col gap-xs md:flex-row md:items-center">
        <Input
          leadingIcon="search"
          placeholder="Tìm kiếm quán ăn, món ăn, loại ẩm thực…"
          aria-label="Tìm kiếm quán và món"
          className="flex-1"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            const np = new URLSearchParams(params);
            np.set('q', e.target.value);
            setParams(np, { replace: true });
          }}
        />
        <div className="flex items-center gap-xs">
          <Tabs
            items={[
              { value: 'grid', label: 'Lưới' },
              { value: 'list', label: 'Danh sách' },
            ]}
            value={view}
            onChange={setView}
          />
          <Badge tone="outline">{filtered.length} kết quả</Badge>
        </div>
      </div>

      <div className="grid gap-base md:grid-cols-[260px_1fr]">
        {/* Sidebar filters */}
        <aside className="flex flex-col gap-base">
          <Card padded className="flex flex-col gap-md">
            <FilterGroup title="Danh mục">
              <div className="flex flex-wrap gap-1">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => toggle(setTags, tags, c.id)}
                    className={
                      'rounded-pill border px-2.5 py-1 text-caption transition-colors ' +
                      (tags.includes(c.id)
                        ? 'border-ink bg-primary text-on-primary'
                        : 'border-hairline-strong bg-surface-card text-ink hover:bg-canvas-soft')
                    }
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title={`Khoảng cách tối đa — ${maxDistance.toFixed(1)} km`}>
              <input
                type="range"
                min={0.5}
                max={5}
                step={0.1}
                value={maxDistance}
                onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
                className="w-full accent-black"
              />
            </FilterGroup>

            <FilterGroup title={`Đánh giá tối thiểu — ${minRating.toFixed(1)}★`}>
              <input
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full accent-black"
              />
            </FilterGroup>

            <FilterGroup title="Giá">
              <div className="flex gap-1">
                {PRICES.map((p) => (
                  <button
                    key={p}
                    onClick={() => toggle(setPrices, prices, p)}
                    className={
                      'h-9 flex-1 rounded-md border text-button transition-colors ' +
                      (prices.includes(p)
                        ? 'border-ink bg-primary text-on-primary'
                        : 'border-hairline-strong bg-surface-card text-ink hover:bg-canvas-soft')
                    }
                  >
                    {'$'.repeat(p)}
                  </button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="Thẻ">
              {['Vegetarian', 'Vegan', 'Spicy', 'Late-night', 'Breakfast'].map((t) => (
                <label key={t} className="flex items-center gap-2 py-1 text-body-sm text-ink">
                  <input
                    type="checkbox"
                    className="accent-black"
                    checked={tags.includes(t)}
                    onChange={() => toggle(setTags, tags, t)}
                  />
                  {t === 'Vegetarian' ? 'Chay' : t === 'Vegan' ? 'Thuần chay' : t === 'Spicy' ? 'Cay' : t === 'Late-night' ? 'Ăn đêm' : t === 'Breakfast' ? 'Ăn sáng' : t}
                </label>
              ))}
            </FilterGroup>

            <Button
              variant="secondary"
              onClick={() => {
                setQ('');
                setTags([]);
                setMinRating(0);
                setMaxDistance(5);
                setPrices([]);
              }}
            >
              Đặt lại bộ lọc
            </Button>
          </Card>
        </aside>

        {/* Results */}
        <div className="flex flex-col gap-base">
          {filtered.length === 0 ? (
            <EmptyState
              icon="search"
              title="Không có quán ăn nào phù hợp với bộ lọc này"
              message="Hãy thử mở rộng khoảng cách, giảm mức đánh giá tối thiểu hoặc xóa các thẻ."
            />
          ) : view === 'grid' ? (
            <div className="grid gap-base md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((r) => (
                <ResultCard key={r.id} r={r} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-hairline rounded-lg border border-hairline-strong bg-surface-card">
              {filtered.map((r) => (
                <ResultRow key={r.id} r={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div>
      <div className="text-caption-uppercase text-body mb-xs">{title}</div>
      {children}
    </div>
  );
}

function ResultCard({ r }) {
  return (
    <Link
      to={`/app/restaurant/${r.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-hairline-strong bg-surface-card transition-shadow hover:shadow-soft"
    >
      <Image src={r.banner} alt={r.name} ratio="16/10" className="w-full" />
      <div className="flex flex-1 flex-col gap-1 p-base">
        <div className="flex items-center justify-between">
          <span className="text-title-md text-ink">{r.name}</span>
          <span className="inline-flex items-center gap-1 text-body-sm text-ink">
            <Icon name="starFilled" size={12} />
            <span className="nums">{r.rating.toFixed(1)}</span>
          </span>
        </div>
        <span className="text-body-sm text-body">{r.tagline}</span>
        <div className="mt-auto flex items-center gap-base pt-2 text-caption text-body">
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" size={12} /> {r.eta}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="pin" size={12} /> {r.distanceKm} km
          </span>
          <span>{'$'.repeat(r.priceLevel)}</span>
        </div>
      </div>
    </Link>
  );
}

function ResultRow({ r }) {
  return (
    <Link to={`/app/restaurant/${r.id}`} className="flex items-center gap-base p-sm hover:bg-canvas-soft">
      <Image src={r.banner} alt={r.name} className="h-16 w-24 rounded-md" ratio="16/10" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-title-md text-ink">{r.name}</span>
          <span className="inline-flex items-center gap-1 text-body-sm text-ink">
            <Icon name="starFilled" size={12} />
            <span className="nums">{r.rating.toFixed(1)}</span>
          </span>
        </div>
        <span className="text-body-sm text-body">{r.tagline}</span>
        <div className="mt-1 flex items-center gap-base text-caption text-body">
          <span>{r.eta}</span> <span>{r.distanceKm} km</span> <span>{'$'.repeat(r.priceLevel)}</span>
        </div>
      </div>
      <Icon name="arrowRight" size={16} className="text-body" />
    </Link>
  );
}

function categoryToTag(cat) {
  switch (cat) {
    case 'pizza':
      return 'italian';
    case 'burgers':
      return 'american';
    case 'sushi':
      return 'japanese';
    case 'noodles':
      return 'japanese';
    case 'tacos':
      return 'mexican';
    case 'bowls':
      return 'healthy';
    case 'drinks':
      return 'cafe';
    case 'desserts':
      return 'bakery';
    default:
      return cat;
  }
}
