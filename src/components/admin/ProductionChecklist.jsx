/**
 * Production Readiness Checklist
 * Comprehensive checklist for deployment preparation
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const CHECKLIST_ITEMS = [
  {
    category: 'Environment Configuration',
    items: [
      {
        id: 'env-vars',
        title: 'Environment Variables Set',
        description:
          'All required environment variables configured (STRIPE_SECRET_KEY, WEBHOOK_SECRET, etc.)',
        status: 'pending',
      },
      {
        id: 'node-env',
        title: 'NODE_ENV Set to Production',
        description: 'NODE_ENV environment variable set to "production"',
        status: 'pending',
      },
      {
        id: 'https',
        title: 'HTTPS Configured',
        description: 'HTTPS/TLS enabled on all production domains',
        status: 'pending',
      },
      {
        id: 'cors',
        title: 'CORS Origins Configured',
        description: 'CORS origins whitelist configured for production domain',
        status: 'pending',
      },
    ],
  },
  {
    category: 'Security & Access Control',
    items: [
      {
        id: 'admin-access',
        title: 'Admin Access Limited',
        description:
          'Only authorized users have admin role; MFA enabled for admins',
        status: 'pending',
      },
      {
        id: 'school-isolation',
        title: 'School Data Isolation Verified',
        description:
          'Users can only access their own school data; cross-school access prevented',
        status: 'pending',
      },
      {
        id: 'secrets-rotation',
        title: 'Secrets Rotation Plan',
        description:
          'Plan for quarterly rotation of API keys and webhook secrets',
        status: 'pending',
      },
      {
        id: 'security-headers',
        title: 'Security Headers Enabled',
        description:
          'All security headers (CSP, X-Frame-Options, HSTS) configured',
        status: 'pending',
      },
    ],
  },
  {
    category: 'Payment & Billing',
    items: [
      {
        id: 'stripe-live',
        title: 'Stripe Live Mode Activated',
        description:
          'Transitioned from test mode to live Stripe account; real API keys configured',
        status: 'pending',
      },
      {
        id: 'stripe-webhook',
        title: 'Stripe Webhook Registered',
        description:
          'Webhook endpoint registered in Stripe dashboard with correct URL and secret',
        status: 'pending',
      },
      {
        id: 'payment-testing',
        title: 'Payment Flow End-to-End Tested',
        description:
          'Full payment flow tested with real payment methods; refunds tested',
        status: 'pending',
      },
      {
        id: 'billing-email',
        title: 'Billing Email Configuration',
        description:
          'Email notifications configured for payment events and receipts',
        status: 'pending',
      },
    ],
  },
  {
    category: 'Database & Data',
    items: [
      {
        id: 'backups',
        title: 'Automated Backups Enabled',
        description:
          'Daily automated backups configured with geo-redundant storage',
        status: 'pending',
      },
      {
        id: 'restore-tested',
        title: 'Backup Restore Tested',
        description: 'Database restore procedures tested and documented',
        status: 'pending',
      },
      {
        id: 'migrations',
        title: 'Database Migrations Completed',
        description:
          'All required migrations run and tested in production-like environment',
        status: 'pending',
      },
      {
        id: 'connection-pooling',
        title: 'Connection Pooling Configured',
        description: 'Database connection pool sized for production load',
        status: 'pending',
      },
    ],
  },
  {
    category: 'Monitoring & Logging',
    items: [
      {
        id: 'health-checks',
        title: 'Health Check Endpoint Active',
        description: 'Health check endpoint working and load balancer configured',
        status: 'pending',
      },
      {
        id: 'error-tracking',
        title: 'Error Tracking Configured',
        description:
          'Sentry or similar error tracking service configured and tested',
        status: 'pending',
      },
      {
        id: 'logging',
        title: 'Centralized Logging',
        description:
          'All logs centralized and searchable with retention policy set',
        status: 'pending',
      },
      {
        id: 'alerts',
        title: 'Alerting Rules Configured',
        description:
          'Alerts configured for critical errors, failures, and performance issues',
        status: 'pending',
      },
    ],
  },
  {
    category: 'Operational Readiness',
    items: [
      {
        id: 'runbooks',
        title: 'Runbooks & Documentation',
        description:
          'Operations runbooks created for common tasks and incident response',
        status: 'pending',
      },
      {
        id: 'disaster-recovery',
        title: 'Disaster Recovery Plan',
        description:
          'Documented disaster recovery procedures with RTO/RPO defined',
        status: 'pending',
      },
      {
        id: 'communication-plan',
        title: 'Communication Plan',
        description:
          'Status page, incident communication channels, and escalation procedures defined',
        status: 'pending',
      },
      {
        id: 'team-training',
        title: 'Operations Team Training',
        description:
          'Operations team trained on deployment, monitoring, and incident response',
        status: 'pending',
      },
    ],
  },
];

export default function ProductionChecklist() {
  const [checklist, setChecklist] = useState(CHECKLIST_ITEMS);

  const toggleItem = (categoryIndex, itemIndex) => {
    const newChecklist = [...checklist];
    const item = newChecklist[categoryIndex].items[itemIndex];
    item.status =
      item.status === 'pending'
        ? 'completed'
        : item.status === 'completed'
        ? 'pending'
        : 'pending';
    setChecklist(newChecklist);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        );
      case 'pending':
        return (
          <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
        );
      default:
        return (
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 border-emerald-200';
      case 'pending':
        return 'bg-slate-50 border-slate-200';
      default:
        return 'bg-amber-50 border-amber-200';
    }
  };

  const calculateProgress = () => {
    let completed = 0;
    let total = 0;
    checklist.forEach((category) => {
      category.items.forEach((item) => {
        total++;
        if (item.status === 'completed') completed++;
      });
    });
    return { completed, total };
  };

  const progress = calculateProgress();
  const percentage = Math.round((progress.completed / progress.total) * 100);

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Production Deployment Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Overall Progress</span>
              <span className="font-semibold text-slate-900">
                {percentage}% ({progress.completed}/{progress.total})
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {percentage === 100 && (
            <div className="p-3 bg-emerald-100 border border-emerald-200 rounded-lg">
              <p className="text-sm font-semibold text-emerald-900">
                ✅ Platform is ready for production deployment!
              </p>
            </div>
          )}

          {percentage < 50 && (
            <div className="p-3 bg-amber-100 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-900">
                ⚠️ Complete more checklist items before deploying to production
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Categories */}
      {checklist.map((category, catIdx) => (
        <Card key={category.category}>
          <CardHeader>
            <CardTitle className="text-lg">{category.category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {category.items.map((item, itemIdx) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(catIdx, itemIdx)}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${getStatusColor(
                    item.status
                  )} hover:opacity-80`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(item.status)}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold text-sm ${
                          item.status === 'completed'
                            ? 'text-emerald-900'
                            : 'text-slate-900'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Export/Share */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>✓ Go through each category and mark items as completed</li>
            <li>✓ Run the deployment readiness check once all items are complete</li>
            <li>✓ Have operations team review and approve deployment</li>
            <li>✓ Follow the Deployment Guide for step-by-step instructions</li>
            <li>✓ Monitor closely during first 24 hours post-deployment</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}