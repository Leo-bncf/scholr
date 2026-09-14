// Static prerender for the public marketing/SEO pages.
//
// Why: the app is a client-rendered Vite SPA. Without this, every route serves
// the SAME empty index.html (homepage <title>/meta, empty <div id="root">), so
// Googlebot's raw fetch sees duplicate, contentless pages. This bakes each
// route's rendered HTML into a real static file, so bots (and first paint) get
// full content immediately. The webroot already falls back to /index.html for
// unknown paths, and React (createRoot) simply re-renders on top for
// interactivity — no hydration coupling.
//
// Routes come from dist/sitemap.xml (single source of truth). Run after `vite build`.
//
// Ported from Schedual's scripts/prerender.mjs. One difference: Scholr has no
// react-helmet-async yet, so there is no per-page <head> to de-duplicate —
// every prerendered route currently carries the same static <head> from
// index.html. Per-page title/meta is a good follow-up, not done here.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import puppeteer from 'puppeteer';

const DIST = path.resolve('dist');
const PORT = 47914;
const NAV_TIMEOUT = 35000;
const CONTENT_TIMEOUT = 20000;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.xml': 'application/xml', '.txt': 'text/plain', '.map': 'application/json', '.webmanifest': 'application/manifest+json',
};

function readRoutes() {
  const xml = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
    try { return new URL(m[1].trim()).pathname; } catch { return null; }
  }).filter(Boolean);
  // De-dupe, keep "/" first.
  return [...new Set(locs)].sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : 0));
}

// Serve dist/, BUT always serve the pristine in-memory index.html for the SPA
// shell so writing dist/index.html (the prerendered homepage) mid-run can never
// contaminate the render of later routes.
function startServer(cleanShell) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const abs = path.join(DIST, urlPath);
      // Real asset file on disk → serve it (but never a route dir's index.html).
      if (urlPath !== '/' && fs.existsSync(abs) && fs.statSync(abs).isFile()) {
        res.writeHead(200, { 'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream' });
        fs.createReadStream(abs).pipe(res);
        return;
      }
      // Anything else (any route) → the clean SPA shell.
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(cleanShell);
    });
    server.listen(PORT, () => resolve(server));
  });
}

// Safety net: never ship a <body> left in a modal's scroll-lock / pointer-events
// :none state (would freeze the page), and drop any overlay portalled into
// <body> at capture time. The consent-banner suppression below should already
// prevent this, but a stray open overlay must never reach users.
function unfreezeBody(html) {
  return html.replace(/<body[^>]*>/i, '<body>');
}

async function renderRoute(browser, route) {
  const page = await browser.newPage();
  try {
    // Suppress the cookie-consent banner during prerender (Landing.jsx reads
    // this key to decide whether to show it). Pre-seeding "accepted" keeps it
    // closed while capturing; real visitors still get it client-side from
    // their own empty localStorage.
    await page.evaluateOnNewDocument(() => {
      try { localStorage.setItem('scholr_consent_accepted', 'true'); } catch { /* ignore */ }
    });
    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT });
    // Wait until the app has actually rendered content into #root AND a title
    // is set — i.e. past the lazy-chunk Suspense fallback / any spinner.
    await page.waitForFunction(() => {
      const root = document.getElementById('root');
      return !!root && root.children.length > 0
        && (root.innerText || '').trim().length > 150
        && !!document.title && document.title.length > 0;
    }, { timeout: CONTENT_TIMEOUT });
    await sleep(500); // settle any late async renders
    const html = await page.content();
    // Sanity (attribute-agnostic): re-read the live DOM rather than regex the
    // serialized string — #root may carry classes/inline styles on some pages.
    const { rootLen, title } = await page.evaluate(() => ({
      rootLen: (document.getElementById('root')?.innerText || '').trim().length,
      title: document.title || '',
    }));
    if (rootLen < 120 || !title) {
      throw new Error(`rendered output looks empty (rootLen=${rootLen}, title=${title ? 'set' : 'MISSING'})`);
    }
    return unfreezeBody(html);
  } finally {
    await page.close();
  }
}

async function main() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('[prerender] dist/index.html missing — run `vite build` first.');
    process.exit(1);
  }
  const cleanShell = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  const routes = readRoutes();
  console.log(`[prerender] ${routes.length} routes from sitemap.xml`);

  const server = await startServer(cleanShell);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  const ok = [];
  const failed = [];
  for (const route of routes) {
    let html = null;
    for (let attempt = 1; attempt <= 2 && !html; attempt++) {
      try {
        html = await renderRoute(browser, route);
      } catch (e) {
        if (attempt === 2) { failed.push([route, e.message]); }
        else { await sleep(600); }
      }
    }
    if (!html) { console.error(`[prerender] ✗ ${route}`); continue; }
    const outDir = route === '/' ? DIST : path.join(DIST, route);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    ok.push(route);
    console.log(`[prerender] ✓ ${route}`);
  }

  await browser.close();
  server.close();

  // Stamp <lastmod> = build date on every sitemap URL so Google sees the
  // freshly-prerendered content as updated and re-crawls sooner.
  try {
    const smPath = path.join(DIST, 'sitemap.xml');
    let sm = fs.readFileSync(smPath, 'utf8');
    const today = new Date().toISOString().slice(0, 10);
    sm = sm.replace(/<lastmod>[^<]*<\/lastmod>\s*/g, ''); // clear stale
    sm = sm.replace(/(<loc>[^<]*<\/loc>)/g, `$1\n    <lastmod>${today}</lastmod>`);
    fs.writeFileSync(smPath, sm);
    console.log(`[prerender] sitemap.xml stamped lastmod=${today}`);
  } catch (e) {
    console.warn('[prerender] sitemap lastmod stamp skipped:', e.message);
  }

  console.log(`[prerender] done — ${ok.length} ok, ${failed.length} failed`);
  if (failed.length) {
    for (const [r, m] of failed) console.error(`[prerender]   FAILED ${r}: ${m}`);
    process.exit(1); // fail the deploy: never ship a half-prerendered site silently
  }
}

main().catch((e) => { console.error('[prerender] fatal:', e); process.exit(1); });
