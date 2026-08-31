import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import StatCard from '../../components/StatCard.jsx';
import Tabs from '../../components/Tabs.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';
import { orderStatusTone } from '../../lib/orderStatus.js';
import { downloadCsv } from '../../lib/csv.js';
import { fetchMerchantDashboardApi, fetchMerchantOrdersApi } from '../../lib/api.js';

let dashboardApiMissing = false;

export default function MerchantDashboard() {
  const { currentMerchant } = useApp();
  const todayStr = new Date().toISOString().slice(0, 10);
  const minDateStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  })();

  const calcDateStr = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  };

  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);

  const setPreset = (daysAgo) => {
    if (daysAgo === 0) {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else {
      setFromDate(calcDateStr(daysAgo));
      setToDate(todayStr);
    }
  };

  const activePresetValue = (() => {
    if (fromDate === todayStr && toDate === todayStr) return 'today';
    if (fromDate === calcDateStr(6) && toDate === todayStr) return '7d';
    if (fromDate === calcDateStr(29) && toDate === todayStr) return '30d';
    if (fromDate === minDateStr && toDate === todayStr) return '90d';
    return null;
  })();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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
        const data = await fetchMerchantDashboardApi({ fromDate, toDate });
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
  }, [backendUnavailable, fromDate, toDate]);

  const outletCtx = useOutletContext();
  const restaurantOpen = outletCtx?.restaurantOpen ?? currentMerchant?.restaurantOpen;

  const DASHBOARD_STATUS_LABEL = {
    placed: 'Mới nhận',
    accepted: 'Đã xác nhận',
    preparing: 'Đang chuẩn bị',
    ready_for_pickup: 'Sẵn sàng giao',
    picked_up: 'Đang giao',
    delivering: 'Đang giao',
    delivered: 'Thành công',
    cancelled: 'Đã hủy',
    failed: 'Thất bại',
  };

  const getStatusBadge = (status) => ({
    tone: orderStatusTone(status),
    label: DASHBOARD_STATUS_LABEL[status] ?? status,
  });

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    return `${parts[2]}/${parts[1]}`; // 'DD/MM'
  };

  const getRangeDisplay = () => {
    if (fromDate === todayStr && toDate === todayStr) return 'Hôm nay';
    if (fromDate === calcDateStr(6) && toDate === todayStr) return '7 ngày qua';
    if (fromDate === calcDateStr(29) && toDate === todayStr) return '30 ngày qua';
    if (fromDate === minDateStr && toDate === todayStr) return '90 ngày qua';
    if (fromDate && toDate) return `Từ ${formatDateLabel(fromDate)} đến ${formatDateLabel(toDate)}`;
    return 'Khoảng thời gian đã chọn';
  };

  const exportCsv = async () => {
    try {
      setExporting(true);
      const res = await fetchMerchantOrdersApi({ fromDate, toDate });
      const ordersToExport = (res?.orders && res.orders.length > 0)
        ? res.orders
        : dashboardData.recentOrders;

      if (!ordersToExport || ordersToExport.length === 0) {
        return;
      }

      const rows = ordersToExport.map((o) => {
        const itemsSummary = Array.isArray(o.items)
          ? o.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')
          : '';
        const statusLabel = DASHBOARD_STATUS_LABEL[o.status] ?? o.status;
        const paymentLabel = o.paymentMethod === 'vnpay' ? 'VNPAY (Online)' : 'COD (Tiền mặt)';

        return {
          'Mã đơn hàng': o.orderCode,
          'Thời điểm đặt': new Date(o.placedAt).toLocaleString('vi-VN'),
          'Trạng thái': statusLabel,
          'Khách hàng': o.customerName ?? 'Khách hàng',
          'Số điện thoại': o.customerPhone ?? '',
          'Địa chỉ giao hàng': o.deliveryAddressSnapshot ?? '',
          'Danh sách món ăn': itemsSummary,
          'Tạm tính món (VND)': o.subtotal ?? o.totalAmount,
          'Phí giao hàng (VND)': o.deliveryFee ?? 0,
          'Giảm giá (VND)': o.discountAmount ?? 0,
          'Tổng thanh toán (VND)': o.totalAmount,
          'Phương thức thanh toán': paymentLabel,
        };
      });

      downloadCsv(`nomnom-don-hang-${fromDate}_den_${toDate}.csv`, rows);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    } finally {
      setExporting(false);
    }
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
              {getRangeDisplay()}
            </div>
            <h1 className="text-display-lg text-ink">Bảng điều khiển</h1>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              dashboardApiMissing = false;
              setBackendUnavailable(false);
              setFromDate(todayStr);
            }}
          >
            Thử tải lại
          </Button>
        </div>

        <EmptyState
          icon="grid"
          title="Không thể tải số liệu"
          message="Hệ thống chưa thể kết nối với dữ liệu vận hành của quán. Vui lòng thử lại sau."
          action={
            <button
              onClick={() => {
                dashboardApiMissing = false;
                setBackendUnavailable(false);
                setFromDate(todayStr);
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
          onClick={() => setFromDate((cur) => cur)}
          className="mt-xl rounded-md bg-primary px-base py-sm text-button text-on-primary hover:bg-opacity-90"
        >
          Tải lại dữ liệu
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-center justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">
            {getRangeDisplay()}
          </div>
          <h1 className="text-display-lg text-ink">Bảng điều khiển</h1>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          {/* Quick preset segmented tabs */}
          <Tabs
            size="sm"
            items={[
              { value: 'today', label: 'Hôm nay' },
              { value: '7d', label: '7 ngày' },
              { value: '30d', label: '30 ngày' },
              { value: '90d', label: '90 ngày' },
            ]}
            value={activePresetValue}
            onChange={(val) => {
              if (val === 'today') setPreset(0);
              else if (val === '7d') setPreset(6);
              else if (val === '30d') setPreset(29);
              else if (val === '90d') setPreset(90);
            }}
          />

          {/* Direct date pickers (Max 90 days lookback) */}
          <div className="inline-flex h-9 items-center gap-1.5 rounded-md border border-hairline-strong bg-surface-card px-sm text-caption text-ink">
            <Icon name="calendar" size={15} className="text-body shrink-0" />
            <input
              type="date"
              value={fromDate}
              min={minDateStr}
              max={toDate || todayStr}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                setFromDate(val < minDateStr ? minDateStr : val);
              }}
              title="Từ ngày (tối đa 90 ngày trước)"
              aria-label="Từ ngày"
              className="bg-transparent text-ink text-caption font-medium outline-none cursor-pointer"
            />
            <span className="text-body text-caption font-medium">–</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || minDateStr}
              max={todayStr}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                setToDate(val > todayStr ? todayStr : val);
              }}
              title="Đến ngày (tối đa hôm nay)"
              aria-label="Đến ngày"
              className="bg-transparent text-ink text-caption font-medium outline-none cursor-pointer"
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            leadingIcon="download"
            onClick={exportCsv}
            loading={exporting}
            disabled={exporting || (!dashboardData.recentOrders.length && !dashboardData.summary.orderCount)}
          >
            Xuất CSV
          </Button>

          {restaurantOpen !== null && restaurantOpen !== undefined && (
            <Badge tone={restaurantOpen ? 'success' : 'error'} dot className="h-9 px-3 flex items-center justify-center">
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
            delta={dashboardData.summary.newOrderCount > 0 ? 'Cần xử lý ngay' : 'Không có đơn chờ'}
            deltaTone={dashboardData.summary.newOrderCount > 0 ? 'error' : 'success'}
          />
        </div>
      )}

      {/* Charts & Top Items */}
      <div className="grid gap-base lg:grid-cols-3">
        {/* Area Chart */}
        <Card padded className="lg:col-span-2">
          <div className="mb-base flex items-center justify-between">
            <div>
              <div className="text-caption-uppercase text-body">Xu hướng doanh thu</div>
              <div className="text-title-md text-ink">{getRangeDisplay()}</div>
            </div>
            {dashboardData.chart.length > 0 && (
              <Badge tone="outline">
                Tổng kỳ: {formatVnd(dashboardData.chart.reduce((s, p) => s + (p.revenue || 0), 0))}
              </Badge>
            )}
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
                <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="merchantRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#171717" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f0f0f3" strokeDasharray="3 3" />
                  <XAxis dataKey="formattedDate" stroke="#999999" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#999999"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => {
                      if (v >= 1000000) return `${(v / 1000000).toFixed(1)}Tr`;
                      if (v >= 1000) return `${Math.round(v / 1000)}k`;
                      return v;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      border: '1px solid #dcdee0',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#171717', fontWeight: 'bold' }}
                    formatter={(value, name, item) => [
                      `${formatVnd(item.payload.revenue)} (${item.payload.orderCount} đơn)`,
                      'Doanh thu'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Doanh thu"
                    stroke="#171717"
                    strokeWidth={2.5}
                    fill="url(#merchantRevenue)"
                    activeDot={{ r: 5, fill: '#171717', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
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
