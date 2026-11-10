import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup-env.ts"],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
