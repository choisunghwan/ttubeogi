import React from "react";
import { C } from "../theme";

// 홈 카드(보딩패스)의 일정 종류 아이콘 — 이모지 대신 SVG로. 플랫폼마다 다르게 그려지는
// 이모지 렌더링 차이 없이 항상 같은 골드 라인아트로 보이게 함.
function Plane({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2.5 13.2L21 7.6c1.1-.3 1.9.9 1.3 1.8l-2.1 3.2-6.6 1.9-1 5.7-1.9.6-.7-5.3-5.7 1.6-1.7-2.2 4-2.3-4.1-1.7z"
            fill={color} />
    </svg>
  );
}
function Heart({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 20.5s-7.5-4.6-10-9.3C.4 7.8 2 4.5 5.4 4c2-.3 3.9.6 5 2.3l1.6 2.3 1.6-2.3c1.1-1.7 3-2.6 5-2.3 3.4.5 5 3.8 3.4 7.2-2.5 4.7-10 9.3-10 9.3z"
            stroke={color} strokeWidth="1.7" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
function Toast({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 3l1.6 10a2 2 0 002 1.7h.8a2 2 0 002-1.7L13 3" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4.3 3h6.4M12.5 8.5l2.3-1.3M15 3l-.9 8.6a1.6 1.6 0 001.6 1.8h.2a1.6 1.6 0 001.6-1.8L16.6 3" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M13.6 3h6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6.4 15.5L5 21M9.4 15.5L9 21M16 12.4l1.3 8.6M13.5 12.6L14.5 21" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const ICONS = { 여행: Plane, 데이트: Heart, 약속: Toast };

export default function KindIcon({ kind, size = 22, color = C.gold }) {
  const Icon = ICONS[kind] || Plane;
  return <Icon size={size} color={color} />;
}
