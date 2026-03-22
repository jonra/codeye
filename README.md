# codeye

> Real-time observability for Claude Code — rate limits, context burn rate, cost tracking, git status, and stall detection in a native statusline plugin.

```
codeye │ Opus 4.6 │ 📁 my-project │ ⏱ 4m32s │ $0.24
▓▓▓▓░░░░░░ 42% │ 84k │ +1.2k/min │ ⎇ feature/auth +2 ~1 ↑3
5h 73% ↺1h20m · 7d 45% ↺4d
```

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Claude Code Plugin](https://img.shields.io/badge/Claude%20Code-plugin-orange.svg)](https://docs.claude.com/en/docs/claude-code/plugins)
[![Version](https://img.shields.io/badge/version-0.3.0-green.svg)](.claude-plugin/plugin.json)

**codeye** is a [Claude Code](https://claude.ai/code) statusline plugin that shows what your session is doing — at a glance, always visible, zero config required.

Unlike shell scripts or npm packages, codeye installs as a **native Claude Code plugin** via `/plugin install` and updates with `/plugin update`.

---

## Features

### Line 1 — Session overview
| Widget | Example | Description |
|---|---|---|
| Model | `Opus 4.6` | Active Claude model |
| Project | `📁 my-project` | Working directory name |
| Timer | `⏱ 4m32s` | Elapsed session time |
| Cost | `$0.24` | Running session cost (green → yellow → red) |

### Line 2 — Live state
| Widget | Example | Description |
|---|---|---|
| Context bar | `▓▓▓▓░░░░░░ 42%` | Visual context fill meter |
| Token count | `84k` | Input tokens this session |
| Burn rate | `+1.2k/min` | Rolling 60s token velocity |
| Stall detector | `⏸ 45s` | Surfaces when Claude goes quiet mid-task |
| Git status | `⎇ main +2 ~1 ↑3` | Branch, dirty state, ahead/behind |

### Line 3 — Rate limits
| Widget | Example | Description |
|---|---|---|
| 5h session | `5h 73% ↺1h20m` | 5-hour rolling window utilization with reset countdown |
| 7d weekly | `7d 45% ↺4d` | 7-day rolling window utilization with reset countdown |

Colors: green below 60%, yellow 60–80%, red above 80%. Data comes from Claude Code's native `rate_limits` field, with OAuth API fallback.

### Automatic nudges
- `💡 consider /compact` at 70% context
- `⚠ /compact now` at 90% context
- Cost turns yellow above $0.50, red above $2.00
- Stall indicator yellow after 30s silence, red after 90s

---

## Install

```
/plugin marketplace add jonra/codeye
```
```
/plugin install codeye
```
```
/codeye:setup
```

The HUD appears immediately — no restart needed.

**Requirements:** Claude Code v1.0.80+ · Node.js 18+

---

## Commands

| Command | Description |
|---|---|
| `/codeye:setup` | Writes `statusLine` config to `~/.claude/settings.json` |
| `/codeye:status` | Verifies the plugin is installed and working |

---

## Configuration

Edit `~/.claude/plugins/codeye/config.json`:

```json
{
  "contextBarWidth": 10,
  "contextWarnAt": 70,
  "contextCritAt": 90,
  "gitEnabled": true,
  "gitShowDirty": true,
  "gitShowAheadBehind": true,
  "burnRateEnabled": true,
  "burnRateWindow": 60,
  "costEnabled": true,
  "costWarnAt": 0.50,
  "costCritAt": 2.00,
  "stallEnabled": true,
  "stallWarnSec": 30,
  "stallCritSec": 90,
  "separator": " │ ",
  "showModel": true,
  "showProject": true,
  "showSessionTime": true,
  "rateLimitsEnabled": true
}
```

---

## How it works

Claude Code invokes the plugin every ~300ms via stdin JSON. codeye parses it, renders ANSI-colored widgets, and writes three lines to stdout.

```
Claude Code  ──stdin JSON──▶  codeye
                               ├── context bar + burn rate
                               ├── cost tracker
                               ├── stall detector
                               ├── git status
                               └── rate limit tracker
             ◀──stdout──────  three-line ANSI output
```

State between ticks (burn rate rolling average, stall timing, session start) is persisted in `~/.claude/plugins/codeye/state/`.

---

## Development

```bash
git clone https://github.com/jonrasmussen/codeye
cd codeye
npm ci && npm run build

# Test without a live Claude Code session
npm run test:mock        # 42% context, normal session
npm run test:critical    # 87% context → /compact warning
npm run test:expensive   # $3.47 cost → red indicator
npm run test:fresh       # brand new session, no tokens yet
npm run test:ratelimit   # rate limits with 73% session, 45% weekly
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add a widget.

---

## License

MIT — see [LICENSE](LICENSE)
