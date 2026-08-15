// D1 쓰기가 끝난 뒤 그 방(PlanRoom)에 붙어있는 모든 WebSocket 클라이언트에게 "바뀌었다"고 알린다.
// 페이로드는 최소한만 담고, 클라이언트는 받으면 그냥 전체를 다시 불러온다(GET /api/plans/:id).
// plans.js뿐 아니라 auth.js(닉네임 수정 시 그 사람이 속한 방들에도 알려야 함)에서도 써서 공용 파일로 뺐다.
export async function notifyRoom(env, planId, type) {
  const stub = env.PLAN_ROOM.get(env.PLAN_ROOM.idFromName(planId));
  await stub.fetch("https://internal/broadcast", {
    method: "POST",
    body: JSON.stringify({ type, planId }),
  });
}
