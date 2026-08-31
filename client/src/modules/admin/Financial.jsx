import { useCallback, useEffect, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Tabs from '../../components/Tabs.jsx';
import { fetchAdminFinancialApi } from '../../lib/api.js';
import { formatVnd } from '../../lib/formatVnd.js';

export default function AdminFinancial() {
  const [range, setRange] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchAdminFinancialApi(range));
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải báo cáo tài chính.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Tài chính</div>
          <h1 className="text-display-lg text-ink">Báo cáo nền tảng</h1>
          <p className="mt-xs text-body-sm text-body">Dữ liệu từ các đơn đã giao và payout merchant.</p>
        </div>
      </div>

      <Tabs size="sm" className="w-fit max-w-full" items={[
        { value: 'today', label: 'Hôm nay' },
        { value: 'week', label: '7 ngày' },
        { value: 'month', label: '30 ngày' },
      ]} value={range} onChange={setRange} />

      {error && <div className="rounded-md border border-error bg-[#fbeaea] p-sm text-body-sm text-error" role="alert">{error}</div>}
      {loading && !data && <div className="py-section text-center text-body-sm text-body" role="status">Đang tổng hợp dữ liệu...</div>}

      {data && <>
        <div className="grid gap-base sm:grid-cols-2 xl:grid-cols-4">
          <Metric title="Tổng giá trị đơn" value={formatVnd(data.metrics.gmv)} hint={data.metrics.deliveredOrders + ' đơn đã giao'} />
          <Metric title="Phí nền tảng" value={formatVnd(data.metrics.platformFee)} hint="Doanh thu hoa hồng" />
          <Metric title="Thu nhập merchant" value={formatVnd(data.metrics.merchantNet)} hint={'Trung bình ' + formatVnd(data.metrics.averageOrder) + '/đơn'} />
          <Metric title="Hoàn tiền" value={formatVnd(data.metrics.refundAmount)} hint={data.metrics.refundCount + ' giao dịch'} />
        </div>

        <Card padded>
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <div>
              <div className="text-caption-uppercase text-body">Payout merchant</div>
              <div className="text-title-md text-ink">Trạng thái đối soát</div>
            </div>
            <div className="flex flex-wrap gap-xs">
              <Badge tone="warning">{data.payouts.pendingCount} chờ duyệt</Badge>
              <Badge tone="live">{data.payouts.approvedCount} chờ chuyển</Badge>
              <Badge tone="success">{formatVnd(data.payouts.completedAmount)} đã chuyển</Badge>
            </div>
          </div>
        </Card>

        <div>
          <div className="mb-sm text-title-md text-ink">Doanh thu theo ngày</div>
          {!data.series.length ? (
            <EmptyState icon="trending" title="Chưa có đơn đã giao" message="Khoảng thời gian này chưa phát sinh doanh thu ghi nhận." />
          ) : (
            <Card padded={false} className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead className="bg-canvas-soft text-caption-uppercase text-body">
                  <tr><Th>Ngày</Th><Th>Đơn đã giao</Th><Th>GMV</Th><Th>Phí nền tảng</Th></tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {data.series.map((row) => <tr key={row.date}>
                    <Td>{new Date(row.date).toLocaleDateString('vi-VN')}</Td>
                    <Td>{row.orderCount}</Td>
                    <Td>{formatVnd(row.gmv)}</Td>
                    <Td>{formatVnd(row.platformFee)}</Td>
                  </tr>)}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </>}
    </div>
  );
}

function Metric({ title, value, hint }) {
  return <Card padded><div className="text-caption-uppercase text-body">{title}</div><div className="mt-1 nums text-display-sm text-ink">{value}</div><div className="mt-1 text-caption text-body">{hint}</div></Card>;
}
function Th({ children }) { return <th className="px-base py-sm text-left font-semibold">{children}</th>; }
function Td({ children }) { return <td className="px-base py-sm text-body-sm text-ink">{children}</td>; }
