import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/server/schema.ts",
  out: "./drizzle",
  dbCredentials:{ url: process.env.VITE_DATABASE_URL! }

})