import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import CreateAssignment from '@/components/assignment/CreateAssignment';
import { createPageUrl } from '@/utils';
import * as assignmentsData from '@/data/assignments';

export default function ClassAssignments({ classData, isTeacher, userId }) {
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['class-assignments', classData.id],
    queryFn: () => assignmentsData.where({ 
      school_id: classData.school_id, 
      class_id: classData.id 
    }, { order: 'created_at', ascending: false }),
  });

  const typeColors = {
    homework: 'bg-blue-50 text-blue-700',
    essay: 'bg-purple-50 text-purple-700',
    exam: 'bg-red-50 text-red-700',
    project: 'bg-emerald-50 text-emerald-700',
    quiz: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Assignments</h2>
        {isTeacher && <CreateAssignment classData={classData} userId={userId} />}
      </div>

      {isLoading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /></div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No assignments yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map(a => (
            <a key={a.id} href={createPageUrl('AssignmentDetail') + `?assignment_id=${a.id}`}>
              <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 text-lg">{a.title}</h3>
                      <Badge className={`${typeColors[a.type] || 'bg-slate-100 text-slate-700'} border-0 text-xs capitalize`}>
                        {a.type?.replace('_', ' ')}
                      </Badge>
                    </div>
                    {a.description && <p className="text-slate-600 text-sm mb-3 line-clamp-2">{a.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {a.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Due {format(new Date(a.due_date), 'MMM d, yyyy')}
                        </span>
                      )}
                      {a.max_score && <span>{a.max_score} points</span>}
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}


    </div>
  );
}