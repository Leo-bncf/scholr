/**
 * Production Launch Center
 * Central hub for coordinating production deployment and go-live
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import * as fns from '@/data/functions';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Lock,
  FileText,
} from 'lucide-react';

export default function ProductionLaunch() {
  const [launchStatus, setLaunchStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deploymentPhase, setDeploymentPhase] = useState('planning');

  useEffect(() => {
    const fetchLaunchStatus = async () => {
      try {
        const response = await fns.invoke(
          'productionLaunchSign'
        );
        setLaunchStatus(response);
      } catch (error) {
        console.error('Failed to fetch launch status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLaunchStatus();
  }, []);

  if (loading || !launchStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <p className="text-slate-600">Loading launch status...</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'signed-off':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getReadinessPercentage = (checks) => {
    if (!checks) return 0;
    let completed = 0;
    let total = 0;
    Object.values(checks).forEach((check) => {
      total += check.checklist;
      completed += check.completed;
    });
    return Math.round((completed / total) * 100);
  };

  const readinessPercent = getReadinessPercentage(
    launchStatus.readinessChecks
  );
  const canLaunch =
    launchStatus.blockers.length === 0 && readinessPercent === 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Production Launch Center
          </h1>
          <p className="text-slate-600 mt-2">
            Coordinating your go-live to production
          </p>
        </div>

        {/* Launch Status Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Launch Readiness</CardTitle>
              <Badge
                className={
                  canLaunch
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }
              >
                {canLaunch ? 'Ready to Launch' : 'In Progress'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Overall Readiness</span>
                <span className="font-semibold">{readinessPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    canLaunch ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>
            </div>

            {launchStatus.blockers.length > 0 && (
              <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-900 mb-2">
                  🚫 Blockers ({launchStatus.blockers.length})
                </p>
                <ul className="text-xs text-red-800 space-y-1">
                  {launchStatus.blockers.map((blocker) => (
                    <li key={blocker.id}>
                      • {blocker.title} ({blocker.severity})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {canLaunch && (
              <div className="p-3 bg-emerald-100 border border-emerald-200 rounded-lg">
                <p className="text-sm font-semibold text-emerald-900">
                  ✅ Platform is ready for production launch!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Workflow */}
        <Card>
          <CardHeader>
            <CardTitle>Approval Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {launchStatus.requiredSignOffs.map((signOff, idx) => (
                <div
                  key={idx}
                  className={`p-4 border rounded-lg ${
                    signOff.status === 'signed-off'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {signOff.role}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {signOff.status === 'signed-off'
                          ? `Signed off by ${signOff.signedBy}`
                          : signOff.notes || 'Pending approval'}
                      </p>
                    </div>
                    <Badge className={getStatusColor(signOff.status)}>
                      {signOff.status === 'signed-off' ? '✓' : '⏳'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Readiness Checks */}
        <Tabs defaultValue="environment">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="environment">Environment</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="backup">Data & Backup</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
          </TabsList>

          {Object.entries(launchStatus.readinessChecks).map(
            ([key, check]) => (
              <TabsContent key={key} value={key}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </CardTitle>
                      <Badge
                        className={
                          check.status === 'pass'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }
                      >
                        {check.completed}/{check.checklist} Complete
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-semibold">
                          {Math.round(
                            (check.completed / check.checklist) * 100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (check.completed / check.checklist) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )
          )}
        </Tabs>

        {/* Launch Actions */}
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
          <CardHeader>
            <CardTitle>Launch Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-700">
              When all requirements are met, use these controls to proceed with
              deployment:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="gap-2"
                disabled={!canLaunch}
              >
                <FileText className="w-4 h-4" />
                Run Deployment Checklist
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={!canLaunch}
              >
                <Lock className="w-4 h-4" />
                Final Security Review
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                disabled={!canLaunch}
              >
                <Zap className="w-4 h-4" />
                Execute Production Deployment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Deployment Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  phase: 'Planning',
                  status: 'completed',
                  time: '1 week',
                },
                {
                  phase: 'Preparation',
                  status: 'in-progress',
                  time: '3 days',
                },
                {
                  phase: 'Validation',
                  status: 'pending',
                  time: '1 day',
                },
                {
                  phase: 'Staging Test',
                  status: 'pending',
                  time: '2 days',
                },
                {
                  phase: 'Production Deployment',
                  status: 'pending',
                  time: '4 hours',
                },
                {
                  phase: 'Monitoring (24h)',
                  status: 'pending',
                  time: '24 hours',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  {item.status === 'completed' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  )}
                  {item.status === 'in-progress' && (
                    <Clock className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                  )}
                  {item.status === 'pending' && (
                    <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {item.phase}
                    </p>
                    <p className="text-xs text-slate-600">
                      Estimated: {item.time}
                    </p>
                  </div>
                  <Badge
                    className={
                      item.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-800'
                    }
                  >
                    {item.status === 'completed'
                      ? '✓'
                      : item.status === 'in-progress'
                      ? 'In Progress'
                      : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}