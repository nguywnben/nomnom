# Kế hoạch triển khai lấy địa bàn GHN và tính phí giao hàng tự động

> Dành cho agent thực thi: BẮT BUỘC dùng superpowers:subagent-driven-development hoặc superpowers:executing-plans để thực hiện task theo thứ tự.

**Mục tiêu:** Dùng mã địa bàn GHN cho địa chỉ khách hàng, tự báo phí khi đổi địa chỉ ở checkout và lưu phí được server xác minh vào đơn hàng.

**Kiến trúc:** React chỉ gọi API NomNom. Express giữ GHN_TOKEN và GHN_SHOP_ID, gọi GHN, chuẩn hóa dữ liệu và báo giá từ active cart + địa chỉ thuộc khách đang đăng nhập. Route tạo đơn gọi lại báo giá trước khi INSERT để không tin dữ liệu phí trên browser.

**Công nghệ:** React 19, Vite, Express 4, MySQL 8, Node native fetch, Node test runner.

## Ràng buộc chung

- Không commit Token, Shop ID thật hoặc đưa chúng sang React.
- Không tạo vận đơn, webhook, hủy đơn hoặc đối soát COD trong plan này.
- Không fallback về restaurants.base_delivery_fee.
- Kiện hàng luôn là 500 g, 20 × 20 × 10 cm, insurance_value: 0, dịch vụ hàng nhẹ service_type_id: 2.
- Địa chỉ chỉ đặt đơn được khi có đủ ghnProvinceId, ghnDistrictId, ghnWardCode.

---

## Cấu trúc file

| File | Vai trò |
|---|---|
| database/migrations/20260812_add_ghn_address_codes.sql | Cột mã GHN cho địa chỉ. |
| server/src/lib/ghn.js | Client GHN, request/response/error an toàn. |
| server/src/lib/shippingQuote.js | Chọn service và tạo quote từ dữ liệu server. |
| server/src/routes/shipping.routes.js | API tỉnh/quận/phường/quote cho khách đăng nhập. |
| server/src/routes/me.routes.js | Đọc/ghi mã GHN với địa chỉ. |
| server/src/routes/orders.routes.js | Dùng quote server thay phí cố định. |
| client/src/lib/ghnLocations.js | Client gọi API địa bàn NomNom. |
| client/src/modules/customer/profile/Addresses.jsx | Dropdown Tỉnh → Quận/Huyện → Phường/Xã. |
| client/src/modules/customer/Checkout.jsx | Auto quote và trạng thái khóa đặt đơn. |

## Task 1: Lưu mã địa bàn GHN với địa chỉ

**Files:**

- Create: database/migrations/20260812_add_ghn_address_codes.sql
- Modify: server/src/routes/me.routes.js:106-287
- Modify: server/.env.example:25-31

**Interfaces:**

- Payload địa chỉ mới: { city, district, ward, ghnProvinceId, ghnDistrictId, ghnWardCode, ... }.
- Response địa chỉ: thêm ghnProvinceId, ghnDistrictId, ghnWardCode.

- [ ] **Bước 1: Viết migration**

~~~sql
ALTER TABLE customer_addresses
  ADD COLUMN ghn_province_id INT UNSIGNED NULL AFTER city,
  ADD COLUMN ghn_district_id INT UNSIGNED NULL AFTER ghn_province_id,
  ADD COLUMN ghn_ward_code VARCHAR(20) NULL AFTER ghn_district_id,
  ADD KEY idx_customer_addresses_ghn_route (ghn_district_id, ghn_ward_code);
~~~

- [ ] **Bước 2: Cập nhật select/insert/update địa chỉ**

Thêm vào các SELECT trả address:

~~~sql
ghn_province_id AS ghnProvinceId,
ghn_district_id AS ghnDistrictId,
ghn_ward_code AS ghnWardCode
~~~

Thêm vào payload POST và fieldMap PATCH:

~~~js
ghnProvinceId: 'ghn_province_id',
ghnDistrictId: 'ghn_district_id',
ghnWardCode: 'ghn_ward_code',
~~~

POST bắt buộc đủ ba mã. PATCH nếu một mã xuất hiện thì bắt buộc đủ ba mã; province/district là integer dương, ward là chuỗi không rỗng.

- [ ] **Bước 3: Thêm env template không có secret**

