# Claude Code 시작 지시문

> 아래 내용을 Claude Code에 그대로 붙여넣고, 함께 `뚜버기_스펙.md`와 `ttubeogi.jsx` 두 파일을 첨부하세요.

---

## 붙여넣을 메시지

안녕. **뚜버기(Ttubeogi)** 라는 실시간 협업 일정 앱을 처음부터 만들 거야.
여행·데이트·약속을 여럿이 링크 하나로 같이 짜고, 지도 위에서 캐릭터가 동선을 걸어다니고,
다녀온 곳이 지도에 발자국으로 쌓이는 앱이야.

첨부한 두 파일을 먼저 읽어줘:
- `뚜버기_스펙.md` — 전체 설계도 (컨셉·기술스택·데이터모델·화면·우선순위)
- `ttubeogi.jsx` — 동작하는 데모. **디자인·색감·캐릭터(SVG 뚜버기)·동선 애니메이션의 기준.** 이 룩앤필을 그대로 살려줘.

### 기술 스택 (확정)
- 프론트: React
- 호스팅: Cloudflare Workers Assets / Pages
- 백엔드: Cloudflare Workers (JS)
- DB: Cloudflare D1 (SQL)
- 실시간: Cloudflare Durable Objects + WebSocket
- 지도: Leaflet + CARTO 타일 (무료)
- 검색: 국내=카카오맵 로컬 API / 해외=Nominatim (지역 자동 전환), 보조로 지도 링크 붙여넣기

### 이렇게 진행해줘
1. 먼저 **프로젝트 구조와 개발 순서(마일스톤)를 제안**해줘. 바로 코딩하지 말고, 계획부터 같이 확정하자.
2. 1차 MVP 범위(스펙 7장)만 목표로 잡자. 투표·드래그·도로경로·AI는 2차 이후.
3. Cloudflare 배포까지 고려한 구조로. `wrangler` 설정, D1 스키마, Durable Object 뼈대도 잡아줘.
4. 나는 Java/Spring 백엔드 개발자라 SQL·서버 개념은 익숙해. JS/React·Cloudflare 쪽은 처음이니 그 부분은 조금 더 설명해줘.

### 첫 작업으로 해줄 것
- 프로젝트 뼈대 생성 (React + Workers + wrangler 설정)
- D1 스키마 초안 (Plan / Day / Item / VisitRecord — 스펙 4장 참고)
- 홈 화면부터 데모 룩앤필로 구현 시작

먼저 1번(구조·마일스톤 제안)부터 얘기해줘.

---

## 참고: 개발 착수 전 준비물 체크리스트

- [ ] Cloudflare 계정 생성 (무료)
- [ ] `wrangler` CLI 설치 (`npm install -g wrangler`)
- [ ] Node.js 설치 확인
- [ ] 카카오 개발자 계정 + 앱 생성 → 카카오맵 API 활성화 → REST API 키 발급
      (2026년 7월부터 심사 없이 활성화만 하면 바로 사용)
- [ ] 위 두 파일(`뚜버기_스펙.md`, `ttubeogi.jsx`) 준비

> 카카오 키는 나중에 검색 붙일 때 필요. 없어도 홈·구조·DB부터 시작 가능.
