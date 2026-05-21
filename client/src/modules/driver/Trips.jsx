import { useMemo, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Tabs from '../../components/Tabs.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { formatVnd } from '../../lib/formatVnd.js';

// Lịch sử chuyến giao — khớp `driver_assignments` (distance_km, earning_amount, status, delivered_at).
const TRIPS = [
  { id: 'TRP-2451', orderId: 'ORD-A1B2C', restaurant: 'Cinque Pizzeria', distance: 3.4, earnings: 35_000, status: 'delivered', at: Date.now() - 2 * 60 * 60 * 1000 },
  { id: 'TRP-2450', orderId: 'ORD-Z8X', restaurant: 'Junebug Burgers', distance: 1.8, earnings: 22_000, status: 'delivered', at: Date.now() - 4 * 60 * 60 * 1000 },
  { id: 'TRP-2449', orderId: 'ORD-K9L', restaurant: 'Hachi Ramen', distance: 4.6, earnings: 48_000, status: 'delivered', at: Date.now() - 22 * 60 * 60 * 1000 },
  { id: 'TRP-2448', orderId: 'ORD-V3W', restaurant: 'Verdant Bowls', distance: 2.1, earnings: 0, status: 'cancelled', at: Date.now() - 28 * 60 * 60 * 1000 },
  { id: 'TRP-2447', orderId: 'ORD-J7P', restaurant: 'La Carreta', distance: 3.0, earnings: 32_000, status: 'delivered', at: Date.now() - 2 * 24 * 60 * 60 * 1000 },
  { id: 'TRP-2446', orderId: 'ORD-Q1R', restaurant: 'Daybreak Coffee', distance: 0.9, earnings: 18_000, status: 'delivered', at: Date.now() - 3 * 24 * 60 * 60 * 1000 },
];

export default function DriverTrips() {
  const [range, setRange] = useState('today');

  const list = useMemo(() => {
    const now = Date.now();
    return TRIPS.filter((t) => {
      const d = (now - t.at) / (24 * 60 * 60 * 1000);
      if (range === 'today') return d < 1;
      if (range === 'week') return d < 7;
      return true;
    });
  }, [range]);

  const stats = useMemo(() => {
    const completed = list.filter((t) => t.status === 'delivered');
    const earnings = completed.reduce((s, t) => s + t.earnings, 0);
    const distance = completed.reduce((s, t) => s + t.distance, 0);
    return { count: completed.length, earnings, distance };
  }, [list]);

  return (
    <div className="px-base py-base">
      <div className="mb-base flex items-end justify-between gap-2">
        <div>
          <div className="text-caption-uppercase text-body">Lịch sử</div>
          <h1 className="text-display-md text-ink">Chuyến giao</h1>
        </div>
        <Button variant="secondary" leadingIcon="download" size="sm">
          Xuất CSV
        </Button>
      </div>

      <Tabs
        className="mb-base w-fit max-w-full"
        items={[
          { value: 'today', label: 'Hôm nay' },
          { value: 'week', label: '7 ngày' },
          { value: 'all', label: 'Tất cả' },
        ]}
        value={range}
        onChange={setRange}
      />

      <div className="mb-base grid grid-cols-3 gap-2">
        <Stat title="Chuyến" value={String(stats.count)} />
        <Stat title="Thu nhập" value={formatVnd(stats.earnings)} />
        <Stat title="Quãng đường" value={`${stats.distance.toFixed(1)} km`} />
      </div>

      {list.length === 0 ? (
        <EmptyState icon="bike" title="Chưa có chuyến nào" message="Hãy bật trực tuyến để bắt đầu nhận đơn." />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-hairline">
            {list.map((t) => (
              <li key={t.id} className="flex items-center gap-sm p-base">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-canvas-soft text-ink">
                  <Icon name={t.status === 'delivered' ? 'check' : 'x'} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-body-sm font-medium text-ink truncate">{t.restaurant}</div>
                  <div className="nums text-caption text-body">
                    {t.id} · {t.distance.toFixed(1)} km · {new Date(t.at).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="nums text-body-sm font-semibold text-ink">
                    {t.earnings > 0 ? `+${formatVnd(t.earnings)}` : '—'}
                  </div>
                  <Badge tone={t.status === 'delivered' ? 'success' : 'error'}>
                    {t.status === 'delivered' ? 'Đã giao' : 'Hủy'}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <Card padded className="text-center">
      <div className="text-caption-uppercase text-body">{title}</div>
      <div className="mt-1 text-title-md text-ink nums">{value}</div>
    </Card>
  );
}
