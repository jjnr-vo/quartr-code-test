import { Elysia } from "elysia";
import type { SecClient } from "../../shared/types";
import { isAppError } from "../errors";
import {
  CompanyFilingsQuerySchema,
  getCompanyFilings,
} from "./company-filings";
import {
  FilingsSummaryQuerySchema,
  getFilingsSummary,
} from "./filings-summary";

export function createApi(secClient: SecClient) {
  return new Elysia()
    .get(
      "/filings/summary",
      async ({ query }) => await getFilingsSummary(query, secClient),
      FilingsSummaryQuerySchema,
    )
    .get(
      "/companies/:ticker/filings",
      async (params) => await getCompanyFilings(params, secClient),
      CompanyFilingsQuerySchema,
    )
    .onError(({ error, code, set }) => {
      if (isAppError(error)) {
        const { message, status } = error;
        set.status = status;
        return { error: { code: error.code, message } };
      }

      if (code === "VALIDATION" || code === "PARSE") {
        set.status = 400;
        return {
          error: {
            code: "INVALID_QUERY",
            message:
              "Invalid request. Check ticker, form, sort, and pagination parameters.",
          },
        };
      }

      if (code === "NOT_FOUND") {
        set.status = 404;
        return {
          error: { code: "NOT_FOUND", message: "API endpoint not found." },
        };
      }

      set.status = 500;
      return {
        error: {
          code: "INTERNAL_ERROR",
          message: "The server could not complete the request.",
        },
      };
    });
}
