// "나의 지도"(발자국) SVG 위에 지역을 어디에 찍을지 — 데모(ttubeogi.jsx)의 REGIONS 좌표값 그대로 재사용.
// Plan.region(자유 텍스트)에 아래 키워드가 포함되면 그 지역으로 집계한다. 안 걸리면 "해외/기타"로 분류.
export const KOREA_REGIONS = [
  { id: "seoul", name: "서울", x: 42, y: 26, keywords: ["서울"] },
  { id: "incheon", name: "인천", x: 33, y: 28, keywords: ["인천"] },
  { id: "gangwon", name: "강릉", x: 66, y: 24, keywords: ["강릉", "속초", "강원"] },
  { id: "daejeon", name: "대전", x: 45, y: 45, keywords: ["대전"] },
  { id: "jeonju", name: "전주", x: 37, y: 56, keywords: ["전주", "전북", "전라"] },
  { id: "daegu", name: "대구", x: 60, y: 52, keywords: ["대구"] },
  { id: "busan", name: "부산", x: 64, y: 66, keywords: ["부산"] },
  { id: "yeosu", name: "여수", x: 45, y: 68, keywords: ["여수"] },
  { id: "jeju", name: "제주", x: 34, y: 90, keywords: ["제주"] },
];

// region 텍스트로 국내 지역 하나를 찾는다. 못 찾으면 null(해외/기타로 취급).
export function matchKoreaRegion(regionText) {
  if (!regionText) return null;
  return KOREA_REGIONS.find((r) => r.keywords.some((k) => regionText.includes(k))) || null;
}
