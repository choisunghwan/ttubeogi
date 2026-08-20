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
// 한 번의 검색 요청에서 원문+영문 두 버전을 동시에 Nominatim에 쏘다 보니(아래 app.get 참고)
// 순간적으로 요청이 겹쳐서 그런지, 가끔 한쪽(또는 양쪽) 호출이 실패해서 검색 결과가 통째로
// 0건이 되는 경우가 관찰됨 — 번역 재시도와 같은 이유로 최대 2번까지 재시도한다.
async function searchNominatimMulti(query, limit) {
  // accept-language=ko: 한자/현지어 표기(예: 上海市) 대신 한국어 지명(상하이)으로 받아서 더 읽기 쉽게.
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=${limit}&q=${encodeURIComponent(query)}&accept-language=ko`;
  for (let i = 0; i < 2; i++) {
    try {
      // Nominatim 사용 정책: User-Agent 필수, 초당 1요청 권장 (개인/소규모 사용 기준 OK).
      const res = await fetch(url, { headers: { "User-Agent": "Ttubeogi/0.1 (personal travel planning app)" } });
      if (!res.ok) continue;
      const results = await res.json();
      return (results || []).map((hit) => ({
        lat: Number(hit.lat), lng: Number(hit.lon),
        label: hit.display_name.split(",")[0],
        address: hit.display_name,
        source: "nominatim",
      }));
    } catch {
      // 다음 시도로 넘어감
    }
  }
  return [];
}

function hasHangul(text) {
  return /[가-힣]/.test(text);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 키 없이 쓸 수 있는 구글 번역 비공식 엔드포인트 — 짧은 문자열 하나 번역하는 정도의 가벼운
// 용도라 무료로 충분함. 실패해도(네트워크 오류 등) null 반환해서 원문을 그대로 쓰게 한다.
// 429(레이트리밋)일 때만 티가 나게 status를 같이 반환 — 재시도 쪽에서 딜레이를 넣을지 판단용.
async function translateText(text, targetLang, sourceLang = "auto") {
  if (!text) return { text: null, rateLimited: false };
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return { text: null, rateLimited: res.status === 429 };
    const data = await res.json();
    const joined = data[0]?.map((chunk) => chunk[0]).join("") || null;
    const translated = joined && joined.toLowerCase() !== text.toLowerCase() ? joined : null;
    return { text: translated, rateLimited: false };
  } catch {
    return { text: null, rateLimited: false };
  }
}
// 번역 API가 키 없는 비공식 엔드포인트라 가끔 429(레이트리밋)로 실패한다 — 재시도를 곧바로
// 연달아 쏘면 같은 레이트리밋 구간 안에 다 걸려서 재시도 자체가 무의미해지므로, 429를 받으면
// 잠깐 쉬었다가 재시도한다. 검색어를 영어로 번역하는 단계(아래 app.get)에도 똑같이 쓴다 —
// 이 번역이 실패하면 해외 지명 검색이 통째로 0건이 되어버리기 때문에(Nominatim이 한글 쿼리를
// 못 찾음) 여기도 재시도가 필요함.
async function translateRetry(text, targetLang) {
  for (let i = 0; i < 3; i++) {
    const { text: result, rateLimited } = await translateText(text, targetLang);
    if (result) return result;
    if (rateLimited) await sleep(300 * (i + 1));
  }
  return null;
}
async function translateToKoreanRetry(text) {
  return translateRetry(text, "ko");
}

// 해외 지명은 Nominatim이 한자/현지어 표기로만 줄 때가 많아서(예: "上海迪士尼樂園") 사용자가
// 자기가 찾던 곳이 맞는지 확인하기 어렵다 — 한글이 하나도 없는 이름/주소를 번역해서 보여준다.
//
// 주소 전체를 통으로 번역시키면 Google이 "촨사신진, 상하이, 중국"처럼 이미 섞여있는 한글 때문에
// sl=auto 언어 감지가 "이미 한국어"라고 오판해서 정작 번역해야 할 한자 구간을 그대로 남겨버린다
// (실제로 겪은 문제) — 그래서 주소를 쉼표 단위로 쪼개서 한글이 없는 조각만 각각 번역한다.
//
// 라벨(label)은 거의 항상 주소의 첫 조각(display_name.split(",")[0])과 똑같은 문자열이다 —
// 그런데도 라벨을 따로 또 번역 요청하면, 같은 텍스트를 짧은 시간에 두 번 따로 호출하는 셈이라
// 키 없는 비공식 번역 엔드포인트가 레이트리밋에 걸려 "주소는 번역됐는데 라벨만 원문으로 남는"
// 불일치가 실제로 발생했다. 그래서 주소 조각을 먼저 번역한 다음, 라벨과 같은 조각이면 그 번역
// 결과를 그대로 재사용하고, 다를 때만 라벨을 별도로 번역한다.
async function translateForeignResults(results) {
  return Promise.all(results.map(async (r) => {
    const segments = r.address ? r.address.split(", ") : [];
    const translatedSegments = await Promise.all(segments.map(async (seg) => {
      if (!seg || hasHangul(seg)) return { original: seg, translated: null };
      return { original: seg, translated: await translateToKoreanRetry(seg) };
    }));
    const translatedAddress = translatedSegments.map((s) => s.translated || s.original).join(", ");

    let translatedLabel = null;
    if (!hasHangul(r.label)) {
      const reused = translatedSegments.find((s) => s.original === r.label);
      translatedLabel = reused ? reused.translated : await translateToKoreanRetry(r.label);
    }

    return {
      ...r,
      label: translatedLabel ? `${translatedLabel} (${r.label})` : r.label,
      address: translatedAddress,
    };
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

// 네이버 지도/카카오맵 "공유 링크"에서 좌표를 뽑아낸다. 사용자가 붙여넣는 링크는 짧은 링크
// (naver.me, kko.to)일 수도 있어서, 먼저 리다이렉트를 따라가서 실제 도착 URL을 얻은 다음
// 그 안의 숫자 id로 항상 "서버가 렌더링하는" 상세 페이지(네이버는 m.place.naver.com, 카카오는
// place.map.kakao.com)를 다시 요청한다 — 지도 앱 자체 도메인(map.naver.com/p/...)은 클라이언트
// 에서 렌더링되는 SPA라 정적으로 긁을 수 없음.
//
// 좌표를 얻는 방식이 두 서비스가 다르다(둘 다 실제로 curl로 직접 확인한 결과):
//   - 네이버: 지하철역 같은 특수 장소는 og:image 미리보기 지도에 "center=lng,lat"가 박혀 있지만,
//     일반 음식점/카페 같은 보통 장소는 없다 — 대신 페이지 안에 하이드레이션용으로 심어둔
//     `"coordinate":{"__typename":"Coordinate","x":"...","y":"..."}` JSON을 정규식으로 뽑는다.
//   - 카카오: place.map.kakao.com 페이지는 좌표를 전혀 안 담고 있고(og:title/description만
//     서버 렌더링됨, 실제 지도 데이터는 클라이언트 JS가 따로 불러옴) — 그래서 좌표 없이
//     이름/주소만 뽑은 다음, 이미 이 파일에 있는 카카오 로컬 검색(searchKakaoMulti)에 그
//     이름을 넣어 좌표를 얻는다. 카카오 자기 서비스 안의 정확한 이름으로 검색하는 거라
//     엉뚱한 곳이 나올 걱정이 거의 없음.
const LINK_USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";

async function resolveRedirect(url) {
  const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": LINK_USER_AGENT } });
  return res.url;
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": LINK_USER_AGENT } });
  if (!res.ok) return null;
  return res.text();
}

async function geocodeNaverLink(resolvedUrl) {
  // 지하철역 같은 특수 장소는 m.place.naver.com이 아니라 완전히 다른 도메인(pts.map.naver.com
  // 등)으로 리다이렉트되는데, 그 URL에도 우연히 숫자 세그먼트가 있어서 도메인을 먼저 확인
  // 안 하면 그 숫자를 엉뚱하게 place id로 오인해서 완전히 무관한 장소 좌표를 돌려주게 된다
  // (실제로 겪은 문제 — 지하철역 링크가 충남의 한 초등학교 좌표를 반환했었음). 정직하게
  // "못 찾음"으로 실패시키는 게 틀린 좌표를 조용히 주는 것보다 낫다.
  if (!/^https:\/\/(m\.place|map)\.naver\.com\//.test(resolvedUrl)) return null;
  // "/place/{id}"로 요청해도 네이버가 업종별 경로(restaurant/cafe/accommodation/...)로 리다이렉트
  // 시켜버려서 "place"라는 세그먼트 이름에 의존하면 안 됨 — "{id}/home" 패턴으로 잡고,
  // map.naver.com/p/entry/place/{id} 형태(리다이렉트 안 되고 그대로 오는 경우)는 폴백으로.
  const idMatch = resolvedUrl.match(/\/(\d+)\/home(?:[/?]|$)/) || resolvedUrl.match(/place\/(\d+)/);
  if (!idMatch) return null;
  const html = await fetchHtml(`https://m.place.naver.com/place/${idMatch[1]}/home`);
  if (!html) return null;

  // og:image에 박힌 "center=lng,lat"를 좌표로 쓰는 폴백을 예전에 시도했었는데, 지하철역처럼
  // 특수한 페이지 구조에서는 그 값이 페이지 안의 "주변 추천 장소" 같은 엉뚱한 위치를 가리키는
  // 경우가 실제로 있었다(직접 테스트로 확인) — 틀린 좌표를 조용히 반환하느니 못 찾았다고
  // 정직하게 실패하는 게 낫다. 그래서 신뢰할 수 있는 이 패턴 하나만 쓴다.
  const coordMatch = html.match(/"coordinate":\{"__typename":"Coordinate","x":"([\d.]+)","y":"([\d.]+)"/);
  if (!coordMatch) return null;

  const titleMatch = html.match(/property="og:title" content="([^"]*)"/);
  const descMatch = html.match(/property="og:description" content="([^"]*)"/);
  const roadAddrMatch = html.match(/"roadAddress":"([^"]*)"/);
  // 제어문자 제거 + " : 네이버" 같은 사이트명 접미사 제거. 지하철역 페이지는 og:title이
  // "네이버지도 - 지하철"이라는 고정 문구라 실제 이름은 description에 있음.
  const clean = (str) => str?.replace(/[\x00-\x1F\x7F]/g, "").split(" : 네이버")[0].trim();
  const rawTitle = clean(titleMatch?.[1]);
  const label = (rawTitle && !rawTitle.startsWith("네이버지도")) ? rawTitle : (clean(descMatch?.[1]) || "네이버 지도 장소");
  const address = roadAddrMatch?.[1] || label;
  return { lat: Number(coordMatch[2]), lng: Number(coordMatch[1]), label, address, source: "naver-link" };
}

