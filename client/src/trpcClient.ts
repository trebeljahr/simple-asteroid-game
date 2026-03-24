import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

import type { AppRouter } from "../../server/src/trpc/router";

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${window.location.origin}/trpc`,
    }),
  ],
});
