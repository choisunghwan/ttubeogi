import React, { useState } from "react";
import { s } from "../styles";
import { C } from "../theme";
import { TicketIcon, PlaneBadgeIcon, PaperclipIcon } from "./Icons";
import { attachmentUrl } from "../lib/api";

// "티켓" 탭 전용 카드 — 일정 전체(모든 날짜)에서 항공편/바우처/첨부파일이 있는 항목만 모아
// 한눈에 보여준다. 항공편(항공 종류 + 항공편명 있음)은 실제 항공권처럼 출발/도착 구간으로,
// 그 외(바우처만 있는 숙소·기타 등)는 심플한 예약 카드로 보여준다.
export default function TicketCard({ item, nextItem, dayLabel, planId, isPast, onEdit }) {
  const [showAttachment, setShowAttachment] = useState(false);
  const isImageAttachment = item.attachmentType?.startsWith("image/");
  const isFlight = item.type === "항공" && item.flightNo;

  function handleOpenAttachment() {
    if (isImageAttachment) {
      setShowAttachment(true);
    } else {
      window.open(attachmentUrl(planId, item.id), "_blank", "noopener,noreferrer");
    }
  }

  const lightbox = showAttachment && (
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
  );

  const hasFooter = Boolean(item.voucher || item.attachmentName);
  const footerContent = (
    <>
      {item.voucher && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.ink, fontSize: 12.5, fontWeight: 600 }}>
          <TicketIcon size={13} color={C.gold} /> {item.voucher}
        </span>
      )}
      {item.attachmentName && (
        <button type="button" onClick={handleOpenAttachment} style={s.ticketAttachmentBtn}>
          <PaperclipIcon size={12} color={C.gold} /> {item.attachmentName} 보기
        </button>
      )}
    </>
  );

  if (isFlight) {
    return (
      <div style={s.flightTicketWrap}>
        <div style={s.flightTicketEyebrow}>
          <span style={s.flightTicketDot} /> 항공편
        </div>
        <div style={s.flightTicketCard}>
          <div style={s.flightTicketTopRow}>
            <span style={s.flightTicketNo}>{item.flightNo} <span style={s.flightTicketNoSub}>· 항공편</span></span>
            <span style={s.flightTicketStatus}>{isPast ? "완료" : "예정"}</span>
          </div>

          <div style={s.flightRoute}>
            <div style={s.flightRouteEnd}>
              <div style={s.flightRouteCode}>{item.name}</div>
              <div style={s.flightRouteMeta}>{dayLabel}</div>
            </div>
            <div style={s.flightRouteLine}>
              <span style={s.flightRouteLineBar} />
              <PlaneBadgeIcon size={16} color={C.gold} />
              <span style={s.flightRouteLineBar} />
            </div>
            <div style={{ ...s.flightRouteEnd, alignItems: "flex-end", textAlign: "right" }}>
              <div style={s.flightRouteCode}>{nextItem ? nextItem.name : "도착지 미정"}</div>
              <div style={s.flightRouteMeta}>{nextItem ? nextItem.dayLabel : "다음 항목을 추가해보세요"}</div>
            </div>
          </div>

          {hasFooter && <div style={s.flightTicketDivider} />}
          {hasFooter && <div style={s.ticketFooter}>{footerContent}</div>}

          <button type="button" style={s.ticketEditLink} onClick={onEdit}>✎ 편집</button>
        </div>
        {lightbox}
      </div>
    );
  }

  return (
    <div style={s.ticketCardMini}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.ticketCardMiniDay}>{dayLabel}{item.time ? ` · ${item.time}` : ""}</div>
        <div style={s.itemRowName}>{item.name}</div>
        {hasFooter && <div style={{ ...s.ticketFooter, marginTop: 6 }}>{footerContent}</div>}
      </div>
      <button style={s.itemRowActionBtn} onClick={onEdit}>✎</button>
      {lightbox}
    </div>
  );
}
