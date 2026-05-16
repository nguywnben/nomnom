import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Badge from '../../components/Badge.jsx';
import Card from '../../components/Card.jsx';
import StatCard from '../../components/StatCard.jsx';
import Icon from '../../components/Icon.jsx';
import { adminCityMix, adminGmvWeekly } from '../../data/mock.js';
import { formatVnd, formatVndAxisBillions } from '../../lib/formatVnd.js';

const COLORS = ['#171717', '#3b3b3b', '#60646c', '#a8c8e8', '#cfe7ff'];

export default function AdminOverview() {
  const last = adminGmvWeekly[adminGmvWeekly.length - 1];
  const prev = adminGmvWeekly[adminGmvWeekly.length - 2];
  const gmvDelta = (((last.gmv - prev.gmv) / prev.gmv) * 100).toFixed(1);
  const gmvEightWeekTotal = adminGmvWeekly.reduce((s, w) => s + w.gmv, 0);

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Trong vòng 8 tuần</div>
          <h1 className="text-display-lg text-ink">Tình trạng nền tảng</h1>
        </div>
        <Badge tone="live" dot>Dữ liệu trực tiếp — đang làm mới</Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-base sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="GMV (tuần này)"
          value={formatVnd(last.gmv)}
          delta={`+${gmvDelta}%`}
          sub="so với tuần trước"
          icon="cash"
        />
        <StatCard
          label="Tổng đơn hàng"
          value={last.orders.toLocaleString()}
          delta="+4.8%"
          sub="so với tuần trước"
          icon="package"
        />
        <StatCard
          label="Tài xế đang hoạt động"
          value="318"
          delta="+12"
          sub="so với hôm qua"
          icon="bike"
        />
        <StatCard
          label="Quán ăn đang hoạt động"
          value="142"
          delta="+3"
          sub="tuần này"
          icon="store"
        />
      </div>

      {/* GMV chart */}
      <div className="grid gap-base lg:grid-cols-3">
        <Card padded className="lg:col-span-2">
          <div className="mb-base flex items-center justify-between">
            <div>
              <div className="text-caption-uppercase text-body">Xu hướng GMV</div>
              <div className="text-title-md text-ink">8 tuần qua</div>
            </div>
            <Badge tone="outline">Tổng 8 tuần: {formatVnd(gmvEightWeekTotal)}</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={adminGmvWeekly}>
                <defs>
                  <linearGradient id="gmv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f0f0f3" strokeDasharray="3 3" />
                <XAxis dataKey="week" stroke="#999999" tick={{ fontSize: 12 }} />
                <YAxis stroke="#999999" tick={{ fontSize: 12 }} tickFormatter={(v) => formatVndAxisBillions(v)} />
                <Tooltip
                  contentStyle={{
                    border: '1px solid #dcdee0',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                  formatter={(v) => [formatVnd(v), 'GMV']}
                />
                <Area type="monotone" dataKey="gmv" stroke="#171717" strokeWidth={2} fill="url(#gmv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padded>
          <div className="mb-base">
            <div className="text-caption-uppercase text-body">Phân bổ theo khu vực</div>
            <div className="text-title-md text-ink">Đơn hàng theo thành phố</div>
          </div>
          <div className="grid h-48 grid-cols-2 items-center gap-sm">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={adminCityMix} dataKey="share" nameKey="city" innerRadius={36} outerRadius={64}>
                  {adminCityMix.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    border: '1px solid #dcdee0',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                  formatter={(v, n) => [`${v}%`, n]}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="text-body-sm space-y-1">
              {adminCityMix.map((c, i) => (
                <li key={c.city} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-pill"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="flex-1 text-ink">{c.city}</span>
                  <span className="nums text-body">{c.share}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* Bar — orders/week */}
      <Card padded>
        <div className="mb-base flex items-center justify-between">
          <div>
            <div className="text-caption-uppercase text-body">Khối lượng đơn hàng</div>
            <div className="text-title-md text-ink">Hàng tuần</div>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={adminGmvWeekly}>
              <CartesianGrid stroke="#f0f0f3" strokeDasharray="3 3" />
              <XAxis dataKey="week" stroke="#999999" tick={{ fontSize: 12 }} />
              <YAxis stroke="#999999" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  border: '1px solid #dcdee0',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Bar dataKey="orders" fill="#171717" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Operational alerts */}
      <Card padded>
        <div className="mb-base flex items-center justify-between">
          <div>
            <div className="text-caption-uppercase text-body">Vận hành</div>
            <div className="text-title-md text-ink">Cảnh báo &amp; sự kiện</div>
          </div>
          <Badge tone="warning">3 cần xem xét</Badge>
        </div>
        <ul className="divide-y divide-hairline">
          {[
            { kind: 'warning', text: '8 tài xế tự động bị đình chỉ do đánh giá thấp', when: '12 phút trước' },
            { kind: 'success', text: '14 khoản thanh toán cho quán ăn được phê duyệt', when: '3 giờ trước' },
            { kind: 'info', text: 'Sự cố độ trễ API đã được giải quyết (khu vực NY-1)', when: '6 giờ trước' },
            { kind: 'warning', text: '2 yêu cầu hoàn tiền đang chờ xem xét', when: '11 giờ trước' },
          ].map((a, i) => (
            <li key={i} className="flex items-center gap-sm py-sm">
              <span
                className={
                  'grid h-8 w-8 place-items-center rounded-md ' +
                  (a.kind === 'success'
                    ? 'bg-[#e6f4ea] text-success'
                    : a.kind === 'warning'
                      ? 'bg-[#fbf1de] text-accent-warning'
                      : 'bg-surface-strong text-ink')
                }
              >
                <Icon name={a.kind === 'success' ? 'check' : 'alert'} size={14} />
              </span>
              <span className="flex-1 text-body-sm text-ink">{a.text}</span>
              <span className="text-caption text-body">{a.when}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
