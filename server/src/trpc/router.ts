import { initTRPC } from "@trpc/server";
import { z } from "zod";

import { MultiplayerRuntimeConfig, ShipVariant, MULTIPLAYER_SHIP_VARIANTS } from "../../../shared/src";

const t = initTRPC.create();

interface MultiplayerController {
  enqueueSocketById(socketId: string, shipVariant: ShipVariant):
    | { enqueued: false; reason: "already-matched" | "socket-not-found" }
    | { enqueued: true };
  getRuntimeConfig(): MultiplayerRuntimeConfig;
  leaveSocketById(socketId: string):
    | { removed: false; scope: "none" }
    | { removed: true; scope: "match" | "queue" };
}

interface BattleRoyaleController {
  enqueue(socketId: string, shipVariant: ShipVariant):
    | { enqueued: false; reason: "already-in-match" | "socket-not-found" | "lobby-full" }
    | { enqueued: true };
  leave(socketId: string):
    | { removed: false; scope: "none" }
    | { removed: true; scope: "lobby" | "match" };
}

export const createAppRouter = (
  multiplayerService: MultiplayerController,
  battleRoyaleService: BattleRoyaleController
) => {
  return t.router({
    health: t.procedure.query(() => {
      return { ok: true };
    }),
    multiplayer: t.router({
      joinQueue: t.procedure
        .input(
          z.object({
            socketId: z.string().min(1),
            shipVariant: z.enum(MULTIPLAYER_SHIP_VARIANTS as unknown as [string, ...string[]]),
          })
        )
        .mutation(({ input }) => {
          return multiplayerService.enqueueSocketById(input.socketId, input.shipVariant as ShipVariant);
        }),
      leaveQueue: t.procedure
        .input(
          z.object({
            socketId: z.string().min(1),
          })
        )
        .mutation(({ input }) => {
          return multiplayerService.leaveSocketById(input.socketId);
        }),
      runtime: t.procedure.query(() => {
        return multiplayerService.getRuntimeConfig();
      }),
    }),
    battleRoyale: t.router({
      joinQueue: t.procedure
        .input(
          z.object({
            socketId: z.string().min(1),
            shipVariant: z.enum(
              MULTIPLAYER_SHIP_VARIANTS as unknown as [string, ...string[]]
            ),
          })
        )
        .mutation(({ input }) => {
          return battleRoyaleService.enqueue(
            input.socketId,
            input.shipVariant as ShipVariant
          );
        }),
      leaveQueue: t.procedure
        .input(
          z.object({
            socketId: z.string().min(1),
          })
        )
        .mutation(({ input }) => {
          return battleRoyaleService.leave(input.socketId);
        }),
    }),
  });
};

export type AppRouter = ReturnType<typeof createAppRouter>;
