import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { s } from "../styles";
import { TYPES } from "../theme";

// 드래그 핸들만 dnd-kit 리스너를 붙인다 — 행 전체를 드래그 대상으로 하면
// ✎/🗑 탭이나 스크롤 제스처와 자꾸 충돌해서, 잡을 수 있는 손잡이를 따로 둔다.
export default function ItemRow({ item, creator, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const t = TYPES[item.type] || TYPES.기타;

  return (
    <div ref={setNodeRef} style={{ ...s.itemRow, transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}>
      <button type="button" {...attributes} {...listeners} style={s.dragHandle} aria-label="순서 변경">⠿</button>
      <div style={{ ...s.itemRowBadge, background: t.color }}>{t.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {item.time && <div style={s.itemRowTime}>{item.time}</div>}
        <div style={s.itemRowName}>{item.name}</div>
        <div style={s.itemRowMeta}>
          {item.move ? `🚶 ${item.move}` : ""}{item.move && creator ? " · " : ""}
          {creator ? <span style={{ color: creator.color, fontWeight: 700 }}>{creator.name} 추가</span> : ""}
        </div>
      </div>
      <div style={s.itemRowActions}>
        <button style={s.itemRowActionBtn} onClick={onEdit}>✎</button>
        <button style={s.itemRowActionBtn} onClick={onDelete}>🗑</button>
      </div>
    </div>
  );
}
