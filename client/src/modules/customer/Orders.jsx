import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Image from '../../components/Image.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import Tabs from '../../components/Tabs.jsx';
import Pagination from '../../components/Pagination.jsx';
import Icon from '../../components/Icon.jsx';
import Input from '../../components/Input.jsx';
import { apiGet } from '../../lib/api.js';
import { cancelMyOrderApi } from '../../lib/api.js';
import { formatVnd } from '../../lib/formatVnd.js';
import { CANCELLABLE_ORDER_STATUSES, orderStatusLabel, orderStatusTone } from '../../lib/orderStatus.js';
import { useApp } from '../../context/AppContext.jsx';

export default function CustomerOrders() {
  const nav = useNavigate();
  const { pushToast, restoreItemsToCart, setCartOpen } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [cancelling, setCancelling] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (filterStatus !== 'all') {
      query.set('status', filterStatus);
    }
    query.set('page', page.toString());
    query.set('limit', pageSize.toString());

    apiGet('/api/v1/me/orders?' + query.toString())
      .then((res) => {
        setOrders(res?.data || []);
        setTotal(res?.pagination?.total || 0);
      })
      .catch((err) => {
        pushToast({ kind: 'error', title: 'Không tải được đơn hàng', message: err.message || 'Vui lòng thử lại.' });
      })
      .finally(() => setLoading(false));
  }, [filterStatus, page, pushToast]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter(
      (o) => o.orderCode?.toLowerCase().includes(needle) || o.restaurantName?.toLowerCase().includes(needle),
    );
  }, [orders, q]);

  const confirmCancel = async () => {
    if (!cancelling) return;
    try {
      await cancelMyOrderApi(cancelling.id);
      pushToast({ kind: 'success', title: 'Đã hủy đơn', message: `Đơn ${cancelling.orderCode} đã được hủy.` });
      setCancelling(null);
      setOrders((cur) => cur.map((o) => (o.id === cancelling.id ? { ...o, status: 'cancelled' } : o)));
    } catch (err) {
      pushToast({ kind: 'error', title: 'Không thể hủy đơn', message: err.message || 'Vui lòng thử lại.' });
      setCancelling(null);
    }
  };

  const reorder = async (order) => {
    if (reorderingId) return;
    setReorderingId(order.id);
    const ok = await restoreItemsToCart({
      restaurantId: order.restaurantId,
      restaurantName: order.restaurantName,
      restaurantLogo: order.restaurantLogo,
      items: order.items.map((i) => ({
        menuItemId: i.menuItemId,
        name: i.name,
        price: i.unitPrice,
        quantity: i.quantity,
      })),
    });
    setReorderingId(null);
    if (ok) {
      pushToast({ kind: 'success', title: 'Đã thêm vào giỏ hàng', message: `Các món của đơn ${order.orderCode}.` });
      setCartOpen(true);
    }
  };

  return (
    <div className="container-page py-xl">
      {/* Page Header */}
      <div className="mb-5">
        <div className="text-caption-uppercase text-body font-medium">Lịch sử</div>
        <h1 className="text-display-lg font-bold text-ink">Đơn hàng của bạn</h1>
      </div>

      {/* Unified Filter & Search Toolbar */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Status Tabs */}
        <div className="overflow-x-auto pb-1 md:pb-0">
          <Tabs
            items={[
              { value: 'all', label: 'Tất cả' },
              { value: 'pending', label: 'Chờ thanh toán' },
              { value: 'active', label: 'Đang giao' },
              { value: 'delivered', label: 'Đã giao' },
              { value: 'cancelled', label: 'Đã huỷ' },
            ]}
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
          />
        </div>

        {/* Search input */}
        <div className="w-full sm:w-72 md:w-80 shrink-0">
          <Input
            leadingIcon="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo mã đơn hoặc tên quán…"
            aria-label="Tìm đơn hàng"
            className="w-full"
            trailingButton={
              q
                ? {
                    icon: 'close',
                    onClick: () => setQ(''),
                    'aria-label': 'Xoá tìm kiếm',
                  }
                : undefined
            }
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-section">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="package"
          title={q ? 'Không tìm thấy đơn' : 'Chưa có đơn hàng nào'}
          message={q ? 'Thử tìm bằng mã đơn hoặc tên quán khác.' : 'Sau khi bạn đặt món, trạng thái đơn hàng sẽ hiển thị trực tiếp ở đây.'}
          action={
            !q ? (
              <Link to="/app/search">
                <Button>Tìm quán ăn</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-base">
          {filtered.map((order) => {
            const cancellable = CANCELLABLE_ORDER_STATUSES.includes(order.status);
            const isDelivered = order.status === 'delivered';
            const isUnpaid = order.status === 'pending_payment' || order.status === 'payment_failed';
            return (
              <Card key={order.id} padded className="flex flex-col md:flex-row md:items-stretch justify-between gap-base transition-shadow hover:shadow-soft">
                <div
                  onClick={() => nav(`/app/track/${order.orderCode}`)}
                  className="flex min-w-0 flex-1 items-start sm:items-center gap-base cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      nav(`/app/track/${order.orderCode}`);
                    }
                  }}
                  aria-label={`Theo dõi đơn ${order.orderCode}`}
                >
                  <Image
                    src={order.restaurantBanner}
                    alt={order.restaurantName}
                    className="h-18 w-22 sm:h-20 sm:w-24 shrink-0 rounded-md object-cover"
                    ratio="4/3"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-title-md font-semibold text-ink">{order.restaurantName || 'Quán ăn'}</span>
                      <div className="md:hidden">
                        <Badge tone={orderStatusTone(order.status)} dot>
                          {orderStatusLabel(order.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-1 truncate text-body-sm text-body">
                      {(order.items ?? []).map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-base gap-y-1 text-caption text-body">
                      <span className="font-mono font-medium">#{order.orderCode}</span>
                      <span>{new Date(order.placedAt).toLocaleString('vi-VN')}</span>
                      <span className="nums font-bold text-ink">{formatVnd(Number(order.totalAmount))}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:items-end md:justify-between gap-sm shrink-0 border-t border-hairline pt-sm md:border-t-0 md:pt-0">
                  <div className="hidden md:block">
                    <Badge tone={orderStatusTone(order.status)} dot>
                      {orderStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-xs">
                    {isUnpaid ? (
                      <Button
                        size="sm"
                        variant="primary"
                        leadingIcon="wallet"
                        onClick={(e) => {
                          e.stopPropagation();
                          nav(`/app/track/${order.orderCode}`);
                        }}
                      >
                        Thanh toán ngay
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        leadingIcon="refresh"
                        loading={reorderingId === order.id}
                        disabled={reorderingId !== null}
                        onClick={(e) => {
                          e.stopPropagation();
                          reorder(order);
                        }}
                      >
                        Đặt lại
                      </Button>
                    )}
                    {isDelivered && (
                      <Button
                        size="sm"
                        variant="secondary"
                        leadingIcon="starFilled"
                        onClick={(e) => {
                          e.stopPropagation();
                          nav(`/app/reviews/write/${order.id}`);
                        }}
                      >
                        Đánh giá
                      </Button>
                    )}
                    {!isUnpaid && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          nav(`/app/track/${order.orderCode}`);
                        }}
                      >
                        Theo dõi
                      </Button>
                    )}
                    {cancellable && (
                      <Button
                        size="sm"
                        variant="secondary"
                        leadingIcon="x"
                        className="!border-error/40 !text-error hover:!bg-[#fbeaea]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancelling(order);
                        }}
                      >
                        Hủy đơn
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!q && total > pageSize && (
        <Pagination
          total={total}
          pageSize={pageSize}
          page={page}
          onChange={setPage}
          className="mt-lg border-t border-hairline pt-base"
        />
      )}

      <Modal
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        title="Xác nhận hủy đơn"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelling(null)}>
              Giữ đơn
            </Button>
            <Button variant="critical" onClick={confirmCancel}>
              Hủy đơn hàng
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-body">
          Bạn có chắc muốn hủy đơn <strong className="text-ink">#{cancelling?.orderCode}</strong>? Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </div>
  );
}