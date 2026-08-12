function quoteError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export async function buildShippingQuote({ ghnClient, cart, restaurant, address }) {
  if (!address?.ghnProvinceId || !address?.ghnDistrictId || !address?.ghnWardCode) {
    throw quoteError('GHN_ADDRESS_NOT_READY', 'Địa chỉ chưa có đủ mã GHN.');
  }
  if (!cart?.restaurant_id || !restaurant?.id) {
    throw quoteError('GHN_CART_NOT_READY', 'Giỏ hàng chưa sẵn sàng để tính phí.');
  }

  const shop = await ghnClient.getShop();
  const services = await ghnClient.getAvailableServices(shop.district_id, address.ghnDistrictId);
  const service = services.find((item) => Number(item.service_type_id) === 2);
  if (!service) {
    throw quoteError('GHN_SERVICE_UNAVAILABLE', 'GHN chưa hỗ trợ dịch vụ hàng nhẹ cho tuyến này.');
  }

  const fee = await ghnClient.quote({
    serviceId: service.service_id,
    fromDistrictId: shop.district_id,
    toDistrictId: address.ghnDistrictId,
    toWardCode: address.ghnWardCode,
  });
  const total = Number(fee.total);
  if (!Number.isFinite(total) || total < 0) {
    throw quoteError('GHN_QUOTE_INVALID', 'GHN trả về phí vận chuyển không hợp lệ.');
  }

  return {
    serviceId: service.service_id,
    serviceTypeId: 2,
    serviceName: service.short_name ?? service.service_name ?? 'GHN Hàng nhẹ',
    total,
    breakdown: fee,
  };
}
