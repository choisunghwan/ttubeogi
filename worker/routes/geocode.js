import { Hono } from "hono";

const app = new Hono();

// 카카오는 국내 장소(상호명 포함) 정확도가 좋아서 "CGV", "스타벅스"처럼 같은 이름이 여러 곳에
// 있는 경우를 대비해 여러 개를 가져온다 — 예전엔 첫 번째 결과만 써서 엉뚱한 지점이 찍히곤 했음.
async function searchKakaoMulti(query, apiKey, limit) {
  if (!apiKey) return [];
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=${limit}`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${apiKey}` } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.documents || []).map((doc) => ({
    lat: Number(doc.y), lng: Number(doc.x),
    label: doc.place_name,
    address: doc.road_address_name || doc.address_name || "",
    source: "kakao",
  }));
}

// 카카오 로컬 API는 국내 검색만 되기 때문에("상하이"를 쳐도 국내에 있는 "상하이"라는 이름의
// 식당만 찾아줌) 해외 지명은 항상 Nominatim(전세계 커버)도 같이 붙여서 진짜 도시가 후보에
// 뜨게 한다 — 국내/해외 어느 쪽이든 사용자가 목록에서 직접 골라서 확인.
async function searchNominatimMulti(query, limit) {
  // accept-language=ko: 한자/현지어 표기(예: 上海市) 대신 한국어 지명(상하이)으로 받아서 더 읽기 쉽게.
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=${limit}&q=${encodeURIComponent(query)}&accept-language=ko`;
  // Nominatim 사용 정책: User-Agent 필수, 초당 1요청 권장 (개인/소규모 사용 기준 OK).
  const res = await fetch(url, { headers: { "User-Agent": "Ttubeogi/0.1 (personal travel planning app)" } });
  if (!res.ok) return [];
  const results = await res.json();
  return (results || []).map((hit) => ({
    lat: Number(hit.lat), lng: Number(hit.lon),
    label: hit.display_name.split(",")[0],
    address: hit.display_name,
    source: "nominatim",
  }));
}

function dedupe(results) {
  const seen = new Set();
  return results.filter((r) => {
    const key = `${r.lat.toFixed(4)},${r.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// GET /api/geocode?q=검색어 — 카카오(국내, 최대 5개) + Nominatim(전세계, 최대 3개)을 같이 검색해서
// 후보 목록을 반환. 프론트에서 사용자가 직접 골라서 확정한다(자동으로 첫 결과 찍지 않음).
app.get("/", async (c) => {
  const q = c.req.query("q");
  if (!q?.trim()) return c.json({ error: "q는 필수입니다" }, 400);
  const query = q.trim();

  const [kakaoResults, nominatimResults] = await Promise.all([
    searchKakaoMulti(query, c.env.KAKAO_REST_API_KEY, 5),
    searchNominatimMulti(query, 3),
  ]);
  const results = dedupe([...kakaoResults, ...nominatimResults]).slice(0, 7);
  if (results.length === 0) return c.json({ error: "검색 결과가 없습니다" }, 404);
  return c.json({ results });
});

export default app;
