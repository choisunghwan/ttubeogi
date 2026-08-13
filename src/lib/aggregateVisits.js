import { KOREA_REGIONS, matchKoreaRegion } from "../data/koreaRegions";

// 로그인이 없어 서버가 "완료 시 자동 집계"할 소유자 개념이 없다 — 홈 화면과 같은 방식으로,
// 이 브라우저가 아는 지난(past) 일정들을 그때그때 지역별로 묶어서 계산한다.
export function aggregateVisits(plans) {
  const past = plans.filter((p) => p.status === "past");

  const byRegionId = new Map();
  const overseas = [];

  for (const plan of past) {
    const matched = matchKoreaRegion(plan.region || plan.title);
    if (!matched) {
      overseas.push({ id: plan.id, title: plan.title, region: plan.region, endDate: plan.endDate });
      continue;
    }
    if (!byRegionId.has(matched.id)) {
      byRegionId.set(matched.id, { ...matched, visits: 0, lastVisit: null, planTitles: [] });
    }
    const entry = byRegionId.get(matched.id);
    entry.visits += 1;
    entry.planTitles.push(plan.title);
    if (!entry.lastVisit || plan.endDate > entry.lastVisit) entry.lastVisit = plan.endDate;
  }

  // 안정적인 순서(지도 위 위치 순서)로 반환.
  const domestic = KOREA_REGIONS.map((r) => byRegionId.get(r.id)).filter(Boolean);
  return { domestic, overseas };
}
