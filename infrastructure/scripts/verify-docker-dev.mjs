#!/usr/bin/env node
// Starts the dev stack (hot reload), verifies health, then proves a source edit is served live.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const sh = (c) =>
  execSync(c, { stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DEV = 'docker compose -f compose.yaml -f compose.dev.yaml';
const FILE = 'frontend/src/app/api/health/route.ts';

sh(`${DEV} up --build -d`);
const original = readFileSync(FILE, 'utf8');
try {
  let ok = false;
  for (let i = 0; i < 90 && !ok; i++) {
    ok = await fetch('http://localhost:3000/api/health').then(
      (r) => r.ok,
      () => false,
    );
    if (!ok) await sleep(2000);
  }
  if (!ok) throw new Error('dev server never became healthy');
  const cmd = sh("docker inspect -f '{{json .Config.Cmd}}' tunetracker2-app-1");
  if (!cmd.includes('"dev"')) throw new Error(`not running next dev: ${cmd}`);

  writeFileSync(FILE, original.replace("service: 'tunetracker'", "service: 'tunetracker-hot-reload'"));
  let reloaded = false;
  for (let i = 0; i < 30 && !reloaded; i++) {
    await sleep(1000);
    reloaded = (
      await fetch('http://localhost:3000/api/health').then(
        (r) => r.text(),
        () => '',
      )
    ).includes('hot-reload');
  }
  if (!reloaded) throw new Error('source edit was not picked up (hot reload)');
  console.log('healthy, next dev, hot reload confirmed');
  console.log('DOCKER_DEV_OK');
} finally {
  writeFileSync(FILE, original);
}
