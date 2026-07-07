# AGENTS.md

## Project: JSONL Conversation Viewer

A dark-themed, single-page viewer for AI agent conversation traces in JSONL format.
Zero dependencies, vanilla JS, built and served with Bun.

## Stack

- **Runtime:** Bun (dev server, production server, build pipeline)
- **Frontend:** Vanilla JS ES modules, no framework
- **Build:** `Bun.build()` → self-contained `dist/index.html` (JS bundled + minified, CSS inlined)
- **Container:** Multi-stage Docker (`oven/bun:1` → `oven/bun:1-slim`)

## Commands

| Command | Description |
|---|---|
| `bun run dev` | Start dev server on :3000 with live-reload |
| `bun run build` | Production build → `dist/index.html` |
| `bun run serve` | Serve production build on :3000 |
| `docker build -t jsonl-viewer .` | Build Docker image |
| `docker run -p 3000:3000 jsonl-viewer` | Run container |

## Architecture

```
src/app.js          → DOM wiring, event listeners, debounced render trigger
src/renderer.js     → render(), renderUserRow(), renderAssistantRow(),
                       renderToolBlock(), renderResultBody(), renderOrphanResult(),
                       buildStatsHtml()
src/lib/parser.js   → parseJsonl(text) → [{ok,obj,lineNo}, ...], SAMPLE constant
src/lib/utils.js    → escapeHtml(), fmtTime(), fmtMoney()
src/styles/main.css → All CSS — dark theme, responsive layout, custom properties
```

## Key Design Decisions

- **Self-contained output** — the build inlines CSS and JS into a single HTML file for zero-dependency deployment (just open the file or serve it).
- **Tool result nesting** — `toolResult` messages are matched to `toolCall` blocks by `toolCallId` and rendered inside the assistant bubble rather than as separate rows. Unmatched results render as orphan rows.
- **Debounced render** — 120ms debounce on input so large pastes don't thrash the DOM.
- **No state management** — the entire view is derived from the textarea value on each render. No mutable state to keep in sync.

## JSONL Contract

See README.md for the expected JSONL format. Key fields:

- `message.role` — `"user"`, `"assistant"`, `"toolResult"`
- `message.content[]` — blocks of `type`: `"text"`, `"thinking"`, `"toolCall"`
- `message.toolCallId` — on toolResult, matches toolCall `id`
- `message.usage` / `message.stopReason` — optional metadata rendered in footers
