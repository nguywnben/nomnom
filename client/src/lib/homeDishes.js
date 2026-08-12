export function buildTrendingDishes(items, limit = 10) {
  return (items ?? [])
    .filter((item) => {
      const menuItemId = Number(item.id);
      const restaurantId = Number(item.restaurantId);
      const price = Number(item.price);
      return menuItemId > 0 && restaurantId > 0 && price > 0;
    })
    .slice(0, limit)
    .map((item) => {
      const prepTimeMin = Number(item.avgPrepTimeMin ?? item.prepTimeMin ?? 0);
      return {
        id: Number(item.id),
        menuItemId: Number(item.id),
        name: item.name,
        image: item.imageUrl,
        imageUrl: item.imageUrl,
        price: Number(item.price),
        restaurantId: Number(item.restaurantId),
        restaurantName: item.restaurantName,
        restaurantLogo: item.restaurantLogo ?? null,
        eta: `${prepTimeMin} phút`,
      };
    });
}
