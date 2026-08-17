import { Hono } from "hono";
import { getSessionUser } from "../lib/session.js";
import { clonePlan } from "../lib/clonePlan.js";

const app = new Hono();

// GET /api/community?sort=popular|recent&limit=&offset= — 공개(is_public=1)된 일정만,
// 인기순(좋아요 많은 순) 또는 최신 게시순으로. 로그인 상태면 내가 이미 좋아요 누른 것도 같이 표시.
app.get("/", async (c) => {
  const sort = c.req.query("sort") === "recent" ? "recent" : "popular";
  const limit = Math.min(Number(c.req.query("limit")) || 20, 50);
  const offset = Math.max(Number(c.req.query("offset")) || 0, 0);
  const sessionUser = await getSessionUser(c);

  const orderBy = sort === "recent" ? "p.published_at DESC" : "p.like_count DESC, p.published_at DESC";
  const rows = (await c.env.DB.prepare(
    `SELECT p.id, p.kind, p.title, p.start_date, p.end_date, p.region, p.like_count, p.published_at,
            u.nickname AS publisher_nickname,
            (SELECT COUNT(i.id) FROM days d LEFT JOIN items i ON i.day_id = d.id WHERE d.plan_id = p.id) AS spots
     FROM plans p LEFT JOIN users u ON u.id = p.published_by
     WHERE p.is_public = 1
     ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  ).bind(limit, offset).all()).results;

  let likedSet = new Set();
  if (sessionUser && rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const placeholders = ids.map(() => "?").join(",");
    const liked = await c.env.DB.prepare(
      `SELECT plan_id FROM community_likes WHERE user_id = ? AND plan_id IN (${placeholders})`
    ).bind(sessionUser.id, ...ids).all();
    likedSet = new Set(liked.results.map((r) => r.plan_id));
  }

  return c.json(rows.map((r) => ({
    id: r.id, kind: r.kind, title: r.title, startDate: r.start_date, endDate: r.end_date,
    region: r.region, likeCount: r.like_count, publishedAt: r.published_at,
    publisherNickname: r.publisher_nickname || "탈퇴한 사용자", spots: r.spots,
    likedByMe: likedSet.has(r.id),
  })));
});

// POST /api/community/:id/like — 좋아요. 로그인 필요(계정 단위 중복 방지).
app.post("/:id/like", async (c) => {
  const sessionUser = await getSessionUser(c);
  if (!sessionUser) return c.json({ error: "로그인 후 좋아요를 누를 수 있어요" }, 401);
  const id = c.req.param("id");
  const plan = await c.env.DB.prepare("SELECT id FROM plans WHERE id = ? AND is_public = 1").bind(id).first();
  if (!plan) return c.json({ error: "게시글을 찾을 수 없습니다" }, 404);

  const already = await c.env.DB.prepare(
    "SELECT 1 FROM community_likes WHERE plan_id = ? AND user_id = ?"
  ).bind(id, sessionUser.id).first();
  if (!already) {
    await c.env.DB.batch([
      c.env.DB.prepare("INSERT INTO community_likes (plan_id, user_id) VALUES (?, ?)").bind(id, sessionUser.id),
      c.env.DB.prepare("UPDATE plans SET like_count = like_count + 1 WHERE id = ?").bind(id),
    ]);
  }
  return c.json({ ok: true });
});

// DELETE /api/community/:id/like — 좋아요 취소.
app.delete("/:id/like", async (c) => {
  const sessionUser = await getSessionUser(c);
  if (!sessionUser) return c.json({ error: "로그인이 필요해요" }, 401);
  const id = c.req.param("id");

  const existing = await c.env.DB.prepare(
    "SELECT 1 FROM community_likes WHERE plan_id = ? AND user_id = ?"
  ).bind(id, sessionUser.id).first();
  if (existing) {
    await c.env.DB.batch([
      c.env.DB.prepare("DELETE FROM community_likes WHERE plan_id = ? AND user_id = ?").bind(id, sessionUser.id),
      c.env.DB.prepare("UPDATE plans SET like_count = MAX(like_count - 1, 0) WHERE id = ?").bind(id),
    ]);
  }
  return c.json({ ok: true });
});

// POST /api/community/:id/import — "담기". 공개된 일정을 통째로 복제해서 내 일정으로 가져온다.
// 게스트도 가능(이 앱의 나머지 기능과 동일한 권한 모델 — 로그인은 좋아요/게시에만 필요).
app.post("/:id/import", async (c) => {
  const id = c.req.param("id");
  const { creatorName } = await c.req.json().catch(() => ({}));
  const sessionUser = await getSessionUser(c);
  const finalName = creatorName?.trim() || sessionUser?.nickname;
  if (!finalName) return c.json({ error: "creatorName은 필수입니다" }, 400);

  const source = await c.env.DB.prepare("SELECT id FROM plans WHERE id = ? AND is_public = 1").bind(id).first();
  if (!source) return c.json({ error: "게시글을 찾을 수 없습니다" }, 404);

  const result = await clonePlan(c.env.DB, {
    sourcePlanId: id, creatorName: finalName, creatorUserId: sessionUser?.id ?? null,
  });
  return c.json(result, 201);
});

export default app;
