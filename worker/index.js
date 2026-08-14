import { Hono } from "hono";
import plansRouter from "./routes/plans.js";
import geocodeRouter from "./routes/geocode.js";
import routeRouter from "./routes/route.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";

// Durable Object 클래스는 wrangler.jsonc의 durable_objects.bindings가 찾을 수 있도록
// 이 파일(main entry)에서 반드시 export 해야 한다.
export { PlanRoom } from "./plan-room.js";

const app = new Hono();

// Spring 비유: 여기 하나하나가 @RestController의 @GetMapping/@PostMapping 메서드에 해당.
app.get("/api/health", (c) => c.json({ ok: true, service: "ttubeogi-worker" }));

// Spring 비유: plansRouter는 PlanController — app.route()가 그 컨트롤러를 /api/plans 하위로 마운트.
app.route("/api/plans", plansRouter);
app.route("/api/geocode", geocodeRouter);
app.route("/api/route", routeRouter);
app.route("/api/auth", authRouter);
app.route("/api/admin", adminRouter);

// WebSocket 업그레이드는 그 planId에 해당하는 PlanRoom Durable Object로 그대로 넘긴다.
// (Durable Object 하나 = 그 Plan의 실시간 방 하나. idFromName으로 planId를 방 id로 삼는다.)
app.get("/api/plans/:id/ws", (c) => {
  const stub = c.env.PLAN_ROOM.get(c.env.PLAN_ROOM.idFromName(c.req.param("id")));
  return stub.fetch(c.req.raw);
});

// 나머지 GET 요청(정적 자산 + /p/:id 같은 클라이언트 라우트)은 전부 ASSETS 바인딩으로 넘긴다.
// Worker가 항상 먼저 요청을 받기 때문에(엣지의 "정적 자산 우선" 라우팅은 배포 후에만 자동 적용),
// 우리가 명시적으로 넘겨줘야 wrangler.jsonc의 not_found_handling: "single-page-application"이
// 동작해서 /p/:id를 새로고침해도 index.html로 폴백된다.
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 카카오톡 등에 /p/:id 링크를 공유하면 크롤러가 이 HTML을 그대로 읽어서 카드 미리보기를 만든다
// (크롤러는 JS를 실행 안 하므로 index.html의 og:태그가 정적으로 그 일정 정보를 담고 있어야 함).
// index.html에 있는 기본 og:태그 값을 그 일정의 제목/날짜로 문자열 치환해서 내려준다.
app.get("/p/:id", async (c) => {
  const id = c.req.param("id");
  const assetRes = await c.env.ASSETS.fetch(c.req.raw);
  const plan = await c.env.DB.prepare("SELECT kind, title, start_date, end_date, region FROM plans WHERE id = ?").bind(id).first();
  if (!plan) return assetRes;

  const fmtMD = (iso) => {
    const d = new Date(iso + "T00:00:00");
    return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
  };
  const dateLabel = plan.start_date === plan.end_date ? fmtMD(plan.start_date) : `${fmtMD(plan.start_date)} - ${fmtMD(plan.end_date)}`;
  const title = escapeHtml(`${plan.kind} · ${plan.title}`);
  const desc = escapeHtml(`${dateLabel}${plan.region ? ` · ${plan.region}` : ""} — 뚜버기에서 같이 일정을 만들어보세요!`);
  const url = c.req.url.split("?")[0];

  const html = (await assetRes.text())
    .replaceAll('content="뚜버기 — 여행·데이트·약속을 함께 만드는 실시간 일정"', `content="${title}"`)
    .replaceAll('content="여행·데이트·약속을 링크 하나로 같이 만드는 실시간 협업 일정 앱"', `content="${desc}"`)
    .replace('content="https://ttubeogi.ttubeogi.workers.dev/"', `content="${url}"`);

  return new Response(html, { headers: assetRes.headers });
});

app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
