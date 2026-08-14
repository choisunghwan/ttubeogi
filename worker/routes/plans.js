import { Hono } from "hono";
import { newPlanId, newId } from "../ids.js";
import { getSessionUser } from "../lib/session.js";

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
  const sessionUser = await getSessionUser(c);
  const finalCreatorName = creatorName?.trim() || sessionUser?.nickname;

  if (!KINDS.has(kind)) return c.json({ error: "kind는 여행/데이트/약속 중 하나여야 합니다" }, 400);
  if (!title?.trim()) return c.json({ error: "title은 필수입니다" }, 400);
  if (!startDate) return c.json({ error: "startDate는 필수입니다" }, 400);
  if (!finalCreatorName) return c.json({ error: "creatorName은 필수입니다" }, 400);
  const finalEndDate = endDate || startDate;

  const planId = newPlanId(title);
  const memberId = newId("mem");
  const days = dateRange(startDate, finalEndDate);

  const stmts = [
    c.env.DB.prepare(
      "INSERT INTO plans (id, kind, title, start_date, end_date, region, status) VALUES (?, ?, ?, ?, ?, ?, 'upcoming')"
    ).bind(planId, kind, title.trim(), startDate, finalEndDate, region || null),
    c.env.DB.prepare(
      "INSERT INTO members (id, plan_id, name, color, user_id) VALUES (?, ?, ?, ?, ?)"
    ).bind(memberId, planId, finalCreatorName, MEMBER_COLORS[0], sessionUser?.id ?? null),
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
  const localIds = idsParam.split(",").map((s) => s.trim()).filter(Boolean);

  // 로그인 상태면 localStorage로 아는 id 목록에, 이 계정 소유(로그인해서 만들었거나 참여한) 일정도 합쳐준다 —
  // 이게 "로그인하면 기기 바꿔도 내 일정이 보인다"의 핵심.
  const sessionUser = await getSessionUser(c);
  let accountIds = [];
  if (sessionUser) {
    const owned = await c.env.DB.prepare("SELECT DISTINCT plan_id FROM members WHERE user_id = ?").bind(sessionUser.id).all();
    accountIds = owned.results.map((r) => r.plan_id);
  }

  const ids = [...new Set([...localIds, ...accountIds])].slice(0, 50);
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
        memo: it.detail,
        flightNo: it.flight_no,
        voucher: it.voucher,
        attachmentName: it.attachment_name,
        attachmentType: it.attachment_type,
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

// PATCH /api/plans/:id — 일정 자체(제목/종류/기간/지역) 수정.
// 링크를 아는 사람 누구나 고칠 수 있다 — 항목 CRUD랑 같은 권한 모델(별도 소유자 개념 없음).
const PLAN_PATCHABLE_FIELDS = { kind: "kind", title: "title", startDate: "start_date", endDate: "end_date", region: "region" };
app.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const plan = await c.env.DB.prepare("SELECT * FROM plans WHERE id = ?").bind(id).first();
  if (!plan) return c.json({ error: "일정을 찾을 수 없습니다" }, 404);

  const body = await c.req.json().catch(() => ({}));
  if (body.kind && !KINDS.has(body.kind)) return c.json({ error: "kind는 여행/데이트/약속 중 하나여야 합니다" }, 400);
  if ("title" in body && !body.title?.trim()) return c.json({ error: "title은 비울 수 없습니다" }, 400);

  const sets = [];
  const values = [];
  for (const [key, column] of Object.entries(PLAN_PATCHABLE_FIELDS)) {
    if (key in body) {
      sets.push(`${column} = ?`);
      values.push(key === "title" ? body[key].trim() : body[key]);
    }
  }
  if (sets.length === 0) return c.json({ error: "수정할 필드가 없습니다" }, 400);

  const stmts = [];

  // 기간(시작/종료일)이 바뀌면 실제 날짜(days) 행도 그만큼 늘리거나 줄여야 한다 — 예전엔 plans
  // 테이블의 start_date/end_date만 바뀌고 days는 그대로라 "3일차"를 추가해도 안 나타나던 버그가 있었음.
  if ("startDate" in body || "endDate" in body) {
    const finalStart = body.startDate ?? plan.start_date;
    const finalEnd = body.endDate ?? plan.end_date;
    const newDates = dateRange(finalStart, finalEnd);
    const newDateSet = new Set(newDates);

    const existingDays = (await c.env.DB.prepare("SELECT id, date FROM days WHERE plan_id = ?").bind(id).all()).results;
    const existingByDate = new Map(existingDays.map((d) => [d.date, d]));
    const daysToRemove = existingDays.filter((d) => !newDateSet.has(d.date));

    if (daysToRemove.length > 0 && !body.force) {
      const removeIds = daysToRemove.map((d) => d.id);
      const placeholders = removeIds.map(() => "?").join(",");
      const itemCountRow = await c.env.DB.prepare(
        `SELECT COUNT(*) AS n FROM items WHERE day_id IN (${placeholders})`
      ).bind(...removeIds).first();
      if (itemCountRow.n > 0) {
        return c.json({
          error: `기간을 줄이면 ${daysToRemove.length}일치 일정에 있는 항목 ${itemCountRow.n}개가 같이 삭제돼요. 그래도 계속할까요?`,
          needsForce: true,
          affectedItemCount: itemCountRow.n,
        }, 409);
      }
    }

    for (const d of daysToRemove) {
      stmts.push(c.env.DB.prepare("DELETE FROM days WHERE id = ?").bind(d.id));
    }
    newDates.forEach((date, i) => {
      const existing = existingByDate.get(date);
      if (existing) {
        stmts.push(c.env.DB.prepare("UPDATE days SET sort_order = ? WHERE id = ?").bind(i, existing.id));
      } else {
        stmts.push(
          c.env.DB.prepare("INSERT INTO days (id, plan_id, date, sort_order) VALUES (?, ?, ?, ?)")
            .bind(newId("day"), id, date, i)
        );
      }
    });
  }

  values.push(id);
  stmts.push(c.env.DB.prepare(`UPDATE plans SET ${sets.join(", ")} WHERE id = ?`).bind(...values));
  await c.env.DB.batch(stmts);

  c.executionCtx.waitUntil(notifyRoom(c.env, id, "plan.updated"));
  const updated = await c.env.DB.prepare("SELECT * FROM plans WHERE id = ?").bind(id).first();
  return c.json({
    id: updated.id, kind: updated.kind, title: updated.title,
    startDate: updated.start_date, endDate: updated.end_date, region: updated.region,
    status: computeStatus(updated.end_date),
  });
});

