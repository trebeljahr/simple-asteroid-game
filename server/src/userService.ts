import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";

import { getDatabase, type User, type UserStats, userAchievements, userStats, users } from "./db";

export interface UserContext {
  user: User;
  stats: UserStats;
  unlockedAchievementIds: string[];
}

/**
 * Generate a display name for a fresh account. Short, unique-ish,
 * human-friendly, and easy to change later.
 */
const generateDisplayName = () => {
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `Pilot ${suffix}`;
};

/**
 * Look up the user by device token, creating the account + empty
 * stats row if this is a first-time visitor. Returns the current
 * user context (user row, stat counters, list of unlocked
 * achievements).
 *
 * Throws if the database is unavailable — callers should decide how
 * to degrade (bootstrap endpoint returns null, game code skips stat
 * writes).
 */
export const getOrCreateUserByDeviceToken = async (deviceToken: string): Promise<UserContext> => {
  const db = getDatabase();
  if (db === null) {
    throw new Error("Database unavailable");
  }

  const existingRows = await db
    .select()
    .from(users)
    .where(eq(users.deviceToken, deviceToken))
    .limit(1);
  let user: User;
  if (existingRows.length === 0) {
    const inserted = await db
      .insert(users)
      .values({
        deviceToken,
        displayName: generateDisplayName(),
      })
      .returning();
    user = inserted[0];
    await db.insert(userStats).values({ userId: user.id });
  } else {
    user = existingRows[0];
  }

  // Touch last_seen_at in the background — no need to await.
  void db
    .update(users)
    .set({ lastSeenAt: new Date() })
    .where(eq(users.id, user.id))
    .catch(() => {
      /* best effort */
    });

  const [statsRow, achievementRows] = await Promise.all([
    db.select().from(userStats).where(eq(userStats.userId, user.id)).limit(1),
    db.select().from(userAchievements).where(eq(userAchievements.userId, user.id)),
  ]);

  let stats: UserStats;
  if (statsRow.length === 0) {
    const inserted = await db.insert(userStats).values({ userId: user.id }).returning();
    stats = inserted[0];
  } else {
    stats = statsRow[0];
  }

  return {
    user,
    stats,
    unlockedAchievementIds: achievementRows.map((row) => row.achievementId),
  };
};

export const updateDisplayName = async (userId: string, displayName: string) => {
  const db = getDatabase();
  if (db === null) return;
  const trimmed = displayName.trim();
  if (trimmed.length === 0 || trimmed.length > 32) {
    throw new Error("Display name must be 1-32 characters");
  }
  await db.update(users).set({ displayName: trimmed }).where(eq(users.id, userId));
};
