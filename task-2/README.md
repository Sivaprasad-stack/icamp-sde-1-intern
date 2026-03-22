# Kanban Board (task-2)

## What it does
This is a fully client-side Kanban board with:
- columns that can be added/renamed/deleted
- cards that can be added/edited/deleted
- moving cards left/right between adjacent columns
- real-time filtering by card title (search box)

All board state persists to `localStorage` and survives a page reload.

## Sample output (screenshot)
Representative UI after serving `task-2/kanban` and opening the app in a browser:

![Kanban board sample UI](docs/screenshot-output.png)

Regenerate this image from the **repository root** (stdlib only):

```bash
python scripts/materialize_docs_png.py --task 2
```

Generate **both** task screenshots at once:

```bash
python scripts/materialize_docs_png.py
```

## Project
Implementation lives in `task-2/kanban/`.

## How to run
1. Start a simple static server from `task-2/kanban/` (ES Modules require an HTTP server):

```bash
cd task-2/kanban
python -m http.server 5500
```

2. Open `http://localhost:5500/` in your browser.

If you don't have Python available, use any equivalent static server (or an IDE “Live Server”).

## Storage / persistence
- `state.js` persists the entire board state under the key `kanban-state`.
- On first load (empty or corrupt storage), it falls back to the default seed columns:
  - `To Do`, `In Progress`, `Done`.

## Features / behaviors to verify
- Card move buttons:
  - `←` is disabled for cards in the first column.
  - `→` is disabled for cards in the last column.
- Empty columns display a `.empty-placeholder` with text `"No cards yet"`.
- Filtering:
  - typing in `#search` hides non-matching cards without changing state
  - columns with all cards hidden are dimmed (`opacity: 0.4`)
  - clearing the search restores visibility
- Inline add/edit forms:
  - only one inline form can be open at a time
  - Save validates non-empty title and shows an inline error when invalid
  - Cancel restores the prior DOM without mutating state

## Notes
There are no runtime environment variables for this task.

