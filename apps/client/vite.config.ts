import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => ({
  plugins: [TanStackRouterVite({ routesDirectory: "./src/routes", generatedRouteTree: "./src/routes/routeTree.gen.ts", autoCodeSplitting: true, routeFileIgnorePattern: "routeTree.gen.ts" }), react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
    ],
  },
  define: { __DEV__: JSON.stringify(mode !== "production") },
  base: "/",
  build: { outDir: "../../dist", emptyOutDir: true },
  server: {
    strictPort: true,
    port: 8081,
    proxy: {
      "/api": {
        target: process.env.AIJEE_API_ORIGIN ?? "http://127.0.0.1:10088",
        changeOrigin: true,
        ws: true,
      },
    },
  },
}));
