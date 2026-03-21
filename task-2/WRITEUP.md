## Architecture / design decisions
The Kanban app is split into small ES Modules under `task-2/kanban/`:

`state.js`
- Holds the single mutable state object (`state.columns`) and exposes mutation functions (`addColumn`, `removeColumn`, `renameColumn`, `addCard`, `updateCard`, `removeCard`, `moveCard`).
- Ensures persistence by serializing the state to `localStorage` (`kanban-state`) after every successful mutation.
- Validates inputs (e.g., empty column/card titles throw `Error('Column title cannot be empty')` / `Error('Card title cannot be empty')`), so UI can surface user-friendly messages.

`board.js`
- Exports `renderBoard()` which fully rebuilds the DOM for `#board` from the current `state` on every call (no incremental patching, no retained DOM references).
- Renders columns/cards with the exact class names and `data-id` attributes expected by the event layer.

`events.js`
- Wires all user interactions using event delegation on `#board` (one click listener) plus an `input` listener for filtering.
- Inline add/edit forms are created by temporarily replacing the relevant DOM region (footer or card) and storing prior HTML so Cancel can restore it without changing state.

`main.js`
- Loads state, renders the initial board, then initializes event wiring.

## Harder part
The trickiest part was keeping the UI consistent with repeated full DOM rebuilds while still supporting inline add/edit forms. The solution was to render everything from state in `renderBoard()`, and for inline interactions rely on DOM replacement/restore only for Cancel. For Save, we mutate state first, then call `renderBoard()` so all button disabled states and placeholders are recomputed from state.

Another subtle concern is module coupling between rendering and filtering. Filtering operates directly on already-rendered DOM, so `renderBoard()` re-applies `applyFilter()` at the end to keep the visible set consistent across re-renders.

## What I’d improve
With more time, I would:
- add automated browser tests (e2e) to validate the delegated event flows end-to-end
- reduce reliance on `window.prompt/confirm` by replacing them with small custom modal components
- improve state-shape validation messages to make debugging persistence issues easier.

