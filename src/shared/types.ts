export type Company = {
  ticker: string;
  cik: string;
  name: string;
};

export type Filing = {
  accessionNumber: string;
  form: string;
  filingDate: string;
  reportDate: string | null;
  primaryDocument: string | null;
  description: string | null;
  documentUrl: string | null;
};

export type CompanyHistory = {
  company: Company;
  filings: Filing[];
};

export type SecClient = {
  history: (input: string) => Promise<CompanyHistory>;
};

export type FilingsResponse = {
  company: Company;
  filings: Filing[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type ApiError = {
  code: string;
  message: string;
};

export type CompanySummary =
  | {
      status: "success";
      company: Company;
      counts: Record<string, number>;
      latest10KDate: string | null;
    }
  | { status: "error"; ticker: string; error: ApiError };

export type SummaryResponse = {
  window: { from: string; to: string };
  results: CompanySummary[];
};
