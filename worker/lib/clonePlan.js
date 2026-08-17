import { newPlanId, newId } from "../ids.js";
import { MEMBER_COLORS } from "../routes/plans.js";

// 커뮤니티에서 "담기" 눌렀을 때 쓰는 공용 헬퍼 — 공개된 plan 하나를 통째로 새 plan으로 복제한다.
// 결과는 원본과 완전히 독립된 일정이라 담아간 사람이 자유롭게 고칠 수 있다.
//
// 개인정보 보호: 항목의 memo(detail)/항공편명/바우처/첨부파일은 의도적으로 복사하지 않는다 —
// 항공권 사진이나 개인 메모가 남의 계정으로 그대로 넘어가면 안 되기 때문. 멤버 목록도 복사하지
// 않고 담아가는 사람 한 명만 새로 만든다(원본 멤버들의 실명이 그대로 노출되면 안 되므로).
export async function clonePlan(db, { sourcePlanId, creatorName, creatorUserId }) {
  const source = await db.prepare("SELECT * FROM plans WHERE id = ?").bind(sourcePlanId).first();
  if (!source) return null;

  const days = (await db.prepare("SELECT * FROM days WHERE plan_id = ? ORDER BY sort_order").bind(sourcePlanId).all()).results;
  const dayIds = days.map((d) => d.id);
  let items = [];
  if (dayIds.length > 0) {
    const placeholders = dayIds.map(() => "?").join(",");
    items = (await db.prepare(
      `SELECT * FROM items WHERE day_id IN (${placeholders}) ORDER BY sort_order, time`
    ).bind(...dayIds).all()).results;
  }

  const newPid = newPlanId(source.title);
  const memberId = newId("mem");
  const dayIdMap = new Map(days.map((d) => [d.id, newId("day")]));

  const stmts = [
    db.prepare(
      "INSERT INTO plans (id, kind, title, start_date, end_date, region, status) VALUES (?, ?, ?, ?, ?, ?, 'upcoming')"
    ).bind(newPid, source.kind, source.title, source.start_date, source.end_date, source.region),
    db.prepare(
      "INSERT INTO members (id, plan_id, name, color, user_id) VALUES (?, ?, ?, ?, ?)"
    ).bind(memberId, newPid, creatorName, MEMBER_COLORS[0], creatorUserId ?? null),
    ...days.map((d) =>
      db.prepare("INSERT INTO days (id, plan_id, date, city, sort_order) VALUES (?, ?, ?, ?, ?)")
        .bind(dayIdMap.get(d.id), newPid, d.date, d.city, d.sort_order)
    ),
    ...items.map((it) =>
      db.prepare(
        `INSERT INTO items (id, day_id, type, time, name, query, lat, lng, map_link, move, item_status, sort_order, created_by, pinned)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)`
      ).bind(
        newId("item"), dayIdMap.get(it.day_id), it.type, it.time, it.name, it.query, it.lat, it.lng,
        it.map_link, it.move, it.sort_order, memberId, it.pinned
      )
    ),
  ];

  await db.batch(stmts);
  return { id: newPid, memberId };
}