~~~env
# GHN: chỉ backend sử dụng
GHN_TOKEN=
GHN_SHOP_ID=
GHN_API_BASE_URL=https://online-gateway.ghn.vn/shiip/public-api
~~~

- [ ] **Bước 4: Kiểm chứng**

Run: mysql -u root -p nomnom < database/migrations/20260812_add_ghn_address_codes.sql

Expected: SHOW COLUMNS FROM customer_addresses LIKE 'ghn_%'; trả đúng ba cột.

- [ ] **Bước 5: Commit**

~~~bash
git add database/migrations/20260812_add_ghn_address_codes.sql server/src/routes/me.routes.js server/.env.example
git commit -m "thêm mã địa bàn GHN"
~~~

## Task 2: Client GHN và dịch vụ báo giá thuần backend

**Files:**

- Create: server/src/lib/ghn.js
- Create: server/src/lib/ghn.test.js
- Create: server/src/lib/shippingQuote.js
- Create: server/src/lib/shippingQuote.test.js

**Interfaces:**

~~~js
createGhnClient({ token, shopId, baseUrl, fetchImpl })
buildShippingQuote({ ghnClient, cart, restaurant, address })
// => { serviceId, serviceTypeId, serviceName, total, breakdown }
~~~

- [ ] **Bước 1: Viết test client GHN thất bại**

~~~js
test('quote gửi Token và ShopId chỉ ở backend', async () => {
  const calls = [];
  const client = createGhnClient({
    token: 'test-token', shopId: 42, baseUrl: 'https://ghn.test',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => ({ code: 200, data: { total: 36000 } }) };
    },
  });
  const quote = await client.quote({
    serviceId: 53320, fromDistrictId: 1455, toDistrictId: 1442, toWardCode: '20107',
  });
  assert.equal(quote.total, 36000);
  assert.equal(calls[0].options.headers.Token, 'test-token');
  assert.equal(calls[0].options.headers.ShopId, '42');
});
~~~

Run: cd server && node --test src/lib/ghn.test.js

Expected: FAIL vì ghn.js chưa tồn tại.

- [ ] **Bước 2: Cài đặt createGhnClient**

Implement các method:

~~~js
getProvinces()                         // GET /master-data/province
getDistricts(provinceId)               // GET /master-data/district, body { province_id }
getWards(districtId)                   // GET /master-data/ward?district_id=:id
getAvailableServices(fromDistrictId, toDistrictId)
getShop()                              // POST /v2/shop/all, { offset: 0, limit: 50 }
quote({ serviceId, fromDistrictId, toDistrictId, toWardCode })
~~~

quote gửi service_id, service_type_id: 2, weight: 500, length: 20, width: 20, height: 10, insurance_value: 0, from_district_id, to_district_id, to_ward_code. Với HTTP lỗi, JSON không hợp lệ hoặc code khác 200, ném GhnProviderError không chứa token.

- [ ] **Bước 3: Viết test và cài đặt chọn service**

~~~js
test('từ chối quote nếu GHN không có dịch vụ hàng nhẹ', async () => {
  await assert.rejects(
    buildShippingQuote({
      ghnClient: { getAvailableServices: async () => [] },
      cart, restaurant, address,
    }),
    { code: 'GHN_SERVICE_UNAVAILABLE' },
  );
});
~~~

buildShippingQuote kiểm tra address có mã GHN. Nó lấy shop đầu tiên khả dụng từ getShop, dùng shop.district_id làm điểm lấy, chọn service đầu tiên có service_type_id === 2, rồi gọi quote. Nếu address thiếu mã, ném GHN_ADDRESS_NOT_READY.

- [ ] **Bước 4: Kiểm chứng**

Run: cd server && node --test src/lib/ghn.test.js src/lib/shippingQuote.test.js

Expected: PASS; test kiểm tra error không chứa test-token.

- [ ] **Bước 5: Commit**

~~~bash
git add server/src/lib/ghn.js server/src/lib/ghn.test.js server/src/lib/shippingQuote.js server/src/lib/shippingQuote.test.js
git commit -m "thêm báo giá GHN"
~~~

## Task 3: API proxy địa bàn và quote

**Files:**

- Create: server/src/routes/shipping.routes.js
- Create: server/src/routes/shipping.integration.test.js
- Modify: server/src/index.js:40-57

**Interfaces:**

