const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
function check(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) check(file);
    else if (/\.(js|cjs)$/.test(file)) {
      const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit', windowsHide: true });
      if (result.status !== 0) process.exit(result.status || 1);
    }
  }
}
for (const dir of ['src', 'scripts', 'test']) check(join(__dirname, '..', dir));
console.log('Server JavaScript syntax checks passed.');
