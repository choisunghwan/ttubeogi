import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { C, themedColor } from "../theme";
import { s } from "../styles";
import { WalkTtubeogi } from "../components/TtubeogiCharacter";
import ItemFormModal from "../components/ItemFormModal";
import CopyItemModal from "../components/CopyItemModal";
import EditPlanModal from "../components/EditPlanModal";
import PlanMap from "../components/PlanMap";
import ItemRow from "../components/ItemRow";
import TicketCard from "../components/TicketCard";
import { ListIcon, MapPinIcon, TicketIcon, ShareIcon, RouteIcon } from "../components/Icons";
import { getPlan, joinPlan, deleteItem, reorderItems, updateItem } from "../lib/api";
import { optimizeRouteOrder } from "../lib/routeOptimize";
import { getMemberId, rememberPlan } from "../lib/localPlans";
import { formatWhen, formatDday } from "../utils";
import { usePlanSocket } from "../lib/ws";
import { getMe, KAKAO_LOGIN_URL } from "../lib/auth";

function JoinGate({ planId, onJoined }) {
  const navigate = useNavigate();
  const [me, setMe] = useState(undefined); // undefined = 확인 중, null = 비로그인
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { getMe().then(setMe); }, []);

  async function join(nameToUse) {
    setJoining(true);
    setError(null);
    try {
      const { memberId } = await joinPlan(planId, nameToUse);
      rememberPlan(planId, memberId);
      onJoined(memberId);
    } catch (err) {
      setError(err.message);
      setJoining(false);
    }
  }

  return (
    <div style={s.joinWrap}>
      <div style={s.joinCard}>
        <WalkTtubeogi size={48} />
        <h2 style={{ ...s.h1, marginTop: 12, marginBottom: 4 }}>일정에 참여하기</h2>

        {me ? (
          <>
            <div style={{ color: C.muted, fontSize: 13.5, marginBottom: 8 }}>
              {me.nickname}님으로 참여할게요.
            </div>
            {error && <div style={s.formError}>{error}</div>}
            <button style={{ ...s.submitBtn, ...(joining ? s.submitBtnDisabled : {}) }} disabled={joining}
                    onClick={() => join(null)}>
              {joining ? "참여하는 중…" : `${me.nickname}님으로 참여하기`}
            </button>
          </>
        ) : (
          <>
            <div style={{ color: C.muted, fontSize: 13.5, marginBottom: 8 }}>
              로그인 없이 이름만 입력하면 바로 같이 만들 수 있어요.
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) join(name.trim()); }}>
              <input style={s.formInput} value={name} onChange={(e) => setName(e.target.value)}
                     placeholder="이름을 입력하세요" autoFocus />
              {error && <div style={s.formError}>{error}</div>}
              <button type="submit" style={{ ...s.submitBtn, ...((!name.trim() || joining) ? s.submitBtnDisabled : {}) }}
                      disabled={!name.trim() || joining}>
                {joining ? "참여하는 중…" : "참여하기"}
              </button>
            </form>
            <a href={KAKAO_LOGIN_URL} style={{ ...s.formHint, display: "block", marginTop: 10 }}>
              🟡 카카오로 로그인하고 참여하기
            </a>
          </>
        )}

        <button style={{ ...s.backBtn, marginTop: 14 }} onClick={() => navigate("/")}>◀ 홈으로</button>
      </div>
    </div>
  );
}

