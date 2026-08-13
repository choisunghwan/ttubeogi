// 카카오 로그인은 서버가 세션 쿠키를 관리하는 방식이라, 프론트는 얇은 래퍼만 있으면 된다.
export async function getMe() {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return null;
  const { user } = await res.json();
  return user; // { id, nickname } | null
}

// 그냥 이 경로로 이동시키면 서버가 카카오 로그인 화면으로 리다이렉트한다.
export const KAKAO_LOGIN_URL = "/api/auth/kakao/start";

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function updateNickname(nickname) {
  const res = await fetch("/api/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "닉네임을 바꾸지 못했어요");
  }
  return res.json();
}
