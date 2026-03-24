import { initTRPC } from "@trpc/server";
import { z } from "zod";

import { MultiplayerRuntimeConfig } from "../../../shared/src";

const t = initTRPC.create();

interface MultiplayerController {
  enqueueSocketById(socketId: string):
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
          })
        )
        .mutation(({ input }) => {
          return multiplayerService.enqueueSocketById(input.socketId);
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
