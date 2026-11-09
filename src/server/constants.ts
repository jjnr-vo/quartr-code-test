export const SEC_COMPANY_TICKERS_URL =
  "https://www.sec.gov/files/company_tickers.json";
export const SEC_SUBMISSIONS_URL = "https://data.sec.gov/submissions/";

export enum REQUIRED {
  accessionNumber = "accessionNumber",
  filingDate = "filingDate",
  form = "form",
  primaryDocument = "primaryDocument",
}

export enum OPTIONAL {
  reportDate = "reportDate",
  primaryDocDescription = "primaryDocDescription",
}
