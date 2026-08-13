import { Hono } from "hono";
import { newPlanId, newId } from "../ids.js";

// 멤버 아바타 색상 팔레트. src/theme.js의 C.orange/member2/member3와 값 맞춤 + 추가 색상.
const MEMBER_COLORS = ["#e8863a", "#5b8c7b", "#7a6cc4", "#d9534f", "#4a6fa5", "#c0568f"];
const KINDS = new Set(["여행", "데이트", "약속"]);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function computeStatus(endDate) {
  return endDate < today() ? "past" : "upcoming";
}

// startDate~endDate 사이 날짜를 하루씩 순회 (inclusive). "YYYY-MM-DD" 문자열 기준.
function dateRange(startDate, endDate) {
  const dates = [];
  let cur = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur = new Date(cur.getTime() + 86400000);
  }
  return dates.length ? dates : [startDate];
}

// 기존 항목들(시간순 정렬된 상태) 사이에서 newTime이 들어갈 위치를 찾는다.
// 시간 미정(null)은 맨 뒤로 취급 — 항목 추가 시 항상 시간순으로 자동 삽입되게 하기 위함.
function findInsertIndex(existingTimesInOrder, newTime) {
  if (!newTime) return existingTimesInOrder.length;
  for (let i = 0; i < existingTimesInOrder.length; i++) {
    const t = existingTimesInOrder[i];
    if (!t || t > newTime) return i;
  }
  return existingTimesInOrder.length;
}

// D1 쓰기가 끝난 뒤 그 방(PlanRoom)에 붙어있는 모든 WebSocket 클라이언트에게 "바뀌었다"고 알린다.
// 페이로드는 최소한만 담고, 클라이언트는 받으면 그냥 전체를 다시 불러온다(GET /api/plans/:id).
async function notifyRoom(env, planId, type) {
  const stub = env.PLAN_ROOM.get(env.PLAN_ROOM.idFromName(planId));
  await stub.fetch("https://internal/broadcast", {
    method: "POST",
    body: JSON.stringify({ type, planId }),
  });
}

const app = new Hono();

// POST /api/plans — 일정 생성. 방장이 첫 멤버가 되고, 기간만큼 Day가 자동 생성된다.
app.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { kind, title, startDate, endDate, region, creatorName } = body;

  if (!KINDS.has(kind)) return c.json({ error: "kind는 여행/데이트/약속 중 하나여야 합니다" }, 400);
  if (!title?.trim()) return c.json({ error: "title은 필수입니다" }, 400);
  if (!startDate) return c.json({ error: "startDate는 필수입니다" }, 400);
  if (!creatorName?.trim()) return c.json({ error: "creatorName은 필수입니다" }, 400);
  const finalEndDate = endDate || startDate;

  const planId = newPlanId(title);
  const memberId = newId("mem");
  const days = dateRange(startDate, finalEndDate);

  const stmts = [
    c.env.DB.prepare(
      "INSERT INTO plans (id, kind, title, start_date, end_date, region, status) VALUES (?, ?, ?, ?, ?, ?, 'upcoming')"
    ).bind(planId, kind, title.trim(), startDate, finalEndDate, region || null),
    c.env.DB.prepare(
      "INSERT INTO members (id, plan_id, name, color) VALUES (?, ?, ?, ?)"
    ).bind(memberId, planId, creatorName.trim(), MEMBER_COLORS[0]),
    ...days.map((date, i) =>
      c.env.DB.prepare("INSERT INTO days (id, plan_id, date, sort_order) VALUES (?, ?, ?, ?)").bind(
        newId("day"),
        planId,
        date,
        i
      )
    ),
  ];

  await c.env.DB.batch(stmts);
  return c.json({ id: planId, memberId }, 201);
});

