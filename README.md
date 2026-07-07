# JSONL Conversation Viewer

A dark-themed, single-page browser app for viewing **JSONL conversation logs** — traces from AI coding agents with user messages, assistant replies, tool calls, tool results, and thinking blocks.

![screenshot](screenshot.png)

## Features

- **Paste & render** — paste JSONL anywhere in the left pane; renders instantly with a 120ms debounce
- **Tool call nesting** — tool results are nested under their matching tool calls (matched by `toolCallId`)
- **Orphan results** — unmatched tool results render as standalone error rows
- **Stats bar** — live counts: messages, tool calls, errors, parse errors
- **Collapsible input pane** — fold the left pane for more reading room
- **Thinking blocks** — collapsible `<details>` sections for reasoning traces
- **Usage footers** — token counts, cache reads, cost, and stop reason per assistant message
- **Responsive** — stacks vertically on narrow viewports (<860px)
- **Zero dependencies** — pure HTML, CSS, vanilla JS; no framework, no runtime deps
- **Self-contained build** — production build is a single `index.html` with inlined CSS and JS

## JSONL Format

Each line must be valid JSON with a `message` field:

```jsonl
{"type":"message","id":"...","message":{"role":"user","content":[{"type":"text","text":"Hello"}]}}
{"type":"message","id":"...","message":{"role":"assistant","content":[...],"model":"...","provider":"...","usage":{...},"stopReason":"..."}}
{"type":"message","id":"...","message":{"role":"toolResult","toolCallId":"call_00_...","toolName":"bash","content":[{"type":"text","text":"..."}],"isError":false}}
```

The viewer supports the `role` values: `user`, `assistant`, `toolResult`.

Content blocks inside `assistant` messages can be:
- `{"type":"text","text":"..."}`
- `{"type":"thinking","thinking":"..."}`
- `{"type":"toolCall","id":"...","name":"...","arguments":{...}}`

## Development

**Prerequisites:** [Bun](https://bun.sh) ≥ 1.0

```bash
# Start dev server with live-reload
bun run dev

# Production build → dist/index.html
bun run build

# Serve production build locally
bun run serve
```

## Docker

```bash
# Build image
docker build -t jsonl-viewer .

# Run container
docker run -p 3000:3000 jsonl-viewer
```

Open http://localhost:3000.

Multi-stage build: compiles in `oven/bun:1`, runs in `oven/bun:1-slim` (~80 MB final image).

## Project Structure

```
src/
├── app.js              # Entry point — DOM wiring, event listeners, render pipeline
├── index.html          # HTML shell (dev: loads modules, prod: inlined)
├── renderer.js         # All render functions (message rows, tool blocks, stats)
├── lib/
│   ├── parser.js       # JSONL parser + SAMPLE data
│   └── utils.js        # escapeHtml, fmtTime, fmtMoney
└── styles/
    └── main.css        # All styles (CSS custom properties, dark theme)
build.js                # Bun build — bundles + inlines → dist/index.html
serve.js                # Dev server with live-reload
serve.prod.js           # Production static server
Dockerfile              # Multi-stage Docker build
```

## License

MIT
