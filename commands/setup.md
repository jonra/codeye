# codeye:setup

Configures codeye in your Claude Code statusline.

This command writes the `statusLine` field into `~/.claude/settings.json` pointing at the installed plugin. Run it once after installing codeye.

```bash
node -e "
const fs = require('fs');
const path = require('path');
const os = require('os');

const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
const cacheBase = path.join(os.homedir(), '.claude', 'plugins', 'cache', 'codeye', 'codeye');

// Find the installed version directory
let entry = null;
try {
  const versions = fs.readdirSync(cacheBase).filter(v => v !== '.' && v !== '..');
  if (versions.length > 0) {
    entry = path.join(cacheBase, versions[versions.length - 1], 'dist', 'src', 'index.js');
  }
} catch {}

if (!entry || !fs.existsSync(entry)) {
  console.log('❌ codeye not found. Install it first: /plugin install codeye');
  process.exit(1);
}

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

console.log('✅ codeye configured! The HUD will appear immediately.');
console.log('   Run /codeye:status to verify.');
"
```