~~~text
GET  /api/v1/shipping/ghn/provinces
GET  /api/v1/shipping/ghn/districts?provinceId=:id
GET  /api/v1/shipping/ghn/wards?districtId=:id
POST /api/v1/shipping/ghn/quote { addressId }
~~~

- [ ] **Bước 1: Viết các test HTTP thất bại**

~~~js
assert.equal(await request('/api/v1/shipping/ghn/districts?provinceId=abc').status, 400);
assert.equal(await request('/api/v1/shipping/ghn/quote', { addressId: anotherCustomersAddress }).status, 404);
assert.equal(await request('/api/v1/shipping/ghn/quote', { addressId: addressWithoutGhnCodes }).status, 422);
~~~

Run: cd server && node --test src/routes/shipping.integration.test.js

Expected: FAIL vì router chưa tồn tại.

- [ ] **Bước 2: Cài đặt router**

Dùng requireAuth và ensureCustomer. Validate query số nguyên dương. Chuẩn hóa response thành:

~~~js
{ id: Number(item.ProvinceID ?? item.DistrictID), code: String(item.WardCode ?? ''), name: item.ProvinceName ?? item.DistrictName ?? item.WardName }
~~~

Chỉ trả địa bàn mở tuyến (Status === 1), và ở district/ward chỉ trả SupportType === 2 || SupportType === 3.

- [ ] **Bước 3: Cài POST /quote và đăng ký router**

Load active cart, address với id + customer_id, restaurant theo cart.restaurant_id; không dùng restaurantId, fee, serviceId từ body. Map address chưa chuẩn hóa/no service thành 422, cart trống thành 409, provider failure thành 502.

Trong index.js:

~~~js
import shippingRoutes from './routes/shipping.routes.js';
app.use('/api/v1/shipping', shippingRoutes);
~~~

- [ ] **Bước 4: Kiểm chứng và commit**

Run: cd server && node --test src/routes/shipping.integration.test.js

Expected: PASS cho 400, 404, 422, 502, quote thành công.

~~~bash
git add server/src/routes/shipping.routes.js server/src/routes/shipping.integration.test.js server/src/index.js
git commit -m "thêm API GHN"
~~~

## Task 4: Bắt buộc dùng quote GHN khi tạo order

**Files:**

- Modify: server/src/routes/orders.routes.js:32-276
- Create: server/src/routes/orders.shipping.test.js

**Interfaces:** dùng buildShippingQuote, ghi quote.total vào orders.delivery_fee.

- [ ] **Bước 1: Viết test thất bại**

Mock quote trả 36000 khi nhà hàng có base_delivery_fee = 62000:

~~~js
assert.equal(insertedOrder.delivery_fee, 36000);
assert.notEqual(insertedOrder.delivery_fee, 62000);
~~~

Thêm case address thiếu mã GHN trả 422 và không có câu INSERT INTO orders.

Run: cd server && node --test src/routes/orders.shipping.test.js

Expected: FAIL vì route đang dùng restaurant.base_delivery_fee.

- [ ] **Bước 2: Thay phí cố định bằng quote server**

Thay dòng:

~~~js
const delivery_fee = restaurant.base_delivery_fee;
~~~

bằng gọi buildShippingQuote sau khi có cart/address/restaurant và trước total_amount. Không nhận phí từ req.body; map lỗi theo Task 3.

- [ ] **Bước 3: Kiểm chứng và commit**

Run: cd server && node --test src/routes/orders.shipping.test.js && npm test

Expected: PASS; voucher và VNPay không bị hỏng.

~~~bash
git add server/src/routes/orders.routes.js server/src/routes/orders.shipping.test.js
git commit -m "xác minh phí GHN"
~~~

## Task 5: Thay form địa chỉ bằng dữ liệu GHN

**Files:**

- Create: client/src/lib/ghnLocations.js
- Create: client/src/lib/ghnLocations.test.js
- Modify: client/src/modules/customer/profile/Addresses.jsx:14-220
- Modify: client/src/modules/customer/Checkout.jsx:43-205

**Interfaces:**

~~~js
loadProvinces()
loadDistricts(provinceId)
loadWards(districtId)
~~~

- [ ] **Bước 1: Viết test helper thất bại**

