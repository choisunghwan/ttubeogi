import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C, SERIF_EN } from "../theme";
import { s } from "../styles";
import { WalkTtubeogi } from "../components/TtubeogiCharacter";
import { GlobeIcon, PlaneBadgeIcon } from "../components/Icons";
import { fmtDate, sinceLabel, formatWhen } from "../utils";
import { KOREA_MAINLAND_PATHS, KOREA_JEJU_PATH } from "../data/koreaMapPaths";
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
              {/* 실제 대한민국 시/도 경계 데이터 기반 윤곽(src/data/koreaMapPaths.js). 도 경계선이
                  옅게 보이지만 전부 같은 색으로 채워서 하나의 국토처럼 보이게 함. */}
              {KOREA_MAINLAND_PATHS.map((d, i) => (
                <path key={i} d={d} fill={C.land} stroke={C.landStroke} strokeWidth="0.3" />
              ))}
              <path d={KOREA_JEJU_PATH} fill={C.land} stroke={C.landStroke} strokeWidth="0.3" />
              {/* 발자국 그림 대신 방문 횟수 숫자만 깔끔하게 — 캐릭터/발바닥 아이콘이 커서
                  안 이쁘고 고급스럽지 않다는 피드백으로 단순화. 5회 이상(단골)만 채워진
                  원으로 살짝 구분하고, 그 외엔 전부 같은 크기의 테두리 원 + 숫자. */}
              {domestic.map((r) => {
                const isSel = sel?.id === r.id;
                const isRegular = r.visits >= 5;
                return (
                  <g key={r.id} transform={`translate(${r.x}, ${r.y})`} style={{ cursor: "pointer" }} onClick={() => setSel(r)}>
                    {isSel && <circle r="7" fill={C.gold} opacity="0.15" />}
                    <circle r="4.3" fill={isRegular ? C.gold : "#fff"} stroke={C.gold} strokeWidth="0.7" />
                    <text textAnchor="middle" y="1.4" fontFamily={SERIF_EN} fontSize="4.4" fontWeight="700"
                          fill={isRegular ? "#fff" : C.goldDeep}>{r.visits}</text>
                    <text textAnchor="middle" y="9.3" fontSize="3.6"
                          fontWeight={isSel ? 800 : 600} fill={isSel ? C.goldDeep : C.ink}>{r.name}</text>
                  </g>
                );
              })}
            </svg>
            <div style={s.legend}>
              <span style={s.legendItem}>
                <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill={C.gold} /></svg>
                5회 이상 다녀온 단골 여행지
              </span>
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
              <div style={{ ...s.detailKey, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <GlobeIcon size={13} color={C.muted} /> 해외 (지도 밖 지역이라 목록으로 모아둠)
              </div>
              {overseas.map((p) => (
                <div key={p.id} style={s.detailRow}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <PlaneBadgeIcon size={12} color={C.orangeDeep} /> {p.title}{p.region ? ` · ${p.region}` : ""}
                  </span>
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
            <div style={{ ...s.upLabel, display: "flex", alignItems: "center", gap: 5 }}>
              <PlaneBadgeIcon size={12} color="currentColor" /> 다가오는 일정
            </div>
            <div style={s.upName}>{upcoming.title} · {formatWhen(upcoming.startDate, upcoming.endDate).when}</div>
          </div>
          <div style={s.upGo}>동선 보기 ▶</div>
        </div>
      )}
    </div>
  );
}
