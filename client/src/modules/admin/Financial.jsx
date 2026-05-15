import { useMemo, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Input from '../../components/Input.jsx';
import Pagination from '../../components/Pagination.jsx';
import Tabs from '../../components/Tabs.jsx';
import { useApp } from '../../context/AppContext.jsx';

const STATUS_TONE = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

const PAGE_SIZE = 6;

export default function AdminFinancial() {
  const { payouts, resolvePayout, commissionRate, setCommissionRate, pushToast } = useApp();
  const [draftRate, setDraftRate] = useState(commissionRate);
  const [deliveryFee, setDeliveryFee] = useState(2.49);
  const [minOrder, setMinOrder] = useState(10);

  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const setFilterAndReset = (v) => { setFilter(v); setPage(1); };
  const setQueryAndReset = (v) => { setQuery(v); setPage(1); };

  const filtered = useMemo(
    () =>
      payouts.filter((p) => {
        if (filter !== 'all' && p.status !== filter) return false;
        if (query && !`${p.name} ${p.type}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [payouts, filter, query],
  );

  const effectivePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const paginated = filtered.slice((effectivePage - 1) * PAGE_SIZE, effectivePage * PAGE_SIZE);

  const pending = payouts.filter((p) => p.status === 'pending');
  const approved = payouts.filter((p) => p.status === 'approved');
  const total = payouts.reduce((s, p) => s + p.amount, 0);

  const saveRates = () => {
    setCommissionRate(draftRate);
    pushToast({
      kind: 'success',
      title: 'Đã cập nhật tỷ giá',
      message: `Hoa hồng ${draftRate}% · Giao hàng $${deliveryFee.toFixed(2)} · Tối thiểu $${minOrder}`,
    });
  };

  return (
    <div className="space-y-base">
      <div className="flex items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Tiền bạc</div>
          <h1 className="text-display-lg text-ink">Quản lý tài chính</h1>
        </div>
        <div className="flex items-center gap-xs">
          <Badge tone="warning" dot>{pending.length} đang chờ</Badge>
          <Badge tone="success" dot>{approved.length} đã duyệt</Badge>
        </div>
      </div>

      {/* Rate config */}
      <div className="grid gap-base lg:grid-cols-3">
        <Card padded className="lg:col-span-2">
          <div className="mb-base flex items-center justify-between">
            <div>
              <div className="text-caption-uppercase text-body">Cấu hình</div>
              <div className="text-title-md text-ink">Phí nền tảng</div>
            </div>
            <Badge tone="outline">Có hiệu lực từ hôm nay</Badge>
          </div>
          <div className="grid gap-sm md:grid-cols-3">
            <Input
              label="Hoa hồng (%)"
              type="number"
              step="0.5"
              value={draftRate}
              onChange={(e) => setDraftRate(Number(e.target.value))}
              leadingIcon="trending"
              hint="Tính trên mỗi đơn hàng hoàn tất."
            />
            <Input
              label="Phí giao hàng mặc định ($)"
              type="number"
              step="0.5"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(Number(e.target.value))}
              leadingIcon="bike"
              hint="Nhà hàng có thể thay đổi."
            />
            <Input
              label="Đơn hàng tối thiểu ($)"
              type="number"
              step="1"
              value={minOrder}
              onChange={(e) => setMinOrder(Number(e.target.value))}
              leadingIcon="cart"
              hint="Dưới mức này, ẩn thanh toán."
            />
          </div>
          <div className="mt-base flex justify-end gap-xs">
            <Button variant="secondary" onClick={() => setDraftRate(commissionRate)}>
              Đặt lại
            </Button>
            <Button onClick={saveRates}>Lưu thay đổi</Button>
          </div>
        </Card>

        <Card padded>
          <div className="text-caption-uppercase text-body">Tình trạng</div>
          <div className="text-title-md text-ink">Thanh toán</div>
          <div className="mt-sm space-y-2">
            <Row label="Đang chờ" value={`${pending.length}`} />
            <Row label="Đã duyệt tuần này" value={`${approved.length}`} />
            <Row label="Tổng cộng đã xử lý" value={`$${total.toFixed(2)}`} bold />
          </div>
        </Card>
      </div>

      {/* Payout requests */}
      <Card padded={false}>
        <div className="flex flex-col gap-xs border-b border-hairline px-base py-sm md:flex-row md:items-center">
          <div className="text-title-md text-ink">Yêu cầu thanh toán</div>
          <div className="flex flex-wrap items-center gap-xs md:ml-auto">
            <Tabs
              items={[
                { value: 'all', label: 'Tất cả' },
                { value: 'pending', label: 'Đang chờ' },
                { value: 'approved', label: 'Đã phê duyệt' },
                { value: 'rejected', label: 'Đã từ chối' },
              ]}
              value={filter}
              onChange={setFilterAndReset}
            />
            <Input
              leadingIcon="search"
              placeholder="Tìm người nhận…"
              value={query}
              onChange={(e) => setQueryAndReset(e.target.value)}
              className="w-full md:w-56"
            />
          </div>
        </div>

        {/* Mobile: stacked cards */}
        <ul className="flex flex-col divide-y divide-hairline md:hidden">
          {paginated.map((p) => (
            <li key={p.id} className="p-base">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-body-sm font-semibold text-ink truncate">{p.name}</div>
                  <div className="text-caption text-body">
                    <Badge tone={p.type === 'merchant' ? 'default' : 'outline'}>{p.type}</Badge>{' '}
                    · Đã yêu cầu {p.requestedAt}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="nums text-title-sm text-ink">${p.amount.toFixed(2)}</div>
                  <Badge tone={STATUS_TONE[p.status]} dot>{p.status}</Badge>
                </div>
              </div>
              {p.status === 'pending' && (
                <div className="mt-sm flex justify-end gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      resolvePayout(p.id, 'rejected');
                      pushToast({ kind: 'error', title: 'Đã từ chối thanh toán', message: p.name });
                    }}
                  >
                    Từ chối
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      resolvePayout(p.id, 'approved');
                      pushToast({
                        kind: 'success',
                        title: 'Đã phê duyệt thanh toán',
                        message: `$${p.amount.toFixed(2)} cho ${p.name}`,
                      });
                    }}
                  >
                    Phê duyệt
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Desktop: wide table */}
        <table className="hidden w-full md:table">
          <thead className="bg-canvas-soft text-caption-uppercase text-body">
            <tr>
              <Th>Người nhận</Th>
              <Th>Loại</Th>
              <Th>Số tiền</Th>
              <Th>Đã yêu cầu</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right pr-base">Thao tác</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {paginated.map((p) => (
              <tr key={p.id} className="hover:bg-canvas-soft">
                <Td className="text-body-sm font-semibold text-ink">{p.name}</Td>
                <Td>
                  <Badge tone={p.type === 'merchant' ? 'default' : 'outline'}>{p.type}</Badge>
                </Td>
                <Td className="nums text-body-sm text-ink">${p.amount.toFixed(2)}</Td>
                <Td className="text-body-sm text-body">{p.requestedAt}</Td>
                <Td>
                  <Badge tone={STATUS_TONE[p.status]} dot>{p.status}</Badge>
                </Td>
                <Td className="text-right pr-base">
                  {p.status === 'pending' ? (
                    <div className="inline-flex gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          resolvePayout(p.id, 'rejected');
                          pushToast({ kind: 'error', title: 'Đã từ chối thanh toán', message: p.name });
                        }}
                      >
                        Từ chối
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          resolvePayout(p.id, 'approved');
                          pushToast({
                            kind: 'success',
                            title: 'Đã phê duyệt thanh toán',
                            message: `$${p.amount.toFixed(2)} cho ${p.name}`,
                          });
                        }}
                      >
                        Phê duyệt
                      </Button>
                    </div>
                  ) : (
                    <span className="text-caption text-body">Đã xử lý</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="grid place-items-center py-xxl text-body-sm text-body">
            <Icon name="search" size={20} className="mb-2" />
            Không có yêu cầu thanh toán nào khớp với bộ lọc.
          </div>
        )}
        {filtered.length > 0 && (
          <div className="border-t border-hairline px-base py-sm">
            <Pagination total={filtered.length} pageSize={PAGE_SIZE} page={effectivePage} onChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}

function Th({ className = '', children }) {
  return <th className={`px-base py-2 text-left text-caption-uppercase ${className}`}>{children}</th>;
}
function Td({ className = '', children }) {
  return <td className={`px-base py-sm ${className}`}>{children}</td>;
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-body-sm text-body">{label}</span>
      <span className={'nums ' + (bold ? 'text-title-md text-ink' : 'text-body-sm text-ink')}>{value}</span>
    </div>
  );
}
