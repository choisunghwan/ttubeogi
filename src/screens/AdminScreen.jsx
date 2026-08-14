import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../theme";
import { s } from "../styles";
import { getMe } from "../lib/auth";
import { listAdminUsers } from "../lib/api";

function fmtDate(iso) {
  const d = new Date(iso.replace(" ", "T") + "Z");
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// 관리자 전용 회원 목록 화면. 서버가 어차피 is_admin 아니면 403을 주지만, 프론트에서도
// 로그인 상태 확인 후 admin이 아니면 바로 내보내서 화면이 잠깐이라도 뜨지 않게 한다.
export default function AdminScreen() {
  const navigate = useNavigate();
  const [me, setMe] = useState(undefined);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMe().then((u) => {
      setMe(u);
      if (!u?.isAdmin) { navigate("/me"); return; }
      listAdminUsers().then((data) => setUsers(data.users)).catch((e) => setError(e.message));
    });
  }, [navigate]);

  if (me === undefined || (me?.isAdmin && users === null && !error)) {
    return <div style={s.pad}><div style={s.emptyState}>불러오는 중…</div></div>;
  }
  if (!me?.isAdmin) return null;

  return (
    <div style={s.pad}>
      <button style={s.backBtn} onClick={() => navigate("/me")}>◀ 마이페이지</button>
      <div style={s.eyebrow}>ADMIN</div>
      <h1 style={s.h1}>회원 목록</h1>
      <div style={{ ...s.formHint, marginBottom: 16 }}>카카오 로그인으로 가입한 회원 {users?.length ?? 0}명</div>

      {error && <div style={s.formError}>{error}</div>}

      {users?.length === 0 && <div style={s.emptyState}>아직 로그인한 회원이 없어요.</div>}

      {users?.map((u) => (
        <div key={u.id} style={s.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ ...s.profileDot, width: 40, height: 40, fontSize: 16 }}>{u.nickname[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{u.nickname}</div>
              <div style={{ fontSize: 12.5, color: C.muted }}>가입일 {fmtDate(u.createdAt)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.orangeDeep }}>{u.planCount}</div>
              <div style={{ fontSize: 11, color: C.muted }}>참여 일정</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