export default function PlanScreen() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [memberId, setMemberId] = useState(() => getMemberId(planId));
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [modalState, setModalState] = useState(null); // { item? } | null — dayId는 selectedDayId 사용
  const [copyingItem, setCopyingItem] = useState(null); // 복사할 항목 | null
  const [copied, setCopied] = useState(false);
  const [viewTab, setViewTab] = useState("list"); // "list" | "map"
  const [editingPlan, setEditingPlan] = useState(false);
  const [highlightItemId, setHighlightItemId] = useState(null);
  const [preOptimizeOrder, setPreOptimizeOrder] = useState(null); // { dayId, itemIds } | null — 동선 최적화 직전 순서(되돌리기용)

  // 지도에서 마커를 탭했을 때 "이 일정으로 가기" — 리스트 탭으로 바꾸고 해당 행으로 스크롤 + 잠깐 강조.
  function goToItem(itemId) {
    setViewTab("list");
    setHighlightItemId(itemId);
    setTimeout(() => {
      document.getElementById(`item-${itemId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    setTimeout(() => setHighlightItemId((prev) => (prev === itemId ? null : prev)), 1800);
  }

  function reload() {
    getPlan(planId)
      .then((data) => {
        setPlan(data);
        setSelectedDayId((prev) => prev || data.days[0]?.id || null);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (memberId) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, memberId]);

  // 누군가 항목을 추가/수정/삭제하거나 새로 참여하면 신호를 받아 전체를 다시 불러온다.
  const { connected } = usePlanSocket(planId, reload);

  // distance 제약을 걸어야 손잡이를 살짝 탭하는 것과 실제로 끌어서 옮기는 걸 구분함(터치에서도 동작).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  if (!memberId) {
    return <JoinGate planId={planId} onJoined={setMemberId} />;
  }
  if (error) {
    return (
      <div style={s.pad}>
        <button style={s.backBtn} onClick={() => navigate("/")}>◀ 홈</button>
        <div style={s.emptyState}>{error}</div>
      </div>
    );
  }
  if (!plan) {
    return <div style={s.pad}><div style={s.emptyState}>불러오는 중…</div></div>;
  }

  const { when, nights } = formatWhen(plan.startDate, plan.endDate);
  const dday = plan.status === "upcoming" ? formatDday(plan.startDate) : null;
  const selectedDay = plan.days.find((d) => d.id === selectedDayId) || plan.days[0];
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  // "티켓" 탭 — 매번 날짜별로 뒤져서 찾지 않아도 항공편/바우처/첨부파일 있는 항목만
  // 전체 일정(모든 날짜)에서 모아 한 번에 보여준다. 항공편 항목은 실제 항공권처럼
  // 출발/도착 구간으로 보여주려고, 전체 일정을 순서대로 쭉 펼친 다음 "바로 다음 항목"을
  // 도착지로 취급한다(항공=이 항목에서 다음 장소로 갈 때 비행기를 탄다는 의미라서 맞아떨어짐).
  const flatItems = plan.days.flatMap((d, i) =>
    d.items.map((it) => ({
      ...it,
      dayLabel: plan.days.length > 1 ? `${i + 1}일차 · ${d.date.slice(5).replace("-", "/")}` : d.date.slice(5).replace("-", "/"),
    }))
  );
  const ticketItems = flatItems
    .map((it, idx) => ({ item: it, dayLabel: it.dayLabel, nextItem: flatItems[idx + 1] || null }))
    .filter(({ item }) => item.flightNo || item.voucher || item.attachmentName);

  function copyShareLink() {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  // 기기가 지원하면(대부분 모바일 브라우저) 카카오톡/메시지 등으로 바로 공유하는 시스템 공유창을 띄운다.
  // 미지원 브라우저에서는 버튼 자체를 안 보여주고 "링크 복사"만 남긴다.
  async function shareNative() {
    try {
      await navigator.share({ title: plan.title, text: `${plan.title} 일정 보러 가기`, url: shareUrl });
    } catch (e) {
      // 사용자가 공유창을 취소한 경우(AbortError)는 조용히 무시
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`"${item.name}" 삭제할까요?`)) return;
    try {
      await deleteItem(planId, item.id);
      reload();
    } catch (e) {
      window.alert(e.message);
    }
  }

  async function applyReorder(dayId, reordered) {
    setPlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => (d.id === dayId ? { ...d, items: reordered } : d)),
    }));
    try {
      await reorderItems(planId, dayId, reordered.map((i) => i.id));
      return true;
    } catch (e) {
      window.alert(e.message);
      reload(); // 실패하면 서버 상태로 되돌림
      return false;
    }
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedDay) return;
    const oldIndex = selectedDay.items.findIndex((i) => i.id === active.id);
    const newIndex = selectedDay.items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(selectedDay.items, oldIndex, newIndex);

    // 서버 응답 기다리지 않고 먼저 화면부터 바꿔서 드래그가 즉각 반영된 것처럼 보이게 함.
    await applyReorder(selectedDay.id, reordered);
    // 동선 최적화 이후에 수동으로 또 순서를 바꿨으면, "최적화 이전으로 되돌리기"는
    // 더 이상 사용자가 기대하는 의미가 아니게 되므로 되돌리기 상태를 지운다.
    setPreOptimizeOrder((prev) => (prev?.dayId === selectedDay.id ? null : prev));
  }

  // 좌표가 있고 고정(pinned)되지 않은 항목만 최근접 이웃 + 2-opt로 동선을 계산해서 재배열한다.
  // 좌표가 없는 항목(메모성 일정 등)이나 사용자가 고정한 항목은 원래 있던 자리 그대로 두고,
  // 나머지 항목들만 그 자리들에 새 순서로 채워 넣는다 — 고정 항목이 최적화 때문에 엉뚱한
  // 위치로 튀는 걸 막기 위함. 고정된 게 없으면 첫 좌표 항목이 자동으로 출발점처럼 유지된다
  // (보통 숙소/집이라 사용자가 그대로 유지하고 싶어할 확률이 높음).
  async function handleOptimizeRoute() {
    if (!selectedDay) return;
    const movable = selectedDay.items.filter((it) => it.lat != null && it.lng != null && !it.pinned);
    if (movable.length < 3) {
      window.alert("좌표가 있고 고정되지 않은 일정이 3개 이상일 때 동선을 최적화할 수 있어요.");
      return;
    }
    if (!window.confirm("현재 순서를 이동 거리가 최소가 되는 순서로 재배열할까요? (고정된 항목은 그대로 유지돼요)")) return;

    const beforeIds = selectedDay.items.map((i) => i.id);
    const optimizedQueue = optimizeRouteOrder(movable);
    const reordered = selectedDay.items.map((it) =>
      it.lat != null && it.lng != null && !it.pinned ? optimizedQueue.shift() : it
    );

    const ok = await applyReorder(selectedDay.id, reordered);
    if (ok) setPreOptimizeOrder({ dayId: selectedDay.id, itemIds: beforeIds });
  }

  async function handleUndoOptimize() {
    if (!preOptimizeOrder || !selectedDay || preOptimizeOrder.dayId !== selectedDay.id) return;
    const byId = new Map(selectedDay.items.map((it) => [it.id, it]));
    const restored = preOptimizeOrder.itemIds.map((id) => byId.get(id)).filter(Boolean);
    if (restored.length !== selectedDay.items.length) { setPreOptimizeOrder(null); return; }
    const ok = await applyReorder(selectedDay.id, restored);
    if (ok) setPreOptimizeOrder(null);
  }

  async function handleTogglePin(item) {
    setPlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => ({
        ...d,
        items: d.items.map((it) => (it.id === item.id ? { ...it, pinned: !it.pinned } : it)),
      })),
    }));
    try {
      await updateItem(planId, item.id, { pinned: !item.pinned });
    } catch (e) {
      window.alert(e.message);
      reload();
    }
  }

  return (
    <div style={s.pad}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button style={s.backBtn} onClick={() => navigate("/")}>◀ 홈</button>
        <button style={s.itemRowActionBtn} title="일정 수정·삭제" onClick={() => setEditingPlan(true)}>✎</button>
      </div>

      <div style={s.tripHead}>
        <div>
          <div style={s.eyebrow}>{plan.kind} · {(plan.region || plan.title)}</div>
          <h1 style={{ ...s.h1, display: "flex", alignItems: "center", gap: 6 }}>
            <WalkTtubeogi size={26} /> {plan.title}
          </h1>
          <div style={s.subtitle}>{when} · {nights}{dday ? ` · ${dday}` : ""}</div>
        </div>
        <div style={s.members}>
          {plan.members.map((m) => (
            <div key={m.id} style={{ ...s.avatar, background: themedColor(m.color) }}>{m.name[0]}</div>
          ))}
          <div
            title={connected ? "실시간 연결됨" : "연결 끊김 — 재연결 시도 중"}
            style={{ ...s.liveDot, background: connected ? C.member2 : C.muted, animation: connected ? s.liveDot.animation : "none" }}
          />
        </div>
      </div>

      <div style={s.shareHint}>🔗 이 주소를 공유해서 함께 실시간으로 일정을 짜보세요</div>
      <div style={s.shareBar}>
        <span style={s.shareLink}>{shareUrl}</span>
        {typeof navigator !== "undefined" && navigator.share && (
          <button style={s.shareNativeBtn} title="바로 공유하기" onClick={shareNative}>
            <ShareIcon size={15} color="#fff" />
          </button>
        )}
        <button style={s.shareCopyBtn} onClick={copyShareLink}>{copied ? "복사됨!" : "링크 복사"}</button>
      </div>

      {plan.days.length > 1 && (
        <div style={s.dayChips}>
          {plan.days.map((d, i) => (
            <button key={d.id} style={{ ...s.dayChip, ...(d.id === selectedDayId ? s.dayChipOn : {}) }}
                    onClick={() => setSelectedDayId(d.id)}>
              {i + 1}일차 · {d.date.slice(5).replace("-", "/")}
            </button>
          ))}
        </div>
      )}

      {selectedDay && (
        <div style={{ ...s.pickerGrid, marginBottom: 14, flexWrap: "nowrap" }}>
          <button style={{ ...s.pickerBtn, flex: 1, padding: "10px 4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, ...(viewTab === "list" ? s.pickerBtnOn : {}) }} onClick={() => setViewTab("list")}>
            <ListIcon size={13} color={viewTab === "list" ? C.orangeDeep : C.ink} /> 일정
          </button>
          <button style={{ ...s.pickerBtn, flex: 1, padding: "10px 4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, ...(viewTab === "map" ? s.pickerBtnOn : {}) }} onClick={() => setViewTab("map")}>
            <MapPinIcon size={13} color={viewTab === "map" ? C.orangeDeep : C.ink} /> 지도
          </button>
          <button style={{ ...s.pickerBtn, flex: 1, padding: "10px 4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, ...(viewTab === "tickets" ? s.pickerBtnOn : {}) }} onClick={() => setViewTab("tickets")}>
            <TicketIcon size={13} color={viewTab === "tickets" ? C.orangeDeep : C.ink} /> 티켓{ticketItems.length > 0 ? ` ${ticketItems.length}` : ""}
          </button>
        </div>
      )}

      {selectedDay && viewTab === "map" && (
        <PlanMap items={selectedDay.items} onGoToList={() => setViewTab("list")} onSelectItem={goToItem} />
      )}

      {viewTab === "tickets" && (
        <>
          {ticketItems.length === 0 ? (
            <div style={s.emptyState}>
              항공권·기차표·바우처를 첨부한 항목이 아직 없어요.<br />
              항목 수정에서 파일을 첨부하면 여기 모여요.
            </div>
          ) : (
            ticketItems.map(({ item, dayLabel, nextItem }) => (
              <TicketCard
                key={item.id}
                item={item}
                nextItem={nextItem}
                dayLabel={dayLabel}
                planId={planId}
                isPast={plan.status === "past"}
                onEdit={() => setModalState({ item })}
              />
            ))
          )}
        </>
      )}

      {selectedDay && viewTab === "list" && (
        <>
          {selectedDay.items.length === 0 && (
            <div style={s.emptyState}>아직 추가된 일정이 없어요.<br />첫 항목을 추가해보세요!</div>
          )}

          {(selectedDay.items.filter((it) => it.lat != null && it.lng != null && !it.pinned).length >= 3
            || preOptimizeOrder?.dayId === selectedDay.id) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              {selectedDay.items.filter((it) => it.lat != null && it.lng != null && !it.pinned).length >= 3 && (
                <button style={{ ...s.optimizeRouteBtn, marginBottom: 0, flex: "1 1 160px" }} onClick={handleOptimizeRoute}>
                  <RouteIcon size={14} color={C.orangeDeep} /> 동선 최적화
                </button>
              )}
              {preOptimizeOrder?.dayId === selectedDay.id && (
                <button style={{ ...s.optimizeRouteBtn, width: "auto", marginBottom: 0, flex: "0 0 auto", padding: "11px 14px",
                                  background: "#fff", color: C.textMuted, border: `1.5px solid ${C.borderStrong}` }}
                        onClick={handleUndoOptimize}>
                  되돌리기
                </button>
              )}
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={selectedDay.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {selectedDay.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  creator={plan.members.find((m) => m.id === item.createdBy)}
                  editor={plan.members.find((m) => m.id === item.updatedBy)}
                  planId={planId}
                  dayDate={selectedDay.date}
                  planTitle={plan.title}
                  highlighted={item.id === highlightItemId}
                  onEdit={() => setModalState({ item })}
                  onDelete={() => handleDelete(item)}
                  onCopy={() => setCopyingItem(item)}
                  onTogglePin={() => handleTogglePin(item)}
                />
              ))}
            </SortableContext>
          </DndContext>

          <button style={s.addItemBtn} onClick={() => setModalState({ item: null })}>
            ＋ 항목 추가
          </button>
        </>
      )}

      {modalState && (
        <ItemFormModal
          planId={planId}
          dayId={selectedDayId}
          days={plan.days}
          item={modalState.item}
          memberId={memberId}
          onClose={() => setModalState(null)}
          onSaved={() => { setModalState(null); reload(); }}
        />
      )}

      {copyingItem && (
        <CopyItemModal
          planId={planId}
          item={copyingItem}
          days={plan.days}
          memberId={memberId}
          onClose={() => setCopyingItem(null)}
          onCopied={() => { setCopyingItem(null); reload(); }}
        />
      )}

      {editingPlan && (
        <EditPlanModal
          planId={planId}
          plan={plan}
          onClose={() => setEditingPlan(false)}
          onSaved={() => { setEditingPlan(false); reload(); }}
          onDeleted={() => navigate("/")}
        />
      )}
    </div>
  );
}
