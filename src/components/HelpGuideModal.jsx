import React from "react";
import { s } from "../styles";
import { C } from "../theme";

// 처음 오는 사람도 훑어보면 바로 쓸 수 있게 — 일정 화면의 핵심 기능만 간단히.
const SECTIONS = [
  { icon: "📍", title: "항목 추가 & 좌표 찾기",
    body: "\"+ 항목 추가\"로 장소·시간·이동수단을 입력하세요. 이름을 검색하면 지도 좌표가 자동으로 연결돼요 — 해외는 도시 이름을 같이 적으면 더 정확해요 (예: \"도쿄 디즈니랜드\")." },
  { icon: "⠿", title: "순서 바꾸기",
    body: "항목 왼쪽의 ⠿ 손잡이를 눌러서 위아래로 드래그하면 순서를 직접 바꿀 수 있어요." },
  { icon: "🧭", title: "동선 최적화",
    body: "좌표가 있는 항목이 3개 이상이면 \"동선 최적화\" 버튼으로 이동 거리가 가장 짧아지는 순서를 자동으로 계산해줘요. 마음에 안 들면 바로 옆 \"되돌리기\"로 원래 순서로 돌아갈 수 있어요." },
  { icon: "🔒", title: "항목 고정",
    body: "항목의 자물쇠 버튼을 누르면 \"고정\"되어, 동선 최적화를 돌려도 그 항목은 순서가 그대로 유지돼요. 출발지·도착지처럼 꼭 지켜야 하는 곳에 써보세요." },
  { icon: "🗺️", title: "지도 보기",
    body: "\"지도\" 탭에서 하루 동선을 한눈에 볼 수 있고, 이동수단별 예상 소요시간도 함께 표시돼요." },
  { icon: "🔗", title: "실시간 공동 편집",
    body: "이 페이지 링크를 공유하면 여러 명이 동시에 같은 일정을 실시간으로 같이 짤 수 있어요 — 로그인 없이 이름만 입력하면 바로 참여돼요." },
  { icon: "🎫", title: "티켓 & 캘린더",
    body: "항공권·바우처·첨부파일이 있는 항목은 \"티켓\" 탭에 모아서 볼 수 있고, 각 항목을 내 캘린더 앱에 담을 수도 있어요." },
  { icon: "🎨", title: "테마 색상",
    body: "마이페이지에서 앱 전체 색상 테마를 바꿀 수 있어요." },
];

export default function HelpGuideModal({ onClose }) {
  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modalSheet} onClick={(e) => e.stopPropagation()} data-testid="help-guide-modal">
        <div style={s.modalHead}>
          <span style={s.modalTitle}>뚜버기 사용법</span>
          <button style={s.modalCloseBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
          {SECTIONS.map((sec) => (
            <div key={sec.title} style={{ display: "flex", gap: 12 }}>
              <div style={{ fontSize: 19, flexShrink: 0, width: 26, textAlign: "center", lineHeight: "26px" }}>{sec.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 3 }}>{sec.title}</div>
                <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.55 }}>{sec.body}</div>
              </div>
            </div>
          ))}
        </div>
        <button style={{ ...s.submitBtn, marginTop: 22 }} onClick={onClose}>확인했어요</button>
      </div>
    </div>
  );
}
