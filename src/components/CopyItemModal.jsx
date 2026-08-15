import React, { useState } from "react";
import { s } from "../styles";
import { copyItem } from "../lib/api";

// 항목을 다른 날짜(혹은 같은 날짜)로 복사 — "집"처럼 출발/복귀 때마다 반복되는 장소나,
// 1일차에 갔던 곳을 2일차에도 또 넣고 싶을 때 매번 새로 입력하지 않게 해준다.
export default function CopyItemModal({ planId, item, days, memberId, onClose, onCopied }) {
  const [copyingDayId, setCopyingDayId] = useState(null);
  const [error, setError] = useState(null);

  async function handlePick(dayId) {
    setCopyingDayId(dayId);
    setError(null);
    try {
      await copyItem(planId, item.id, dayId, memberId);
      onCopied();
    } catch (err) {
      setError(err.message);
      setCopyingDayId(null);
    }
  }

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modalSheet} data-testid="copy-item-modal" onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHead}>
          <span style={s.modalTitle}>"{item.name}" 복사</span>
          <button style={s.modalCloseBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ ...s.formHint, marginBottom: 14 }}>어느 날짜에 복사해서 추가할까요?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {days.map((d, i) => (
            <button
              key={d.id}
              type="button"
              style={{ ...s.pickerBtn, textAlign: "left", opacity: copyingDayId && copyingDayId !== d.id ? 0.5 : 1 }}
              disabled={Boolean(copyingDayId)}
              onClick={() => handlePick(d.id)}
            >
              {days.length > 1 ? `${i + 1}일차 · ${d.date.slice(5).replace("-", "/")}` : d.date.slice(5).replace("-", "/")}
              {copyingDayId === d.id ? " — 복사 중…" : ""}
            </button>
          ))}
        </div>
        {error && <div style={s.formError}>{error}</div>}
      </div>
    </div>
  );
}
