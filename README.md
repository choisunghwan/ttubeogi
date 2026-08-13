# 🐣 뚜버기 (Ttubeogi)

여러 명이 **링크 하나로 같이 만드는** 실시간 협업 일정 앱. 여행·데이트·약속 — 로그인 없이 이름만 입력하고 바로 참여해서 일정을 같이 짤 수 있다.

## 👉 지금 써보기

**https://ttubeogi.ttubeogi.workers.dev**

## 어떤 앱인가

- **실시간 공동 편집** — 한 명이 항목을 추가/수정/삭제하거나 새로 참여하면, 같은 일정을 보고 있는 다른 사람 화면에 새로고침 없이 즉시 반영된다.
- **로그인 없이 참여** — 공유 링크를 열고 이름만 입력하면 바로 같이 만들 수 있다. 원하면 카카오 로그인으로 기기를 바꿔도 내 일정이 계속 보이게 할 수도 있다(선택).
- **좌표 자동 검색** — 장소 이름만 입력하면 국내는 카카오맵, 해외는 Nominatim(OSM)으로 좌표를 자동으로 찾아준다.
- **실제 도로를 따라가는 지도** — Leaflet + OSRM으로 항목 사이 실제 도로 경로를 그리고, 뚜버기 캐릭터가 그 경로를 따라 걸어다닌다.
- **드래그로 순서 변경 + 시간순 자동 정렬**
- **나의 지도** — 다녀온(완료된) 일정들이 지역별 발자국으로 쌓인다.

## 기술 스택

| 역할 | 기술 |
|---|---|
| 프론트엔드 | React + Vite |
| 백엔드 | Cloudflare Workers (Hono) |
| DB | Cloudflare D1 (SQLite) |
| 실시간 동기화 | Cloudflare Durable Objects + WebSocket |
| 지도 | Leaflet + CARTO 타일 + OSRM(도로 경로) |
| 장소 검색 | 카카오맵 로컬 API(국내) / Nominatim(해외) |
| 로그인(선택) | 카카오 로그인 (서버사이드 OAuth, HMAC 서명 쿠키 세션) |

## 로컬 개발

```bash
npm install
cp .dev.vars.example .dev.vars   # 카카오 키·세션 시크릿 채워넣기 (없어도 게스트 기능은 다 됨)
npx wrangler d1 migrations apply ttubeogi-db --local
npm run dev
```

`http://localhost:5173` 에서 확인.

## 배포

```bash
npx wrangler login
npx wrangler d1 create ttubeogi-db   # wrangler.jsonc의 database_id 교체
npx wrangler d1 migrations apply ttubeogi-db --remote
npx wrangler secret put KAKAO_REST_API_KEY
npx wrangler secret put SESSION_SECRET
npm run deploy
```
