/** Số đếm / thống kê — phân cách hàng nghìn theo vi-VN (vd. 2144 → 2.144). */
export function formatViInteger(n) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(Number(n)));
}

/** Hiển thị số tiền VND (đã là đồng trong dữ liệu — không quy đổi). */
export function formatVnd(amount) {
  const n = Math.round(Number(amount));
  return `${new Intl.NumberFormat('vi-VN').format(n)} ₫`;
}

/** Trục biểu đồ GMV lớn (đơn vị: tỷ đồng). */
export function formatVndAxisBillions(v) {
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(Number(v) / 1e9)} tỷ`;
}
