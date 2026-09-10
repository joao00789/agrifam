import "dotenv/config";
import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./client.js";

await migrate(db, { migrationsFolder: "./src/db/migrations" });
console.log("Migrações aplicadas com sucesso.");
