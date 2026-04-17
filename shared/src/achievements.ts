/**
 * Achievement definitions shared between client and server.
 *
 * Design:
 * - Each achievement has stable, descriptive metadata the client can
 *   render directly (name, description, category, rarity).
 * - An achievement is unlocked when its `check(stats, event?)` returns
 *   true. Cumulative achievements read from the running stats; event
 *   achievements inspect the event payload.
 * - IDs are permanent. When shipping on Steam the Steam achievement
 *   API IDs will map 1:1 to these strings.
 */

export type AchievementCategory =
  | "singleplayer"
  | "multiplayer"
  | "battle-royale"
  | "general";

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

/**
 * Incremental counters stored on the server per user. Cumulative
 * achievements read from this shape to decide when to unlock.
 */
export interface AchievementStats {
  raceAttempts: number;
  raceCompletions: number;
  raceBestTimeMs: number | null;
  multiplayerWins: number;
  multiplayerLosses: number;
  multiplayerDraws: number;
  brMatches: number;
  brWins: number;
  brTopThree: number;
  asteroidsDestroyed: number;
  bulletsFired: number;
  heartsCollected: number;
  ammoCollected: number;
  goalsCleared: number;
  opponentsEliminated: number;
}

/**
 * Events emitted by gameplay code that the achievement engine
 * evaluates. Some also feed stat counters (handled elsewhere).
 */
export type AchievementEvent =
  | { type: "race.completed"; durationMs: number; noDamage: boolean }
  | { type: "race.attempted" }
  | { type: "mp.matchEnded"; outcome: "win" | "loss" | "draw" }
  | { type: "mp.opponentDestroyed" }
  | { type: "br.matchEnded"; placement: number; survivors: number; won: boolean }
  | { type: "br.opponentEliminated" }
  | { type: "asteroid.destroyed" }
  | { type: "heart.collected" }
  | { type: "ammo.collected" }
  | { type: "bullet.fired"; count: number }
  | { type: "goal.reached" };

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  hidden?: boolean;
  /** For cumulative achievements, the target number and the stat key. */
  progress?: {
    statKey: keyof AchievementStats;
    target: number;
  };
  /**
   * Returns true to unlock. Receives the post-event stats and (for
   * event-driven achievements) the event that just fired. Stats are
   * authoritative — don't double-count using the event if the stat is
   * already incremented.
   */
  check: (stats: AchievementStats, event?: AchievementEvent) => boolean;
}

// Placeholder definitions — we'll flesh out the full 15-20 list in a
// follow-up commit. Keeping three examples here so the engine has
// something to iterate on.
export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  {
    id: "first-race",
    name: "First Flight",
    description: "Complete your first singleplayer race.",
    category: "singleplayer",
    rarity: "common",
    check: (stats) => stats.raceCompletions >= 1,
  },
  {
    id: "first-multiplayer-win",
    name: "First Blood",
    description: "Win your first multiplayer duel.",
    category: "multiplayer",
    rarity: "common",
    check: (stats) => stats.multiplayerWins >= 1,
  },
  {
    id: "first-battle-royale-win",
    name: "Last Ship Standing",
    description: "Win a Battle Royale match.",
    category: "battle-royale",
    rarity: "rare",
    check: (stats) => stats.brWins >= 1,
  },
] as const;

export const getAchievementById = (
  id: string
): AchievementDefinition | undefined => {
  return ACHIEVEMENT_DEFINITIONS.find((definition) => definition.id === id);
};

/**
 * Lightweight public view of an achievement — strips the check
 * function so it's JSON-serializable and safe to send to clients.
 */
export interface PublicAchievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  hidden: boolean;
  progress: {
    statKey: keyof AchievementStats;
    target: number;
  } | null;
}

export const toPublicAchievement = (
  definition: AchievementDefinition
): PublicAchievement => {
  return {
    id: definition.id,
    name: definition.name,
    description: definition.description,
    category: definition.category,
    rarity: definition.rarity,
    hidden: definition.hidden ?? false,
    progress: definition.progress ?? null,
  };
};
