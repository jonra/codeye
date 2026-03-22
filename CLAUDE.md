# codeye — Agent Guide

Real-time Claude Code statusline plugin. Two lines always visible below your input.

## Architecture

```
Claude Code (every ~300ms)
    │ stdin JSON
    ▼
src/index.ts              ← entry: reads stdin → assembles widgets → stdout
  ├── src/types.ts        ← StatusInput schema, ANSI codes, HudConfig
  └── src/widgets/
      ├── context.ts      ← ▓▓▓▓░░░░░░ 42% + token count
      ├── burn-rate.ts    ← +1.2k/min (rolling 60s, file-cached state)
      ├── cost.ts         ← $0.24 (from native cost field)
      ├── git.ts          ← ⎇ branch +staged ~modified ↑ahead ↓behind
      ├── session.ts      ← model name, 📁 project, ⏱ timer
      └── stall.ts        ← ⏸ stalled 45s (detects token silence)
```

State files (burn rate + session timer + stall detection):
- `~/.claude/plugins/codeye/state/burn.json`
- `~/.claude/plugins/codeye/state/session.json`
- `~/.claude/plugins/codeye/state/stall.json`

## Key rules

- **statusLine is NOT a valid plugin.json field.** It lives in `~/.claude/settings.json` and is written by `/codeye:setup`.
- The process is **re-spawned every ~300ms** by Claude Code. No in-memory state survives between ticks — use state files.
- **stdout = the statusline.** Newlines produce multiple lines. Stderr is ignored.
- **Fail silently.** Never throw unhandled errors — Claude Code blanks the statusline on non-zero exit.
- Keep execution **under 100ms** — git commands have a 1500ms timeout, file ops are sync.

## Build & test

```bash
npm ci           # install deps
npm run build    # compile TypeScript → dist/

# Test with mock payloads (no Claude Code needed)
npm run test:mock        # 42% context, normal session
npm run test:critical    # 87% context → /compact warning
npm run test:expensive   # $3.47 cost → red
npm run test:fresh       # no tokens yet
```

## Adding a widget

1. Create `src/widgets/my-widget.ts` — export `renderMyWidget(input, config): string`
2. Import and call it in `src/index.ts` inside `render()`
3. Add any config fields to `HudConfig` in `src/types.ts` + `DEFAULT_CONFIG`
4. Add a test payload to `package.json` scripts
5. Document in README.md

## Slash commands

Commands live in `commands/*.md`. The bash block inside is executed by Claude Code.
- `commands/setup.md` — writes statusLine to settings.json
- `commands/status.md` — verifies installation

## Version bumping

Update version in all three places:
- `package.json`
- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`
