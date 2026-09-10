import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
    setupFiles: ["./src/tests/setup.ts"],
    env: {
      DATABASE_URL: ":memory:",
      JWT_SECRET: "test-secret-nao-usar-em-producao",
      CORS_ORIGIN: "http://localhost:5173",
    },
  },
});
