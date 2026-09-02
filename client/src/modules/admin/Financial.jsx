import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import EmptyState from '../../components/EmptyState.jsx';
import Icon from '../../components/Icon.jsx';
import Input, { Textarea } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import StatCard from '../../components/StatCard.jsx';
import Tabs from '../../components/Tabs.jsx';
import Skeleton from '../../components/Skeleton.jsx';
import TableSkeleton from '../../components/TableSkeleton.jsx';
import { useApp } from '../../context/AppContext.jsx';
import {
  fetchAdminFinancialApi,
  fetchAdminPayoutDetailApi,
  fetchAdminPayoutsApi,
  updateAdminPayoutApi,
} from '../../lib/api.js';
import { formatVnd } from '../../lib/formatVnd.js';
import { downloadCsv } from '../../lib/csv.js';
import { resolveQueryTab } from '../../lib/contentTabs.js';

const PAYOUT_STATUS = {
  pending: { label: 'Chờ duyệt', tone: 'warning' },
  approved: { label: 'Chờ chuyển khoản', tone: 'live' },
  completed: { label: 'Đã chuyển', tone: 'success' },
  rejected: { label: 'Từ chối', tone: 'error' },
};

function formatAxisVnd(val) {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
  return `${val}`;
}

const now = new Date();
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

const calcDateStr = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const minDateStr = calcDateStr(365);

function formatChartDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
}

