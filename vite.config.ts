import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { nitro } from "nitro/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";

import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  plugins: [
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    nitro({ preset: "bun" }),
    tanstackStart(),
    viteReact(),
  ],
  build: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      external: ["bun"],
    },
  },
  server: {
    allowedHosts: true,
  },
});

export default config;