async function geocodeKakaoLink(resolvedUrl, kakaoApiKey) {
  const idMatch = resolvedUrl.match(/place\.map\.kakao\.com\/(\d+)/);
  if (!idMatch) return null;
  const html = await fetchHtml(`https://place.map.kakao.com/${idMatch[1]}`);
  if (!html) return null;

  const titleMatch = html.match(/property="og:title" content="([^"]*)"/);
  const name = titleMatch?.[1];
  if (!name) return null;

  const candidates = await searchKakaoMulti(name, kakaoApiKey, 1);
  if (candidates.length === 0) return null;
  return { ...candidates[0], label: name, source: "kakao-link" };
}

// GET /api/geocode/link?url=붙여넣은_지도_링크
app.get("/link", async (c) => {
  const rawUrl = c.req.query("url")?.trim();
  if (!rawUrl) return c.json({ error: "url은 필수입니다" }, 400);

  let resolvedUrl;
  try {
    resolvedUrl = await resolveRedirect(rawUrl);
  } catch {
    return c.json({ error: "링크를 열 수 없어요" }, 400);
  }

  try {
    let result = null;
    if (/naver\.com|naver\.me/.test(resolvedUrl)) {
      result = await geocodeNaverLink(resolvedUrl);
    } else if (/kakao\.com|kko\.to/.test(resolvedUrl)) {
      result = await geocodeKakaoLink(resolvedUrl, c.env.KAKAO_REST_API_KEY);
    } else {
      return c.json({ error: "네이버 지도 또는 카카오맵 링크만 지원해요" }, 400);
    }
    if (!result) return c.json({ error: "이 링크에서는 위치를 찾지 못했어요 — 장소 상세 링크인지 확인해주세요" }, 404);
    return c.json(result);
  } catch {
    return c.json({ error: "링크를 처리하는 중 문제가 생겼어요" }, 500);
  }
});

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
  const englishQuery = await translateRetry(query, "en");

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
