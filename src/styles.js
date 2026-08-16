// 데모(ttubeogi.jsx)의 거대한 style 객체 그대로. 간격·색·카드 스타일의 단일 출처.
import { C, SERIF_KO, SERIF_EN, THEMES } from "./theme";

// 테마별 CSS 변수 규칙을 생성 — :root에 기본(orange) 테마 값을 깔고, 그 아래 각 테마를
// [data-theme="..."] 선택자로 덮어쓴다. <html data-theme="navy"> 처럼 속성만 바꾸면
// 여기서 정의된 변수를 참조하는 앱 전체 스타일이 한 번에 바뀐다(src/lib/theme.js가 속성을 다룸).
const defaultTheme = THEMES[0];
const themeCss = THEMES.map((t) => {
  const decls = Object.entries(t.vars).map(([k, v]) => `${k}: ${v};`).join(" ");
  return t.id === defaultTheme.id ? `:root { ${decls} }` : `:root[data-theme="${t.id}"] { ${decls} }`;
}).join("\n");

// box-sizing 리셋: width/maxWidth가 있는 요소에 padding·border를 더한 값이 실제 렌더 폭이 되면
// (기본값 content-box) 좁은 화면에서 하나둘씩 화면 밖으로 삐져나간다. 요소마다 개별로 boxSizing을
// 챙기는 대신 전역으로 한 번에 막는다 — 부트스트랩/Tailwind 등도 다 이렇게 함.
// dvh를 쓸 수 있으면 모바일 브라우저 주소창 높이 변화에 맞춰 실제 뷰포트 높이를 쓰고(100vh는 Safari에서
// 주소창이 보일 때 스크롤이 생기는 문제가 있음), 없으면 100vh로 폴백 — 인라인 style로는 fallback을
// 못 쓰니 이 클래스만 따로 <style> 태그로 주입.
export const keyframes = `
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; }
@keyframes pulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
.app-shell { height: 100vh; height: 100dvh; }
${themeCss}
`;

