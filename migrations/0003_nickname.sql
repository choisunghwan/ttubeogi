-- 로그인할 때마다 카카오 닉네임으로 자동 덮어쓰던 걸, 사용자가 직접 닉네임을 바꾸면 그 뒤로는
-- 자동 동기화를 멈추기 위한 플래그.
ALTER TABLE users ADD COLUMN nickname_customized INTEGER NOT NULL DEFAULT 0;
