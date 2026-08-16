import React from "react";
import { C } from "../theme";

// 일정 항목 행(ItemRow)에 붙는 작은 이동수단 아이콘 — 이모지(🚶) 하나로 전부 퉁치지 않고
// 실제 선택한 이동수단(자차/버스/지하철/항공 등)에 따라 모양이 달라지게. PlanMap의 걷기
// 애니메이션용 아이콘과는 별개(그쪽은 Leaflet용 HTML 문자열, 이건 리스트용 작은 React 아이콘).
function Walk({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="13.5" cy="4.5" r="2" fill={color} />
      <path d="M11 8l3 1.5 2 4-1.5 1-1.5-3-1 1v6.5H10V13l-2 1-1.5 4H5l2-5.5 3-2.5-1-2z" fill={color} />
    </svg>
  );
}
function Car({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 15v-2.5l1.8-4.2A2 2 0 0 1 7.6 7h8.8a2 2 0 0 1 1.8 1.3L20 12.5V15" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="15" width="18" height="3.4" rx="1.5" fill={color} />
      <circle cx="7.5" cy="18.6" r="1.7" fill="#fff" stroke={color} strokeWidth="1.5" />
      <circle cx="16.5" cy="18.6" r="1.7" fill="#fff" stroke={color} strokeWidth="1.5" />
      <path d="M6.5 11h11" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function Bus({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="4" width="17" height="12.5" rx="2.5" fill={color} />
      <rect x="5.5" y="6.3" width="3.4" height="3.4" rx="0.6" fill="#fff" opacity="0.9" />
      <rect x="10.3" y="6.3" width="3.4" height="3.4" rx="0.6" fill="#fff" opacity="0.9" />
      <rect x="15.1" y="6.3" width="3.4" height="3.4" rx="0.6" fill="#fff" opacity="0.9" />
      <circle cx="7.5" cy="18.4" r="1.7" fill="#fff" stroke={color} strokeWidth="1.5" />
      <circle cx="16.5" cy="18.4" r="1.7" fill="#fff" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}
function Train({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3.5" width="14" height="13" rx="5" fill={color} />
      <rect x="7.2" y="6.5" width="3.2" height="3.6" rx="0.8" fill="#fff" opacity="0.9" />
      <rect x="13.6" y="6.5" width="3.2" height="3.6" rx="0.8" fill="#fff" opacity="0.9" />
      <path d="M6 20l2.2-3M18 20l-2.2-3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="14.5" r="1" fill="#fff" />
      <circle cx="16" cy="14.5" r="1" fill="#fff" />
    </svg>
  );
}
function Plane({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2.5 13.2L21 7.6c1.1-.3 1.9.9 1.3 1.8l-2.1 3.2-6.6 1.9-1 5.7-1.9.6-.7-5.3-5.7 1.6-1.7-2.2 4-2.3-4.1-1.7z"
            fill={color} />
    </svg>
  );
}
function Etc({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l1.8 5.6H19l-4.6 3.4 1.8 5.6L12 14.2l-4.2 3.4 1.8-5.6L5 8.6h5.2z" fill={color} />
    </svg>
  );
}

const ICONS = {
  도보: Walk, 자차: Car, 택시: Car, 버스: Bus, 지하철: Train, 트램: Train, 기차: Train, 항공: Plane,
};

export default function MoveIcon({ move, size = 15, color = C.textMuted }) {
  const Icon = ICONS[move] || Etc;
  return <Icon size={size} color={color} />;
}
