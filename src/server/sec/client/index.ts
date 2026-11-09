import { SEC_SUBMISSIONS_URL } from "@/server/constants";
import { appError } from "@/server/errors";
import {
  normalizeTicker,
  throwInvalidPayload,
  validateObjectValue,
  validateText,
} from "@/server/utils";
import type {
  Company,
  CompanyHistory,
  Filing,
  SecClient,
} from "@/shared/types";
import { normalizeFilings } from "./filings";
import { fetchJsonHandler } from "./fetch-json";
import { getCompanies } from "./companies";

type TickerCache =
  | undefined
  | { expires: number; companies: Map<string, Company> };
type TickerRequest = Promise<Map<string, Company>> | undefined;
export type TickerHandler = {
  cache: TickerCache;
  request: TickerRequest;
};

const HISTORY_TTL = 5 * 60_000;
const MAX_CACHED_COMPANIES = 32;

export function createSecClient(userAgent: string): SecClient {
  // Prevent only whitespace or check new line characters
  if (!userAgent.trim() || /[\r\n]/.test(userAgent)) {
    throw appError({
      status: 500,
      code: "CONFIGURATION_ERROR",
      message:
        "Set SEC_USER_AGENT to an application name and contact before starting.",
    });
  }

  const requestHandler = {
    nextRequestAt: 0,
    requestQueue: Promise.resolve(),
  };

  const tickerHandler: TickerHandler = {
    cache: undefined,
    request: undefined,
  };

  const histories = new Map<
    string,
    { expires: number; value: CompanyHistory }
  >();
  const historyRequests = new Map<string, Promise<CompanyHistory>>();

  async function waitForSlot(): Promise<void> {
    const turn = requestHandler.requestQueue.then(async () => {
      while (requestHandler.nextRequestAt > Date.now()) {
        await Bun.sleep(requestHandler.nextRequestAt - Date.now());
      }
      requestHandler.nextRequestAt = Date.now() + 250; // Quarter of a second
    });
    requestHandler.requestQueue = turn;
    await turn;
  }

  function fetchJson(url: string) {
    return fetchJsonHandler(
      url,
      requestHandler.nextRequestAt,
      userAgent,
      waitForSlot,
    );
  }

  async function history(input: string): Promise<CompanyHistory> {
    const ticker = normalizeTicker(input);
    const company = (await getCompanies(fetchJson, tickerHandler)).get(ticker);
    if (!company)
      throw appError({
        status: 404,
        code: "COMPANY_NOT_FOUND",
        message: `No SEC-listed company was found for ${ticker}.`,
      });

    const cached = histories.get(company.cik);
    if (cached && cached.expires > Date.now()) {
      // Alter the order has it's been recently used
      histories.delete(company.cik);
      histories.set(company.cik, cached);
      return { company, filings: cached.value.filings };
    }

    const pending = historyRequests.get(company.cik);
    if (pending) return { company, filings: (await pending).filings };

    const request = loadHistory(company);
    historyRequests.set(company.cik, request);

    try {
      const value = await request;
      histories.delete(company.cik);
      histories.set(company.cik, { expires: Date.now() + HISTORY_TTL, value });

      while (histories.size > MAX_CACHED_COMPANIES) {
        const oldest = histories.keys().next().value;
        if (oldest !== undefined) histories.delete(oldest);
      }

      return value;
    } finally {
      historyRequests.delete(company.cik);
    }
  }

  async function loadHistory(company: Company): Promise<CompanyHistory> {
    const submissions = validateObjectValue(
      await fetchJson(`${SEC_SUBMISSIONS_URL}CIK${company.cik}.json`),
      "submissions",
    );
    const filings = validateObjectValue(
      submissions.filings,
      "submissions filings",
    );
    let rows = normalizeFilings(filings.recent, company.cik);

    if (!Array.isArray(filings.files))
      throwInvalidPayload("historical files list");

    const seenFiles = new Set<string>();
    for (const file of filings.files) {
      const name = validateText(
        validateObjectValue(file, "historical file descriptor").name,
        "historical file name",
      );
      if (
        !new RegExp(`^CIK${company.cik}-submissions-\\d+\\.json$`).test(name)
      ) {
        throwInvalidPayload("unexpected historical file name");
      }
      if (seenFiles.has(name)) continue;
      seenFiles.add(name);
      rows = rows.concat(
        normalizeFilings(
          await fetchJson(`${SEC_SUBMISSIONS_URL}${name}`),
          company.cik,
        ),
      );
    }

    const unique = new Map<string, Filing>();
    for (const row of rows) {
      if (!unique.has(row.accessionNumber))
        unique.set(row.accessionNumber, row);
    }

    return { company, filings: [...unique.values()] };
  }

  return { history };
}
