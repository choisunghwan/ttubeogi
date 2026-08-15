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

export function PersonIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7.5" r="3.8" fill={color} />
      <path d="M4 20.5c0-4.2 3.6-7 8-7s8 2.8 8 7" stroke={color} strokeWidth="2.1" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function SuitcaseIcon({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="8" width="18" height="12.5" rx="2.4" stroke={color} strokeWidth="1.7" />
      <path d="M8.5 8V5.5a1.5 1.5 0 011.5-1.5h4a1.5 1.5 0 011.5 1.5V8" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M3 13.5h18" stroke={color} strokeWidth="1.7" />
      <path d="M10.5 13.5v1.6M13.5 13.5v1.6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function GlobeIcon({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" />
      <ellipse cx="12" cy="12" rx="4" ry="9" stroke={color} strokeWidth="1.6" />
      <path d="M3 12h18M4.5 7h15M4.5 17h15" stroke={color} strokeWidth="1.4" />
    </svg>
  );
}

export function MedalIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="14" r="6.5" fill={color} opacity="0.16" stroke={color} strokeWidth="1.6" />
      <path d="M10 3.5l2 3.7 2-3.7" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10.5l1.4 2.9 3.1.4-2.3 2.2.6 3.1L12 17.6l-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z" fill={color} />
    </svg>
  );
}

export function ListIcon({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="4.5" cy="6" r="1.3" fill={color} />
      <circle cx="4.5" cy="12" r="1.3" fill={color} />
      <circle cx="4.5" cy="18" r="1.3" fill={color} />
      <path d="M9 6h11M9 12h11M9 18h11" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function MapPinIcon({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 21.5s7-6.7 7-12.3A7 7 0 105 9.2c0 5.6 7 12.3 7 12.3z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.6" fill={color} />
    </svg>
  );
}

export function ExpandIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 4H4v5M15 4h5v5M4 15v5h5M20 15v5h-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CollapseIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 9h5V4M15 4v5h5M20 15h-5v5M9 20v-5H4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShareIcon({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="18" cy="5" r="3" stroke={color} strokeWidth="1.7" />
      <circle cx="6" cy="12" r="3" stroke={color} strokeWidth="1.7" />
      <circle cx="18" cy="19" r="3" stroke={color} strokeWidth="1.7" />
      <path d="M8.6 10.5L15.4 6.5M8.6 13.5l6.8 4" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function CopyIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="8.5" y="8.5" width="12" height="12" rx="2.2" stroke={color} strokeWidth="1.7" />
      <path d="M15.5 8.5V6a2 2 0 00-2-2H5.5a2 2 0 00-2 2v8a2 2 0 002 2h2.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function KakaoDotIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#FEE500" />
      <path d="M12 6.5c-3.6 0-6.5 2.3-6.5 5.1 0 1.8 1.2 3.4 3 4.3l-.7 2.6a.4.4 0 00.6.4l2.9-2c.2 0 .5 0 .7 0 3.6 0 6.5-2.3 6.5-5.1S15.6 6.5 12 6.5z" fill="#391B1B" />
    </svg>
  );
}
