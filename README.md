# SEC filing explorer

A TypeScript application that looks up SEC-listed companies by ticker, retrieves their EDGAR filing history, and presents filings and recent filing activity in a React UI.

## Requirements

- Bun 1.2.10 or later
- A descriptive SEC `User-Agent` value containing an application name and a real contact address

The SEC requires identifying information on automated requests. Do not use the example placeholder as your contact information.

## Run locally

From the project directory:

```sh
bun install
cp .env.example .env
```

Edit `.env` and replace the example `SEC_USER_AGENT` with your application name and contact address. Bun loads `.env` automatically. This value is used only by the server; do not rename it to a `BUN_PUBLIC_*` variable or expose it to the browser.

Start the development server:

```sh
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). The first company request can take longer because EDGAR may provide older filings in separate history files. Subsequent requests use an in-memory cache.

## Commands

```sh
bun run typecheck # TypeScript check
bun run build     # Build the browser assets into dist/
bun run start     # Run the server in production mode
```

`bun run start` still needs the `.env` configuration and starts the Bun server (default port 3000). There is no dedicated automated-test script.

## Use the API

### Company filings

```text
GET /companies/:ticker/filings
```

Example:

```sh
curl 'http://localhost:3000/companies/AAPL/filings?form=10-K&sort=desc&page=1&pageSize=25'
```

The response contains company identity, normalized filing rows, and pagination metadata. `form` is optional and matches an SEC form exactly; `sort` accepts `asc` or `desc` and defaults to `desc`; `page` defaults to 1; `pageSize` defaults to 25 and is capped at 100. Filtering and sorting happen before pagination. Filing rows include a link to the original SEC document when EDGAR provides a primary document.

### Filing summary

```text
GET /filings/summary?tickers=AAPL,SPOT,JPM
```

Example:

```sh
curl --get 'http://localhost:3000/filings/summary' \
  --data-urlencode 'tickers=AAPL,SPOT,JPM'
```

Provide 1–10 distinct tickers. The response includes each company's filing counts by form for the inclusive, trailing 12-calendar-month date window. `latest10KDate` is the latest exact `10-K` filing across available history, or `null` if none exists; it is not restricted to the summary window. Foreign issuers may file annual reports on form `20-F` rather than `10-K`. Company lookup failures are represented as per-company errors so successful results remain available.

## Data and scope

- Tickers are resolved with the SEC company ticker map and then queried through EDGAR's submissions API.
- Available older submissions files are included and filings are deduplicated by accession number.
- The app supports SEC form types returned by EDGAR; examples include `10-K`, `10-Q`, `8-K`, `20-F`, and `6-K`.
- The ticker map only resolves companies with a ticker in that SEC dataset. This ticker-based API cannot look up filers without a listed ticker.

See [NOTES.md](./NOTES.md) for known limitations and [AI_PROMPT_LOG.md](./AI_PROMPT_LOG.md) for the AI-assisted project prompt and response record.
