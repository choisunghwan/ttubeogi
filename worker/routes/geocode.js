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

function hasHangul(text) {
  return /[가-힣]/.test(text);
}

// 키 없이 쓸 수 있는 구글 번역 비공식 엔드포인트 — 짧은 문자열 하나 번역하는 정도의 가벼운
// 용도라 무료로 충분함. 실패해도(네트워크 오류 등) null 반환해서 원문을 그대로 쓰게 한다.
async function translateText(text, targetLang, sourceLang = "auto") {
  if (!text) return null;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const joined = data[0]?.map((chunk) => chunk[0]).join("") || null;
    return joined && joined.toLowerCase() !== text.toLowerCase() ? joined : null;
  } catch {
    return null;
  }
}
const translateToKorean = (text) => translateText(text, "ko");

// 해외 지명은 Nominatim이 한자/현지어 표기로만 줄 때가 많아서(예: "上海迪士尼樂園") 사용자가
// 자기가 찾던 곳이 맞는지 확인하기 어렵다 — 한글이 하나도 없는 결과만 이름을 번역해서
// "한글 번역 (원문)" 형태로 보여준다. 주소는 현지어/한자가 섞인 문자열이라 통번역이 오히려
// 더 헷갈리게 만들어서(고유명사 오역, 이미 한글인 행정구역명까지 다시 깨짐) 그대로 둔다.
async function translateForeignResults(results) {
  return Promise.all(results.map(async (r) => {
    if (hasHangul(r.label)) return r;
    const translatedLabel = await translateToKorean(r.label);
    return translatedLabel ? { ...r, label: `${translatedLabel} (${r.label})` } : r;
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

// GET /api/geocode?q=검색어 — 카카오(국내, 최대 5개) + Nominatim(전세계)을 같이 검색해서 후보
// 목록을 반환. 프론트에서 사용자가 직접 골라서 확정한다(자동으로 첫 결과 찍지 않음).
// 주의: Nominatim은 그 검색어 문자열 자체로만 매칭하는 지오코더라 "도쿄 디즈니랜드"처럼 한글로
// 검색하면 실제 데이터가 현지어(東京ディズニーランド)로 들어있어서 0건이 나온다 — 그래서 원문
// 검색과 별개로 검색어를 영어로 번역한 버전으로도 같이 검색해서 결과를 합친다("Tokyo Disneyland"로
// 검색하면 찾아지는 것과 동일한 효과). 이게 "해외 검색이 잘 안 잡힌다"는 문제의 실제 원인이었음.
app.get("/", async (c) => {
  const q = c.req.query("q");
  if (!q?.trim()) return c.json({ error: "q는 필수입니다" }, 400);
  const query = q.trim();
  const englishQuery = await translateText(query, "en");

  const [kakaoResults, nominatimResultsRaw, nominatimEnResultsRaw] = await Promise.all([
    searchKakaoMulti(query, c.env.KAKAO_REST_API_KEY, 5),
    searchNominatimMulti(query, 6),
    englishQuery ? searchNominatimMulti(englishQuery, 6) : Promise.resolve([]),
  ]);
  const nominatimResults = await translateForeignResults([...nominatimResultsRaw, ...nominatimEnResultsRaw]);
  const results = dedupe([...kakaoResults, ...nominatimResults]).slice(0, 9);
  if (results.length === 0) return c.json({ error: "검색 결과가 없습니다" }, 404);
  return c.json({ results });
});

export default app;
