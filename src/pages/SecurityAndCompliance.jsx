import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Kept only so existing links and bookmarks don't 404.
 *
 * There were two security pages saying different things, and the header and
 * the footer each linked to a different one. /Security is the surviving page.
 */
export default function SecurityAndCompliance() {
  return <Navigate to="/Security" replace />;
}
