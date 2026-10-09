import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Legacy standalone CAS page signpost.
 * IB Core has been unified into StudentIBCore under the Hallmark system.
 */
export default function StudentCAS() {
  return <Navigate to="/StudentIBCore?tab=cas" replace />;
}