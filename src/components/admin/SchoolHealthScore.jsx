import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import * as academics from '@/data/academics';

/**
 * Displays overall health score for a school
 * Considers setup progress, billing status, and operational state
 */
export default function SchoolHealthScore({ school }) {
  const [score, setScore] = useState(0);
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    const calculateHealth = async () => {
      const issues_found = [];
      let health = 100;

      // Account Status Issues
      if (school.status === 'suspended') {
        issues_found.push({ type: 'critical', message: 'School suspended' });
        health -= 50;
      }

      if (school.status === 'onboarding') {
        issues_found.push({ type: 'warning', message: 'School setup incomplete' });
        health -= 20;
      }

      // Billing Issues
      if (school.billing_status === 'past_due') {
        issues_found.push({ type: 'critical', message: 'Payment overdue' });
        health -= 30;
      }

      if (school.billing_status === 'incomplete') {
        issues_found.push({ type: 'warning', message: 'Billing setup incomplete' });
        health -= 15;
      }

      if (school.billing_status === 'trial' && school.trial_end_date) {
        const daysLeft = Math.ceil((new Date(school.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 7) {
          issues_found.push({ type: 'warning', message: `Trial ends in ${daysLeft} days` });
          health -= 10;
        }
      }

      // Setup Progress
      try {
        const academicYears = await academics.whereAcademicYears({
          school_id: school.id
        });

        if (!academicYears || academicYears.length === 0) {
          issues_found.push({ type: 'warning', message: 'No academic years configured' });
          health -= 10;
        }
      } catch (error) {
        console.error('Error checking setup:', error);
      }

      setScore(Math.max(0, health));
      setIssues(issues_found);
    };

    calculateHealth();
  }, [school]);

  const getHealthColor = () => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getHealthIcon = () => {
    if (score >= 80) return <CheckCircle className="w-6 h-6" />;
    if (score >= 60) return <AlertTriangle className="w-6 h-6" />;
    return <AlertCircle className="w-6 h-6" />;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Health Score</h3>
          <div className={`flex items-center gap-2 ${getHealthColor()}`}>
            {getHealthIcon()}
            <span className="text-2xl font-bold">{Math.round(score)}</span>
          </div>
        </div>

        {issues.length > 0 && (
          <div className="space-y-2 text-sm">
            {issues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-2 rounded ${
                  issue.type === 'critical'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                • {issue.message}
              </div>
            ))}
          </div>
        )}

        {issues.length === 0 && (
          <p className="text-sm text-emerald-700 bg-emerald-50 p-2 rounded">
            ✓ School is in good standing
          </p>
        )}
      </CardContent>
    </Card>
  );
}