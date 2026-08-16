import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { C, TYPES } from "../theme";
import { s } from "../styles";
import { WalkTtubeogi } from "./TtubeogiCharacter";
import { ExpandIcon, CollapseIcon } from "./Icons";
import { fetchRoute } from "../lib/api";

// Leaflet의 기본 divIcon 스타일(흰 배경+테두리)을 지우기 위한 클래스. 마커/캐릭터 둘 다 씀.
// .ttubeogi-marker-label: 상시 표시 라벨(시간+장소명)을 Leaflet 기본 툴팁 박스 대신 앱 톤에 맞는 작은 알약 모양으로.
const RESET_CSS = `
.ttubeogi-div-icon { background: transparent; border: none; }
.ttubeogi-marker-label {
  background: ${C.ink}; color: #fff; border: none; box-shadow: 0 2px 6px rgba(0,0,0,.25);
  padding: 3px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap;
}
.ttubeogi-marker-label::before { border-top-color: ${C.ink}; }
.ttubeogi-duration-label {
  background: #fff; color: ${C.ink}; border: 1.5px solid ${C.orange};
  padding: 2px 8px; border-radius: 20px; font-size: 10.5px; font-weight: 800; white-space: nowrap;
  box-shadow: 0 2px 5px rgba(0,0,0,.2);
}
`;

