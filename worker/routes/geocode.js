import { Hono } from "hono";

const app = new Hono();

async function searchKakao(query, apiKey) {
  if (!apiKey) return null;
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${apiKey}` } });
  if (!res.ok) return null;
  const data = await res.json();
  const doc = data.documents?.[0];
  if (!doc) return null;
  return { lat: Number(doc.y), lng: Number(doc.x), label: doc.place_name, source: "kakao" };
}

async function searchNominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  // Nominatim 사용 정책: User-Agent 필수, 초당 1요청 권장 (개인/소규모 사용 기준 OK).
  const res = await fetch(url, { headers: { "User-Agent": "Ttubeogi/0.1 (personal travel planning app)" } });
  if (!res.ok) return null;
  const results = await res.json();
  const hit = results?.[0];
  if (!hit) return null;
  return { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name, source: "nominatim" };
}

// GET /api/geocode?q=검색어 — 국내 정확도 좋은 카카오를 먼저 시도(키 있을 때만), 없으면 Nominatim.
app.get("/", async (c) => {
  const q = c.req.query("q");
  if (!q?.trim()) return c.json({ error: "q는 필수입니다" }, 400);

  const hit = (await searchKakao(q.trim(), c.env.KAKAO_REST_API_KEY)) || (await searchNominatim(q.trim()));
  if (!hit) return c.json({ error: "검색 결과가 없습니다" }, 404);
  return c.json(hit);
});

export default app;
