import { Hono } from "hono";
import plansRouter from "./routes/plans.js";
import geocodeRouter from "./routes/geocode.js";
import routeRouter from "./routes/route.js";

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
app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
