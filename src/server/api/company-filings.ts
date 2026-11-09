import { FilingsResponse, SecClient } from "@/shared/types";
import { t } from "elysia";
import { appError } from "../errors";
import { normalizeTicker } from "../utils";

function getValidPageNumber({
  value,
  fallback,
  maximum,
  label,
}: {
  value: string | undefined;
  fallback: number;
  maximum: number;
  label: string;
}) {
  if (value === undefined) return fallback;
  const number = Number(value);

  if (!Number.isSafeInteger(number) || number > maximum) {
    throw appError({
      status: 400,
      code: "INVALID_QUERY",
      message: `'${label}' must be an integer between 1 and ${maximum}.`,
    });
  }

  return number;
}

export const CompanyFilingsQuerySchema = {
  query: t.Object({
    form: t.Optional(t.String()),
    sort: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
    page: t.Optional(t.String()),
    pageSize: t.Optional(t.String()),
  }),
};

type Args = {
  params: {
    ticker: string;
  };
  query: (typeof CompanyFilingsQuerySchema.query)["static"];
};

export async function getCompanyFilings(
  { params, query }: Args,
  secClient: SecClient,
): Promise<FilingsResponse> {
  const page = getValidPageNumber({
    value: query.page,
    fallback: 1,
    maximum: Number.MAX_SAFE_INTEGER,
    label: "page",
  });
  const pageSize = getValidPageNumber({
    value: query.pageSize,
    fallback: 25,
    maximum: 100,
    label: "pageSize",
  });
  const form = query.form?.trim();

  if (!!query.form && (!form || form.length > 100)) {
    throw appError({
      status: 400,
      code: "INVALID_QUERY",
      message: "form must be a nonempty SEC form type.",
    });
  }

  const history = await secClient.history(normalizeTicker(params.ticker));
  const sorted = history.filings
    .filter((filing) => !form || filing.form === form)
    .sort((a, b) => {
      const order =
        a.filingDate.localeCompare(b.filingDate) ||
        a.accessionNumber.localeCompare(b.accessionNumber);
      return query.sort === "asc" ? order : -order;
    });
  const start = (page - 1) * pageSize;

  return {
    company: history.company,
    filings: Number.isSafeInteger(start)
      ? sorted.slice(start, start + pageSize)
      : [],
    pagination: {
      page,
      pageSize,
      totalItems: sorted.length,
      totalPages: Math.ceil(sorted.length / pageSize),
    },
  };
}
