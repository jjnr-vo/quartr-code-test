import { appError } from "@/server/errors";
import { throwInvalidPayload } from "@/server/utils";

/**
 * Fetch strategy to perform 3 attempts on failed calls with a delay
 * @param url - url to fetch JSON data
 * @returns - JSON data from response or throws an error
 */

export async function fetchJsonHandler(
  url: string,
  nextRequestAt: number,
  userAgent: string,
  waitForSlot: () => Promise<void>,
): Promise<unknown> {
  for (let attempt = 0; attempt < 3; attempt++) {
    await waitForSlot();
    let response: Response;

    try {
      response = await fetch(url, {
        headers: { "User-Agent": userAgent, Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
        redirect: "error", // Check this
      });
    } catch (error) {
      if (attempt < 2) {
        await Bun.sleep(500 * 2 ** attempt);
        continue;
      }

      const timeout =
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError");

      if (timeout) {
        throw appError({
          status: 504,
          code: "SEC_TIMEOUT",
          message: "SEC took too long to respond. Try again.",
        });
      } else {
        throw appError({
          status: 502,
          code: "SEC_UNAVAILABLE",
          message: "Could not reach SEC. Try again.",
        });
      }
    }

    if (!response.ok) {
      await response.body?.cancel();
      if ((response.status === 429 || response.status >= 500) && attempt < 2) {
        const retryAfter = response.headers.get("Retry-After");
        const retryAt = retryAfter
          ? /^\d+$/.test(retryAfter)
            ? Date.now() + Number(retryAfter) * 1000
            : Date.parse(retryAfter)
          : NaN;
        const delay = Math.max(
          500 * 2 ** attempt,
          Number.isFinite(retryAt) ? retryAt - Date.now() : 0,
        );
        nextRequestAt = Math.max(nextRequestAt, Date.now() + delay);
        if (delay > 30_000) {
          throw appError({
            status: 503,
            code: "SEC_RATE_LIMITED",
            message: "SEC requested a longer pause. Please try again later.",
          });
        }
        await Bun.sleep(delay);
        continue;
      }
      throw appError({
        status: 502,
        code: "SEC_HTTP_ERROR",
        message: `SEC returned HTTP ${response.status}. ${response.status === 403 ? "Access was denied; check SEC identification and network access." : "Try again later."}`,
      });
    }

    try {
      const payload: unknown = await response.json();
      return payload;
    } catch (error) {
      console.error("SEC JSON decoding failed", { url, error });
      throwInvalidPayload("unreadable JSON response");
    }
  }

  throw appError({
    status: 502,
    code: "SEC_UNAVAILABLE",
    message: "SEC requests exhausted their retry limit.",
  });
}
