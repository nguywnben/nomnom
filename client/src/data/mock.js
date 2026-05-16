// ---------------------------------------------------------------------------
// NomNom mock dataset.
// ---------------------------------------------------------------------------
// Images come from two sources:
//   • Food photography + restaurant hero banners → Unsplash photo IDs that
//     have been stable since 2018+. We append ?w=…&q=80 sizing params.
//   • Avatars + restaurant logos → DiceBear (deterministic SVG, no auth).
// Both have generous CORS + no API key required for hot-link.
// ---------------------------------------------------------------------------

const unsplash = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const avatar = (seed, style = 'avataaars') =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&radius=50`;

const logo = (seed, style = 'shapes') =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=171717&shape1Color=ffffff&shape2Color=cfe7ff&shape3Color=a8c8e8`;

// ---------------------------------------------------------------------------
// Categories carousel
// ---------------------------------------------------------------------------
export const categories = [
  { id: 'pizza', cuisineSlug: 'italian', name: 'Pizza', emoji: '\uD83C\uDF55', image: unsplash('photo-1565299624946-b28f40a0ae38', 400) },
  { id: 'burgers', cuisineSlug: 'american', name: 'Hamburger', emoji: '\uD83C\uDF54', image: unsplash('photo-1568901346375-23c9450c58cd', 400) },
  { id: 'sushi', cuisineSlug: 'japanese', name: 'Sushi', emoji: '\uD83C\uDF63', image: unsplash('photo-1579871494447-9811cf80d66c', 400) },
  { id: 'bowls', cuisineSlug: 'healthy', name: 'Tô trộn', emoji: '\uD83E\uDD63', image: unsplash('photo-1546069901-ba9599a7e63c', 400) },
  { id: 'noodles', cuisineSlug: 'japanese', name: 'Mì & Phở', emoji: '\uD83C\uDF5C', image: unsplash('photo-1569718212165-3a8278d5f624', 400) },
  { id: 'tacos', cuisineSlug: 'mexican', name: 'Tacos', emoji: '\uD83C\uDF2E', image: unsplash('photo-1565299585323-38d6b0865b47', 400) },
  { id: 'drinks', cuisineSlug: 'coffee', name: 'Đồ uống', emoji: '\uD83E\uDDCB', image: unsplash('photo-1509042239860-f550ce710b93', 400) },
  { id: 'desserts', cuisineSlug: 'bakery', name: 'Tráng miệng', emoji: '\uD83C\uDF69', image: unsplash('photo-1551024601-bec78aea704b', 400) },
];

// Mirrors `cuisines` seed in database.sql (name + slug).
export const cuisines = [
  { name: 'Ý', slug: 'italian', sortOrder: 1 },
  { name: 'Mỹ', slug: 'american', sortOrder: 2 },
  { name: 'Nhật', slug: 'japanese', sortOrder: 3 },
  { name: 'Lành mạnh', slug: 'healthy', sortOrder: 4 },
  { name: 'Mexico', slug: 'mexican', sortOrder: 5 },
  { name: 'Cà phê', slug: 'coffee', sortOrder: 6 },
  { name: 'Tiệm bánh', slug: 'bakery', sortOrder: 7 },
];

