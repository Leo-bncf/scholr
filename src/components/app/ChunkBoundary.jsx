import React from 'react';

/**
 * Catches the one error that turns the whole app white.
 *
 * Every route is a dynamic `import()`. When a deploy publishes new chunk
 * hashes, any browser still holding the previous `index.html` — an open tab,
 * a back-forward cache entry, a page restored on wake — asks for a file that
 * no longer exists. The import rejects, React unmounts the tree, and the user
 * is left with a blank page and no way to understand it. Reloading fixes it
 * instantly, which is why it is so easy to dismiss as "worked for me".
 *
 * So: catch it, and reload once. A stale document fetching a fresh one is
 * exactly the right response, and it is invisible — the page simply appears.
 *
 * The sessionStorage flag is what keeps this from becoming a reload loop. If
 * the second attempt fails too, the chunk is genuinely gone rather than stale,
 * and that case gets words instead of another reload.
 */
const RELOADED = 'chunk-reloaded';

// Every browser words this differently, and none of them use an error code.
function isStaleChunk(error) {
  const text = `${error?.name ?? ''} ${error?.message ?? ''}`;
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Failed to fetch/i
    .test(text);
}

export default class ChunkBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, stale: false };
  }

  static getDerivedStateFromError(error) {
    return { failed: true, stale: isStaleChunk(error) };
  }

  componentDidCatch(error) {
    if (!isStaleChunk(error)) return;
    let already = false;
    try {
      already = sessionStorage.getItem(RELOADED) === '1';
      sessionStorage.setItem(RELOADED, '1');
    } catch {
      // Private mode, or storage disabled. Without the flag a reload could
      // loop, so prefer showing the message to risking that.
      already = true;
    }
    if (!already) window.location.reload();
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div role="alert" style={{
        minHeight: '60vh', display: 'grid', placeItems: 'center',
        padding: '2rem', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '28rem' }}>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 .5rem' }}>
            {this.state.stale ? 'This page is out of date' : 'Something broke on this page'}
          </h1>
          <p style={{ margin: '0 0 1rem', color: '#4b5563', fontSize: '.875rem', lineHeight: 1.5 }}>
            {this.state.stale
              ? 'A new version of Scholr was published while this tab was open, so part of it could not load. Reloading picks up the new one.'
              : 'Reloading usually clears it. If it keeps happening, tell us what you were doing and we will look.'}
          </p>
          <button type="button" onClick={() => window.location.reload()} style={{
            font: 'inherit', fontWeight: 600, cursor: 'pointer', padding: '.5rem 1rem',
            background: '#044f36', color: '#fff', border: 0, borderRadius: '.375rem',
          }}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}
