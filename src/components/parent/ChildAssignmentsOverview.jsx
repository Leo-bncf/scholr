import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format, isPast } from 'date-fns';
import * as classesData from '@/data/classes';
import * as assignmentsData from '@/data/assignments';
import * as submissionsData from '@/data/submissions';

export default function ChildAssignmentsOverview({ schoolId, studentId }) {
  const { data: classes = [] } = useQuery({
    queryKey: ['parent-child-classes', schoolId, studentId],
    queryFn: async () => {
      const all = await classesData.where({ school_id: schoolId, status: 'active' });
      return all.filter(c => c.student_ids?.includes(studentId));
    },
    enabled: !!schoolId && !!studentId,
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['parent-child-assignments', schoolId, studentId],
    queryFn: async () => {
      const allAssignments = [];
      for (const cls of classes) {
        const classAssignments = await assignmentsData.where({
          school_id: schoolId,
          class_id: cls.id,
          status: 'published'
        });
        allAssignments.push(...classAssignments.map(a => ({ ...a, class_name: cls.name })));
      }
      return allAssignments.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    },
    enabled: classes.length > 0,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['parent-child-submissions', schoolId, studentId],
    queryFn: () => submissionsData.where({
      school_id: schoolId,
      student_id: studentId
    }),
    enabled: !!schoolId && !!studentId,
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  }

  const getAssignmentStatus = (assignment) => {
    const submission = submissions.find(s => s.assignment_id === assignment.id);
    if (submission) return 'submitted';
    if (assignment.due_date && isPast(new Date(assignment.due_date))) return 'missing';
    return 'upcoming';
  };

  const upcomingAssignments = assignments.filter(a => getAssignmentStatus(a) === 'upcoming').slice(0, 5);
  const missingAssignments = assignments.filter(a => getAssignmentStatus(a) === 'missing');

  return (
    <div className="space-y-6">
      {missingAssignments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-slate-900">Missing Work ({missingAssignments.length})</h3>
          </div>
          <div className="space-y-2">
            {missingAssignments.map(a => (
              <div key={a.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-red-900">{a.title}</p>
                    <p className="text-xs text-red-700 mt-0.5">{a.class_name}</p>
                  </div>
                  <Badge className="bg-red-600 text-white border-0 text-xs">Overdue</Badge>
                </div>
                {a.due_date && (
                  <p className="text-xs text-red-600 mt-2">
                    Was due: {format(new Date(a.due_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900">Upcoming Assignments</h3>
        </div>
        {upcomingAssignments.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No upcoming assignments</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingAssignments.map(a => (
              <div key={a.id} className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{a.class_name}</p>
                  </div>
                  {a.type && (
                    <Badge variant="outline" className="text-xs">{a.type}</Badge>
                  )}
                </div>
                {a.due_date && (
                  <p className="text-xs text-slate-500 mt-2">
                    Due: {format(new Date(a.due_date), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}