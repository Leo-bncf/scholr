import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Legacy standalone TOK page signpost.
 * IB Core has been unified into StudentIBCore under the Hallmark system.
 */
export default function StudentTOK() {
  return <Navigate to="/StudentIBCore?tab=tok" replace />;
}