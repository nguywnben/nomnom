import { useCallback, useEffect, useMemo, useState } from 'react';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { fetchMerchantOrdersApi, updateMerchantOrderStatusApi } from '../../lib/api.js';
import { formatVnd } from '../../lib/formatVnd.js';

const POLL_MS = 15000;

const COLUMNS = [
  { key: 'new', label: 'Mới', tone: 'warning', statuses: ['placed'] },
  { key: 'preparing', label: 'Đang làm', tone: 'default', statuses: ['accepted', 'preparing'] },
  { key: 'ready', label: 'Sẵn sàng giao', tone: 'success', statuses: ['ready_for_pickup'] },
  { key: 'completed', label: 'Đã giao', tone: 'outline', statuses: ['picked_up', 'delivering', 'delivered'] },
];

const ACTIONS = {
  placed: { action: 'accept', label: 'Nhận đơn' },
  accepted: { action: 'start_preparing', label: 'Bắt đầu nấu' },
  preparing: { action: 'ready', label: 'Sẵn sàng giao' },
};

function todayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function groupOrders(orders) {
  const buckets = Object.fromEntries(COLUMNS.map((col) => [col.key, []]));
  for (const order of orders) {
    const col = COLUMNS.find((c) => c.statuses.includes(order.status));
    if (col) buckets[col.key].push(order);
  }
  return buckets;
}

export default function MerchantOrders() {
  const { pushToast } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayIsoDate);
  const [actingCode, setActingCode] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { orders: list } = await fetchMerchantOrdersApi({ date: selectedDate });
      setOrders(list ?? []);
      setLastSyncedAt(new Date());
    } catch (err) {
      if (!silent) {
        pushToast({
          kind: 'error',
          title: 'Không tải được đơn hàng',
          message: err.message ?? 'Vui lòng thử lại sau.',
          duration: 4500,
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [pushToast, selectedDate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const timer = setInterval(() => loadOrders({ silent: true }), POLL_MS);
    return () => clearInterval(timer);
  }, [loadOrders]);

  const grouped = useMemo(() => groupOrders(orders), [orders]);

  const handleAction = async (order, action) => {
    setActingCode(order.orderCode);
    try {
      const { order: updated } = await updateMerchantOrderStatusApi(order.orderCode, action);
      setOrders((prev) => prev.map((o) => (o.orderCode === updated.orderCode ? updated : o)));
      pushToast({
        kind: 'success',
        title: 'Đã cập nhật đơn',
        message: `${updated.orderCode} → ${updated.status}`,
        duration: 3200,
      });
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không thể cập nhật đơn',
        message: err.message ?? 'Vui lòng thử lại.',
        duration: 4500,
      });
    } finally {
      setActingCode(null);
    }
  };

  const handleCancel = async (order) => {
    const reason = window.prompt('Lý do hủy đơn (tuỳ chọn):', 'Quán không thể xử lý đơn này.');
    if (reason === null) return;
    setActingCode(order.orderCode);
    try {
      const { order: updated } = await updateMerchantOrderStatusApi(
        order.orderCode,
        'cancel',
        reason.trim() || undefined,
      );
      setOrders((prev) => prev.filter((o) => o.orderCode !== updated.orderCode));
      pushToast({
        kind: 'error',
        title: 'Đã hủy đơn',
        message: updated.orderCode,
        duration: 4000,
      });
    } catch (err) {
      pushToast({
        kind: 'error',
        title: 'Không thể hủy đơn',
        message: err.message ?? 'Vui lòng thử lại.',
        duration: 4500,
      });
    } finally {
      setActingCode(null);
    }
  };

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">Hôm nay</div>
          <h1 className="text-display-lg text-ink">Đơn hàng trực tiếp</h1>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border border-hairline bg-surface px-sm py-1.5 text-body-sm text-ink"
          />
          <Badge tone="live" dot>
            {lastSyncedAt ? `Cập nhật ${lastSyncedAt.toLocaleTimeString('vi-VN')}` : 'Đang tải…'}
          </Badge>
          <Button variant="secondary" leadingIcon="refresh" onClick={() => loadOrders()}>
            Làm mới
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-xl text-center text-body-md text-body">Đang tải đơn hàng…</div>
      ) : (
        <div className="-mx-base flex gap-base overflow-x-auto px-base pb-2 scrollbar-hide md:mx-0 md:px-0 md:overflow-visible lg:grid lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const list = grouped[col.key] || [];
            return (
              <div key={col.key} className="flex w-[280px] shrink-0 flex-col gap-sm lg:w-auto lg:shrink">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge tone={col.tone}>{col.label}</Badge>
                    <span className="text-caption text-body nums">{list.length}</span>
                  </div>
                  {col.key === 'new' && list.length > 0 && (
                    <Badge tone="live" dot>Cần xử lý</Badge>
                  )}
                </div>

                {list.length === 0 ? (
                  <EmptyState
                    icon="package"
                    title="Không có đơn hàng"
                    message={col.key === 'new' ? 'Các đơn hàng mới sẽ xuất hiện ở đây.' : 'Chưa có gì ở đây.'}
                    className="!p-base"
                  />
                ) : (
                  <ul className="flex flex-col gap-2">
                    {list.map((order) => (
                      <OrderCard
                        key={order.orderCode}
                        order={order}
                        busy={actingCode === order.orderCode}
                        onAction={(action) => handleAction(order, action)}
                        onCancel={() => handleCancel(order)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, busy, onAction, onCancel }) {
  const minutesAgo = useMinutesAgo(order.placedAt);
  const next = ACTIONS[order.status];
  const canCancel = ['placed', 'accepted', 'preparing', 'ready_for_pickup'].includes(order.status);

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-sm pt-sm">
        <span className="text-caption-uppercase text-body">{order.orderCode}</span>
        <Badge tone="outline">{minutesAgo} phút trước</Badge>
      </div>
      <div className="px-sm py-sm">
        <div className="text-title-sm text-ink">{order.customerName}</div>
        {order.customerPhone ? (
          <div className="text-caption text-body">{order.customerPhone}</div>
        ) : null}
        <ul className="mt-1 space-y-0.5 text-body-sm text-body">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-base">
              <span>
                <span className="text-ink nums">{item.quantity}×</span> {item.name}
              </span>
              <span className="nums text-body">{formatVnd(item.lineSubtotal)}</span>
            </li>
          ))}
        </ul>
        {order.customerNote ? (
          <div className="mt-2 rounded-md border border-hairline bg-canvas-soft px-sm py-1.5 text-caption text-body">
            <Icon name="alert" size={11} className="mr-1 inline" /> {order.customerNote}
          </div>
        ) : null}
        <div className="mt-sm flex items-center justify-between">
          <span className="text-caption text-body">Tổng cộng</span>
          <span className="nums text-title-sm text-ink">{formatVnd(order.totalAmount)}</span>
        </div>
      </div>
      {(next || canCancel) && (
        <div className="flex items-center gap-1 border-t border-hairline p-sm">
          {canCancel ? (
            <Button variant="secondary" size="sm" disabled={busy} onClick={onCancel}>
              Hủy
            </Button>
          ) : null}
          {next ? (
            <Button
              size="sm"
              className="ml-auto"
              disabled={busy}
              onClick={() => onAction(next.action)}
            >
              {busy ? 'Đang xử lý…' : next.label}
            </Button>
          ) : null}
        </div>
      )}
    </Card>
  );
}

function useMinutesAgo(timestamp) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  const placed = timestamp ? new Date(timestamp).getTime() : now;
  return Math.max(1, Math.round((now - placed) / 60000));
}
