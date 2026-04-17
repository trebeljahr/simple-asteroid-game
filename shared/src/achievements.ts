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

/**
 * The ship has been tested against all three modes.
 */
const hasPlayedAllModes = (stats: AchievementStats): boolean => {
  const playedMultiplayer =
    stats.multiplayerWins +
      stats.multiplayerLosses +
      stats.multiplayerDraws >=
    1;
  return (
    stats.raceAttempts >= 1 && playedMultiplayer && stats.brMatches >= 1
  );
};

export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  // --- Singleplayer ---
  {
    id: "first-course",
    name: "First Flight",
    description: "Complete your first singleplayer course.",
    category: "singleplayer",
    rarity: "common",
    check: (stats) => stats.raceCompletions >= 1,
  },
  {
    id: "course-sub-60",
    name: "Speed Runner",
    description: "Finish a course in under 60 seconds.",
    category: "singleplayer",
    rarity: "rare",
    check: (_stats, event) =>
      event?.type === "race.completed" && event.durationMs < 60_000,
  },
  {
    id: "course-sub-40",
    name: "Blitz Pilot",
    description: "Finish a course in under 40 seconds.",
    category: "singleplayer",
    rarity: "epic",
    check: (_stats, event) =>
      event?.type === "race.completed" && event.durationMs < 40_000,
  },
  {
    id: "course-no-damage",
    name: "Untouchable",
    description: "Complete a course without taking a single hit.",
    category: "singleplayer",
    rarity: "epic",
    hidden: true,
    check: (_stats, event) =>
      event?.type === "race.completed" && event.noDamage === true,
  },
  {
    id: "course-completions-10",
    name: "Dedicated Pilot",
    description: "Complete 10 singleplayer courses.",
    category: "singleplayer",
    rarity: "common",
    progress: { statKey: "raceCompletions", target: 10 },
    check: (stats) => stats.raceCompletions >= 10,
  },
  {
    id: "course-completions-50",
    name: "Veteran Pilot",
    description: "Complete 50 singleplayer courses.",
    category: "singleplayer",
    rarity: "rare",
    progress: { statKey: "raceCompletions", target: 50 },
    check: (stats) => stats.raceCompletions >= 50,
  },
  {
    id: "goals-cleared-100",
    name: "Waypoint Hunter",
    description: "Clear 100 route waypoints across all courses.",
    category: "singleplayer",
    rarity: "common",
    progress: { statKey: "goalsCleared", target: 100 },
    check: (stats) => stats.goalsCleared >= 100,
  },

  // --- Multiplayer duel ---
  {
    id: "first-multiplayer-win",
    name: "First Blood",
    description: "Win your first multiplayer duel.",
    category: "multiplayer",
    rarity: "common",
    check: (stats) => stats.multiplayerWins >= 1,
  },
  {
    id: "multiplayer-wins-10",
    name: "Duelist",
    description: "Win 10 multiplayer duels.",
    category: "multiplayer",
    rarity: "rare",
    progress: { statKey: "multiplayerWins", target: 10 },
    check: (stats) => stats.multiplayerWins >= 10,
  },
  {
    id: "multiplayer-wins-50",
    name: "Gladiator",
    description: "Win 50 multiplayer duels.",
    category: "multiplayer",
    rarity: "epic",
    progress: { statKey: "multiplayerWins", target: 50 },
    check: (stats) => stats.multiplayerWins >= 50,
  },

  // --- Battle royale ---
  {
    id: "first-br-match",
    name: "Drop In",
    description: "Join your first Battle Royale match.",
    category: "battle-royale",
    rarity: "common",
    check: (stats) => stats.brMatches >= 1,
  },
  {
    id: "br-top-three",
    name: "Podium Finish",
    description: "Finish in the top 3 of a Battle Royale match.",
    category: "battle-royale",
    rarity: "rare",
    check: (stats) => stats.brTopThree >= 1,
  },
  {
    id: "first-br-win",
    name: "Last Ship Standing",
    description: "Win a Battle Royale match.",
    category: "battle-royale",
    rarity: "epic",
    check: (stats) => stats.brWins >= 1,
  },
  {
    id: "br-wins-5",
    name: "Royale Champion",
    description: "Win 5 Battle Royale matches.",
    category: "battle-royale",
    rarity: "legendary",
    progress: { statKey: "brWins", target: 5 },
    check: (stats) => stats.brWins >= 5,
  },

  // --- General / cross-mode ---
  {
    id: "asteroids-100",
    name: "Asteroid Buster",
    description: "Destroy 100 asteroids with gunfire.",
    category: "general",
    rarity: "common",
    progress: { statKey: "asteroidsDestroyed", target: 100 },
    check: (stats) => stats.asteroidsDestroyed >= 100,
  },
  {
    id: "asteroids-1000",
    name: "Starfield Sweeper",
    description: "Destroy 1,000 asteroids with gunfire.",
    category: "general",
    rarity: "epic",
    progress: { statKey: "asteroidsDestroyed", target: 1000 },
    check: (stats) => stats.asteroidsDestroyed >= 1000,
  },
  {
    id: "bullets-fired-1000",
    name: "Trigger Happy",
    description: "Fire 1,000 bullets.",
    category: "general",
    rarity: "common",
    progress: { statKey: "bulletsFired", target: 1000 },
    check: (stats) => stats.bulletsFired >= 1000,
  },
  {
    id: "hearts-collected-25",
    name: "Field Medic",
    description: "Collect 25 health pickups.",
    category: "general",
    rarity: "common",
    progress: { statKey: "heartsCollected", target: 25 },
    check: (stats) => stats.heartsCollected >= 25,
  },
  {
    id: "opponents-eliminated-25",
    name: "Bounty Hunter",
    description: "Eliminate 25 opposing ships across multiplayer modes.",
    category: "general",
    rarity: "rare",
    progress: { statKey: "opponentsEliminated", target: 25 },
    check: (stats) => stats.opponentsEliminated >= 25,
  },
  {
    id: "try-all-modes",
    name: "Explorer",
    description:
      "Play at least once in singleplayer, multiplayer, and battle royale.",
    category: "general",
    rarity: "rare",
    check: hasPlayedAllModes,
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
