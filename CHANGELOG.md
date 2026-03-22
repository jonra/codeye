# Changelog

All notable changes to codeye are documented here.

Format: [Semantic Versioning](https://semver.org). Types: `Added`, `Changed`, `Fixed`, `Removed`.

---

## [0.3.0] — 2026-03-22

### Added
- **Rate limit tracker** — third statusline showing 5-hour session and 7-day weekly utilization with reset countdowns
- Supports native `rate_limits` field on stdin (Path B) and OAuth API fallback (Path A)
- OAuth token retrieval from macOS Keychain and `~/.claude/.credentials.json` fallback
- 60-second response caching to `~/.claude/plugins/codeye/state/rate-limits.json`
- Color thresholds: green < 60%, yellow 60–80%, red ≥ 80%
- `test:ratelimit` mock payload for testing rate limit display

---

## [0.2.0] — 2026-03-22

### Added
- **Cost tracking** — running session cost from `cost.total_cost_usd` (green < $0.50, yellow < $2.00, red ≥ $2.00)
- **Stall detection** — `⏸` indicator after 30s of token silence, escalates to red at 90s, resets automatically
- `test:expensive` mock payload for testing high-cost display

### Changed
- Cost now shows on line 1 alongside model/project/timer
- Stall indicator shows on line 2 between burn rate and git

---

## [0.1.0] — 2026-03-22

### Added
- **Context bar** — `▓▓▓▓░░░░░░ 42%` with color thresholds (green → yellow at 70% → red at 90%)
- **Token count** — current session input tokens in k
- **Burn rate** — rolling 60s token velocity (`+1.2k/min`), file-cached state
- **Git status** — branch name, staged/modified/untracked counts, ahead/behind vs upstream
- **Session timer** — elapsed time since session start
- **Model name** — current model display name
- **Project name** — basename of current working directory
- **`/compact` nudge** — inline suggestion at 70%, warning at 90%
- `/codeye:setup` command — writes statusLine to `~/.claude/settings.json`
- `/codeye:status` command — verifies installation
- Mock test payloads: `test:mock`, `test:critical`, `test:fresh`
