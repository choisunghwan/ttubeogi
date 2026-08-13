import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

// cloudflare() 플러그인이 wrangler.jsonc를 읽어서
// `npm run dev` 하나로 React(Vite) + Worker(workerd 에뮬레이션) + D1 + Durable Object를 함께 띄운다.
export default defineConfig({
  plugins: [react(), cloudflare()],
});
