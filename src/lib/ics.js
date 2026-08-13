// 일정 항목 하나를 iCalendar(.ics)로 만들어서 폰 캘린더에 추가할 수 있게 함.
// 서버를 안 거치고 브라우저에서 바로 파일을 만들어 내려주므로 오프라인에서도 동작한다 —
// 와이파이/데이터 없이도 저장해둔 여행 정보를 볼 수 있게 하자는 이 앱의 목적과 맞음.
function pad(n) { return String(n).padStart(2, "0"); }
function escapeICS(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
function fmtDate(d) { return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`; }
function fmtDateTime(d) { return `${fmtDate(d)}T${pad(d.getHours())}${pad(d.getMinutes())}00`; }
function fmtUTCStamp(d) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

// dayDate: "YYYY-MM-DD" (이 항목이 속한 날짜), item.time은 있을 수도 없을 수도 있음(없으면 종일 일정).
export function buildItemICS({ planTitle, item, dayDate }) {
  const [y, m, d] = dayDate.split("-").map(Number);
  const hasTime = Boolean(item.time);
  let start, end;
  if (hasTime) {
    const [hh, mm] = item.time.split(":").map(Number);
    start = new Date(y, m - 1, d, hh, mm);
    end = new Date(start);
    end.setHours(end.getHours() + 1); // 종료 시간이 따로 없어서 기본 1시간짜리 일정으로.
  } else {
    start = new Date(y, m - 1, d);
    end = new Date(start);
    end.setDate(end.getDate() + 1);
  }

  const descParts = [];
  if (item.move) descParts.push(`이동수단: ${item.move}`);
  if (item.flightNo) descParts.push(`항공편: ${item.flightNo}`);
  if (item.voucher) descParts.push(`바우처/예약번호: ${item.voucher}`);
  descParts.push(`뚜버기 일정: ${planTitle}`);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ttubeogi//KO",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${item.id}@ttubeogi.app`,
    `DTSTAMP:${fmtUTCStamp(new Date())}`,
    hasTime ? `DTSTART:${fmtDateTime(start)}` : `DTSTART;VALUE=DATE:${fmtDate(start)}`,
    hasTime ? `DTEND:${fmtDateTime(end)}` : `DTEND;VALUE=DATE:${fmtDate(end)}`,
    `SUMMARY:${escapeICS(item.name)}`,
    `DESCRIPTION:${descParts.map(escapeICS).join("\\n")}`,
  ];
  if (item.query || item.name) lines.push(`LOCATION:${escapeICS(item.query || item.name)}`);
  if (item.lat != null && item.lng != null) lines.push(`GEO:${item.lat};${item.lng}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(filename, icsContent) {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
