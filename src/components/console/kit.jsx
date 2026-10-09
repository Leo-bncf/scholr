// The console's shared parts: the mark, a page head, a section, the readout
// strip, a state chip, a meter, a dialog and a toast stack.
//
// They live in one file because they are small and always used together;
// splitting a twelve-line component into its own module buys nothing but
// import lines.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

/* The Scholr mark, drawn rather than shipped as a bitmap: a rounded green
   tile holding an open book as two leaves, with the fore-edge left white.
   Green and white, which is the whole identity. */
export function Mark({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Scholr" focusable="false">
      <rect width="48" height="48" rx="12" fill="#044f36" />
      <path d="M24 15.5c-3.2-2.1-6.6-2.9-10.5-2.6v18.9c3.9-.3 7.3.5 10.5 2.6 3.2-2.1 6.6-2.9 10.5-2.6V12.9c-3.9-.3-7.3.5-10.5 2.6z"
        fill="#fdfefd" />
      <path d="M24 15.5v18.9" stroke="#044f36" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17.5 19.5c1.4-.2 2.8-.1 4.2.4M17.5 24.2c1.4-.2 2.8-.1 4.2.4M26.3 19.9c1.4-.5 2.8-.6 4.2-.4M26.3 24.6c1.4-.5 2.8-.6 4.2-.4"
        stroke="#6fb493" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** A page: the title, the rule, and the body. The mark sits top right,
    where a product puts its own name on a page it owns. */
export function Head({ title, children }) {
  return (
    <>
      <header className="cons__head">
        <div><h1>{title}</h1></div>
        <Mark />
      </header>
      <div className="cons__hr" />
      <div className="cons__page">{children}</div>
    </>
  );
}

export function Sec({ title, meta, action, children }) {
  return (
    <section className="cons__sec">
      {(title || meta || action) && (
        <div className="cons__sech">
          {title && <h2>{title}</h2>}
          {meta && <span className="meta">{meta}</span>}
          {action && <span className="act">{action}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

/** A readout strip. `items` is [{ label, value, unit, sub, state }]. */
export function Figs({ items }) {
  return (
    <dl className="cons__figs">
      {items.map((f) => (
        <div key={f.label} className={`cons__fig${f.state ? ` is-${f.state}` : ''}`}>
          <dd>{f.value}{f.unit && <small> {f.unit}</small>}</dd>
          <dt>{f.label}</dt>
          {f.sub && <span className="sub">{f.sub}</span>}
        </div>
      ))}
    </dl>
  );
}

/** A state. `ok` is deliberately quiet: a column where every row glows
    green hides the one row that does not. */
export function St({ level = 'idle', children }) {
  return <span className={`cons__st ${level}`}>{children}</span>;
}

export function Skel({ label = 'Loading' }) {
  return <p className="cons__load"><i aria-hidden="true" />{label}…</p>;
}

/* A capacity against a ceiling. `over` is passed rather than derived so the
   caller decides what counts as over — a student cap and a disk are not the
   same question. */
export function Meter({ value, max, over }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <span className={`cons__m${over ? ' over' : ''}`} title={`${value} of ${max}`}>
      <i style={{ width: `${pct}%` }} />
    </span>
  );
}

export function Field({ label, children }) {
  return <label className="cons__f"><span>{label}</span>{children}</label>;
}

/* ── Dialog ──────────────────────────────────────────────────────────
   Escape closes, focus moves into the panel on open and returns to the
   trigger on close, and a click on the scrim behind it closes too. The
   console suspends schools and changes what one is billed, so the
   confirmation is part of the product rather than the browser's own grey
   confirm box. */
export function Dialog({ title, meta, onClose, footer, wide, children }) {
  const ref = React.useRef(null);
  const returnTo = React.useRef(null);

  useEffect(() => {
    returnTo.current = document.activeElement;
    const el = ref.current;
    if (el) {
      const first = el.querySelector('input, select, textarea, button');
      (first || el).focus?.();
    }
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      returnTo.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="cons__scrim" role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`cons__dlg${wide ? ' cons__dlg--wide' : ''}`} role="dialog"
        aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}>
        <header>
          <h2>{title}</h2>
          {meta && <span className="meta">{meta}</span>}
          <button type="button" className="x" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

/* ── Toasts ──────────────────────────────────────────────────────────
   The console's own, rather than the app's, because the app's sit in a
   different design world and this panel is deliberately sealed off. */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function Toasts({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((text, level = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems((xs) => [...xs, { id, text, level }]);
    // A failure stays until it is dismissed: an error that vanishes after
    // four seconds is an error nobody read.
    if (level === 'ok') setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4200);
  }, []);

  const drop = (id) => setItems((xs) => xs.filter((x) => x.id !== id));

  return (
    <ToastCtx.Provider value={push}>
      {children}
      {items.length > 0 && (
        <div className="cons__toasts" role="status" aria-live="polite">
          {items.map((t) => (
            <div key={t.id} className={`cons__toast${t.level === 'bad' ? ' bad' : ''}`}>
              <span>{t.text}</span>
              <button type="button" onClick={() => drop(t.id)} aria-label="Dismiss">×</button>
            </div>
          ))}
        </div>
      )}
    </ToastCtx.Provider>
  );
}
