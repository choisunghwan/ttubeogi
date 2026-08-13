import React from "react";

// 작은 UI 아이콘 모음(이모지 대신 SVG) — 캘린더 담기 버튼, 항공편/바우처 표시에 씀.
export function CalendarIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke={color} strokeWidth="1.7" />
      <path d="M3.5 9.5h17" stroke={color} strokeWidth="1.7" />
      <path d="M8 3v3.5M16 3v3.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <rect x="7" y="12.3" width="3" height="3" rx="0.7" fill={color} />
    </svg>
  );
}

export function TicketIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5a2 2 0 0 1 0-4V4.5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1V5.5a2 2 0 0 1 0 4v1a2 2 0 0 1 0 4v1a2 2 0 0 1 0 4v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1a2 2 0 0 1 0-4z"
            fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 4v16" stroke={color} strokeWidth="1.5" strokeDasharray="2.2 2.2" />
    </svg>
  );
}

export function PaperclipIcon({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M17 7.5l-7.6 7.6a3 3 0 104.24 4.24l8.02-8.02a5 5 0 00-7.07-7.07L6.2 11.66a7 7 0 009.9 9.9"
            stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlaneBadgeIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2.5 13.2L21 7.6c1.1-.3 1.9.9 1.3 1.8l-2.1 3.2-6.6 1.9-1 5.7-1.9.6-.7-5.3-5.7 1.6-1.7-2.2 4-2.3-4.1-1.7z" fill={color} />
    </svg>
  );
}
