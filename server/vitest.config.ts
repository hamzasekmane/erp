import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    environment: "node",
    // `lib/` holds the framework-agnostic algorithm library (Phase 3). Its
    // tests live beside the code rather than being copied under src/.
    include: ["src/**/*.test.ts", "lib/**/*.test.ts"],
    setupFiles: ["src/test/setup-env.ts"],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
