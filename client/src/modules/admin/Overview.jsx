import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Badge from '../../components/Badge.jsx';
import Card from '../../components/Card.jsx';
import StatCard from '../../components/StatCard.jsx';
import { fetchAdminOverview } from '../../lib/api.js';
import { formatVnd, formatVndAxisBillions } from '../../lib/formatVnd.js';

const RANGE_OPTIONS = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: '7 ngày' },
  { value: 'month', label: '30 ngày' },
];

const ROLE_LABELS = {
  customer: 'Khách hàng',
  merchant: 'Chủ quán',
  admin: 'Quản trị',
};

function formatChartDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
}

function formatJoinedAt(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminOverview() {
  const [range, setRange] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAdminOverview(range);
      setData(res);
    } catch (err) {
      setData(null);
      setError(err.message || 'Không tải được dữ liệu tổng quan.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = data?.totals;
  const pending = data?.pendingApprovals;
  const chart = data?.chart ?? [];
  const pendingTotal = pending?.restaurants ?? 0;

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Bảng điều khiển</div>
          <h1 className="text-display-lg text-ink">Tình trạng nền tảng</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRange(opt.value)}
              className={
                'rounded-pill px-3 py-1.5 text-body-sm transition-colors ' +
                (range === opt.value
                  ? 'bg-ink text-on-dark'
                  : 'border border-hairline bg-surface-card text-body hover:text-ink')
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Card padded className="border-error/30 bg-[#fef2f2] text-body-sm text-error">
          {error}
        </Card>
      )}

      {loading && !data && (
        <div className="grid gap-base sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} padded className="h-28 animate-pulse bg-canvas-soft" />
          ))}
        </div>
      )}

      {totals && (
        <>
          <div className="grid gap-base sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="GMV" value={formatVnd(totals.gmv)} icon="cash" sub="trong kỳ đã chọn" />
            <StatCard
              label="Đơn hàng"
              value={totals.orderCount.toLocaleString('vi-VN')}
              icon="package"
              sub="trong kỳ đã chọn"
            />
            <StatCard
              label="Hoa hồng nền tảng"
              value={formatVnd(totals.platformFee)}
              icon="wallet"
              sub="trong kỳ đã chọn"
            />
            <StatCard
              label="Hoàn tiền"
              value={totals.refundCount.toLocaleString('vi-VN')}
              icon="alert"
              deltaTone={totals.refundCount > 0 ? 'error' : 'success'}
              sub="đơn được hoàn tiền trong kỳ"
            />
          </div>

          <div className="grid gap-base sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Tổng tài khoản" value={totals.userCount.toLocaleString('vi-VN')} icon="user" sub="trên hệ thống" />
            <StatCard label="Khách hàng" value={totals.customerCount.toLocaleString('vi-VN')} icon="user" sub="có vai trò khách hàng" />
            <StatCard label="Chủ quán" value={totals.merchantCount.toLocaleString('vi-VN')} icon="store" sub="có vai trò chủ quán" />
            <StatCard
              label="Quán đang hoạt động"
              value={totals.restaurantActiveCount.toLocaleString('vi-VN')}
              icon="store"
              sub="đã được duyệt hoạt động"
            />
          </div>

          <div className="grid gap-base lg:grid-cols-3">
            <Card padded className="lg:col-span-2">
              <div className="mb-base flex items-center justify-between">
                <div>
                  <div className="text-caption-uppercase text-body">Xu hướng GMV</div>
                  <div className="text-title-md text-ink">
                    {RANGE_OPTIONS.find((o) => o.value === range)?.label}
                  </div>
                </div>
                {chart.length > 0 && (
                  <Badge tone="outline">
                    Tổng: {formatVnd(chart.reduce((s, p) => s + p.gmv, 0))}
                  </Badge>
                )}
              </div>
              <div className="h-64 min-w-0">
                {chart.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-body-sm text-body">
                    Chưa có đơn trong kỳ này.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={chart}>
                      <defs>
                        <linearGradient id="adminGmv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#171717" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#f0f0f3" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        stroke="#999999"
                        tick={{ fontSize: 12 }}
                        tickFormatter={formatChartDate}
                      />
                      <YAxis
                        stroke="#999999"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => formatVndAxisBillions(v)}
                      />
                      <Tooltip
                        contentStyle={{
                          border: '1px solid #dcdee0',
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                        labelFormatter={formatChartDate}
                        formatter={(v) => [formatVnd(v), 'GMV']}
                      />
                      <Area
                        type="monotone"
                        dataKey="gmv"
                        stroke="#171717"
                        strokeWidth={2}
                        fill="url(#adminGmv)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card padded>
              <div className="mb-base">
                <div className="text-caption-uppercase text-body">Chờ duyệt</div>
                <div className="text-title-md text-ink">Hồ sơ cần xử lý</div>
              </div>
              <ul className="space-y-sm">
                <li className="flex items-center justify-between rounded-md border border-hairline px-sm py-sm">
                  <div>
                    <div className="text-body-sm font-medium text-ink">Nhà hàng</div>
                    <div className="text-caption text-body">Đăng ký mới chờ duyệt</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-title-md nums text-ink">{pending?.restaurants ?? 0}</span>
                    <Link to="/admin/restaurants" className="text-caption text-ink underline">
                      Xem
                    </Link>
                  </div>
                </li>
              </ul>
              {pendingTotal > 0 && (
                <div className="mt-base">
                  <Badge tone="warning">{pendingTotal} cần xem xét</Badge>
                </div>
              )}
            </Card>
          </div>

          <Card padded>
            <div className="mb-base">
              <div className="text-caption-uppercase text-body">Khối lượng đơn</div>
              <div className="text-title-md text-ink">Theo ngày trong kỳ</div>
            </div>
            <div className="h-56 min-w-0">
              {chart.length === 0 ? (
                <div className="flex h-full items-center justify-center text-body-sm text-body">
                  Chưa có đơn trong kỳ này.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={chart}>
                    <CartesianGrid stroke="#f0f0f3" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      stroke="#999999"
                      tick={{ fontSize: 12 }}
                      tickFormatter={formatChartDate}
                    />
                    <YAxis stroke="#999999" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        border: '1px solid #dcdee0',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                      labelFormatter={formatChartDate}
                    />
                    <Bar dataKey="orders" fill="#171717" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card padded>
            <div className="mb-base flex items-center justify-between">
              <div>
                <div className="text-caption-uppercase text-body">Đăng ký mới</div>
                <div className="text-title-md text-ink">10 tài khoản gần nhất</div>
              </div>
              <Link to="/admin/accounts" className="text-body-sm text-ink underline">
                Tất cả tài khoản
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-body-sm">
                <thead>
                  <tr className="border-b border-hairline text-caption-uppercase text-body">
                    <th className="pb-2 pr-4 font-medium">Họ tên</th>
                    <th className="pb-2 pr-4 font-medium">Email</th>
                    <th className="pb-2 pr-4 font-medium">Vai trò</th>
                    <th className="pb-2 font-medium">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {(data.recentSignups ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-body">
                        Chưa có tài khoản.
                      </td>
                    </tr>
                  ) : (
                    data.recentSignups.map((u) => (
                      <tr key={u.id}>
                        <td className="py-2 pr-4 font-medium text-ink">{u.fullName}</td>
                        <td className="py-2 pr-4 text-body">{u.email ?? '—'}</td>
                        <td className="py-2 pr-4">
                          <Badge tone="outline">{ROLE_LABELS[u.primaryRole] ?? u.primaryRole}</Badge>
                        </td>
                        <td className="py-2 text-caption text-body">{formatJoinedAt(u.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
