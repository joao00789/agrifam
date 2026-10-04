import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
    setupFiles: ["./src/tests/setup.ts"],
    env: {
      DATABASE_URL: "pglite:memory",
      JWT_SECRET: "segredo-de-teste-longo-e-nao-usar-em-producao-0001",
      CORS_ORIGIN: "http://localhost:5173",
    },
  },
});
