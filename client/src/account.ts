// Client-side account state.
//
// The game creates an anonymous server account on first load, keyed
// by a stable device token stored in localStorage. Bootstrap fetches
// the user's current stats + achievement unlocks; after that the app
// listens for new unlocks pushed over socket.io.

import type { PublicAchievement } from "../../shared/src";

const DEVICE_TOKEN_STORAGE_KEY = "simple-asteroid-game-device-token";

export interface AccountStats {
  runAttempts: number;
  runCompletions: number;
  runBestTimeMs: number | null;
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

export interface AccountAchievement extends PublicAchievement {
  unlockedAt: string | null;
  progressValue: number;
}

export interface AccountUser {
  id: string;
  displayName: string;
  hasEmail: boolean;
  createdAt: string;
}

export interface AccountState {
  status: "loading" | "ready" | "offline";
  user: AccountUser | null;
  stats: AccountStats | null;
  achievements: AccountAchievement[];
  recentUnlocks: AccountAchievement[];
}

type AccountListener = (state: AccountState) => void;

const emptyStats = (): AccountStats => ({
  runAttempts: 0,
  runCompletions: 0,
  runBestTimeMs: null,
  multiplayerWins: 0,
  multiplayerLosses: 0,
  multiplayerDraws: 0,
  brMatches: 0,
  brWins: 0,
  brTopThree: 0,
  asteroidsDestroyed: 0,
  bulletsFired: 0,
  heartsCollected: 0,
  ammoCollected: 0,
  goalsCleared: 0,
  opponentsEliminated: 0,
});

let deviceToken: string | null = null;

export const getOrCreateDeviceToken = (): string => {
  if (deviceToken !== null) return deviceToken;
  try {
    const stored = window.localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
    if (stored !== null && stored.length > 0) {
      deviceToken = stored;
      return stored;
    }
  } catch (_error) {
    /* storage unavailable; fall through to generate a session token */
  }

  const generated = generateDeviceToken();
  try {
    window.localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, generated);
  } catch (_error) {
    /* ignore — token is still usable in memory for this session */
  }
  deviceToken = generated;
  return generated;
};

const generateDeviceToken = (): string => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

let state: AccountState = {
  status: "loading",
  user: null,
  stats: null,
  achievements: [],
  recentUnlocks: [],
};
const listeners = new Set<AccountListener>();

export const getAccountState = (): AccountState => state;

export const subscribeToAccount = (listener: AccountListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const commit = (next: AccountState) => {
  state = next;
  for (const listener of listeners) {
    listener(next);
  }
};

export const setAccountBootstrap = (payload: {
  user: AccountUser;
  stats: AccountStats;
  achievements: AccountAchievement[];
}) => {
  commit({
    status: "ready",
    user: payload.user,
    stats: payload.stats,
    achievements: payload.achievements,
    recentUnlocks: state.recentUnlocks,
  });
};

export const setAccountOffline = () => {
  commit({
    status: "offline",
    user: null,
    stats: emptyStats(),
    achievements: [],
    recentUnlocks: [],
  });
};

export const applyLocalStatDelta = (delta: Partial<AccountStats>) => {
  if (state.stats === null) return;
  const nextStats: AccountStats = { ...state.stats };
  for (const [key, value] of Object.entries(delta) as Array<
    [keyof AccountStats, number | null | undefined]
  >) {
    if (typeof value !== "number") continue;
    if (key === "runBestTimeMs") {
      const current = nextStats.runBestTimeMs;
      if (current === null || value < current) {
        nextStats.runBestTimeMs = value;
      }
      continue;
    }
    const current = nextStats[key];
    if (typeof current === "number") {
      (nextStats[key] as number) = current + value;
    }
  }
  commit({ ...state, stats: nextStats });
};

/**
 * Record a freshly-unlocked achievement. Appends to recentUnlocks
 * (so the toast layer can drain them) and flips the achievement's
 * unlockedAt so the list/menu UI updates immediately.
 */
export const recordLocalUnlock = (achievementId: string, unlockedAt: Date) => {
  const isoTime = unlockedAt.toISOString();
  const achievements = state.achievements.map((entry) => {
    if (entry.id !== achievementId) return entry;
    if (entry.unlockedAt !== null) return entry;
    return { ...entry, unlockedAt: isoTime };
  });
  const just = achievements.find((entry) => entry.id === achievementId);
  const recentUnlocks =
    just !== undefined ? [...state.recentUnlocks, just].slice(-8) : state.recentUnlocks;
  commit({ ...state, achievements, recentUnlocks });
};

export const consumeOldestRecentUnlock = (): AccountAchievement | null => {
  if (state.recentUnlocks.length === 0) return null;
  const [oldest, ...rest] = state.recentUnlocks;
  commit({ ...state, recentUnlocks: rest });
  return oldest;
};
