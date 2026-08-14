import { Hono } from "hono";
import { getSessionUser } from "../lib/session.js";

const app = new Hono();

// 이 라우터 전체를 관리자만 쓸 수 있게 — 로그인 세션의 is_admin 플래그로 판단.
app.use("*", async (c, next) => {
  const user = await getSessionUser(c);
  if (!user?.isAdmin) return c.json({ error: "관리자만 접근할 수 있습니다" }, 403);
  await next();
});

// GET /api/admin/users — 카카오 로그인으로 가입한 회원 목록 (참여한 일정 수 포함).
app.get("/users", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT u.id, u.nickname, u.created_at, u.last_login_at,
            COUNT(DISTINCT m.plan_id) AS plan_count
     FROM users u
     LEFT JOIN members m ON m.user_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  ).all();
  return c.json({
    users: results.map((r) => ({
      id: r.id, nickname: r.nickname, createdAt: r.created_at, lastLoginAt: r.last_login_at, planCount: r.plan_count,
    })),
  });
});

// GET /api/admin/members — 일정에 참여한 전체 멤버(로그인 계정 + 링크로만 들어온 게스트 전부).
// users 목록은 "가입한 계정" 단위라 게스트는 안 잡혔는데, 실제 서비스 이용자는 대부분 게스트라
// 이걸 봐야 실제 참여 규모가 보인다.
app.get("/members", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT m.id, m.name, m.color, m.joined_at, m.user_id, p.id AS plan_id, p.title AS plan_title, p.kind AS plan_kind
     FROM members m
     JOIN plans p ON p.id = m.plan_id
     ORDER BY m.joined_at DESC`
  ).all();
  const totalPlansRow = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM plans").first();
  return c.json({
    members: results.map((r) => ({
      id: r.id, name: r.name, color: r.color, joinedAt: r.joined_at, isGuest: !r.user_id,
      planId: r.plan_id, planTitle: r.plan_title, planKind: r.plan_kind,
    })),
    totalPlans: totalPlansRow.n,
  });
});

export default app;
