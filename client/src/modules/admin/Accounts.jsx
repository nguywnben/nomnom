import { useMemo, useState } from 'react';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import Input from '../../components/Input.jsx';
import Pagination from '../../components/Pagination.jsx';
import Tabs from '../../components/Tabs.jsx';
import { useApp } from '../../context/AppContext.jsx';

const STATUS_TONE = {
  active: 'success',
  pending: 'warning',
  suspended: 'error',
};

const PAGE_SIZE = 8;

export default function AdminAccounts() {
  const { adminAccounts, setAccountStatus, pushToast } = useApp();
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  // Reset pagination together with each filter change — keeps state predictable
  // and avoids a setState-in-effect cascade.
  const setTypeAndReset = (v) => { setType(v); setPage(1); };
  const setStatusAndReset = (v) => { setStatus(v); setPage(1); };
  const setQueryAndReset = (v) => { setQuery(v); setPage(1); };

  const filtered = useMemo(
    () =>
      adminAccounts.filter((a) => {
        if (type !== 'all' && a.type !== type) return false;
        if (status !== 'all' && a.status !== status) return false;
        if (query && !`${a.name} ${a.email} ${a.owner}`.toLowerCase().includes(query.toLowerCase()))
          return false;
        return true;
      }),
    [adminAccounts, type, status, query],
  );

  // Clamp page so it never points past the end of the current filtered set
  const effectivePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const paginated = filtered.slice((effectivePage - 1) * PAGE_SIZE, effectivePage * PAGE_SIZE);

  const counts = useMemo(() => {
    const c = { merchant: 0, driver: 0, pending: 0, suspended: 0 };
    for (const a of adminAccounts) {
      c[a.type] = (c[a.type] || 0) + 1;
      if (a.status === 'pending') c.pending++;
      if (a.status === 'suspended') c.suspended++;
    }
    return c;
  }, [adminAccounts]);

  return (
    <div className="space-y-base">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Quản lý</div>
          <h1 className="text-display-lg text-ink">Tài khoản</h1>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          <Badge tone="outline">{counts.merchant} quán ăn</Badge>
          <Badge tone="outline">{counts.driver} tài xế</Badge>
          {counts.pending > 0 && <Badge tone="warning" dot>{counts.pending} đang chờ</Badge>}
          {counts.suspended > 0 && <Badge tone="error" dot>{counts.suspended} bị đình chỉ</Badge>}
        </div>
      </div>

      <Card padded={false}>
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-xs border-b border-hairline px-base py-sm">
          <Tabs
            items={[
              { value: 'all', label: 'Tất cả' },
              { value: 'merchant', label: 'Quán ăn' },
              { value: 'driver', label: 'Tài xế' },
            ]}
            value={type}
            onChange={setTypeAndReset}
          />
          <Tabs
            items={[
              { value: 'all', label: 'Mọi trạng thái' },
              { value: 'active', label: 'Hoạt động' },
              { value: 'pending', label: 'Đang chờ' },
              { value: 'suspended', label: 'Đình chỉ' },
            ]}
            value={status}
            onChange={setStatusAndReset}
          />
          <Input
            leadingIcon="search"
            placeholder="Tìm tên, email, chủ sở hữu…"
            value={query}
            onChange={(e) => setQueryAndReset(e.target.value)}
            className="w-full md:ml-auto md:w-64"
          />
        </div>

        {/* Mobile: stacked cards */}
        <ul className="flex flex-col divide-y divide-hairline md:hidden">
          {paginated.map((a) => (
            <li key={a.id} className="p-base">
              <div className="flex items-start gap-sm">
                <Avatar src={a.avatar} name={a.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-body-sm font-semibold text-ink truncate">{a.name}</div>
                      <div className="text-caption text-body truncate">{a.email}</div>
                    </div>
                    <Badge tone={STATUS_TONE[a.status]} dot>{a.status}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-caption text-body">
                    <Badge tone={a.type === 'merchant' ? 'default' : 'outline'}>{a.type}</Badge>
                    {a.owner && <span>Chủ sở hữu — {a.owner}</span>}
                    <span className="nums">Tham gia {a.joined}</span>
                  </div>
                </div>
              </div>
              <div className="mt-sm flex justify-end">
                <RowActions account={a} setAccountStatus={setAccountStatus} pushToast={pushToast} />
              </div>
            </li>
          ))}
        </ul>

        {/* Desktop: wide table */}
        <table className="hidden w-full md:table">
          <thead className="bg-canvas-soft text-caption-uppercase text-body">
            <tr>
              <Th>Tài khoản</Th>
              <Th>Loại</Th>
              <Th>Chủ sở hữu</Th>
              <Th>Tham gia</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right pr-base">Thao tác</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {paginated.map((a) => (
              <tr key={a.id} className="hover:bg-canvas-soft">
                <Td>
                  <div className="flex items-center gap-sm">
                    <Avatar src={a.avatar} name={a.name} size="sm" />
                    <div>
                      <div className="text-body-sm font-semibold text-ink">{a.name}</div>
                      <div className="text-caption text-body">{a.email}</div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <Badge tone={a.type === 'merchant' ? 'default' : 'outline'}>{a.type}</Badge>
                </Td>
                <Td className="text-body-sm text-ink">{a.owner || '—'}</Td>
                <Td className="text-body-sm text-body nums">{a.joined}</Td>
                <Td>
                  <Badge tone={STATUS_TONE[a.status]} dot>{a.status}</Badge>
                </Td>
                <Td className="text-right pr-base">
                  <RowActions account={a} setAccountStatus={setAccountStatus} pushToast={pushToast} />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="grid place-items-center py-xxl text-body-sm text-body">
            <Icon name="search" size={20} className="mb-2" />
            Không có tài khoản nào khớp với bộ lọc.
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

function RowActions({ account, setAccountStatus, pushToast }) {
  return (
    <div className="flex justify-end gap-1">
      {account.status === 'pending' && (
        <Button
          size="sm"
          onClick={() => {
            setAccountStatus(account.id, 'active');
            pushToast({ kind: 'success', title: 'Đã phê duyệt', message: account.name });
          }}
        >
          Phê duyệt
        </Button>
      )}
      {account.status === 'active' && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setAccountStatus(account.id, 'suspended');
            pushToast({ kind: 'error', title: 'Bị đình chỉ', message: account.name });
          }}
        >
          Đình chỉ
        </Button>
      )}
      {account.status === 'suspended' && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setAccountStatus(account.id, 'active');
            pushToast({ kind: 'success', title: 'Đã kích hoạt lại', message: account.name });
          }}
        >
          Kích hoạt lại
        </Button>
      )}
    </div>
  );
}