// "5분" / "1시간 20분" 형태로 — 초 단위 소요시간을 사람이 읽기 편하게.
function formatDuration(sec) {
  const min = Math.round(sec / 60);
  if (min < 1) return "1분 미만";
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

// 두 좌표 사이 직선거리(m) — 도로 API가 실패해서 직선으로 대체한 구간의 소요시간을
// "이동수단별 대략적인 평균 속도"로 추정할 때 씀(정확한 값이 아니라 대략적인 참고용).
function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const FALLBACK_SPEED_KMH = { 도보: 4.5, 지하철: 30, 트램: 20, 버스: 20, 택시: 25, 자차: 30, 기타: 15 };

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

// 자차/택시 — 바퀴가 살짝 통통 튀는 정도만 표현(걷기처럼 다리 애니메이션은 필요 없음).
function carIconHtml({ step, facing, size = 40 }) {
  const bob = step % 2 === 0 ? -1 : 0;
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" style="overflow:visible;transform:scaleX(${facing});filter:drop-shadow(0 3px 3px rgba(0,0,0,.2));">
    <ellipse cx="20" cy="30" rx="11" ry="2.2" fill="rgba(0,0,0,.13)" />
    <g transform="translate(0, ${bob})">
      <rect x="7" y="16" width="26" height="10" rx="4" fill="${C.orange}" />
      <path d="M 12 16 L 15 10 L 27 10 L 30 16 Z" fill="${C.cream}" stroke="${C.creamShade}" stroke-width="0.8" />
      <rect x="17" y="11.5" width="2" height="3.5" fill="${C.creamShade}" opacity="0.6" />
      <circle cx="13" cy="27" r="3.2" fill="${C.ink}" /><circle cx="13" cy="27" r="1.2" fill="${C.muted}" />
      <circle cx="27" cy="27" r="3.2" fill="${C.ink}" /><circle cx="27" cy="27" r="1.2" fill="${C.muted}" />
      <circle cx="30" cy="19" r="1.3" fill="#fff" opacity="0.85" />
    </g>
  </svg>`;
}

// 버스 — 자차보다 크고 각진 차체 + 창문 여러 개.
function busIconHtml({ step, facing, size = 40 }) {
  const bob = step % 2 === 0 ? -1 : 0;
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" style="overflow:visible;transform:scaleX(${facing});filter:drop-shadow(0 3px 3px rgba(0,0,0,.2));">
    <ellipse cx="20" cy="31" rx="12" ry="2.2" fill="rgba(0,0,0,.13)" />
    <g transform="translate(0, ${bob})">
      <rect x="6" y="9" width="28" height="18" rx="4" fill="${C.member2}" />
      <rect x="9" y="12.5" width="5" height="5" rx="1" fill="${C.cream}" />
      <rect x="15.5" y="12.5" width="5" height="5" rx="1" fill="${C.cream}" />
      <rect x="22" y="12.5" width="5" height="5" rx="1" fill="${C.cream}" />
      <rect x="6" y="21" width="28" height="3" fill="rgba(255,255,255,.35)" />
      <circle cx="13" cy="28" r="3" fill="${C.ink}" /><circle cx="13" cy="28" r="1.1" fill="${C.muted}" />
      <circle cx="27" cy="28" r="3" fill="${C.ink}" /><circle cx="27" cy="28" r="1.1" fill="${C.muted}" />
    </g>
  </svg>`;
}

// 지하철/트램 — 바퀴 없이 레일 위를 미끄러지듯 이동, 창문 줄이 특징.
function trainIconHtml({ step, facing, size = 40 }) {
  const slide = step % 2 === 0 ? 0 : 0.6;
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" style="overflow:visible;transform:scaleX(${facing});filter:drop-shadow(0 3px 3px rgba(0,0,0,.2));">
    <ellipse cx="20" cy="30" rx="12" ry="2.2" fill="rgba(0,0,0,.13)" />
    <g transform="translate(${slide}, 0)">
      <rect x="6" y="10" width="28" height="17" rx="6" fill="${C.member3}" />
      <rect x="9" y="14" width="4.5" height="5" rx="1" fill="${C.cream}" />
      <rect x="15" y="14" width="4.5" height="5" rx="1" fill="${C.cream}" />
      <rect x="21" y="14" width="4.5" height="5" rx="1" fill="${C.cream}" />
      <rect x="27" y="14" width="4.5" height="5" rx="1" fill="${C.cream}" />
      <rect x="9" y="24" width="22" height="2" fill="rgba(255,255,255,.3)" />
    </g>
  </svg>`;
}

// 항공 — 도로/레일 없이 하늘을 가로지르는 느낌으로 그림자 없이, 살짝 위아래로 흔들리게.
function planeIconHtml({ step, facing, size = 40 }) {
  const bob = step % 2 === 0 ? -1.5 : 1.5;
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" style="overflow:visible;transform:scaleX(${facing});filter:drop-shadow(0 4px 4px rgba(0,0,0,.15));">
    <g transform="translate(0, ${bob}) rotate(-8 20 20)">
      <path d="M 6 21 L 30 19 L 34 21 L 30 23 L 6 23 Z" fill="${TYPES.항공.color}" />
      <path d="M 16 20 L 10 12 L 14 12 L 21 20 Z" fill="${TYPES.항공.color}" opacity="0.85" />
      <path d="M 16 22 L 10 30 L 14 30 L 21 22 Z" fill="${TYPES.항공.color}" opacity="0.85" />
      <path d="M 28 20 L 33 17.5 L 33 20 Z" fill="${TYPES.항공.color}" opacity="0.7" />
      <circle cx="27" cy="21" r="1.3" fill="#fff" opacity="0.8" />
    </g>
  </svg>`;
}

// 이동수단별 속도(프레임당 전진하는 경로점 개수)와 아이콘. 도보 기준(3)에서 빠른 교통수단일수록
// 배수로 빠르게 — "비행기인데 걷는 속도로 가면 이상하다"는 피드백으로 추가.
// 자차/항공 모두 "너무 빨라서 캐릭터가 안 보인다"는 피드백으로 여러 차례 더 낮춤 — 보는
// 재미가 있으려면 최소 프레임 수가 확보돼야 한다는 게 핵심.
const MOVE_STYLE = {
  도보: { stepPerFrame: 3, icon: walkerIconHtml, drawShadow: true },
  지하철: { stepPerFrame: 7, icon: trainIconHtml },
  트램: { stepPerFrame: 6, icon: trainIconHtml },
  버스: { stepPerFrame: 6, icon: busIconHtml },
  택시: { stepPerFrame: 5, icon: carIconHtml },
  자차: { stepPerFrame: 5, icon: carIconHtml },
  // 항공은 직선 고정 48포인트 경로(OSRM 안 씀) — 1은 한 프레임에 점 하나씩만 전진하는
  // 최대 저속(이 경로 방식에서 가능한 가장 느린 속도)으로, 약 49프레임(~800ms) 동안 보임.
  항공: { stepPerFrame: 1, icon: planeIconHtml },
  기타: { stepPerFrame: 3, icon: walkerIconHtml },
};
function moveStyleFor(move) {
  return MOVE_STYLE[move] || MOVE_STYLE.기타;
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
// 비행기 구간은 애초에 도로를 따라갈 이유가 없어서(국내외 장거리는 OSRM 자동차 경로 자체가 무의미)
// API를 부르지 않고 항상 직선으로 잇는다.
// move는 "이 항목에서 다음 항목으로 이동하는 수단"으로 취급한다(moves[i] = points[i]→points[i+1] 구간) —
// 도착지가 아니라 출발지 항목에 걸어야 적용되는 게 더 직관적이라는 피드백으로 바꿈
// (예: "김포공항"에 이동수단=항공을 걸면 거기서 다음 장소로 가는 구간이 비행기가 됨).
// 경로(path)뿐 아니라 구간별 소요시간도 같이 계산해서 돌려준다 — 실제 도로 API가 준 duration을
// 최우선으로 쓰고, API가 실패해서 직선으로 대체한 구간은 이동수단 평균 속도로 대략 추정한다.
// 비행기 구간은 거리로 소요시간을 추정하는 게 의미가 없어서(실제 항공편 스케줄과 무관) 아예
// 표시 안 함 — 없는 데이터를 지어내는 대신 생략하는 쪽을 택함.
async function buildRoadPath(points, moves) {
  const segResults = await Promise.all(
    points.slice(0, -1).map(async (a, i) => {
      const b = points[i + 1];
      const move = moves[i];
      if (move === "항공") return { path: interpolateStraight(a, b, i), durationSec: null };

      const profile = move === "도보" ? "foot" : "driving";
      const routeData = await fetchRoute(a, b, profile).catch(() => null);
      if (routeData?.points?.length > 1) {
        return {
          path: routeData.points.map(([lat, lng]) => ({ lat, lng, seg: i })),
          durationSec: routeData.durationSec ?? null,
        };
      }
      const distanceM = haversineMeters(a, b);
      const speedKmh = FALLBACK_SPEED_KMH[move] || FALLBACK_SPEED_KMH.기타;
      return { path: interpolateStraight(a, b, i), durationSec: (distanceM / 1000 / speedKmh) * 3600 };
    })
  );

  const path = segResults.flatMap((r) => r.path);
  const last = points[points.length - 1];
  path.push({ lat: last.lat, lng: last.lng, seg: points.length - 2 });

  // 라벨을 놓을 위치 — 두 지점의 산술 중점이 아니라 실제 경로(도로/직선) 위의 중간 지점을 써서
  // 굽은 길에서도 라벨이 경로 위에 자연스럽게 얹히게 한다.
  const segmentDurations = segResults.map((r, i) => ({
    seg: i,
    durationSec: r.durationSec,
    mid: r.path[Math.floor(r.path.length / 2)],
  }));

  return { path, segmentDurations };
}

export default function PlanMap({ items, onGoToList, onSelectItem }) {
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 전체화면으로 바뀌면 지도 컨테이너의 실제 픽셀 크기가 달라지므로, Leaflet이 갖고 있던 크기
  // 캐시를 다시 재보 하게 함(안 하면 타일이 원래 작은 크기 기준으로만 채워져서 빈 공간이 생김).
  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 60);
    return () => clearTimeout(t);
  }, [isFullscreen]);
  // Leaflet 마커의 click 핸들러는 데이터 이펙트가 재실행될 때만 다시 바인딩되므로,
  // walkTo 내부에서는 state를 직접 읽지 말고 항상 최신값을 담고 있는 ref를 읽는다(오래된 클로저 방지).
  const currentRef = useRef(current);
  const walkingRef = useRef(walking);
  const onSelectItemRef = useRef(onSelectItem);
  useEffect(() => { currentRef.current = current; }, [current]);
  useEffect(() => { walkingRef.current = walking; }, [walking]);
  useEffect(() => { onSelectItemRef.current = onSelectItem; }, [onSelectItem]);

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
      // 탭해야만 보이던 툴팁 대신 항상 시간+장소명이 라벨로 붙어있게(permanent) — 지도만 보고도
      // 몇 시에 어딜 가는지 알 수 있어야 한다는 피드백. 클릭하면 캐릭터가 걸어가는 것도 그대로 두고,
      // 추가로 해당 항목 상세로 이동(리스트 탭 + 하이라이트)하는 콜백도 같이 호출.
      marker.bindTooltip(`${it.time ? it.time + " " : ""}${it.name}`, {
        permanent: true, direction: "top", offset: [0, -10], className: "ttubeogi-marker-label",
      });
      marker.on("click", () => {
        walkTo(i);
        onSelectItemRef.current?.(it.id);
      });
    });

    const walker = L.marker([geocoded[0].lat, geocoded[0].lng], {
      icon: L.divIcon({ html: walkerIconHtml({ step: 0, facing: 1, walking: false }), className: "ttubeogi-div-icon", iconSize: [40, 40], iconAnchor: [20, 34] }),
      zIndexOffset: 1000,
    }).addTo(layerGroupRef.current);
    walkerMarkerRef.current = walker;

    // 좌표가 하나도 없을 땐 지도 컨테이너를 display:none으로 숨겨두므로, 방금 다시 보이게 된
    // 시점엔 Leaflet이 갖고 있던 크기 캐시가 낡아있다 — fitBounds 전에 다시 재보 게 함.
    map.invalidateSize();
    map.fitBounds(latlngs.length > 1 ? latlngs : [latlngs[0], latlngs[0]], { padding: [30, 30], maxZoom: 16 });

    if (geocoded.length > 1) {
      setRoutesLoading(true);
      buildRoadPath(geocoded, geocoded.map((it) => it.move)).then(({ path, segmentDurations }) => {
        if (cancelled) return;
        fullPathRef.current = path;
        L.polyline(path.map((p) => [p.lat, p.lng]), { color: C.orange, weight: 3, opacity: 0.7 }).addTo(layerGroupRef.current);
        segmentDurations.forEach((sd) => {
          if (sd.durationSec == null || !sd.mid) return;
          L.marker([sd.mid.lat, sd.mid.lng], {
            icon: L.divIcon({
              html: `<div class="ttubeogi-duration-label">${formatDuration(sd.durationSec)}</div>`,
              className: "ttubeogi-div-icon", iconSize: [60, 22], iconAnchor: [30, 11],
            }),
            interactive: false,
          }).addTo(layerGroupRef.current);
        });
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
    // 프레임당 경로점 하나씩만 전진 + requestAnimationFrame을 setTimeout으로 한번 더 감싸던 이전 방식은
    // 사실상 프레임을 두 번씩 걸러 뛰는 셈이라 체감 속도가 느렸다. rAF 하나로만 돌리고, 이동수단별로
    // 프레임당 전진하는 경로점 개수(속도)와 아이콘을 다르게 함(비행기는 빠르고 비행기 모양 등).
    const animate = () => {
      if (i >= seg.length) {
        walkerMarkerRef.current.setLatLng([geocoded[clamped].lat, geocoded[clamped].lng]);
        walkerMarkerRef.current.setIcon(L.divIcon({
          html: walkerIconHtml({ step: 0, facing: walkStateRef.current.facing, walking: false }),
          className: "ttubeogi-div-icon", iconSize: [40, 40], iconAnchor: [20, 34],
        }));
        setCurrent(clamped);
        setWalking(false);
        return;
      }
      const p = seg[i];
      const move = geocoded[p.seg]?.move;
      const style = moveStyleFor(move);
      walkStateRef.current.facing = p.lng >= prev.lng ? 1 : -1;
      walkStateRef.current.step = (walkStateRef.current.step + 1) % 4;
      walkerMarkerRef.current.setLatLng([p.lat, p.lng]);
      walkerMarkerRef.current.setIcon(L.divIcon({
        html: style.icon({ step: walkStateRef.current.step, facing: walkStateRef.current.facing, walking: true }),
        className: "ttubeogi-div-icon", iconSize: [40, 40], iconAnchor: [20, 34],
      }));
      prev = p;
      i += style.stepPerFrame;
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();
  }

  const navBlock = geocoded.length > 0 && (
    <>
      <div style={{ ...s.progressLabel, textAlign: "center", margin: "10px 0" }}>
        {current + 1} / {geocoded.length} · {geocoded[current]?.name}
      </div>
      <div style={s.nav}>
        <button style={{ ...s.navBtn, ...s.navPrev }} disabled={walking || routesLoading || current === 0} onClick={() => walkTo(current - 1)}>◀ 이전</button>
        <button style={{ ...s.navBtn, ...s.navNow }} disabled={walking || routesLoading} onClick={() => walkTo(0)}>처음</button>
        <button style={{ ...s.navBtn, ...s.navNext }} disabled={walking || routesLoading || current === geocoded.length - 1} onClick={() => walkTo(current + 1)}>다음 ▶</button>
      </div>
    </>
  );

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

      {/* 찍을 위치가 없을 때도 지도 컨테이너 자체는 계속 렌더링해둔다(Leaflet 인스턴스를 유지해야
          나중에 좌표가 생겼을 때 새로 만들 필요 없이 바로 마커가 붙는다) — 대신 display:none으로
          화면에서만 숨겨서, 찍을 것도 없는데 빈 지도 미리보기가 어정쩡하게 보이던 문제를 없앤다.
          전체화면 버튼을 누르면 이 프레임 자체를 화면 전체를 덮는 고정 레이어로 바꾼다 — 지도
          컨테이너 DOM을 그대로 두고 스타일만 바꿔서 Leaflet 인스턴스가 안 깨지게 함. */}
      <div style={{
        ...s.tripMapFrame,
        ...(geocoded.length === 0 ? { display: "none" } : {}),
        ...(isFullscreen ? s.tripMapFrameFullscreen : {}),
      }}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        {geocoded.length > 0 && (
          <button
            style={s.mapFullscreenBtn}
            title={isFullscreen ? "전체화면 닫기" : "전체화면으로 보기"}
            onClick={() => setIsFullscreen((v) => !v)}
          >
            {isFullscreen ? <CollapseIcon size={16} color={C.ink} /> : <ExpandIcon size={16} color={C.ink} />}
          </button>
        )}
        {isFullscreen && <div style={s.mapFullscreenNav}>{navBlock}</div>}
      </div>

      {!isFullscreen && geocoded.length > 0 && (
        <>
          {skippedCount > 0 && (
            <div style={s.formHint}>{skippedCount}개 항목은 좌표가 없어 지도에 안 보여요.</div>
          )}
          {routesLoading && <div style={s.formHint}>실제 도로 경로를 불러오는 중…</div>}
          {navBlock}
        </>
      )}
    </div>
  );
}
