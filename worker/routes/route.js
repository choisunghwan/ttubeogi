import { Hono } from "hono";

const app = new Hono();

// GET /api/route?fromLat=&fromLng=&toLat=&toLng=&profile=foot|driving
// OSRM 공개 데모 서버로 실제 도로를 따라가는 경로를 받아온다 (무료, 키 불필요).
// 데모 서버라 과도한 트래픽에는 안 맞지만 개인/소규모 사용은 문제없음.
app.get("/", async (c) => {
  const fromLat = Number(c.req.query("fromLat"));
  const fromLng = Number(c.req.query("fromLng"));
  const toLat = Number(c.req.query("toLat"));
  const toLng = Number(c.req.query("toLng"));
  const profile = c.req.query("profile") === "driving" ? "driving" : "foot";

  if ([fromLat, fromLng, toLat, toLng].some((n) => Number.isNaN(n))) {
    return c.json({ error: "fromLat/fromLng/toLat/toLng는 숫자여야 합니다" }, 400);
  }

  const url = `https://router.project-osrm.org/route/v1/${profile}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
  const res = await fetch(url, { headers: { "User-Agent": "Ttubeogi/0.1 (personal travel planning app)" } });
  if (!res.ok) return c.json({ error: "경로를 찾을 수 없습니다" }, 404);

  const data = await res.json();
  const route = data.routes?.[0];
  const coords = route?.geometry?.coordinates;
  if (!coords?.length) return c.json({ error: "경로를 찾을 수 없습니다" }, 404);

  // GeoJSON은 [lng, lat] 순서 — Leaflet은 [lat, lng]라서 뒤집어서 내려준다.
  // duration(초)·distance(m)는 OSRM이 그 프로필(도보/차량) 기준으로 계산해주는 실제 값 — 지도에
  // "소요시간"을 보여줄 때 씀.
  return c.json({
    points: coords.map(([lng, lat]) => [lat, lng]),
    durationSec: route.duration ?? null,
    distanceM: route.distance ?? null,
  });
});

export default app;
