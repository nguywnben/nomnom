export const HOME_SECTIONS = [
  ['cuisines', 'Loại hình ẩm thực'],
  ['featured-dishes', 'Món nổi bật từ nhiều quán'],
  ['nearby-dishes', 'Các món gần bạn'],
  ['promos', 'Banner chiến dịch'],
  ['trending', 'Thịnh hành'],
  ['order-again', 'Đặt lại món'],
  ['featured-restaurants', 'Quán ăn nổi bật'],
  ['moods', 'Theo tâm trạng'],
  ['partner', 'Hợp tác với NomNom'],
];

export const DEFAULT_HOME_PAGE_CONFIG = {
  hero: {
    title: 'Đói bụng? Đặt món ngay.',
    subtitle: 'Khám phá món ngon giao siêu tốc từ các quán ăn hàng đầu quanh bạn.',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1800&q=80',
  },
  sections: HOME_SECTIONS.map(([id, label], index) => ({ id, label, isVisible: true, sortOrder: index + 1 })),
  moods: [
    { id: 'comfort', label: 'Món ăn quen thuộc', subtitle: 'Burger, mì Ý, mì ramen', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', linkUrl: '/app/search?cuisine=american', isVisible: true, sortOrder: 1 },
    { id: 'healthy', label: 'Món ăn tốt cho sức khỏe', subtitle: 'Rau xanh, ngũ cốc, protein', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', linkUrl: '/app/search?cuisine=healthy', isVisible: true, sortOrder: 2 },
    { id: 'sweet', label: 'Món ngọt', subtitle: 'Bánh ngọt, bánh donut, kem', imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', linkUrl: '/app/search?cuisine=bakery', isVisible: true, sortOrder: 3 },
    { id: 'fast', label: 'Ăn nhẹ', subtitle: 'Sẵn sàng dưới 25 phút', imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80', linkUrl: '/app/search?cuisine=mexican', isVisible: true, sortOrder: 4 },
  ],
};

export function normalizeHomePageConfig(input) {
  const hero = input?.hero ?? {};
  const title = String(hero.title ?? '').trim();
  const subtitle = String(hero.subtitle ?? '').trim();
  const imageUrl = String(hero.imageUrl ?? '').trim();
  if (!title || title.length > 160 || !subtitle || subtitle.length > 255 || !/^https?:\/\//.test(imageUrl) || imageUrl.length > 500) return null;
  const received = Array.isArray(input?.sections) ? input.sections : [];
  if (received.length !== HOME_SECTIONS.length) return null;
  const expected = new Set(HOME_SECTIONS.map(([id]) => id));
  const ids = received.map((section) => section?.id);
  if (ids.some((id) => !expected.has(id)) || new Set(ids).size !== expected.size) return null;
  const rawMoods = Array.isArray(input?.moods) ? input.moods : DEFAULT_HOME_PAGE_CONFIG.moods;
  if (rawMoods.length < 1 || rawMoods.length > 8) return null;
  const moods = rawMoods.map((mood, index) => {
    const id = String(mood?.id ?? '').trim();
    const label = String(mood?.label ?? '').trim();
    const subtitle = String(mood?.subtitle ?? '').trim();
    const imageUrl = String(mood?.imageUrl ?? '').trim();
    const linkUrl = String(mood?.linkUrl ?? '').trim();
    if (!/^[a-z0-9-]{2,40}$/.test(id) || !label || label.length > 80 || subtitle.length > 140 || !/^https?:\/\//.test(imageUrl) || imageUrl.length > 500 || !linkUrl.startsWith('/') || linkUrl.length > 300) return null;
    return { id, label, subtitle, imageUrl, linkUrl, isVisible: Boolean(mood?.isVisible), sortOrder: index + 1 };
  });
  if (moods.some((mood) => mood === null) || new Set(moods.map((mood) => mood.id)).size !== moods.length) return null;
  return {
    hero: { title, subtitle, imageUrl },
    sections: received.map((section, index) => ({ id: section.id, label: HOME_SECTIONS.find(([id]) => id === section.id)[1], isVisible: Boolean(section.isVisible), sortOrder: index + 1 })),
    moods,
  };
}

export function parseHomePageConfig(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return normalizeHomePageConfig(parsed) ?? DEFAULT_HOME_PAGE_CONFIG;
  } catch {
    return DEFAULT_HOME_PAGE_CONFIG;
  }
}
