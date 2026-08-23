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
    // 좌표만 검색어로 넘기면 검색창에 "37.4979,127.0276" 같은 원문 숫자가 그대로 뜨고 이름이
    // 안 보인다(직접 확인함) — 이름을 검색어로 쓰고 c= 파라미터로 지도만 그 좌표에 정확히
    // 맞춰주면, 검색창엔 이름이 뜨면서도 같은 이름의 다른 지점과 안 헷갈리게 정밀하게 위치가 잡힌다.
    const name = item.name || label;
    return `https://map.naver.com/p/search/${encodeURIComponent(name)}?c=${item.lng},${item.lat},15,0,0,0,dh`;
  }
  return `https://map.naver.com/p/search/${encodeURIComponent(label)}`;
}
