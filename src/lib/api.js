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

export function listAdminUsers() {
  return request("/api/admin/users");
}

export function createPlan({ kind, title, startDate, endDate, region, creatorName }) {
  return request("/api/plans", {
    method: "POST",
    body: JSON.stringify({ kind, title, startDate, endDate, region, creatorName }),
  });
}

// ids가 비어 있어도(=이 브라우저가 아는 일정이 하나도 없어도) 서버는 계속 호출한다 —
// 로그인 상태면 서버가 세션으로 계정 소유 일정을 찾아서 합쳐주기 때문에, 새 기기/브라우저에서
// 로그인만 했을 때도 내 일정이 보여야 한다(로컬 캐시가 텅 비어 있다고 조회 자체를 건너뛰면 안 됨).
export function listMyPlans(ids) {
  return request(`/api/plans?ids=${encodeURIComponent(ids.join(","))}`);
}

export function getPlan(planId) {
  return request(`/api/plans/${planId}`);
}

export function updatePlan(planId, patch) {
  return request(`/api/plans/${planId}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function deletePlan(planId) {
  return request(`/api/plans/${planId}`, { method: "DELETE" });
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

// 항목 첨부파일(항공권/기차표/바우처 사진·PDF) — multipart 대신 파일 원본을 그대로 바디로,
// 파일명은 헤더로 넘긴다(한글 파일명 대비 encodeURIComponent).
export async function uploadAttachment(planId, itemId, file) {
  const res = await fetch(`/api/plans/${planId}/items/${itemId}/attachment`, {
    method: "POST",
    headers: { "Content-Type": file.type, "X-Filename": encodeURIComponent(file.name) },
    body: file,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `업로드 실패 (${res.status})`);
  }
  return res.json();
}

export function deleteAttachment(planId, itemId) {
  return request(`/api/plans/${planId}/items/${itemId}/attachment`, { method: "DELETE" });
}

export function attachmentUrl(planId, itemId) {
  return `/api/plans/${planId}/items/${itemId}/attachment`;
}

// 드래그로 바꾼 순서 반영 — itemIds는 그 날짜 항목 전체를 새 순서대로.
export function reorderItems(planId, dayId, itemIds) {
  return request(`/api/plans/${planId}/days/${dayId}/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ itemIds }),
  });
}

// 실패(결과 없음)해도 예외를 던지지 않고 빈 배열을 반환 — 호출부에서 "결과 없음" UI로 자연스럽게 처리하기 위함.
// 후보를 여러 개 반환 — 동명이인(CGV 여러 지점)이나 국내/해외 동명 지명을 사용자가 직접 골라야 해서다.
export async function geocodeQuery(q) {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
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
