import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://asteroids:asteroids_dev_password@127.0.0.1:5432/asteroids",
  },
} satisfies Config;
