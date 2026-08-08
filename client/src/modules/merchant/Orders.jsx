import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Icon from '../../components/Icon.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import { Textarea } from '../../components/Input.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { createOrderConversationApi, fetchMerchantOrdersApi, updateMerchantOrderStatusApi } from '../../lib/api.js';
import { formatVnd } from '../../lib/formatVnd.js';

const POLL_MS = 15000;
let ordersApiMissing = false;

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
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayIsoDate);
  const [actingCode, setActingCode] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [backendUnavailable, setBackendUnavailable] = useState(ordersApiMissing);

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (backendUnavailable) return;
    if (!silent) setLoading(true);
    try {
      const { orders: list } = await fetchMerchantOrdersApi({ date: selectedDate });
      setOrders(list ?? []);
      setLastSyncedAt(new Date());
    } catch (err) {
      if (err?.status === 404) {
        ordersApiMissing = true;
        setBackendUnavailable(true);
        return;
      }
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
  }, [backendUnavailable, pushToast, selectedDate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (backendUnavailable) return undefined;
    const timer = setInterval(() => loadOrders({ silent: true }), POLL_MS);
    return () => clearInterval(timer);
  }, [backendUnavailable, loadOrders]);

  const grouped = useMemo(() => groupOrders(orders), [orders]);

  if (backendUnavailable) {
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
            <Badge tone="outline">Chưa thể tải đơn hàng</Badge>
          </div>
        </div>

        <EmptyState
          icon="package"
          title="Không thể tải đơn hàng"
          message="Hệ thống chưa thể kết nối với dữ liệu đơn hàng. Vui lòng thử lại sau."
          action={
            <button
              onClick={() => {
                ordersApiMissing = false;
                setBackendUnavailable(false);
                loadOrders();
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

  const handleCancel = async () => {
    const reason = cancelReason.trim();
    if (!reason) {
      setCancelError('Vui lòng nhập lý do hủy đơn.');
      return;
    }
    const order = cancelTarget;
    if (!order) return;
    setActingCode(order.orderCode);
    try {
      const { order: updated } = await updateMerchantOrderStatusApi(
        order.orderCode,
        'cancel',
        reason.trim() || undefined,
      );
      setOrders((prev) => prev.filter((o) => o.orderCode !== updated.orderCode));
      setCancelTarget(null);
      setCancelReason('');
      setCancelError('');
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

  const openCustomerChat = async (order) => {
    try {
      const response = await createOrderConversationApi(order.id, 'customer');
      navigate('/chat/' + response.conversation.id);
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể mở trò chuyện', message: err.message || 'Vui lòng thử lại.' });
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
                        onCancel={() => {
                          setCancelTarget(order);
                          setCancelReason('');
                          setCancelError('');
                        }}
                        onChat={() => openCustomerChat(order)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => {
          if (actingCode !== cancelTarget?.orderCode) setCancelTarget(null);
        }}
        title={`Hủy đơn hàng ${cancelTarget?.orderCode || ''}`}
        size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setCancelTarget(null)} disabled={actingCode === cancelTarget?.orderCode}>Quay lại</Button>
          <Button onClick={handleCancel} loading={actingCode === cancelTarget?.orderCode}>Xác nhận hủy đơn</Button>
        </>}
      >
        <div className="space-y-sm">
          <p className="text-body-sm text-body">Lý do sẽ được gửi đến khách hàng cùng thông báo hủy đơn.</p>
          <Textarea
            id="merchant-cancel-reason"
            label="Lý do hủy đơn"
            rows={4}
            value={cancelReason}
            onChange={(event) => {
              setCancelReason(event.target.value);
              if (cancelError) setCancelError('');
            }}
            error={cancelError}
            placeholder="Ví dụ: Quán đang quá tải và chưa thể chuẩn bị đơn đúng thời gian."
            required
          />
        </div>
      </Modal>
    </div>
  );
}

function OrderCard({ order, busy, onAction, onCancel, onChat }) {
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
      <div className="flex items-center gap-1 border-t border-hairline p-sm">
          <Button variant="secondary" size="sm" leadingIcon="chat" onClick={onChat}>Nhắn khách</Button>

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
