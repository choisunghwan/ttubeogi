import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../theme";
import { s } from "../styles";
import { WalkTtubeogi, SittingTtubeogi, Footprint } from "../components/TtubeogiCharacter";
import { level, fmtDate, sinceLabel, formatWhen } from "../utils";
import { listMyPlans } from "../lib/api";
import { getKnownPlanIds } from "../lib/localPlans";
import { aggregateVisits } from "../lib/aggregateVisits";

// 화면 1: 나의 여행 지도 — 이 브라우저가 아는 지난 일정들을 지역별 발자국으로 집계해서 보여준다.
export default function TravelMap() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState(null); // null = 로딩 중
  const [error, setError] = useState(null);
  const [sel, setSel] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listMyPlans(getKnownPlanIds())
      .then((data) => { if (!cancelled) setPlans(data); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  if (plans === null && !error) {
    return <div style={s.pad}><div style={s.emptyState}>불러오는 중…</div></div>;
  }
  if (error) {
    return <div style={s.pad}><div style={s.emptyState}>{error}</div></div>;
  }

  const { domestic, overseas } = aggregateVisits(plans);
  const totalTrips = domestic.reduce((a, r) => a + r.visits, 0) + overseas.length;
  const regionCount = domestic.length + new Set(overseas.map((p) => p.region || p.title)).size;
  const mostName = domestic.length > 0
    ? [...domestic].sort((a, b) => b.visits - a.visits)[0].name
    : (overseas[0]?.region || overseas[0]?.title || "-");

  const upcoming = plans.filter((p) => p.status === "upcoming").sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

  return (
    <div style={s.pad}>
      <div style={s.head}>
        <WalkTtubeogi size={30} />
        <div>
          <div style={s.eyebrow}>MY TRAVEL MAP</div>
          <h1 style={s.h1}>뚜버기가 다녀온 곳</h1>
        </div>
      </div>

      {totalTrips === 0 ? (
        <div style={s.emptyState}>
          <WalkTtubeogi size={40} />
          <div style={{ marginTop: 10 }}>아직 완료된 일정이 없어요.<br />일정을 다녀오면 여기에 발자국이 쌓여요!</div>
        </div>
      ) : (
        <>
          <div style={s.stats}>
            <div style={s.stat}><div style={s.statNum}>{totalTrips}</div><div style={s.statLabel}>총 여행</div></div>
            <div style={s.stat}><div style={s.statNum}>{regionCount}</div><div style={s.statLabel}>다녀온 지역</div></div>
            <div style={s.stat}><div style={{ ...s.statNum, fontSize: 19, paddingTop: 7 }}>{mostName}</div><div style={s.statLabel}>최애 여행지</div></div>
          </div>

          <div style={s.mapFrame}>
            <svg viewBox="0 0 100 110" style={s.mapSvg}>
              <path d="M 40 6 Q 30 10 32 20 Q 24 24 26 32 Q 20 40 28 46 Q 26 56 34 60 Q 30 68 38 72 Q 40 78 48 76 Q 56 82 60 74 Q 70 70 66 60 Q 74 54 68 46 Q 76 40 70 32 Q 74 22 64 20 Q 62 8 52 8 Q 46 4 40 6 Z"
                    fill={C.land} stroke={C.landStroke} strokeWidth="0.8" />
              <ellipse cx="34" cy="90" rx="9" ry="5" fill={C.land} stroke={C.landStroke} strokeWidth="0.8" />
              {domestic.map((r) => {
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
              <div style={s.detailRow}><span style={s.detailKey}>마지막 방문</span><span>{fmtDate(sel.lastVisit)} <span style={{ color: C.muted }}>· {sinceLabel(sel.lastVisit)}</span></span></div>
              <div style={s.detailRow}><span style={s.detailKey}>다녀온 일정</span><span>{sel.planTitles.join(" · ")}</span></div>
            </div>
          ) : (
            <div style={s.hint}><WalkTtubeogi size={26} /><span>지역을 탭하면 여행 기록이 보여요</span></div>
          )}

          {overseas.length > 0 && (
            <div style={{ ...s.detail, marginTop: 0 }}>
              <div style={{ ...s.detailKey, marginBottom: 8 }}>🌍 해외</div>
              {overseas.map((p) => (
                <div key={p.id} style={s.detailRow}>
                  <span>{p.title}</span>
                  <span style={{ color: C.muted }}>{fmtDate(p.endDate)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {upcoming && (
        <div style={{ ...s.upcoming, marginTop: 14 }} onClick={() => navigate(`/p/${upcoming.id}`)}>
          <div>
            <div style={s.upLabel}>✈️ 다가오는 일정</div>
            <div style={s.upName}>{upcoming.title} · {formatWhen(upcoming.startDate, upcoming.endDate).when}</div>
          </div>
          <div style={s.upGo}>동선 보기 ▶</div>
        </div>
      )}
    </div>
  );
}
