## Architecture / design decisions

![Feedwatch CLI sample output](docs/screenshot-output.png)

The codebase is centered around a small set of focused modules under `task-1/feedwatch/lib/` and a thin CLI layer in `task-1/feedwatch/commands/`.

Configuration is handled by `lib/config.js` via layered resolution: hardcoded defaults are overridden by `feedwatch.config.json`, then by `FEEDWATCH_*` environment variables, and finally by CLI flags. `resolveConfig(opts)` also returns a `sources` map so `feedwatch config show` can display where each value came from.

Feed persistence is implemented in `lib/store.js`. The store contains a `feeds` registry (name, url, last-fetched time, and new-item count) and a `seen` map keyed by feed name. Writes are performed atomically by writing to a `.tmp` file and then renaming, which avoids corruption on crashes or partial writes.

Fetching is in `lib/fetcher.js` using `axios` with `config.timeout`. `withRetry()` retries only network errors and 5xx responses, using exponential backoff with jitter. This matches the requirement that 4xx errors are not retried.

XML parsing and normalization live in `lib/parser.js`. It uses `fast-xml-parser` to detect RSS vs Atom, and it normalizes each item into a fixed schema: `{ title, link, pubDate, description, guid }`. Dates are normalized to ISO 8601, and missing fields (including a missing `<title>`) default to empty strings; parsing failures return `[]` without throwing.

The `run` command orchestrates the pipeline: fetch all feeds concurrently, parse successful results, diff items against the persisted `seen` GUID set, and then persist the updated GUID list back to the store. Output is rendered as per-feed tables with NEW items highlighted; a `--json` mode outputs plain JSON for tooling.

## Harder part

The trickiest part was ensuring state persistence is both correct and robust on Windows. Atomic renames and retrying network failures without accidentally retrying 4xx responses required careful handling to avoid flaky behavior and corrupt store files.

## What I’d improve

With more time, I would expand integration coverage for `run --json`, improve error messaging consistency across all commands, and add richer Atom handling (e.g., better selection among multiple `<link>` elements).

