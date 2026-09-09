/**
 * Comprehensive Operational Dashboard
 * Central hub for production operations, monitoring, and deployment status
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle2,
  Settings,
  Lock,
  Zap,
} from 'lucide-react';
import DeploymentStatus from './DeploymentStatus';
import EnvironmentStatus from './EnvironmentStatus';
import SecurityAudit from './SecurityAudit';
import ProductionChecklist from './ProductionChecklist';

export default function OperationalDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Operations Center
          </h1>
          <p className="text-slate-600 mt-2">
            Production deployment, monitoring, and operational control
          </p>
        </div>

        {/* Quick Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Deployment</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">Ready</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Environment</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">
                    Configured
                  </p>
                </div>
                <Settings className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Security</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">
                    Passing
                  </p>
                </div>
                <Lock className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Integrations</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">
                    Active
                  </p>
                </div>
                <Zap className="w-8 h-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="environment">Environment</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <DeploymentStatus />

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <AlertCircle className="w-5 h-5" />
                  Deployment Status
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-900 space-y-3">
                <p>
                  Your platform is in the final deployment preparation phase.
                  Complete all checklist items before deploying to production.
                </p>
                <div className="bg-white p-3 rounded-lg space-y-2 text-xs">
                  <p className="font-semibold text-slate-900">
                    Key Deployment Endpoints:
                  </p>
                  <ul className="space-y-1 text-slate-700">
                    <li>
                      • Health Check:{' '}
                      <code className="bg-slate-100 px-1 rounded">
                        /functions/healthCheck
                      </code>
                    </li>
                    <li>
                      • Deployment Ready:{' '}
                      <code className="bg-slate-100 px-1 rounded">
                        /functions/deploymentReady
                      </code>
                    </li>
                    <li>
                      • System Metrics:{' '}
                      <code className="bg-slate-100 px-1 rounded">
                        /functions/systemMetrics
                      </code>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* System Architecture */}
            <Card>
              <CardHeader>
                <CardTitle>System Architecture</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-900 mb-2">
                      Frontend
                    </p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• React with Tailwind CSS</li>
                      <li>• React Query for data</li>
                      <li>• Client-side routing</li>
                      <li>• Authentication context</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-900 mb-2">
                      Backend
                    </p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• Deno runtime</li>
                      <li>• Base44 SDK</li>
                      <li>• REST APIs</li>
                      <li>• Webhook handlers</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-900 mb-2">
                      Data
                    </p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• Base44 database</li>
                      <li>• Entity-based schema</li>
                      <li>• School-scoped access</li>
                      <li>• Audit logging</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-900 mb-2">
                      Integrations
                    </p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• Stripe payments</li>
                      <li>• Google Drive</li>
                      <li>• Email (SMTP)</li>
                      <li>• Webhooks</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Environment Tab */}
          <TabsContent value="environment">
            <EnvironmentStatus />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <SecurityAudit />
          </TabsContent>

          {/* Checklist Tab */}
          <TabsContent value="checklist">
            <ProductionChecklist />
          </TabsContent>
        </Tabs>

        {/* Support & Documentation */}
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
          <CardHeader>
            <CardTitle>Production Deployment Guide</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <p>
              The platform is now ready for production deployment. Before
              deploying, ensure you have:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>Completed all items in the Pre-Deployment Checklist</li>
              <li>
                Verified environment variables and configuration in production
              </li>
              <li>
                Transitioned Stripe integration from test mode to live mode
              </li>
              <li>
                Configured monitoring, alerting, and logging infrastructure
              </li>
              <li>
                Tested disaster recovery and backup restoration procedures
              </li>
              <li>
                Trained operations team on deployment and incident response
              </li>
              <li>Obtained final approval from security and operations teams</li>
            </ul>
            <p className="text-xs text-slate-600 mt-4 pt-4 border-t border-indigo-200">
              Refer to the Deployment Guide for detailed step-by-step
              instructions and operational procedures.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}