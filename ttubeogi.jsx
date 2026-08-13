import React, { useState, useEffect, useRef, useMemo } from "react";

// ═══════════════════════════════════════════════════════════
// 뚜버기 (Ttubeogi) — 통합 데모
// [나의 지도] 한국 지도에 여행 기록이 발자국으로 쌓임
// [여행] 여행 하나를 열면 뚜버기가 동선을 뚜벅뚜벅 걸어감
// 두 화면이 하나의 앱으로 연결된다.
// ═══════════════════════════════════════════════════════════

const C = {
  ink: "#3a2f24", paper: "#faf8f3", land: "#efe7d5", landStroke: "#d9cdb2",
  orange: "#e8863a", orangeDeep: "#cf6f28", cream: "#fdf6e9", creamShade: "#f2e6cf",
  muted: "#a89f8c", water: "#cfe2e6", green: "#d5e3c8",
  routeDone: "#c2b8a3", member2: "#5b8c7b", member3: "#7a6cc4",
};

const TYPES = {
  명소: { emoji: "📍", color: "#e8863a" }, 식당: { emoji: "🍽️", color: "#d9534f" },
  카페: { emoji: "☕", color: "#8a6d3b" }, 쇼핑: { emoji: "🛍️", color: "#c0568f" },
  숙소: { emoji: "🏨", color: "#4a6fa5" }, 이동: { emoji: "🚇", color: "#5b8c7b" },
};

const REGIONS = [
  { id: "seoul", name: "서울", x: 42, y: 26, visits: 5, last: "2026-07-19", cities: ["종로", "성수", "강남"] },
  { id: "incheon", name: "인천", x: 33, y: 28, visits: 2, last: "2026-05-03", cities: ["송도", "차이나타운"] },
  { id: "gangwon", name: "강릉", x: 66, y: 24, visits: 3, last: "2026-06-14", cities: ["강릉", "속초"] },
  { id: "daejeon", name: "대전", x: 45, y: 45, visits: 1, last: "2025-11-02", cities: ["둔산"] },
  { id: "jeonju", name: "전주", x: 37, y: 56, visits: 2, last: "2026-04-21", cities: ["한옥마을"] },
  { id: "daegu", name: "대구", x: 60, y: 52, visits: 4, last: "2026-08-15", cities: ["서문시장", "김광석길", "동성로"] },
  { id: "busan", name: "부산", x: 64, y: 66, visits: 6, last: "2026-08-02", cities: ["해운대", "광안리", "감천"] },
  { id: "yeosu", name: "여수", x: 45, y: 68, visits: 1, last: "2025-09-10", cities: ["돌산"] },
  { id: "jeju", name: "제주", x: 34, y: 90, visits: 3, last: "2026-03-28", cities: ["애월", "성산", "서귀포"] },
];

const ITINERARY = [
  { time: "09:30", name: "와이탄 (The Bund)", type: "명소", move: "도보", by: 1, x: 68, y: 30, desc: "황푸강변 야경으로 유명한 상하이의 상징" },
  { time: "11:00", name: "위위안 정원", type: "명소", move: "도보", by: 2, x: 60, y: 46, desc: "명나라풍 고전 정원과 예원 상가" },
  { time: "12:30", name: "난샹 만두집", type: "식당", move: "도보", by: 2, x: 57, y: 52, desc: "샤오롱바오 원조로 알려진 곳" },
  { time: "14:00", name: "톈쯔팡", type: "쇼핑", move: "택시", by: 3, x: 40, y: 62, desc: "골목 예술구, 공방과 카페" },
  { time: "16:00", name: "시나몬 카페", type: "카페", move: "도보", by: 1, x: 44, y: 55, desc: "잠깐 쉬어가는 커피 타임" },
  { time: "18:30", name: "난징루 보행가", type: "쇼핑", move: "지하철", by: 3, x: 55, y: 22, desc: "상하이 최대 번화가, 야시장" },
  { time: "21:00", name: "숙소 (인민광장)", type: "숙소", move: "도보", by: 1, x: 50, y: 18, desc: "오늘의 여정 끝" },
];

