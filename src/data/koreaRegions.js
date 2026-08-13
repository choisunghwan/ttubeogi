// "나의 지도"(발자국) 배경이 이제 실제 대한민국 윤곽(src/data/koreaMapPaths.js)이라, 지역 좌표도
// 그 지도랑 같은 좌표계 위에서 실제 도/시 폴리곤 무게중심으로 계산한 값(공공누리 지도 데이터 기반).
// 강릉·전주·여수는 시군 단위 데이터가 없어서 소속 도(강원/전북/전남) 무게중심으로 근사함.
export const KOREA_REGIONS = [
  { id: "seoul", name: "서울", x: 38.1, y: 23.2, keywords: ["서울"] },
  { id: "incheon", name: "인천", x: 34, y: 23.8, keywords: ["인천"] },
  { id: "gangwon", name: "강릉", x: 55.9, y: 20, keywords: ["강릉", "속초", "강원"] },
  { id: "daejeon", name: "대전", x: 44.1, y: 43.3, keywords: ["대전"] },
  { id: "jeonju", name: "전주", x: 40.1, y: 53.8, keywords: ["전주", "전북", "전라북"] },
  { id: "daegu", name: "대구", x: 58.9, y: 52.8, keywords: ["대구"] },
  { id: "busan", name: "부산", x: 66.7, y: 62.8, keywords: ["부산"] },
  { id: "yeosu", name: "여수", x: 36.3, y: 69.1, keywords: ["여수", "전남", "전라남"] },
  { id: "jeju", name: "제주", x: 31.6, y: 91.1, keywords: ["제주"] },
];

// region 텍스트로 국내 지역 하나를 찾는다. 못 찾으면 null(해외/기타로 취급).
export function matchKoreaRegion(regionText) {
  if (!regionText) return null;
  return KOREA_REGIONS.find((r) => r.keywords.some((k) => regionText.includes(k))) || null;
}
