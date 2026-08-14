import { getCookie } from "hono/cookie";

// 로그인 세션 = 별도 sessions 테이블 없이, HMAC-SHA256으로 서명한 쿠키 하나.
// 매 요청마다 서명만 검증하면 되니 DB 조회가 필요 없다 (Spring Security의 stateless JWT 필터와 같은 패턴).
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 180; // 180일

function toBase64Url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(str) {
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  return new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]
  );
}

export async function signSession(userId, secret) {
  const payload = JSON.stringify({ uid: userId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS });
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifySession(cookieValue, secret) {
  if (!cookieValue) return null;
  const [payloadB64, sigB64] = cookieValue.split(".");
  if (!payloadB64 || !sigB64) return null;
  try {
    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC", key, fromBase64Url(sigB64), new TextEncoder().encode(payloadB64)
    );
    if (!valid) return null;
    const { uid, exp } = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
    if (!uid || exp < Math.floor(Date.now() / 1000)) return null;
    return uid;
  } catch {
    return null;
  }
}

export function randomToken(byteLen = 16) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLen));
  return toBase64Url(bytes);
}

// plans.js 등 다른 라우터에서 "지금 로그인한 사람이 누구인지" 재사용하는 헬퍼.
// 로그인 안 했으면 null — 호출부는 게스트로 취급하면 된다.
export async function getSessionUser(c) {
  const userId = await verifySession(getCookie(c, "ttubeogi_session"), c.env.SESSION_SECRET);
  if (!userId) return null;
  const user = await c.env.DB.prepare("SELECT id, nickname, is_admin FROM users WHERE id = ?").bind(userId).first();
  if (!user) return null;
  return { id: user.id, nickname: user.nickname, isAdmin: Boolean(user.is_admin) };
}
