const STORAGE_KEY = "ttubeogi_theme";

// <html data-theme="..."> 속성 하나로 앱 전체 색이 바뀐다 — 실제 색상 값은
// styles.js가 :root/[data-theme] CSS 규칙으로 주입해둔 CSS 변수에 들어있다(src/theme.js THEMES 참고).
export function getTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "orange";
  } catch {
    return "orange";
  }
}

export function applyTheme(themeId) {
  if (themeId === "orange") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", themeId);
  }
}

export function setTheme(themeId) {
  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    // 저장 실패해도(프라이빗 모드 등) 이번 방문 동안은 바로 적용되게 계속 진행.
  }
  applyTheme(themeId);
}
