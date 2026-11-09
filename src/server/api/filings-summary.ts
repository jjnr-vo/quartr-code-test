import type {
  CompanySummary,
  SecClient,
  SummaryResponse,
} from "@/shared/types";
import { t } from "elysia";
import { normalizeTicker } from "../utils";
import { appError, isAppError } from "../errors";

function summaryWindow(): SummaryResponse["window"] {
  const now = new Date();
  const year = now.getUTCFullYear() - 1;
  const month = now.getUTCMonth();
  const lastDayOfCurrentMonth = new Date(Date.UTC(year, month + 1, 0));
  const day = Math.min(now.getUTCDate(), lastDayOfCurrentMonth.getUTCDate());

  return {
    from: new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

export const FilingsSummaryQuerySchema = {
  query: t.Object({
    tickers: t.String({ minLength: 1, maxLength: 1000 }),
  }),
};

export async function getFilingsSummary(
  query: (typeof FilingsSummaryQuerySchema.query)["static"],
  secClient: SecClient,
): Promise<SummaryResponse> {
  const tickers = [...new Set(query.tickers.split(",").map(normalizeTicker))];
  if (tickers.length > 10) {
    throw appError({
      status: 400,
      code: "INVALID_QUERY",
      message: "Compare at most 10 distinct companies per request.",
    });
  }

  const window = summaryWindow();
  const results = await Promise.all(
    tickers.map(async (ticker): Promise<CompanySummary> => {
      try {
        const { company, filings } = await secClient.history(ticker);
        const counts: Record<string, number> = Object.create(null);
        let latest10KDate: string | null = null;

        for (const filing of filings) {
          if (
            filing.filingDate >= window.from &&
            filing.filingDate <= window.to
          ) {
            counts[filing.form] = (counts[filing.form] ?? 0) + 1;
          }
          if (
            filing.form === "10-K" &&
            (!latest10KDate || filing.filingDate > latest10KDate)
          ) {
            latest10KDate = filing.filingDate;
          }
        }

        return { status: "success", company, counts, latest10KDate };
      } catch (error) {
        if (!isAppError(error)) throw error;

        return {
          status: "error",
          ticker,
          error: { code: error.code, message: error.message },
        };
      }
    }),
  );
  return { window, results };
}
