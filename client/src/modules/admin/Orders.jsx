import { useMemo, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Input, { Select } from '../../components/Input.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { formatVnd } from '../../lib/formatVnd.js';

// Giám sát đơn hàng toàn nền tảng — `orders.status` (10 trạng thái) + payment_status.
const SAMPLE = [
  { id: 'ORD-A1B2C', customer: 'Mia C.', restaurant: 'Cinque Pizzeria', driver: 'Phạm Văn Hoàng', total: 458_000, status: 'delivering', payment: 'paid', placedAt: Date.now() - 30 * 60 * 1000 },
  { id: 'ORD-K9X', customer: 'Owen T.', restaurant: 'Hachi Ramen', driver: 'Trần Quốc Bảo', total: 384_000, status: 'preparing', payment: 'paid', placedAt: Date.now() - 18 * 60 * 1000 },
  { id: 'ORD-Z9Y8X', customer: 'Lia D.', restaurant: 'Junebug Burgers', driver: null, total: 268_000, status: 'cancelled', payment: 'refunded', placedAt: Date.now() - 2 * 60 * 60 * 1000 },
  { id: 'ORD-J7P', customer: 'Rae P.', restaurant: 'La Carreta', driver: 'Đặng Thị Hồng', total: 612_000, status: 'delivered', payment: 'paid', placedAt: Date.now() - 5 * 60 * 60 * 1000 },
  { id: 'ORD-Q1R', customer: 'Bao N.', restaurant: 'Daybreak Coffee', driver: 'Phạm Văn Hoàng', total: 122_000, status: 'placed', payment: 'unpaid', placedAt: Date.now() - 4 * 60 * 1000 },
  { id: 'ORD-T2W', customer: 'Khoa P.', restaurant: 'Verdant Bowls', driver: null, total: 195_000, status: 'failed', payment: 'failed', placedAt: Date.now() - 24 * 60 * 60 * 1000 },
];

const ORDER_STATUS = {
  pending_payment: { label: 'Chờ thanh toán', tone: 'warning' },
  placed: { label: 'Đã đặt', tone: 'default' },
  accepted: { label: 'Quán đã nhận', tone: 'live' },
  preparing: { label: 'Đang nấu', tone: 'live' },
  ready_for_pickup: { label: 'Sẵn lấy', tone: 'live' },
  picked_up: { label: 'Đã lấy', tone: 'live' },
  delivering: { label: 'Đang giao', tone: 'live' },
  delivered: { label: 'Đã giao', tone: 'success' },
  cancelled: { label: 'Đã hủy', tone: 'error' },
  failed: { label: 'Thất bại', tone: 'error' },
};

const PAY_STATUS = {
  unpaid: { label: 'Chưa thanh toán', tone: 'warning' },
  paid: { label: 'Đã thanh toán', tone: 'success' },
  failed: { label: 'Thanh toán lỗi', tone: 'error' },
  refunded: { label: 'Đã hoàn tiền', tone: 'default' },
};

export default function AdminOrders() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [payment, setPayment] = useState('all');

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return SAMPLE.filter((o) => {
      if (status !== 'all' && o.status !== status) return false;
      if (payment !== 'all' && o.payment !== payment) return false;
      if (!needle) return true;
      return `${o.id} ${o.customer} ${o.restaurant} ${o.driver || ''}`.toLowerCase().includes(needle);
    });
  }, [q, status, payment]);

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-sm">
        <div>
          <div className="text-caption-uppercase text-body">Vận hành</div>
          <h1 className="text-display-lg text-ink">Đơn hàng toàn nền tảng</h1>
          <p className="mt-xs text-body-sm text-body">Theo dõi đơn theo trạng thái và thanh toán. Hỗ trợ tra cứu, can thiệp khi cần.</p>
        </div>
      </div>

      <Card padded className="grid gap-sm md:grid-cols-[1fr_220px_220px]">
        <Input leadingIcon="search" placeholder="Tìm mã đơn, khách, quán, tài xế…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select
          aria-label="Trạng thái đơn"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: 'all', label: 'Tất cả trạng thái' },
            ...Object.entries(ORDER_STATUS).map(([v, m]) => ({ value: v, label: m.label })),
          ]}
        />
        <Select
          aria-label="Thanh toán"
          value={payment}
          onChange={(e) => setPayment(e.target.value)}
          options={[
            { value: 'all', label: 'Tất cả thanh toán' },
            ...Object.entries(PAY_STATUS).map(([v, m]) => ({ value: v, label: m.label })),
          ]}
        />
      </Card>

      {list.length === 0 ? (
        <EmptyState icon="package" title="Không có đơn phù hợp" />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <table className="hidden w-full text-left text-body-sm md:table">
            <thead className="bg-canvas-soft text-caption-uppercase text-body">
              <tr>
                <th className="px-base py-2">Mã đơn</th>
                <th className="px-base py-2">Khách</th>
                <th className="px-base py-2">Quán</th>
                <th className="px-base py-2">Tài xế</th>
                <th className="px-base py-2 text-right">Tổng</th>
                <th className="px-base py-2">Đơn</th>
                <th className="px-base py-2">Thanh toán</th>
                <th className="px-base py-2">Thời gian</th>
                <th className="px-base py-2"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="border-t border-hairline">
                  <td className="nums px-base py-2 text-ink">{o.id}</td>
                  <td className="px-base py-2 text-body">{o.customer}</td>
                  <td className="px-base py-2 text-body">{o.restaurant}</td>
                  <td className="px-base py-2 text-body">{o.driver || '—'}</td>
                  <td className="px-base py-2 nums text-right text-ink">{formatVnd(o.total)}</td>
                  <td className="px-base py-2"><Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge></td>
                  <td className="px-base py-2"><Badge tone={PAY_STATUS[o.payment].tone}>{PAY_STATUS[o.payment].label}</Badge></td>
                  <td className="px-base py-2 text-body">{new Date(o.placedAt).toLocaleString('vi-VN')}</td>
                  <td className="px-base py-2 text-right">
                    <Button variant="secondary" size="sm">Chi tiết</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <ul className="divide-y divide-hairline md:hidden">
            {list.map((o) => (
              <li key={o.id} className="p-base">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="nums text-body-sm font-semibold text-ink">{o.id}</div>
                    <div className="text-caption text-body truncate">
                      {o.customer} → {o.restaurant}
                    </div>
                    <div className="text-caption text-body truncate">
                      Tài xế: {o.driver || '—'}
                    </div>
                    <div className="text-caption text-body">{new Date(o.placedAt).toLocaleString('vi-VN')}</div>
                  </div>
                  <div className="text-right">
                    <div className="nums text-body-sm font-semibold text-ink">{formatVnd(o.total)}</div>
                    <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={PAY_STATUS[o.payment].tone}>{PAY_STATUS[o.payment].label}</Badge>
                  <Button variant="secondary" size="sm">Chi tiết</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
