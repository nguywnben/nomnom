import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Drawer from '../../components/Drawer.jsx';
import Button, { IconButton } from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import Icon from '../../components/Icon.jsx';
import Image from '../../components/Image.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatVnd } from '../../lib/formatVnd.js';

export default function CartDrawer() {
  const nav = useNavigate();
  const {
    cart,
    cartOpen,
    setCartOpen,
    setItemQty,
    removeFromCart,
    cartSubtotal,
    deliveryFee,
    discount,
    cartTotal,
    syncing,
    appliedPromo,
    setAppliedPromo,
    restoreItemsToCart,
    pushToast,
    user,
    shopAsCustomer,
    customerCartRestriction,
  } = useApp();
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    itemName: '',
    onConfirm: null,
    onCancel: null,
  });

  const restaurantName = cart.restaurantName ?? 'Quán ăn';
  const restaurantLogo = cart.restaurantLogo ?? null;

  const removeWithUndo = async (item) => {
    const snapshot = { ...item };
    try {
      await removeFromCart(item.id);
      pushToast({
        kind: 'info',
        title: 'Đã xóa món',
        message: item.name,
        duration: 6000,
        action: {
          label: 'Hoàn tác',
          onClick: async () => {
            await restoreItemsToCart({
              restaurantId: cart.restaurantId,
              restaurantName: cart.restaurantName,
              restaurantLogo: cart.restaurantLogo,
              items: [{
                menuItemId: snapshot.menuItemId ?? snapshot.id,
                name: snapshot.name,
                price: snapshot.price,
                quantity: snapshot.quantity,
              }],
            });
            setCartOpen(true);
          },
        },
      });
    } catch {
      // removeFromCart đã tự báo lỗi
    }
  };

  return (
    <>
      <Drawer
      open={cartOpen}
      onClose={() => setCartOpen(false)}
      title="Giỏ hàng của bạn"
      footer={
        cart.items.length ? (
          <div className="flex flex-col gap-sm">
            {/* Promo Chip nếu đã áp dụng mã */}
            {appliedPromo && (
              <div className="flex items-center justify-between rounded-md border border-success/30 bg-[#e6f4ea] px-sm py-2 text-caption text-success mb-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon name="zap" size={14} />
                  <span className="font-bold font-mono text-ink">{appliedPromo.code}</span>
                  <span className="truncate text-body">({appliedPromo.label})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAppliedPromo(null)}
                  className="text-body hover:text-ink ml-1 p-0.5"
                  aria-label="Xóa mã"
                >
                  <Icon name="close" size={12} />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between text-body-sm">
              <span className="text-body">Tạm tính</span>
              <span className="nums text-ink">{formatVnd(cartSubtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-body-sm">
              <span className="text-body">Phí giao hàng</span>
              <span className="nums text-ink">{formatVnd(deliveryFee)}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-success">Khuyến mãi</span>
                <span className="nums text-success">−{formatVnd(discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-hairline pt-sm">
              <span className="text-title-sm text-ink">Tổng cộng</span>
              <span className="nums text-display-sm text-ink">{formatVnd(cartTotal)}</span>
            </div>
            <Button
              className="mt-xs w-full"
              onClick={() => {
                setCartOpen(false);
                nav('/app/checkout');
              }}
              disabled={!shopAsCustomer}
            >
              Thanh toán
            </Button>
          </div>
        ) : null
      }
    >
      <div className="flex flex-col gap-base p-lg">
        {!shopAsCustomer && customerCartRestriction ? (
          <EmptyState
            icon="shield"
            title={customerCartRestriction.title}
            message={customerCartRestriction.message}
          />
        ) : (
          <>
        {/* Sync status — only visible when logged in as customer */}
        {user && shopAsCustomer && cart.items.length > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-canvas-soft px-sm py-2 text-caption text-body">
            <Icon
              name="refresh"
              size={12}
              className={syncing ? 'animate-spin text-ink' : 'text-success'}
            />
            {syncing ? 'Đang đồng bộ giỏ hàng với tài khoản của bạn…' : `Giỏ hàng đã đồng bộ với ${user.email ?? 'tài khoản của bạn'}`}
          </div>
        )}

        {cart.items.length > 0 && restaurantName && (
          <div className="flex items-center gap-sm rounded-md border border-hairline p-sm">
            {restaurantLogo && (
              <Image
                src={restaurantLogo}
                alt={restaurantName}
                className="h-10 w-10 rounded-md"
                ratio="1"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-body-sm font-semibold text-ink truncate">{restaurantName}</div>
              <div className="text-caption text-body">phí giao {formatVnd(deliveryFee)}</div>
            </div>
          </div>
        )}

        {cart.items.length > 0 ? (
          <div className="flex flex-col divide-y divide-hairline">
            {cart.items.map((i) => (
              <div key={i.id} className="flex items-center gap-sm py-sm">
                <Image src={i.imageUrl ?? i.image} alt={i.name} className="h-14 w-14 rounded-md" ratio="1" />
                <div className="flex-1 min-w-0">
                  <div className="text-body-sm font-semibold text-ink truncate">{i.name}</div>
                  <div className="text-caption text-body">{formatVnd(i.price)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <IconButton
                    icon="minus"
                    size="sm"
                    variant="secondary"
                    label="Giảm"
                    onClick={() => {
                      if (i.quantity === 1) {
                        setConfirmDelete({
                          open: true,
                          itemName: i.name,
                          onConfirm: () => removeWithUndo(i),
                        });
                      } else {
                        setItemQty(i.id, i.quantity - 1);
                      }
                    }}
                  />
                  <CartItemQtyInput
                    itemId={i.id}
                    quantity={i.quantity}
                    itemName={i.name}
                    onChange={(newQty) => setItemQty(i.id, newQty)}
                    onZero={(confirm, cancel) => {
                      setConfirmDelete({
                        open: true,
                        itemName: i.name,
                        onConfirm: confirm,
                        onCancel: cancel,
                      });
                    }}
                  />
                  <IconButton
                    icon="plus"
                    size="sm"
                    variant="secondary"
                    label="Tăng"
                    onClick={() => setItemQty(i.id, i.quantity + 1)}
                  />
                </div>
                <button
                  className="ml-1 text-body hover:text-error"
                  onClick={() => {
                    setConfirmDelete({
                      open: true,
                      itemName: i.name,
                      onConfirm: () => removeWithUndo(i),
                    });
                  }}
                  aria-label="Xóa"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="cart"
            title="Giỏ hàng trống"
            message="Thêm món từ bất kỳ quán ăn nào đang mở cửa để bắt đầu."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setCartOpen(false);
                  nav('/app/search');
                }}
              >
                Tiếp tục mua sắm
              </Button>
            }
          />
        )}
          </>
        )}
      </div>
    </Drawer>

      <Modal
        open={confirmDelete.open}
        onClose={() => {
          confirmDelete.onCancel?.();
          setConfirmDelete({ open: false, itemName: '', onConfirm: null, onCancel: null });
        }}
        title="Xác nhận xóa món"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                confirmDelete.onCancel?.();
                setConfirmDelete({ open: false, itemName: '', onConfirm: null, onCancel: null });
              }}
            >
              Hủy
            </Button>
            <Button
              className="!bg-[#ea4335] !border-[#ea4335] hover:!bg-[#d32f2f] hover:!border-[#d32f2f] text-white"
              onClick={() => {
                confirmDelete.onConfirm?.();
                setConfirmDelete({ open: false, itemName: '', onConfirm: null, onCancel: null });
              }}
            >
              Xóa món
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-body">
          Bạn có chắc chắn muốn xóa món <strong className="text-ink font-semibold">"{confirmDelete.itemName}"</strong> khỏi giỏ hàng không?
        </p>
      </Modal>
    </>
  );
}

function CartItemQtyInput({ quantity, itemName, onZero, onChange }) {
  const [val, setVal] = useState(String(quantity));

  useEffect(() => {
    setVal(String(quantity));
  }, [quantity]);

  const handleBlur = () => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 0) {
      setVal(String(quantity));
    } else if (parsed === 0) {
      if (onZero) {
        onZero(
          () => onChange(0),
          () => setVal(String(quantity))
        );
      } else {
        onChange(0);
      }
    } else {
      onChange(parsed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <input
      type="number"
      min="0"
      value={val}
      aria-label={`Số lượng ${itemName}`}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{ appearance: 'textfield', WebkitAppearance: 'none', MozAppearance: 'textfield' }}
      className="w-12 text-center text-body-sm font-semibold nums bg-canvas-soft border border-hairline rounded py-0.5 focus:outline-none focus:border-ink-strong"
    />
  );
}
