import React, { forwardRef } from "react";
import { s } from "../styles";
import { C, TYPES } from "../theme";
import { formatWon, timeBlockOf, TIME_BLOCK_EMOJI } from "../utils";

// 카톡 등으로 "사진 한 장"으로 공유할 하루 일정 카드. 화면에는 안 보이고(항상 화면 밖에 렌더링)
// PlanScreen이 html2canvas로 이 DOM을 그대로 캡처해서 이미지로 만든다 — 그래서 실제 화면 크기/
// 반응형 레이아웃과 무관하게 고정 폭(480px)으로 그려서 캡처 결과가 항상 일정하게 나오게 한다.
const DayShareCard = forwardRef(function DayShareCard({ plan, day, dayIndex, dayCost }, ref) {
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][new Date(day.date + "T00:00:00").getDay()];
  const [y, m, d] = day.date.split("-");
  const dateLabel = `${Number(m)}월 ${Number(d)}일 (${weekday})`;

  // 리스트 화면과 같은 방식 — 이미 정렬된 순서를 그대로 훑으면서 구간이 바뀌는 지점에만 헤더를 끼운다.
  const items = day.items;

  return (
    <div ref={ref} style={s.shareCard}>
      <div style={s.shareCardEyebrow}>TTUBEOGI · {plan.kind}</div>
      <div style={s.shareCardTitle}>{plan.title}</div>
      <div style={s.shareCardSub}>
        {plan.days.length > 1 ? `${dayIndex + 1}일차 · ` : ""}{dateLabel}
      </div>

      <div style={s.shareCardPerforation} />

      {items.length === 0 ? (
        <div style={{ ...s.shareCardSub, textAlign: "center", padding: "20px 0" }}>아직 추가된 일정이 없어요.</div>
      ) : (
        items.map((item, i) => {
          const block = timeBlockOf(item.time);
          const showBlockHeader = i === 0 || timeBlockOf(items[i - 1].time) !== block;
          const t = TYPES[item.type] || TYPES.기타;
          return (
            <React.Fragment key={item.id}>
              {showBlockHeader && (
                <div style={s.shareCardBlockLabel}>{TIME_BLOCK_EMOJI[block]} {block}</div>
              )}
              <div style={s.shareCardItemRow}>
                <div style={s.shareCardItemTime}>{item.time || ""}</div>
                <div style={{ ...s.shareCardItemBadge, background: t.color }}>{t.emoji}</div>
                <div style={s.shareCardItemName}>{item.name}</div>
                {item.cost != null && <div style={s.shareCardItemCost}>{formatWon(item.cost)}</div>}
              </div>
            </React.Fragment>
          );
        })
      )}

      <div style={s.shareCardPerforation} />

      <div style={s.shareCardFooter}>
        <div>
          {dayCost > 0 && (
            <span><span style={s.shareCardFooterCostLabel}>이 날 지출</span><span style={s.shareCardFooterCost}>{formatWon(dayCost)}</span></span>
          )}
        </div>
      </div>
      <div style={s.shareCardBrand}>🍡 TTUBEOGI</div>
    </div>
  );
});

export default DayShareCard;
