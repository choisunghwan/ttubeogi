// 데모(ttubeogi.jsx)의 거대한 style 객체 그대로. 간격·색·카드 스타일의 단일 출처.
import { C } from "./theme";

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
          border: "1px solid #efe9dc", boxShadow: "0 2px 8px rgba(0,0,0,.04)" },
  statNum: { fontSize: 25, fontWeight: 800, color: C.orangeDeep, lineHeight: 1 },
  statLabel: { fontSize: 11.5, color: C.muted, marginTop: 5, fontWeight: 600 },
  mapFrame: { position: "relative", background: "#fff", borderRadius: 18, padding: 8,
              border: "2px solid #2f3d2c", boxShadow: "0 8px 24px rgba(0,0,0,.1)", marginBottom: 14 },
  legend: { display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap",
            padding: "8px 0 4px", fontSize: 12, color: "#7a715f" },
  legendItem: { display: "inline-flex", alignItems: "center", gap: 3 },
  detail: { background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #efe9dc",
            boxShadow: "0 3px 12px rgba(0,0,0,.06)", marginBottom: 14 },
  detailHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline",
                marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #f0ebe0" },
  detailName: { fontSize: 22, fontWeight: 800 },
  detailVisits: { fontSize: 14, color: "#7a715f" },
  detailRow: { display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0" },
  detailKey: { color: C.muted, fontWeight: 600 },
  hint: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "18px 16px",
          color: C.muted, fontSize: 13.5, background: "#fff", borderRadius: 14, border: "1px dashed #ddd4c2", marginBottom: 14 },
  upcoming: { display: "flex", justifyContent: "space-between", alignItems: "center",
              background: `linear-gradient(100deg, ${C.orange}, #f0a869)`, color: "#fff",
              borderRadius: 14, padding: "14px 18px", cursor: "pointer", boxShadow: "0 6px 18px rgba(232,134,58,.3)" },
  upLabel: { fontSize: 12, fontWeight: 700, opacity: 0.9 },
  upName: { fontSize: 18, fontWeight: 800, marginTop: 2 },
  upGo: { fontSize: 14, fontWeight: 800 },
  tripHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  subtitle: { fontSize: 13, color: "#8a8170", marginTop: 4 },
  members: { display: "flex", alignItems: "center" },
  avatar: { width: 28, height: 28, borderRadius: "50%", color: "#fff", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
            marginLeft: -6, border: "2px solid #faf8f3" },
  liveDot: { width: 8, height: 8, borderRadius: "50%", background: C.member2, marginLeft: 6, animation: "pulse 1.6s infinite" },
  progressRow: { marginBottom: 12 },
  progressLabel: { fontSize: 12, color: "#8a8170", fontWeight: 600 },
  progressTrack: { height: 6, background: "#eae4d6", borderRadius: 4, marginTop: 5, overflow: "hidden" },
  progressFill: { height: "100%", background: `linear-gradient(90deg, ${C.orange}, #f0a869)`, borderRadius: 4, transition: "width .4s" },
  tripMapFrame: { position: "relative", borderRadius: 16, overflow: "hidden", border: "2px solid #2f3d2c",
                  boxShadow: "0 8px 24px rgba(0,0,0,.12)", aspectRatio: "4 / 3", marginBottom: 14 },
  bubble: { position: "absolute", left: 10, bottom: 10, background: "rgba(255,255,255,.94)",
            padding: "6px 11px", borderRadius: 20, fontSize: 13, boxShadow: "0 2px 8px rgba(0,0,0,.15)" },
  card: { background: "#fff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 3px 12px rgba(0,0,0,.06)",
          marginBottom: 14, border: "1px solid #efe9dc" },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  typeBadge: { fontSize: 12, color: "#fff", padding: "3px 9px", borderRadius: 20, fontWeight: 700 },
  cardTime: { fontSize: 15, fontWeight: 800, color: C.orange },
  cardName: { fontSize: 19, fontWeight: 800, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: "#867d6c", lineHeight: 1.5, marginBottom: 10 },
  cardMeta: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#867d6c" },
  nav: { display: "flex", gap: 8 },
  navBtn: { flex: 1, padding: "13px 0", borderRadius: 12, border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer" },
  navPrev: { background: "#f0ece1", color: "#5a5445" },
  navNow: { flex: 0.5, background: "#e5ddcb", color: "#5a5445" },
  navNext: { background: C.orange, color: "#fff" },
  done: { textAlign: "center", marginTop: 14, fontSize: 17, fontWeight: 800, color: C.orange },

  // 홈
  homeHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  profileDot: { width: 34, height: 34, borderRadius: "50%", background: C.orange, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800,
                cursor: "pointer", flexShrink: 0 },
  homeGreeting: { fontSize: 21, fontWeight: 800, lineHeight: 1.35, marginBottom: 22 },
  sectionLabel: { fontSize: 13, fontWeight: 800, color: "#6f6656", marginBottom: 10, letterSpacing: -0.2 },
  planCard: { display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 15,
              padding: "13px 14px", marginBottom: 10, border: "1px solid #efe9dc",
              boxShadow: "0 2px 8px rgba(0,0,0,.04)", cursor: "pointer", transition: "transform .1s" },
  planCardHot: { border: `2px solid ${C.orange}`, boxShadow: "0 6px 18px rgba(232,134,58,.16)" },
  planEmoji: { fontSize: 30, width: 44, height: 44, borderRadius: 12, background: "#f7f2e8",
               display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  planTop: { display: "flex", alignItems: "center", gap: 6, marginBottom: 3 },
  planKind: { fontSize: 11, fontWeight: 800, color: C.orangeDeep, background: "#fbecd9",
              padding: "2px 8px", borderRadius: 20 },
  planDday: { fontSize: 11, fontWeight: 800, color: C.muted },
  planTitle: { fontSize: 17, fontWeight: 800, marginBottom: 2, whiteSpace: "nowrap",
               overflow: "hidden", textOverflow: "ellipsis" },
  planWhen: { fontSize: 12.5, color: "#8a8170", marginBottom: 7 },
  planBottom: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  planMembers: { display: "flex" },
  miniAvatar: { width: 22, height: 22, borderRadius: "50%", color: "#fff", fontSize: 10.5, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", marginLeft: -5,
                border: "2px solid #fff" },
  planSpots: { fontSize: 12, color: C.muted, fontWeight: 600 },
  planGo: { color: C.orange, fontWeight: 800, fontSize: 14, flexShrink: 0 },
  newBtn: { width: "100%", marginTop: 22, padding: "15px 0", borderRadius: 14, border: "none",
            background: C.ink, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
  newHint: { textAlign: "center", fontSize: 12, color: C.muted, marginTop: 8 },
  backBtn: { border: "none", background: "transparent", color: C.muted, fontSize: 14, fontWeight: 700,
             cursor: "pointer", padding: "0 0 10px", marginLeft: -2 },

  // 폼 공통 (일정 만들기 / 참여 게이트 / 항목 모달)
  formLabel: { fontSize: 13, fontWeight: 700, color: "#6f6656", marginBottom: 7, marginTop: 18 },
  // fontSize 16 미만이면 iOS Safari가 이 입력창에 포커스될 때 화면을 자동으로 확대해버려서
  // "탭하면 사이즈가 깨진다"는 증상으로 보인다 — 16 유지 필수.
  formInput: { width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #e2dac6",
               fontSize: 16, fontFamily: "inherit", background: "#fff", color: C.ink, boxSizing: "border-box" },
  // flexWrap: 네이티브 date/select 컨트롤은 CSS로 강제로 줄여도 실제 렌더링 폭이 그대로인 경우가 있어서
  // (특히 Safari) 안 들어가면 옆으로 삐져나오는 대신 줄바꿈되게 해서 화면 밖으로 안 나가게 방어.
  formRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  formHint: { fontSize: 12, color: C.muted, marginTop: 6 },
  formError: { fontSize: 13, color: "#c0392b", marginTop: 10, fontWeight: 600 },
  // 좌표 검색 결과 여러 개 중 하나를 고르게 하는 목록 — CGV 여러 지점, 국내외 동명 지명 문제 해결.
  geoCandidateList: { display: "flex", flexDirection: "column", gap: 6, marginTop: 4 },
  geoCandidateBtn: { display: "flex", alignItems: "flex-start", gap: 8, width: "100%", textAlign: "left",
                      padding: "10px 12px", borderRadius: 12, border: "1px solid #e2dac6", background: "#fff",
                      cursor: "pointer" },
  geoCandidateFlag: { fontSize: 15, flexShrink: 0, lineHeight: "20px" },
  geoCandidateText: { display: "flex", flexDirection: "column", minWidth: 0 },
  geoCandidateLabel: { fontSize: 14, fontWeight: 700, color: C.ink },
  geoCandidateAddr: { fontSize: 11.5, color: C.muted, marginTop: 2 },
  pickerGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  pickerBtn: { padding: "10px 16px", borderRadius: 20, border: "1.5px solid #e2dac6", background: "#fff",
               color: C.ink, fontSize: 14, fontWeight: 700, cursor: "pointer" },
  pickerBtnOn: { border: `1.5px solid ${C.orange}`, background: "#fbecd9", color: C.orangeDeep },
  submitBtn: { width: "100%", marginTop: 26, padding: "15px 0", borderRadius: 14, border: "none",
               background: C.orange, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer" },
  submitBtnDisabled: { opacity: 0.5, cursor: "not-allowed" },

  // 참여 게이트
  joinWrap: { minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center",
              alignItems: "center", padding: 24, background: C.paper },
  // boxSizing 필수 — width/maxWidth에 padding+border가 더해지지 않게. 이게 빠져있어서
  // joinWrap(가운데 정렬+여유 패딩) 밖에서 이 카드를 쓰면(마이페이지 등) 실제 렌더 폭이
  // maxWidth보다 padding+border만큼 더 넓어져서 화면 밖으로 삐져나갔었다.
  joinCard: { width: "100%", maxWidth: 360, boxSizing: "border-box", background: "#fff", borderRadius: 18,
              padding: "28px 24px", border: "1px solid #efe9dc", boxShadow: "0 8px 24px rgba(0,0,0,.08)",
              textAlign: "center" },

  // 빈 상태
  emptyState: { textAlign: "center", padding: "40px 16px", color: C.muted, fontSize: 14 },

  // 공유 링크 바
  shareBar: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px dashed #ddd4c2",
              borderRadius: 12, padding: "10px 12px", marginBottom: 14 },
  shareLink: { flex: 1, minWidth: 0, fontSize: 12.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  shareCopyBtn: { border: "none", background: C.ink, color: "#fff", fontSize: 12.5, fontWeight: 700,
                  padding: "7px 12px", borderRadius: 8, cursor: "pointer", flexShrink: 0 },

  // 날짜 칩
  dayChips: { display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 2 },
  dayChip: { flexShrink: 0, padding: "8px 14px", borderRadius: 20, border: "1.5px solid #e2dac6",
             background: "#fff", color: C.ink, fontSize: 13, fontWeight: 700, cursor: "pointer" },
  dayChipOn: { border: `1.5px solid ${C.orange}`, background: C.orange, color: "#fff" },

  // 항목 리스트 카드
  itemRow: { display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 14,
             padding: "12px 14px", marginBottom: 10, border: "1px solid #efe9dc",
             boxShadow: "0 2px 8px rgba(0,0,0,.04)", transition: "background .3s, border-color .3s" },
  // 지도에서 마커를 눌러 "이 일정으로 가기" 했을 때 스크롤된 행을 잠깐 강조.
  itemRowHighlight: { background: "#fbecd9", border: `1px solid ${C.orange}` },
  itemRowBadge: { width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 16, flexShrink: 0, color: "#fff" },
  itemRowTime: { fontSize: 11.5, color: C.muted, fontWeight: 700 },
  itemRowName: { fontSize: 15, fontWeight: 800 },
  itemRowMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
  itemRowActions: { display: "flex", gap: 6, flexShrink: 0 },
  itemRowActionBtn: { border: "none", background: "#f2ede0", color: "#6f6656", width: 28, height: 28,
                      borderRadius: 8, cursor: "pointer", fontSize: 13 },
  dragHandle: { border: "none", background: "transparent", color: C.muted, fontSize: 18, lineHeight: 1,
                cursor: "grab", padding: "0 4px 0 0", flexShrink: 0, touchAction: "none" },
  addItemBtn: { width: "100%", marginTop: 4, marginBottom: 18, padding: "13px 0", borderRadius: 12,
                border: `1.5px dashed ${C.orange}`, background: "#fff", color: C.orangeDeep,
                fontSize: 14.5, fontWeight: 800, cursor: "pointer" },

  // 모달
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(58,47,36,.45)", display: "flex",
                  alignItems: "flex-end", justifyContent: "center", zIndex: 50 },
  modalSheet: { width: "100%", maxWidth: 440, maxHeight: "88vh", overflowY: "auto", background: C.paper,
                borderRadius: "20px 20px 0 0", padding: "20px 16px 28px" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: 800 },
  modalCloseBtn: { border: "none", background: "transparent", fontSize: 20, color: C.muted, cursor: "pointer" },
};
