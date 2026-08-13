-- 항목별 첨부파일(항공권/기차표/바우처 사진이나 PDF) — 실제 파일은 R2에 저장하고
-- 여기엔 R2 오브젝트 키 + 원본 파일명 + MIME 타입만 저장한다.
ALTER TABLE items ADD COLUMN attachment_key TEXT;
ALTER TABLE items ADD COLUMN attachment_name TEXT;
ALTER TABLE items ADD COLUMN attachment_type TEXT;
