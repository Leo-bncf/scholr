#!/usr/bin/env node
/**
 * Generate public/sitemap.xml and public/robots.txt.
 *
 * Generated rather than hand-maintained, because a sitemap that lists a route
 * which no longer exists is worse than no sitemap. The list below is checked
 * against pages.config.js at build time — a URL here with no route fails the
 * script rather than shipping a 404 to a crawler.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const PUBLIC_ROUTES = [
  ['/', 1.0],
  ['/Features', 0.9],
  ['/Pricing', 0.9],
  ['/ib-school-management-software', 0.9],
  ['/igcse-school-management-software', 0.8],
  ['/a-level-school-management-software', 0.8],
  ['/us-school-management-software', 0.8],
  ['/Security', 0.7],
  ['/Schedual', 0.7],
  ['/FAQ', 0.7],
  ['/About', 0.6],
  ['/BookDemo', 0.6],
  ['/Contact', 0.5],
  ['/PrivacyPolicy', 0.3],
  ['/TermsOfService', 0.3],
];

// Routes live in two places: most are registered in pages.config.js, but a
// handful (the legal pages, the super-admin detail routes) are declared
// explicitly in App.jsx. Check both, or the guard fires on real pages.
const config = readFileSync('src/pages.config.js', 'utf8');
const app = readFileSync('src/App.jsx', 'utf8');
const registered = new Set([
  ...[...config.matchAll(/^\s*"([^"]+)":/gm)].map(m => m[1]),
  ...[...app.matchAll(/path="\/([^"/:]+)"/g)].map(m => m[1]),
]);
const missing = PUBLIC_ROUTES
  .map(([p]) => p)
  .filter(p => p !== '/' && !registered.has(p.slice(1)));
if (missing.length) {
  console.error(`sitemap lists routes that are not registered in pages.config.js: ${missing.join(', ')}`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const urls = PUBLIC_ROUTES.map(([path, priority]) =>
  `  <url>\n    <loc>https://scholr.pro${path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority.toFixed(1)}</priority>\n  </url>`,
).join('\n');

writeFileSync('public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);

writeFileSync('public/robots.txt',
  [
    'User-agent: *',
    'Allow: /',
    '',
    '# Signed-in application routes carry no public content and should not be',
    '# crawled; they all redirect to the login page anyway.',
    'Disallow: /AppHome',
    'Disallow: /SuperAdmin',
    'Disallow: /SchoolAdmin',
    'Disallow: /Teacher',
    'Disallow: /Student',
    'Disallow: /Parent',
    'Disallow: /Coordinator',
    'Disallow: /Class',
    'Disallow: /Login',
    '',
    'Sitemap: https://scholr.pro/sitemap.xml',
    '',
  ].join('\n'));

console.log(`  wrote public/sitemap.xml (${PUBLIC_ROUTES.length} urls) and public/robots.txt`);
