import { useEffect } from 'react';

/**
 * Per-page title, description and canonical.
 *
 * The app is a single-page bundle, so every route served the same
 * `<title>Scholr — LMS for IB World Schools</title>` and no description at all.
 * That is one title and zero descriptions across the whole public site.
 *
 * This is not a substitute for prerendering — a crawler that doesn't run
 * JavaScript still sees the shell. Schedual solved that with a Puppeteer pass
 * at build time (scripts/prerender.mjs on the erik/seo-prerender branch); the
 * same treatment belongs here once these pages settle.
 */
function tag(selector, create) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

export default function Seo({ title, description, canonical }) {
  useEffect(() => {
    const full = title ? `${title} · Scholr` : 'Scholr — school management for international schools';
    document.title = full;

    if (description) {
      const meta = tag('meta[name="description"]', () => {
        const m = document.createElement('meta');
        m.setAttribute('name', 'description');
        return m;
      });
      meta.setAttribute('content', description);

      const og = tag('meta[property="og:description"]', () => {
        const m = document.createElement('meta');
        m.setAttribute('property', 'og:description');
        return m;
      });
      og.setAttribute('content', description);
    }

    const ogt = tag('meta[property="og:title"]', () => {
      const m = document.createElement('meta');
      m.setAttribute('property', 'og:title');
      return m;
    });
    ogt.setAttribute('content', full);

    if (canonical) {
      const link = tag('link[rel="canonical"]', () => {
        const l = document.createElement('link');
        l.setAttribute('rel', 'canonical');
        return l;
      });
      link.setAttribute('href', `https://scholr.pro${canonical}`);
    }
  }, [title, description, canonical]);

  return null;
}
