/* One place that decides what "dark" means to the DOM.
 *
 * Two things have to be stamped, because two stylesheets read two different
 * selectors:
 *   · the `dark` CLASS   — Tailwind's `dark:` variants and the shadcn
 *                          variables in src/index.css
 *   · data-theme="dark"  — the token layer in src/styles/scholr-theme.css
 *
 * This used to live twice, inline, in Layout.jsx and PersonalSettings.jsx, and
 * both copies set only the class. Choosing dark therefore produced a half-dark
 * page: shadcn Cards and Inputs went dark while --paper, --ink and the sidebar
 * stayed light. Stamping both, from one function, is what stops that.
 *
 * Neither selector keys off prefers-color-scheme. Dark is a choice made in
 * Settings, not a guess made from the operating system.
 */

const STORAGE_KEY = 'theme';

export function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light'; // private browsing, or storage disabled
  }
}

export function applyTheme(theme) {
  const dark = theme === 'dark';
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  if (dark) root.setAttribute('data-theme', 'dark');
  else root.setAttribute('data-theme', 'light');
  try {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  } catch {
    /* not worth failing a render over */
  }
}
