import React from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { C } from "./theme";
import { s, keyframes } from "./styles";
import HomeScreen from "./screens/HomeScreen";
import CalendarScreen from "./screens/CalendarScreen";
import CreatePlanScreen from "./screens/CreatePlanScreen";
import PlanScreen from "./screens/PlanScreen";
import MyPageScreen from "./screens/MyPageScreen";
import AdminScreen from "./screens/AdminScreen";
import { PlaneBadgeIcon, CalendarIcon } from "./components/Icons";

// 하단 탭바는 홈/캘린더 두 화면에서만 보인다 — 일정 만들기·일정 상세는 자체 상단 흐름을 쓴다.
// (나의 지도는 마이페이지 안으로 옮겨서 여기 탭에는 더 이상 없음)
function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab = location.pathname === "/calendar" ? "calendar" : "home";
  return (
    <div style={s.tabbar}>
      <button style={{ ...s.tabBtn, ...(tab === "home" ? s.tabOn : {}) }} onClick={() => navigate("/")}>
        <span style={s.tabIcon}><PlaneBadgeIcon size={17} color={tab === "home" ? C.orangeDeep : C.muted} /></span> 일정
      </button>
      <button style={{ ...s.tabBtn, ...(tab === "calendar" ? s.tabOn : {}) }} onClick={() => navigate("/calendar")}>
        <span style={s.tabIcon}><CalendarIcon size={18} color={tab === "calendar" ? C.orangeDeep : C.muted} /></span> 캘린더
      </button>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const showTabBar = location.pathname === "/" || location.pathname === "/calendar";

  return (
    <div className="app-shell" style={s.app}>
      <style>{keyframes}</style>
      <div style={s.screen}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/calendar" element={<CalendarScreen />} />
          <Route path="/new" element={<CreatePlanScreen />} />
          <Route path="/p/:planId" element={<PlanScreen />} />
          <Route path="/me" element={<MyPageScreen />} />
          <Route path="/admin" element={<AdminScreen />} />
        </Routes>
      </div>
      {showTabBar && <TabBar />}
    </div>
  );
}