export const s = {
  app: {
    maxWidth: 440, margin: "0 auto", background: C.paper,
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
    color: C.ink, display: "flex", flexDirection: "column", position: "relative",
    // Safari에서 안쪽 어딘가의 텍스트/네이티브 컨트롤이 줄바꿈 없이 폭을 넓게 잡아버리는 경우가
    // 종종 있어서(각 요소마다 원인 다 잡기 번거로움), 앱 최상단에서 가로로는 절대 못 새어나가게
    // 마지막 안전장치를 걸어둔다 — 세로 스크롤엔 영향 없음.
    overflowX: "hidden",
  },
  // app을 뷰포트 높이로 고정하고, 이 안에서만 스크롤되게 함 — 하단 탭바를 이 스크롤 영역 "밖"의
  // 평범한 flex 형제로 두면(fixed/sticky 트릭 없이) 탭바가 절대 콘텐츠와 안 겹치고, 짧은 화면에서도
  // padding 값을 억지로 맞출 필요가 없어짐(구조적으로 겹칠 수가 없는 배치).
  // minWidth:0 필수 — Safari는 flex 자식의 기본 min-width를 내부 콘텐츠의 줄바꿈 안 된 최소 폭까지
  // 고려해서 화면보다 넓게 잡아버린다. 이게 없어서 페이지 전체가 가로로 삐져나오는 버그가 있었음.
  screen: {
    flex: 1, minWidth: 0, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch",
  },
  pad: { padding: "18px 16px 20px" },
  tabbar: {
    flexShrink: 0, display: "flex", gap: 6, padding: "8px 12px",
    paddingBottom: "max(8px, env(safe-area-inset-bottom))",
    background: "rgba(250,248,243,.95)", backdropFilter: "blur(8px)", borderTop: "1px solid #eae3d4",
  },
  tabBtn: {
    flex: 1, padding: "10px 0", border: "none", background: "transparent", fontSize: 13.5,
    fontWeight: 700, color: C.muted, cursor: "pointer", borderRadius: 10,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
  },
  tabOn: { color: C.orangeDeep, background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.06)" },
  tabIcon: { fontSize: 18 },
  head: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
  eyebrow: { fontSize: 11, letterSpacing: 2.5, color: C.muted, fontWeight: 700 },
  h1: { fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5 },
  mapSvg: { width: "100%", display: "block" },
  stats: { display: "flex", gap: 10, marginBottom: 16 },
  stat: { flex: 1, background: "#fff", borderRadius: 14, padding: "12px 8px", textAlign: "center",
          border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,.04)" },
  statNum: { fontSize: 25, fontWeight: 800, color: C.orangeDeep, lineHeight: 1 },
  statLabel: { fontSize: 11.5, color: C.muted, marginTop: 5, fontWeight: 600 },
  mapFrame: { position: "relative", background: "#fff", borderRadius: 18, padding: 8,
              border: "2px solid #2f3d2c", boxShadow: "0 8px 24px rgba(0,0,0,.1)", marginBottom: 14 },
  legend: { display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap",
            padding: "8px 0 4px", fontSize: 12, color: C.textMuted },
  legendItem: { display: "inline-flex", alignItems: "center", gap: 3 },
  detail: { background: "#fff", borderRadius: 14, padding: "16px 18px", border: `1px solid ${C.border}`,
            boxShadow: "0 3px 12px rgba(0,0,0,.06)", marginBottom: 14 },
  detailHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline",
                marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #f0ebe0" },
  detailName: { fontSize: 22, fontWeight: 800 },
  detailVisits: { fontSize: 14, color: C.textMuted },
  detailRow: { display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0" },
  detailKey: { color: C.muted, fontWeight: 600 },
  hint: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "18px 16px",
          color: C.muted, fontSize: 13.5, background: "#fff", borderRadius: 14, border: "1px dashed #ddd4c2", marginBottom: 14 },
  upcoming: { display: "flex", justifyContent: "space-between", alignItems: "center",
              background: `linear-gradient(100deg, ${C.orange}, ${C.gold})`, color: "#fff",
              borderRadius: 14, padding: "14px 18px", cursor: "pointer", boxShadow: "0 6px 18px var(--c-shadow-upcoming)" },
  upLabel: { fontSize: 12, fontWeight: 700, opacity: 0.9 },
  upName: { fontSize: 18, fontWeight: 800, marginTop: 2 },
  upGo: { fontSize: 14, fontWeight: 800 },
  tripHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  subtitle: { fontSize: 13, color: C.textMuted, marginTop: 4 },
  members: { display: "flex", alignItems: "center" },
  avatar: { width: 28, height: 28, borderRadius: "50%", color: "#fff", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
            marginLeft: -6, border: `2px solid ${C.paper}` },
  liveDot: { width: 8, height: 8, borderRadius: "50%", background: C.member2, marginLeft: 6, animation: "pulse 1.6s infinite" },
  progressRow: { marginBottom: 12 },
  progressLabel: { fontSize: 12, color: C.textMuted, fontWeight: 600 },
  progressTrack: { height: 6, background: "#eae4d6", borderRadius: 4, marginTop: 5, overflow: "hidden" },
  progressFill: { height: "100%", background: `linear-gradient(90deg, ${C.orange}, #f0a869)`, borderRadius: 4, transition: "width .4s" },
  tripMapFrame: { position: "relative", borderRadius: 16, overflow: "hidden", border: "2px solid #2f3d2c",
                  boxShadow: "0 8px 24px rgba(0,0,0,.12)", aspectRatio: "4 / 3", marginBottom: 14 },
  tripMapFrameFullscreen: { position: "fixed", inset: 0, zIndex: 500, borderRadius: 0, border: "none",
                            aspectRatio: "auto", marginBottom: 0, boxShadow: "none" },
  mapFullscreenBtn: { position: "absolute", top: 10, right: 10, zIndex: 1000, width: 34, height: 34,
                       borderRadius: "50%", border: "none", background: "rgba(255,255,255,.92)",
                       boxShadow: "0 2px 8px rgba(0,0,0,.25)", display: "flex", alignItems: "center",
                       justifyContent: "center", cursor: "pointer" },
  mapFullscreenNav: { position: "absolute", left: 10, right: 10, bottom: 14, zIndex: 1000,
                       background: "rgba(255,255,255,.94)", borderRadius: 14, padding: "10px 12px",
                       boxShadow: "0 4px 16px rgba(0,0,0,.25)" },
  bubble: { position: "absolute", left: 10, bottom: 10, background: "rgba(255,255,255,.94)",
            padding: "6px 11px", borderRadius: 20, fontSize: 13, boxShadow: "0 2px 8px rgba(0,0,0,.15)" },
  card: { background: "#fff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 3px 12px rgba(0,0,0,.06)",
          marginBottom: 14, border: `1px solid ${C.border}` },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  typeBadge: { fontSize: 12, color: "#fff", padding: "3px 9px", borderRadius: 20, fontWeight: 700 },
  cardTime: { fontSize: 15, fontWeight: 800, color: C.orange },
  cardName: { fontSize: 19, fontWeight: 800, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: C.textMuted, lineHeight: 1.5, marginBottom: 10 },
  cardMeta: { display: "flex", justifyContent: "space-between", fontSize: 13, color: C.textMuted },
  nav: { display: "flex", gap: 8 },
  navBtn: { flex: 1, padding: "13px 0", borderRadius: 12, border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer" },
  navPrev: { background: C.chipBg, color: C.textMuted },
  navNow: { flex: 0.5, background: C.chipBg, color: C.textMuted },
  navNext: { background: C.orange, color: "#fff" },
  done: { textAlign: "center", marginTop: 14, fontSize: 17, fontWeight: 800, color: C.orange },

  // 홈
  homeHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  profileDot: { width: 34, height: 34, borderRadius: "50%", background: C.orange, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800,
                cursor: "pointer", flexShrink: 0 },
  homeGreeting: { fontSize: 21, fontWeight: 800, lineHeight: 1.35, marginBottom: 22 },
  sectionLabel: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800,
                  color: C.textMuted, marginBottom: 10, letterSpacing: -0.2 },
  // 홈 카드 — 진짜 보딩패스(항공권) 티켓처럼: 본문 + 절취선(펀치 노치) + 스텁으로 구성.
  // 노치(반원 구멍)는 카드 배경색 대신 페이지 배경색(C.paper)의 작은 원을 절취선 위치에 얹어서
  // "뚫린 것처럼" 보이게 하는 방식 — 실제 CSS clip-path 없이도 가벼움.
  ticketCard: { position: "relative", display: "flex", background: "#fff", borderRadius: 16,
                border: `1px solid ${C.goldLight}`, boxShadow: "0 3px 14px rgba(80,60,20,.08)",
                marginBottom: 14, cursor: "pointer", overflow: "hidden" },
  ticketCardHot: { border: `1.5px solid ${C.gold}`, boxShadow: "0 8px 22px var(--c-shadow-hot)" },
  // 지난(완료된) 일정은 "다 쓴 티켓"처럼 — 살짝 바래고, 절취선을 실제로 찢어낸 지그재그로.
  ticketCardPast: { filter: "grayscale(.4) opacity(.86)" },
  // 실제 도장 찍은 느낌 — 두꺼운 빨간 테두리 + 안쪽 얇은 테두리(이중 링), 살짝 기울이고
  // 잉크가 옅게 스민 것처럼 opacity를 낮춰서 인쇄물에 도장 찍은 듯한 느낌을 냄.
  ticketStampDone: { position: "absolute", top: 10, right: 88, fontFamily: SERIF_EN, fontStyle: "italic",
                      fontSize: 13, fontWeight: 800, letterSpacing: 2, color: "#c0392b", opacity: 0.82,
                      textTransform: "uppercase", border: "2.5px solid #c0392b", borderRadius: 6,
                      padding: "3px 9px", transform: "rotate(-11deg)",
                      boxShadow: "inset 0 0 0 2px rgba(192,57,43,.4)", mixBlendMode: "multiply" },
  ticketMain: { flex: 1, minWidth: 0, padding: "15px 14px 14px" },
  ticketEyebrow: { fontFamily: SERIF_EN, fontStyle: "italic", fontSize: 10.5, fontWeight: 700,
                   letterSpacing: 1.6, color: C.gold, textTransform: "uppercase", marginBottom: 5 },
  ticketTitle: { fontFamily: SERIF_KO, fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 3,
                 whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  ticketWhen: { fontSize: 12, color: C.textMuted, marginBottom: 10, letterSpacing: 0.2 },
  ticketBottom: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  planMembers: { display: "flex" },
  miniAvatar: { width: 22, height: 22, borderRadius: "50%", color: "#fff", fontSize: 10.5, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", marginLeft: -5,
                border: "2px solid #fff" },
  planSpots: { fontSize: 11.5, color: C.muted, fontWeight: 600 },
  // 절취선 + 위아래 펀치 노치. stub 폭(76px)과 반드시 짝을 맞춰야 함(HomeScreen에서 같이 씀).
  ticketPerforation: { width: 0, borderLeft: `2px dashed ${C.goldLight}`, margin: "10px 0" },
  // 지난 일정용 — 실제로 뜯어낸 지그재그 절취선(SVG 반복 패턴). 깨끗한 점선 대신 이걸 씀.
  ticketPerforationTorn: {
    width: 12, alignSelf: "stretch", margin: "0 -6px",
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='20'><path d='M6 0 L1 5 L6 10 L1 15 L6 20' stroke='${C.goldLight}' stroke-width='1.4' fill='none'/></svg>`
    )}")`,
    backgroundRepeat: "repeat-y",
  },
  ticketNotchTop: { position: "absolute", top: -9, right: 67, width: 18, height: 18, borderRadius: "50%",
                    background: C.paper, border: `1px solid ${C.goldLight}` },
  ticketNotchBottom: { position: "absolute", bottom: -9, right: 67, width: 18, height: 18, borderRadius: "50%",
                       background: C.paper, border: `1px solid ${C.goldLight}` },
  ticketStub: { width: 76, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 8, padding: "10px 6px",
                background: `linear-gradient(180deg, ${C.panel1}, ${C.panel2})` },
  // 찢어서 다시 붙인 것처럼 살짝 삐뚤게.
  ticketStubTorn: { transform: "rotate(-2.5deg) translateX(2px)" },
  ticketStubDday: { fontFamily: SERIF_EN, fontSize: 13, fontWeight: 700, color: C.goldDeep,
                     border: `1px solid ${C.goldLight}`, borderRadius: "50%", width: 40, height: 40,
                     display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
                     lineHeight: 1.05, background: "#fff" },
  ticketStubGo: { fontFamily: SERIF_EN, fontStyle: "italic", fontSize: 10, fontWeight: 700, color: C.gold,
                  letterSpacing: 1 },
  ticketBarcode: { width: "100%", height: 16, marginTop: 2,
                   background: `repeating-linear-gradient(90deg, ${C.goldLight} 0 1.5px, transparent 1.5px 4px)`,
                   opacity: 0.6 },
  newBtn: { width: "100%", marginTop: 22, padding: "15px 0", borderRadius: 14, border: "none",
            background: C.ink, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
  newHint: { textAlign: "center", fontSize: 12, color: C.muted, marginTop: 8 },
  // 일정이 쌓여서 목록이 길어져도 "새 일정" 버튼이 아래로 밀려 안 보이지 않게, 화면에 고정된
  // 원형 버튼(FAB)으로 항상 떠 있게 함 — 탭바 바로 위, 화면(app) 기준 절대 위치라
  // 안쪽 리스트가 스크롤돼도 같이 안 움직인다.
  fab: { position: "absolute", right: 16, bottom: "calc(76px + env(safe-area-inset-bottom))", zIndex: 300,
         width: 54, height: 54, borderRadius: "50%", border: "none",
         background: `linear-gradient(135deg, ${C.orange}, ${C.goldDeep})`, color: "#fff",
         fontSize: 26, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center",
         justifyContent: "center", boxShadow: "0 6px 16px var(--c-shadow-fab)", lineHeight: 1 },
  backBtn: { border: "none", background: "transparent", color: C.muted, fontSize: 14, fontWeight: 700,
             cursor: "pointer", padding: "0 0 10px", marginLeft: -2 },
  myPageDivider: { height: 1, background: C.goldLight, opacity: 0.5, margin: "28px 0 22px" },
  themeSwatchRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  themeSwatchBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 66,
                    border: "none", background: "transparent", cursor: "pointer", padding: "4px 0" },
  themeSwatchDot: { width: 40, height: 40, borderRadius: "50%", border: "2px solid transparent",
                     boxShadow: "0 2px 6px rgba(0,0,0,.15)" },
  themeSwatchDotOn: { border: `2px solid ${C.ink}` },
  themeSwatchLabel: { fontSize: 11.5, fontWeight: 700, color: C.muted },
  themeSwatchLabelOn: { color: C.ink },

  // 폼 공통 (일정 만들기 / 참여 게이트 / 항목 모달)
  formLabel: { fontSize: 13, fontWeight: 700, color: C.textMuted, marginBottom: 7, marginTop: 18 },
  // fontSize 16 미만이면 iOS Safari가 이 입력창에 포커스될 때 화면을 자동으로 확대해버려서
  // "탭하면 사이즈가 깨진다"는 증상으로 보인다 — 16 유지 필수.
  formInput: { width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.borderStrong}`,
               fontSize: 16, fontFamily: "inherit", background: "#fff", color: C.ink, boxSizing: "border-box" },
  // 날짜 두 개를 나란히 둘 때 쓰는 좁은 버전 — 좌우 패딩을 줄여서 좁은 화면에서도 두 칸이
  // 한 줄에 들어가게. fontSize는 16 밑으로 못 내림(iOS 자동 확대 버그) 그대로 유지.
  formInputDate: { width: "100%", padding: "12px 6px", borderRadius: 12, border: `1px solid ${C.borderStrong}`,
                   fontSize: 16, fontFamily: "inherit", background: "#fff", color: C.ink, boxSizing: "border-box",
                   minWidth: 0 },
  formTextarea: { width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.borderStrong}`,
                  fontSize: 16, fontFamily: "inherit", background: "#fff", color: C.ink, boxSizing: "border-box",
                  resize: "vertical", lineHeight: 1.5 },
  // flexWrap: 네이티브 date/select 컨트롤은 CSS로 강제로 줄여도 실제 렌더링 폭이 그대로인 경우가 있어서
  // (특히 Safari) 안 들어가면 옆으로 삐져나오는 대신 줄바꿈되게 해서 화면 밖으로 안 나가게 방어.
  formRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  formHint: { fontSize: 12, color: C.muted, marginTop: 6 },
  formError: { fontSize: 13, color: "#c0392b", marginTop: 10, fontWeight: 600 },
  // 좌표 검색 결과 여러 개 중 하나를 고르게 하는 목록 — CGV 여러 지점, 국내외 동명 지명 문제 해결.
  geoCandidateList: { display: "flex", flexDirection: "column", gap: 6, marginTop: 4 },
  geoCandidateBtn: { display: "flex", alignItems: "flex-start", gap: 8, width: "100%", textAlign: "left",
                      padding: "10px 12px", borderRadius: 12, border: `1px solid ${C.borderStrong}`, background: "#fff",
                      cursor: "pointer" },
  geoCandidateFlag: { fontSize: 15, flexShrink: 0, lineHeight: "20px" },
  geoCandidateText: { display: "flex", flexDirection: "column", minWidth: 0 },
  geoCandidateLabel: { fontSize: 14, fontWeight: 700, color: C.ink },
  geoCandidateAddr: { fontSize: 11.5, color: C.muted, marginTop: 2 },
  // 항목 첨부파일(항공권/기차표/바우처) 선택·미리보기
  attachmentPickBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px",
                        borderRadius: 12, border: `1.5px dashed #d9cdb2`, color: C.muted, fontSize: 13.5,
                        fontWeight: 700, cursor: "pointer", width: "fit-content" },
  attachmentPreview: { display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                        borderRadius: 12, border: `1px solid ${C.borderStrong}`, background: "#fff" },
  attachmentPreviewName: { flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: C.ink,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  attachmentPreviewLink: { fontSize: 12.5, fontWeight: 700, color: C.orangeDeep, flexShrink: 0 },
  attachmentThumbSmall: { width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0,
                           border: `1px solid ${C.borderStrong}` },
  attachmentRemoveBtn: { border: "none", background: "transparent", color: "#c0392b", fontSize: 12.5,
                          fontWeight: 700, cursor: "pointer", flexShrink: 0 },
  pickerGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  pickerBtn: { padding: "10px 16px", borderRadius: 20, border: `1.5px solid ${C.borderStrong}`, background: "#fff",
               color: C.ink, fontSize: 14, fontWeight: 700, cursor: "pointer" },
  pickerBtnOn: { border: `1.5px solid ${C.orange}`, background: C.pillBg, color: C.orangeDeep },
  submitBtn: { width: "100%", marginTop: 26, padding: "15px 0", borderRadius: 14, border: "none",
               background: `linear-gradient(135deg, ${C.orangeDeep}, ${C.goldDeep})`,
               color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer" },
  submitBtnDisabled: { opacity: 0.5, cursor: "not-allowed" },

  // 참여 게이트
  joinWrap: { minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center",
              alignItems: "center", padding: 24, background: C.paper },
  // boxSizing 필수 — width/maxWidth에 padding+border가 더해지지 않게. 이게 빠져있어서
  // joinWrap(가운데 정렬+여유 패딩) 밖에서 이 카드를 쓰면(마이페이지 등) 실제 렌더 폭이
  // maxWidth보다 padding+border만큼 더 넓어져서 화면 밖으로 삐져나갔었다.
  joinCard: { width: "100%", maxWidth: 360, boxSizing: "border-box", background: "#fff", borderRadius: 18,
              padding: "28px 24px", border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(0,0,0,.08)",
              textAlign: "center" },

  // 빈 상태
  emptyState: { textAlign: "center", padding: "40px 16px", color: C.muted, fontSize: 14 },

  // 공유 링크 바
  shareHint: { fontSize: 12.5, color: C.orangeDeep, fontWeight: 700, marginBottom: 6 },
  shareBar: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px dashed #ddd4c2",
              borderRadius: 12, padding: "10px 12px", marginBottom: 14 },
  shareLink: { flex: 1, minWidth: 0, fontSize: 12.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  adminTableWrap: { overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 8, background: "#fff" },
  adminTable: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  adminTh: { textAlign: "left", padding: "9px 10px", background: C.chipBg, color: C.textMuted, fontWeight: 700,
             fontSize: 11.5, whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}` },
  adminTd: { padding: "9px 10px", borderBottom: "1px solid #f3efe4", whiteSpace: "nowrap", color: C.ink },
  adminBadge: { fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 20, whiteSpace: "nowrap" },
  shareCopyBtn: { border: "none", background: C.ink, color: "#fff", fontSize: 12.5, fontWeight: 700,
                  padding: "7px 12px", borderRadius: 8, cursor: "pointer", flexShrink: 0 },
  shareNativeBtn: { border: "none", background: C.orange, color: "#fff", width: 30, height: 30,
                     borderRadius: 8, cursor: "pointer", flexShrink: 0, display: "flex",
                     alignItems: "center", justifyContent: "center" },

  // 날짜 칩
  dayChips: { display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 2 },
  dayChip: { flexShrink: 0, padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${C.borderStrong}`,
             background: "#fff", color: C.ink, fontSize: 13, fontWeight: 700, cursor: "pointer" },
  dayChipOn: { border: `1.5px solid ${C.goldDeep}`, background: C.orange, color: "#fff" },

  // 항목 리스트 카드
  itemRow: { display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 14,
             padding: "12px 14px", marginBottom: 10, border: `1px solid ${C.border}`,
             boxShadow: "0 2px 8px rgba(0,0,0,.04)", transition: "background .3s, border-color .3s" },
  // 지도에서 마커를 눌러 "이 일정으로 가기" 했을 때 스크롤된 행을 잠깐 강조.
  itemRowHighlight: { background: C.pillBg, border: `1px solid ${C.orange}` },
  itemRowBadge: { width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 16, flexShrink: 0, color: "#fff" },
  itemRowTime: { fontSize: 11.5, color: C.muted, fontWeight: 700 },
  itemRowName: { fontSize: 15, fontWeight: 800 },
  itemRowMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
  itemRowMemo: { fontSize: 12.5, color: C.textMuted, marginTop: 4, padding: "6px 9px", background: C.chipBg,
                 borderRadius: 8, lineHeight: 1.4, whiteSpace: "pre-wrap", wordBreak: "break-word" },
  itemRowThumb: { width: 28, height: 28, borderRadius: 7, objectFit: "cover", cursor: "pointer",
                   border: `1px solid ${C.goldLight}`, verticalAlign: "middle" },
  itemRowActions: { display: "flex", gap: 6, flexShrink: 0 },
  itemRowActionBtn: { border: "none", background: C.chipBg, color: C.textMuted, width: 28, height: 28,
                      borderRadius: 8, cursor: "pointer", fontSize: 13 },
  dragHandle: { border: "none", background: "transparent", color: C.muted, fontSize: 18, lineHeight: 1,
                cursor: "grab", padding: "0 4px 0 0", flexShrink: 0, touchAction: "none" },
  // "티켓" 탭 카드 — ItemRow와 비슷하지만 드래그 핸들 없는 보기 전용.
  ticketCardMini: { position: "relative", display: "flex", alignItems: "flex-start", gap: 12, background: "#fff",
                     borderRadius: 14, padding: "12px 14px", marginBottom: 10, border: `1px solid ${C.goldLight}`,
                     boxShadow: "0 2px 8px rgba(0,0,0,.04)" },
  ticketCardMiniDay: { fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 2 },
  ticketFooter: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 },
  ticketAttachmentBtn: { display: "inline-flex", alignItems: "center", gap: 4, border: "none", background: "transparent",
                          padding: 0, color: C.gold, fontWeight: 700, fontSize: 12.5, cursor: "pointer",
                          textDecoration: "underline" },
  ticketEditLink: { border: "none", background: "transparent", color: C.muted, fontWeight: 700, fontSize: 12.5,
                     cursor: "pointer", padding: 0, marginTop: 10, alignSelf: "flex-start" },
  // 첨부파일 텍스트 링크 대신 보여주는 실제 썸네일 — 사진이면 그대로, PDF 등이면 아이콘 박스로.
  ticketThumb: { width: 46, height: 46, borderRadius: 10, objectFit: "cover", flexShrink: 0,
                 border: `1px solid ${C.goldLight}`, cursor: "pointer" },
  ticketThumbFile: { width: 46, height: 46, borderRadius: 10, flexShrink: 0, border: `1px solid ${C.goldLight}`,
                      background: "#fbf3e2", display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer" },

  // 항공편 전용 티켓 카드 — 실제 항공권처럼 출발/도착 구간으로 보여준다.
  flightTicketWrap: { marginBottom: 14 },
  flightTicketEyebrow: { display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 800,
                          color: C.ink, marginBottom: 8 },
  flightTicketDot: { width: 7, height: 7, borderRadius: "50%", background: C.orange, flexShrink: 0 },
  flightTicketCard: { background: "#fff", borderRadius: 18, border: `1px solid ${C.goldLight}`,
                       boxShadow: "0 4px 16px rgba(80,60,20,.08)", padding: "16px 18px 14px",
                       display: "flex", flexDirection: "column" },
  flightTicketTopRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  flightTicketNo: { fontSize: 14, fontWeight: 800, color: C.ink },
  flightTicketNoSub: { fontWeight: 600, color: C.muted },
  flightTicketStatus: { fontSize: 11.5, fontWeight: 800, color: C.goldDeep, background: C.pillBg,
                         padding: "3px 10px", borderRadius: 20 },
  flightRoute: { display: "flex", alignItems: "center", gap: 8 },
  flightRouteEnd: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" },
  flightRouteCode: { fontFamily: SERIF_EN, fontSize: 21, fontWeight: 700, color: C.ink, letterSpacing: 0.3,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  flightRouteMeta: { fontSize: 11.5, color: C.muted, fontWeight: 600, marginTop: 3, whiteSpace: "nowrap",
                      overflow: "hidden", textOverflow: "ellipsis" },
  flightRouteLine: { display: "flex", alignItems: "center", gap: 3, flexShrink: 0, padding: "0 2px" },
  flightRouteLineBar: { width: 12, height: 1, background: C.goldLight },
  flightTicketDivider: { height: 1, background: C.divider, margin: "16px 0 12px" },
  // 티켓 카드 절취선(perforation)이랑 같은 골드 점선 언어를 써서 "+ 항목 추가"도
  // 그냥 평범한 버튼이 아니라 티켓 톤에 맞는 요소로 보이게.
  addItemBtn: { width: "100%", marginTop: 4, marginBottom: 18, padding: "13px 0", borderRadius: 12,
                border: `1.5px dashed ${C.gold}`, background: "#fff", color: C.goldDeep,
                fontSize: 14.5, fontWeight: 800, cursor: "pointer" },
  optimizeRouteBtn: { width: "100%", marginBottom: 10, padding: "11px 0", borderRadius: 12,
                      border: `1.5px solid ${C.orange}`, background: C.pillBg, color: C.orangeDeep,
                      fontSize: 13.5, fontWeight: 800, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },

  // 모달
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(58,47,36,.45)", display: "flex",
                  alignItems: "flex-end", justifyContent: "center", zIndex: 50 },
  modalSheet: { width: "100%", maxWidth: 440, maxHeight: "88vh", overflowY: "auto", background: C.paper,
                borderRadius: "20px 20px 0 0", padding: "20px 16px 28px" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: 800 },
  // 항목 행의 ⋯ 더보기를 누르면 뜨는 작은 액션 시트 — modalOverlay 재사용, 안쪽은 세로로 쌓은 버튼 목록.
  actionSheet: { width: "100%", maxWidth: 440, background: C.paper, borderRadius: "20px 20px 0 0",
                 padding: "10px 12px calc(12px + env(safe-area-inset-bottom))", display: "flex",
                 flexDirection: "column", gap: 4 },
  actionSheetBtn: { display: "flex", alignItems: "center", gap: 10, width: "100%", border: "none",
                     background: "transparent", padding: "13px 10px", borderRadius: 12, fontSize: 15.5,
                     fontWeight: 700, color: C.ink, cursor: "pointer", textAlign: "left" },
  actionSheetCancel: { marginTop: 6, width: "100%", border: "none", background: C.chipBg, color: C.textMuted,
                        padding: "12px 0", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer" },
  modalCloseBtn: { border: "none", background: "transparent", fontSize: 20, color: C.muted, cursor: "pointer" },

  // 첨부 이미지(항공권/바우처) 라이트박스 — modalOverlay는 아래에서 올라오는 폼 시트용이라
  // alignItems:flex-end라, 사진처럼 화면 중앙에 떠야 하는 것들은 따로 center로 둔다.
  lightboxOverlay: { position: "fixed", inset: 0, background: "rgba(58,47,36,.45)", display: "flex",
                      alignItems: "center", justifyContent: "center", zIndex: 50 },
  attachmentLightbox: { position: "relative", maxWidth: "92vw", maxHeight: "88vh" },
  attachmentLightboxImg: { maxWidth: "92vw", maxHeight: "88vh", borderRadius: 10, display: "block" },

  // 캘린더 화면 (예전 나의지도 탭 자리)
  calHeadRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  calNavBtn: { width: 32, height: 32, borderRadius: "50%", border: `1px solid ${C.goldLight}`, background: "#fff",
               color: C.goldDeep, fontSize: 18, fontWeight: 700, cursor: "pointer", lineHeight: "1",
               display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  calMonthLabel: { fontFamily: SERIF_KO, fontSize: 17, fontWeight: 700, color: C.ink },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 4, columnGap: 0,
             background: "#fff", border: `1px solid ${C.goldLight}`, borderRadius: 16, padding: "12px 4px",
             boxShadow: "0 3px 14px rgba(80,60,20,.06)" },
  calWeekday: { fontSize: 11, fontWeight: 700, textAlign: "center", paddingBottom: 6 },
  calCellWrap: { display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 },
  calCell: { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center",
             justifyContent: "center", fontSize: 12.5, fontWeight: 600, color: C.ink },
  calCellToday: { border: `1.3px solid ${C.gold}`, fontWeight: 800 },
  calCellSelected: { background: C.gold, color: "#fff", fontWeight: 800 },
  calDots: { display: "flex", gap: 2, marginTop: 2, height: 4 },
  calDot: { width: 4, height: 4, borderRadius: "50%" },
  calSelectedList: { marginTop: 14, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14,
                      padding: "10px 12px", boxShadow: "0 2px 8px rgba(0,0,0,.04)" },
  calSelectedLabel: { fontSize: 11.5, fontWeight: 700, color: C.muted, marginBottom: 6, letterSpacing: 0.2 },
  calSelectedRow: { display: "flex", alignItems: "center", gap: 10, padding: "9px 2px", cursor: "pointer",
                     borderTop: `1px solid ${C.chipBg}` },
  calSelectedTitle: { fontSize: 14, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden",
                       textOverflow: "ellipsis" },
  calSelectedWhen: { fontSize: 11.5, color: C.muted, marginTop: 1 },
  calExportBtn: { width: "100%", marginTop: 20, padding: "15px 0", borderRadius: 14, border: "none",
                  background: C.gold, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
};
