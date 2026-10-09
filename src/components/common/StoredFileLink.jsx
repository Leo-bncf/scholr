import React, { useState } from 'react';
import { openStored, parseStored } from '@/data/storage';

/**
 * A link to an uploaded file or an ordinary URL.
 *
 * Uploaded files are stored as references, not as URLs (see storage.js), so
 * the href is resolved to a fresh signed link at click time. Ordinary links
 * render as a plain anchor.
 */
const StoredFileLink = React.forwardRef(function StoredFileLink({ href, children, title, onClick, ...rest }, ref) {
  const [failed, setFailed] = useState(false);

  if (!parseStored(href)) {
    return (
      <a ref={ref} href={href} target="_blank" rel="noopener noreferrer" title={title} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <a
      ref={ref}
      {...rest}
      href={href}
      title={failed ? 'This file could not be opened — it may have been removed.' : title}
      onClick={(e) => {
        onClick?.(e);
        e.preventDefault();
        setFailed(false);
        openStored(href).catch(() => setFailed(true));
      }}
    >
      {children}
    </a>
  );
});

export default StoredFileLink;
