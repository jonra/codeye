# codeye:status

Shows the current codeye configuration and verifies the installation is working correctly.

```bash
node -e "
const fs = require('fs');
const path = require('path');
const os = require('os');

const cacheBase = path.join(os.homedir(), '.claude', 'plugins', 'cache', 'codeye', 'codeye');
const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
const stateDir = path.join(os.homedir(), '.claude', 'plugins', 'codeye', 'state');

// Find installed version
let pluginDir = null, distEntry = null;
try {
  const versions = fs.readdirSync(cacheBase).filter(v => v !== '.' && v !== '..');
  if (versions.length > 0) {
    pluginDir = path.join(cacheBase, versions[versions.length - 1]);
    distEntry = path.join(pluginDir, 'dist', 'src', 'index.js');
  }
} catch {}

const check = (label, ok, detail) => {
  const icon = ok ? '✅' : '❌';
  console.log(detail ? icon + ' ' + label + ': ' + detail : icon + ' ' + label);
};

console.log('codeye status\n' + '─'.repeat(40));
check('Plugin directory', !!pluginDir && fs.existsSync(pluginDir), pluginDir || 'not found');
check('Built dist/index.js', !!distEntry && fs.existsSync(distEntry), distEntry && fs.existsSync(distEntry) ? 'present' : 'missing — run: npm run build');

let statusLineOk = false, cmd = '(not set)';
try {
  const s = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  statusLineOk = !!s.statusLine;
  cmd = s.statusLine?.command ?? '(not set)';
} catch {}
check('statusLine configured', statusLineOk, cmd);
check('State directory', fs.existsSync(stateDir), fs.existsSync(stateDir) ? 'present' : 'created on first run');

if (!statusLineOk || !distEntry || !fs.existsSync(distEntry)) {
  console.log('\nRun /codeye:setup to configure.');
}
"
```
