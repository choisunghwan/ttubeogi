// 항목의 좌표/검색어로 카카오맵·네이버 지도 길찾기 링크를 만든다.
// 좌표(geocoding으로 찾은 lat/lng)가 있으면 그 좌표로, 없으면 검색어/이름으로 지도 앱 검색을 연다.
export function kakaoMapUrl(item) {
  const label = (item.query || item.name || "").trim();
  if (item.lat != null && item.lng != null) {
    return `https://map.kakao.com/link/to/${encodeURIComponent(item.name || label)},${item.lat},${item.lng}`;
  }
  return `https://map.kakao.com/link/search/${encodeURIComponent(label)}`;
}

export function naverMapUrl(item) {
  const label = (item.query || item.name || "").trim();
  if (item.lat != null && item.lng != null) {
    return `https://map.naver.com/p/search/${item.lat},${item.lng}`;
  }
  return `https://map.naver.com/p/search/${encodeURIComponent(label)}`;
}
