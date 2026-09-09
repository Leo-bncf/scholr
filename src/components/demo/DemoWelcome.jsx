import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function DemoWelcome({ schoolName, userRole, userName }) {
  const roleDescriptions = {
    student: 'You\'re viewing the platform as a student. Explore your dashboard, assignments, grades, and IB Core progress.',
    teacher: 'You\'re viewing the platform as a teacher. Manage your classes, create assignments, and grade submissions.',
    parent: 'You\'re viewing the platform as a parent. Monitor your child\'s academic progress and school life.',
    ib_coordinator: 'You\'re viewing the platform as an IB Coordinator. Oversee IB programs and student progress.',
    school_admin: 'You\'re viewing the platform as a School Administrator. Manage the school\'s configuration and users.',
  };

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Welcome to the Demo!</strong> {roleDescriptions[userRole] || 'Explore the platform.'}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Demo School: {schoolName}</CardTitle>
          <CardDescription>Riverside International School</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-600 font-semibold mb-1">Your Role</p>
              <p className="text-sm font-medium text-slate-900 capitalize">{userRole}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-600 font-semibold mb-1">Your Name</p>
              <p className="text-sm font-medium text-slate-900">{userName}</p>
            </div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
            <p className="text-xs text-amber-800">
              <strong>Tip:</strong> This is a demo environment with realistic sample data. Feel free to explore and interact with all features.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}