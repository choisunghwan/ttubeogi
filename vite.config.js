import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

// cloudflare() 플러그인이 wrangler.jsonc를 읽어서
// `npm run dev` 하나로 React(Vite) + Worker(workerd 에뮬레이션) + D1 + Durable Object를 함께 띄운다.
export default defineConfig({
  plugins: [
    react(),
    cloudflare(),
    // 이 앱의 핵심 목적이 "와이파이/데이터 없이도 내 여행 정보를 볼 수 있게"인데, 지금까지는
    // manifest.json(설치 아이콘)만 있고 실제 오프라인 캐싱은 없었다 — 서비스 워커로 앱 셸(정적
    // 파일)과 한 번 본 일정 데이터를 캐싱해서 네트워크가 끊겨도 마지막으로 본 내용이 보이게 함.
    VitePWA({
      registerType: "autoUpdate", // 새로 배포하면 사용자가 별도 확인 없이 다음 방문 때 자동으로 최신 버전으로 갱신
      manifest: false, // public/manifest.json을 이미 쓰고 있어서 플러그인이 따로 안 만들게 함
      injectRegister: "auto",
      // 개발 서버(npm run dev)에서도 서비스 워커가 등록되게 — 오프라인 캐싱을 매번 배포해서
      // 확인할 필요 없이 로컬에서 바로 검증할 수 있게 하려고.
      devOptions: { enabled: true, type: "module" },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          // 일정 목록/상세 조회 — 네트워크가 되면 항상 최신 데이터를 우선 쓰고(실시간 협업 앱이라
          // 캐시를 그대로 믿으면 안 됨), 오프라인일 때만 마지막으로 성공한 응답으로 대체.
          {
            urlPattern: ({ url }) => /^\/api\/plans(\/[^/]+)?$/.test(url.pathname),
            method: "GET",
            handler: "NetworkFirst",
            options: {
              cacheName: "plan-data",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // 항공권/바우처 첨부 이미지 — 한 번 본 사진은 오프라인에서도 바로 보이게.
          {
            urlPattern: ({ url }) => /^\/api\/plans\/[^/]+\/items\/[^/]+\/attachment$/.test(url.pathname),
            method: "GET",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "plan-attachments",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
