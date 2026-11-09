import { serve } from "bun";
import index from "./index.html";
import { createApi } from "./server/api";
import { createSecClient } from "./server/sec/client";

const api = createApi(createSecClient(process.env.SEC_USER_AGENT ?? ""));

serve({
  routes: {
    "/": index,
  },
  fetch: (request) => api.handle(request),
});
