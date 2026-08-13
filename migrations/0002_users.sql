-- 선택적 카카오 로그인. 로그인 안 해도 지금처럼 링크+이름으로 계속 참여 가능(members.user_id가 null).
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  kakao_id TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

ALTER TABLE members ADD COLUMN user_id TEXT REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
