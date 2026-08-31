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

function printOrderReceipt(order) {
  const w = window.open('', '_blank', 'width=420,height=640');
  if (!w) return;
  const itemsHtml = (order.items ?? [])
    .map(
      (item) =>
        `<tr>
          <td style="padding:4px 0;">${item.quantity}× ${item.name}</td>
          <td style="padding:4px 0; text-align:right; white-space:nowrap;">${formatVnd(item.lineSubtotal)}</td>
        </tr>`,
    )
    .join('');
  const address = order.deliveryAddress || order.customerAddress;
  w.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8" />
  <title>Phiếu chế biến ${order.orderCode}</title>
  <style>
    body{font-family:system-ui,Inter,sans-serif;color:#111;padding:24px;font-size:13px;}
    h1{font-size:16px;margin:0 0 4px;}
    .muted{color:#666;}
    table{width:100%;border-collapse:collapse;margin-top:8px;}
    .row{display:flex;justify-content:space-between;margin-top:4px;}
    hr{border:0;border-top:1px dashed #999;margin:12px 0;}
    @media print{ body{padding:0;} }
  </style></head><body>
    <h1>Phiếu chế biến — ${order.orderCode}</h1>
    <div class="muted">${new Date(order.placedAt).toLocaleString('vi-VN')}</div>
    <div class="muted">Khách: ${order.customerName}${order.customerPhone && order.customerPhone !== 'null' ? ' · ' + order.customerPhone : ''}</div>
    ${address ? `<div class="muted">Giao đến: ${address}</div>` : ''}
    <table><tbody>${itemsHtml}</tbody></table>
    <hr />
    <div class="row"><strong>Tổng cộng</strong><strong>${formatVnd(order.totalAmount)}</strong></div>
    ${order.customerNote ? `<div class="muted" style="margin-top:8px;">Ghi chú: ${order.customerNote}</div>` : ''}
    <script>window.onload=function(){window.print();}</script>
  </body></html>`);
  w.document.close();
}

function groupOrders(orders) {
  const buckets = Object.fromEntries(COLUMNS.map((col) => [col.key, []]));
  for (const order of orders) {
    const col = COLUMNS.find((c) => c.statuses.includes(order.status));
    if (col) buckets[col.key].push(order);
  }

  // 1. Cột "Mới": Đơn đặt sớm hơn (chờ lâu hơn) nằm TRÊN CÙNG để xử lý trước (FIFO)
  buckets.new.sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime());

  // 2. Các cột "Đang làm", "Sẵn sàng giao", "Đã giao": Đơn trễ hơn (mới hơn) nằm TRÊN
  buckets.preparing.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
  buckets.ready.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
  buckets.completed.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());

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

  const isToday = selectedDate === todayIsoDate();

  return (
    <div className="space-y-base">
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div>
          <div className="text-caption-uppercase text-body">{isToday ? 'Hôm nay' : 'Lịch sử'}</div>
          <h1 className="text-display-lg text-ink">Đơn hàng trực tiếp</h1>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          <input
            type="date"
            value={selectedDate}
            max={todayIsoDate()}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 rounded-md border border-hairline-strong bg-surface-card px-sm text-caption text-ink cursor-pointer"
          />
          <Badge tone={isToday ? 'live' : 'outline'} dot={isToday} className="h-9 px-3 flex items-center justify-center">
            {isToday
              ? (lastSyncedAt ? `Cập nhật ${lastSyncedAt.toLocaleTimeString('vi-VN')}` : 'Đang tải…')
              : `Ngày ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('vi-VN')}`}
          </Badge>
        </div>
      </div>

      {!isToday && (
        <div className="rounded-md border border-hairline-strong bg-canvas-soft px-base py-sm text-body-sm text-body flex items-center gap-2">
          <Icon name="info" size={16} className="text-[#0d74ce] shrink-0" />
          <span>
            Bạn đang xem đơn hàng ngày <strong>{new Date(selectedDate + 'T12:00:00').toLocaleDateString('vi-VN')}</strong>. Các đơn ngày cũ được hiển thị ở chế độ chỉ đọc để tra cứu và in phiếu chế biến.
          </span>
        </div>
      )}

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
                        isToday={isToday}
                        busy={actingCode === order.orderCode}
                        onAction={(action) => handleAction(order, action)}
                        onCancel={() => {
                          setCancelTarget(order);
                          setCancelReason('');
                          setCancelError('');
                        }}
                        onChat={() => openCustomerChat(order)}
                        onPrint={() => printOrderReceipt(order)}
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

function OrderCard({ order, busy, isToday = true, onAction, onCancel, onChat, onPrint }) {
  const timeAgo = useTimeAgo(order.placedAt);
  const next = ACTIONS[order.status];
  const canCancel = ['placed', 'accepted', 'preparing', 'ready_for_pickup'].includes(order.status);
  const mins = Math.floor((Date.now() - new Date(order.placedAt).getTime()) / 60000);
  const isLate = isToday && ['placed', 'accepted', 'preparing'].includes(order.status) && mins >= 20;

  return (
    <Card padded={false} className="overflow-hidden shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between gap-2 border-b border-hairline bg-canvas-soft/60 px-sm py-2">
        <span
          className="font-mono text-caption font-semibold text-ink truncate max-w-[140px]"
          title={order.orderCode}
        >
          {order.orderCode}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {isLate && (
            <Badge tone="error" dot className="text-[11px] font-semibold animate-pulse">
              Trễ ({mins}p)
            </Badge>
          )}
          <Badge tone="outline" className="text-caption shrink-0 whitespace-nowrap">
            {timeAgo}
          </Badge>
        </div>
      </div>

      <div className="p-sm">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-title-sm font-semibold text-ink truncate">{order.customerName}</div>
          {order.customerPhone && order.customerPhone !== 'null' ? (
            <span className="text-caption text-body shrink-0">{order.customerPhone}</span>
          ) : null}
        </div>

        <ul className="mt-2 space-y-1 text-body-sm text-body">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-2">
              <span className="line-clamp-2">
                <span className="font-medium text-ink nums">{item.quantity}×</span> {item.name}
              </span>
              <span className="nums text-body shrink-0">{formatVnd(item.lineSubtotal)}</span>
            </li>
          ))}
        </ul>

        {order.customerNote ? (
          <div className="mt-2 rounded-md border border-hairline bg-canvas-soft px-sm py-1 text-caption text-body">
            <Icon name="alert" size={11} className="mr-1 inline text-warning" /> {order.customerNote}
          </div>
        ) : null}

        <div className="mt-sm flex items-center justify-between border-t border-hairline pt-2">
          <span className="text-caption text-body">Tổng cộng</span>
          <span className="nums text-title-sm font-bold text-ink">{formatVnd(order.totalAmount)}</span>
        </div>
      </div>

      {/* Action footer */}
      <div className="space-y-1.5 border-t border-hairline bg-canvas-soft/40 p-sm">
        {isToday && next && (
          <Button
            size="sm"
            className="w-full font-semibold shadow-xs"
            disabled={busy}
            loading={busy}
            onClick={() => onAction(next.action)}
          >
            {next.label}
          </Button>
        )}

        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            leadingIcon="chat"
            className="flex-1 !px-2 text-caption font-medium"
            onClick={onChat}
          >
            Nhắn tin
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leadingIcon="printer"
            className="flex-1 !px-2 text-caption font-medium"
            onClick={onPrint}
          >
            In phiếu
          </Button>
          {isToday && canCancel && (
            <Button
              variant="secondary"
              size="sm"
              className="!px-2.5 text-caption font-medium text-error hover:bg-error-soft hover:text-error"
              disabled={busy}
              onClick={onCancel}
            >
              Hủy
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const dateObj = new Date(timestamp);
  const placed = dateObj.getTime();
  const diffMinutes = Math.max(0, Math.round((now - placed) / 60000));
  const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const isToday = new Date().toDateString() === dateObj.toDateString();
  if (isToday) return timeStr;
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  return `${day}/${month} ${timeStr}`;
}

function useTimeAgo(timestamp) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  return formatTimeAgo(timestamp);
}
