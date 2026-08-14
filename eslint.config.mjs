import { defineConfig } from "eslint/config";
import nextConfig from "eslint-config-next";

export default defineConfig([
  {
    ignores: [".next/**", "node_modules/**", "drizzle/**"],
  },
  ...nextConfig,
]);
