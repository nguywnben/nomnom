/**
 * Hero badge: ghép đúng `"county, state"` từ Nominatim `address` — không chỉnh sửa, không tiền tố.
 * @param {Record<string, string>|undefined} address
 * @returns {string|null}
 */
export function formatHeroLocalityFromNominatim(address) {
  if (!address) return null;

  const county = (address.county ?? '').trim();
  const state = (address.state ?? '').trim();

  if (county && state) return `${county}, ${state}`;
  if (county) return county;
  if (state) return state;
  return null;
}
