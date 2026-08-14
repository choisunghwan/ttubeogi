-- 관리자 플래그. 실제로 누구를 관리자로 지정할지는 이 마이그레이션엔 안 담고(계정 정보라 git에
-- 안 남기는 게 맞음) 배포 후 wrangler d1 execute로 직접 UPDATE 한다.
ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
