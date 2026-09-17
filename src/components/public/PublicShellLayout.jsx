import React from 'react';
import { useOutlet } from 'react-router-dom';
import PublicShell from './PublicShell';

/**
 * The element for the public pages' shared layout route (see App.jsx).
 *
 * Every public page used to wrap itself in <PublicShell>, which meant
 * PublicShell — nav, background glow, footer — fully unmounted and
 * remounted on every navigation between them, since React Router swapped
 * between entirely separate <Route element> trees. That's what caused the
 * glow's entrance animation to replay (a visible stutter) on every page
 * load, and it also ruled out an actual page-transition animation, since
 * there was never a persistent parent to animate the outgoing/incoming
 * content within.
 *
 * `useOutlet()`, not `<Outlet />` — this bit, and it's worth recording why.
 * `<Outlet />` is a live component: it stays subscribed to router state for
 * as long as it's mounted, including while PublicShell's AnimatePresence is
 * holding the "exiting" page mounted to animate it out. So the exiting
 * page's own <Outlet /> would re-render to the NEW route mid-fade — the
 * outgoing page silently turned into the incoming page while animating
 * away, then vanished, and the real incoming element never got its own
 * enter animation. Confirmed by sampling: the "exiting" wrapper's text
 * content was already the new page's, fading 1 -> 0, then nothing.
 * `useOutlet()` instead captures a plain, frozen React element for the
 * CURRENT match at render time — no ongoing subscription — so the old
 * element AnimatePresence is holding onto during exit stays the old page.
 */
export default function PublicShellLayout() {
  const outlet = useOutlet();
  return <PublicShell>{outlet}</PublicShell>;
}