// ---------------------------------------------------------------------------
// Restaurants + menus
// ---------------------------------------------------------------------------
export const restaurants = [
  {
    id: 'r-1',
    name: 'Cinque Pizzeria',
    tagline: 'Pizza nướng lò củi kiểu Neapolitan từ năm 2017.',
    cuisine: 'Ý',
    tags: ['Pizza', 'Món chay'],
    rating: 4.8,
    reviewCount: 1240,
    eta: '20–30 phút',
    distanceKm: 1.2,
    priceLevel: 2,
    fee: 62000,
    banner: unsplash('photo-1513104890138-7c749659a591', 1400),
    logo: logo('Cinque'),
    open: true,
    address: '12 Linden Ave, Brooklyn',
    menu: [
      {
        id: 'r-1-i-1',
        name: 'Margherita',
        desc: 'Cà chua San Marzano, phô mai tươi, húng quế.',
        price: 338000,
        image: unsplash('photo-1574071318508-1cdbab80d002', 800),
        category: 'Cổ điển',
        inStock: true,
        tags: ['Món chay'],
      },
      {
        id: 'r-1-i-2',
        name: 'Funghi',
        desc: 'Nấm Crimini, phô mai taleggio, cỏ xạ hương, dầu truffle.',
        price: 400000,
        image: unsplash('photo-1593504049359-74330189a345', 800),
        category: 'Cổ điển',
        inStock: true,
        tags: ['Món chay'],
      },
      {
        id: 'r-1-i-3',
        name: 'Salsiccia',
        desc: 'Xúc xích thì là, phô mai mozzarella xông khói, ớt.',
        price: 438000,
        image: unsplash('photo-1571997478779-2adcbbe9ab2f', 800),
        category: 'Đặc sản',
        inStock: true,
        tags: ['Cay'],
      },
      {
        id: 'r-1-i-4',
        name: 'Burrata Salad',
        desc: 'Cà chua gia truyền, dầu húng quế, muối biển.',
        price: 300000,
        image: unsplash('photo-1551248429-40975aa4de74', 800),
        category: 'Món phụ',
        inStock: true,
        tags: ['Món chay'],
      },
      {
        id: 'r-1-i-5',
        name: 'Tiramisu',
        desc: 'Phô mai Mascarpone, espresso, ca cao.',
        price: 188000,
        image: unsplash('photo-1571877227200-a0d98ea607e9', 800),
        category: 'Tráng miệng',
        inStock: false,
        tags: [],
      },
    ],
  },
  {
    id: 'r-2',
    name: 'Junebug Burgers',
    tagline: 'Thịt bò đập dập trên bánh mì khoai tây.',
    cuisine: 'Mỹ',
    tags: ['Hamburger', 'Ăn đêm'],
    rating: 4.7,
    reviewCount: 982,
    eta: '15–25 phút',
    distanceKm: 0.8,
    priceLevel: 2,
    fee: 50000,
    banner: unsplash('photo-1551782450-a2132b4ba21d', 1400),
    logo: logo('Junebug'),
    open: true,
    address: '88 Holloway St, Brooklyn',
    menu: [
      {
        id: 'r-2-i-1',
        name: 'Cổ điển',
        desc: 'Thịt bò đập dập gấp đôi, phô mai Mỹ, sốt bí mật.',
        price: 288000,
        image: unsplash('photo-1568901346375-23c9450c58cd', 800),
        category: 'Hamburger',
        inStock: true,
        tags: [],
      },
      {
        id: 'r-2-i-2',
        name: 'Cheddar Bacon',
        desc: 'Phô mai Cheddar ủ, thịt xông khói ngào đường, dưa chuột muối.',
        price: 325000,
        image: unsplash('photo-1572802419224-296b0aeee0d9', 800),
        category: 'Hamburger',
        inStock: true,
        tags: [],
      },
      {
        id: 'r-2-i-3',
        name: 'Gà giòn',
        desc: 'Gà chiên sữa bơ, salad bắp cải, mật ong cay.',
        price: 313000,
        image: unsplash('photo-1606755962773-d324e0a13086', 800),
        category: 'Bánh mì kẹp',
        inStock: true,
        tags: ['Cay'],
      },
      {
        id: 'r-2-i-4',
        name: 'Khoai tây chiên',
        desc: 'Cắt tay, muối biển, thảo mộc.',
        price: 113000,
        image: unsplash('photo-1573080496219-bb080dd4f877', 800),
        category: 'Món phụ',
        inStock: true,
        tags: ['Món chay'],
      },
      {
        id: 'r-2-i-5',
        name: 'Vanilla Shake',
        desc: 'Vani Madagascar, kem tươi.',
        price: 138000,
        image: unsplash('photo-1572490122747-3968b75cc699', 800),
        category: 'Đồ uống',
        inStock: true,
        tags: [],
      },
    ],
  },
  {
    id: 'r-3',
    name: 'Kaiseki & Co.',
    tagline: 'Omakase, phong cách edomae.',
    cuisine: 'Nhật',
    tags: ['Sushi', 'Ẩm thực cao cấp'],
    rating: 4.9,
    reviewCount: 654,
    eta: '30–45 phút',
    distanceKm: 2.3,
    priceLevel: 4,
    fee: 100000,
    banner: unsplash('photo-1579871494447-9811cf80d66c', 1400),
    logo: logo('Kaiseki'),
    open: true,
    address: '4 Sakura Ln, Manhattan',
    menu: [
      {
        id: 'r-3-i-1',
        name: 'Set Nigiri (8 miếng)',
        desc: 'Cá ngừ, cá hồi, cá đuôi vàng, tôm.',
        price: 650000,
        image: unsplash('photo-1579871494447-9811cf80d66c', 800),
        category: 'Nigiri',
        inStock: true,
        tags: [],
      },
      {
        id: 'r-3-i-2',
        name: 'Cơm bát cá hồi',
        desc: 'Cơm sushi, cá hồi, bơ, đậu nành Nhật.',
        price: 450000,
        image: unsplash('photo-1467003909585-2f8a72700288', 800),
        category: 'Tô trộn',
        inStock: true,
        tags: [],
      },
      {
        id: 'r-3-i-3',
        name: 'Spicy Tuna Roll',
        desc: 'Cá ngừ vây vàng, dầu ớt, hành lá.',
        price: 350000,
        image: unsplash('photo-1617196034796-73dfa7b1fd56', 800),
        category: 'Cuộn',
        inStock: true,
        tags: ['Cay'],
      },
      {
        id: 'r-3-i-4',
        name: 'Súp Miso',
        desc: 'Miso trắng, đậu phụ, hành lá.',
        price: 113000,
        image: unsplash('photo-1607301405390-d831c242f59b', 800),
        category: 'Món phụ',
        inStock: true,
        tags: [],
      },
    ],
  },
  {
    id: 'r-4',
    name: 'Verdant Bowls',
    tagline: 'Tô ngũ cốc theo mùa.',
    cuisine: 'Lành mạnh',
    tags: ['Tô trộn', 'Thuần chay'],
    rating: 4.6,
    reviewCount: 432,
    eta: '15–20 phút',
    distanceKm: 1.7,
    priceLevel: 2,
    fee: 50000,
    banner: unsplash('photo-1546069901-ba9599a7e63c', 1400),
    logo: logo('Verdant'),
    open: true,
    address: '15 Greenpoint Ave',
    menu: [
      {
        id: 'r-4-i-1',
        name: 'Tô mùa vụ',
        desc: 'Diêm mạch, cải xoăn, bí đỏ, sốt mè.',
        price: 325000,
        image: unsplash('photo-1512621776951-a57141f2eefd', 800),
        category: 'Tô trộn',
        inStock: true,
        tags: ['Thuần chay'],
      },
      {
        id: 'r-4-i-2',
        name: 'Buddha Bowl',
        desc: 'Cơm lứt, đậu phụ, đậu nành Nhật, gừng.',
        price: 313000,
        image: unsplash('photo-1546069901-ba9599a7e63c', 800),
        category: 'Tô trộn',
        inStock: true,
        tags: ['Thuần chay'],
      },
      {
        id: 'r-4-i-3',
        name: 'Sinh tố xanh',
        desc: 'Cải xoăn, chuối, hạnh nhân, hạt gai dầu.',
        price: 163000,
        image: unsplash('photo-1610970881699-44a5587cabec', 800),
        category: 'Đồ uống',
        inStock: true,
        tags: ['Thuần chay'],
      },
    ],
  },
  {
    id: 'r-5',
    name: 'Hachi Ramen',
    tagline: 'Nước dùng xương heo ninh trong 14 giờ.',
    cuisine: 'Nhật',
    tags: ['Mì', 'Ấm cúng'],
    rating: 4.7,
    reviewCount: 1102,
    eta: '20–30 phút',
    distanceKm: 2.0,
    priceLevel: 2,
    fee: 62000,
    banner: unsplash('photo-1569718212165-3a8278d5f624', 1400),
    logo: logo('Hachi'),
    open: true,
    address: '101 Mott St',
    menu: [
      {
        id: 'r-5-i-1',
        name: 'Tonkotsu Ramen',
        desc: 'Nước dùng xương heo, xá xíu, trứng ngâm tương.',
        price: 400000,
        image: unsplash('photo-1569718212165-3a8278d5f624', 800),
        category: 'Ramen',
        inStock: true,
        tags: [],
      },
      {
        id: 'r-5-i-2',
        name: 'Miso Ramen',
        desc: 'Miso đỏ, thịt heo xay, ngô.',
        price: 388000,
        image: unsplash('photo-1591814468924-caf88d1232e1', 800),
        category: 'Ramen',
        inStock: true,
        tags: [],
      },
      {
        id: 'r-5-i-3',
        name: 'Gyoza (6 miếng)',
        desc: 'Sủi cảo heo, sốt ponzu.',
        price: 188000,
        image: unsplash('photo-1496116218417-1a781b1c416c', 800),
        category: 'Món phụ',
        inStock: true,
        tags: [],
      },
    ],
  },
  {
    id: 'r-6',
    name: 'La Carreta',
    tagline: 'Tacos al pastor, phục vụ cả ngày.',
    cuisine: 'Mexico',
    tags: ['Tacos', 'Cay'],
    rating: 4.5,
    reviewCount: 765,
    eta: '15–25 phút',
    distanceKm: 1.1,
    priceLevel: 1,
    fee: 37000,
    banner: unsplash('photo-1565299585323-38d6b0865b47', 1400),
    logo: logo('LaCarreta'),
    open: true,
    address: '209 Avenue B',
    menu: [
      {
        id: 'r-6-i-1',
        name: 'Tacos al Pastor (3 chiếc)',
        desc: 'Dứa, ngò rí, hành tây.',
        price: 275000,
        image: unsplash('photo-1565299585323-38d6b0865b47', 800),
        category: 'Tacos',
        inStock: true,
        tags: ['Cay'],
      },
      {
        id: 'r-6-i-2',
        name: 'Burrito Carnitas',
        desc: 'Thịt heo ninh nhừ, cơm, đậu, sốt salsa xanh.',
        price: 313000,
        image: unsplash('photo-1551504734-5ee1c4a1479b', 800),
        category: 'Burritos',
        inStock: true,
        tags: [],
      },
      {
        id: 'r-6-i-3',
        name: 'Elote',
        desc: 'Ngô nướng cháy cạnh, chanh, phô mai cotija.',
        price: 125000,
        image: unsplash('photo-1601050690597-df0568f70950', 800),
        category: 'Món phụ',
        inStock: true,
        tags: [],
      },
      {
        id: 'r-6-i-4',
        name: 'Horchata',
        desc: 'Sữa gạo, quế, vani.',
        price: 100000,
        image: unsplash('photo-1541658016709-82535e94bc69', 800),
        category: 'Đồ uống',
        inStock: true,
        tags: [],
      },
    ],
  },
  {
    id: 'r-7',
    name: 'Buena Onda Cafe',
    tagline: 'Cà phê, bánh ngọt, buổi sáng thư thái.',
    cuisine: 'Cà phê',
    tags: ['Đồ uống', 'Bữa sáng'],
    rating: 4.8,
    reviewCount: 510,
    eta: '10–20 phút',
    distanceKm: 0.6,
    priceLevel: 2,
    fee: 37000,
    banner: unsplash('photo-1509042239860-f550ce710b93', 1400),
    logo: logo('Buena'),
    open: true,
    address: '24 Bedford Ave',
    menu: [
      {
        id: 'r-7-i-1',
        name: 'Flat White',
        desc: 'Cà phê espresso kép, bọt sữa mịn.',
        price: 120000,
        image: unsplash('photo-1509042239860-f550ce710b93', 800),
        category: 'Cà phê',
        inStock: true,
        tags: [],
      },
      {
        id: 'r-7-i-2',
        name: 'Bánh sừng bò hạnh nhân',
        desc: 'Kem frangipane, hạnh nhân nướng.',
        price: 113000,
        image: unsplash('photo-1555507036-ab1f4038808a', 800),
        category: 'Bánh ngọt',
        inStock: true,
        tags: ['Món chay'],
      },
      {
        id: 'r-7-i-3',
        name: 'Bánh mì bơ',
        desc: 'Bánh mì men tự nhiên, ớt, chanh, muối biển.',
        price: 238000,
        image: unsplash('photo-1603046891744-1f76eb10aec3', 800),
        category: 'Brunch',
        inStock: true,
        tags: ['Món chay'],
      },
    ],
  },
  {
    id: 'r-8',
    name: 'Dough & Donut',
    tagline: 'Bánh donut men phủ đường.',
    cuisine: 'Tiệm bánh',
    tags: ['Tráng miệng'],
    rating: 4.6,
    reviewCount: 322,
    eta: '15–25 phút',
    distanceKm: 1.5,
    priceLevel: 1,
    fee: 37000,
    banner: unsplash('photo-1551024601-bec78aea704b', 1400),
    logo: logo('Dough'),
    open: false, // out-of-hours edge case
    address: '6 Smith St',
    menu: [
      {
        id: 'r-8-i-1',
        name: 'Donut phủ đường cổ điển',
        desc: 'Lớp phủ vani, bánh donut men.',
        price: 75000,
        image: unsplash('photo-1551024601-bec78aea704b', 800),
        category: 'Donuts',
        inStock: true,
        tags: ['Món chay'],
      },
      {
        id: 'r-8-i-2',
        name: 'Maple Bacon',
        desc: 'Lớp phủ phong, thịt xông khói ngào đường.',
        price: 113000,
        image: unsplash('photo-1527515637462-cff94eecc1ac', 800),
        category: 'Donuts',
        inStock: true,
        tags: [],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const currentCustomer = {
  id: 'cust-1',
  name: 'Mara Chen',
  email: 'mara@example.com',
  phone: '+1 (555) 010-4823',
  avatar: avatar('Mara Chen'),
  address: '120 Wythe Ave, Apt 3B, Brooklyn, NY 11211',
};

export const currentMerchant = {
  id: 'merch-1',
  name: 'Cinque Pizzeria',
  email: 'owner@cinque.example',
  avatar: logo('Cinque'),
  restaurantId: 'r-1',
};

export const currentDriver = {
  id: 'drv-1',
  name: 'Owen Reyes',
  email: 'owen.r@example.com',
  phone: '+1 (555) 020-7711',
  avatar: avatar('Owen Reyes'),
  vehicle: 'Honda CB300R',
  rating: 4.92,
  trips: 1840,
};

export const currentAdmin = {
  id: 'adm-1',
  name: 'Avery Park',
  email: 'avery@nomnom.example',
  avatar: avatar('Avery Park'),
  role: 'Quản trị viên hệ thống',
};

// ---------------------------------------------------------------------------
// Customer order history
// ---------------------------------------------------------------------------
export const initialOrders = [
  {
    id: 'ord-A1B2C',
    restaurantId: 'r-5',
    items: [
      { id: 'r-5-i-1', name: 'Tonkotsu Ramen', price: 400000, quantity: 1 },
      { id: 'r-5-i-3', name: 'Gyoza (6 miếng)', price: 188000, quantity: 1 },
    ],
    subtotal: 588000,
    deliveryFee: 62000,
    discount: 0,
    total: 650000,
    payment: 'card',
    status: 'delivering',
    placedAt: Date.now() - 1000 * 60 * 12,
    driverId: 'drv-1',
    eta: 8,
  },
  {
    id: 'ord-Q3K9P',
    restaurantId: 'r-2',
    items: [
      { id: 'r-2-i-1', name: 'Cổ điển', price: 288000, quantity: 2 },
      { id: 'r-2-i-4', name: 'Khoai tây chiên', price: 113000, quantity: 1 },
    ],
    subtotal: 689000,
    deliveryFee: 50000,
    discount: 89000,
    total: 650000,
    payment: 'wallet',
    status: 'delivered',
    placedAt: Date.now() - 1000 * 60 * 60 * 26,
    driverId: 'drv-1',
    eta: 0,
  },
];

// ---------------------------------------------------------------------------
// Merchant kanban orders
// ---------------------------------------------------------------------------
export const initialMerchantOrders = {
  new: [
    {
      id: 'ord-7T2RD',
      customerName: 'Mara Chen',
      items: [
        { id: 'r-1-i-1', name: 'Margherita', price: 338000, quantity: 1 },
        { id: 'r-1-i-4', name: 'Burrata Salad', price: 300000, quantity: 1 },
      ],
      total: 638000,
      placedAt: Date.now() - 1000 * 60 * 2,
      note: 'Làm ơn không lấy húng quế',
      isNew: true,
    },
    {
      id: 'ord-K9XR1',
      customerName: 'Owen T.',
      items: [{ id: 'r-1-i-2', name: 'Funghi', price: 400000, quantity: 2 }],
      total: 800000,
      placedAt: Date.now() - 1000 * 60 * 4,
      note: '',
    },
  ],
  preparing: [
    {
      id: 'ord-A41QM',
      customerName: 'Rae P.',
      items: [
        { id: 'r-1-i-3', name: 'Salsiccia', price: 438000, quantity: 1 },
        { id: 'r-1-i-1', name: 'Margherita', price: 338000, quantity: 1 },
      ],
      total: 776000,
      placedAt: Date.now() - 1000 * 60 * 9,
      note: 'Thêm dầu ớt',
    },
  ],
  ready: [
    {
      id: 'ord-V2HHJ',
      customerName: 'Lia D.',
      items: [
        { id: 'r-1-i-1', name: 'Margherita', price: 338000, quantity: 1 },
        { id: 'r-1-i-5', name: 'Tiramisu', price: 188000, quantity: 1 },
      ],
      total: 526000,
      placedAt: Date.now() - 1000 * 60 * 16,
      note: '',
    },
  ],
  completed: [
    {
      id: 'ord-P9X22',
      customerName: 'Sam K.',
      items: [{ id: 'r-1-i-2', name: 'Funghi', price: 400000, quantity: 1 }],
      total: 400000,
      placedAt: Date.now() - 1000 * 60 * 60,
      note: '',
    },
    {
      id: 'ord-J11HQ',
      customerName: 'Kai V.',
      items: [{ id: 'r-1-i-1', name: 'Margherita', price: 338000, quantity: 3 }],
      total: 1014000,
      placedAt: Date.now() - 1000 * 60 * 90,
      note: 'Không gluten — đế không gluten',
    },
  ],
};

// ---------------------------------------------------------------------------
// Driver — available jobs
// ---------------------------------------------------------------------------
export const initialDriverJobs = [
  {
    id: 'job-1',
    restaurantId: 'r-1',
    restaurantName: 'Cinque Pizzeria',
    restaurantAvatar: logo('Cinque'),
    customerName: 'Mara C.',
    pickupAddress: '12 Linden Ave',
    dropoffAddress: '120 Wythe Ave',
    distanceKm: 2.1,
    earnings: 47000,
    estMin: 18,
    items: 3,
  },
  {
    id: 'job-2',
    restaurantId: 'r-2',
    restaurantName: 'Junebug Burgers',
    restaurantAvatar: logo('Junebug'),
    customerName: 'Daniel L.',
    pickupAddress: '88 Holloway St',
    dropoffAddress: '301 Carroll St',
    distanceKm: 1.4,
    earnings: 38500,
    estMin: 14,
    items: 2,
  },
  {
    id: 'job-3',
    restaurantId: 'r-5',
    restaurantName: 'Hachi Ramen',
    restaurantAvatar: logo('Hachi'),
    customerName: 'Jamie P.',
    pickupAddress: '101 Mott St',
    dropoffAddress: '14 W 10th St',
    distanceKm: 3.4,
    earnings: 67500,
    estMin: 26,
    items: 4,
  },
  {
    id: 'job-4',
    restaurantId: 'r-6',
    restaurantName: 'La Carreta',
    restaurantAvatar: logo('LaCarreta'),
    customerName: 'Sky R.',
    pickupAddress: '209 Avenue B',
    dropoffAddress: '88 W 4th St',
    distanceKm: 2.7,
    earnings: 51000,
    estMin: 20,
    items: 5,
  },
];

// ---------------------------------------------------------------------------
// Admin accounts + payouts
// ---------------------------------------------------------------------------
export const initialAdminAccounts = [
  { id: 'a-1', type: 'merchant', name: 'Cinque Pizzeria', owner: 'Marco Bello', email: 'owner@cinque.example', status: 'active', joined: '2024-04-12', avatar: logo('Cinque') },
  { id: 'a-2', type: 'merchant', name: 'Junebug Burgers', owner: 'Reese Anya', email: 'r@junebug.example', status: 'active', joined: '2024-06-02', avatar: logo('Junebug') },
  { id: 'a-3', type: 'merchant', name: 'Kaiseki & Co.', owner: 'Sora Iida', email: 'sora@kaiseki.example', status: 'active', joined: '2024-08-11', avatar: logo('Kaiseki') },
  { id: 'a-4', type: 'merchant', name: 'Verdant Bowls', owner: 'Naomi K.', email: 'naomi@verdant.example', status: 'pending', joined: '2025-04-19', avatar: logo('Verdant') },
  { id: 'a-5', type: 'merchant', name: 'Hachi Ramen', owner: 'Ren O.', email: 'ren@hachi.example', status: 'active', joined: '2024-02-08', avatar: logo('Hachi') },
  { id: 'a-6', type: 'merchant', name: 'La Carreta', owner: 'Lupe M.', email: 'lupe@carreta.example', status: 'suspended', joined: '2023-12-21', avatar: logo('LaCarreta') },

  { id: 'a-7', type: 'driver', name: 'Owen Reyes', owner: '', email: 'owen.r@example.com', status: 'active', joined: '2024-01-04', avatar: avatar('Owen Reyes') },
  { id: 'a-8', type: 'driver', name: 'Iris Mendez', owner: '', email: 'iris.m@example.com', status: 'active', joined: '2024-03-18', avatar: avatar('Iris Mendez') },
  { id: 'a-9', type: 'driver', name: 'Felix Tao', owner: '', email: 'felix.t@example.com', status: 'pending', joined: '2025-05-01', avatar: avatar('Felix Tao') },
  { id: 'a-10', type: 'driver', name: 'Sasha Park', owner: '', email: 'sasha.p@example.com', status: 'active', joined: '2024-09-22', avatar: avatar('Sasha Park') },
];

export const initialPayouts = [
  { id: 'p-1', accountId: 'a-7', name: 'Owen Reyes', type: 'driver', amount: 10313000, requestedAt: '2026-05-13', status: 'pending' },
  { id: 'p-2', accountId: 'a-2', name: 'Junebug Burgers', type: 'merchant', amount: 54710000, requestedAt: '2026-05-12', status: 'pending' },
  { id: 'p-3', accountId: 'a-8', name: 'Iris Mendez', type: 'driver', amount: 7705000, requestedAt: '2026-05-11', status: 'approved' },
  { id: 'p-4', accountId: 'a-1', name: 'Cinque Pizzeria', type: 'merchant', amount: 48550000, requestedAt: '2026-05-09', status: 'approved' },
  { id: 'p-5', accountId: 'a-10', name: 'Sasha Park', type: 'driver', amount: 3120000, requestedAt: '2026-05-14', status: 'pending' },
];

// ---------------------------------------------------------------------------
// Promo codes
// ---------------------------------------------------------------------------
export const promoCodes = [
  { code: 'NOMNOM15', label: 'Giảm 15% cho đơn hàng, tối đa 250.000 ₫.', kind: 'percent', amount: 15, cap: 250000 },
  { code: 'WELCOME5', label: 'Giảm 125.000 ₫ cho mọi đơn hàng.', kind: 'flat', amount: 125000 },
  { code: 'FREEFEE', label: 'Miễn phí giao hàng.', kind: 'flat', amount: 62000 },
];

// ---------------------------------------------------------------------------
// Chats
// ---------------------------------------------------------------------------
export const initialChats = [
  {
    id: 'chat-driver',
    title: 'Owen R. — Tài xế',
    subtitle: 'Đơn hàng #ord-A1B2C',
    participants: [
      { id: 'me', name: 'Bạn', role: 'customer', avatar: avatar('Mara Chen') },
      { id: 'drv-1', name: 'Owen R.', role: 'driver', avatar: avatar('Owen Reyes') },
    ],
    channel: 'customer-driver',
    messages: [
      { id: 'm1', senderId: 'drv-1', text: 'Đã lấy đơn hàng của bạn, tôi đang giao đến đây.', at: Date.now() - 1000 * 60 * 6 },
      { id: 'm2', senderId: 'me', text: 'Cảm ơn! Căn hộ 3B, vui lòng bấm chuông hai lần nhé.', at: Date.now() - 1000 * 60 * 5 },
      { id: 'm3', senderId: 'drv-1', text: "Đã rõ. Dự kiến 7 phút nữa tới.", at: Date.now() - 1000 * 60 * 4 },
    ],
  },
  {
    id: 'chat-merchant',
    title: 'Cinque Pizzeria',
    subtitle: 'Đơn hàng #ord-7T2RD',
    participants: [
      { id: 'me', name: 'Bạn', role: 'customer', avatar: avatar('Mara Chen') },
      { id: 'merch-1', name: 'Cinque', role: 'merchant', avatar: logo('Cinque') },
    ],
    channel: 'customer-merchant',
    messages: [
      { id: 'm1', senderId: 'merch-1', text: "Chào bạn! Thông báo nhanh — chúng tôi đã hết húng quế. Có thể thay bằng rau bina không?", at: Date.now() - 1000 * 60 * 11 },
    ],
  },
  {
    id: 'chat-admin',
    title: 'Hỗ trợ NomNom',
    subtitle: 'Avery Park — Nhân viên hỗ trợ',
    participants: [
      { id: 'me', name: 'Bạn', role: 'customer', avatar: avatar('Mara Chen') },
      { id: 'adm-1', name: 'Avery (Hỗ trợ)', role: 'admin', avatar: avatar('Avery Park') },
    ],
    channel: 'customer-admin',
    messages: [
      { id: 'm1', senderId: 'adm-1', text: "Chào Mara — Avery từ bộ phận hỗ trợ NomNom đây. Tôi có thể giúp gì cho bạn?", at: Date.now() - 1000 * 60 * 60 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Analytics — for merchant dashboard + admin dashboard
// ---------------------------------------------------------------------------
export const merchantDailyRevenue = [
  { day: 'Mon', revenue: 15300000 },
  { day: 'Tue', revenue: 14700000 },
  { day: 'Wed', revenue: 18550000 },
  { day: 'Thu', revenue: 17250000 },
  { day: 'Fri', revenue: 28100000 },
  { day: 'Sat', revenue: 40300000 },
  { day: 'Sun', revenue: 33250000 },
];

export const merchantTopItems = [
  { name: 'Margherita', sold: 184, revenue: 62100000 },
  { name: 'Funghi', sold: 96, revenue: 38400000 },
  { name: 'Salsiccia', sold: 71, revenue: 31050000 },
  { name: 'Burrata Salad', sold: 58, revenue: 17400000 },
];

export const driverDailyEarnings = [
  { day: 'Mon', earnings: 1600000 },
  { day: 'Tue', earnings: 1450000 },
  { day: 'Wed', earnings: 2050000 },
  { day: 'Thu', earnings: 1775000 },
  { day: 'Fri', earnings: 2800000 },
  { day: 'Sat', earnings: 3450000 },
  { day: 'Sun', earnings: 2400000 },
];

export const adminGmvWeekly = [
  { week: 'W1', gmv: 4600000000, orders: 5120 },
  { week: 'W2', gmv: 4950000000, orders: 5402 },
  { week: 'W3', gmv: 5300000000, orders: 5780 },
  { week: 'W4', gmv: 5700000000, orders: 6100 },
  { week: 'W5', gmv: 6275000000, orders: 6520 },
  { week: 'W6', gmv: 6700000000, orders: 6890 },
  { week: 'W7', gmv: 7025000000, orders: 7140 },
  { week: 'W8', gmv: 7425000000, orders: 7480 },
];

export const adminCityMix = [
  { city: 'Brooklyn', share: 38 },
  { city: 'Manhattan', share: 28 },
  { city: 'Queens', share: 18 },
  { city: 'Bronx', share: 9 },
  { city: 'SI', share: 7 },
];

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export const sampleReviews = [
  {
    id: 'rev-1',
    author: 'Jamie P.',
    avatar: avatar('Jamie P.'),
    rating: 5,
    when: '2 ngày trước',
    text: 'Đế bánh được nướng cháy cạnh hoàn hảo. Salsiccia là chiếc pizza ngon nhất tôi từng ăn trong năm nay.',
    likes: 14,
  },
  {
    id: 'rev-2',
    author: 'Daniel L.',
    avatar: avatar('Daniel L.'),
    rating: 4,
    when: '1 tuần trước',
    text: 'Giao hàng hơi chậm một chút nhưng đồ ăn đã bù đắp lại tất cả.',
    likes: 6,
  },
  {
    id: 'rev-3',
    author: 'Sky R.',
    avatar: avatar('Sky R.'),
    rating: 5,
    when: '2 tuần trước',
    text: 'Salad Burrata thật tuyệt vời. Sẽ đặt lại vào tuần tới.',
    likes: 11,
  },
];

export const helpers = { unsplash, avatar, logo };