// DELETE /api/plans/:id — 일정 전체 삭제 (멤버/날짜/항목 다 같이 지워짐, FK ON DELETE CASCADE).
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const plan = await c.env.DB.prepare("SELECT id FROM plans WHERE id = ?").bind(id).first();
  if (!plan) return c.json({ error: "일정을 찾을 수 없습니다" }, 404);

  c.executionCtx.waitUntil(notifyRoom(c.env, id, "plan.deleted"));
  await c.env.DB.prepare("DELETE FROM plans WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

// POST /api/plans/:id/members — 이름만으로 참여
app.post("/:id/members", async (c) => {
  const id = c.req.param("id");
  const { name } = await c.req.json().catch(() => ({}));
  const sessionUser = await getSessionUser(c);
  const finalName = name?.trim() || sessionUser?.nickname;
  if (!finalName) return c.json({ error: "name은 필수입니다" }, 400);

  const plan = await c.env.DB.prepare("SELECT id FROM plans WHERE id = ?").bind(id).first();
  if (!plan) return c.json({ error: "일정을 찾을 수 없습니다" }, 404);

  // 로그인 상태면 이 계정이 이 일정에 이미 참여해 있는지 먼저 확인 — 다른 기기에서 다시 로그인해서
  // 들어와도 멤버가 중복 생성되지 않게.
  if (sessionUser) {
    const already = await c.env.DB.prepare("SELECT id, color FROM members WHERE plan_id = ? AND user_id = ?")
      .bind(id, sessionUser.id).first();
    if (already) return c.json({ memberId: already.id, color: already.color });
  }

  const { count } = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM members WHERE plan_id = ?").bind(id).first();
  const color = MEMBER_COLORS[count % MEMBER_COLORS.length];
  const memberId = newId("mem");

  await c.env.DB.prepare("INSERT INTO members (id, plan_id, name, color, user_id) VALUES (?, ?, ?, ?, ?)")
    .bind(memberId, id, finalName, color, sessionUser?.id ?? null)
    .run();

  c.executionCtx.waitUntil(notifyRoom(c.env, id, "member.joined"));
  return c.json({ memberId, color }, 201);
});

// POST /api/plans/:id/items — 일정 항목 추가
app.post("/:id/items", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const { dayId, type, time, name, query, lat, lng, mapLink, move, flightNo, voucher, memo, createdBy } = body;

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
      `INSERT INTO items (id, day_id, type, time, name, query, lat, lng, map_link, move, flight_no, voucher, detail, item_status, created_by, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`
    ).bind(itemId, dayId, type, time || null, name.trim(), query || null, lat ?? null, lng ?? null, mapLink || null, move || null, flightNo || null, voucher || null, memo || null, createdBy || null, insertAt)
  );
  await c.env.DB.batch(stmts);

  c.executionCtx.waitUntil(notifyRoom(c.env, id, "item.added"));
  return c.json({
    id: itemId, dayId, type, time: time || null, name: name.trim(), query: query || null,
    lat: lat ?? null, lng: lng ?? null,
    mapLink: mapLink || null, move: move || null, flightNo: flightNo || null, voucher: voucher || null,
    memo: memo || null, itemStatus: "confirmed", createdBy: createdBy || null,
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
  mapLink: "map_link", move: "move", flightNo: "flight_no", voucher: "voucher", memo: "detail",
  itemStatus: "item_status",
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

  // dayId로 다른 날짜로 옮기는 경우 — 그 날짜가 같은 일정 소속인지 확인하고, 옮겨간 날의 맨 끝
  // sort_order로 붙인다(그 날 기존 순서를 안 흔들기 위해).
  if ("dayId" in body) {
    const targetDay = await c.env.DB.prepare("SELECT id FROM days WHERE id = ? AND plan_id = ?")
      .bind(body.dayId, id).first();
    if (!targetDay) return c.json({ error: "날짜를 찾을 수 없습니다" }, 404);
    const maxRow = await c.env.DB.prepare("SELECT MAX(sort_order) AS m FROM items WHERE day_id = ?")
      .bind(body.dayId).first();
    sets.push("day_id = ?", "sort_order = ?");
    values.push(body.dayId, (maxRow?.m ?? -1) + 1);
  }

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

// 항목 첨부파일(항공권/기차표/바우처 사진·PDF) — R2에 실제 바이트를 두고 D1엔 키/파일명/타입만.
const ATTACHMENT_MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_ATTACHMENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"]);

// POST /api/plans/:id/items/:itemId/attachment — 바디는 파일 원본 바이트,
// Content-Type 헤더로 MIME, X-Filename 헤더(URL 인코딩)로 원본 파일명을 받는다(멀티파트 대신 단순하게).
app.post("/:id/items/:itemId/attachment", async (c) => {
  const { id, itemId } = c.req.param();
  const owns = await c.env.DB.prepare(
    "SELECT items.id, items.attachment_key FROM items JOIN days ON items.day_id = days.id WHERE items.id = ? AND days.plan_id = ?"
  ).bind(itemId, id).first();
  if (!owns) return c.json({ error: "항목을 찾을 수 없습니다" }, 404);

  const contentType = c.req.header("content-type") || "";
  if (!ALLOWED_ATTACHMENT_TYPES.has(contentType)) {
    return c.json({ error: "이미지(JPG/PNG/WEBP/HEIC) 또는 PDF만 첨부할 수 있어요" }, 400);
  }
  const filenameHeader = c.req.header("x-filename");
  const filename = filenameHeader ? decodeURIComponent(filenameHeader) : "attachment";

  const body = await c.req.arrayBuffer();
  if (body.byteLength === 0) return c.json({ error: "빈 파일입니다" }, 400);
  if (body.byteLength > ATTACHMENT_MAX_BYTES) return c.json({ error: "파일이 너무 커요 (최대 8MB)" }, 400);

  // 기존 첨부가 있으면 먼저 지워서 R2에 고아 파일이 안 남게.
  if (owns.attachment_key) {
    await c.env.ATTACHMENTS.delete(owns.attachment_key).catch(() => {});
  }
  const key = `items/${itemId}/${newId("att")}`;
  await c.env.ATTACHMENTS.put(key, body, { httpMetadata: { contentType } });
  await c.env.DB.prepare("UPDATE items SET attachment_key = ?, attachment_name = ?, attachment_type = ? WHERE id = ?")
    .bind(key, filename, contentType, itemId).run();

  c.executionCtx.waitUntil(notifyRoom(c.env, id, "item.updated"));
  return c.json({ attachmentName: filename, attachmentType: contentType });
});

// GET /api/plans/:id/items/:itemId/attachment — 파일 그대로 스트리밍(이미지는 바로 보이고, PDF는 브라우저 뷰어로).
app.get("/:id/items/:itemId/attachment", async (c) => {
  const { id, itemId } = c.req.param();
  const item = await c.env.DB.prepare(
    "SELECT items.attachment_key, items.attachment_type FROM items JOIN days ON items.day_id = days.id WHERE items.id = ? AND days.plan_id = ?"
  ).bind(itemId, id).first();
  if (!item?.attachment_key) return c.json({ error: "첨부파일이 없습니다" }, 404);

  const obj = await c.env.ATTACHMENTS.get(item.attachment_key);
  if (!obj) return c.json({ error: "파일을 찾을 수 없습니다" }, 404);

  return new Response(obj.body, {
    headers: { "Content-Type": item.attachment_type || "application/octet-stream", "Cache-Control": "private, max-age=86400" },
  });
});

// DELETE /api/plans/:id/items/:itemId/attachment
app.delete("/:id/items/:itemId/attachment", async (c) => {
  const { id, itemId } = c.req.param();
  const item = await c.env.DB.prepare(
    "SELECT items.attachment_key FROM items JOIN days ON items.day_id = days.id WHERE items.id = ? AND days.plan_id = ?"
  ).bind(itemId, id).first();
  if (!item) return c.json({ error: "항목을 찾을 수 없습니다" }, 404);
  if (item.attachment_key) await c.env.ATTACHMENTS.delete(item.attachment_key).catch(() => {});
  await c.env.DB.prepare(
    "UPDATE items SET attachment_key = NULL, attachment_name = NULL, attachment_type = NULL WHERE id = ?"
  ).bind(itemId).run();
  c.executionCtx.waitUntil(notifyRoom(c.env, id, "item.updated"));
  return c.json({ ok: true });
});

export default app;
