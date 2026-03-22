# codeye

> A heads-up display for Claude Code — see your context usage, costs, rate limits, and git status at a glance.

```
codeye │ Opus 4.6 │ 📁 my-project │ ⏱ 4m32s │ $0.24
▓▓▓▓░░░░░░ 42% │ 84k │ +1.2k/min │ ⎇ feature/auth +2 ~1 ↑3
5h 73% ↺1h20m · 7d 45% ↺4d
```

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Claude Code Plugin](https://img.shields.io/badge/Claude%20Code-plugin-orange.svg)](https://docs.claude.com/en/docs/claude-code/plugins)
[![Version](https://img.shields.io/badge/version-0.3.0-green.svg)](.claude-plugin/plugin.json)

**codeye** adds a live statusline to [Claude Code](https://claude.ai/code) that keeps you informed while you work. No setup required — install and go.

---

## Install

Run these two commands inside Claude Code:

```
/plugin marketplace add jonra/codeye
```
```
/plugin install codeye
```

The statusline appears immediately. No restart needed.

**Requirements:** Claude Code v1.0.80+ · Node.js 18+

---

## What you get

### Session info
- **Model** — which Claude model is active (e.g. `Opus 4.6`)
- **Project** — your current working directory
- **Timer** — how long your session has been running
- **Cost** — running cost for the session, color-coded so you notice when it climbs

### Context & token tracking
- **Context bar** — a visual meter showing how full your context window is (`▓▓▓▓░░░░░░ 42%`)
- **Token count** — total input tokens used this session
- **Burn rate** — how fast you're consuming tokens per minute

### Rate limits
- **5-hour window** — your usage against the 5-hour rolling limit, with a countdown to reset
- **7-day window** — same for the weekly limit

Colors shift from green to yellow to red as you approach limits.

### Git status
- Current branch, staged/modified file counts, and ahead/behind indicators — all inline.

### Smart alerts
- Suggests `/compact` when your context is getting full (70%) and warns you at 90%
- Cost changes color above $0.50 and $2.00
- Flags when Claude has been quiet for 30+ seconds mid-task

---

## Commands

| Command | What it does |
|---|---|
| `/codeye:setup` | Configures the statusline in your Claude Code settings |
| `/codeye:status` | Checks that everything is installed and working |

---

## Configuration

You can customize codeye by editing `~/.claude/plugins/codeye/config.json`. Everything works out of the box with sensible defaults — only change what you want to.

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
  "showModel": true,
  "showProject": true,
  "showSessionTime": true,
  "rateLimitsEnabled": true
}
```

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
