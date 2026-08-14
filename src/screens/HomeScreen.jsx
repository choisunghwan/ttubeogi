import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../theme";
import { s } from "../styles";
import { WalkTtubeogi } from "../components/TtubeogiCharacter";
import KindIcon from "../components/KindIcon";
import { PersonIcon, CalendarIcon, SuitcaseIcon, KakaoDotIcon } from "../components/Icons";
import { listMyPlans } from "../lib/api";
import { getKnownPlanIds } from "../lib/localPlans";
import { formatWhen, formatDday } from "../utils";
import { getMe, KAKAO_LOGIN_URL } from "../lib/auth";

// 종류별 보딩패스 상단 라벨 — 실제 항공권/티켓 발권 용지에 찍히는 문구 느낌으로.
const TICKET_EYEBROW = { 여행: "BOARDING PASS", 데이트: "RESERVATION", 약속: "INVITATION" };

// 화면 0: 홈 (여행·데이트·약속 전체 목록) — 이 브라우저가 만들었거나 참여한 일정 + (로그인 시) 계정 소유 일정.
export default function HomeScreen() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState(null); // null = 로딩 중
  const [error, setError] = useState(null);
  const [me, setMe] = useState(undefined); // undefined = 확인 중, null = 비로그인

  useEffect(() => {
    let cancelled = false;
    getMe().then((u) => { if (!cancelled) setMe(u); });
    listMyPlans(getKnownPlanIds())
      .then((data) => { if (!cancelled) setPlans(data); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  const upcoming = (plans || []).filter((p) => p.status === "upcoming")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = (plans || []).filter((p) => p.status === "past");

  // 보딩패스(항공권) 형태 — 본문(왼쪽) + 절취선(펀치 노치) + 스텁(오른쪽)의 실제 티켓 구조를 그대로 흉내.
  const PlanCard = ({ p, hot }) => {
    const { when, nights } = formatWhen(p.startDate, p.endDate);
    // 40px 원형 뱃지에 넣을 거라 "오늘 출발! D-DAY" 같은 긴 문구는 짧게 줄인다.
    const ddayFull = p.status === "upcoming" ? formatDday(p.startDate) : null;
    const dday = ddayFull === "오늘 출발! D-DAY" ? "D-DAY" : ddayFull;
    const past = p.status === "past";
    return (
      <div style={{ ...s.ticketCard, ...(hot ? s.ticketCardHot : {}), ...(past ? s.ticketCardPast : {}) }}
           onClick={() => navigate(`/p/${p.id}`)}>
        <div style={s.ticketMain}>
          <div style={s.ticketEyebrow}>{TICKET_EYEBROW[p.kind] || "ITINERARY"}</div>
          <div style={s.ticketTitle}>{p.title}</div>
          <div style={s.ticketWhen}>{when} · {nights}</div>
          <div style={s.ticketBottom}>
            <div style={s.planMembers}>
              {p.members.map((m) => (
                <span key={m.id} style={{ ...s.miniAvatar, background: m.color }}>{m.name[0]}</span>
              ))}
            </div>
            <span style={s.planSpots}>{p.spots}곳</span>
          </div>
          {past && <div style={s.ticketStampDone}>COMPLETE</div>}
        </div>
        {past ? (
          <div style={s.ticketPerforationTorn} />
        ) : (
          <>
            <div style={s.ticketNotchTop} />
            <div style={s.ticketPerforation} />
            <div style={s.ticketNotchBottom} />
          </>
        )}
        <div style={{ ...s.ticketStub, ...(past ? s.ticketStubTorn : {}) }}>
          <KindIcon kind={p.kind} size={20} color={C.gold} />
          {dday && <div style={s.ticketStubDday}>{dday}</div>}
          <div style={s.ticketStubGo}>GO</div>
          <div style={s.ticketBarcode} />
        </div>
      </div>
    );
  };

  return (
    <div style={s.pad}>
      <div style={s.homeHead}>
        <div>
          <div style={s.eyebrow}>TTUBEOGI</div>
          <h1 style={{ ...s.h1, display: "flex", alignItems: "center", gap: 6 }}>
            <WalkTtubeogi size={28} /> 뚜버기
          </h1>
        </div>
        <div style={s.profileDot} title="마이페이지" onClick={() => navigate("/me")}>
          {me ? me.nickname[0] : <PersonIcon size={16} color="#fff" />}
        </div>
      </div>

      <div style={s.homeGreeting}>
        어디, 누구랑 갈까요?<br />
        <span style={{ color: C.muted, fontSize: 14, fontWeight: 500 }}>
          여행이든 데이트든, 같이 만들어요
        </span>
      </div>

      {me === null && (
        <a href={KAKAO_LOGIN_URL} style={{ ...s.formHint, display: "inline-flex", alignItems: "center", gap: 5 }}>
          <KakaoDotIcon size={13} /> 카카오로 로그인하면 기기를 바꿔도 내 일정이 계속 보여요 →
        </a>
      )}

      {plans === null && !error && <div style={s.emptyState}>불러오는 중…</div>}
      {error && <div style={s.emptyState}>목록을 불러오지 못했어요: {error}</div>}
      {plans !== null && plans.length === 0 && (
        <div style={s.emptyState}>
          <WalkTtubeogi size={40} />
          <div style={{ marginTop: 10 }}>아직 만든 일정이 없어요.<br />첫 일정을 만들어보세요!</div>
          <button style={{ ...s.newBtn, maxWidth: 260, margin: "16px auto 0" }} onClick={() => navigate("/new")}>
            <span style={{ fontSize: 20 }}>＋</span> 새 일정 만들기
          </button>
        </div>
      )}

      {upcoming.length > 0 && (
        <>
          <div style={s.sectionLabel}>
            <CalendarIcon size={13} color="#6f6656" /> 다가오는 일정
          </div>
          {upcoming.map((p, i) => <PlanCard key={p.id} p={p} hot={i === 0} />)}
        </>
      )}

      {past.length > 0 && (
        <>
          <div style={{ ...s.sectionLabel, marginTop: 22 }}>
            <SuitcaseIcon size={13} color="#6f6656" /> 지난 일정
          </div>
          {past.map((p) => <PlanCard key={p.id} p={p} />)}
        </>
      )}

      {plans !== null && plans.length > 0 && (
        <button style={s.fab} title="새 일정 만들기" onClick={() => navigate("/new")}>＋</button>
      )}
    </div>
  );
}
