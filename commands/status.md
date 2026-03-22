# codeye:status

Shows the current codeye configuration and verifies the installation is working correctly.

```bash
node -e "
const fs = require('fs');
const path = require('path');
const os = require('os');

const pluginDir  = path.join(os.homedir(), '.claude', 'plugins', 'codeye');
const distEntry  = path.join(pluginDir, 'dist', 'index.js');
const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
const stateDir   = path.join(pluginDir, 'state');

const check = (label, ok, detail) => {
  const icon = ok ? '✅' : '❌';
  console.log(detail ? icon + ' ' + label + ': ' + detail : icon + ' ' + label);
};

console.log('codeye status\n' + '─'.repeat(40));
check('Plugin directory', fs.existsSync(pluginDir), pluginDir);
check('Built dist/index.js', fs.existsSync(distEntry), fs.existsSync(distEntry) ? 'present' : 'missing — run: npm run build');

let statusLineOk = false, cmd = '(not set)';
try {
  const s = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  statusLineOk = !!s.statusLine;
  cmd = s.statusLine?.command ?? '(not set)';
} catch {}
check('statusLine configured', statusLineOk, cmd);
check('State directory', fs.existsSync(stateDir), fs.existsSync(stateDir) ? 'present' : 'created on first run');

if (!statusLineOk || !fs.existsSync(distEntry)) {
  console.log('\nRun /codeye:setup to configure.');
}
"
```
