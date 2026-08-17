-- 커뮤니티 공유: 명시적으로 공개(opt-in)한 일정만 별도 피드에 노출. 게시 = 자기 일정에
-- 플래그만 켜는 것(복제 없음) — 계속 내 홈 화면 목록에 그대로 있어서 관리하기 쉽다.
ALTER TABLE plans ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0;
ALTER TABLE plans ADD COLUMN published_by TEXT REFERENCES users(id);
ALTER TABLE plans ADD COLUMN published_at TEXT;
ALTER TABLE plans ADD COLUMN like_count INTEGER NOT NULL DEFAULT 0;

-- 좋아요 (계정 : 게시물 다대다) — item_votes(item_id, member_id)와 같은 구조.
CREATE TABLE IF NOT EXISTS community_likes (
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (plan_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_plans_is_public ON plans(is_public, like_count);
