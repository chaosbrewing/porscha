import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup-env.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Tests exercise server modules directly; the server-only guard
      // only matters inside the Next.js bundler.
      "server-only": path.resolve(__dirname, "src/test/server-only-stub.ts"),
    },
  },
});
