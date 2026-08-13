import React from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { s, keyframes } from "./styles";
import HomeScreen from "./screens/HomeScreen";
import TravelMap from "./screens/TravelMap";
import CreatePlanScreen from "./screens/CreatePlanScreen";
import PlanScreen from "./screens/PlanScreen";

// 하단 탭바는 홈/나의지도 두 화면에서만 보인다 — 일정 만들기·일정 상세는 자체 상단 흐름을 쓴다.
function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab = location.pathname === "/map" ? "map" : "home";
  return (
    <div style={s.tabbar}>
      <button style={{ ...s.tabBtn, ...(tab === "home" ? s.tabOn : {}) }} onClick={() => navigate("/")}>
        <span style={s.tabIcon}>🏠</span> 홈
      </button>
      <button style={{ ...s.tabBtn, ...(tab === "map" ? s.tabOn : {}) }} onClick={() => navigate("/map")}>
        <span style={s.tabIcon}>🗺️</span> 나의 지도
      </button>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const showTabBar = location.pathname === "/" || location.pathname === "/map";

  return (
    <div style={s.app}>
      <style>{keyframes}</style>
      <div style={showTabBar ? s.screen : { flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/map" element={<TravelMap />} />
          <Route path="/new" element={<CreatePlanScreen />} />
          <Route path="/p/:planId" element={<PlanScreen />} />
        </Routes>
      </div>
      {showTabBar && <TabBar />}
    </div>
  );
}
