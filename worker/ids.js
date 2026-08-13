// id 생성 헬퍼. 스펙 예시("shanghai-a3f9")처럼 title-slug + 짧은 랜덤 접미사.
export function slugify(title) {
  const romanized = title
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-") // 한글 포함 유니코드 문자/숫자 이외는 하이픈으로
    .replace(/^-+|-+$/g, "");
  return romanized || "plan";
}

function randomSuffix(len = 4) {
  return crypto.randomUUID().replace(/-/g, "").slice(0, len);
}

export function newPlanId(title) {
  return `${slugify(title)}-${randomSuffix()}`;
}

export function newId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}
