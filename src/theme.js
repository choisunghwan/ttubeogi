// 데모(ttubeogi.jsx)의 색상 팔레트 그대로. 디자인 기준은 이 파일 값이 바뀌면 앱 전체가 바뀐다.
//
// orange/orangeDeep/gold/goldLight/goldDeep은 리터럴 hex 대신 CSS 변수를 가리킨다 — 마이페이지에서
// 테마(THEMES)를 고르면 <html data-theme="..."> 속성만 바뀌고, 실제 색상값은 styles.js가 주입하는
// :root/[data-theme] 규칙에서 정의된다(src/lib/theme.js 참고). 이렇게 해두면 이 두 파일을 보고
// 그리는 styles.js의 수백 군데 스타일 객체를 하나도 안 건드리고 테마 전환이 된다.
export const C = {
  ink: "var(--c-ink)", paper: "var(--c-paper)", land: "#efe7d5", landStroke: "#d9cdb2",
  orange: "var(--c-orange)", orangeDeep: "var(--c-orange-deep)", cream: "#fdf6e9", creamShade: "#f2e6cf",
  muted: "#a89f8c", textMuted: "var(--c-text-muted)", water: "#cfe2e6", green: "#d5e3c8",
  // 티켓 스텁 배경(그라데이션 두 톤)·상태 뱃지 배경·구분선 — 이것도 리터럴로 두면 테마를 바꿔도
  // 티켓 카드 안쪽(스텁·뱃지)만 예전 웜톤 그대로 남아서 "티켓 색은 안 바뀐다"는 인상을 준다.
  panel1: "var(--c-panel-1)", panel2: "var(--c-panel-2)", pillBg: "var(--c-pill-bg)", divider: "var(--c-divider)",
  routeDone: "#c2b8a3", member2: "#5b8c7b", member3: "#7a6cc4",
  // 보딩패스(홈 카드) 등 "고급스러운" 톤이 필요한 곳에 쓰는 금박 느낌 트림 컬러(기본은 골드, 테마에 따라 스틸 톤 등으로 바뀜).
  gold: "var(--c-gold)", goldLight: "var(--c-gold-light)", goldDeep: "var(--c-gold-deep)", navy: "#1f2a3a",
};

// 마이페이지에서 고를 수 있는 테마 프리셋 — 각 테마의 실제 hex 값(스와치 미리보기용)과
// CSS 변수로 주입할 값이 여기 한곳에 모여있다. 순서가 곧 마이페이지에 보이는 순서.
export const THEMES = [
  {
    id: "orange", label: "기본", desc: "따뜻한 테라코타",
    vars: {
      "--c-paper": "#faf8f3", "--c-ink": "#3a2f24", "--c-text-muted": "#8a8170",
      "--c-orange": "#c97a42", "--c-orange-deep": "#a8592a",
      "--c-gold": "#b8934a", "--c-gold-light": "#d9bd80", "--c-gold-deep": "#8f6f34",
      "--c-panel-1": "#fffaf0", "--c-panel-2": "#fbf3e2", "--c-pill-bg": "#fbecd9", "--c-divider": "#f0ebe0",
      "--c-shadow-upcoming": "rgba(201,122,66,.3)", "--c-shadow-hot": "rgba(184,147,74,.22)", "--c-shadow-fab": "rgba(168,89,42,.4)",
    },
  },
  {
    id: "navy", label: "네이비", desc: "프라이빗 항공사 퍼스트클래스",
    vars: {
      "--c-paper": "#f7f4ec", "--c-ink": "#1c2431", "--c-text-muted": "#6b7280",
      "--c-orange": "#2c4867", "--c-orange-deep": "#1e3550",
      "--c-gold": "#b8934a", "--c-gold-light": "#d9bd80", "--c-gold-deep": "#8f6f34",
      "--c-panel-1": "#f8f8f4", "--c-panel-2": "#eef0e9", "--c-pill-bg": "#e6ebf1", "--c-divider": "#e2e4de",
      "--c-shadow-upcoming": "rgba(44,72,103,.3)", "--c-shadow-hot": "rgba(184,147,74,.22)", "--c-shadow-fab": "rgba(30,53,80,.4)",
    },
  },
  {
    id: "bordeaux", label: "보르도", desc: "아시아나·에미레이트 퍼스트클래스",
    vars: {
      "--c-paper": "#f8f3ee", "--c-ink": "#2b1a1c", "--c-text-muted": "#8a6f6f",
      "--c-orange": "#6e2230", "--c-orange-deep": "#57121d",
      "--c-gold": "#b8934a", "--c-gold-light": "#d9bd80", "--c-gold-deep": "#8f6f34",
      "--c-panel-1": "#faf5f2", "--c-panel-2": "#f4e8e2", "--c-pill-bg": "#f3e2e5", "--c-divider": "#ece1dc",
      "--c-shadow-upcoming": "rgba(110,34,48,.3)", "--c-shadow-hot": "rgba(184,147,74,.22)", "--c-shadow-fab": "rgba(87,18,29,.4)",
    },
  },
  {
    id: "ktx", label: "코레일", desc: "KTX·SRT 실제 차체 색",
    vars: {
      "--c-paper": "#eef1f5", "--c-ink": "#1a2333", "--c-text-muted": "#5c6a80",
      "--c-orange": "#0f3a7a", "--c-orange-deep": "#0a2c5e",
      "--c-gold": "#5c6a80", "--c-gold-light": "#aebbcf", "--c-gold-deep": "#3a5480",
      "--c-panel-1": "#f3f5f9", "--c-panel-2": "#e7ecf3", "--c-pill-bg": "#e4eaf1", "--c-divider": "#dde3ea",
      "--c-shadow-upcoming": "rgba(15,58,122,.3)", "--c-shadow-hot": "rgba(92,106,128,.22)", "--c-shadow-fab": "rgba(10,44,94,.4)",
    },
  },
];

// 멤버 아바타 색은 서버(worker/routes/plans.js MEMBER_COLORS)가 가입 시점에 정해서 D1에 그대로
// 저장해둔 리터럴 hex라, 마이페이지에서 테마를 바꿔도 반응하지 않는다(다른 사람도 보는 공유
// 데이터라 뷰어 개인 취향으로 서버 값을 바꿀 순 없음) — 방장 기본 색만큼은 원래 "이 앱의 브랜드
// 오렌지"였을 뿐 특정 사람을 구분하려는 색이 아니었으므로, 그 리터럴 값을 만나면 지금 테마의
// 악센트로 바꿔치기해서 보여준다. 다른 5가지 구분용 색(초록/보라/빨강/파랑/분홍)은 그대로 둔다.
const LEGACY_DEFAULT_ORANGE_HEXES = new Set(["#e8863a", "#c97a42"]);
export function themedColor(hex) {
  return LEGACY_DEFAULT_ORANGE_HEXES.has(hex) ? C.orange : hex;
}

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
