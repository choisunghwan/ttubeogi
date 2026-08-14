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
  const thumbUrl = item.attachmentName ? attachmentUrl(planId, item.id) : null;

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
        <img src={thumbUrl} alt={item.attachmentName} style={s.attachmentLightboxImg} />
      </div>
    </div>
  );

  // 첨부가 사진이면 파일명 텍스트 링크 대신 실제 썸네일을 보여준다 — 클릭하면 라이트박스로 크게.
  // PDF 등 이미지가 아니면 미리보기가 불가능하니 기존처럼 파일명 링크(새 탭으로 열기)로.
  const attachmentThumb = item.attachmentName && (
    isImageAttachment ? (
      <img src={thumbUrl} alt={item.attachmentName} style={s.ticketThumb} onClick={handleOpenAttachment} />
    ) : (
      <button type="button" onClick={handleOpenAttachment} style={s.ticketThumbFile}>
        <PaperclipIcon size={16} color={C.gold} />
      </button>
    )
  );

  const hasVoucher = Boolean(item.voucher);

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

          {(hasVoucher || attachmentThumb) && <div style={s.flightTicketDivider} />}
          {(hasVoucher || attachmentThumb) && (
            <div style={s.ticketFooter}>
              {attachmentThumb}
              {hasVoucher && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.ink, fontSize: 12.5, fontWeight: 600 }}>
                  <TicketIcon size={13} color={C.gold} /> {item.voucher}
                </span>
              )}
              <button type="button" style={{ ...s.ticketEditLink, marginTop: 0, marginLeft: "auto" }} onClick={onEdit}>✎ 편집</button>
            </div>
          )}
          {!hasVoucher && !attachmentThumb && (
            <button type="button" style={s.ticketEditLink} onClick={onEdit}>✎ 편집</button>
          )}
        </div>
        {lightbox}
      </div>
    );
  }

  return (
    <div style={s.ticketCardMini}>
      {attachmentThumb}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.ticketCardMiniDay}>{dayLabel}{item.time ? ` · ${item.time}` : ""}</div>
        <div style={s.itemRowName}>{item.name}</div>
        {hasVoucher && (
          <div style={{ ...s.ticketFooter, marginTop: 6 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.ink, fontSize: 12.5, fontWeight: 600 }}>
              <TicketIcon size={13} color={C.gold} /> {item.voucher}
            </span>
          </div>
        )}
      </div>
      <button style={s.itemRowActionBtn} onClick={onEdit}>✎</button>
      {lightbox}
    </div>
  );
}
