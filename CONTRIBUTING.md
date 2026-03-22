# Contributing to codeye

Thanks for wanting to improve codeye! Here's everything you need.

## Setup

```bash
git clone https://github.com/jonra/codeye
cd codeye
npm ci
npm run build
```

## Test without Claude Code

Every change can be verified using the mock test scripts — no active Claude Code session needed:

```bash
npm run test:mock        # normal session, 42% context
npm run test:critical    # 87% context, triggers /compact warning
npm run test:expensive   # $3.47 cost, red indicator
npm run test:fresh       # brand new session, no tokens
```

Output goes directly to your terminal with ANSI colors so you see exactly what the HUD renders.

## Project structure

```
codeye/
├── .claude-plugin/
│   ├── plugin.json        ← plugin metadata (name, version, author)
│   └── marketplace.json   ← marketplace registration
├── commands/
│   ├── setup.md           ← /codeye:setup command
│   └── status.md          ← /codeye:status command
├── src/
│   ├── index.ts           ← main entry point
│   ├── types.ts           ← types, ANSI codes, HudConfig
│   └── widgets/           ← one file per widget
├── dist/                  ← compiled output (committed)
├── CLAUDE.md              ← guide for Claude Code agents
├── CHANGELOG.md           ← version history
└── README.md
```

## Adding a new widget

1. Create `src/widgets/my-widget.ts`
2. Export a render function: `export function renderMyWidget(input: StatusInput, config: HudConfig): string`
3. Return an ANSI-formatted string, or `""` to hide the widget
4. Import and add it to `src/index.ts`
5. Add any new config options to `HudConfig` in `src/types.ts` and `DEFAULT_CONFIG`
6. Add a test payload to `package.json`
7. Update README.md

## Performance rules

- **Hard timeout:** git commands use 1500ms timeout — keep shell calls minimal
- **No heavy deps:** the process starts fresh every ~300ms. Startup cost matters.
- **Fail silently:** catch all errors. Never let an exception reach stdout.
- **State files:** the only persistence mechanism between ticks. Keep reads/writes fast.

## Submitting a PR

- One widget or fix per PR
- Include a test payload in `package.json` that demonstrates the new behaviour
- Run `npm run build` and commit the updated `dist/` 
- Update `CHANGELOG.md`
- Bump version in `package.json`, `.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json`

## Commit style

```
feat: add tool activity widget
fix: burn rate not resetting on new session
docs: update config reference in README
chore: bump to v0.3.0
```
