function checkoutError(message, code) {
  const error = new Error(message);
  error.status = 409;
  error.code = code;
  return error;
}

export function validateCheckoutAvailability(restaurant, cartItems = []) {
  if (!restaurant || restaurant.status !== 'active') {
    throw checkoutError('Quán hiện không còn nhận đơn.', 'RESTAURANT_UNAVAILABLE');
  }
  if (Number(restaurant.is_open_now) !== 1) {
    throw checkoutError('Quán hiện đang đóng cửa. Vui lòng quay lại trong giờ hoạt động.', 'RESTAURANT_CLOSED');
  }

  for (const item of cartItems) {
    if (Number(item.menu_restaurant_id) !== Number(restaurant.id)) {
      throw checkoutError('Giỏ hàng chứa món không thuộc quán đang đặt.', 'CART_RESTAURANT_MISMATCH');
    }
    if (item.menu_status !== 'active' || Number(item.in_stock) !== 1) {
      throw checkoutError(`${item.item_name ?? 'Một món'} hiện đã hết hàng hoặc ngừng bán.`, 'ITEM_UNAVAILABLE');
    }
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw checkoutError('Số lượng món trong giỏ không hợp lệ.', 'INVALID_ITEM_QUANTITY');
    }
    if (Number(item.unit_price) !== Number(item.price)) {
      throw checkoutError(
        `Giá của ${item.item_name ?? 'một món'} vừa thay đổi. Vui lòng kiểm tra lại giỏ hàng.`,
        'PRICE_CHANGED',
      );
    }
  }
}
