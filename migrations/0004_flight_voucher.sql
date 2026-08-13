-- 항공편/바우처(예약번호) — 항공·숙소 항목에서 특히 필요하다는 요청으로 추가.
-- 기존 detail(범용 JSON) 컬럼 대신 자주 쓰는 두 값은 그냥 평범한 TEXT 컬럼으로 분리
-- (map_link, move처럼 이 스키마는 자주 쓰는 필드는 JSON에 안 묻고 컬럼으로 바로 둠).
ALTER TABLE items ADD COLUMN flight_no TEXT;
ALTER TABLE items ADD COLUMN voucher TEXT;
