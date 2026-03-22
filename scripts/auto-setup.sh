#!/bin/bash
# Auto-configure codeye statusLine in settings.json on first session start.
# Runs as a SessionStart hook — must be fast and silent on failure.

SETTINGS_FILE="$HOME/.claude/settings.json"
ENTRY="${CLAUDE_PLUGIN_ROOT}/dist/src/index.js"

# Bail if entry point doesn't exist
[ -f "$ENTRY" ] || exit 0

# Bail if statusLine is already configured
grep -q '"statusLine"' "$SETTINGS_FILE" 2>/dev/null && exit 0

# Write statusLine config using Node (reuses logic from commands/setup.md)
node -e "
const fs = require('fs');
const path = require('path');

const settingsPath = '$SETTINGS_FILE';
const entry = '$ENTRY';

let settings = {};
try {
  settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
} catch {}

settings.statusLine = {
  type: 'command',
  command: 'node ' + entry
};

fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
" 2>/dev/null

exit 0
