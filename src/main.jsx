import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { getTheme, applyTheme } from "./lib/theme";

// React가 첫 렌더를 하기 전에(=아직 아무것도 안 그려진 시점에) 미리 골라둔 테마를 적용해서
// "기본 오렌지로 잠깐 보였다가 저장된 테마로 바뀌는" 깜빡임이 없게 한다.
applyTheme(getTheme());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
