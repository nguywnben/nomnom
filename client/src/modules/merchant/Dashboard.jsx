import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from 'recharts';
import Badge from '../../components/Badge.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import StatCard from '../../components/StatCard.jsx';
import { merchantDailyRevenue, merchantTopItems, restaurants } from '../../data/mock.js';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';

export default function MerchantDashboard() {
  const { merchantOrders, currentMerchant } = useApp();
  // Khi tích hợp API: thay bằng isPending / isLoading từ fetch.
  const metricsLoading = false;

  const r = restaurants.find((x) => x.id === currentMerchant.restaurantId);

  const activeCount = merchantOrders.new.length + merchantOrders.preparing.length + merchantOrders.ready.length;
  const todayRevenue = merchantDailyRevenue[merchantDailyRevenue.length - 1].revenue;
  const weekRevenue = merchantDailyRevenue.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-base">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-caption-uppercase text-body">Hôm nay, {new Date().toLocaleDateString('vi-VN')}</div>
          <h1 className="text-display-lg text-ink">Bảng điều khiển</h1>
        </div>
        <Badge tone={r?.open ? 'success' : 'error'} dot>
          {r?.open ? 'Mở cửa nhận đơn' : 'Đóng cửa'}
        </Badge>
      </div>

      {/* Stats — skeleton mirrors StatCard + Card padding */}
      {metricsLoading ? (
        <div className="grid gap-base sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padded className="flex flex-col gap-sm">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 min-h-[11px] w-[7.5rem]" rounded="sm" />
                <Skeleton className="h-8 w-8 shrink-0" rounded="md" />
              </div>
              <Skeleton className="h-8 min-h-8 w-28" rounded="sm" />
              <div className="flex min-h-[18px] flex-wrap items-center gap-2">
                <Skeleton className="h-3 w-14" rounded="sm" />
                <Skeleton className="h-3 w-24" rounded="sm" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-base sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Doanh thu hôm nay"
            value={formatVnd(todayRevenue)}
            delta="+12.4%"
            icon="cash"
            sub="so với hôm qua"
          />
          <StatCard
            label="Đơn hàng đang hoạt động"
            value={activeCount}
            delta="3 mới"
            icon="bike"
            sub="cần xử lý"
          />
          <StatCard
            label="Doanh thu tuần"
            value={formatVnd(weekRevenue)}
            delta="+8.1%"
            icon="trending"
            sub="so với tuần trước"
          />
          <StatCard
            label="Đánh giá"
            value="4.8"
            delta="+0.1"
            icon="starFilled"
            sub="tuần này"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-base lg:grid-cols-3">
        <Card padded className="lg:col-span-2">
          <div className="mb-base flex items-center justify-between">
            <div>
              <div className="text-caption-uppercase text-body">Doanh thu</div>
              <div className="text-title-md text-ink">7 ngày qua</div>
            </div>
            <Badge tone="outline">tổng cộng {formatVnd(weekRevenue)}</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={merchantDailyRevenue}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f0f0f3" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#999999" tick={{ fontSize: 12 }} />
                <YAxis stroke="#999999" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    border: '1px solid #dcdee0',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                  labelStyle={{ color: '#171717' }}
                  formatter={(v) => [formatVnd(v), 'Doanh thu']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#171717"
                  strokeWidth={2}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padded>
          <div className="mb-base">
            <div className="text-caption-uppercase text-body">Món bán chạy</div>
            <div className="text-title-md text-ink">Tuần này</div>
          </div>
          <div className="space-y-sm">
            {merchantTopItems.map((it, i) => (
              <div key={it.name} className="flex items-center gap-sm">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-surface-strong text-caption font-semibold text-ink nums">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="text-body-sm font-semibold text-ink">{it.name}</div>
                  <div className="text-caption text-body">đã bán {it.sold}</div>
                </div>
                <span className="nums text-body-sm text-ink">{formatVnd(it.revenue)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-base lg:grid-cols-3">
        <Card padded className="lg:col-span-2">
          <div className="mb-base flex items-center justify-between">
            <div>
              <div className="text-caption-uppercase text-body">Số lượng món</div>
              <div className="text-title-md text-ink">Bán chạy nhất</div>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={merchantTopItems}>
                <CartesianGrid stroke="#f0f0f3" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#999999" tick={{ fontSize: 12 }} />
                <YAxis stroke="#999999" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    border: '1px solid #dcdee0',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="sold" fill="#171717" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padded>
          <div className="mb-base">
            <div className="text-caption-uppercase text-body">Đang phục vụ</div>
            <div className="text-title-md text-ink">Đơn hàng trực tiếp</div>
          </div>
          <ul className="space-y-2">
            {[...merchantOrders.new, ...merchantOrders.preparing, ...merchantOrders.ready]
              .slice(0, 6)
              .map((o) => (
                <li key={o.id} className="flex items-center gap-sm rounded-md border border-hairline px-sm py-2">
                  <Icon name="package" size={14} className="text-body" />
                  <div className="flex-1 min-w-0">
                    <div className="text-body-sm font-semibold text-ink truncate">
                      #{o.id} · {o.customerName}
                    </div>
                    <div className="text-caption text-body truncate">
                      {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                    </div>
                  </div>
                  <span className="nums text-body-sm text-ink">{formatVnd(o.total)}</span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
