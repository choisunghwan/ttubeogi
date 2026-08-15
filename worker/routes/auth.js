import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { signSession, randomToken, getSessionUser } from "../lib/session.js";
import { newId } from "../ids.js";
import { notifyRoom } from "../lib/notify.js";

const SESSION_COOKIE = "ttubeogi_session";
const STATE_COOKIE = "kakao_oauth_state";

function callbackUrl(c) {
  return `${new URL(c.req.url).origin}/api/auth/kakao/callback`;
}

const app = new Hono();

// GET /api/auth/kakao/start — 카카오 로그인 화면으로 리다이렉트.
app.get("/kakao/start", (c) => {
  const state = randomToken();
  setCookie(c, STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "Lax", maxAge: 300, path: "/" });

  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("client_id", c.env.KAKAO_REST_API_KEY);
  url.searchParams.set("redirect_uri", callbackUrl(c));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  return c.redirect(url.toString());
});

// GET /api/auth/kakao/callback — code를 토큰으로 교환하고 세션 쿠키를 발급한다.
app.get("/kakao/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const savedState = getCookie(c, STATE_COOKIE);
  deleteCookie(c, STATE_COOKIE, { path: "/" });

  if (!code || !state || state !== savedState) {
    return c.text("로그인 요청이 올바르지 않습니다 (state 불일치). 다시 시도해주세요.", 400);
  }

  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: c.env.KAKAO_REST_API_KEY,
    redirect_uri: callbackUrl(c),
    code,
  });
  if (c.env.KAKAO_CLIENT_SECRET) tokenBody.set("client_secret", c.env.KAKAO_CLIENT_SECRET);

  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody,
  });
  if (!tokenRes.ok) return c.text("카카오 로그인에 실패했습니다 (토큰 발급 오류).", 502);
  const { access_token } = await tokenRes.json();

  const profileRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!profileRes.ok) return c.text("카카오 로그인에 실패했습니다 (프로필 조회 오류).", 502);
  const profile = await profileRes.json();
  const kakaoId = String(profile.id);
  const nickname = profile.kakao_account?.profile?.nickname || profile.properties?.nickname || "카카오사용자";

  let user = await c.env.DB.prepare("SELECT id, nickname_customized FROM users WHERE kakao_id = ?").bind(kakaoId).first();
  if (!user) {
    const userId = newId("user");
    await c.env.DB.prepare("INSERT INTO users (id, kakao_id, nickname, last_login_at) VALUES (?, ?, ?, datetime('now'))")
      .bind(userId, kakaoId, nickname).run();
    user = { id: userId };
  } else {
    if (!user.nickname_customized) {
      // 마이페이지에서 직접 닉네임을 바꾼 적 없는 사람만 카카오 최신 닉네임으로 계속 동기화.
      await c.env.DB.prepare("UPDATE users SET nickname = ? WHERE id = ?").bind(nickname, user.id).run();
    }
    await c.env.DB.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").bind(user.id).run();
  }

  const sessionValue = await signSession(user.id, c.env.SESSION_SECRET);
  setCookie(c, SESSION_COOKIE, sessionValue, {
    httpOnly: true, secure: true, sameSite: "Lax", maxAge: 60 * 60 * 24 * 180, path: "/",
  });
  return c.redirect("/");
});

// GET /api/auth/me — 로그인 상태 확인. "로그인 안 함"은 에러가 아니라 정상 응답(200, user: null)으로 —
// 페이지 로드마다 습관적으로 찔러보는 상태 체크용 엔드포인트라 401로 브라우저 콘솔을 시끄럽게 안 만든다.
app.get("/me", async (c) => {
  const user = await getSessionUser(c);
  return c.json({ user });
});

// PATCH /api/auth/me — 마이페이지에서 닉네임 직접 수정. 이후로는 카카오 닉네임 자동 동기화가 멈춘다.
app.patch("/me", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: "로그인 안 됨" }, 401);

  const { nickname } = await c.req.json().catch(() => ({}));
  if (!nickname?.trim()) return c.json({ error: "nickname은 필수입니다" }, 400);
  const trimmed = nickname.trim();

  // 이 계정으로 참여했던 모든 일정의 멤버 이름도 같이 바꾼다 — 로그인 사용자는 카카오 닉네임으로
  // 자동 참여하는 거라, 마이페이지에서 이름을 바꿨는데 예전 일정엔 옛날 이름이 그대로 남아있으면
  // 헷갈린다. members.user_id로 이어진 모든 행을 갱신하고, 그 일정들 방에도 실시간으로 알린다.
  const affectedPlans = await c.env.DB.prepare(
    "SELECT DISTINCT plan_id FROM members WHERE user_id = ?"
  ).bind(user.id).all();

  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE users SET nickname = ?, nickname_customized = 1 WHERE id = ?").bind(trimmed, user.id),
    c.env.DB.prepare("UPDATE members SET name = ? WHERE user_id = ?").bind(trimmed, user.id),
  ]);
  c.executionCtx.waitUntil(
    Promise.all(affectedPlans.results.map((p) => notifyRoom(c.env, p.plan_id, "member.updated")))
  );

  return c.json({ id: user.id, nickname: trimmed, isAdmin: user.isAdmin });
});

// POST /api/auth/logout
app.post("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

export default app;
