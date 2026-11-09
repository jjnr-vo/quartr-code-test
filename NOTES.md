# Notes

The assignment specs were provided to an AI agent and based on the outputted code, refactor occurred manually. This file has also been manually altered so I could add my on notes into it. This ended up slightly exceeding the deadline but the application is functional and matches the requirements.

## Next steps

- **Automated tests:** this submission does not include a dedicated automated-test suite. `bun run typecheck` and `bun run build` are available as checks.
- **Pagination validation:** the filings API currently checks that `page` and `pageSize` are safe integers and enforces the maximum page size, but does not reject zero or negative values. Tighten this to require values of at least 1 before relying on the endpoint with arbitrary clients.
- **Modular UI:** the UI is quite simple but it was not fully refactored to be more reusable so the `/client` code could use further attention.
- **Lighthouse reporst and responsiveness:** these were not investigated at all. A newer approach would have been to use a framework such as NextJS that provides SSR so the important information would be available from the server for SEO.
