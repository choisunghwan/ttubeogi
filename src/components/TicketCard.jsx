import React, { useState } from "react";
import { s } from "../styles";
import { C, TYPES } from "../theme";
import { TicketIcon, PlaneBadgeIcon, PaperclipIcon } from "./Icons";
import { attachmentUrl } from "../lib/api";

// "티켓" 탭 전용 카드 — 일정 전체(모든 날짜)에서 항공편/바우처/첨부파일이 있는 항목만 모아
// 한눈에 보여준다. 매번 날짜별로 찾아 들어가지 않아도 바로 탑승권·예약 확인서를 볼 수 있게.
// ItemRow(순서 변경용 드래그 핸들 포함)와 달리 보기 전용이라 훨씬 가볍게 따로 만듦.
export default function TicketCard({ item, dayLabel, planId, onEdit }) {
  const [showAttachment, setShowAttachment] = useState(false);
  const t = TYPES[item.type] || TYPES.기타;
  const isImageAttachment = item.attachmentType?.startsWith("image/");

  function handleOpenAttachment() {
    if (isImageAttachment) {
      setShowAttachment(true);
    } else {
      window.open(attachmentUrl(planId, item.id), "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div style={s.ticketCardMini}>
      <div style={{ ...s.itemRowBadge, background: t.color }}>{t.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.ticketCardMiniDay}>{dayLabel}{item.time ? ` · ${item.time}` : ""}</div>
        <div style={s.itemRowName}>{item.name}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
          {item.flightNo && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.orangeDeep, fontWeight: 700, fontSize: 12.5 }}>
              <PlaneBadgeIcon size={12} color={C.orangeDeep} /> {item.flightNo}
            </span>
          )}
          {item.voucher && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.ink, fontSize: 12.5 }}>
              <TicketIcon size={13} color={C.muted} /> {item.voucher}
            </span>
          )}
          {item.attachmentName && (
            <button type="button" onClick={handleOpenAttachment}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none",
                             background: "transparent", padding: 0, color: C.gold, fontWeight: 700,
                             fontSize: 12.5, cursor: "pointer", textDecoration: "underline", textAlign: "left" }}>
              <PaperclipIcon size={12} color={C.gold} /> {item.attachmentName} 보기
            </button>
          )}
        </div>
      </div>
      <button style={s.itemRowActionBtn} onClick={onEdit}>✎</button>

      {showAttachment && (
        <div style={s.modalOverlay} onClick={() => setShowAttachment(false)}>
          <div style={s.attachmentLightbox} onClick={(e) => e.stopPropagation()}>
            <button
              style={{ position: "absolute", top: -14, right: -14, width: 32, height: 32, borderRadius: "50%",
                       border: "none", background: "#fff", color: C.ink, fontSize: 16, cursor: "pointer",
                       boxShadow: "0 2px 8px rgba(0,0,0,.3)" }}
              onClick={() => setShowAttachment(false)}
            >✕</button>
            <img src={attachmentUrl(planId, item.id)} alt={item.attachmentName} style={s.attachmentLightboxImg} />
          </div>
        </div>
      )}
    </div>
  );
}