// GET /api/plans?ids=a,b,c — 홈 화면용 배치 조회. id를 아는 일정만 볼 수 있다(전체 목록 없음).
app.get("/", async (c) => {
  const idsParam = c.req.query("ids") || "";
  const ids = [...new Set(idsParam.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 50);
  if (ids.length === 0) return c.json([]);

  const placeholders = ids.map(() => "?").join(",");
  const [plansRes, membersRes, itemCountRes] = await Promise.all([
    c.env.DB.prepare(
      `SELECT id, kind, title, start_date, end_date, region FROM plans WHERE id IN (${placeholders})`
    ).bind(...ids).all(),
    c.env.DB.prepare(
      `SELECT id, plan_id, name, color FROM members WHERE plan_id IN (${placeholders}) ORDER BY joined_at`
    ).bind(...ids).all(),
    c.env.DB.prepare(
      `SELECT d.plan_id AS plan_id, COUNT(i.id) AS cnt FROM days d LEFT JOIN items i ON i.day_id = d.id
       WHERE d.plan_id IN (${placeholders}) GROUP BY d.plan_id`
    ).bind(...ids).all(),
  ]);

  const membersByPlan = new Map();
  for (const m of membersRes.results) {
    if (!membersByPlan.has(m.plan_id)) membersByPlan.set(m.plan_id, []);
    membersByPlan.get(m.plan_id).push({ id: m.id, name: m.name, color: m.color });
  }
  const spotsByPlan = new Map(itemCountRes.results.map((r) => [r.plan_id, r.cnt]));

  const result = plansRes.results.map((p) => ({
    id: p.id,
    kind: p.kind,
    title: p.title,
    startDate: p.start_date,
    endDate: p.end_date,
    region: p.region,
    status: computeStatus(p.end_date),
    members: membersByPlan.get(p.id) || [],
    spots: spotsByPlan.get(p.id) || 0,
  }));
  return c.json(result);
});

// GET /api/plans/:id — 일정 상세 (멤버 + 날짜별 항목까지 전부)
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const plan = await c.env.DB.prepare("SELECT * FROM plans WHERE id = ?").bind(id).first();
  if (!plan) return c.json({ error: "일정을 찾을 수 없습니다" }, 404);

  const [membersRes, daysRes] = await Promise.all([
    c.env.DB.prepare("SELECT id, name, color, joined_at FROM members WHERE plan_id = ? ORDER BY joined_at").bind(id).all(),
    c.env.DB.prepare("SELECT id, date, city, sort_order FROM days WHERE plan_id = ? ORDER BY sort_order").bind(id).all(),
  ]);

  const dayIds = daysRes.results.map((d) => d.id);
  let itemsByDay = new Map();
  if (dayIds.length > 0) {
    const placeholders = dayIds.map(() => "?").join(",");
    const itemsRes = await c.env.DB.prepare(
      `SELECT * FROM items WHERE day_id IN (${placeholders}) ORDER BY sort_order, time`
    ).bind(...dayIds).all();
    for (const it of itemsRes.results) {
      if (!itemsByDay.has(it.day_id)) itemsByDay.set(it.day_id, []);
      itemsByDay.get(it.day_id).push({
        id: it.id,
        type: it.type,
        time: it.time,
        name: it.name,
        query: it.query,
        lat: it.lat,
        lng: it.lng,
        mapLink: it.map_link,
        move: it.move,
        detail: it.detail,
        itemStatus: it.item_status,
        createdBy: it.created_by,
      });
    }
  }

  return c.json({
    id: plan.id,
    kind: plan.kind,
    title: plan.title,
    startDate: plan.start_date,
    endDate: plan.end_date,
    region: plan.region,
    status: computeStatus(plan.end_date),
    members: membersRes.results,
    days: daysRes.results.map((d) => ({ ...d, items: itemsByDay.get(d.id) || [] })),
  });
});

// POST /api/plans/:id/members — 이름만으로 참여
app.post("/:id/members", async (c) => {
  const id = c.req.param("id");
  const { name } = await c.req.json().catch(() => ({}));
  if (!name?.trim()) return c.json({ error: "name은 필수입니다" }, 400);

  const plan = await c.env.DB.prepare("SELECT id FROM plans WHERE id = ?").bind(id).first();
  if (!plan) return c.json({ error: "일정을 찾을 수 없습니다" }, 404);

  const { count } = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM members WHERE plan_id = ?").bind(id).first();
  const color = MEMBER_COLORS[count % MEMBER_COLORS.length];
  const memberId = newId("mem");

  await c.env.DB.prepare("INSERT INTO members (id, plan_id, name, color) VALUES (?, ?, ?, ?)")
    .bind(memberId, id, name.trim(), color)
    .run();

  c.executionCtx.waitUntil(notifyRoom(c.env, id, "member.joined"));
  return c.json({ memberId, color }, 201);
});

// POST /api/plans/:id/items — 일정 항목 추가
app.post("/:id/items", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const { dayId, type, time, name, query, lat, lng, mapLink, move, createdBy } = body;

  if (!name?.trim()) return c.json({ error: "name은 필수입니다" }, 400);
  if (!type) return c.json({ error: "type은 필수입니다" }, 400);

  const day = await c.env.DB.prepare("SELECT id FROM days WHERE id = ? AND plan_id = ?").bind(dayId, id).first();
  if (!day) return c.json({ error: "day를 찾을 수 없습니다" }, 404);

  // 항목이 시간순으로 자동 정렬되도록, 맨 뒤에 붙이는 대신 시간 기준으로 삽입 위치를 찾고
  // 그 뒤에 있던 항목들의 sort_order를 한 칸씩 밀어준다.
  const existing = await c.env.DB.prepare("SELECT id, time FROM items WHERE day_id = ? ORDER BY sort_order").bind(dayId).all();
  const rows = existing.results;
  const insertAt = findInsertIndex(rows.map((r) => r.time), time || null);
  const itemId = newId("item");

  const stmts = rows.slice(insertAt).map((r, i) =>
    c.env.DB.prepare("UPDATE items SET sort_order = ? WHERE id = ?").bind(insertAt + i + 1, r.id)
  );
  stmts.push(
    c.env.DB.prepare(
      `INSERT INTO items (id, day_id, type, time, name, query, lat, lng, map_link, move, item_status, created_by, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`
    ).bind(itemId, dayId, type, time || null, name.trim(), query || null, lat ?? null, lng ?? null, mapLink || null, move || null, createdBy || null, insertAt)
  );
  await c.env.DB.batch(stmts);

  c.executionCtx.waitUntil(notifyRoom(c.env, id, "item.added"));
  return c.json({
    id: itemId, dayId, type, time: time || null, name: name.trim(), query: query || null,
    lat: lat ?? null, lng: lng ?? null,
    mapLink: mapLink || null, move: move || null, itemStatus: "confirmed", createdBy: createdBy || null,
  }, 201);
});

