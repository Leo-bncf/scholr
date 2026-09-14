import { useEffect } from 'react';

/**
 * Pin the document to the light palette for as long as this component is
 * mounted, then put back whatever was there before.
 *
 * The public site and the signed-out auth screens are light on purpose — the
 * product captures on them are light, and a light screenshot on a dark ground
 * reads as a mistake. Someone who chose dark in Settings keeps it in the app;
 * this only covers the marketing and auth surfaces.
 *
 * Both flags have to move together. This used to set data-theme alone, which
 * left Tailwind's `dark:` variants and the shadcn variables (they read the
 * CLASS) dark on an otherwise light page — dark Cards and Inputs on white.
 */
export default function useLightTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.dataset.theme;
    const wasDarkClass = root.classList.contains('dark');

    root.dataset.theme = 'light';
    root.classList.remove('dark');

    return () => {
      if (previousTheme === undefined) delete root.dataset.theme;
      else root.dataset.theme = previousTheme;
      root.classList.toggle('dark', wasDarkClass);
    };
  }, []);
}
