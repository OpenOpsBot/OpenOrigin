# OpenOrigin Agent Control UI — API Specification

## Base URL

```
http://localhost:8000/api/
```

All endpoints return `Content-Type: application/json`. Errors return HTTP status codes with a JSON body: `{ "error": "code", "detail": "message" }`.

---

## Endpoints

### `GET /api/health`

System health from `openclaw health --json`.

**Source:** `openclaw health --json` (CLI → JSON parse)

**Response**
```json
{
  "ok": true,
  "ts": 1776871442406,
  "durationMs": 997,
  "channels": { ... },
  "channelOrder": ["telegram"],
  "channelLabels": { "telegram": "Telegram" },
  "heartbeatSeconds": 1800,
  "defaultAgentId": "main",
  "agents": [{ "agentId": "main", "isDefault": true, "heartbeat": {...}, "sessions": {...} }],
  "sessions": { "path": "...", "count": 20, "recent": [...] }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ok` | `bool` | Overall health status |
| `ts` | `number` | Unix timestamp (ms) |
| `channels` | `object` | Per-channel config+running state |
| `channelOrder` | `string[]` | Ordered channel names |
| `agents` | `object[]` | Agent configs with session refs |
| `sessions.count` | `number` | Total session count |
| `sessions.recent` | `object[]` | Last 5 sessions (key + age) |

**Error codes**
- `health_error` — CLI execution failed
- `parse_error` — CLI returned non-JSON

---

### `GET /api/sessions`

Active sessions from `sessions.json`.

**Source:** `~/.openclaw/agents/main/sessions/sessions.json` (direct file read)

