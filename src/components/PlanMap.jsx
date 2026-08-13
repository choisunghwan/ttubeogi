import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { C, TYPES } from "../theme";
import { s } from "../styles";
import { WalkTtubeogi } from "./TtubeogiCharacter";
import { fetchRoute } from "../lib/api";

// Leaflet의 기본 divIcon 스타일(흰 배경+테두리)을 지우기 위한 클래스. 마커/캐릭터 둘 다 씀.
const RESET_CSS = `.ttubeogi-div-icon { background: transparent; border: none; }`;

function walkerIconHtml({ step, facing, walking, size = 40 }) {
  const bob = walking ? (step % 2 === 0 ? -1.5 : 0.5) : 0;
  const legPhase = step % 2 === 0;
  const leg1 = walking && legPhase ? "rotate(-12 15 30)" : "";
  const leg2 = walking && !legPhase ? "rotate(12 24 30)" : "";
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" style="overflow:visible;transform:scaleX(${facing});filter:drop-shadow(0 3px 3px rgba(0,0,0,.2));">
    <ellipse cx="20" cy="37" rx="${walking ? 8 : 9}" ry="2.2" fill="rgba(0,0,0,.13)" />
    <g transform="translate(0, ${bob})">
      <rect x="${legPhase ? 13.5 : 15}" y="29" width="3.4" height="6" rx="1.7" fill="${C.creamShade}" transform="${leg1}" />
      <rect x="${legPhase ? 23 : 21.5}" y="29" width="3.4" height="6" rx="1.7" fill="${C.creamShade}" transform="${leg2}" />
      <rect x="5.5" y="16" width="9" height="12" rx="4" fill="${C.orange}" />
      <rect x="7" y="19" width="4.5" height="5" rx="1.5" fill="${C.orangeDeep}" opacity="0.6" />
      <rect x="9" y="12" width="22" height="20" rx="10" fill="${C.cream}" stroke="${C.creamShade}" stroke-width="0.8" />
      <ellipse cx="14.5" cy="23" rx="2" ry="1.3" fill="#f6c9a0" opacity="0.7" />
      <ellipse cx="26" cy="23" rx="2" ry="1.3" fill="#f6c9a0" opacity="0.7" />
      <circle cx="16.5" cy="20" r="1.7" fill="${C.ink}" /><circle cx="24" cy="20" r="1.7" fill="${C.ink}" />
      <circle cx="17.1" cy="19.4" r="0.55" fill="#fff" /><circle cx="24.6" cy="19.4" r="0.55" fill="#fff" />
      <path d="M 18.5 24 Q 20.5 26 22.5 24" fill="none" stroke="${C.ink}" stroke-width="1" stroke-linecap="round" />
      <line x1="20" y1="12" x2="20" y2="8" stroke="${C.orangeDeep}" stroke-width="0.9" />
      <path d="M 20 8 L 24 9.2 L 20 10.4 Z" fill="${C.orange}" />
    </g>
  </svg>`;
}

function pinIconHtml(number, color, active) {
  const d = active ? 30 : 24;
  return `<div style="width:${d}px;height:${d}px;border-radius:50%;background:${color};border:2px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;
    font-weight:700;font-size:${active ? 13 : 11}px;">${number}</div>`;
}

// 직선 보간(도로 API가 실패했을 때만 쓰는 대체 경로) — 좌표 두 점 사이를 stepsPerSeg만큼 잘게 쪼갠다.
function interpolateStraight(a, b, seg, stepsPerSeg = 48) {
  const path = [];
  for (let st = 0; st < stepsPerSeg; st++) {
    const t = st / stepsPerSeg;
    path.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t, seg });
  }
  return path;
}

