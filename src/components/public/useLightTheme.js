import { useEffect } from 'react';

/**
 * Pin the document to the light palette for as long as this component is
 * mounted, then put the flag back.
 *
 * The public site and the signed-out auth screens are light on purpose — the
 * product captures on them are light, and a light screenshot on a dark ground
 * reads as a mistake. The signed-in app keeps its dark mode, so this restores
 * whatever it found on the way out.
 */
export default function useLightTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.theme;
    root.dataset.theme = 'light';
    return () => {
      if (previous === undefined) delete root.dataset.theme;
      else root.dataset.theme = previous;
    };
  }, []);
}
