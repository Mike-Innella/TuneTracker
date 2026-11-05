#!/usr/bin/env node
// Builds and starts the production stack, then asserts health, non-root user and a rendered page.
import { execSync } from 'node:child_process';

const sh = (c) =>
  execSync(c, { stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

sh('docker compose up -d --build');
let health = '';
for (let i = 0; i < 60 && health !== 'healthy'; i++) {
  health = sh("docker inspect -f '{{.State.Health.Status}}' tunetracker2-app-1");
  if (health !== 'healthy') await sleep(2000);
}
if (health !== 'healthy') throw new Error(`app container is ${health}`);
const user = sh('docker exec tunetracker2-app-1 id -u');
if (user === '0') throw new Error('production container runs as root');
const migrate = sh("docker inspect -f '{{.State.ExitCode}}' tunetracker2-migrate-1");
if (migrate !== '0') throw new Error(`migrations exited ${migrate}`);
const html = await (await fetch('http://localhost:3000/')).text();
if (!html.includes('TuneTracker')) throw new Error('homepage did not render');
console.log(`uid=${user} health=${health} migrate=0`);
console.log('DOCKER_PROD_OK');