~~~js
assert.deepEqual(resetAfterProvinceChange(), {
  districtId: '', districtName: '', wardCode: '', wardName: '',
});
assert.deepEqual(toLocationOption({ DistrictID: 1455, DistrictName: 'Tân Bình' }), {
  id: 1455, code: '', name: 'Tân Bình',
});
~~~

Run: cd client && node --test src/lib/ghnLocations.test.js

Expected: FAIL vì helper chưa tồn tại.

- [ ] **Bước 2: Tạo helper NomNom API**

~~~js
export const loadProvinces = () => apiGet('/api/v1/shipping/ghn/provinces');
export const loadDistricts = (id) => apiGet('/api/v1/shipping/ghn/districts?provinceId=' + encodeURIComponent(id));
export const loadWards = (id) => apiGet('/api/v1/shipping/ghn/wards?districtId=' + encodeURIComponent(id));
~~~

- [ ] **Bước 3: Sửa hai form địa chỉ**

Xóa call provinces.open-api.vn. Thêm select Tỉnh/Thành → Quận/Huyện → Phường/Xã ở Addresses.jsx và nhánh tạo địa chỉ nhanh của Checkout.jsx. Đổi tỉnh phải reset quận/phường; đổi quận phải reset phường. Submit đủ tên và mã GHN. Khi edit địa chỉ cũ thiếu mã, yêu cầu chọn lại, không đoán theo tên.

- [ ] **Bước 4: Kiểm chứng và commit**

Run: cd client && node --test src/lib/ghnLocations.test.js

Expected: PASS; không còn chuỗi provinces.open-api.vn trong hai file.

~~~bash
git add client/src/lib/ghnLocations.js client/src/lib/ghnLocations.test.js client/src/modules/customer/profile/Addresses.jsx client/src/modules/customer/Checkout.jsx
git commit -m "dùng địa bàn GHN"
~~~

## Task 6: Auto quote ở checkout và kiểm chứng cuối

**Files:**

- Create: client/src/lib/shippingQuoteUi.js
- Create: client/src/lib/shippingQuoteUi.test.js
- Modify: client/src/modules/customer/Checkout.jsx:69-225
- Modify: README.md
- Modify: server/README.md

- [ ] **Bước 1: Viết test reducer quote**

~~~js
assert.deepEqual(reduceQuote({ status: 'ready', quote: { total: 36000 } }, { type: 'START' }), {
  status: 'loading', quote: null, error: '',
});
assert.equal(reduceQuote({ status: 'loading' }, { type: 'FAIL', error: 'Không hỗ trợ tuyến giao.' }).status, 'error');
~~~

Run: cd client && node --test src/lib/shippingQuoteUi.test.js

Expected: FAIL vì reducer chưa tồn tại.

- [ ] **Bước 2: Cài effect và UI quote**

Khi addressId đổi, gọi:

~~~js
apiPost('/api/v1/shipping/ghn/quote', { addressId })
~~~

Dùng AbortController hoặc biến cancelled để response cũ không ghi đè state mới. loading: “Đang tính phí giao hàng…”. error: hiện message và disable nút đặt hàng. ready: dùng quote.total để tính tổng UI. Không gửi deliveryFee khi tạo order.

- [ ] **Bước 3: Cập nhật tài liệu và smoke test**

Ghi GHN_TOKEN, GHN_SHOP_ID, GHN_API_BASE_URL với giá trị rỗng vào tài liệu cấu hình, nêu rõ test/production phải cùng môi trường. Chạy tuần tự province → district → ward → quote bằng một address hợp lệ và tạo một COD test. Xác nhận orders.delivery_fee khớp quote server.

- [ ] **Bước 4: Quality gate và commit**

Run:

~~~bash
cd server && npm test
cd ../client && npm test && npm run lint && npm run build
~~~

Expected: PASS; DevTools không có Token hoặc request browser trực tiếp đến GHN.

~~~bash
git add client/src/lib/shippingQuoteUi.js client/src/lib/shippingQuoteUi.test.js client/src/modules/customer/Checkout.jsx README.md server/README.md
git commit -m "tính phí GHN ở checkout"
~~~

## Tự rà soát kế hoạch

- Migration/address: Task 1, 5.
- GHN master data, service và fee: Task 2, 3.
- Phí server đáng tin cậy khi tạo order: Task 4.
- Tự báo phí, loading/error UI: Task 6.
- Không có token trong code/plan, không có fallback phí cố định, không có scope tạo vận đơn.
