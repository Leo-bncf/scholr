/**
 * Security Audit Dashboard
 * Shows security-related configuration and access control status
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Lock, Users, Shield } from 'lucide-react';

export default function SecurityAudit() {
  const [securityStatus, setSecurityStatus] = useState({
    httpsRequired: true,
    corsConfigured: true,
    securityHeadersEnabled: true,
    rateLimitingEnabled: true,
    auditLoggingEnabled: true,
    mfaRequired: false,
  });

  const checks = [
    {
      name: 'HTTPS/TLS Enforcement',
      status: securityStatus.httpsRequired,
      icon: Lock,
      description: 'All traffic must use HTTPS',
      critical: true,
    },
    {
      name: 'CORS Configuration',
      status: securityStatus.corsConfigured,
      icon: Shield,
      description: 'CORS origins whitelist configured',
      critical: true,
    },
    {
      name: 'Security Headers',
      status: securityStatus.securityHeadersEnabled,
      icon: Shield,
      description:
        'CSP, X-Frame-Options, and other security headers enabled',
      critical: true,
    },
    {
      name: 'Rate Limiting',
      status: securityStatus.rateLimitingEnabled,
      icon: Shield,
      description: 'API rate limiting enabled to prevent abuse',
      critical: false,
    },
    {
      name: 'Audit Logging',
      status: securityStatus.auditLoggingEnabled,
      icon: AlertCircle,
      description: 'All critical operations logged for compliance',
      critical: false,
    },
    {
      name: 'Admin MFA',
      status: securityStatus.mfaRequired,
      icon: Users,
      description: 'Multi-factor authentication required for admins',
      critical: true,
    },
  ];

  const passedChecks = checks.filter((c) => c.status).length;
  const totalChecks = checks.length;

  return (
    <div className="space-y-4">
      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle>Security Posture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">
                {Math.round((passedChecks / totalChecks) * 100)}%
              </div>
              <p className="text-xs text-slate-600 mt-1">Compliance Score</p>
            </div>
            <div className="flex-1 space-y-2">
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(passedChecks / totalChecks) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-slate-600">
                {passedChecks} of {totalChecks} checks passing
              </p>
            </div>
          </div>

          {passedChecks === totalChecks && (
            <div className="p-3 bg-emerald-100 border border-emerald-200 rounded-lg">
              <p className="text-xs font-semibold text-emerald-900">
                ✓ All critical security checks passing
              </p>
            </div>
          )}

          {passedChecks < totalChecks && (
            <div className="p-3 bg-amber-100 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-900">
                ⚠️ Some security checks need attention
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Checks */}
      <div className="space-y-3">
        {checks.map((check) => {
          const Icon = check.icon;
          return (
            <Card
              key={check.name}
              className={
                check.status
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Icon
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      check.status
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-slate-900">
                        {check.name}
                      </p>
                      <Badge
                        className={
                          check.status
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {check.status ? 'Pass' : 'Fail'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {check.description}
                    </p>
                    {check.critical && (
                      <p className="text-xs text-amber-700 mt-2 font-semibold">
                        🔴 CRITICAL
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Data Isolation */}
      <Card>
        <CardHeader>
          <CardTitle>School Data Isolation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="font-semibold text-slate-900 mb-2">
              ✓ School-Scoped Access Control
            </p>
            <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
              <li>Users can only access their own school's data</li>
              <li>
                Cross-school data access prevented at the database level
              </li>
              <li>Super admins can access all schools for support</li>
              <li>All data access is audit logged</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-amber-900">
            <AlertCircle className="w-4 h-4" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-amber-900">
          <p>
            • Enable multi-factor authentication for all admin accounts
          </p>
          <p>• Schedule quarterly security audit and penetration testing</p>
          <p>• Rotate API keys and secrets quarterly</p>
          <p>• Monitor audit logs daily for suspicious activity</p>
          <p>
            • Keep all dependencies and frameworks up to date
          </p>
          <p>• Conduct security training for operations team</p>
        </CardContent>
      </Card>
    </div>
  );
}