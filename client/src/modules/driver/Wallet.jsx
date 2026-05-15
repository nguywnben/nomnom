import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Input from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Tabs from '../../components/Tabs.jsx';
import { driverDailyEarnings } from '../../data/mock.js';
import { useApp } from '../../context/AppContext.jsx';

// ---------------------------------------------------------------------------
// Driver Wallet — "Earnings" tab.
//   • Balance card (dark surface, on-dark text)
//   • Withdraw + Add card row
//   • Bar/Line chart, week vs month
//   • Recent transactions
// ---------------------------------------------------------------------------

const RECENT = [
  { label: 'Thanh toán hàng tuần', date: '13 thg 5', amount: 412.5, kind: 'out' },
  { label: 'Giao hàng #J21A', date: '14 thg 5', amount: 8.4, kind: 'in' },
  { label: 'Tiền thưởng từ Mara C.', date: '14 thg 5', amount: 3.0, kind: 'in' },
  { label: 'Giao hàng #J218', date: '14 thg 5', amount: 7.2, kind: 'in' },
  { label: 'Tiền thưởng', date: '13 thg 5', amount: 5.0, kind: 'in' },
];

export default function DriverWallet() {
  const { pushToast } = useApp();
  const [range, setRange] = useState('week');
  const [withdraw, setWithdraw] = useState(false);
  const [amount, setAmount] = useState(400);

  const total = driverDailyEarnings.reduce((s, d) => s + d.earnings, 0);
  const today = driverDailyEarnings[driverDailyEarnings.length - 1].earnings;
  const trips = 14;
  const data = range === 'week' ? driverDailyEarnings : extend(driverDailyEarnings);

  return (
    <div className="flex flex-col gap-base p-base">
      {/* Header */}
      <div>
        <div className="text-caption-uppercase text-body">Thu nhập</div>
        <h1 className="text-display-md text-ink">Ví của bạn</h1>
      </div>

      {/* Balance — dark hero card */}
      <Card variant="dark" padded>
        <div className="flex items-center justify-between">
          <span className="text-caption-uppercase text-on-dark-soft">Số dư khả dụng</span>
          <Badge tone="dark" className="!bg-surface-dark-elevated !text-on-dark">NomNom Pay</Badge>
        </div>
        <div className="mt-sm nums text-display-lg leading-none">${total.toFixed(2)}</div>
        <div className="mt-1 text-body-sm text-on-dark-soft">
          Hôm nay <span className="nums">${today.toFixed(2)}</span> · {trips} chuyến
        </div>
        <div className="mt-base grid grid-cols-2 gap-1">
          <Button
            variant="dark"
            className="!bg-surface-card !text-ink"
            leadingIcon="download"
            onClick={() => setWithdraw(true)}
          >
            Rút tiền
          </Button>
          <Button variant="dark" leadingIcon="card">
            Thêm thẻ
          </Button>
        </div>
      </Card>

      {/* Chart */}
      <Card padded={false} className="p-sm">
        <div className="mb-2 flex items-center justify-between px-2">
          <div className="text-title-sm text-ink">Thu nhập</div>
          <Tabs
            items={[
              { value: 'week', label: 'Tuần' },
              { value: 'month', label: 'Tháng' },
            ]}
            value={range}
            onChange={setRange}
          />
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            {range === 'week' ? (
              <BarChart data={data} margin={{ left: -20, right: 8, top: 5, bottom: 0 }}>
                <CartesianGrid stroke="#f0f0f3" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#999999" tick={{ fontSize: 11 }} />
                <YAxis stroke="#999999" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ border: '1px solid #dcdee0', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`$${v}`, 'Thu nhập']}
                />
                <Bar dataKey="earnings" fill="#171717" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={data} margin={{ left: -20, right: 8, top: 5, bottom: 0 }}>
                <CartesianGrid stroke="#f0f0f3" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#999999" tick={{ fontSize: 11 }} />
                <YAxis stroke="#999999" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ border: '1px solid #dcdee0', borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="earnings" stroke="#171717" strokeWidth={2} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="Giờ trực tuyến" value="38h" />
        <MiniStat label="Chuyến xe" value={trips.toString()} />
        <MiniStat label="Trung bình / chuyến" value={`$${(total / trips).toFixed(2)}`} />
      </div>

      {/* Recent */}
      <Card padded={false} className="overflow-hidden">
        <div className="border-b border-hairline px-sm py-2 text-title-sm text-ink">Gần đây</div>
        <ul className="divide-y divide-hairline">
          {RECENT.map((row) => (
            <li key={row.label + row.date} className="flex items-center gap-sm px-sm py-2">
              <span
                className={
                  'grid h-8 w-8 place-items-center rounded-md ' +
                  (row.kind === 'in' ? 'bg-[#e6f4ea] text-success' : 'bg-surface-strong text-ink')
                }
              >
                <Icon name={row.kind === 'in' ? 'arrowRight' : 'download'} size={14} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-semibold text-ink truncate">{row.label}</div>
                <div className="text-caption text-body">{row.date}</div>
              </div>
              <span
                className={
                  'nums text-body-sm ' + (row.kind === 'in' ? 'text-success' : 'text-ink')
                }
              >
                {row.kind === 'in' ? '+' : '−'}${row.amount.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        open={withdraw}
        onClose={() => setWithdraw(false)}
        title="Rút về ngân hàng"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setWithdraw(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                pushToast({
                  kind: 'success',
                  title: 'Đã yêu cầu rút tiền',
                  message: `$${Number(amount).toFixed(2)} đang được xử lý. 1–2 ngày làm việc.`,
                });
                setWithdraw(false);
              }}
            >
              Rút ${Number(amount).toFixed(2)}
            </Button>
          </>
        }
      >
        <div className="space-y-sm">
          <Input
            label="Số tiền (USD)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            leadingIcon="cash"
            hint={`Khả dụng: $${total.toFixed(2)}`}
          />
          <Input
            label="Đến"
            value="Chase ··· 4823"
            readOnly
            leadingIcon="card"
            hint="Tài khoản ngân hàng mặc định. Thay đổi trong cài đặt."
          />
        </div>
      </Modal>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <Card padded={false} className="p-sm text-center">
      <div className="text-caption-uppercase text-body">{label}</div>
      <div className="mt-0.5 nums text-title-md text-ink">{value}</div>
    </Card>
  );
}

function extend(week) {
  return [
    ...week.map((d, i) => ({ ...d, day: 'D' + (i + 1) })),
    { day: 'D8', earnings: 142 },
    { day: 'D9', earnings: 121 },
    { day: 'D10', earnings: 154 },
    { day: 'D11', earnings: 98 },
    { day: 'D12', earnings: 132 },
    { day: 'D13', earnings: 118 },
    { day: 'D14', earnings: 162 },
  ];
}
