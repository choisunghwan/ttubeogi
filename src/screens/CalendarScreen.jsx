import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C, SERIF_EN } from "../theme";
import { s } from "../styles";
import KindIcon from "../components/KindIcon";
import { CalendarIcon } from "../components/Icons";
import { listMyPlans } from "../lib/api";
import { getKnownPlanIds } from "../lib/localPlans";
import { buildPlansICS, downloadICS } from "../lib/ics";
import { formatWhen } from "../utils";

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
function pad(n) { return String(n).padStart(2, "0"); }
function toKey(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; } // m: 0-indexed

// 화면 1: 캘린더 — 예전 "나의 지도" 탭 자리. 내 일정 전체를 달력으로 한눈에 보고,
// 한꺼번에 폰 캘린더로 내보낼 수 있게.
export default function CalendarScreen() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listMyPlans(getKnownPlanIds())
      .then((data) => { if (!cancelled) setPlans(data); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  // 날짜(YYYY-MM-DD) -> 그 날짜가 기간에 포함되는 Plan 목록.
  const plansByDate = useMemo(() => {
    const map = new Map();
    for (const p of plans || []) {
      let cur = new Date(p.startDate + "T00:00:00");
      const end = new Date(p.endDate + "T00:00:00");
      while (cur <= end) {
        const key = toKey(cur.getFullYear(), cur.getMonth(), cur.getDate());
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(p);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [plans]);

  if (plans === null && !error) {
    return <div style={s.pad}><div style={s.emptyState}>불러오는 중…</div></div>;
  }
  if (error) {
    return <div style={s.pad}><div style={s.emptyState}>{error}</div></div>;
  }

  const { y, m } = cursor;
  const firstOfMonth = new Date(y, m, 1);
  const startWeekday = firstOfMonth.getDay(); // 이번 달 1일이 무슨 요일인지
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayKey = toKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedPlans = selectedKey ? (plansByDate.get(selectedKey) || []) : [];

  function changeMonth(delta) {
    const d = new Date(y, m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
    setSelectedKey(null);
  }

  function handleExportAll() {
    if (!plans || plans.length === 0) return;
    const ics = buildPlansICS(plans);
    downloadICS("뚜버기_전체일정.ics", ics);
  }

  return (
    <div style={s.pad}>
      <div style={s.head}>
        <CalendarIcon size={26} color={C.gold} />
        <div>
          <div style={s.eyebrow}>MY CALENDAR</div>
          <h1 style={s.h1}>일정 캘린더</h1>
        </div>
      </div>

      <div style={s.calHeadRow}>
        <button style={s.calNavBtn} onClick={() => changeMonth(-1)}>‹</button>
        <div style={s.calMonthLabel}>{y}년 {m + 1}월</div>
        <button style={s.calNavBtn} onClick={() => changeMonth(1)}>›</button>
      </div>

      <div style={s.calGrid}>
        {WEEKDAY.map((w, i) => (
          <div key={w} style={{ ...s.calWeekday, color: i === 0 ? "#c0392b" : i === 6 ? C.gold : C.muted }}>{w}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} />;
          const key = toKey(y, m, d);
          const dayPlans = plansByDate.get(key) || [];
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          return (
            <div key={key} style={s.calCellWrap} onClick={() => dayPlans.length > 0 && setSelectedKey(isSelected ? null : key)}>
              <div style={{
                ...s.calCell,
                ...(isToday ? s.calCellToday : {}),
                ...(isSelected ? s.calCellSelected : {}),
                cursor: dayPlans.length > 0 ? "pointer" : "default",
              }}>
                {d}
              </div>
              {dayPlans.length > 0 && (
                <div style={s.calDots}>
                  {dayPlans.slice(0, 3).map((p) => (
                    <span key={p.id} style={{ ...s.calDot, background: p.status === "past" ? C.muted : C.gold }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedPlans.length > 0 && (
        <div style={s.calSelectedList}>
          <div style={s.calSelectedLabel}>{selectedKey} 일정</div>
          {selectedPlans.map((p) => (
            <div key={p.id} style={s.calSelectedRow} onClick={() => navigate(`/p/${p.id}`)}>
              <KindIcon kind={p.kind} size={16} color={C.gold} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.calSelectedTitle}>{p.title}</div>
                <div style={s.calSelectedWhen}>{formatWhen(p.startDate, p.endDate).when}</div>
              </div>
              <span style={{ color: C.gold, fontWeight: 800 }}>›</span>
            </div>
          ))}
        </div>
      )}

      {(!plans || plans.length === 0) && (
        <div style={{ ...s.emptyState, marginTop: 16 }}>아직 만든 일정이 없어요.<br />일정을 만들면 여기 캘린더에 표시돼요.</div>
      )}

      <button style={{ ...s.calExportBtn, ...((!plans || plans.length === 0) ? s.submitBtnDisabled : {}) }}
              disabled={!plans || plans.length === 0} onClick={handleExportAll}>
        <CalendarIcon size={16} color="#fff" /> 전체 일정 내 폰 캘린더로 내보내기
      </button>
      <div style={s.newHint}>여기서 세운 일정 전체를 한 번에 캘린더 앱으로 담을 수 있어요</div>
    </div>
  );
}