// PATCH /api/plans/:id/days/:dayId/reorder — 드래그로 바꾼 순서를 그대로 반영.
// body: { itemIds: [그 날짜 항목 id를 새 순서대로 전부] }
app.patch("/:id/days/:dayId/reorder", async (c) => {
  const { id, dayId } = c.req.param();
  const day = await c.env.DB.prepare("SELECT id FROM days WHERE id = ? AND plan_id = ?").bind(dayId, id).first();
  if (!day) return c.json({ error: "day를 찾을 수 없습니다" }, 404);

  const { itemIds } = await c.req.json().catch(() => ({}));
  if (!Array.isArray(itemIds) || itemIds.length === 0) return c.json({ error: "itemIds가 필요합니다" }, 400);

  // 이 날짜에 실제로 속한 항목들과 정확히 일치하는지 검증 (다른 날짜/일정 id 섞여 들어오는 것 방지).
  const existing = await c.env.DB.prepare("SELECT id FROM items WHERE day_id = ?").bind(dayId).all();
  const existingIds = new Set(existing.results.map((r) => r.id));
  const valid = itemIds.length === existingIds.size && itemIds.every((iid) => existingIds.has(iid));
  if (!valid) return c.json({ error: "itemIds가 이 날짜의 항목 목록과 일치하지 않습니다" }, 400);

  await c.env.DB.batch(
    itemIds.map((itemId, i) => c.env.DB.prepare("UPDATE items SET sort_order = ? WHERE id = ?").bind(i, itemId))
  );

  c.executionCtx.waitUntil(notifyRoom(c.env, id, "item.reordered"));
  return c.json({ ok: true });
});

// PATCH /api/plans/:id/items/:itemId — 부분 수정
const PATCHABLE_FIELDS = {
  type: "type", time: "time", name: "name", query: "query", lat: "lat", lng: "lng",
  mapLink: "map_link", move: "move", itemStatus: "item_status",
};
app.patch("/:id/items/:itemId", async (c) => {
  const { id, itemId } = c.req.param();
  const owns = await c.env.DB.prepare(
    "SELECT items.id FROM items JOIN days ON items.day_id = days.id WHERE items.id = ? AND days.plan_id = ?"
  ).bind(itemId, id).first();
  if (!owns) return c.json({ error: "항목을 찾을 수 없습니다" }, 404);

  const body = await c.req.json().catch(() => ({}));
  const sets = [];
  const values = [];
  for (const [key, column] of Object.entries(PATCHABLE_FIELDS)) {
    if (key in body) {
      sets.push(`${column} = ?`);
      values.push(body[key]);
    }
  }
  if (sets.length === 0) return c.json({ error: "수정할 필드가 없습니다" }, 400);

  values.push(itemId);
  await c.env.DB.prepare(`UPDATE items SET ${sets.join(", ")} WHERE id = ?`).bind(...values).run();
  const updated = await c.env.DB.prepare("SELECT * FROM items WHERE id = ?").bind(itemId).first();
  c.executionCtx.waitUntil(notifyRoom(c.env, id, "item.updated"));
  return c.json(updated);
});

// DELETE /api/plans/:id/items/:itemId
app.delete("/:id/items/:itemId", async (c) => {
  const { id, itemId } = c.req.param();
  const owns = await c.env.DB.prepare(
    "SELECT items.id FROM items JOIN days ON items.day_id = days.id WHERE items.id = ? AND days.plan_id = ?"
  ).bind(itemId, id).first();
  if (!owns) return c.json({ error: "항목을 찾을 수 없습니다" }, 404);

  await c.env.DB.prepare("DELETE FROM items WHERE id = ?").bind(itemId).run();
  c.executionCtx.waitUntil(notifyRoom(c.env, id, "item.deleted"));
  return c.json({ ok: true });
});

export default app;
