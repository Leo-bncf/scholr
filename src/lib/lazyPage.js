import { lazy } from 'react';

/* name → component, so the sidebar can warm a route without importing it. */
const registry = new Map();

/**
 * A lazily-loaded route you can fetch before it is needed.
 *
 * Every route in this app is code-split, which is why the entry bundle is
 * 228 kB rather than 902. The cost was that clicking a sidebar link you had
 * not visited yet suspended the whole tree: `<Suspense>` sits above the
 * routes, its fallback is `fixed inset-0`, and so the entire application —
 * sidebar included — was replaced by a spinner on a white ground for as long
 * as the chunk took to arrive. Twenty-two pages meant twenty-two of those on
 * a first pass through the product.
 *
 * `React.lazy` gives you no way to start that fetch early. This keeps hold of
 * the importer so callers can: the sidebar warms a route when the pointer
 * touches the link, and warms the whole menu once the browser goes idle. By
 * the time a click lands the module is in memory, `lazy` resolves
 * synchronously, and Suspense never renders at all.
 *
 * `import()` caches, so calling preload twice costs nothing.
 */
export function lazyPage(name, importer) {
  const Component = lazy(importer);
  Component.preload = importer;
  // Self-register. The first version took only the importer and relied on
  // pages.config calling registerPages(PAGES) afterwards — which silently left
  // out the thirty-two routes declared directly in App.jsx, so hovering those
  // links preloaded nothing. Taking the name here makes that impossible.
  registry.set(name, Component);
  return Component;
}

export function registerPages(pages) {
  for (const [name, component] of Object.entries(pages)) registry.set(name, component);
}

/** Start fetching one route's chunk. Safe to call repeatedly. */
export function preloadPage(name) {
  try { registry.get(name)?.preload?.(); } catch { /* offline, or a stale chunk after a deploy */ }
}

/** Warm a whole menu when the browser next goes idle. */
export function preloadPages(names) {
  const run = () => names.forEach(preloadPage);
  if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 1500);
}
