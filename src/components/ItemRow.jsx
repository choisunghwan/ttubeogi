import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { s } from "../styles";
import { TYPES, C } from "../theme";
import MoveIcon from "./MoveIcon";
import { CalendarIcon, TicketIcon, PlaneBadgeIcon, PaperclipIcon } from "./Icons";
import { buildItemICS, downloadICS } from "../lib/ics";
import { attachmentUrl } from "../lib/api";

// 드래그 핸들만 dnd-kit 리스너를 붙인다 — 행 전체를 드래그 대상으로 하면
// ✎/🗑 탭이나 스크롤 제스처와 자꾸 충돌해서, 잡을 수 있는 손잡이를 따로 둔다.
export default function ItemRow({ item, creator, planId, dayDate, planTitle, highlighted, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const t = TYPES[item.type] || TYPES.기타;
  const [showAttachment, setShowAttachment] = useState(false);
  const isImageAttachment = item.attachmentType?.startsWith("image/");

  function handleAddToCalendar(e) {
    e.stopPropagation();
    const ics = buildItemICS({ planTitle, item, dayDate });
    downloadICS(`${item.name}.ics`, ics);
  }

  function handleOpenAttachment(e) {
    e.stopPropagation();
    if (isImageAttachment) {
      setShowAttachment(true);
    } else {
      window.open(attachmentUrl(planId, item.id), "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div id={`item-${item.id}`} ref={setNodeRef}
         style={{
           ...s.itemRow, transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1,
           ...(highlighted ? s.itemRowHighlight : {}),
         }}>
      <button type="button" {...attributes} {...listeners} style={s.dragHandle} aria-label="순서 변경">⠿</button>
      <div style={{ ...s.itemRowBadge, background: t.color }}>{t.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {item.time && <div style={s.itemRowTime}>{item.time}</div>}
        <div style={s.itemRowName}>{item.name}</div>
        <div style={{ ...s.itemRowMeta, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          {item.move && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }} title="다음 장소까지 이동수단">
              다음 <MoveIcon move={item.move} size={13} color={C.muted} /> {item.move}
            </span>
          )}
          {item.move && creator ? "·" : ""}
          {creator ? <span style={{ color: creator.color, fontWeight: 700 }}>{creator.name} 추가</span> : ""}
        </div>
        {(item.flightNo || item.voucher || item.attachmentName) && (
          <div style={{ ...s.itemRowMeta, display: "flex", alignItems: "center", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
            {item.flightNo && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: C.orangeDeep, fontWeight: 700 }}>
                <PlaneBadgeIcon size={12} color={C.orangeDeep} /> {item.flightNo}
              </span>
            )}
            {item.voucher && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                <TicketIcon size={13} color={C.muted} /> {item.voucher}
              </span>
            )}
            {item.attachmentName && (
              <button type="button" onClick={handleOpenAttachment}
                      style={{ display: "inline-flex", alignItems: "center", gap: 3, border: "none",
                               background: "transparent", padding: 0, color: C.orangeDeep, fontWeight: 700,
                               fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                <PaperclipIcon size={12} color={C.orangeDeep} /> {item.attachmentName}
              </button>
            )}
          </div>
        )}
      </div>
      <div style={s.itemRowActions}>
        <button style={s.itemRowActionBtn} title="캘린더에 담기" onClick={handleAddToCalendar}><CalendarIcon size={15} color={C.ink} /></button>
        <button style={s.itemRowActionBtn} onClick={onEdit}>✎</button>
        <button style={s.itemRowActionBtn} onClick={onDelete}>🗑</button>
      </div>

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
