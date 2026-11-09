import {
  throwInvalidPayload,
  validateObjectValue,
  validateText,
} from "@/server/utils";
import type { TickerHandler } from ".";
import { SEC_COMPANY_TICKERS_URL } from "@/server/constants";
import { Company } from "@/shared/types";

const TICKER_TTL = 24 * 60 * 60_000; // 24 hours

export async function getCompanies(
  fetchJson: (url: string) => Promise<unknown>,
  tickerHandler: TickerHandler,
): Promise<Map<string, Company>> {
  if (!!tickerHandler.cache && tickerHandler.cache.expires > Date.now())
    return tickerHandler.cache.companies;

  if (tickerHandler.request) return tickerHandler.request;
  tickerHandler.request = (async () => {
    const data = validateObjectValue(
      await fetchJson(SEC_COMPANY_TICKERS_URL),
      "ticker map",
    );
    const companies = new Map<string, Company>();

    for (const value of Object.values(data)) {
      const row = validateObjectValue(value, "ticker entry");
      const cik = row.cik_str;
      if (
        typeof cik !== "number" ||
        !Number.isSafeInteger(cik) ||
        cik <= 0 ||
        cik > 9_999_999_999
      ) {
        throwInvalidPayload("CIK");
      }
      const ticker = validateText(row.ticker, "ticker").toUpperCase();
      companies.set(ticker, {
        ticker,
        cik: String(cik).padStart(10, "0"),
        name: validateText(row.title, "company name"),
      });
    }

    if (!companies.size) throwInvalidPayload("empty ticker map");
    tickerHandler.cache = { expires: Date.now() + TICKER_TTL, companies };

    return companies;
  })();
  try {
    return await tickerHandler.request;
  } finally {
    tickerHandler.request = undefined;
  }
}