const MEMBERS = [
  { id: 1, name: "나", color: C.orange },
  { id: 2, name: "지현", color: C.member2 },
  { id: 3, name: "민수", color: C.member3 },
];

// ── 홈 목록: 여행·데이트·약속이 한 목록에 (kind로 구분) ──
const PLANS = [
  { id: "shanghai", kind: "여행", emoji: "✈️", title: "상하이 여행", when: "9월 12일 – 15일", nights: "3박 4일",
    members: [1, 2, 3], spots: 7, status: "upcoming", dday: "D-30", openable: true },
  { id: "date-hongdae", kind: "데이트", emoji: "💕", title: "홍대 데이트", when: "8월 23일 (토)", nights: "하루",
    members: [1, 2], spots: 4, status: "upcoming", dday: "D-8", openable: false },
  { id: "meet-gangnam", kind: "약속", emoji: "🍺", title: "대학 동기 모임", when: "8월 30일 (토)", nights: "저녁",
    members: [1, 3], spots: 2, status: "upcoming", dday: "D-15", openable: false },
  { id: "busan-past", kind: "여행", emoji: "🌊", title: "부산 여행", when: "8월 1일 – 3일", nights: "2박 3일",
    members: [1, 2], spots: 9, status: "past", openable: false },
  { id: "date-seongsu", kind: "데이트", emoji: "☕", title: "성수 카페 투어", when: "7월 19일 (토)", nights: "하루",
    members: [1, 2], spots: 5, status: "past", openable: false },
];

// ═══ 캐릭터 ═════════════════════════════════════════════════
function WalkTtubeogi({ size = 40, step = 0, facing = 1, walking = false }) {
  const bob = walking ? (step % 2 === 0 ? -1.5 : 0.5) : 0;
  const legPhase = step % 2 === 0;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40"
      style={{ overflow: "visible", transform: `scaleX(${facing})`,
               filter: "drop-shadow(0 3px 3px rgba(0,0,0,.2))" }}>
      <ellipse cx="20" cy="37" rx={walking ? 8 : 9} ry="2.2" fill="rgba(0,0,0,.13)" />
      <g transform={`translate(0, ${bob})`}>
        <rect x={legPhase ? 13.5 : 15} y="29" width="3.4" height="6" rx="1.7"
              fill={C.creamShade} transform={walking && legPhase ? "rotate(-12 15 30)" : ""} />
        <rect x={legPhase ? 23 : 21.5} y="29" width="3.4" height="6" rx="1.7"
              fill={C.creamShade} transform={walking && !legPhase ? "rotate(12 24 30)" : ""} />
        <rect x="5.5" y="16" width="9" height="12" rx="4" fill={C.orange} />
        <rect x="7" y="19" width="4.5" height="5" rx="1.5" fill={C.orangeDeep} opacity="0.6" />
        <rect x="9" y="12" width="22" height="20" rx="10" fill={C.cream} stroke={C.creamShade} strokeWidth="0.8" />
        <ellipse cx="14.5" cy="23" rx="2" ry="1.3" fill="#f6c9a0" opacity="0.7" />
        <ellipse cx="26" cy="23" rx="2" ry="1.3" fill="#f6c9a0" opacity="0.7" />
        <circle cx="16.5" cy="20" r="1.7" fill={C.ink} />
        <circle cx="24" cy="20" r="1.7" fill={C.ink} />
        <circle cx="17.1" cy="19.4" r="0.55" fill="#fff" />
        <circle cx="24.6" cy="19.4" r="0.55" fill="#fff" />
        <path d="M 18.5 24 Q 20.5 26 22.5 24" fill="none" stroke={C.ink} strokeWidth="1" strokeLinecap="round" />
        <line x1="20" y1="12" x2="20" y2="8" stroke={C.orangeDeep} strokeWidth="0.9" />
        <path d="M 20 8 L 24 9.2 L 20 10.4 Z" fill={C.orange} />
      </g>
    </svg>
  );
}

