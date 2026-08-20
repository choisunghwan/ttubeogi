// 데모(ttubeogi.jsx)의 유틸 함수 그대로.
export function fmtDate(str) {
  const [y, m, d] = str.split("-");
  return `${y}.${m}.${d}`;
}

export function sinceLabel(str) {
  const days = Math.round((new Date(new Date().toDateString()) - new Date(str)) / 86400000);
  if (days <= 0) return "오늘";
  if (days < 30) return `${days}일 전`;
  if (days < 365) return `${Math.round(days / 30)}개월 전`;
  return `${Math.round(days / 365)}년 전`;
}

// 오늘부터 dateStr까지 남은 일수 (자정 기준, 시간대는 로컬 브라우저 기준)
export function daysUntil(dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date(new Date().toDateString());
  return Math.round((target - today) / 86400000);
}

export function formatDday(startDate) {
  const d = daysUntil(startDate);
  if (d === 0) return "오늘 출발! D-DAY";
  if (d > 0) return `D-${d}`;
  return null; // 이미 시작된 일정은 뱃지 생략
}

// 지난 일정을 월별로 묶을 때 쓰는 그룹 라벨 — "2026년 3월"
export function formatMonthLabel(dateStr) {
  const [y, m] = dateStr.split("-");
  return `${y}년 ${Number(m)}월`;
}

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

// 홈 카드용 "9월 12일 – 15일 · 3박 4일" / "8월 23일 (토) · 하루" 포맷
export function formatWhen(startDate, endDate) {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const nights = Math.round((end - start) / 86400000);
  const fmtMD = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일`;

  if (nights <= 0) {
    return { when: `${fmtMD(start)} (${WEEKDAY[start.getDay()]})`, nights: "하루" };
  }
  const endLabel = start.getMonth() === end.getMonth() ? `${end.getDate()}일` : fmtMD(end);
  return { when: `${fmtMD(start)} – ${endLabel}`, nights: `${nights}박 ${nights + 1}일` };
}
