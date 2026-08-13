// Worker API 호출 래퍼. 전부 상대경로(/api/...)라 개발/배포 환경 구분 없이 동작.
async function request(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `요청 실패 (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export function createPlan({ kind, title, startDate, endDate, region, creatorName }) {
  return request("/api/plans", {
    method: "POST",
    body: JSON.stringify({ kind, title, startDate, endDate, region, creatorName }),
  });
}

export function listMyPlans(ids) {
  if (ids.length === 0) return Promise.resolve([]);
  return request(`/api/plans?ids=${encodeURIComponent(ids.join(","))}`);
}

export function getPlan(planId) {
  return request(`/api/plans/${planId}`);
}

export function joinPlan(planId, name) {
  return request(`/api/plans/${planId}/members`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function addItem(planId, item) {
  return request(`/api/plans/${planId}/items`, {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export function updateItem(planId, itemId, patch) {
  return request(`/api/plans/${planId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteItem(planId, itemId) {
  return request(`/api/plans/${planId}/items/${itemId}`, { method: "DELETE" });
}

// 드래그로 바꾼 순서 반영 — itemIds는 그 날짜 항목 전체를 새 순서대로.
export function reorderItems(planId, dayId, itemIds) {
  return request(`/api/plans/${planId}/days/${dayId}/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ itemIds }),
  });
}

// 실패(결과 없음)해도 예외를 던지지 않고 null을 반환 — 호출부에서 "결과 없음" UI로 자연스럽게 처리하기 위함.
export async function geocodeQuery(q) {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
  if (!res.ok) return null;
  return res.json();
}

// 두 좌표 사이의 실제 도로 경로. 못 찾으면 null(호출부에서 직선으로 대체).
export async function fetchRoute(from, to, profile = "foot") {
  const params = new URLSearchParams({
    fromLat: from.lat, fromLng: from.lng, toLat: to.lat, toLng: to.lng, profile,
  });
  const res = await fetch(`/api/route?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.points; // [[lat,lng], ...]
}
