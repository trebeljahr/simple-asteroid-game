// Persistent per-device play statistics.
//
// Stores things like singleplayer best run time and multiplayer
// win/loss record in localStorage, keyed under a single JSON blob so
// future fields can be added without new keys.

const STATS_STORAGE_KEY = "simple-asteroid-game-stats";

export interface PersistentStats {
  runBestTimeMs: number | null;
  runCompletionCount: number;
  runAttemptCount: number;
  multiplayerWins: number;
  multiplayerLosses: number;
  multiplayerDraws: number;
}

const createEmptyStats = (): PersistentStats => ({
  runBestTimeMs: null,
  runCompletionCount: 0,
  runAttemptCount: 0,
  multiplayerWins: 0,
  multiplayerLosses: 0,
  multiplayerDraws: 0,
});

const readStats = (): PersistentStats => {
  try {
    const raw = window.localStorage.getItem(STATS_STORAGE_KEY);
    if (raw === null) {
      return createEmptyStats();
    }
    const parsed = JSON.parse(raw) as Partial<PersistentStats>;
    return {
      ...createEmptyStats(),
      ...parsed,
    };
  } catch (_error) {
    return createEmptyStats();
  }
};

const writeStats = (stats: PersistentStats) => {
  try {
    window.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (_error) {
    // Ignore storage failures.
  }
};

let cachedStats: PersistentStats | null = null;
const listeners = new Set<(stats: PersistentStats) => void>();

const getCachedStats = (): PersistentStats => {
  if (cachedStats === null) {
    cachedStats = readStats();
  }
  return cachedStats;
};

const commitStats = (next: PersistentStats) => {
  cachedStats = next;
  writeStats(next);
  for (const listener of listeners) {
    listener(next);
  }
};

export const getStats = (): PersistentStats => {
  return { ...getCachedStats() };
};

export const subscribeToStats = (
  listener: (stats: PersistentStats) => void
) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export interface RunCompletionResult {
  previousBestMs: number | null;
  newBestMs: number;
  isNewRecord: boolean;
}

export const recordRunAttempt = () => {
  const current = getCachedStats();
  commitStats({
    ...current,
    runAttemptCount: current.runAttemptCount + 1,
  });
};

export const recordRunCompletion = (
  durationMs: number
): RunCompletionResult => {
  const current = getCachedStats();
  const previousBestMs = current.runBestTimeMs;
  const isNewRecord =
    previousBestMs === null || durationMs < previousBestMs;
  const newBestMs = isNewRecord ? durationMs : previousBestMs!;

  commitStats({
    ...current,
    runBestTimeMs: newBestMs,
    runCompletionCount: current.runCompletionCount + 1,
  });

  return {
    previousBestMs,
    newBestMs,
    isNewRecord,
  };
};

export type MultiplayerResultOutcome = "win" | "loss" | "draw";

export const recordMultiplayerResult = (outcome: MultiplayerResultOutcome) => {
  const current = getCachedStats();
  commitStats({
    ...current,
    multiplayerWins:
      outcome === "win" ? current.multiplayerWins + 1 : current.multiplayerWins,
    multiplayerLosses:
      outcome === "loss"
        ? current.multiplayerLosses + 1
        : current.multiplayerLosses,
    multiplayerDraws:
      outcome === "draw"
        ? current.multiplayerDraws + 1
        : current.multiplayerDraws,
  });
};

export const resetStats = () => {
  commitStats(createEmptyStats());
};
