import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../theme";
import { s } from "../styles";
import { getMe } from "../lib/auth";
import { listAdminUsers, listAdminMembers } from "../lib/api";

function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso.replace(" ", "T") + "Z");
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// 관리자 전용 회원 목록 화면. 서버가 어차피 is_admin 아니면 403을 주지만, 프론트에서도
// 로그인 상태 확인 후 admin이 아니면 바로 내보내서 화면이 잠깐이라도 뜨지 않게 한다.
export default function AdminScreen() {
  const navigate = useNavigate();
  const [me, setMe] = useState(undefined);
  const [users, setUsers] = useState(null);
  const [members, setMembers] = useState(null);
  const [totalPlans, setTotalPlans] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMe().then((u) => {
      setMe(u);
      if (!u?.isAdmin) { navigate("/me"); return; }
      Promise.all([listAdminUsers(), listAdminMembers()])
        .then(([usersData, membersData]) => {
          setUsers(usersData.users);
          setMembers(membersData.members);
          setTotalPlans(membersData.totalPlans);
        })
        .catch((e) => setError(e.message));
    });
  }, [navigate]);

  const loading = me === undefined || (me?.isAdmin && members === null && !error);
  if (loading) return <div style={s.pad}><div style={s.emptyState}>불러오는 중…</div></div>;
  if (!me?.isAdmin) return null;

  const guestCount = members?.filter((m) => m.isGuest).length ?? 0;
  const loggedInCount = (members?.length ?? 0) - guestCount;

  return (
    <div style={s.pad}>
      <button style={s.backBtn} onClick={() => navigate("/me")}>◀ 마이페이지</button>
      <div style={s.eyebrow}>ADMIN</div>
      <h1 style={s.h1}>회원 현황</h1>

      {error && <div style={s.formError}>{error}</div>}

      <div style={s.stats}>
        <div style={s.stat}>
          <div style={s.statNum}>{totalPlans}</div>
          <div style={s.statLabel}>총 일정</div>
        </div>
        <div style={s.stat}>
          <div style={s.statNum}>{members?.length ?? 0}</div>
          <div style={s.statLabel}>참여 멤버</div>
        </div>
        <div style={s.stat}>
          <div style={s.statNum}>{loggedInCount}</div>
          <div style={s.statLabel}>로그인 회원</div>
        </div>
        <div style={s.stat}>
          <div style={s.statNum}>{guestCount}</div>
          <div style={s.statLabel}>게스트</div>
        </div>
      </div>

      <div style={{ ...s.sectionLabel, marginTop: 22 }}>가입 회원 ({users?.length ?? 0})</div>
      {users?.length === 0 ? (
        <div style={s.formHint}>아직 카카오로 로그인한 회원이 없어요.</div>
      ) : (
        <div style={s.adminTableWrap}>
          <table style={s.adminTable}>
            <thead>
              <tr>
                <th style={s.adminTh}>닉네임</th>
                <th style={s.adminTh}>가입일</th>
                <th style={s.adminTh}>최근 접속</th>
                <th style={s.adminTh}>참여 일정</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id}>
                  <td style={{ ...s.adminTd, fontWeight: 700 }}>{u.nickname}</td>
                  <td style={s.adminTd}>{fmtDate(u.createdAt)}</td>
                  <td style={s.adminTd}>{fmtDate(u.lastLoginAt)}</td>
                  <td style={{ ...s.adminTd, textAlign: "right", color: C.orangeDeep, fontWeight: 700 }}>{u.planCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ ...s.sectionLabel, marginTop: 22 }}>전체 참여 멤버 — 게스트 포함 ({members?.length ?? 0})</div>
      {members?.length === 0 ? (
        <div style={s.formHint}>아직 아무도 일정에 참여하지 않았어요.</div>
      ) : (
        <div style={s.adminTableWrap}>
          <table style={s.adminTable}>
            <thead>
              <tr>
                <th style={s.adminTh}>이름</th>
                <th style={s.adminTh}>구분</th>
                <th style={s.adminTh}>일정</th>
                <th style={s.adminTh}>참여일</th>
              </tr>
            </thead>
            <tbody>
              {members?.map((m) => (
                <tr key={m.id}>
                  <td style={{ ...s.adminTd, fontWeight: 700 }}>{m.name}</td>
                  <td style={s.adminTd}>
                    <span style={{
                      ...s.adminBadge,
                      background: m.isGuest ? "#efe9dc" : "#fdeee0", color: m.isGuest ? "#8a8170" : C.orangeDeep,
                    }}>
                      {m.isGuest ? "게스트" : "로그인"}
                    </span>
                  </td>
                  <td style={{ ...s.adminTd, whiteSpace: "normal", minWidth: 140 }}>{m.planKind} · {m.planTitle}</td>
                  <td style={s.adminTd}>{fmtDate(m.joinedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