function SittingTtubeogi({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40"
         style={{ overflow: "visible", filter: "drop-shadow(0 2px 3px rgba(0,0,0,.25))" }}>
      <ellipse cx="20" cy="35" rx="11" ry="2.4" fill="rgba(0,0,0,.12)" />
      <g fill="#f5c451">
        <path d="M 6 10 l 1 2.4 l 2.4 1 l -2.4 1 l -1 2.4 l -1 -2.4 l -2.4 -1 l 2.4 -1 z" />
        <path d="M 33 14 l .8 1.8 l 1.8 .8 l -1.8 .8 l -.8 1.8 l -.8 -1.8 l -1.8 -.8 l 1.8 -.8 z" />
      </g>
      <rect x="7" y="18" width="8" height="11" rx="4" fill={C.orange} />
      <path d="M 10 18 Q 10 12 20 12 Q 30 12 30 18 L 31 30 Q 31 34 20 34 Q 9 34 9 30 Z"
            fill={C.cream} stroke={C.creamShade} strokeWidth="0.8" />
      <ellipse cx="14.5" cy="22" rx="2" ry="1.3" fill="#f6c9a0" opacity="0.7" />
      <ellipse cx="26" cy="22" rx="2" ry="1.3" fill="#f6c9a0" opacity="0.7" />
      <circle cx="16.5" cy="19.5" r="1.7" fill={C.ink} />
      <circle cx="24" cy="19.5" r="1.7" fill={C.ink} />
      <circle cx="17.1" cy="18.9" r="0.55" fill="#fff" />
      <circle cx="24.6" cy="18.9" r="0.55" fill="#fff" />
      <path d="M 18 23.5 Q 20 25.5 22 23.5" fill="none" stroke={C.ink} strokeWidth="1" strokeLinecap="round" />
      <line x1="20" y1="12" x2="20" y2="8" stroke={C.orangeDeep} strokeWidth="0.9" />
      <path d="M 20 8 L 24 9.2 L 20 10.4 Z" fill={C.orange} />
    </svg>
  );
}

function Footprint({ size, opacity, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={{ opacity }}>
      <ellipse cx="10" cy="12" rx="5" ry="6.5" fill={color} />
      <ellipse cx="5.5" cy="5" rx="1.6" ry="2" fill={color} />
      <ellipse cx="9" cy="3.4" rx="1.7" ry="2.1" fill={color} />
      <ellipse cx="13" cy="4" rx="1.7" ry="2.1" fill={color} />
      <ellipse cx="15.6" cy="6.5" rx="1.4" ry="1.8" fill={color} />
    </svg>
  );
}

// ═══ 유틸 ═══════════════════════════════════════════════════
function level(v) { return v >= 5 ? 3 : v >= 3 ? 2 : 1; }
function fmtDate(str) { const [y, m, d] = str.split("-"); return `${y}.${m}.${d}`; }
function sinceLabel(str) {
  const days = Math.round((new Date("2026-08-15") - new Date(str)) / 86400000);
  if (days <= 0) return "오늘";
  if (days < 30) return `${days}일 전`;
  if (days < 365) return `${Math.round(days / 30)}개월 전`;
  return `${Math.round(days / 365)}년 전`;
}
function buildPath(points) {
  const path = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1], steps = 60, midX = a.x, midY = b.y;
    for (let st = 0; st < steps; st++) {
      const t = st / steps; let x, y;
      if (t < 0.5) { const tt = t / 0.5; x = a.x + (midX - a.x) * tt; y = a.y + (midY - a.y) * tt; }
      else { const tt = (t - 0.5) / 0.5; x = midX + (b.x - midX) * tt; y = midY + (b.y - midY) * tt; }
      path.push({ x, y, seg: i });
    }
  }
  path.push({ x: points[points.length - 1].x, y: points[points.length - 1].y, seg: points.length - 2 });
  return path;
}

