import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../theme";
import { s } from "../styles";
import { WalkTtubeogi } from "../components/TtubeogiCharacter";
import { getMe, logout, updateNickname, KAKAO_LOGIN_URL } from "../lib/auth";

export default function MyPageScreen() {
  const navigate = useNavigate();
  const [me, setMe] = useState(undefined); // undefined = 확인 중, null = 비로그인
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMe().then((u) => { setMe(u); if (u) setNickname(u.nickname); });
  }, []);

  async function handleSave() {
    if (!nickname.trim() || nickname.trim() === me.nickname) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateNickname(nickname.trim());
      setMe(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    if (!window.confirm("로그아웃할까요?")) return;
    await logout();
    navigate("/");
  }

  return (
    <div style={s.pad}>
      <button style={s.backBtn} onClick={() => navigate("/")}>◀ 홈</button>
      <div style={s.eyebrow}>MY PAGE</div>
      <h1 style={s.h1}>마이페이지</h1>

      {me === undefined && <div style={s.emptyState}>불러오는 중…</div>}

      {me === null && (
        <div style={s.joinCard}>
          <WalkTtubeogi size={40} />
          <div style={{ margin: "12px 0 16px", color: C.muted, fontSize: 14, lineHeight: 1.5 }}>
            로그인하면 닉네임을 직접 정할 수 있고,<br />기기를 바꿔도 내 일정이 계속 보여요.
          </div>
          <a href={KAKAO_LOGIN_URL} style={{ display: "block", width: "100%" }}>
            <button style={{ ...s.submitBtn, width: "100%", boxSizing: "border-box" }}>🟡 카카오로 로그인</button>
          </a>
        </div>
      )}

      {me && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0 24px" }}>
            <div style={{ ...s.profileDot, width: 52, height: 52, fontSize: 20 }}>{me.nickname[0]}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{me.nickname}</div>
              <div style={{ fontSize: 12.5, color: C.muted }}>🟡 카카오 로그인됨</div>
            </div>
          </div>

          <div style={s.formLabel}>닉네임</div>
          <div style={s.formRow}>
            <input style={{ ...s.formInput, flex: 1, minWidth: 0 }} value={nickname}
                   onChange={(e) => { setNickname(e.target.value); setSaved(false); }}
                   placeholder="일행에게 보일 이름" maxLength={20} />
            <button
              style={{ ...s.shareCopyBtn, flexShrink: 0, ...((!nickname.trim() || nickname.trim() === me.nickname || saving) ? s.submitBtnDisabled : {}) }}
              disabled={!nickname.trim() || nickname.trim() === me.nickname || saving}
              onClick={handleSave}
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
          {saved && <div style={{ ...s.formHint, color: C.orangeDeep, fontWeight: 700 }}>✅ 닉네임을 바꿨어요</div>}
          {error && <div style={s.formError}>{error}</div>}
          <div style={s.formHint}>여기서 바꾸면 카카오 닉네임이 나중에 바뀌어도 이 이름을 계속 써요.</div>

          <button style={{ ...s.backBtn, marginTop: 28, color: "#c0392b", fontWeight: 800 }} onClick={handleLogout}>
            로그아웃
          </button>
        </>
      )}
    </div>
  );
}
