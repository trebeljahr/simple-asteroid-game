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

export const createAppRouter = (multiplayerService: MultiplayerController) => {
  return t.router({
    health: t.procedure.query(() => {
      return { ok: true };
    }),
    multiplayer: t.router({
      joinQueue: t.procedure
        .input(
          z.object({
            socketId: z.string().min(1),
            shipVariant: z.enum(MULTIPLAYER_SHIP_VARIANTS as [string, ...string[]]),
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
  });
};

export type AppRouter = ReturnType<typeof createAppRouter>;
