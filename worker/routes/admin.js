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
    `SELECT u.id, u.nickname, u.created_at,
            COUNT(DISTINCT m.plan_id) AS plan_count
     FROM users u
     LEFT JOIN members m ON m.user_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  ).all();
  return c.json({
    users: results.map((r) => ({ id: r.id, nickname: r.nickname, createdAt: r.created_at, planCount: r.plan_count })),
  });
});

export default app;
