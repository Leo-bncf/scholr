/**
 * Deployment Status & Readiness Dashboard
 * Shows current deployment readiness and alerts for issues
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as fns from '@/data/functions';
import {
  CheckCircle2,
  AlertCircle,
  Server,
} from 'lucide-react';

export default function DeploymentStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDeploymentStatus = async () => {
      try {
        const response = await fns.invoke('deploymentReady');
        setStatus(response);
      } catch (error) {
        console.error('Failed to check deployment status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkDeploymentStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-slate-600">Checking deployment readiness...</p>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  const getStatusColor = (ready) => {
    return ready
      ? 'bg-emerald-50 border-emerald-200'
      : 'bg-red-50 border-red-200';
  };

  const getStatusIcon = (ready) => {
    return ready ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
    ) : (
      <AlertCircle className="w-5 h-5 text-red-600" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card className={getStatusColor(status.readyForDeployment)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(status.readyForDeployment)}
              Deployment Readiness
            </CardTitle>
            <Badge
              className={
                status.readyForDeployment
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {status.readyForDeployment ? 'Ready' : 'Not Ready'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Environment Check */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-600" />
                <span className="font-semibold text-sm text-slate-900">
                  Environment Configuration
                </span>
              </div>
              <Badge
                className={
                  status.checks.environment.status === 'pass'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }
              >
                {status.checks.environment.status}
              </Badge>
            </div>
            {status.checks.environment.missing.length > 0 && (
              <ul className="text-xs text-red-700 space-y-1 pl-6">
                {status.checks.environment.missing.map((envVar) => (
                  <li key={envVar}>• {envVar} - Missing</li>
                ))}
              </ul>
            )}
          </div>

          {/* Node Environment */}
          <div className="flex items-center justify-between p-3 bg-slate-100/50 rounded-lg">
            <span className="text-sm font-medium text-slate-700">
              Node Environment
            </span>
            <Badge variant="outline">
              {status.checks.nodeEnvironment.value}
            </Badge>
          </div>

          {/* Errors */}
          {status.errors.length > 0 && (
            <div className="p-3 bg-red-100 rounded-lg">
              <h4 className="text-sm font-semibold text-red-900 mb-2">
                Critical Issues
              </h4>
              <ul className="space-y-1">
                {status.errors.map((error, idx) => (
                  <li key={idx} className="text-xs text-red-800">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {status.warnings.length > 0 && (
            <div className="p-3 bg-amber-100 rounded-lg">
              <h4 className="text-sm font-semibold text-amber-900 mb-2">
                Warnings
              </h4>
              <ul className="space-y-1">
                {status.warnings.map((warning, idx) => (
                  <li key={idx} className="text-xs text-amber-800">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs text-slate-600 mt-4">
            Last checked: {new Date(status.timestamp).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}