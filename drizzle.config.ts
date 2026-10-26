import { defineConfig } from "drizzle-kit";

// Offline migration generation only. No live DB needed:
// `npm run db:generate` reads src/db/schema.ts and writes drizzle/.
// HUMAN: point `dbCredentials` at Supabase/Postgres when you want a live DB.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
