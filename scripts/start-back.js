#!/usr/bin/env node
/* eslint-disable no-console */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const BACKEND = path.join(ROOT, 'backend');
const isWindows = process.platform === 'win32';
const venvPython = isWindows
  ? path.join(BACKEND, '.venv', 'Scripts', 'python.exe')
  : path.join(BACKEND, '.venv', 'bin', 'python');

if (!fs.existsSync(venvPython)) {
  console.error(
    '\nBackend venv not found. Run `npm install` (or `npm run setup`) first.',
  );
  process.exit(1);
}

const child = spawn(venvPython, ['manage.py', 'runserver', '3000'], {
  cwd: BACKEND,
  stdio: 'inherit',
});

const forward = (sig) => () => child.kill(sig);
process.on('SIGINT', forward('SIGINT'));
process.on('SIGTERM', forward('SIGTERM'));
child.on('exit', (code) => process.exit(code ?? 0));
