import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { s } from "../styles";
import { createPlan } from "../lib/api";
import { rememberPlan } from "../lib/localPlans";
import { getMe } from "../lib/auth";

const KINDS = ["여행", "데이트", "약속"];
const TITLE_HINT = { 여행: "예: 상하이 여행", 데이트: "예: 홍대 데이트", 약속: "예: 대학 동기 모임" };

export default function CreatePlanScreen() {
  const navigate = useNavigate();
  const [me, setMe] = useState(undefined); // undefined = 확인 중, null = 비로그인
  const [kind, setKind] = useState("여행");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [region, setRegion] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { getMe().then(setMe); }, []);

  const nameReady = me || creatorName.trim();
  const canSubmit = title.trim() && startDate && nameReady && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { id, memberId } = await createPlan({
        kind,
        title: title.trim(),
        startDate,
        endDate: kind === "여행" ? (endDate || startDate) : startDate,
        region: region.trim() || null,
        creatorName: me ? null : creatorName.trim(),
      });
      rememberPlan(id, memberId);
      navigate(`/p/${id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div style={s.pad}>
      <button style={s.backBtn} onClick={() => navigate("/")}>◀ 홈</button>
      <div style={s.eyebrow}>NEW PLAN</div>
      <h1 style={s.h1}>새 일정 만들기</h1>

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
        <input style={s.formInput} value={title} onChange={(e) => setTitle(e.target.value)}
               placeholder={TITLE_HINT[kind]} />

        <div style={s.formRow}>
          <div style={{ flex: 1 }}>
            <div style={s.formLabel}>{kind === "여행" ? "시작일" : "날짜"}</div>
            <input type="date" style={s.formInput} value={startDate}
                   onChange={(e) => setStartDate(e.target.value)} />
          </div>
          {kind === "여행" && (
            <div style={{ flex: 1 }}>
              <div style={s.formLabel}>종료일</div>
              <input type="date" style={s.formInput} value={endDate} min={startDate || undefined}
                     onChange={(e) => setEndDate(e.target.value)} />
            </div>
          )}
        </div>

        <div style={s.formLabel}>지역 (선택)</div>
        <input style={s.formInput} value={region} onChange={(e) => setRegion(e.target.value)}
               placeholder="예: 상하이, 부산" />

        {me ? (
          <div style={s.formHint}>{me.nickname}님으로 만들어요 (카카오 로그인됨)</div>
        ) : (
          <>
            <div style={s.formLabel}>내 이름</div>
            <input style={s.formInput} value={creatorName} onChange={(e) => setCreatorName(e.target.value)}
                   placeholder="일행에게 보일 이름" />
          </>
        )}
        <div style={s.formHint}>로그인 없이도 만들 수 있어요 — 링크를 받은 사람은 이름만 입력하고 바로 참여할 수 있어요.</div>

        {error && <div style={s.formError}>{error}</div>}

        <button type="submit" style={{ ...s.submitBtn, ...(canSubmit ? {} : s.submitBtnDisabled) }} disabled={!canSubmit}>
          {submitting ? "만드는 중…" : "만들고 공유 링크 받기"}
        </button>
      </form>
    </div>
  );
}
