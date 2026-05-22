#!/usr/bin/env node
/* eslint-disable no-console */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');
const VENV = path.join(BACKEND, '.venv');
const isWindows = process.platform === 'win32';

const venvPython = isWindows
  ? path.join(VENV, 'Scripts', 'python.exe')
  : path.join(VENV, 'bin', 'python');

function step(label) {
  console.log(`\n\x1b[36m▶ ${label}\x1b[0m`);
}

function run(cmd, args, opts = {}) {
  const printable = [cmd, ...args].join(' ');
  console.log(`  $ ${printable}`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  if (result.status !== 0) {
    console.error(`\n\x1b[31m✖ Failed: ${printable}\x1b[0m`);
    process.exit(result.status ?? 1);
  }
}

function findSystemPython() {
  const candidates = isWindows ? ['py', 'python', 'python3'] : ['python3', 'python'];
  for (const cmd of candidates) {
    const r = spawnSync(cmd, ['--version'], { shell: false });
    if (r.status === 0) return cmd;
  }
  console.error(
    '\n\x1b[31mPython 3.10 or later is required.\x1b[0m\n' +
      '  Install from https://www.python.org/downloads/ then re-run `npm install`.',
  );
  process.exit(1);
}

step('Detecting Python');
const systemPython = findSystemPython();
console.log(`  using "${systemPython}"`);

if (!fs.existsSync(venvPython)) {
  step('Creating backend virtual environment');
  run(systemPython, ['-m', 'venv', '.venv'], { cwd: BACKEND });
}

step('Installing backend dependencies');
run(venvPython, ['-m', 'pip', 'install', '--quiet', '--upgrade', 'pip']);
run(venvPython, ['-m', 'pip', 'install', '--quiet', '-r', 'requirements.txt'], { cwd: BACKEND });

step('Applying database migrations');
run(venvPython, ['manage.py', 'migrate', '--verbosity', '1'], { cwd: BACKEND });

step('Installing frontend dependencies');
run('npm', ['install', '--silent', '--no-audit', '--no-fund'], { cwd: FRONTEND, shell: isWindows });

console.log('\n\x1b[32m✓ Setup complete.\x1b[0m Run `npm start` to launch the app.');