**Response**
```json
{
  "path": "/Users/ze/.openclaw/agents/main/sessions/sessions.json",
  "count": 20,
  "sessions": [
    {
      "key": "agent:main:telegram:direct:6810379425",
      "sessionId": "6810379425",
      "updatedAt": 1776871378743,
      "ageMs": 62666,
      "model": "gpt-5.4",
      "modelProvider": "openai-codex",
      "totalTokens": 138432,
      "contextTokens": 200000,
      "abortedLastRun": false,
      "kind": "direct",
      "origin": { "provider": "telegram", "surface": "direct", "chatType": "direct", "label": "6810379425" }
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Session composite key |
| `sessionId` | `string` | Platform session ID |
| `updatedAt` | `number` | Unix timestamp (ms) of last update |
| `ageMs` | `number` | Milliseconds since last update |
| `model` | `string` | Model short name |
| `modelProvider` | `string` | Provider (minimax / openai-codex / ... ) |
| `totalTokens` | `number` | Total tokens used this session |
| `contextTokens` | `number` | Context window size |
| `abortedLastRun` | `bool` | Last run was aborted |
| `kind` | `string` | Session kind: direct / cron / ... |
| `origin.provider` | `string` | Channel provider |
| `origin.surface` | `string` | Surface type |
| `origin.chatType` | `string` | Chat type |
| `origin.label` | `string` | Display label / username |

**Error codes**
- `read_error` — File not found or parse error

---

### `GET /api/cron`

Scheduled cron jobs from `openclaw cron list --json`.

**Source:** `openclaw cron list --json` (CLI → JSON parse)

**Current behavior note:** when CLI execution fails, the server currently returns `exec_error` with stderr details. It does not yet special-case gateway pairing failures into a dedicated `pairing_required` code.

**Response**
```json
{
  "jobs": [
    {
      "id": "96776c18-223b-4e24-9825-4fd0045a0203",
      "name": "heartbeat",
      "schedule": { "kind": "every", "everyMs": 1800000 },
      "payload": { "kind": "agentTurn", "message": "..." },
      "enabled": true,
      "lastRun": { "at": "2026-04-22T...", "durationMs": 5123, "status": "ok" },
      "nextRun": "2026-04-22T15:00:00.000Z"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Job UUID |
| `name` | `string` | Job name |
| `schedule` | `object` | Schedule descriptor (`kind`: `at` / `every` / `cron`) |
| `payload` | `object` | Execution payload |
| `enabled` | `bool` | Whether job is active |
| `lastRun` | `object\|null` | Last execution result |
| `nextRun` | `string\|null` | ISO timestamp of next scheduled run |

**Error codes**
- `exec_error` — CLI execution failed, including current gateway pairing failures
- `parse_error` — CLI returned non-JSON

---

### `GET /api/agents`

Configured agents synthesized from local config files.

**Source:** `~/.openclaw/openclaw.json` + `~/.openclaw/workspace/IDENTITY.md` (direct file reads, no CLI call)

**Response**
```json
{
  "agents": [
    {
      "id": "main",
      "name": "小猿",
      "emoji": "🐒",
      "workspace": "/Users/ze/.openclaw/workspace",
      "model": "openai-codex/gpt-5.4",
      "isDefault": true,
      "providers": [],
      "bindingCount": 0
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Agent identifier |
| `name` | `string` | Identity name (from `identityName`) |
| `emoji` | `string` | Identity emoji |
| `workspace` | `string` | Workspace directory path |
| `model` | `string` | Primary model ref |
| `isDefault` | `bool` | Is the default agent |
| `providers` | `string[]` | Provider status lines, currently returned as an empty placeholder array |
| `bindingCount` | `number` | Number of routing bindings, currently returned as `0` placeholder data |

**Error codes**
- `agents_error` — Config file read or parse failed

---

### `GET /api/models`

Configured models from `openclaw.json`.

**Source:** `~/.openclaw/openclaw.json` (direct file read)

**Response**
```json
{
  "models": [
    {
      "ref": "minimax/MiniMax-M2.7",
      "provider": "minimax",
      "model": "MiniMax-M2.7",
      "name": "MiniMax M2.7",
      "contextWindow": 204800,
      "maxTokens": 131072,
      "reasoning": true,
      "multimodal": true,
      "role": "primary"
    }
  ],
  "source": "openclaw.json"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ref` | `string` | Qualified model ref (`provider/model`) |
| `provider` | `string` | Provider ID |
| `model` | `string` | Model ID |
| `name` | `string` | Display name |
| `contextWindow` | `number\|null` | Context window in tokens |
| `maxTokens` | `number\|null` | Max output tokens |
| `reasoning` | `bool` | Supports reasoning / thinking |
| `multimodal` | `bool` | Supports image input |
| `role` | `string\|null` | `primary` = default model, `fallback` = fallback, absent = configured only |
| `source` | `string` | Always `openclaw.json` |

**Collection order**
1. Primary default model (marked `role: "primary"`)
2. Fallback models (marked `role: "fallback"`)
3. Provider catalog entries (unmarked)

**Error codes**
- `models_error` — Config read or parse error

---

### `GET /api/session-history?key=<sessionKey>`

Session message history loaded from the backing JSONL session file for a known session.

**Source:** `session.sessionFile` from `sessions.json` (direct file read)

**Query params**
- `key` — Required opaque session key from `/api/sessions`

**Response**
```json
{
  "history": [
    {
      "id": "msg_123",
      "timestamp": 1776871442406,
      "role": "user",
      "content": "hello"
    }
  ],
  "total": 1
}
```

| Field | Type | Description |
|-------|------|-------------|
| `history` | `object[]` | Parsed message entries from the session JSONL file |
| `history[].id` | `string` | Event/message identifier |
| `history[].timestamp` | `number` | Unix timestamp (ms) |
| `history[].role` | `string` | Message role (`user` / `assistant` / ...) |
| `history[].content` | `string` | Flattened text content |
| `total` | `number` | Total parsed message count |

**Error codes**
- `missing_key` — Required `key` query param not provided
- `session_not_found` — No session matched the supplied key
- `not_found` — Session file path missing on disk
- `read_error` — Session file could not be read

---

### `GET /api/client-ops`

Client operations staging data (local JSON demo file).

**Source:** `data/client-ops-sample.json` (local file)

**Response:** Raw contents of `client-ops-sample.json`.

**Error codes**
- `read_error` — File not found

---

## Error Response Format

All error responses share this shape:

```json
{
  "error": "error_code",
  "detail": "Human-readable description"
}
```

| HTTP Status | `error` code | Meaning |
|-------------|--------------|---------|
| 200 | — | Success (may contain `error` field for partial failures like `pairing_required`) |
| 404 | — | Endpoint not found |
| 500 | `server_error` | Unexpected server-side exception |

---

## Conventions

- **Timestamps**: Unix ms (since `Date.now()`). Convert with `new Date(ts).toISOString()` for ISO display.
- **Token counts**: Raw integers. Use `formatTokens(n)` helper: `< 1000` → raw, `≥ 1000` → `N.K`, `≥ 1000000` → `N.M`.
- **Age display**: Use `formatAge(ms)` helper: `< 60s` → `Xs`, `< 60m` → `Nm`, else `Nh`.
- **Session keys**: Composite strings `agent:main:{channel}:{surface}:{id}`. Do not parse structurally — use as opaque identifiers.
- **Provider names**: Lowercase provider IDs (`telegram`, `minimax`, `openai-codex`). Display labels may differ.

---

## Adding New Endpoints

1. Implement the data fetcher function (sync or async).
2. Add the route handler in `server.js` under `// ---- HTTP Server ----`.
3. Add the endpoint to this spec with response schema + error codes.
4. Consume from `js/app.js` `App` class following the `load*()` / `render*()` / `extract*()` pattern.
