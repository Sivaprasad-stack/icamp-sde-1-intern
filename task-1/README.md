# Feedwatch (feedwatch)

## What it does
`feedwatch` is a CLI that monitors RSS/Atom feeds for new items. It keeps a local persisted seen-state so subsequent runs only report items that are new (NEW) vs previously seen (SEEN).

## Sample output (screenshot)
Representative CLI output (`--help` and a sample `run`):

![Feedwatch CLI sample output](docs/screenshot-output.png)

Regenerate this image from the **repository root** (stdlib only):

```bash
python scripts/materialize_docs_png.py --task 1
```

## Project
Implementation lives in `task-1/feedwatch/`.

## Setup
From `task-1/feedwatch`:
```bash
bun install
```

To run the CLI directly:
```bash
bun ./feedwatch.js --help
```

To use it from any directory:
```bash
bun link
feedwatch --help
```

## Environment variables
The CLI supports the following variables (all optional):

```bash
FEEDWATCH_RETRIES=
FEEDWATCH_TIMEOUT=
FEEDWATCH_MAX_ITEMS=
FEEDWATCH_LOG_LEVEL=
```

They are applied in this order (later overrides earlier):
1. hardcoded defaults
2. `feedwatch.config.json` (project root)
3. environment variables (`FEEDWATCH_*`)
4. CLI flags

## Store location
Seen-state and feed registry are stored in `~/.feedwatch/store.json`.
For testing or isolation, you can override it with:
```bash
FEEDWATCH_STORE_DIR=/path/to/tmp-dir
```

## Commands
```bash
feedwatch config show

feedwatch add <name> <url>
feedwatch remove <name>
feedwatch list

feedwatch run
feedwatch run --all
feedwatch run --json

feedwatch read <name>
```

## Edge cases / expected behavior
- `feedwatch add <same-name> ...` fails with a clear duplicate-name error.
- `feedwatch remove <unknown>` exits non-zero with a clear error.
- `feedwatch run` prints `FAILED` for any feed that cannot be fetched, and exits with code `1` if at least one feed fails.
- `feedwatch run --json` prints a raw JSON array (no tables/colors) suitable for piping into `jq`.
- `feedwatch read <unknown>` exits non-zero and does not modify seen-state.

