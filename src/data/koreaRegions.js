// "나의 지도"(발자국) 배경이 실제 대한민국 윤곽(src/data/koreaMapPaths.js)이라, 지역 좌표도 그
// 지도랑 같은 좌표계 위에서 실제 도/시 폴리곤 무게중심으로 계산한 값(공공누리 지도 데이터 기반).
// 지도 폴리곤에 있는 15개 본토 시/도 + 제주 전부를 대표 지점 하나씩으로 커버한다 — 예전엔 9개
// 도시만 있어서 그 안에 안 걸리는 지역(예: 울산, 경기, 충청·경상 나머지)은 전부 "해외"로 잘못
// 분류되는 버그가 있었음. keywords는 그 도/특별시 소속 주요 도시 이름까지 넓게 잡아서, region
// 텍스트에 어떤 도시 이름이 들어와도 웬만하면 소속 도의 점으로 매칭되게 함.
//
// name은 "지도에 점이 하나뿐이라 어쩔 수 없이 쓰는 대표 도 이름"일 뿐 — 실제 화면에 찍히는
// 라벨은 aggregateVisits에서 사용자가 실제 입력한 구체적인 도시명(matchedKeyword)을 우선
// 사용한다. genericKeywords에 든 건 "도" 단위의 광역 표현이라 구체적인 도시로 안 침(예: "경북"
// 자체를 입력했으면 도시명을 알 수 없으니 name으로 폴백).
export const KOREA_REGIONS = [
  { id: "seoul", name: "서울", x: 38.1, y: 23.2, keywords: ["서울"], genericKeywords: ["서울"] },
  { id: "incheon", name: "인천", x: 34, y: 23.8, keywords: ["인천"], genericKeywords: ["인천"] },
  {
    id: "gyeonggi", name: "경기", x: 38.5, y: 28, genericKeywords: ["경기"],
    keywords: ["경기", "수원", "성남", "고양", "용인", "부천", "안산", "안양", "남양주", "화성",
               "평택", "의정부", "시흥", "김포", "파주", "광명", "군포", "이천", "오산", "하남",
               "양주", "구리", "안성", "포천", "여주", "동두천", "과천", "의왕"],
  },
  {
    id: "gangwon", name: "강원", x: 55.9, y: 20, genericKeywords: ["강원"],
    keywords: ["강원", "강릉", "속초", "춘천", "원주", "동해", "삼척", "태백", "홍천", "횡성"],
  },
  {
    id: "chungbuk", name: "충북", x: 49.9, y: 38.7, genericKeywords: ["충북", "충청북"],
    keywords: ["충북", "충청북", "청주", "충주", "제천", "진천", "음성", "괴산", "단양", "옥천", "영동"],
  },
  {
    id: "chungnam", name: "충남", x: 34.7, y: 39.8, genericKeywords: ["충남", "충청남"],
    keywords: ["충남", "충청남", "천안", "아산", "공주", "보령", "서산", "논산", "당진", "세종",
               "부여", "서천", "홍성", "예산", "태안"],
  },
  { id: "daejeon", name: "대전", x: 44.1, y: 43.3, keywords: ["대전"], genericKeywords: ["대전"] },
  {
    id: "jeonbuk", name: "전북", x: 40.1, y: 53.8, genericKeywords: ["전북", "전라북"],
    keywords: ["전북", "전라북", "전주", "군산", "익산", "정읍", "남원", "김제"],
  },
  {
    id: "jeonnam", name: "전남", x: 36.3, y: 69.1, genericKeywords: ["전남", "전라남"],
    keywords: ["전남", "전라남", "여수", "순천", "목포", "광양", "나주", "담양"],
  },
  { id: "gwangju", name: "광주", x: 35.9, y: 63.3, keywords: ["광주"], genericKeywords: ["광주"] },
  {
    id: "gyeongbuk", name: "경북", x: 60.9, y: 44.7, genericKeywords: ["경북", "경상북"],
    keywords: ["경북", "경상북", "안동", "포항", "경주", "구미", "김천", "영주", "영천", "상주", "문경"],
  },
  {
    id: "gyeongnam", name: "경남", x: 56.4, y: 62.7, genericKeywords: ["경남", "경상남"],
    keywords: ["경남", "경상남", "창원", "진주", "김해", "양산", "거제", "통영", "사천", "밀양"],
  },
  { id: "daegu", name: "대구", x: 58.9, y: 52.8, keywords: ["대구"], genericKeywords: ["대구"] },
  { id: "ulsan", name: "울산", x: 69.5, y: 56.7, keywords: ["울산"], genericKeywords: ["울산"] },
  { id: "busan", name: "부산", x: 66.7, y: 62.8, keywords: ["부산"], genericKeywords: ["부산"] },
  { id: "jeju", name: "제주", x: 31.6, y: 91.1, keywords: ["제주", "서귀포"], genericKeywords: ["제주"] },
];

