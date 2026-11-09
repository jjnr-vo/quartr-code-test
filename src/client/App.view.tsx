import { FilingsResponse, SummaryResponse } from "@/shared/types";
import type { SubmitEvent } from "react";
import { useApi } from "./hooks/api";

function RequestError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className="request-error" role="alert">
      <p>{message}</p>
      <button type="button" onClick={retry}>
        Try again
      </button>
    </div>
  );
}

export function AppView({
  compare,
  filings,
  filters,
  forms,
  formInput,
  loadFilings,
  tickerInput,
  setFilters,
  setFormInput,
  setSummaryInput,
  setTickerInput,
  summary,
  summaryInput,
}: {
  compare: (event: SubmitEvent<HTMLFormElement>) => void;
  filings: ReturnType<typeof useApi<FilingsResponse>>;
  filters: {
    ticker: string;
    form: string;
    sort: string;
    page: number;
  };
  forms: string[];
  formInput: string;
  loadFilings: (event: SubmitEvent<HTMLFormElement>) => void;
  tickerInput: string;
  setFilters: React.Dispatch<
    React.SetStateAction<{
      ticker: string;
      form: string;
      sort: string;
      page: number;
    }>
  >;
  setFormInput: React.Dispatch<React.SetStateAction<string>>;
  setSummaryInput: React.Dispatch<React.SetStateAction<string>>;
  setTickerInput: React.Dispatch<React.SetStateAction<string>>;
  summary: ReturnType<typeof useApi<SummaryResponse>>;
  summaryInput: string;
}) {
  return (
    <main>
      <header className="page-heading">
        <h1>SEC filing explorer</h1>
        <p>Read company disclosures and compare filing activity.</p>
      </header>
      <section aria-labelledby="filings-heading">
        <h2 id="filings-heading">Company filings</h2>
        <form className="controls" onSubmit={loadFilings}>
          <label>
            Company ticker
            <input
              required
              maxLength={30}
              value={tickerInput}
              onChange={(event) => setTickerInput(event.target.value)}
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="AAPL, SPOT, JPM..."
            />
          </label>
          <label>
            Form type
            <input
              list="form-types"
              value={formInput}
              maxLength={100}
              onChange={(event) => setFormInput(event.target.value)}
              placeholder="All forms"
            />
            <datalist id="form-types">
              {["10-K", "10-Q", "8-K", "20-F", "6-K"].map((form) => (
                <option key={form} value={form} />
              ))}
            </datalist>
          </label>
          <button type="submit">Load filings</button>
        </form>
        <div className="table-heading">
          <p>
            {filings.data
              ? `${filings.data.company.name} (${filings.data.company.ticker})`
              : filters.ticker}
          </p>
          <label className="sort-control">
            Filing date
            <select
              value={filters.sort}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  sort: event.target.value,
                  page: 1,
                }))
              }
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </label>
        </div>
        {filings.loading && (
          <p role="status">
            Loading filings. Older histories may take a moment on first load.
          </p>
        )}
        {filings.error && (
          <RequestError message={filings.error} retry={filings.retry} />
        )}
        {filings.data && (
          <>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Company filings table"
            >
              <table>
                <caption className="sr-only">
                  Filings for {filings.data.company.name}
                </caption>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      aria-sort={
                        filters.sort === "asc" ? "ascending" : "descending"
                      }
                    >
                      Filing date
                    </th>
                    <th scope="col">Form</th>
                    <th scope="col">Description</th>
                    <th scope="col">Document</th>
                  </tr>
                </thead>
                <tbody>
                  {filings.data.filings.map((filing) => (
                    <tr key={filing.accessionNumber}>
                      <td className="date">
                        <time dateTime={filing.filingDate}>
                          {filing.filingDate}
                        </time>
                      </td>
                      <td className="form-type">{filing.form}</td>
                      <td>{filing.description ?? "No description supplied"}</td>
                      <td>
                        {filing.documentUrl ? (
                          <a
                            href={filing.documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${filing.form} filed ${filing.filingDate} on SEC.gov (new tab)`}
                          >
                            Open filing
                          </a>
                        ) : (
                          <span className="muted">Document unavailable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!filings.data.filings.length && (
                    <tr>
                      <td colSpan={4}>
                        No filings match this selection. Try another form type
                        or company.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <nav className="pagination" aria-label="Filings pagination">
              <button
                disabled={filters.page <= 1}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page - 1,
                  }))
                }
              >
                Previous
              </button>
              <span>
                {filings.data.pagination.totalItems.toLocaleString()} filings
                {filings.data.pagination.totalPages > 0
                  ? ` / Page ${filters.page} of ${filings.data.pagination.totalPages.toLocaleString()}`
                  : ""}
              </span>
              <button
                disabled={filters.page >= filings.data.pagination.totalPages}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
              >
                Next
              </button>
            </nav>
          </>
        )}
      </section>

      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading">Company comparison</h2>
        <form className="controls" onSubmit={compare}>
          <label className="comparison-input">
            Company tickers, separated by commas (up to 10)
            <input
              required
              value={summaryInput}
              maxLength={1000}
              spellCheck={false}
              onChange={(event) => setSummaryInput(event.target.value)}
            />
          </label>
          <button type="submit">Compare</button>
        </form>
        <p className="muted">
          Counts cover the last 12 months. Latest 10-K uses all available
          history; foreign issuers may file 20-F instead.
        </p>
        {summary.loading && (
          <p role="status">
            Loading comparison. First loads include historical submissions.
          </p>
        )}
        {summary.error && (
          <RequestError message={summary.error} retry={summary.retry} />
        )}
        {summary.data && (
          <>
            <p className="window">
              Filing dates: {summary.data.window.from} through{" "}
              {summary.data.window.to} (UTC, inclusive)
            </p>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Company comparison table"
            >
              <table className="summary-table">
                <caption className="sr-only">
                  Filing counts by form type over the last 12 months
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Company</th>
                    {forms.map((form) => (
                      <th className="number" key={form} scope="col">
                        {form}
                      </th>
                    ))}
                    <th scope="col">Latest 10-K</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.data.results.map((result) =>
                    result.status === "success" ? (
                      <tr key={result.company.ticker}>
                        <th scope="row">
                          <span className="company-name">
                            {result.company.name}
                          </span>
                          <span className="muted">{result.company.ticker}</span>
                        </th>
                        {forms.map((form) => (
                          <td className="number" key={form}>
                            {(result.counts[form] ?? 0).toLocaleString()}
                          </td>
                        ))}
                        <td className="date">
                          {result.latest10KDate ? (
                            <time dateTime={result.latest10KDate}>
                              {result.latest10KDate}
                            </time>
                          ) : (
                            "No 10-K filed"
                          )}
                        </td>
                      </tr>
                    ) : (
                      <tr key={result.ticker} className="error-row">
                        <th scope="row">{result.ticker}</th>
                        <td colSpan={forms.length + 1} role="alert">
                          {result.error.message}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
            {summary.data.results.some(
              (result) => result.status === "error",
            ) && (
              <button
                className="retry-summary"
                type="button"
                onClick={summary.retry}
              >
                Retry comparison
              </button>
            )}
            {forms.length === 0 &&
              summary.data.results.some(
                (result) => result.status === "success",
              ) && (
                <p>
                  No filings were recorded in this period for the successfully
                  loaded companies.
                </p>
              )}
          </>
        )}
      </section>
      <footer>
        Source: SEC EDGAR. Filings are disclosures, not investment
        recommendations. In-memory data refreshes after five minutes.
      </footer>
    </main>
  );
}
