#!/usr/bin/env node
// Every non-merge commit after the legacy baseline must follow Conventional Commits.
import { execSync } from 'node:child_process';

const re = /^(feat|fix|refactor|style|test|docs|build|ci|chore|perf|revert)(\([a-z0-9-]+\))?!?: .+/;
const subjects = execSync('git log --no-merges --format=%s legacy-baseline..HEAD', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);
const bad = subjects.filter((s) => !re.test(s));
if (bad.length || subjects.length === 0) {
  console.error(bad.length ? `Non-conventional:\n${bad.join('\n')}` : 'no commits found');
  process.exit(1);
}
console.log(`${subjects.length} commits checked`);
console.log('COMMITS_OK');
