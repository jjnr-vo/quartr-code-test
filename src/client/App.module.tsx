// @ts-expect-error CSS is loaded by the bundler and has no TypeScript declarations.
import "./filings.css";
import { useState, type SubmitEvent } from "react";
import type { FilingsResponse, SummaryResponse } from "@/shared/types";
import { useApi } from "./hooks/api";
import { AppView } from "./App.view";

export function App() {
  const [tickerInput, setTickerInput] = useState("AAPL");
  const [formInput, setFormInput] = useState("");
  const [filters, setFilters] = useState({
    ticker: "AAPL",
    form: "",
    sort: "desc",
    page: 1,
  });
  const [summaryInput, setSummaryInput] = useState("AAPL, SPOT, JPM");
  const [summaryTickers, setSummaryTickers] = useState("AAPL,SPOT,JPM");
  const filingQuery = new URLSearchParams({
    page: String(filters.page),
    pageSize: "25",
    sort: filters.sort,
    ...(filters.form ? { form: filters.form } : {}),
  });
  const filings = useApi<FilingsResponse>(
    `/companies/${encodeURIComponent(filters.ticker)}/filings?${filingQuery}`,
  );
  const summary = useApi<SummaryResponse>(
    `/filings/summary?${new URLSearchParams({ tickers: summaryTickers })}`,
  );
  const forms = [
    ...new Set(
      summary.data?.results.flatMap((result) =>
        result.status === "success" ? Object.keys(result.counts) : [],
      ) ?? [],
    ),
  ].sort((a, b) => a.localeCompare(b));

  function loadFilings(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      ticker: tickerInput.trim().toUpperCase(),
      form: formInput.trim().toUpperCase(),
      page: 1,
    }));
    filings.retry();
  }

  function compare(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSummaryTickers(
      summaryInput
        .split(",")
        .map((ticker) => ticker.trim().toUpperCase())
        .join(","),
    );
    summary.retry();
  }

  return (
    <AppView
      compare={compare}
      filings={filings}
      filters={filters}
      forms={forms}
      formInput={formInput}
      loadFilings={loadFilings}
      tickerInput={tickerInput}
      setFilters={setFilters}
      setFormInput={setFormInput}
      setSummaryInput={setSummaryInput}
      setTickerInput={setTickerInput}
      summary={summary}
      summaryInput={summaryInput}
    />
  );
}

export default App;
