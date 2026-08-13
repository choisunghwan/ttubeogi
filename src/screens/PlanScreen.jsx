import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { C } from "../theme";
import { s } from "../styles";
import { WalkTtubeogi } from "../components/TtubeogiCharacter";
import ItemFormModal from "../components/ItemFormModal";
import PlanMap from "../components/PlanMap";
import ItemRow from "../components/ItemRow";
import { getPlan, joinPlan, deleteItem, reorderItems } from "../lib/api";
import { getMemberId, rememberPlan } from "../lib/localPlans";
import { formatWhen, formatDday } from "../utils";
import { usePlanSocket } from "../lib/ws";

function JoinGate({ planId, onJoined }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  async function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setJoining(true);
    setError(null);
    try {
      const { memberId } = await joinPlan(planId, name.trim());
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
        <div style={{ color: C.muted, fontSize: 13.5, marginBottom: 8 }}>
          로그인 없이 이름만 입력하면 바로 같이 만들 수 있어요.
        </div>
        <form onSubmit={handleJoin}>
          <input style={s.formInput} value={name} onChange={(e) => setName(e.target.value)}
                 placeholder="이름을 입력하세요" autoFocus />
          {error && <div style={s.formError}>{error}</div>}
          <button type="submit" style={{ ...s.submitBtn, ...((!name.trim() || joining) ? s.submitBtnDisabled : {}) }}
                  disabled={!name.trim() || joining}>
            {joining ? "참여하는 중…" : "참여하기"}
          </button>
        </form>
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
  const [copied, setCopied] = useState(false);
  const [viewTab, setViewTab] = useState("list"); // "list" | "map"

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

  function copyShareLink() {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
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

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedDay) return;
    const oldIndex = selectedDay.items.findIndex((i) => i.id === active.id);
    const newIndex = selectedDay.items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(selectedDay.items, oldIndex, newIndex);

    // 서버 응답 기다리지 않고 먼저 화면부터 바꿔서 드래그가 즉각 반영된 것처럼 보이게 함.
    setPlan((prev) => ({
      ...prev,
      days: prev.days.map((d) => (d.id === selectedDay.id ? { ...d, items: reordered } : d)),
    }));

    try {
      await reorderItems(planId, selectedDay.id, reordered.map((i) => i.id));
    } catch (e) {
      window.alert(e.message);
      reload(); // 실패하면 서버 상태로 되돌림
    }
  }

  return (
    <div style={s.pad}>
      <button style={s.backBtn} onClick={() => navigate("/")}>◀ 홈</button>

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
            <div key={m.id} style={{ ...s.avatar, background: m.color }}>{m.name[0]}</div>
          ))}
          <div
            title={connected ? "실시간 연결됨" : "연결 끊김 — 재연결 시도 중"}
            style={{ ...s.liveDot, background: connected ? C.member2 : C.muted, animation: connected ? s.liveDot.animation : "none" }}
          />
        </div>
      </div>

      <div style={s.shareBar}>
        <span style={s.shareLink}>{shareUrl}</span>
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
        <div style={{ ...s.pickerGrid, marginBottom: 14 }}>
          <button style={{ ...s.pickerBtn, ...(viewTab === "list" ? s.pickerBtnOn : {}) }} onClick={() => setViewTab("list")}>📋 일정</button>
          <button style={{ ...s.pickerBtn, ...(viewTab === "map" ? s.pickerBtnOn : {}) }} onClick={() => setViewTab("map")}>🗺️ 지도</button>
        </div>
      )}

      {selectedDay && viewTab === "map" && <PlanMap items={selectedDay.items} onGoToList={() => setViewTab("list")} />}

      {selectedDay && viewTab === "list" && (
        <>
          {selectedDay.items.length === 0 && (
            <div style={s.emptyState}>아직 추가된 일정이 없어요.<br />첫 항목을 추가해보세요!</div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={selectedDay.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {selectedDay.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  creator={plan.members.find((m) => m.id === item.createdBy)}
                  onEdit={() => setModalState({ item })}
                  onDelete={() => handleDelete(item)}
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
          item={modalState.item}
          memberId={memberId}
          onClose={() => setModalState(null)}
          onSaved={() => { setModalState(null); reload(); }}
        />
      )}
    </div>
  );
}
