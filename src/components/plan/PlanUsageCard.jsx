import React from 'react';
import { usePlan } from './PlanProvider';
import { useUser } from '@/components/auth/UserContext';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PLAN_NAMES } from './PlanConfig';
import * as membershipsData from '@/data/memberships';

export default function PlanUsageCard({ studentCount: studentCountProp }) {
  const plan = usePlan();
  const { schoolId, school } = useUser();

  const { data: studentCount = studentCountProp ?? 0 } = useQuery({
    queryKey: ['student-count-usage', schoolId],
    queryFn: async () => {
      const students = await membershipsData.where({ school_id: schoolId, role: 'student', status: 'active' });
      return students.length;
    },
    enabled: !!schoolId && studentCountProp === undefined,
    initialData: studentCountProp,
  });

  const maxStudents = school?.max_students || 0;
  const pct = maxStudents > 0 ? Math.round((studentCount / maxStudents) * 100) : 0;
  const isWarning = maxStudents > 0 && pct >= 80;
  const isCritical = maxStudents > 0 && pct >= 95;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">Student Slots</p>
        <Badge className="bg-indigo-50 text-indigo-700 border-0 text-xs">
          {PLAN_NAMES[plan.plan] || plan.plan}
        </Badge>
      </div>

      {maxStudents > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <GraduationCap className="w-4 h-4" />
              <span>Students enrolled</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">{studentCount} / {maxStudents}</span>
              {isCritical && <Badge className="bg-red-100 text-red-700 border-0 text-xs gap-1"><AlertTriangle className="w-3 h-3" /> At Limit</Badge>}
              {isWarning && !isCritical && <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Near Limit</Badge>}
              {!isWarning && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs"><CheckCircle2 className="w-3 h-3 mr-0.5" /> OK</Badge>}
            </div>
          </div>
          <Progress value={pct} className="h-2" />
          <p className="text-xs text-slate-400">
            {Math.max(0, maxStudents - studentCount)} slots remaining
            {isCritical && <span className="text-red-600 font-medium ml-1">— upgrade to add more</span>}
            {isWarning && !isCritical && <span className="text-amber-600 font-medium ml-1">— consider upgrading soon</span>}
          </p>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-sm text-emerald-700">
            <Users className="w-4 h-4" />
            <span>Teachers &amp; staff: <strong>Unlimited</strong></span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-slate-400">
          <GraduationCap className="w-8 h-8 mx-auto mb-2 text-slate-200" />
          No student slots configured.
        </div>
      )}
    </div>
  );
}