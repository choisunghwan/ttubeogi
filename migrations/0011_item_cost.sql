-- 항목별 비용(원 단위 정수, 소수점 없음 — 원화 기준이라 필요 없음). 선택 입력이라 기본 NULL.
ALTER TABLE items ADD COLUMN cost INTEGER;
