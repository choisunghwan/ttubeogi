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
      byRegionId.set(matched.id, { ...matched, visits: 0, lastVisit: null, planTitles: [], specificCities: new Map() });
    }
    const entry = byRegionId.get(matched.id);
    entry.visits += 1;
    entry.planTitles.push(plan.title);
    if (!entry.lastVisit || plan.endDate > entry.lastVisit) entry.lastVisit = plan.endDate;
    // "경북" 같은 광역 표현으로만 매칭됐으면 구체적인 도시를 모르는 거라 후보에서 뺀다 —
    // "포항" 여행이 "안동"(도 대표 지점)으로 잘못 찍혀 보이던 문제의 원인이었음.
    if (!matched.genericKeywords.includes(matched.matchedKeyword)) {
      entry.specificCities.set(matched.matchedKeyword, { x: matched.x, y: matched.y });
    }
  }

  // 이 지역에서 매칭된 구체적인 도시가 정확히 하나뿐이면 그 도시 이름·좌표를 그대로 쓰고
  // ("포항", 실제 포항 위치), 도시가 여러 개 섞였거나 하나도 특정 못 했으면 도 이름·무게중심으로
  // 보여준다("경북").
  for (const entry of byRegionId.values()) {
    if (entry.specificCities.size === 1) {
      const [name, coord] = [...entry.specificCities.entries()][0];
      entry.name = name;
      entry.x = coord.x;
      entry.y = coord.y;
    }
    delete entry.specificCities;
  }

  // 안정적인 순서(지도 위 위치 순서)로 반환.
  const domestic = KOREA_REGIONS.map((r) => byRegionId.get(r.id)).filter(Boolean);
  return { domestic, overseas };
}
