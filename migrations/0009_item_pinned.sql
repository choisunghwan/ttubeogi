-- 동선 최적화 때 이 항목의 순서를 건드리지 말라는 표시(출발지/도착지 등 고정하고 싶은 이유는
-- 다양하니 이유는 안 묻고 그냥 켜고 끌 수 있게만).
ALTER TABLE items ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;
