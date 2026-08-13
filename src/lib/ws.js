import { useEffect, useRef, useState } from "react";

// 이 일정(Plan) 방의 WebSocket에 붙어서, 누가 뭘 바꿨다는 신호가 오면 onEvent()를 호출한다.
// 세밀한 diff는 안 하고 "바뀌었다"는 신호만 받아서 호출자가 전체를 다시 불러오는 방식(M2 스펙 참고).
export function usePlanSocket(planId, onEvent) {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!planId) return;
    let ws;
    let reconnectTimer;
    let closedByUs = false;

    function connect() {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${proto}//${window.location.host}/api/plans/${encodeURIComponent(planId)}/ws`);
      ws.addEventListener("open", () => setConnected(true));
      ws.addEventListener("close", () => {
        setConnected(false);
        if (!closedByUs) reconnectTimer = setTimeout(connect, 1500);
      });
      ws.addEventListener("error", () => ws.close());
      ws.addEventListener("message", () => onEventRef.current?.());
    }
    connect();

    return () => {
      closedByUs = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [planId]);

  return { connected };
}