// 도 전체 무게중심 하나로만 찍으면 "포항인데 왜 울산보다 한참 북서쪽 내륙에 찍히냐" 같은 문제가
// 생긴다(포항은 실제로 울산 바로 위 동해안). 자주 나올 만한 주요 도시는 실제 상대 위치에 가깝게
// 좌표를 따로 잡아준다 — 정밀 지도는 아니고 같은 100x110 좌표계 안에서 눈대중으로 맞춘 근사치.
const CITY_COORDS = {
  // 경북 — 포항/경주는 동해안(울산 바로 위), 구미/안동/영주는 내륙 북쪽.
  포항: { x: 70, y: 46 }, 경주: { x: 66.5, y: 50.5 }, 구미: { x: 55, y: 46 },
  안동: { x: 58, y: 38 }, 영주: { x: 54, y: 32 }, 문경: { x: 50, y: 36 }, 김천: { x: 52, y: 47 },
  // 경남 — 창원/김해는 부산 바로 서쪽, 진주는 더 서쪽 내륙, 거제/통영은 남해안.
  창원: { x: 59, y: 61 }, 김해: { x: 63, y: 60 }, 진주: { x: 51, y: 60 },
  거제: { x: 60, y: 66 }, 통영: { x: 56, y: 66 }, 양산: { x: 65, y: 58 }, 사천: { x: 52, y: 64 },
  // 충남 — 천안/아산은 경기 접경 북동쪽, 서산은 서해안, 공주는 중앙.
  천안: { x: 39, y: 33 }, 아산: { x: 37, y: 32 }, 서산: { x: 29, y: 34 }, 공주: { x: 38, y: 40 },
  // 충북 — 청주는 중앙, 충주는 북동쪽.
  청주: { x: 48, y: 41 }, 충주: { x: 53, y: 33 },
  // 전북 — 군산/익산은 서북 해안, 전주는 중앙(기본값과 거의 동일).
  군산: { x: 33, y: 48 }, 익산: { x: 36, y: 50 },
  // 전남 — 여수는 동남 해안(기본값), 순천은 그 바로 위, 목포는 서남 끝.
  순천: { x: 37, y: 65 }, 목포: { x: 27, y: 72 }, 광양: { x: 39, y: 68 },
  // 강원 — 강릉은 동해안 중앙(기본값), 춘천은 경기 접경 서쪽, 속초는 더 북쪽 해안.
  춘천: { x: 44, y: 17 }, 원주: { x: 47, y: 27 }, 속초: { x: 57, y: 10 },
  // 경기 — 수원은 서울 바로 남쪽(기본값과 비슷), 성남은 그 동쪽, 고양은 서울 북쪽.
  성남: { x: 41, y: 27 }, 고양: { x: 35, y: 20 }, 용인: { x: 42, y: 30 },
};

// region 텍스트로 국내 지역 하나를 찾는다. 못 찾으면 null(해외/기타로 취급).
// matchedKeyword도 같이 반환 — "포항"처럼 구체적인 도시로 매칭됐는지, "경북"처럼 광역 표현으로만
// 매칭됐는지를 aggregateVisits에서 구분해서 지도에 어떤 이름을 찍을지 정하는 데 쓴다.
export function matchKoreaRegion(regionText) {
  if (!regionText) return null;
  const region = KOREA_REGIONS.find((r) => r.keywords.some((k) => regionText.includes(k)));
  if (!region) return null;
  const matchedKeyword = region.keywords.find((k) => regionText.includes(k));
  const cityCoord = CITY_COORDS[matchedKeyword];
  return { ...region, matchedKeyword, ...(cityCoord || {}) };
}
