import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C, KIND_EMOJI } from "../theme";
import { s } from "../styles";
import { WalkTtubeogi } from "../components/TtubeogiCharacter";
import { listMyPlans } from "../lib/api";
import { getKnownPlanIds } from "../lib/localPlans";
import { formatWhen, formatDday } from "../utils";
import { getMe, logout, KAKAO_LOGIN_URL } from "../lib/auth";

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

  async function handleLogout() {
    if (!window.confirm("로그아웃할까요?")) return;
    await logout();
    setMe(null);
  }

  const upcoming = (plans || []).filter((p) => p.status === "upcoming")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = (plans || []).filter((p) => p.status === "past");

  const PlanCard = ({ p, hot }) => {
    const { when, nights } = formatWhen(p.startDate, p.endDate);
    const dday = hot ? formatDday(p.startDate) : null;
    return (
      <div style={{ ...s.planCard, ...(hot ? s.planCardHot : {}) }} onClick={() => navigate(`/p/${p.id}`)}>
        <div style={s.planEmoji}>{KIND_EMOJI[p.kind] || "📅"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.planTop}>
            <span style={s.planKind}>{p.kind}</span>
            {dday && <span style={s.planDday}>{dday}</span>}
          </div>
          <div style={s.planTitle}>{p.title}</div>
          <div style={s.planWhen}>{when} · {nights}</div>
          <div style={s.planBottom}>
            <div style={s.planMembers}>
              {p.members.map((m) => (
                <span key={m.id} style={{ ...s.miniAvatar, background: m.color }}>{m.name[0]}</span>
              ))}
            </div>
            <span style={s.planSpots}>📍 {p.spots}곳</span>
          </div>
        </div>
        <div style={s.planGo}>▶</div>
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
        {me ? (
          <div style={s.profileDot} title={`${me.nickname}님으로 로그인됨`} onClick={handleLogout}>
            {me.nickname[0]}
          </div>
        ) : (
          <div style={{ width: 34, height: 34 }} />
        )}
      </div>

      <div style={s.homeGreeting}>
        어디, 누구랑 갈까요?<br />
        <span style={{ color: C.muted, fontSize: 14, fontWeight: 500 }}>
          여행이든 데이트든, 같이 만들어요
        </span>
      </div>

      {me === null && (
        <a href={KAKAO_LOGIN_URL} style={s.formHint}>
          🟡 카카오로 로그인하면 기기를 바꿔도 내 일정이 계속 보여요 →
        </a>
      )}
      {me && (
        <div style={s.formHint}>{me.nickname}님으로 로그인됨 (프로필 아이콘 눌러서 로그아웃)</div>
      )}

      {plans === null && !error && <div style={s.emptyState}>불러오는 중…</div>}
      {error && <div style={s.emptyState}>목록을 불러오지 못했어요: {error}</div>}
      {plans !== null && plans.length === 0 && (
        <div style={s.emptyState}>
          <WalkTtubeogi size={40} />
          <div style={{ marginTop: 10 }}>아직 만든 일정이 없어요.<br />첫 일정을 만들어보세요!</div>
        </div>
      )}

      {upcoming.length > 0 && (
        <>
          <div style={s.sectionLabel}>📅 다가오는 일정</div>
          {upcoming.map((p, i) => <PlanCard key={p.id} p={p} hot={i === 0} />)}
        </>
      )}

      {past.length > 0 && (
        <>
          <div style={{ ...s.sectionLabel, marginTop: 22 }}>🧳 지난 일정</div>
          {past.map((p) => <PlanCard key={p.id} p={p} />)}
        </>
      )}

      <button style={s.newBtn} onClick={() => navigate("/new")}>
        <span style={{ fontSize: 20 }}>＋</span> 새 일정 만들기
      </button>
      <div style={s.newHint}>여행 · 데이트 · 약속 — 뭐든 같이 짜요</div>
    </div>
  );
}
