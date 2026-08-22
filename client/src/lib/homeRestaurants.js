export function toHomeRestaurant(restaurant) {
  return {
    id: restaurant.id,
    name: restaurant.name,
    banner: restaurant.bannerUrl ?? '',
    logo: restaurant.logoUrl ?? '',
    cuisine: restaurant.cuisineName ?? '',
    tags: [restaurant.tagline].filter(Boolean),
    rating: Number(restaurant.ratingAvg ?? 0),
    reviewCount: Number(restaurant.reviewCount ?? 0),
    fee: Number(restaurant.baseDeliveryFee ?? restaurant.deliveryFee ?? 0) || null,
    eta: restaurant.avgPrepTimeMin ? `${restaurant.avgPrepTimeMin} phút` : 'Đang cập nhật',
    distanceKm: null,
    open: Boolean(restaurant.isOpenNow),
  };
}
