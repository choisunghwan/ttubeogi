// 로그인이 없는 앱이라 "내 일정"을 서버가 알 방법이 없다.
// 이 브라우저가 만들었거나 참여한 planId + 그 일정에서의 내 memberId를 localStorage에 캐시해둔다.
const KEY = "ttubeogi:knownPlans"; // { [planId]: memberId }

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function writeAll(map) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function getKnownPlanIds() {
  return Object.keys(readAll());
}

export function getMemberId(planId) {
  return readAll()[planId] || null;
}

export function rememberPlan(planId, memberId) {
  const all = readAll();
  all[planId] = memberId;
  writeAll(all);
}