export default function AdminFinancial() {
  const { pushToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeMainTab = resolveQueryTab(searchParams, ['overview', 'payouts'], 'overview');

  const handleMainTabChange = (newTab) => {
    if (newTab === activeMainTab) return;
    if (newTab === 'payouts') {
      setSearchParams({ tab: 'payouts' });
    } else {
      setSearchParams({});
    }
  };

  // --- Financial Overview State ---
  const [fromDate, setFromDate] = useState(() => calcDateStr(29));
  const [toDate, setToDate] = useState(todayStr);
  const [rangeMode, setRangeMode] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  // --- Payouts Management State ---
  const [payoutItems, setPayoutItems] = useState([]);
  const [payoutPagination, setPayoutPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [payoutStatus, setPayoutStatus] = useState('pending');
  const [payoutQuery, setPayoutQuery] = useState('');
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutDialog, setPayoutDialog] = useState(null);
  const [payoutDetail, setPayoutDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dialogValue, setDialogValue] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [actingPayout, setActingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState('');

  const setPreset = (daysAgo, modeKey) => {
    if (modeKey === 'all') {
      setFromDate('');
      setToDate('');
      setRangeMode('all');
      return;
    }
    setFromDate(calcDateStr(daysAgo));
    setToDate(todayStr);
    setRangeMode(modeKey);
  };

  const activePresetValue = (() => {
    if (rangeMode && rangeMode !== 'custom') return rangeMode;
    if (toDate !== todayStr) return 'custom';
    if (fromDate === todayStr) return 'today';
    if (fromDate === calcDateStr(6)) return '7d';
    if (fromDate === calcDateStr(29)) return '30d';
    if (fromDate === calcDateStr(89)) return '90d';
    return 'custom';
  })();

  const loadFinancial = useCallback(async () => {
    setLoading(true);
    try {
      let params = {};
      if (rangeMode === 'all') {
        params = { range: 'all' };
      } else if (fromDate && toDate) {
        params = { fromDate, toDate };
      } else {
        params = { range: rangeMode };
      }
      const res = await fetchAdminFinancialApi(params);
      setData(res);
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải báo cáo tài chính.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, rangeMode]);

  const loadPayouts = useCallback(async () => {
    setPayoutLoading(true);
    try {
      const response = await fetchAdminPayoutsApi({
        status: payoutStatus,
        q: payoutQuery,
        page: payoutPage,
        limit: 20,
      });
      setPayoutItems(response.data);
      setPayoutPagination(response.pagination);
      setPayoutError('');
    } catch (err) {
      setPayoutError(err.message || 'Không thể tải danh sách yêu cầu rút tiền.');
    } finally {
      setPayoutLoading(false);
    }
  }, [payoutStatus, payoutQuery, payoutPage]);

  useEffect(() => {
    if (activeMainTab === 'overview') {
      loadFinancial();
    }
  }, [activeMainTab, loadFinancial]);

  useEffect(() => {
    if (activeMainTab === 'payouts') {
      loadPayouts();
    }
  }, [activeMainTab, loadPayouts]);

  const handleExportCsv = () => {
    if (!data?.series?.length) {
      pushToast({ kind: 'info', title: 'Không có dữ liệu', message: 'Không có dữ liệu chuỗi ngày để xuất CSV.' });
      return;
    }
    setExporting(true);
    try {
      const rows = data.series.map((row) => ({
        'Ngày': row.date,
        'Số đơn hoàn thành': row.orderCount,
        'Tổng giá trị GMV (đ)': row.gmv,
        'Thu nhập quán (đ)': row.merchantNet || (row.gmv - row.platformFee),
        'Doanh thu hoa hồng sàn (đ)': row.platformFee,
      }));

      const dateStr = new Date().toISOString().slice(0, 10);
      downloadCsv(`bao-cao-tai-chinh-nomnom-${rangeMode}-${dateStr}.csv`, rows);
      pushToast({ kind: 'success', title: 'Xuất CSV thành công', message: `Đã xuất ${rows.length} dòng báo cáo.` });
    } catch (err) {
      pushToast({ kind: 'error', title: 'Xuất CSV thất bại', message: err.message || 'Vui lòng thử lại.' });
    } finally {
      setExporting(false);
    }
  };

  const chartData = useMemo(() => {
    if (data?.series && data.series.length > 0) {
      return data.series.map((item) => ({
        ...item,
        displayDate: new Date(item.date).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
        }),
      }));
    }
    const fallback = [];
    const count = rangeMode === 'today' ? 1 : rangeMode === '7d' ? 7 : 30;
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      fallback.push({
        date: `${yyyy}-${mm}-${dd}`,
        displayDate: `${dd}/${mm}`,
        orderCount: 0,
        gmv: 0,
        platformFee: 0,
        merchantNet: 0,
      });
    }
    return fallback;
  }, [data, rangeMode]);

  // --- Payout Handlers ---
  const closePayoutDialog = () => {
    setPayoutDialog(null);
    setPayoutDetail(null);
    setDetailLoading(false);
    setDialogValue('');
  };

  const openCompletionDialog = async (payout) => {
    setPayoutDialog({ type: 'complete', payout });
    setPayoutDetail(null);
    setDialogValue('');
    setDetailLoading(true);
    try {
      const response = await fetchAdminPayoutDetailApi(payout.id);
      setPayoutDetail(response.payout);
    } catch (err) {
      closePayoutDialog();
      pushToast({
        kind: 'error',
        title: 'Không thể tải thông tin nhận tiền',
        message: err.message || 'Vui lòng thử lại.',
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const changePayoutStatus = async (payout, action) => {
    setActingPayout(true);
    try {
      await updateAdminPayoutApi(payout.id, {
        action,
        reason: action === 'reject' ? dialogValue.trim() : undefined,
        externalRef: action === 'complete' ? dialogValue.trim() : undefined,
      });
      closePayoutDialog();
      pushToast({
        kind: 'success',
        title: 'Đã cập nhật payout',
        message: `${payout.code} đã chuyển trạng thái.`,
      });
      await loadPayouts();
      await loadFinancial();
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không thể cập nhật',
        message: err.message || 'Vui lòng thử lại.',
      });
    } finally {
      setActingPayout(false);
    }
  };

  return (
    <div className="space-y-base">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Tài chính & Thanh toán</div>
          <h1 className="text-display-lg text-ink">Tài chính & Rút tiền Nền tảng</h1>
          <p className="mt-xs text-body-sm text-body">
            Theo dõi tổng giá trị giao dịch (GMV), doanh thu hoa hồng sàn, đối soát đối tác và trực tiếp phê duyệt các yêu cầu rút tiền.
          </p>
        </div>

        {/* Global Summary Badge */}
        {data && activeMainTab === 'overview' && (
          <div className="flex items-center gap-xs">
            <Badge tone="live" dot>
              {data.metrics.deliveredOrders} đơn giao thành công
            </Badge>
          </div>
        )}
        {data && activeMainTab === 'payouts' && data.payouts.pendingCount > 0 && (
          <div className="flex items-center gap-xs">
            <Badge tone="warning" dot>
              {data.payouts.pendingCount} yêu cầu chờ duyệt
            </Badge>
          </div>
        )}
      </div>

      {/* Main Tabs (Báo cáo vs Duyệt rút tiền) */}
      <Tabs
        size="sm"
        className="w-fit max-w-full"
        items={[
          { value: 'overview', label: 'Báo cáo & Dòng tiền' },
          {
            value: 'payouts',
            label: `Duyệt yêu cầu rút tiền${data?.payouts?.pendingCount ? ` (${data.payouts.pendingCount})` : ''}`,
          },
        ]}
        value={activeMainTab}
        onChange={handleMainTabChange}
      />

      {/* TAB 1: BÁO CÁO DOANH THU & DÒNG TIỀN */}
      {activeMainTab === 'overview' && (
        <div className="space-y-base">
          {/* Toolbar: Range Tabs + Date Pickers + Export CSV */}
          <div className="flex flex-col gap-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-xs">
              <Tabs
                size="sm"
                items={[
                  { value: 'today', label: 'Hôm nay' },
                  { value: '7d', label: '7 ngày' },
                  { value: '30d', label: '30 ngày' },
                  { value: '90d', label: '90 ngày' },
                  { value: 'all', label: 'Toàn thời gian' },
                ]}
                value={activePresetValue}
                onChange={(val) => {
                  if (val === 'today') setPreset(0, 'today');
                  else if (val === '7d') setPreset(6, '7d');
                  else if (val === '30d') setPreset(29, '30d');
                  else if (val === '90d') setPreset(89, '90d');
                  else if (val === 'all') setPreset(0, 'all');
                }}
              />

              {/* Direct date pickers */}
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
                    setFromDate(val);
                    setRangeMode('custom');
                  }}
                  title="Từ ngày"
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
                    setRangeMode('custom');
                  }}
                  title="Đến ngày (tối đa hôm nay)"
                  aria-label="Đến ngày"
                  className="bg-transparent text-ink text-caption font-medium outline-none cursor-pointer"
                />
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              leadingIcon="download"
              onClick={handleExportCsv}
              loading={exporting}
              disabled={!data?.series?.length || exporting}
            >
              {exporting ? 'Đang xuất…' : 'Xuất CSV'}
            </Button>
          </div>

          {error && (
            <div className="rounded-md border border-error bg-[#fbeaea] p-base text-body-sm text-error" role="alert">
              {error}
            </div>
          )}

          {loading && !data && (
            <div className="space-y-base">
              <div className="grid gap-base sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} padded className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-36" />
                    <Skeleton className="h-3.5 w-24" />
                  </Card>
                ))}
              </div>
              <Card padded className="h-72 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-56 w-full rounded-md" />
              </Card>
            </div>
          )}

          {data && (
            <div className="space-y-base">
              {/* Stat Cards Row */}
              <div className="grid gap-base sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Tổng giá trị đơn (GMV)"
                  value={formatVnd(data.metrics.gmv)}
                  icon="trending"
                  sub={`${data.metrics.deliveredOrders} đơn hoàn thành`}
                />

                <StatCard
                  label="Doanh thu hoa hồng sàn"
                  value={formatVnd(data.metrics.platformFee)}
                  icon="wallet"
                  sub="Doanh thu thực nhận NomNom"
                />

                <StatCard
                  label="Thu nhập đối tác quán"
                  value={formatVnd(data.metrics.merchantNet)}
                  icon="store"
                  sub={`TB ${formatVnd(data.metrics.averageOrder)} / đơn`}
                />

                <StatCard
                  label="Hoàn tiền & Tranh chấp"
                  value={formatVnd(data.metrics.refundAmount)}
                  icon="alertCircle"
                  sub={`${data.metrics.refundCount} giao dịch hoàn tất`}
                />
              </div>

              {/* Interactive Revenue Chart Card */}
              <Card padded>
                <div className="mb-base flex flex-wrap items-center justify-between gap-sm">
                  <div>
                    <div className="text-caption-uppercase text-body">Xu hướng dòng tiền</div>
                    <div className="text-title-md text-ink">Biểu đồ GMV & Doanh thu hoa hồng theo ngày</div>
                  </div>
                  <div className="flex items-center gap-base text-caption font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded-full bg-ink" />
                      <span>GMV (Tổng giá trị)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded-full bg-rose-600" />
                      <span>Hoa hồng sàn</span>
                    </div>
                  </div>
                </div>

                <div className="h-72 min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#171717" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#171717" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorFee" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#8c8c8c"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: '#e8e8e8' }}
                        tickFormatter={formatChartDate}
                      />
                      <YAxis
                        stroke="#8c8c8c"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatAxisVnd}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e8e8e8',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontSize: '13px',
                        }}
                        formatter={(value, name) => [
                          formatVnd(value),
                          name === 'gmv' ? 'Tổng giá trị GMV' : 'Hoa hồng sàn',
                        ]}
                        labelFormatter={(label) => `Ngày ${formatChartDate(label)}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="gmv"
                        name="gmv"
                        stroke="#171717"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorGmv)"
                      />
                      <Area
                        type="monotone"
                        dataKey="platformFee"
                        name="platformFee"
                        stroke="#e11d48"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorFee)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Payouts Status Card with Direct Action */}
              <Card padded className="bg-canvas-soft border-hairline-strong">
                <div className="flex flex-col gap-base md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-caption-uppercase text-body">Rút tiền đối tác</div>
                    <div className="text-title-md text-ink">Tiến độ giải ngân Ví quán ăn</div>
                    <p className="mt-0.5 text-body-sm text-body">
                      Duyệt và xử lý các yêu cầu rút doanh thu từ ví đối tác quán ăn về tài khoản ngân hàng.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-sm">
                    <div className="flex flex-wrap gap-xs">
                      <Badge tone="warning" dot>{data.payouts.pendingCount} chờ duyệt</Badge>
                      <Badge tone="live" dot>{data.payouts.approvedCount} chờ chuyển</Badge>
                      <Badge tone="success">{formatVnd(data.payouts.completedAmount)} đã chuyển</Badge>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      trailingIcon="chevronRight"
                      onClick={() => handleMainTabChange('payouts')}
                    >
                      Duyệt Payout ({data.payouts.pendingCount})
                    </Button>
                  </div>
                </div>
              </Card>

              {/* 2-Column: Payment Methods & Top Merchants */}
              <div className="grid gap-base lg:grid-cols-2">
                {/* Payment Methods Breakdown */}
                <Card padded>
                  <div className="mb-base">
                    <div className="text-caption-uppercase text-body">Phương thức thanh toán</div>
                    <div className="text-title-md text-ink">Cơ cấu nguồn tiền</div>
                  </div>

                  {!data.paymentMethods || data.paymentMethods.length === 0 ? (
                    <div className="py-base text-center text-body-sm text-body">
                      Chưa có dữ liệu thanh toán trong kỳ này.
                    </div>
                  ) : (
                    <div className="space-y-sm">
                      {data.paymentMethods.map((pm) => {
                        const totalAmt = data.metrics.gmv || 1;
                        const percent = Math.min(100, Math.round((pm.amount / totalAmt) * 100));
                        const isVnpay = pm.method === 'vnpay';
                        return (
                          <div key={pm.method} className="space-y-1">
                            <div className="flex items-center justify-between text-body-sm">
                              <span className="font-medium text-ink flex items-center gap-1.5">
                                <Icon name={isVnpay ? 'creditCard' : 'wallet'} size={15} className="text-body" />
                                {isVnpay ? 'VNPAY (Thanh toán điện tử)' : 'Tiền mặt (COD khi nhận hàng)'}
                              </span>
                              <span className="nums text-ink font-semibold">{formatVnd(pm.amount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-caption text-body">
                              <span>{pm.count} đơn hàng</span>
                              <span>{percent}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-hairline overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isVnpay ? 'bg-primary' : 'bg-ink'}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* Top Performing Restaurants */}
                <Card padded>
                  <div className="mb-base">
                    <div className="text-caption-uppercase text-body">Hiệu quả đối tác</div>
                    <div className="text-title-md text-ink">Top Quán ăn đóng góp GMV cao nhất</div>
                  </div>

                  {!data.topRestaurants || data.topRestaurants.length === 0 ? (
                    <div className="py-base text-center text-body-sm text-body">
                      Chưa có dữ liệu quán ăn trong kỳ này.
                    </div>
                  ) : (
                    <ul className="divide-y divide-hairline">
                      {data.topRestaurants.map((res, index) => (
                        <li key={res.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-strong text-caption font-bold text-ink">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate text-body-sm font-semibold text-ink">{res.name}</div>
                              <div className="text-caption text-body">{res.deliveredOrders} đơn hoàn thành</div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="nums text-body-sm font-bold text-ink">{formatVnd(res.gmv)}</div>
                            <div className="text-caption text-primary">Sàn thu: {formatVnd(res.platformFee)}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>

              {/* Revenue by Day Table */}
              <div>
                <div className="mb-sm text-title-md text-ink">Bảng kê chi tiết doanh thu theo ngày</div>
                {!data.series.length ? (
                  <EmptyState
                    icon="trending"
                    title="Chưa có đơn đã giao"
                    message="Khoảng thời gian này chưa phát sinh doanh thu ghi nhận."
                  />
                ) : (
                  <Card padded={false} className="overflow-x-auto shadow-soft-sm">
                    <table className="w-full min-w-[640px]">
                      <thead className="bg-canvas-soft text-caption-uppercase text-body border-b border-hairline">
                        <tr>
                          <Th>Ngày</Th>
                          <Th>Đơn giao thành công</Th>
                          <Th>Tổng giá trị (GMV)</Th>
                          <Th>Thu nhập Quán ăn</Th>
                          <Th>Hoa hồng sàn</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {data.series.map((row) => (
                          <tr key={row.date} className="hover:bg-surface-card-hover transition-colors">
                            <Td>
                              <span className="font-semibold text-ink">
                                {new Date(row.date).toLocaleDateString('vi-VN')}
                              </span>
                            </Td>
                            <Td>
                              <span className="nums font-medium">{row.orderCount}</span>
                            </Td>
                            <Td>
                              <span className="nums font-semibold text-ink">{formatVnd(row.gmv)}</span>
                            </Td>
                            <Td>
                              <span className="nums text-body">
                                {formatVnd(row.merchantNet || (row.gmv - row.platformFee))}
                              </span>
                            </Td>
                            <Td>
                              <span className="nums font-bold text-primary">{formatVnd(row.platformFee)}</span>
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DUYỆT YÊU CẦU RÚT TIỀN (PAYOUTS) */}
      {activeMainTab === 'payouts' && (
        <div className="space-y-base">
          {/* Toolbar: Status Filter Tabs + Search Input */}
          <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
            <Tabs
              size="sm"
              className="max-w-full"
              items={[
                { value: 'pending', label: 'Chờ duyệt' },
                { value: 'approved', label: 'Chờ chuyển' },
                { value: 'completed', label: 'Đã chuyển' },
                { value: 'rejected', label: 'Từ chối' },
                { value: 'all', label: 'Tất cả' },
              ]}
              value={payoutStatus}
              onChange={(next) => {
                setPayoutStatus(next);
                setPayoutPage(1);
              }}
            />
            <div className="relative w-full md:w-72 shrink-0 h-9">
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-body"
              />
              <input
                value={payoutQuery}
                onChange={(event) => {
                  setPayoutQuery(event.target.value);
                  setPayoutPage(1);
                }}
                placeholder="Tìm quán hoặc ngân hàng..."
                aria-label="Tìm payout"
                className="h-full w-full rounded-md border border-hairline-strong bg-surface-card pl-9 pr-base text-body-sm text-ink outline-none placeholder:text-muted focus:border-ink transition-colors"
              />
            </div>
          </div>

          {payoutError && (
            <div className="rounded-md border border-error bg-[#fbeaea] p-sm text-body-sm text-error" role="alert">
              {payoutError}
            </div>
          )}

          {payoutLoading && !payoutItems.length ? (
            <TableSkeleton rows={5} cols={5} />
          ) : !payoutItems.length ? (
            <EmptyState
              icon="wallet"
              title="Không có yêu cầu phù hợp"
              message="Thử đổi trạng thái hoặc từ khóa tìm kiếm."
            />
          ) : (
            <Card padded={false} className="overflow-hidden">
              <ul className="divide-y divide-hairline">
                {payoutItems.map((payout) => {
                  const state = PAYOUT_STATUS[payout.status] || { label: payout.status, tone: 'outline' };
                  return (
                    <li key={payout.id} className="p-base hover:bg-canvas-soft/40 transition-colors">
                      <div className="flex flex-wrap items-start justify-between gap-sm">
                        <div className="min-w-0">
                          <div className="nums text-body-sm font-semibold text-ink">{payout.code}</div>
                          <div className="text-body-sm text-ink font-medium">{payout.userName}</div>
                          <div className="text-caption text-body">
                            {payout.bankName} · {payout.bankAccountMasked} · {payout.bankAccountHolder}
                          </div>
                          <div className="text-caption text-body">
                            {new Date(payout.requestedAt).toLocaleString('vi-VN')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="nums text-title-sm text-ink font-bold">{formatVnd(payout.amount)}</div>
                          <Badge tone={state.tone}>{state.label}</Badge>
                        </div>
                      </div>
                      {payout.rejectReason && (
                        <div className="mt-sm rounded-md bg-[#fbeaea] p-sm text-caption text-error">
                          Lý do từ chối: {payout.rejectReason}
                        </div>
                      )}
                      {payout.externalRef && (
                        <div className="mt-sm text-caption text-body">
                          Mã ngân hàng: <span className="nums text-ink font-semibold">{payout.externalRef}</span>
                        </div>
                      )}
                      <div className="mt-sm flex flex-wrap gap-xs">
                        {payout.status === 'pending' && (
                          <>
                            <Button size="sm" leadingIcon="check" onClick={() => changePayoutStatus(payout, 'approve')}>
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              leadingIcon="x"
                              onClick={() => {
                                setPayoutDialog({ type: 'reject', payout });
                                setDialogValue('');
                              }}
                            >
                              Từ chối
                            </Button>
                          </>
                        )}
                        {payout.status === 'approved' && (
                          <Button
                            size="sm"
                            leadingIcon="cash"
                            onClick={() => openCompletionDialog(payout)}
                          >
                            Thực hiện chuyển khoản
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {payoutPagination.total > payoutPagination.limit && (
            <Pagination
              total={payoutPagination.total}
              pageSize={payoutPagination.limit}
              page={payoutPagination.page}
              onChange={setPayoutPage}
            />
          )}

          {/* Dialog Duyệt & Chuyển tiền */}
          <Modal
            open={Boolean(payoutDialog)}
            onClose={closePayoutDialog}
            title={payoutDialog?.type === 'reject' ? 'Từ chối yêu cầu rút tiền' : 'Thực hiện chuyển khoản'}
            size="sm"
          >
            <div className="space-y-sm">
              {payoutDialog?.type === 'reject' ? (
                <Textarea
                  label="Lý do từ chối"
                  rows={4}
                  value={dialogValue}
                  onChange={(event) => setDialogValue(event.target.value)}
                  placeholder="Nhập lý do gửi đến đối tác..."
                />
              ) : (
                <>
                  {detailLoading ? (
                    <div className="py-base text-center text-body-sm text-body">
                      Đang tải thông tin nhận tiền...
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md border border-hairline-strong bg-canvas-soft p-sm text-body-sm text-body">
                        <div className="text-caption-uppercase text-body font-semibold">Thông tin chuyển khoản</div>
                        <div className="mt-1 font-semibold text-ink">
                          {payoutDetail?.bankName} · <span className="nums">{payoutDetail?.bankAccountNo}</span>
                        </div>
                        <div className="mt-1">Chủ tài khoản: <strong>{payoutDetail?.bankAccountHolder}</strong></div>
                        <div className="mt-1 nums text-ink font-bold">
                          Số tiền: {formatVnd(payoutDetail?.amount || 0)}
                        </div>
                      </div>
                      <Input
                        label="Mã giao dịch ngân hàng"
                        value={dialogValue}
                        onChange={(event) => setDialogValue(event.target.value)}
                        placeholder="Ví dụ: FT26083112345678"
                        hint="Mã dùng để đối soát ngân hàng và không thể bỏ trống."
                      />
                    </>
                  )}
                </>
              )}
              <div className="flex justify-end gap-xs pt-2">
                <Button variant="secondary" onClick={closePayoutDialog}>
                  Hủy
                </Button>
                <Button
                  loading={actingPayout}
                  disabled={
                    detailLoading ||
                    (payoutDialog?.type === 'complete' && !payoutDetail) ||
                    dialogValue.trim().length < 3
                  }
                  onClick={() => changePayoutStatus(payoutDialog.payout, payoutDialog.type)}
                >
                  {payoutDialog?.type === 'reject' ? 'Xác nhận từ chối' : 'Xác nhận đã chuyển tiền'}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}

function Th({ children }) {
  return <th className="px-base py-sm text-left font-semibold">{children}</th>;
}

function Td({ children }) {
  return <td className="px-base py-sm text-body-sm text-ink">{children}</td>;
}
