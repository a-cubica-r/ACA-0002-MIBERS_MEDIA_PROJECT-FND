import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [tailwindcss(), !process.env.VITEST && reactRouter()],
    resolve: { tsconfigPaths: true },
    server: {
      port: 5173,
      // En desarrollo el SPA llama a /api y Vite lo reenvia al backend: sin CORS.
      proxy: {
        "/api": { target: env.API_PROXY_TARGET || "http://localhost:8000", changeOrigin: true },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./vitest.setup.ts"],
      include: ["app/**/*.test.{ts,tsx}"],
    },
  };
});
