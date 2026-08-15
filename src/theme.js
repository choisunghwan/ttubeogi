// 데모(ttubeogi.jsx)의 색상 팔레트 그대로. 디자인 기준은 이 파일 값이 바뀌면 앱 전체가 바뀐다.
export const C = {
  ink: "#3a2f24", paper: "#faf8f3", land: "#efe7d5", landStroke: "#d9cdb2",
  // 예전엔 채도 높은 캔디 오렌지(#e8863a)라 티켓 카드의 골드 톤이랑 따로 놀았음 —
  // 채도를 낮춘 테라코타 톤으로 바꿔서 앱 전체에 깔린 오렌지가 골드 악센트랑 더 잘 어울리게.
  orange: "#c97a42", orangeDeep: "#a8592a", cream: "#fdf6e9", creamShade: "#f2e6cf",
  muted: "#a89f8c", water: "#cfe2e6", green: "#d5e3c8",
  routeDone: "#c2b8a3", member2: "#5b8c7b", member3: "#7a6cc4",
  // 보딩패스(홈 카드) 등 "고급스러운" 톤이 필요한 곳에 쓰는 금박 느낌 골드 악센트.
  gold: "#b8934a", goldLight: "#d9bd80", goldDeep: "#8f6f34", navy: "#1f2a3a",
};

// 프리미엄 세리프 폰트(index.html에서 Google Fonts로 불러옴) — 티켓 카드 제목/숫자에 사용.
export const SERIF_KO = "'Noto Serif KR', serif";
export const SERIF_EN = "'Playfair Display', serif";

export const TYPES = {
  집: { emoji: "🏠", color: "#a0632f" },
  명소: { emoji: "⭐", color: C.orange }, 식당: { emoji: "🍽️", color: "#d9534f" },
  카페: { emoji: "☕", color: "#8a6d3b" }, 쇼핑: { emoji: "🛍️", color: "#c0568f" },
  숙소: { emoji: "🏨", color: "#4a6fa5" }, 이동: { emoji: "🚇", color: "#5b8c7b" },
  항공: { emoji: "✈️", color: "#3a6ea5" },
  도서관: { emoji: "📚", color: "#7d6b52" }, 영화관: { emoji: "🎬", color: "#5c4a8a" },
  기타: { emoji: "📌", color: "#8a8170" },
};
