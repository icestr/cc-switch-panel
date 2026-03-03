# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server (auto-injects /rpc middleware, no separate backend needed)
npm run build    # Production build to dist/
npm run start    # Production server (Hono, serves dist/ + /rpc on port 3456)
```

## Architecture

cc-switch-panel is a read-only dashboard for visualizing data produced by [cc-switch](https://github.com/farion1231/cc-switch). It reads a SQLite database at `~/.cc-switch/cc-switch.db` in readonly mode — it never writes to the database.

### Communication: JSON-RPC over POST /rpc

All frontend-backend communication uses a single `POST /rpc` endpoint with `{ method, params }` / `{ result }` payloads. **Not REST.**

- **Dev mode**: `vite.config.js` injects an `rpcPlugin` middleware that imports `server/rpc.js` directly into the Vite process — no proxy, no separate server.
- **Production**: `server/index.js` (Hono) serves static files from `dist/` and the same `/rpc` route.
- **Dispatch**: `server/rpc.js` maps method names to handler functions via a `methods` object. All SQLite queries live here.

### Frontend

- **State**: No external state library. `App.jsx` holds two top-level states: `days` (time range filter) and `tick` (refresh counter). Both are passed as props to all panel components.
- **Data fetching**: Every panel uses `useRpc(method, params, refreshKey, interval)` from `src/hooks/useRpc.js`. Default polling: 30s. Returns `{ data, refresh }`.
- **Styling**: Single `src/app.css` file with CSS custom properties (dark theme). No CSS-in-JS, no Tailwind.
- **Charts**: Recharts. Theme constants in `src/lib/chart-theme.js` (`COLORS`, `PALETTE`, `TIP`, `AXIS`) — these colors mirror the CSS variables.
- **Formatters**: `src/lib/format.js` — `fmtTokens`, `fmtUsd`, `fmtUsd4`, `fmtPct`, `fmtMs`, `shortModel`.

### Special: ConversationDailySummary

`server/conversation-summary.js` does **not** query SQLite. It reads local AI tool conversation history from the filesystem:
- Claude Code: `~/.claude/history.jsonl`
- Codex: `~/.codex/sessions/YYYY/MM/DD/*.jsonl`
- Gemini: `~/.gemini/tmp/**/chats/session-*.json`

### Database Schema (main table: `proxy_request_logs`)

Key columns: `created_at` (unix seconds), `model`, `request_model`, `provider_id`, `status_code`, `latency_ms`, `first_token_ms`, `input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_creation_tokens`, `total_cost_usd`, `error_message`, `session_id`. Joined with `providers` table (`id`, `name`) for provider display names.

All time-filtered queries use the same pattern: `days=0` means "all time", otherwise `WHERE created_at >= ?` with `Date.now()/1000 - days*86400`.
