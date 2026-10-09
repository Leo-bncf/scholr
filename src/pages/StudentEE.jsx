import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Legacy standalone EE page signpost.
 * IB Core has been unified into StudentIBCore under the Hallmark system.
 */
export default function StudentEE() {
  return <Navigate to="/StudentIBCore?tab=ee" replace />;
}