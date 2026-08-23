import React, { useState } from "react";
import { s } from "../styles";
import { C } from "../theme";
import { updatePlan, deletePlan } from "../lib/api";
import { COMMUNITY_ENABLED } from "../lib/featureFlags";

const KINDS = ["여행", "데이트", "약속"];

// 일정 자체(제목/종류/기간/지역/커뮤니티 공개 여부) 수정 + 삭제. 항목 CRUD와 별개로, Plan 레코드 자체를 다룬다.
export default function EditPlanModal({ planId, plan, me, onClose, onSaved, onDeleted }) {
  const [kind, setKind] = useState(plan.kind);
  const [title, setTitle] = useState(plan.title);
  const [startDate, setStartDate] = useState(plan.startDate);
  const [endDate, setEndDate] = useState(plan.endDate);
  const [region, setRegion] = useState(plan.region || "");
  const [isPublic, setIsPublic] = useState(plan.isPublic || false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canSubmit = title.trim() && startDate && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const patch = {
      kind, title: title.trim(), startDate,
      endDate: kind === "여행" ? (endDate || startDate) : startDate,
      region: region.trim() || null,
    };
    // 토글을 안 건드렸으면 아예 안 보낸다 — 공개 상태 그대로 두는 경우까지 매번 로그인을
    // 요구하면(공개 켜기는 로그인 필요) 로그아웃 상태에서 다른 필드(제목 등)만 고치려는
    // 사람도 저장이 막혀버리는 문제가 생김.
    if (isPublic !== (plan.isPublic || false)) patch.isPublic = isPublic;
    try {
      await updatePlan(planId, patch);
      onSaved();
    } catch (err) {
      // 기간을 줄여서 그 날짜에 있던 항목이 같이 삭제되는 경우 — 서버가 바로 지우지 않고
      // 먼저 확인을 요청한다(needsForce). 사용자가 동의하면 force:true로 다시 보낸다.
      if (err.needsForce && window.confirm(err.message)) {
        try {
          await updatePlan(planId, { ...patch, force: true });
          onSaved();
          return;
        } catch (err2) {
          setError(err2.message);
          setSubmitting(false);
          return;
        }
      }
      setError(err.message);
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`"${plan.title}" 일정을 정말 삭제할까요?\n항목·멤버 기록까지 전부 사라지고 되돌릴 수 없어요.`)) return;
    setDeleting(true);
    try {
      await deletePlan(planId);
      onDeleted();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modalSheet} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHead}>
          <span style={s.modalTitle}>일정 수정</span>
          <button style={s.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.formLabel}>종류</div>
          <div style={s.pickerGrid}>
            {KINDS.map((k) => (
              <button type="button" key={k}
                style={{ ...s.pickerBtn, ...(kind === k ? s.pickerBtnOn : {}) }}
                onClick={() => setKind(k)}>
                {k}
              </button>
            ))}
          </div>

          <div style={s.formLabel}>제목</div>
          <input style={s.formInput} value={title} onChange={(e) => setTitle(e.target.value)} />

          <div style={s.formRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.formLabel}>{kind === "여행" ? "시작일" : "날짜"}</div>
              <input type="date" style={s.formInputDate} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            {kind === "여행" && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.formLabel}>종료일</div>
                <input type="date" style={s.formInputDate} value={endDate} min={startDate || undefined}
                       onChange={(e) => setEndDate(e.target.value)} />
              </div>
            )}
          </div>

          <div style={s.formLabel}>지역 (선택)</div>
          <input style={s.formInput} value={region} onChange={(e) => setRegion(e.target.value)} placeholder="예: 상하이, 부산" />

          {COMMUNITY_ENABLED && (
            <>
              <div style={s.formLabel}>🌍 커뮤니티 공유</div>
              <div style={s.pickerGrid}>
                <button type="button" disabled={!me}
                        style={{ ...s.pickerBtn, flex: 1, ...(isPublic ? s.pickerBtnOn : {}),
                                 ...(!me ? { opacity: 0.5, cursor: "not-allowed" } : {}) }}
                        onClick={() => me && setIsPublic(true)}>
                  공개
                </button>
                <button type="button" style={{ ...s.pickerBtn, flex: 1, ...(!isPublic ? s.pickerBtnOn : {}) }}
                        onClick={() => setIsPublic(false)}>
                  비공개
                </button>
              </div>
              {!me && <div style={s.formHint}>로그인 후 커뮤니티에 공개할 수 있어요.</div>}
              {plan.isPublic && <div style={s.formHint}>게시됨 · 좋아요 {plan.likeCount || 0}개</div>}
            </>
          )}

          {error && <div style={s.formError}>{error}</div>}

          <button type="submit" style={{ ...s.submitBtn, ...(canSubmit ? {} : s.submitBtnDisabled) }} disabled={!canSubmit}>
            {submitting ? "저장 중…" : "저장"}
          </button>
        </form>

        <button
          style={{ ...s.backBtn, marginTop: 18, color: "#c0392b", fontWeight: 800, ...(deleting ? { opacity: 0.5 } : {}) }}
          disabled={deleting} onClick={handleDelete}
        >
          🗑 {deleting ? "삭제하는 중…" : "이 일정 삭제하기"}
        </button>
      </div>
    </div>
  );
}
