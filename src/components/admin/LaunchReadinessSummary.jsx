/**
 * Launch Readiness Summary
 * Quick overview of production readiness status
 * Shows what's complete and what still needs attention
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Clock, FileText, Zap } from 'lucide-react';

export default function LaunchReadinessSummary() {
  const readinessCriteria = [
    {
      category: 'Environment & Configuration',
      status: 'complete',
      icon: CheckCircle2,
      items: [
        'NODE_ENV set to production',
        'All environment variables configured',
        'CORS origins configured',
        'HTTPS enforced',
      ],
    },
    {
      category: 'Stripe Integration',
      status: 'in-progress',
      icon: Clock,
      items: [
        '✓ Test mode verified',
        '⏳ Transition to live mode pending',
        'Webhook endpoint configured',
        'Payment flow tested',
      ],
    },
    {
      category: 'Data Safety',
      status: 'complete',
      icon: CheckCircle2,
      items: [
        'Demo data isolated from production',
        'Automated backups enabled',
        'School data isolation verified',
        'Database restore tested',
      ],
    },
    {
      category: 'Security & Access Control',
      status: 'complete',
      icon: CheckCircle2,
      items: [
        'Admin MFA enabled',
        'Role-based access configured',
        'School-scoped data verified',
        'Audit logging active',
      ],
    },
    {
      category: 'Monitoring & Operations',
      status: 'in-progress',
      icon: Clock,
      items: [
        '✓ Health check endpoint live',
        '✓ Error tracking configured',
        '⏳ Monitoring alerts setup in progress',
        'Incident response procedure ready',
      ],
    },
    {
      category: 'Documentation & Training',
      status: 'in-progress',
      icon: Clock,
      items: [
        '✓ Deployment guide written',
        '✓ Security checklist prepared',
        '⏳ Operations team training scheduled',
        'Runbooks in development',
      ],
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'in-progress':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return CheckCircle2;
      case 'blocked':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const completeCount = readinessCriteria.filter(
    (c) => c.status === 'complete'
  ).length;
  const inProgressCount = readinessCriteria.filter(
    (c) => c.status === 'in-progress'
  ).length;
  const completionPercentage = Math.round(
    (completeCount / readinessCriteria.length) * 100
  );

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="border-2 border-indigo-200 bg-indigo-50">
        <CardHeader>
          <CardTitle className="text-lg">Overall Launch Readiness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-indigo-900">Progress</span>
              <span className="text-indigo-900">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-indigo-200 rounded-full h-3">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-white rounded-lg border border-emerald-200">
              <p className="text-xs text-slate-600">Complete</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {completeCount}/{readinessCriteria.length}
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-amber-200">
              <p className="text-xs text-slate-600">In Progress</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {inProgressCount}/{readinessCriteria.length}
                <span className="text-xs ml-1">items</span>
              </p>
            </div>
          </div>

          {completionPercentage === 100 ? (
            <div className="p-4 bg-emerald-600 text-white rounded-lg text-center font-semibold">
              ✅ Platform Ready for Production Launch
            </div>
          ) : (
            <div className="p-4 bg-amber-600 text-white rounded-lg text-center font-semibold">
              ⚠️ Complete all items before launching to production
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Categories */}
      <div className="space-y-4">
        {readinessCriteria.map((category, idx) => {
          const Icon = getStatusIcon(category.status);
          const isComplete = category.status === 'complete';

          return (
            <Card
              key={idx}
              className={`border-2 ${getStatusColor(category.status)}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <CardTitle className="text-base">
                      {category.category}
                    </CardTitle>
                  </div>
                  <Badge
                    className={`${getStatusColor(category.status)} border`}
                  >
                    {category.status === 'complete'
                      ? '✓ Complete'
                      : '⏳ In Progress'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.items.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span
                        className={`mt-1 flex-shrink-0 ${
                          item.startsWith('✓')
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {item.startsWith('✓') ? '✓' : '⏳'}
                      </span>
                      <span className="text-slate-700">
                        {item.replace(/^(✓|⏳)\s*/, '')}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Next Steps */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3 text-slate-700">
          <ol className="list-decimal list-inside space-y-2">
            <li>Complete Stripe transition to live mode</li>
            <li>Finish monitoring and alerting setup</li>
            <li>Schedule and complete operations team training</li>
            <li>Obtain written approval from Security team</li>
            <li>Obtain written approval from Operations team</li>
            <li>Schedule deployment window with all stakeholders</li>
            <li>Execute production deployment</li>
            <li>Monitor closely for 24 hours post-launch</li>
          </ol>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="gap-2 flex-1">
          <FileText className="w-4 h-4" />
          View Detailed Checklist
        </Button>
        <Button variant="outline" className="gap-2 flex-1">
          <Zap className="w-4 h-4" />
          Validate Integrations
        </Button>
        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 flex-1">
          <CheckCircle2 className="w-4 h-4" />
          Go to Launch Center
        </Button>
      </div>
    </div>
  );
}