// ═══ 메인 ═══════════════════════════════════════════════════
export default function Ttubeogi() {
  const [tab, setTab] = useState("home");
  return (
    <div style={s.app}>
      <style>{keyframes}</style>
      <div style={s.screen}>
        {tab === "home" && <HomeScreen onOpenTrip={() => setTab("trip")} />}
        {tab === "map" && <TravelMap onOpenTrip={() => setTab("trip")} />}
        {tab === "trip" && <TripDetail onBack={() => setTab("home")} />}
      </div>
      <div style={s.tabbar}>
        <button style={{ ...s.tabBtn, ...(tab === "home" ? s.tabOn : {}) }} onClick={() => setTab("home")}>
          <span style={s.tabIcon}>🏠</span> 홈
        </button>
        <button style={{ ...s.tabBtn, ...(tab === "map" ? s.tabOn : {}) }} onClick={() => setTab("map")}>
          <span style={s.tabIcon}>🗺️</span> 나의 지도
        </button>
      </div>
    </div>
  );
}

// ── 화면 0: 홈 (여행·데이트·약속 전체 목록) ──
function HomeScreen({ onOpenTrip }) {
  const upcoming = PLANS.filter((p) => p.status === "upcoming");
  const past = PLANS.filter((p) => p.status === "past");
  const nameOf = (id) => MEMBERS.find((m) => m.id === id);

  const PlanCard = ({ p }) => (
    <div style={{ ...s.planCard, ...(p.openable ? s.planCardHot : {}) }}
         onClick={() => p.openable && onOpenTrip()}>
      <div style={s.planEmoji}>{p.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.planTop}>
          <span style={s.planKind}>{p.kind}</span>
          {p.dday && <span style={s.planDday}>{p.dday}</span>}
        </div>
        <div style={s.planTitle}>{p.title}</div>
        <div style={s.planWhen}>{p.when} · {p.nights}</div>
        <div style={s.planBottom}>
          <div style={s.planMembers}>
            {p.members.map((id) => (
              <span key={id} style={{ ...s.miniAvatar, background: nameOf(id)?.color }}>
                {nameOf(id)?.name[0]}
              </span>
            ))}
          </div>
          <span style={s.planSpots}>📍 {p.spots}곳</span>
        </div>
      </div>
      {p.openable && <div style={s.planGo}>▶</div>}
    </div>
  );

  return (
    <div style={s.pad}>
      <div style={s.homeHead}>
        <div>
          <div style={s.eyebrow}>TTUBEOGI</div>
          <h1 style={{ ...s.h1, display: "flex", alignItems: "center", gap: 6 }}>
            <WalkTtubeogi size={28} /> 뚜버기
          </h1>
        </div>
        <div style={s.profileDot}>나</div>
      </div>

      <div style={s.homeGreeting}>
        어디, 누구랑 갈까요?<br />
        <span style={{ color: C.muted, fontSize: 14, fontWeight: 500 }}>
          여행이든 데이트든, 같이 만들어요
        </span>
      </div>

      <div style={s.sectionLabel}>📅 다가오는 일정</div>
      {upcoming.map((p) => <PlanCard key={p.id} p={p} />)}

      <div style={{ ...s.sectionLabel, marginTop: 22 }}>🧳 지난 일정</div>
      {past.map((p) => <PlanCard key={p.id} p={p} />)}

      <button style={s.newBtn} onClick={onOpenTrip}>
        <span style={{ fontSize: 20 }}>＋</span> 새 일정 만들기
      </button>
      <div style={s.newHint}>여행 · 데이트 · 약속 — 뭐든 같이 짜요</div>
    </div>
  );
}

