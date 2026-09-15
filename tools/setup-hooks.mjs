#!/usr/bin/env node
// Point git at the tracked .githooks/ directory so the pre-commit/pre-push hooks
// (which keep the generated tool trees in sync with .claude/) are active. Safe to
// run anywhere: a no-op when this isn't a git working tree. Wired to `npm install`
// via the "postinstall" script, and available as `npm run setup:hooks`.

import { execSync } from 'node:child_process';
import fs from 'node:fs';

if (!fs.existsSync('.git')) {
  // Not a git checkout (e.g. installed as a dependency) — nothing to wire.
  process.exit(0);
}
try {
  execSync('git config core.hooksPath .githooks', { stdio: 'ignore' });
  console.log('Git hooks enabled (core.hooksPath = .githooks): trees auto-regenerate on commit.');
} catch {
  console.log('Could not set core.hooksPath (non-fatal). Run `npm run setup:hooks` manually if you want auto-generation.');
}
