# AI prompt log

AI assistance was used for planning, implementation, and code explanations. This is a project-relevant log of the user prompts and corresponding assistant output. Outputs are concise records of the responses (not a verbatim transcript of every message or tool event); the original assignment brief was supplied by the user.

## Assignment and design

**Input:** The user supplied the SEC EDGAR assignment: build a TypeScript API and React UI using Bun, resolve company tickers to CIK, include standardized paginated/filterable filings and a company summary, and deliver source, run instructions, a prompt log, and `NOTES.md`. The user asked for UI and backend recommendations and said the project was initialized with Bun.

**Output:** Recommended retaining Bun for runtime/build and using Elysia for the API, React via Bun's HTML bundler, and plain CSS. Suggested a one-page filing table with company/form controls and a summary comparison table, no database, and explicit handling for ticker coverage, older submission files, SEC request identification, and foreign issuer forms.

**Input:** The user chose a single-page filings table and summary comparison, Bun + Elysia + React with Bun's HTML bundler, and required features/documentation only.

**Output:** Proposed a restrained, left-aligned financial-data interface and outlined the SEC history/cache/error handling and scope decisions to confirm.

**Input:** “What exactly are these form types like 10-K/10-Q/8-K?”

**Output:** Explained 10-K as an annual report, 10-Q as a quarterly report, 8-K as a material-event filing, and 20-F/6-K as forms commonly used by foreign issuers. Clarified that form filters and summary counts represent filings, not company performance.

**Input:** The user approved continuing the original planning and specified that the filings endpoint should include older submissions, the summary count only the trailing 12 months, latest 10-K should use all history, and summary results should preserve successful companies with explicit errors for failures (maximum 10 tickers).

**Output:** Produced a plan reflecting those choices, with no optional extensions or dedicated automated-test suite, and called out ticker-map coverage and live SEC access as boundaries.

## Implementation and code discussions

**Input:** “If there is no particualr reason as to why the server side code is writtten with a object oriented approach, change that to a functional programming approach”

**Output:** Refactored the SEC client to a function factory with closure-held state and replaced the custom error class with functions. Type-check and browser build were subsequently reported passing at that point in the implementation.

**Input:** “What is the purpose of the function "waitForSlot"?”

**Output:** Explained that it serializes request-slot reservations and spaces SEC request starts by 250 ms; this is pacing for concurrent requests, not a delay after each response.

**Input:** “Why was that introduced?”

**Output:** Explained that pacing was intended to avoid bursts against SEC's fair-access request limit. The earlier inspected version had the pacing call commented out.

**Input:** “Elaborate on the functionality between the "requestQueue" and it's usage inside "waitForSlot"”

**Output:** Walked through how each caller chains a promise behind the existing queue, waits for its turn, reserves the next request time, and then proceeds. Clarified that the queue coordinates start slots, not the full lifetime of each request. At that time the function was commented out.

**Input:** “Why the choice of 250 miliseconds?”

**Output:** Described 250 ms as a conservative design choice (about four request starts per second), not an SEC-mandated interval, and noted it was inactive in the then-inspected version.

**Input:** The user asked whether `cached.expires > Date.now()` should instead check whether the entry already expired.

**Output:** Explained that `expires` is an expiration timestamp, so it is still valid when greater than the current time; otherwise execution falls through to a fetch.

**Input:** The user asked why valid cached data was deleted and reinserted into the history map.

**Output:** Explained that reinsertion updates the map's insertion order, implementing a basic LRU policy so a recently used entry is less likely to be evicted when the cache exceeds its company limit.

**Input:** The user asked why `TICKER_TTL` was `24 * 60 * 60_000`, how the values break down, and whether reassigning cache/request arguments updates the original state.

**Output:** Explained that the expression is 24 hours × 60 minutes × 60,000 milliseconds. Clarified that assigning to a function parameter rebinds only its local variable; object-property mutation is shared, but assigning a new object/promise to a parameter does not update the caller's variable. The client was subsequently refactored to pass shared mutable ticker-handler state.

**Input:** The user asked why `tickerRequest` stores an immediately invoked async function's promise, why it is later cleared, whether it is redundant, and where concurrent calls could arise.

**Output:** Explained that the promise is an in-flight request cache: concurrent lookups can await one ticker-map fetch instead of starting duplicates. The resolved company map is held separately in the TTL cache; clearing the pending promise allows future refreshes after failure or expiry. Concurrent lookups can come from the summary's parallel company loading, the initial filings and summary UI requests, or multiple visitors.

**Input:** The user asked what `/[\r\n]/` checks and where a `SEC_USER_AGENT` could contain those characters.

**Output:** Explained that it rejects carriage returns or line feeds in the environment-supplied User-Agent, as a defensive check against multiline or invalid HTTP header values. The application does not add line breaks itself.

**Input:** The user asked for an explanation of the summary's `Math.min` date calculation and why it uses `month + 1`.

**Output:** Explained that it clamps the same-day, one-year-prior date to the target month’s last day when needed (for example, February 29 has no counterpart in a non-leap year). In JavaScript's zero-based month API, `Date.UTC(year, month + 1, 0)` represents day zero of the next month—the final day of the target month.

## Documentation request

**Input:** “The prject is now concluded and refactored. Please update the following now so I can add it to the repo: Source code, with instructions on how to run it.; The prompt log, if any AI tool was used. We should be able to follow input and output.; NOTES.md”

**Output:** Added project setup/API instructions to `README.md`, documented known limitations and suggested follow-up work in `NOTES.md`, and created this prompt/response log. Verified the current project files before writing the documentation.
