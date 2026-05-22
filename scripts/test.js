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
  console.error('\nBackend venv not found. Run `npm install` first.');
  process.exit(1);
}

const child = spawn(venvPython, ['-m', 'pytest', 'tests/', '-v', ...process.argv.slice(2)], {
  cwd: BACKEND,
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code ?? 0));
