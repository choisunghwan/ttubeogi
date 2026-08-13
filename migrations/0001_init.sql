-- 뚜버기 D1 스키마 초안 (스펙 4장 데이터 모델의 관계형 정규화 버전)
-- Plan -> Day[] -> Item[] 중첩 구조를 4개 테이블 + 투표 조인 테이블로 분해.
-- SQLite(D1)엔 JSON 타입이 따로 없어 detail/cities는 TEXT에 JSON 문자열로 저장(json_extract 등으로 조회 가능).

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,                 -- 예: "shanghai-a3f9" (title slug + 랜덤 접미사)
  kind TEXT NOT NULL CHECK (kind IN ('여행', '데이트', '약속')),
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,            -- ISO 날짜 문자열 (YYYY-MM-DD)
  end_date TEXT NOT NULL,
  region TEXT,                          -- 발자국 지도 집계용 대표 지역 (예: "상하이")
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'past')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,                  -- 멤버 구분용 아바타 색상 (hex)
  joined_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_members_plan_id ON members(plan_id);

CREATE TABLE IF NOT EXISTS days (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  city TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_days_plan_id ON days(plan_id);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL REFERENCES days(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                   -- 명소 | 식당 | 카페 | 쇼핑 | 숙소 | 이동 | 항공 | 기타
  time TEXT,
  name TEXT NOT NULL,
  query TEXT,                            -- 지도 검색어/주소 (좌표 변환용)
  lat REAL,
  lng REAL,
  map_link TEXT,
  move TEXT,                             -- 도보 | 지하철 | 버스 | 트램 | 택시 등
  detail TEXT,                           -- 종류별 상세 (JSON 문자열: 항공=편명/시간, 숙소=체크인아웃 등)
  item_status TEXT NOT NULL DEFAULT 'candidate' CHECK (item_status IN ('candidate', 'confirmed')),
  created_by TEXT REFERENCES members(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_items_day_id ON items(day_id);

-- 좋아요/투표 (멤버 : 항목 다대다)
CREATE TABLE IF NOT EXISTS item_votes (
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, member_id)
);

-- 나의 지도(발자국 기록) — Plan이 past로 바뀔 때마다 해당 region의 visits +1로 집계
CREATE TABLE IF NOT EXISTS visit_records (
  region TEXT PRIMARY KEY,
  visits INTEGER NOT NULL DEFAULT 0,
  last_visit TEXT,
  cities TEXT,                           -- JSON 문자열 배열 (가본 세부 장소 목록)
  lat REAL,
  lng REAL
);
