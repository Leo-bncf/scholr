/**
 * Environment Status Overview
 * Shows current environment configuration and critical settings
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function EnvironmentStatus() {
  const [envStatus, setEnvStatus] = useState(null);

  useEffect(() => {
    // Gather environment information from what we can detect
    const status = {
      nodeEnv: import.meta.env.MODE || 'unknown',
      isProduction: import.meta.env.MODE === 'production',
      timestamp: new Date().toISOString(),
      environmentVariables: {
        configured: [
          { name: 'BASE44_APP_ID', present: !!globalThis.Deno?.env?.get?.('BASE44_APP_ID'), critical: true },
          { name: 'STRIPE_SECRET_KEY', present: !!globalThis.Deno?.env?.get?.('STRIPE_SECRET_KEY'), critical: true },
          { name: 'STRIPE_WEBHOOK_SECRET', present: !!globalThis.Deno?.env?.get?.('STRIPE_WEBHOOK_SECRET'), critical: true },
          { name: 'STRIPE_PUBLISHABLE_KEY', present: !!globalThis.Deno?.env?.get?.('STRIPE_PUBLISHABLE_KEY'), critical: false },
        ],
      },
    };
    setEnvStatus(status);
  }, []);

  const [showSecrets, setShowSecrets] = useState(false);

  if (!envStatus) {
    return <div className="text-slate-600">Loading environment status...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Environment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Environment</span>
            <Badge
              className={
                envStatus.isProduction
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }
            >
              {envStatus.nodeEnv}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">NODE_ENV Setting</p>
            <p className="text-sm font-mono font-semibold text-slate-900 mt-1">
              {envStatus.nodeEnv}
            </p>
          </div>

          {envStatus.nodeEnv === 'development' && (
            <div className="p-3 bg-amber-100 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-900">
                ⚠️ Running in development mode. Ensure NODE_ENV is set to
                "production" before deploying.
              </p>
            </div>
          )}

          {envStatus.isProduction && (
            <div className="p-3 bg-emerald-100 border border-emerald-200 rounded-lg">
              <p className="text-xs font-semibold text-emerald-900">
                ✓ Production environment detected
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Environment Variables</CardTitle>
            <button
              onClick={() => setShowSecrets(!showSecrets)}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              {showSecrets ? (
                <>
                  <EyeOff className="w-3 h-3" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  Show
                </>
              )}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {envStatus.environmentVariables.configured.map((env) => (
              <div
                key={env.name}
                className={`p-3 border rounded-lg ${
                  env.present
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {env.present ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-mono font-semibold text-slate-900">
                        {env.name}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {env.critical ? '🔴 Critical' : '🟡 Optional'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={
                      env.present
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {env.present ? 'Configured' : 'Missing'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Configuration Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-slate-700">
          <p>
            • Store all secrets in environment variables, never in code
          </p>
          <p>
            • Use different API keys for development, staging, and
            production
          </p>
          <p>
            • Rotate secrets regularly (quarterly minimum)
          </p>
          <p>
            • Use strong, unique values for webhook secrets
          </p>
          <p>
            • Never share or log sensitive configuration values
          </p>
        </CardContent>
      </Card>
    </div>
  );
}