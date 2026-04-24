import { existsSync } from "fs";
import path from "path";
/**
 * Standalone migration runner. Invoked via `npm run db:migrate`
 * manually or by the server at startup before accepting connections.
 *
 * Migrations live alongside the source at `src/db/migrations` during
 * development. The build pipeline copies them into `dist/db/migrations`
 * so the compiled server can find them too.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

export const runMigrations = async (connectionString?: string) => {
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL must be set to run migrations. Aborting migration run.");
  }

  const pool = new Pool({ connectionString: url, max: 2 });
  const db = drizzle(pool);
  const migrationsFolder = resolveMigrationsFolder();

  console.log(`[db] Running migrations from ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.log("[db] Migrations complete");
  await pool.end();
};

const resolveMigrationsFolder = () => {
  // When running via tsx from src, __dirname is server/src/db.
  // When running the compiled JS from dist, it's dist/server/src/db
  // (because rootDir=".." in tsconfig) — same relative "migrations"
  // folder either way, provided the build pipeline copies it.
  const adjacent = path.join(__dirname, "migrations");
  if (existsSync(adjacent)) {
    return adjacent;
  }
  // Fallback for misconfigured environments — fall back to src.
  const sourceFallback = path.resolve(__dirname, "..", "..", "src", "db", "migrations");
  return sourceFallback;
};

const isDirectInvocation = () => {
  try {
    return require.main === module;
  } catch (_error) {
    return false;
  }
};

if (isDirectInvocation()) {
  runMigrations().catch((error) => {
    console.error("[db] Migration failed:", error);
    process.exit(1);
  });
}
