import React from "react";
import { C } from "../theme";

// 데모(ttubeogi.jsx)의 SVG 캐릭터 3종 그대로 — 이 파일이 앱의 시각적 핵심 정체성.
export function WalkTtubeogi({ size = 40, step = 0, facing = 1, walking = false }) {
  const bob = walking ? (step % 2 === 0 ? -1.5 : 0.5) : 0;
  const legPhase = step % 2 === 0;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40"
      style={{ overflow: "visible", transform: `scaleX(${facing})`,
               filter: "drop-shadow(0 3px 3px rgba(0,0,0,.2))" }}>
      <ellipse cx="20" cy="37" rx={walking ? 8 : 9} ry="2.2" fill="rgba(0,0,0,.13)" />
      <g transform={`translate(0, ${bob})`}>
        <rect x={legPhase ? 13.5 : 15} y="29" width="3.4" height="6" rx="1.7"
              fill={C.creamShade} transform={walking && legPhase ? "rotate(-12 15 30)" : ""} />
        <rect x={legPhase ? 23 : 21.5} y="29" width="3.4" height="6" rx="1.7"
              fill={C.creamShade} transform={walking && !legPhase ? "rotate(12 24 30)" : ""} />
        <rect x="5.5" y="16" width="9" height="12" rx="4" fill={C.orange} />
        <rect x="7" y="19" width="4.5" height="5" rx="1.5" fill={C.orangeDeep} opacity="0.6" />
        <rect x="9" y="12" width="22" height="20" rx="10" fill={C.cream} stroke={C.creamShade} strokeWidth="0.8" />
        <ellipse cx="14.5" cy="23" rx="2" ry="1.3" fill="#f6c9a0" opacity="0.7" />
        <ellipse cx="26" cy="23" rx="2" ry="1.3" fill="#f6c9a0" opacity="0.7" />
        <circle cx="16.5" cy="20" r="1.7" fill={C.ink} />
        <circle cx="24" cy="20" r="1.7" fill={C.ink} />
        <circle cx="17.1" cy="19.4" r="0.55" fill="#fff" />
        <circle cx="24.6" cy="19.4" r="0.55" fill="#fff" />
        <path d="M 18.5 24 Q 20.5 26 22.5 24" fill="none" stroke={C.ink} strokeWidth="1" strokeLinecap="round" />
        <line x1="20" y1="12" x2="20" y2="8" stroke={C.orangeDeep} strokeWidth="0.9" />
        <path d="M 20 8 L 24 9.2 L 20 10.4 Z" fill={C.orange} />
      </g>
    </svg>
  );
}

export function SittingTtubeogi({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40"
         style={{ overflow: "visible", filter: "drop-shadow(0 2px 3px rgba(0,0,0,.25))" }}>
      <ellipse cx="20" cy="35" rx="11" ry="2.4" fill="rgba(0,0,0,.12)" />
      <g fill="#f5c451">
        <path d="M 6 10 l 1 2.4 l 2.4 1 l -2.4 1 l -1 2.4 l -1 -2.4 l -2.4 -1 l 2.4 -1 z" />
        <path d="M 33 14 l .8 1.8 l 1.8 .8 l -1.8 .8 l -.8 1.8 l -.8 -1.8 l -1.8 -.8 l 1.8 -.8 z" />
      </g>
      <rect x="7" y="18" width="8" height="11" rx="4" fill={C.orange} />
      <path d="M 10 18 Q 10 12 20 12 Q 30 12 30 18 L 31 30 Q 31 34 20 34 Q 9 34 9 30 Z"
            fill={C.cream} stroke={C.creamShade} strokeWidth="0.8" />
      <ellipse cx="14.5" cy="22" rx="2" ry="1.3" fill="#f6c9a0" opacity="0.7" />
      <ellipse cx="26" cy="22" rx="2" ry="1.3" fill="#f6c9a0" opacity="0.7" />
      <circle cx="16.5" cy="19.5" r="1.7" fill={C.ink} />
      <circle cx="24" cy="19.5" r="1.7" fill={C.ink} />
      <circle cx="17.1" cy="18.9" r="0.55" fill="#fff" />
      <circle cx="24.6" cy="18.9" r="0.55" fill="#fff" />
      <path d="M 18 23.5 Q 20 25.5 22 23.5" fill="none" stroke={C.ink} strokeWidth="1" strokeLinecap="round" />
      <line x1="20" y1="12" x2="20" y2="8" stroke={C.orangeDeep} strokeWidth="0.9" />
      <path d="M 20 8 L 24 9.2 L 20 10.4 Z" fill={C.orange} />
    </svg>
  );
}

export function Footprint({ size, opacity, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={{ opacity }}>
      <ellipse cx="10" cy="12" rx="5" ry="6.5" fill={color} />
      <ellipse cx="5.5" cy="5" rx="1.6" ry="2" fill={color} />
      <ellipse cx="9" cy="3.4" rx="1.7" ry="2.1" fill={color} />
      <ellipse cx="13" cy="4" rx="1.7" ry="2.1" fill={color} />
      <ellipse cx="15.6" cy="6.5" rx="1.4" ry="1.8" fill={color} />
    </svg>
  );
}
