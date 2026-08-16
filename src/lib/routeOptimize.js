function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function pathLength(points, order) {
  let total = 0;
  for (let i = 0; i < order.length - 1; i++) total += haversineMeters(points[order[i]], points[order[i + 1]]);
  return total;
}

// points: [{ lat, lng, ... }] — 첫 항목을 출발점으로 고정하고(보통 집/숙소라 사용자가
// 바꾸고 싶지 않은 경우가 많음), 나머지를 최단 동선이 되도록 재배열한다.
// 최근접 이웃(nearest neighbor)으로 초기 경로를 만든 다음 2-opt로 교차하는 구간을 풀어서
// 다듬는다 — 일정 항목 개수가 보통 10개 안팎이라 이 정도로도 충분히 실용적인 동선이 나온다.
export function optimizeRouteOrder(points) {
  const n = points.length;
  if (n <= 2) return points;

  const visited = new Array(n).fill(false);
  let order = [0];
  visited[0] = true;
  for (let step = 1; step < n; step++) {
    const last = points[order[order.length - 1]];
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < n; i++) {
      if (visited[i]) continue;
      const d = haversineMeters(last, points[i]);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    visited[best] = true;
    order.push(best);
  }

  let bestLen = pathLength(points, order);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        const candidate = [...order.slice(0, i), ...order.slice(i, k + 1).reverse(), ...order.slice(k + 1)];
        const candidateLen = pathLength(points, candidate);
        if (candidateLen < bestLen - 1e-6) {
          order = candidate;
          bestLen = candidateLen;
          improved = true;
        }
      }
    }
  }

  return order.map((idx) => points[idx]);
}
