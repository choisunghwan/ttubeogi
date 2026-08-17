import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../theme";
import { s } from "../styles";
import { WalkTtubeogi } from "../components/TtubeogiCharacter";
import KindIcon from "../components/KindIcon";
import { HeartIcon } from "../components/Icons";
import { listCommunityPlans, likeCommunityPlan, unlikeCommunityPlan, importCommunityPlan } from "../lib/api";
import { rememberPlan } from "../lib/localPlans";
import { formatWhen } from "../utils";
import { getMe } from "../lib/auth";

const TICKET_EYEBROW = { 여행: "BOARDING PASS", 데이트: "RESERVATION", 약속: "INVITATION" };
const PAGE_SIZE = 20;

// 다른 사람들이 공개한 일정 패키지를 좋아요 순/최신순으로 둘러보고, "담기"로 내 일정에
// 그대로 가져올 수 있는 화면. HomeScreen의 보딩패스 카드 구조를 그대로 쓰되, 스텁(오른쪽
// 끝) 자리의 D-day/GO를 좋아요 버튼 + 담기 버튼으로 바꿨다.
export default function CommunityScreen() {
  const navigate = useNavigate();
  const [sort, setSort] = useState("popular");
  const [plans, setPlans] = useState(null); // null = 로딩 중
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [me, setMe] = useState(undefined); // undefined = 확인 중, null = 비로그인
  const [importingId, setImportingId] = useState(null);

  useEffect(() => { getMe().then(setMe); }, []);

  useEffect(() => {
    let cancelled = false;
    setPlans(null);
    setError(null);
    listCommunityPlans({ sort, limit: PAGE_SIZE, offset: 0 })
      .then((data) => {
        if (cancelled) return;
        setPlans(data);
        setHasMore(data.length === PAGE_SIZE);
      })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [sort]);

  async function loadMore() {
    if (loadingMore || !plans) return;
    setLoadingMore(true);
    try {
      const more = await listCommunityPlans({ sort, limit: PAGE_SIZE, offset: plans.length });
      setPlans((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE_SIZE);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingMore(false);
    }
  }

  // 서버 응답 기다리지 않고 먼저 하트/카운트부터 바꿔서 즉각 반응한 것처럼 보이게 하고,
  // 실패하면 되돌린다 — PlanScreen의 드래그 재정렬과 같은 낙관적 업데이트 패턴.
  async function toggleLike(p) {
    if (!me) {
      window.alert("로그인 후 좋아요를 누를 수 있어요.");
      return;
    }
    const wasLiked = p.likedByMe;
    setPlans((prev) => prev.map((x) => (
      x.id === p.id ? { ...x, likedByMe: !wasLiked, likeCount: x.likeCount + (wasLiked ? -1 : 1) } : x
    )));
    try {
      await (wasLiked ? unlikeCommunityPlan(p.id) : likeCommunityPlan(p.id));
    } catch (e) {
      setPlans((prev) => prev.map((x) => (
        x.id === p.id ? { ...x, likedByMe: wasLiked, likeCount: x.likeCount + (wasLiked ? 1 : -1) } : x
      )));
      window.alert(e.message);
    }
  }

  async function handleImport(p) {
    const creatorName = me?.nickname || window.prompt("일정에 표시될 이름을 입력하세요");
    if (!creatorName?.trim()) return;
    setImportingId(p.id);
    try {
      const { id, memberId } = await importCommunityPlan(p.id, creatorName.trim());
      rememberPlan(id, memberId);
      navigate(`/p/${id}`);
    } catch (e) {
      window.alert(e.message);
      setImportingId(null);
    }
  }

  const CommunityPlanCard = ({ p }) => {
    const { when, nights } = formatWhen(p.startDate, p.endDate);
    return (
      <div style={{ ...s.ticketCard, cursor: "default" }}>
        <div style={s.ticketMain}>
          <div style={s.ticketEyebrow}>{TICKET_EYEBROW[p.kind] || "ITINERARY"}</div>
          <div style={s.ticketTitle}>{p.title}</div>
          <div style={s.ticketWhen}>{when} · {nights}{p.region ? ` · ${p.region}` : ""}</div>
          <div style={s.ticketBottom}>
            <span style={s.communityPublisher}>게시자 · {p.publisherNickname}</span>
            <span style={s.planSpots}>{p.spots}곳</span>
          </div>
        </div>
        <div style={s.ticketNotchTop} />
        <div style={s.ticketPerforation} />
        <div style={s.ticketNotchBottom} />
        <div style={s.ticketStub}>
          <KindIcon kind={p.kind} size={18} color={C.gold} />
          <button style={s.communityLikeBtn} disabled={me === undefined} onClick={() => toggleLike(p)}>
            <HeartIcon size={18} color={p.likedByMe ? "#c0392b" : C.textMuted} filled={p.likedByMe} />
            <span style={s.communityLikeCount}>{p.likeCount}</span>
          </button>
          <button style={s.communityImportBtn} disabled={importingId === p.id} onClick={() => handleImport(p)}>
            {importingId === p.id ? "담는 중…" : "＋ 담기"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={s.pad}>
      <div style={s.homeHead}>
        <div>
          <div style={s.eyebrow}>COMMUNITY</div>
          <h1 style={s.h1}>커뮤니티</h1>
        </div>
      </div>

      <div style={{ ...s.pickerGrid, flexWrap: "nowrap", marginBottom: 14 }}>
        <button style={{ ...s.pickerBtn, flex: 1, ...(sort === "popular" ? s.pickerBtnOn : {}) }}
                onClick={() => setSort("popular")}>
          인기순
        </button>
        <button style={{ ...s.pickerBtn, flex: 1, ...(sort === "recent" ? s.pickerBtnOn : {}) }}
                onClick={() => setSort("recent")}>
          최신순
        </button>
      </div>

      {plans === null && !error && <div style={s.emptyState}>불러오는 중…</div>}
      {error && <div style={s.emptyState}>목록을 불러오지 못했어요: {error}</div>}
      {plans !== null && plans.length === 0 && (
        <div style={s.emptyState}>
          <WalkTtubeogi size={40} />
          <div style={{ marginTop: 10 }}>아직 공유된 일정이 없어요.<br />내 일정을 커뮤니티에 공유해보세요!</div>
        </div>
      )}

      {plans?.map((p) => <CommunityPlanCard key={p.id} p={p} />)}

      {plans !== null && plans.length > 0 && hasMore && (
        <button style={{ ...s.pickerBtn, width: "100%", marginTop: 4 }} disabled={loadingMore} onClick={loadMore}>
          {loadingMore ? "불러오는 중…" : "더보기"}
        </button>
      )}
    </div>
  );
}
