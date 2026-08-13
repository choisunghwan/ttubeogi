import React, { useState } from "react";
import { s } from "../styles";
import { C, TYPES } from "../theme";
import { addItem, updateItem, geocodeQuery } from "../lib/api";

const MOVE_OPTIONS = ["도보", "지하철", "버스", "트램", "택시", "자차", "기타"];
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1~12
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

// 저장 형식은 계속 24시간제 "HH:MM" 문자열 — 정렬·표시 다른 곳과 호환 유지, 입력 UI만 오전/오후로 보여준다.
function to24(ampm, hour12, minute) {
  let h = Number(hour12) % 12;
  if (ampm === "오후") h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}
function parseTime(time) {
  if (!time) return null;
  const [hStr, minute] = time.split(":");
  const h = Number(hStr);
  const ampm = h >= 12 ? "오후" : "오전";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { ampm, hour12, minute };
}

// 일정 항목 추가/수정 모달. item이 있으면 수정, 없으면 dayId에 새로 추가.
export default function ItemFormModal({ planId, dayId, item, memberId, onClose, onSaved }) {
  const isEdit = Boolean(item);
  const [type, setType] = useState(item?.type || "명소");
  const [time, setTime] = useState(item?.time || "");
  const [name, setName] = useState(item?.name || "");
  const [query, setQuery] = useState(item?.query || "");
  const [mapLink, setMapLink] = useState(item?.mapLink || "");
  const [move, setMove] = useState(item?.move || "도보");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 좌표는 "마지막으로 검색에 성공한 검색어"와 지금 검색어가 같을 때만 유효 — query/name을 바꾸면
  // 자동으로 무효화돼서 엉뚱한 좌표가 새 이름에 딸려가는 걸 막는다.
  const [coords, setCoords] = useState(item?.lat != null && item?.lng != null ? { lat: item.lat, lng: item.lng } : null);
  const [searchedFor, setSearchedFor] = useState(item ? (item.query || item.name || "") : "");
  const [geoStatus, setGeoStatus] = useState(null); // null | "searching" | "notfound" | "picking"
  const [geoLabel, setGeoLabel] = useState(null);
  const [geoCandidates, setGeoCandidates] = useState([]); // 검색 결과 여러 개 — 사용자가 골라야 함

  const currentTerm = (query.trim() || name.trim());
  const coordsValid = Boolean(coords) && currentTerm !== "" && searchedFor === currentTerm;

  async function handleGeocode() {
    if (!currentTerm) return;
    setGeoStatus("searching");
    setCoords(null);
    const results = await geocodeQuery(currentTerm);
    if (results.length > 0) {
      setGeoCandidates(results);
      setGeoStatus("picking");
    } else {
      setGeoCandidates([]);
      setGeoStatus("notfound");
    }
  }

  function pickCandidate(result) {
    setCoords({ lat: result.lat, lng: result.lng });
    setSearchedFor(currentTerm);
    setGeoLabel(result.label);
    setGeoCandidates([]);
    setGeoStatus(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError("이름은 필수예요"); return; }
    setSubmitting(true);
    setError(null);
    const geo = coordsValid ? { lat: coords.lat, lng: coords.lng } : { lat: null, lng: null };
    try {
      if (isEdit) {
        await updateItem(planId, item.id, { type, time: time || null, name: name.trim(), query: query || null, ...geo, mapLink: mapLink || null, move: move || null });
      } else {
        await addItem(planId, { dayId, type, time: time || null, name: name.trim(), query: query || null, ...geo, mapLink: mapLink || null, move: move || null, createdBy: memberId });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modalSheet} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHead}>
          <span style={s.modalTitle}>{isEdit ? "항목 수정" : "항목 추가"}</span>
          <button style={s.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.formLabel}>종류</div>
          <div style={s.pickerGrid}>
            {Object.entries(TYPES).map(([key, t]) => (
              <button type="button" key={key}
                style={{ ...s.pickerBtn, ...(type === key ? s.pickerBtnOn : {}) }}
                onClick={() => setType(key)}>
                {t.emoji} {key}
              </button>
            ))}
          </div>

          <div style={s.formLabel}>시간</div>
          {(() => {
            const parsed = parseTime(time);
            if (!parsed) {
              return (
                <button type="button" style={s.pickerBtn} onClick={() => setTime(to24("오전", 9, "00"))}>
                  ＋ 시간 설정
                </button>
              );
            }
            return (
              <>
                <div style={s.pickerGrid}>
                  <button type="button" style={{ ...s.pickerBtn, ...(parsed.ampm === "오전" ? s.pickerBtnOn : {}) }}
                    onClick={() => setTime(to24("오전", parsed.hour12, parsed.minute))}>오전</button>
                  <button type="button" style={{ ...s.pickerBtn, ...(parsed.ampm === "오후" ? s.pickerBtnOn : {}) }}
                    onClick={() => setTime(to24("오후", parsed.hour12, parsed.minute))}>오후</button>
                </div>
                <div style={{ ...s.formRow, marginTop: 8 }}>
                  <select style={{ ...s.formInput, flex: 1, minWidth: 110 }} value={parsed.hour12}
                    onChange={(e) => setTime(to24(parsed.ampm, e.target.value, parsed.minute))}>
                    {HOURS_12.map((h) => <option key={h} value={h}>{h}시</option>)}
                  </select>
                  <select style={{ ...s.formInput, flex: 1, minWidth: 110 }} value={parsed.minute}
                    onChange={(e) => setTime(to24(parsed.ampm, parsed.hour12, e.target.value))}>
                    {MINUTES.map((m) => <option key={m} value={m}>{m}분</option>)}
                  </select>
                </div>
                <button type="button" style={{ ...s.backBtn, marginTop: 4, padding: 0 }} onClick={() => setTime("")}>시간 삭제</button>
              </>
            );
          })()}

          <div style={s.formLabel}>이름</div>
          <input style={s.formInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 와이탄" />

          <div style={s.formLabel}>지도 검색어/주소 (선택)</div>
          <div style={s.formRow}>
            <input
              style={{ ...s.formInput, flex: 1, minWidth: 0 }} value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="비워두면 이름으로 검색돼요"
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault(); // 폼 제출(저장) 대신 좌표 찾기를 실행
                handleGeocode();
              }}
            />
            <button type="button" style={{ ...s.shareCopyBtn, flexShrink: 0 }} disabled={!currentTerm || geoStatus === "searching"} onClick={handleGeocode}>
              {geoStatus === "searching" ? "찾는 중…" : "🔍 좌표 찾기"}
            </button>
          </div>
          {coordsValid && <div style={{ ...s.formHint, color: C.orangeDeep, fontWeight: 700 }}>📍 {geoLabel} — 좌표 확인됨</div>}
          {geoStatus === "notfound" && <div style={s.formHint}>결과 없음 — 아래 지도 링크를 붙여넣어 주세요</div>}
          {geoStatus === "picking" && geoCandidates.length > 0 && (
            <div style={s.geoCandidateList}>
              <div style={{ ...s.formHint, marginBottom: 4 }}>여러 곳이 검색됐어요 — 맞는 곳을 골라주세요</div>
              {geoCandidates.map((r, i) => (
                <button type="button" key={i} style={s.geoCandidateBtn} onClick={() => pickCandidate(r)}>
                  <span style={s.geoCandidateFlag}>{r.source === "kakao" ? "🇰🇷" : "🌍"}</span>
                  <span style={s.geoCandidateText}>
                    <span style={s.geoCandidateLabel}>{r.label}</span>
                    {r.address && <span style={s.geoCandidateAddr}>{r.address}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div style={s.formLabel}>지도 링크 붙여넣기 (선택)</div>
          <input style={s.formInput} value={mapLink} onChange={(e) => setMapLink(e.target.value)} placeholder="구글맵/카카오맵 링크" />

          <div style={s.formLabel}>이동수단</div>
          <div style={s.pickerGrid}>
            {MOVE_OPTIONS.map((m) => (
              <button type="button" key={m}
                style={{ ...s.pickerBtn, ...(move === m ? s.pickerBtnOn : {}) }}
                onClick={() => setMove(m)}>
                {m}
              </button>
            ))}
          </div>
          <input style={{ ...s.formInput, marginTop: 8 }} value={move} onChange={(e) => setMove(e.target.value)} placeholder="직접 입력도 가능" />

          {error && <div style={s.formError}>{error}</div>}

          <button type="submit" style={{ ...s.submitBtn, ...(submitting ? s.submitBtnDisabled : {}) }} disabled={submitting}>
            {submitting ? "저장 중…" : "저장"}
          </button>
        </form>
      </div>
    </div>
  );
}