// ── 화면 1: 나의 여행 지도 ──
function TravelMap({ onOpenTrip }) {
  const [sel, setSel] = useState(null);
  const total = REGIONS.reduce((a, r) => a + r.visits, 0);
  const most = [...REGIONS].sort((a, b) => b.visits - a.visits)[0];
  return (
    <div style={s.pad}>
      <div style={s.head}>
        <WalkTtubeogi size={30} />
        <div>
          <div style={s.eyebrow}>MY TRAVEL MAP</div>
          <h1 style={s.h1}>뚜버기가 다녀온 곳</h1>
        </div>
      </div>

      <div style={s.stats}>
        <div style={s.stat}><div style={s.statNum}>{total}</div><div style={s.statLabel}>총 여행</div></div>
        <div style={s.stat}><div style={s.statNum}>{REGIONS.length}</div><div style={s.statLabel}>다녀온 지역</div></div>
        <div style={s.stat}><div style={{ ...s.statNum, fontSize: 19, paddingTop: 7 }}>{most.name}</div><div style={s.statLabel}>최애 여행지</div></div>
      </div>

      <div style={s.mapFrame}>
        <svg viewBox="0 0 100 110" style={s.mapSvg}>
          <path d="M 40 6 Q 30 10 32 20 Q 24 24 26 32 Q 20 40 28 46 Q 26 56 34 60 Q 30 68 38 72 Q 40 78 48 76 Q 56 82 60 74 Q 70 70 66 60 Q 74 54 68 46 Q 76 40 70 32 Q 74 22 64 20 Q 62 8 52 8 Q 46 4 40 6 Z"
                fill={C.land} stroke={C.landStroke} strokeWidth="0.8" />
          <ellipse cx="34" cy="90" rx="9" ry="5" fill={C.land} stroke={C.landStroke} strokeWidth="0.8" />
          {REGIONS.map((r) => {
            const lv = level(r.visits), isSel = sel?.id === r.id;
            const fpSize = lv === 1 ? 15 : 20, fpOp = lv === 1 ? 0.55 : 0.9;
            const fpColor = lv >= 2 ? C.orangeDeep : C.orange;
            return (
              <g key={r.id} transform={`translate(${r.x}, ${r.y})`} style={{ cursor: "pointer" }} onClick={() => setSel(r)}>
                {isSel && <circle r="9" fill={C.orange} opacity="0.15" />}
                <foreignObject x="-8" y="-8" width="16" height="16" style={{ overflow: "visible", pointerEvents: "none" }}>
                  {lv === 3
                    ? <div style={{ transform: "translate(-9px,-16px)" }}><SittingTtubeogi size={30} /></div>
                    : <div style={{ transform: `translate(${-fpSize / 2 + 8}px,${-fpSize / 2 + 8}px)` }}><Footprint size={fpSize} opacity={fpOp} color={fpColor} /></div>}
                </foreignObject>
                {r.visits >= 2 && (
                  <g transform="translate(5, -6)">
                    <circle r="3.4" fill="#fff" stroke={fpColor} strokeWidth="0.8" />
                    <text textAnchor="middle" y="1.3" fontSize="4" fontWeight="700" fill={fpColor}>{r.visits}</text>
                  </g>
                )}
                <text textAnchor="middle" y={lv === 3 ? 14 : 12} fontSize="3.6"
                      fontWeight={isSel ? 800 : 600} fill={isSel ? C.orangeDeep : C.ink}>{r.name}</text>
              </g>
            );
          })}
        </svg>
        <div style={s.legend}>
          <span style={s.legendItem}><Footprint size={13} opacity={0.55} color={C.orange} /> 1회</span>
          <span style={s.legendItem}><Footprint size={15} opacity={0.9} color={C.orangeDeep} /> 3회+</span>
          <span style={s.legendItem}>🪑 5회+ 단골</span>
        </div>
      </div>

      {sel ? (
        <div style={s.detail}>
          <div style={s.detailHead}>
            <span style={s.detailName}>{sel.name}</span>
            <span style={s.detailVisits}><b style={{ color: C.orangeDeep, fontSize: 20 }}>{sel.visits}</b>번 다녀옴</span>
          </div>
          <div style={s.detailRow}><span style={s.detailKey}>마지막 방문</span><span>{fmtDate(sel.last)} <span style={{ color: C.muted }}>· {sinceLabel(sel.last)}</span></span></div>
          <div style={s.detailRow}><span style={s.detailKey}>가본 곳</span><span>{sel.cities.join(" · ")}</span></div>
        </div>
      ) : (
        <div style={s.hint}><WalkTtubeogi size={26} /><span>지역을 탭하면 여행 기록이 보여요</span></div>
      )}

      <div style={s.upcoming} onClick={onOpenTrip}>
        <div>
          <div style={s.upLabel}>✈️ 다가오는 여행</div>
          <div style={s.upName}>상하이 · 9월 12일</div>
        </div>
        <div style={s.upGo}>동선 보기 ▶</div>
      </div>
    </div>
  );
}

