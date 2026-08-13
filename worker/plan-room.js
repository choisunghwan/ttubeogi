// 일정(Plan) 하나 = PlanRoom 인스턴스 하나.
// 쓰기(D1 반영)는 여전히 worker/routes/plans.js의 REST 핸들러가 한다 — 이미 검증된 경로를 그대로 쓴다.
// PlanRoom은 "그 Plan 전용 pub/sub 채널" 역할만: 참여자들의 WebSocket을 들고 있다가,
// REST 핸들러가 쓰기에 성공한 뒤 내부 호출로 넘겨주는 이벤트를 그 방에 붙은 전원에게 그대로 전달한다.
// (Spring 비유: SimpMessagingTemplate.convertAndSend() 같은 역할 — 비즈니스 로직은 컨트롤러에 남아있다.)
export class PlanRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map(); // sessionId -> WebSocket
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader && upgradeHeader.toLowerCase() === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.handleSession(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    // 내부 알림 경로: Worker(REST 핸들러)가 D1 쓰기 성공 후 이 방에 붙은 전원에게 뿌려달라고 호출.
    if (request.method === "POST") {
      const body = await request.text();
      this.broadcast(body);
      return new Response(null, { status: 204 });
    }

    return new Response("Not found", { status: 404 });
  }

  handleSession(ws) {
    ws.accept();
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, ws);

    // 이번 패스는 서버→클라이언트 단방향 알림만 필요 — 클라이언트가 보내는 메시지는 무시.
    const cleanup = () => this.sessions.delete(sessionId);
    ws.addEventListener("close", cleanup);
    ws.addEventListener("error", cleanup);
  }

  broadcast(message) {
    for (const [sessionId, ws] of this.sessions) {
      try {
        ws.send(message);
      } catch {
        this.sessions.delete(sessionId);
      }
    }
  }
}
