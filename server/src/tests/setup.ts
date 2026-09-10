import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "../db/client.js";

// Cada arquivo de teste do Vitest tem seu próprio grafo de módulos, então
// `db/client.ts` cria uma conexão nova (`DATABASE_URL=":memory:"`, ver vitest.config.ts)
// e este setup aplica as migrações reais antes da suíte rodar.
await migrate(db, { migrationsFolder: "./src/db/migrations" });
