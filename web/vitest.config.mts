import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: false,
    restoreMocks: true,
    clearMocks: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});

