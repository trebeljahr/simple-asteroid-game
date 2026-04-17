import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

import type { AppRouter } from "../../server/src/trpc/router";
import { getOrCreateDeviceToken } from "./account";

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${window.location.origin}/trpc`,
      headers: () => {
        return {
          "x-device-token": getOrCreateDeviceToken(),
        };
      },
    }),
  ],
});
