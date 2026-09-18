const {spawn} = require('node:child_process');
const path = require('node:path');
const root = path.join(__dirname, '..');
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && child.pid) child.kill('SIGTERM');
  }
  process.exitCode = code;
}
function launch(directory, args) {
  const child = spawn(process.execPath, args, {cwd: path.join(root, directory), stdio: 'inherit', windowsHide: true});
  children.push(child);
  child.on('error', error => {console.error(`Could not launch ${directory}: ${error.code || 'startup error'}`);stop(1);});
  child.on('exit', code => {if (!stopping) stop(code || 0);});
}
// Direct Node children avoid Windows npm.cmd and nested watcher process issues.
// Vite provides frontend HMR. Restart this command after backend code changes.
launch('Server', ['src/server.js']);
launch('Client', ['node_modules/vite/bin/vite.js', '--strictPort']);
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
