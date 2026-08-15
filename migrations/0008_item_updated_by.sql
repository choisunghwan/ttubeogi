-- 항목을 마지막으로 수정한 멤버 — 지금까지는 처음 추가한 사람만 계속 표시돼서,
-- 다른 사람이 나중에 고쳐도 누가 고쳤는지 알 수 없었다.
ALTER TABLE items ADD COLUMN updated_by TEXT REFERENCES members(id);