// 항목들 사이를 실제 도로를 따라 잇는다. OSRM이 응답을 못 주는 구간만 직선으로 대체(완전히 끊기지 않게).
async function buildRoadPath(points, moves) {
  const segments = await Promise.all(
    points.slice(0, -1).map(async (a, i) => {
      const b = points[i + 1];
      const profile = moves[i + 1] === "도보" ? "foot" : "driving";
      const roadPoints = await fetchRoute(a, b, profile).catch(() => null);
      if (roadPoints?.length > 1) {
        return roadPoints.map(([lat, lng]) => ({ lat, lng, seg: i }));
      }
      return interpolateStraight(a, b, i);
    })
  );
  const path = segments.flat();
  const last = points[points.length - 1];
  path.push({ lat: last.lat, lng: last.lng, seg: points.length - 2 });
  return path;
}

export default function PlanMap({ items, onGoToList }) {
  const geocoded = items.filter((it) => it.lat != null && it.lng != null);
  const skippedCount = items.length - geocoded.length;

  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);
  const walkerMarkerRef = useRef(null);
  const fullPathRef = useRef([]);
  const rafRef = useRef(null);
  const walkStateRef = useRef({ step: 0, facing: 1 });

  const [current, setCurrent] = useState(0);
  const [walking, setWalking] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);
  // Leaflet 마커의 click 핸들러는 데이터 이펙트가 재실행될 때만 다시 바인딩되므로,
  // walkTo 내부에서는 state를 직접 읽지 말고 항상 최신값을 담고 있는 ref를 읽는다(오래된 클로저 방지).
  const currentRef = useRef(current);
  const walkingRef = useRef(walking);
  useEffect(() => { currentRef.current = current; }, [current]);
  useEffect(() => { walkingRef.current = walking; }, [walking]);

  // 지도 인스턴스는 한 번만 생성 — 컨테이너는 좌표 유무와 상관없이 항상 렌더링되므로(아래 return 참고)
  // "처음 열었을 때 좌표 있는 항목이 하나도 없다가 나중에 생기는" 경우에도 문제없이 갱신된다.
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true })
      .setView([36.5, 127.8], 7); // 기본값(대한민국 중앙) — 데이터 로드되면 fitBounds로 바로 덮어씀
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
      maxZoom: 20,
    }).addTo(map);
    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      cancelAnimationFrame(rafRef.current);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 항목이 바뀌면(추가/삭제/최초 로드) 마커·경로를 다시 그린다. 경로는 OSRM으로 실제 도로를 따라 받아오므로 비동기.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;

    layerGroupRef.current.clearLayers();
    walkerMarkerRef.current = null;
    fullPathRef.current = [];
    setCurrent(0);
    if (geocoded.length === 0) return;

    const latlngs = geocoded.map((it) => [it.lat, it.lng]);

    geocoded.forEach((it, i) => {
      const t = TYPES[it.type] || TYPES.기타;
      const marker = L.marker([it.lat, it.lng], {
        icon: L.divIcon({ html: pinIconHtml(i + 1, t.color, i === 0), className: "ttubeogi-div-icon", iconSize: [30, 30], iconAnchor: [15, 15] }),
      }).addTo(layerGroupRef.current);
      marker.on("click", () => walkTo(i));
      marker.bindTooltip(`${it.time ? it.time + " " : ""}${it.name}`, { direction: "top" });
    });

    const walker = L.marker([geocoded[0].lat, geocoded[0].lng], {
      icon: L.divIcon({ html: walkerIconHtml({ step: 0, facing: 1, walking: false }), className: "ttubeogi-div-icon", iconSize: [40, 40], iconAnchor: [20, 34] }),
      zIndexOffset: 1000,
    }).addTo(layerGroupRef.current);
    walkerMarkerRef.current = walker;

    map.fitBounds(latlngs.length > 1 ? latlngs : [latlngs[0], latlngs[0]], { padding: [30, 30], maxZoom: 16 });

    if (geocoded.length > 1) {
      setRoutesLoading(true);
      buildRoadPath(geocoded, geocoded.map((it) => it.move)).then((path) => {
        if (cancelled) return;
        fullPathRef.current = path;
        L.polyline(path.map((p) => [p.lat, p.lng]), { color: C.orange, weight: 3, opacity: 0.7 }).addTo(layerGroupRef.current);
        setRoutesLoading(false);
      });
    }

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geocoded.map((it) => `${it.id}:${it.lat}:${it.lng}:${it.move}`).join(",")]);

  function walkTo(targetIdx) {
    const curNow = currentRef.current;
    if (walkingRef.current || !mapRef.current) return;
    const clamped = Math.max(0, Math.min(geocoded.length - 1, targetIdx));
    if (clamped === curNow) return;
    const from = Math.min(curNow, clamped), to = Math.max(curNow, clamped);
    let seg = fullPathRef.current.filter((p) => p.seg >= from && p.seg < to);
    if (clamped < curNow) seg = seg.reverse();

    if (seg.length === 0) { setCurrent(clamped); return; }
    setWalking(true);
    let i = 0;
    let prev = { lat: geocoded[curNow].lat, lng: geocoded[curNow].lng };
    const animate = () => {
      if (i >= seg.length) {
        walkerMarkerRef.current.setLatLng([geocoded[clamped].lat, geocoded[clamped].lng]);
        setCurrent(clamped);
        setWalking(false);
        return;
      }
      const p = seg[i];
      walkStateRef.current.facing = p.lng >= prev.lng ? 1 : -1;
      walkStateRef.current.step = (walkStateRef.current.step + 1) % 4;
      walkerMarkerRef.current.setLatLng([p.lat, p.lng]);
      walkerMarkerRef.current.setIcon(L.divIcon({
        html: walkerIconHtml({ step: walkStateRef.current.step, facing: walkStateRef.current.facing, walking: true }),
        className: "ttubeogi-div-icon", iconSize: [40, 40], iconAnchor: [20, 34],
      }));
      prev = p;
      i += 1;
      rafRef.current = requestAnimationFrame(() => setTimeout(animate, 16));
    };
    animate();
  }

  return (
    <div>
      <style>{RESET_CSS}</style>

      {geocoded.length === 0 && (
        <div style={{ ...s.hint, flexDirection: "column", gap: 10, padding: "22px 16px", textAlign: "center" }}>
          <WalkTtubeogi size={32} />
          <div>
            지도에 찍을 위치가 아직 없어요.<br />
            일정 탭에서 항목을 열어 <b>"🔍 좌표 찾기"</b>로 위치를 찾아주세요.
          </div>
          {onGoToList && (
            <button style={{ ...s.pickerBtn, ...s.pickerBtnOn }} onClick={onGoToList}>📋 일정 탭으로 이동</button>
          )}
        </div>
      )}

      <div style={{ ...s.tripMapFrame, ...(geocoded.length === 0 ? { height: 140, marginTop: 12 } : {}) }}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>

      {geocoded.length > 0 && (
        <>
          {skippedCount > 0 && (
            <div style={s.formHint}>{skippedCount}개 항목은 좌표가 없어 지도에 안 보여요.</div>
          )}
          {routesLoading && <div style={s.formHint}>실제 도로 경로를 불러오는 중…</div>}
          <div style={{ ...s.progressLabel, textAlign: "center", margin: "10px 0" }}>
            {current + 1} / {geocoded.length} · {geocoded[current]?.name}
          </div>
          <div style={s.nav}>
            <button style={{ ...s.navBtn, ...s.navPrev }} disabled={walking || routesLoading || current === 0} onClick={() => walkTo(current - 1)}>◀ 이전</button>
            <button style={{ ...s.navBtn, ...s.navNow }} disabled={walking || routesLoading} onClick={() => walkTo(0)}>처음</button>
            <button style={{ ...s.navBtn, ...s.navNext }} disabled={walking || routesLoading || current === geocoded.length - 1} onClick={() => walkTo(current + 1)}>다음 ▶</button>
          </div>
        </>
      )}
    </div>
  );
}
