import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * A product screenshot that expands into a full-screen zoom on click.
 *
 * Uses framer-motion's `layoutId` (the same shared-element technique
 * src/components/ui/expandable-card.jsx already uses elsewhere in this
 * project) so the thumbnail visibly grows into the zoomed position rather
 * than the zoomed view just fading in over it — but rebuilt here against
 * the site's own tokens instead of that component's hardcoded Tailwind
 * slate/white palette, since this needed to sit on Scholr's own pages.
 *
 * `prefers-reduced-motion` drops the layoutId match entirely (motion.md:
 * spatial motion collapses to an opacity crossfade, not just a faster
 * version of the same movement) and `inert` on the page content while
 * open gives a real focus trap + hides the rest of the page from
 * assistive tech, without hand-rolling one.
 *
 * Portals into #root, not document.body. React 17+ delegates synthetic
 * events to the root container element, not to `document` — a portal
 * target outside that container (document.body is a DOM *sibling* of
 * #root, not a descendant) never has its native clicks bubble through
 * #root, so onClick handlers on portaled content silently never fire.
 * Confirmed empirically: the native click event lands on the backdrop
 * div, but React's onClick doesn't run. Inert then targets .scholr-page
 * specifically rather than #root, since the portal now lives inside
 * #root too and inerting #root would disable this modal along with
 * everything else.
 */
export default function ZoomableShot({ src, alt, width, height }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const reduced = useReducedMotion();
  const layoutId = reduced ? undefined : `zoomable-shot-${id}`;

  useEffect(() => {
    if (!open) return undefined;

    const page = document.querySelector('.scholr-page');
    page?.setAttribute('inert', '');
    page?.setAttribute('aria-hidden', 'true');
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      page?.removeAttribute('inert');
      page?.removeAttribute('aria-hidden');
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <motion.button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen(true)}
        aria-label={`Zoom in on ${alt}`}
        whileHover={reduced ? undefined : { scale: 1.015 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'block', width: '100%', padding: 0, margin: 0,
          border: 'none', background: 'none', cursor: 'zoom-in',
        }}
      >
        <motion.img
          layoutId={layoutId}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          style={{
            width: '100%', height: 'auto', display: 'block',
            border: '1px solid var(--rule)', borderRadius: '4px',
          }}
        />
      </motion.button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <React.Fragment key="zoom-layer">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0.15 : 0.25 }}
                onClick={() => setOpen(false)}
                aria-hidden="true"
                style={{
                  position: 'fixed', inset: 0, zIndex: 100,
                  background: 'color-mix(in oklab, var(--ink) 70%, transparent)',
                }}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label={alt}
                style={{
                  position: 'fixed', inset: 0, zIndex: 101,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 'var(--space-lg)', pointerEvents: 'none',
                }}
              >
                <motion.img
                  layoutId={layoutId}
                  initial={reduced ? { opacity: 0 } : undefined}
                  animate={reduced ? { opacity: 1 } : undefined}
                  exit={reduced ? { opacity: 0 } : undefined}
                  transition={
                    reduced
                      ? { duration: 0.15 }
                      : { type: 'spring', stiffness: 300, damping: 30 }
                  }
                  src={src}
                  alt=""
                  onClick={() => setOpen(false)}
                  style={{
                    maxWidth: '90vw', maxHeight: '86vh', width: 'auto', height: 'auto',
                    borderRadius: 'var(--radius-surface)',
                    boxShadow: 'var(--lift-lg)',
                    pointerEvents: 'auto',
                    cursor: 'zoom-out',
                  }}
                />
              </div>
              <button
                type="button"
                ref={closeRef}
                onClick={() => setOpen(false)}
                aria-label="Close zoomed image"
                className="scholr-focus"
                style={{
                  position: 'fixed', top: 'var(--space-md)', right: 'var(--space-md)', zIndex: 102,
                  width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--surface)', border: '1px solid var(--rule)',
                  borderRadius: 'var(--radius-control)', cursor: 'pointer', color: 'var(--ink)',
                }}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </React.Fragment>
          )}
        </AnimatePresence>,
        document.getElementById('root'),
      )}
    </>
  );
}
