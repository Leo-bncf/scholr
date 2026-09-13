#!/usr/bin/env node
/**
 * Regenerate the product screenshots used on the public site.
 *
 *   npm run shots
 *
 * Starts a dev server, renders each screen defined in src/marketing/shots.jsx
 * with a headless browser, and writes public/marketing/<name>.png.
 *
 * Run it whenever the dashboards change appearance. The alternative — taking
 * screenshots by hand — is how a marketing site ends up showing a version of
 * the product that no longer exists.
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import puppeteer from 'puppeteer';

const PORT = 5178;
const SHOTS = [
  { name: 'teacher-dashboard', width: 1320, height: 840 },
  { name: 'coordinator-cohort', width: 1320, height: 840 },
  { name: 'parent-portal', width: 1320, height: 840 },
  { name: 'admin-operations', width: 1320, height: 840 },
];

const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const stop = () => { try { vite.kill(); } catch { /* already gone */ } };
process.on('exit', stop);
process.on('SIGINT', () => { stop(); process.exit(1); });

try {
  // Wait for the server rather than guessing at a sleep duration.
  let up = false;
  for (let i = 0; i < 60 && !up; i++) {
    await sleep(500);
    up = await fetch(`http://localhost:${PORT}/shots.html`).then(r => r.ok).catch(() => false);
  }
  if (!up) throw new Error(`dev server never came up on :${PORT}`);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  // Always shoot in light mode: these sit on a light marketing page.
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);

  for (const shot of SHOTS) {
    const errors = [];
    page.removeAllListeners('pageerror');
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewport({ width: shot.width, height: shot.height, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${PORT}/shots.html?shot=${shot.name}`, { waitUntil: 'networkidle0', timeout: 60000 });
    await sleep(1200);
    if (errors.length) throw new Error(`${shot.name} rendered with errors: ${errors.join(' | ')}`);
    await page.screenshot({ path: `public/marketing/${shot.name}.png` });
    console.log(`  wrote public/marketing/${shot.name}.png`);
  }

  await browser.close();
} finally {
  stop();
}
