import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Copy, Check, Zap, Users, BookOpen, BarChart3, Settings, Shield } from 'lucide-react';
import * as fns from '@/data/functions';

const DEMO_ROLES = [
  {
    id: 'student',
    label: 'Student',
    icon: BookOpen,
    description: 'View grades, assignments, attendance, and CAS progress',
    color: 'from-blue-500 to-blue-600',
    email: 'emma.brown@riverside.edu',
  },
  {
    id: 'teacher',
    label: 'Teacher',
    icon: Users,
    description: 'Manage classes, create assignments, grade submissions',
    color: 'from-emerald-500 to-emerald-600',
    email: 'carol.white@riverside.edu',
  },
  {
    id: 'parent',
    label: 'Parent',
    icon: BarChart3,
    description: 'Monitor child\'s progress, grades, and behavior',
    color: 'from-purple-500 to-purple-600',
    email: 'henry.wilson@riverside.edu',
  },
  {
    id: 'coordinator',
    label: 'IB Coordinator',
    icon: Settings,
    description: 'Oversee IB programs, CAS, EE, TOK workflows',
    color: 'from-amber-500 to-amber-600',
    email: 'bob.smith@riverside.edu',
  },
  {
    id: 'admin',
    label: 'School Admin',
    icon: Shield,
    description: 'Manage school settings, users, timetables',
    color: 'from-red-500 to-red-600',
    email: 'alice.johnson@riverside.edu',
  },
];

export default function DemoShowcase() {
  const navigate = useNavigate();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [seedError, setSeedError] = useState(null);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    setSeedError(null);
    try {
      const response = await fns.invoke('seedDemoData');
      setSeedStatus(response);
    } catch (error) {
      setSeedError(error.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const copyToClipboard = (text, email) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/50">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-300">DEMO SHOWCASE</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            AtlasIB Platform Demo
          </h1>
          <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto">
            Experience a fully functional school management platform with realistic sample data and role-based demonstrations
          </p>
        </div>

        {/* Status Alert */}
        {seedStatus && (
          <Alert className="mb-8 bg-emerald-50 border-emerald-200">
            <Check className="w-4 h-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800">
              <strong>Demo data loaded!</strong> School: <strong>{seedStatus.school.name}</strong>
              {seedStatus.warning && (
                <p className="mt-2 text-xs">{seedStatus.warning}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {seedError && (
          <Alert className="mb-8 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {seedError}
            </AlertDescription>
          </Alert>
        )}

        {/* Seed Demo Data Button */}
        {!seedStatus && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 md:p-8 mb-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white mb-2">Set Up Demo Data</h2>
                <p className="text-sm text-slate-300">
                  Create a sample school with realistic data across all roles and workflows
                </p>
              </div>
              <Button
                onClick={handleSeedDemo}
                disabled={isSeeding}
                className="bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Seed Demo Data
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Demo Roles */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Demo Accounts</h2>
          <p className="text-slate-300 mb-8">Click any role to explore that dashboard experience</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {DEMO_ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <Card
                  key={role.id}
                  className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all hover:shadow-lg cursor-pointer group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className={`p-2.5 rounded-lg bg-gradient-to-br ${role.color} text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <CardTitle className="text-white text-lg">{role.label}</CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      {role.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Email Display */}
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">Demo Email</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-mono text-slate-300 truncate">
                          {role.email}
                        </p>
                        <button
                          onClick={() => copyToClipboard(role.email, role.email)}
                          className="p-1 hover:bg-slate-700 rounded transition-colors"
                          title="Copy email"
                        >
                          {copiedEmail === role.email ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/50 text-xs text-slate-400 space-y-1">
                      <p>
                        <strong className="text-slate-300">Note:</strong> Demo accounts are pre-configured. Login with your preferred method.
                      </p>
                    </div>

                    {/* Launch Button */}
                    <Button
                      onClick={() => navigate('/app-home')}
                      className="w-full bg-slate-700 hover:bg-slate-600 text-white"
                      size="sm"
                    >
                      Launch Demo
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 md:mt-16">
          <h2 className="text-2xl font-bold text-white mb-8">What's Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: BookOpen, title: 'Complete Classes', desc: 'Sample DP classes with timetables' },
              { icon: Users, title: 'Student & Staff', desc: 'Realistic user profiles across all roles' },
              { icon: BarChart3, title: 'Grades & Assessments', desc: 'Assignments, submissions, rubrics' },
              { icon: Settings, title: 'IB Core Programs', desc: 'CAS, EE, TOK progress tracking' },
              { icon: Shield, title: 'Attendance & Behavior', desc: 'Records and student tracking' },
              { icon: Zap, title: 'Parent Dashboard', desc: 'Child monitoring and reports' },
            ].map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 flex gap-3"
                >
                  <div className="p-2 rounded-lg bg-indigo-500/20 h-fit">
                    <ItemIcon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 md:mt-16 text-center">
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            This demo environment contains realistic sample data designed to showcase platform capabilities. Reset and reseed data anytime to start fresh.
          </p>
        </div>
      </div>
    </div>
  );
}