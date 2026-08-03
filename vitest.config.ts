import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    env: {
      VITE_AIS_AUTH: "true",
      VITE_WORKSPACE_ID: "1",
    },
    coverage: {
      provider: "v8",
      exclude: [
        "node_modules",
        "dist",
        ".tanstack",
        "src/components/ui/**/*.tsx",
      ],
      include: ["src/**/*.{ts,tsx}"],
    },
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