// ── 화면 2: 여행 상세 (동선) ──
function TripDetail({ onBack }) {
  const [current, setCurrent] = useState(0);
  const [walkPos, setWalkPos] = useState({ x: ITINERARY[0].x, y: ITINERARY[0].y });
  const [walking, setWalking] = useState(false);
  const [facing, setFacing] = useState(1);
  const [step, setStep] = useState(0);
  const rafRef = useRef(null);
  const fullPath = useMemo(() => buildPath(ITINERARY), []);

  const walkTo = (targetIdx) => {
    if (walking) return;
    const clamped = Math.max(0, Math.min(ITINERARY.length - 1, targetIdx));
    if (clamped === current) return;
    const from = Math.min(current, clamped), to = Math.max(current, clamped);
    let seg = fullPath.filter((p) => p.seg >= from && p.seg < to);
    if (clamped < current) seg = seg.reverse();
    if (seg.length === 0) { setCurrent(clamped); return; }
    setWalking(true);
    let i = 0;
    const animate = () => {
      if (i >= seg.length) {
        setWalkPos({ x: ITINERARY[clamped].x, y: ITINERARY[clamped].y });
        setCurrent(clamped); setWalking(false); return;
      }
      const p = seg[i], prev = seg[i - 1] || walkPos;
      setFacing(p.x >= prev.x ? 1 : -1);
      setWalkPos({ x: p.x, y: p.y });
      setStep((v) => (v + 1) % 4);
      i += 1;
      rafRef.current = requestAnimationFrame(() => setTimeout(animate, 16));
    };
    animate();
  };
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const cur = ITINERARY[current];
  const progress = Math.round(((current + 1) / ITINERARY.length) * 100);

  return (
    <div style={s.pad}>
      <button style={s.backBtn} onClick={onBack}>◀ 홈</button>
      <div style={s.tripHead}>
        <div>
          <div style={s.eyebrow}>상하이 · 2026</div>
          <h1 style={{ ...s.h1, display: "flex", alignItems: "center", gap: 6 }}>
            <WalkTtubeogi size={26} /> 상하이 여행
          </h1>
          <div style={s.subtitle}>9월 12일 (토) · 셋이 함께 만드는 하루</div>
        </div>
        <div style={s.members}>
          {MEMBERS.map((m) => <div key={m.id} style={{ ...s.avatar, background: m.color }}>{m.name[0]}</div>)}
          <div style={s.liveDot} />
        </div>
      </div>

      <div style={s.progressRow}>
        <span style={s.progressLabel}>오늘의 여정 {current + 1} / {ITINERARY.length}</span>
        <div style={s.progressTrack}><div style={{ ...s.progressFill, width: `${progress}%` }} /></div>
      </div>

      <div style={s.tripMapFrame}>
        <svg viewBox="0 0 100 75" style={s.mapSvg} preserveAspectRatio="xMidYMid slice">
          <rect x="0" y="0" width="100" height="75" fill={C.paper} />
          <path d="M 72 0 Q 78 20 74 40 Q 70 60 80 75 L 100 75 L 100 0 Z" fill={C.water} opacity="0.9" />
          <circle cx="38" cy="60" r="9" fill={C.green} opacity="0.7" />
          <rect x="48" y="14" width="16" height="8" rx="2" fill={C.green} opacity="0.6" />
          <polyline points={fullPath.filter((p) => p.seg < current).map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none" stroke={C.routeDone} strokeWidth="1.1" strokeLinecap="round" strokeDasharray="0.1 2.4" />
          <polyline points={fullPath.filter((p) => p.seg >= current).map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none" stroke={C.orange} strokeWidth="1.3" strokeLinecap="round" strokeDasharray="0.1 2.6" opacity="0.85" />
          {ITINERARY.map((it, i) => {
            const t = TYPES[it.type], active = i === current, done = i < current;
            return (
              <g key={i} transform={`translate(${it.x}, ${it.y})`} style={{ cursor: "pointer" }} onClick={() => walkTo(i)}>
                <circle r={active ? 3.4 : 2.6} fill={done ? C.routeDone : t.color} stroke="#fff" strokeWidth="0.7"
                        style={active ? { filter: "drop-shadow(0 0 2px rgba(232,134,58,.8))" } : {}} />
                <text y="1.3" textAnchor="middle" fontSize={active ? "3" : "2.4"}>{i + 1}</text>
              </g>
            );
          })}
        </svg>
        <div style={{ position: "absolute", left: `${walkPos.x}%`, top: `${(walkPos.y / 75) * 100}%`,
                      transform: "translate(-50%, -78%)", transition: walking ? "none" : "left .3s, top .3s",
                      pointerEvents: "none", zIndex: 5 }}>
          <WalkTtubeogi size={40} step={step} facing={facing} walking={walking} />
        </div>
        <div style={s.bubble}><b>{cur.time}</b> {cur.name}</div>
      </div>

      <div style={s.card}>
        <div style={s.cardHead}>
          <span style={{ ...s.typeBadge, background: TYPES[cur.type].color }}>{TYPES[cur.type].emoji} {cur.type}</span>
          <span style={s.cardTime}>{cur.time}</span>
        </div>
        <div style={s.cardName}>{cur.name}</div>
        <div style={s.cardDesc}>{cur.desc}</div>
        <div style={s.cardMeta}>
          <span>🚶 {cur.move}</span>
          <span style={{ color: MEMBERS.find((m) => m.id === cur.by)?.color, fontWeight: 600 }}>
            {MEMBERS.find((m) => m.id === cur.by)?.name} 추가
          </span>
        </div>
      </div>

      <div style={s.nav}>
        <button style={{ ...s.navBtn, ...s.navPrev }} disabled={walking || current === 0} onClick={() => walkTo(current - 1)}>◀ 이전</button>
        <button style={{ ...s.navBtn, ...s.navNow }} onClick={() => { setCurrent(0); setWalkPos({ x: ITINERARY[0].x, y: ITINERARY[0].y }); }}>처음</button>
        <button style={{ ...s.navBtn, ...s.navNext }} disabled={walking || current === ITINERARY.length - 1} onClick={() => walkTo(current + 1)}>
          {current === ITINERARY.length - 1 ? "도착 🎉" : "다음 ▶"}
        </button>
      </div>
      {current === ITINERARY.length - 1 && <div style={s.done}>🎉 오늘의 여정 끝! 즐거운 여행!</div>}
    </div>
  );
}

const keyframes = `@keyframes pulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }`;

const s = {
  app: {
    maxWidth: 440, margin: "0 auto", minHeight: "100vh", background: C.paper,
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
    color: C.ink, display: "flex", flexDirection: "column", position: "relative",
  },
  screen: { flex: 1, paddingBottom: 70 },
  pad: { padding: "18px 16px 20px" },
  tabbar: {
    position: "sticky", bottom: 0, display: "flex", gap: 6, padding: "8px 12px",
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
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 },
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
};
