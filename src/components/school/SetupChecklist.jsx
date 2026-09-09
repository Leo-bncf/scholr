import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, ChevronRight } from 'lucide-react';
import * as academics from '@/data/academics';
import * as classesData from '@/data/classes';
import * as membershipsData from '@/data/memberships';

/**
 * Displays checklist of setup tasks with status
 * Helps user understand what's been done and what's next
 */
export default function SetupChecklist({ schoolId, onNavigate }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSetupStatus = async () => {
      try {
        const [
          academicYears,
          terms,
          subjects,
          classes,
          members
        ] = await Promise.all([
          academics.whereAcademicYears({ school_id: schoolId }),
          academics.whereTerms({ school_id: schoolId }),
          academics.whereSubjects({ school_id: schoolId }),
          classesData.where({ school_id: schoolId }),
          membershipsData.where({ school_id: schoolId })
        ]);

        const setupTasks = [
          {
            id: 'profile',
            label: 'School Profile',
            description: 'Add school name, location, and logo',
            completed: true,
            icon: CheckCircle,
            action: 'Review'
          },
          {
            id: 'academic_year',
            label: 'Academic Year',
            description: academicYears.length > 0 ? `${academicYears.length} year(s) configured` : 'Set up at least one academic year',
            completed: academicYears.length > 0,
            icon: academicYears.length > 0 ? CheckCircle : Circle,
            action: 'Configure'
          },
          {
            id: 'terms',
            label: 'Terms',
            description: terms.length > 0 ? `${terms.length} term(s) configured` : 'Create terms within academic year',
            completed: terms.length > 0,
            icon: terms.length > 0 ? CheckCircle : Circle,
            action: 'Set Up'
          },
          {
            id: 'subjects',
            label: 'Subjects',
            description: subjects.length > 0 ? `${subjects.length} subject(s) created` : 'Add subjects your school teaches',
            completed: subjects.length > 0,
            icon: subjects.length > 0 ? CheckCircle : Circle,
            action: 'Create'
          },
          {
            id: 'classes',
            label: 'Classes',
            description: classes.length > 0 ? `${classes.length} class(es) created` : 'Create initial classes',
            completed: classes.length > 0,
            icon: classes.length > 0 ? CheckCircle : Circle,
            action: 'Add'
          },
          {
            id: 'staff',
            label: 'Staff Members',
            description: members.length > 1 ? `${members.length - 1} staff invited` : 'Invite teachers and staff',
            completed: members.length > 1,
            icon: members.length > 1 ? CheckCircle : Circle,
            action: 'Invite'
          }
        ];

        setTasks(setupTasks);
      } catch (error) {
        console.error('Error loading setup status:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSetupStatus();
  }, [schoolId]);

  const completedCount = tasks.filter(t => t.completed).length;
  const allComplete = completedCount === tasks.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-slate-600">Loading setup status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Setup Checklist</CardTitle>
          <span className={`text-sm font-semibold ${allComplete ? 'text-emerald-600' : 'text-slate-600'}`}>
            {completedCount}/{tasks.length} Complete
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {allComplete && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
            <p className="text-sm font-semibold text-emerald-900">🎉 Setup Complete!</p>
            <p className="text-xs text-emerald-700 mt-1">Your school is fully configured and ready for use.</p>
          </div>
        )}

        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-start justify-between p-3 rounded-lg transition-colors ${
              task.completed
                ? 'bg-emerald-50 border border-emerald-100'
                : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-start gap-3 flex-1">
              <task.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                task.completed ? 'text-emerald-600' : 'text-slate-400'
              }`} />
              <div className="flex-1">
                <p className={`font-semibold text-sm ${
                  task.completed ? 'text-slate-600' : 'text-slate-900'
                }`}>
                  {task.label}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">{task.description}</p>
              </div>
            </div>
            {!task.completed && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigate(task.id)}
                className="ml-3"
              >
                {task.action}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}