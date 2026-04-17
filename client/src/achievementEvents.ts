// Client-side achievement event dispatch.
//
// The server is authoritative for multiplayer/BR achievements
// (dispatched directly from the match services). Singleplayer events
// (run attempts/completions, asteroid destructions, pickups) are
// reported here through tRPC; the server applies the stat deltas and
// returns any newly-unlocked achievements so the toast layer can show
// them immediately.

import { trpcClient } from "./trpcClient";
import {
  applyLocalStatDelta,
  getAccountState,
  recordLocalUnlock,
  type AccountStats,
} from "./account";

type ClientAchievementEvent =
  | { type: "run.attempted" }
  | { type: "run.completed"; durationMs: number; noDamage: boolean }
  | { type: "run.goalReached" }
  | { type: "asteroid.destroyed" }
  | { type: "heart.collected" }
  | { type: "ammo.collected" }
  | { type: "bullet.fired"; count: number };

// Small queue + microtask flush so many high-frequency events in the
// same tick (asteroid destroyed, bullet fired, heart collected) can
// coalesce into one batch tRPC call instead of flooding the server.
const pendingEvents: ClientAchievementEvent[] = [];
let flushScheduled = false;

const scheduleFlush = () => {
  if (flushScheduled) return;
  flushScheduled = true;
  // Use setTimeout with 0 rather than queueMicrotask so we batch
  // everything in the current frame cleanly.
  setTimeout(() => {
    flushScheduled = false;
    const toSend = pendingEvents.splice(0, pendingEvents.length);
    for (const event of toSend) {
      void sendEvent(event);
    }
  }, 0);
};

const applyOptimisticDelta = (event: ClientAchievementEvent) => {
  const delta: Partial<AccountStats> = {};
  switch (event.type) {
    case "run.attempted":
      delta.runAttempts = 1;
      break;
    case "run.completed":
      delta.runCompletions = 1;
      delta.runBestTimeMs = event.durationMs;
      break;
    case "run.goalReached":
      delta.goalsCleared = 1;
      break;
    case "asteroid.destroyed":
      delta.asteroidsDestroyed = 1;
      break;
    case "heart.collected":
      delta.heartsCollected = 1;
      break;
    case "ammo.collected":
      delta.ammoCollected = 1;
      break;
    case "bullet.fired":
      delta.bulletsFired = event.count;
      break;
  }
  applyLocalStatDelta(delta);
};

const sendEvent = async (event: ClientAchievementEvent) => {
  if (getAccountState().status === "offline") {
    // Nothing to sync with — stats stay local-only.
    return;
  }
  try {
    const result = await trpcClient.achievements.reportClientEvent.mutate(
      event
    );
    if (result.unlocked.length === 0) return;
    const now = new Date();
    for (const id of result.unlocked) {
      recordLocalUnlock(id, now);
    }
  } catch (_error) {
    // Swallow — the socket push will still deliver any missed
    // unlocks on the next reconcile, and offline stats live locally.
  }
};

export const reportAchievementEvent = (event: ClientAchievementEvent) => {
  applyOptimisticDelta(event);
  pendingEvents.push(event);
  scheduleFlush();
};
