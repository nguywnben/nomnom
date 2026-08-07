import { useEffect, useRef, useState } from 'react';
import {
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
import EmptyState from '../../components/EmptyState.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { fetchMerchantDashboardApi } from '../../lib/api.js';

let dashboardApiMissing = false;

export default function MerchantDashboard() {
  const { currentMerchant } = useApp();
  const [range, setRange] = useState('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendUnavailable, setBackendUnavailable] = useState(dashboardApiMissing);
  const requestSeq = useRef(0);
  const [dashboardData, setDashboardData] = useState({
    summary: {
      orderCount: 0,
      revenue: 0,
      avgOrderValue: 0,
      ratingAvg: 0,
      newOrderCount: 0,
    },
    topItems: [],
    recentOrders: [],
    chart: [],
  });

  useEffect(() => {
    if (backendUnavailable) {
      setLoading(false);
      setError(null);
      return undefined;
    }

    let active = true;
    const currentRequest = ++requestSeq.current;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMerchantDashboardApi(range);
        if (active && requestSeq.current === currentRequest) {
          setDashboardData(data);
        }
      } catch (err) {
        if (active && requestSeq.current === currentRequest) {
          if (err?.status === 404) {
            dashboardApiMissing = true;
            setBackendUnavailable(true);
            return;
          }
          console.error('Error fetching merchant dashboard data:', err);
          setError('Không thể tải thông tin báo cáo. Vui lòng thử lại sau.');
        }
      } finally {
        if (active && requestSeq.current === currentRequest) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [backendUnavailable, range]);

  const restaurantName = currentMerchant?.restaurantName ?? currentMerchant?.name ?? 'Nhà hàng của bạn';
  const restaurantOpen = currentMerchant?.restaurantOpen;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'placed':
        return { tone: 'info', label: 'Mới nhận' };
      case 'accepted':
        return { tone: 'info', label: 'Đã xác nhận' };
      case 'preparing':
        return { tone: 'warning', label: 'Đang chuẩn bị' };
      case 'ready_for_pickup':
        return { tone: 'warning', label: 'Chờ tài xế' };
      case 'picked_up':
      case 'delivering':
        return { tone: 'warning', label: 'Đang giao' };
      case 'delivered':
        return { tone: 'success', label: 'Thành công' };
      case 'cancelled':
        return { tone: 'error', label: 'Đã hủy' };
      case 'failed':
        return { tone: 'error', label: 'Thất bại' };
      default:
        return { tone: 'outline', label: status };
    }
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    return `${parts[2]}/${parts[1]}`; // 'DD/MM'
  };

  const formattedChartData = dashboardData.chart.map((item) => ({
    ...item,
    formattedDate: formatDateLabel(item.date),
  }));

  if (backendUnavailable) {
    return (
      <div className="space-y-base">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-caption-uppercase text-body">
              {range === 'today' ? 'Hôm nay' : range === 'week' ? 'Tuần này' : 'Tháng này'}
            </div>
            <h1 className="text-display-lg text-ink">Bảng điều khiển</h1>
            <p className="mt-xs text-body-sm text-body">{restaurantName}</p>
          </div>
          <div className="flex items-center gap-sm">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="rounded-md border border-hairline bg-canvas px-base py-2 text-body-sm text-ink outline-none hover:border-body focus:border-ink font-medium"
            >
              <option value="today">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
            </select>
            {restaurantOpen !== null && restaurantOpen !== undefined && (
              <Badge tone={restaurantOpen ? 'success' : 'error'} dot>
                {restaurantOpen ? 'Mở cửa nhận đơn' : 'Đóng cửa'}
              </Badge>
            )}
          </div>
        </div>

        <EmptyState
          icon="grid"
          title="Dashboard merchant chưa có backend"
          message="API thống kê merchant chưa được triển khai nên NomNom không hiển thị số liệu demo hay retry liên tục."
          action={
            <button
              onClick={() => {
                dashboardApiMissing = false;
                setBackendUnavailable(false);
                setRange((cur) => cur);
              }}
              className="inline-flex h-12 items-center justify-center rounded-md border border-hairline-strong bg-surface-card px-base text-button text-ink hover:bg-canvas-soft"
            >
              Thử tải lại
            </button>
          }
        />
      </div>
    );
  }

  // Handle Error View
  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-error bg-surface-card p-xl text-center">
        <Icon name="x" className="h-12 w-12 text-error" />
        <h3 className="mt-base text-title-md text-ink">Đã xảy ra lỗi</h3>
        <p className="mt-sm max-w-md text-body text-body-sm">{error}</p>
        <button
          onClick={() => setRange(range)}
          className="mt-xl rounded-md bg-primary px-base py-sm text-button text-on-primary hover:bg-opacity-90"
        >
          Tải lại dữ liệu
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-base">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-caption-uppercase text-body">
            {range === 'today' ? 'Hôm nay' : range === 'week' ? 'Tuần này' : 'Tháng này'}
          </div>
          <h1 className="text-display-lg text-ink">Bảng điều khiển</h1>
          <p className="mt-xs text-body-sm text-body">{restaurantName}</p>
        </div>
        <div className="flex items-center gap-sm">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-md border border-hairline bg-canvas px-base py-2 text-body-sm text-ink outline-none hover:border-body focus:border-ink font-medium"
          >
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
          </select>
          {restaurantOpen !== null && restaurantOpen !== undefined && (
            <Badge tone={restaurantOpen ? 'success' : 'error'} dot>
              {restaurantOpen ? 'Mở cửa nhận đơn' : 'Đóng cửa'}
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid gap-base sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} padded className="flex flex-col gap-sm">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 min-h-[11px] w-[7.5rem]" rounded="sm" />
                <Skeleton className="h-8 w-8 shrink-0" rounded="md" />
              </div>
              <Skeleton className="h-8 min-h-8 w-28" rounded="sm" />
              <div className="flex min-h-[18px] flex-wrap items-center gap-2">
                <Skeleton className="h-3 w-14" rounded="sm" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-base sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Đơn thành công"
            value={dashboardData.summary.orderCount}
            icon="list"
            sub="Trong kỳ đã chọn"
          />
          <StatCard
            label="Tổng doanh thu"
            value={formatVnd(dashboardData.summary.revenue)}
            icon="cash"
            sub="Doanh thu món ăn"
          />
          <StatCard
            label="Giá trị đơn TB"
            value={formatVnd(dashboardData.summary.avgOrderValue)}
            icon="trending"
            sub="Mỗi đơn thành công"
          />
          <StatCard
            label="Đánh giá quán"
            value={dashboardData.summary.ratingAvg.toFixed(1)}
            icon="starFilled"
            sub="Điểm trung bình chung"
          />
          <StatCard
            label="Đơn mới chờ duyệt"
            value={dashboardData.summary.newOrderCount}
            icon="bell"
            delta={dashboardData.summary.newOrderCount > 0 ? 'Cần xử lý' : ''}
            deltaTone={dashboardData.summary.newOrderCount > 0 ? 'error' : 'success'}
            sub="Trạng thái placed"
          />
        </div>
      )}

      {/* Charts & Top Items */}
      <div className="grid gap-base lg:grid-cols-3">
        {/* Bar Chart */}
        <Card padded className="lg:col-span-2">
          <div className="mb-base flex items-center justify-between">
            <div>
              <div className="text-caption-uppercase text-body">Xu hướng</div>
              <div className="text-title-md text-ink">7 ngày vừa qua</div>
            </div>
            <Badge tone="outline">Đơn hàng đã giao</Badge>
          </div>
          {loading ? (
            <div className="flex h-64 items-center justify-center bg-canvas-soft rounded-md">
              <Skeleton className="h-4/5 w-11/12" rounded="md" />
            </div>
          ) : dashboardData.chart.length === 0 ? (
            <div className="flex h-64 items-center justify-center bg-canvas-soft rounded-md text-body-sm text-body">
              Chưa có dữ liệu thống kê biểu đồ.
            </div>
          ) : (
            <div className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={formattedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#f0f0f3" strokeDasharray="3 3" />
                  <XAxis dataKey="formattedDate" stroke="#999999" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" orientation="left" stroke="#171717" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#ea580c" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      border: '1px solid #dcdee0',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#171717', fontWeight: 'bold' }}
                    formatter={(value, name) => {
                      if (name === 'Doanh thu') return [formatVnd(value), name];
                      return [value, name];
                    }}
                  />
                  <Bar yAxisId="left" dataKey="revenue" fill="#171717" radius={[4, 4, 0, 0]} name="Doanh thu" />
                  <Bar yAxisId="right" dataKey="orderCount" fill="#ea580c" radius={[4, 4, 0, 0]} name="Số đơn" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Top Items Table */}
        <Card padded>
          <div className="mb-base">
            <div className="text-caption-uppercase text-body">Món bán chạy</div>
            <div className="text-title-md text-ink">Top 5 lượt mua nhiều</div>
          </div>
          {loading ? (
            <div className="space-y-base">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-sm">
                  <Skeleton className="h-7 w-7 shrink-0" rounded="md" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-3/4" rounded="sm" />
                    <Skeleton className="h-3 w-1/2" rounded="sm" />
                  </div>
                  <Skeleton className="h-3 w-16" rounded="sm" />
                </div>
              ))}
            </div>
          ) : dashboardData.topItems.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-body-sm text-body">
              Chưa có dữ liệu món bán chạy.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead>
                  <tr className="border-b border-hairline text-body text-caption font-semibold">
                    <th className="pb-sm font-semibold">Hạng</th>
                    <th className="pb-sm font-semibold">Món ăn</th>
                    <th className="pb-sm font-semibold text-right">Lượt bán</th>
                    <th className="pb-sm font-semibold text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {dashboardData.topItems.map((item, idx) => (
                    <tr key={item.menuItemId || idx} className="hover:bg-canvas-soft transition-colors">
                      <td className="py-sm">
                        <span className="grid h-6 w-6 place-items-center rounded bg-surface-strong text-caption font-bold text-ink">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-sm font-medium text-ink truncate max-w-[120px]" title={item.name}>
                        {item.name}
                      </td>
                      <td className="py-sm text-right font-medium text-ink nums">{item.totalSold}</td>
                      <td className="py-sm text-right font-medium text-ink nums">{formatVnd(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Orders */}
      {loading ? (
        <Card padded>
          <div className="mb-base">
            <Skeleton className="h-4 w-40" rounded="sm" />
            <Skeleton className="mt-2 h-3 w-64" rounded="sm" />
          </div>
          <div className="space-y-sm">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" rounded="sm" />
            ))}
          </div>
        </Card>
      ) : (
        <Card padded>
          <div className="mb-base flex items-center justify-between">
            <div>
              <div className="text-caption-uppercase text-body">Gần đây</div>
              <div className="text-title-md text-ink">10 đơn hàng gần nhất</div>
            </div>
            <Badge tone="info">Thời gian thực</Badge>
          </div>
          {dashboardData.recentOrders.length === 0 ? (
            <div className="py-xl text-center text-body-sm text-body">
              Chưa có đơn hàng nào được ghi nhận.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead>
                  <tr className="border-b border-hairline text-body text-caption font-semibold">
                    <th className="pb-sm font-semibold">Mã đơn</th>
                    <th className="pb-sm font-semibold">Khách hàng</th>
                    <th className="pb-sm font-semibold text-right">Tổng thanh toán</th>
                    <th className="pb-sm font-semibold">Trạng thái</th>
                    <th className="pb-sm font-semibold">Thời điểm đặt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {dashboardData.recentOrders.map((order, idx) => {
                    const badge = getStatusBadge(order.status);
                    const timeLabel = new Date(order.placedAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    });
                    return (
                      <tr key={order.orderCode || idx} className="hover:bg-canvas-soft transition-colors">
                        <td className="py-sm font-semibold text-ink">{order.orderCode}</td>
                        <td className="py-sm font-medium text-body">{order.customerName}</td>
                        <td className="py-sm text-right font-medium text-ink nums">{formatVnd(order.totalAmount)}</td>
                        <td className="py-sm">
                          <Badge tone={badge.tone}>{badge.label}</Badge>
                        </td>
                        <td className="py-sm text-body text-caption nums">{timeLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
