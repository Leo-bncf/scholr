import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, BarChart3, 
  Loader2, TrendingUp, TrendingDown, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { getCoordinatorSidebarLinks } from '@/components/app/coordinatorSidebarLinks';
import { useCurriculum } from '@/hooks/useCurriculum';
import * as gradebookData from '@/data/gradebook';
import * as membershipsData from '@/data/memberships';
import * as classesData from '@/data/classes';

export default function CoordinatorPredictedGrades() {
  const { user, school, schoolId } = useUser();
  const { curriculum, config, isIBDP, gradeScale } = useCurriculum();
  const sidebarLinks = getCoordinatorSidebarLinks(curriculum, config);
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterClass, setFilterClass] = useState('all');

  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['all-predicted-grades', schoolId],
    queryFn: () => gradebookData.wherePredictedGrades({ school_id: schoolId }, { order: 'entry_date', ascending: false }),
    enabled: !!schoolId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['dp-students-pred', schoolId],
    queryFn: async () => {
      const memberships = await membershipsData.where({ 
        school_id: schoolId, 
        role: 'student',
        status: 'active'
      });
      return memberships.filter(m => m.grade_level?.includes('DP'));
    },
    enabled: !!schoolId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes-pred', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const filteredPredictions = predictions.filter(p => {
    const gradeMatch = filterGrade === 'all' || p.predicted_ib_grade === Number(filterGrade);
    const classMatch = filterClass === 'all' || p.class_id === filterClass;
    return gradeMatch && classMatch;
  });

  const gradeDistribution = [1, 2, 3, 4, 5, 6, 7].map(grade => ({
    grade,
    count: predictions.filter(p => p.predicted_ib_grade === grade).length
  }));

  const averagePredicted = predictions.length > 0
    ? (predictions.reduce((sum, p) => sum + p.predicted_ib_grade, 0) / predictions.length).toFixed(2)
    : 0;

  const confidenceLevels = {
    high: predictions.filter(p => p.confidence_level === 'high').length,
    medium: predictions.filter(p => p.confidence_level === 'medium').length,
    low: predictions.filter(p => p.confidence_level === 'low').length,
  };

  const confidenceColors = {
    high: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    low: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  const gradeColors = {
    7: 'bg-emerald-600',
    6: 'bg-emerald-500',
    5: 'bg-blue-500',
    4: 'bg-amber-500',
    3: 'bg-orange-500',
    2: 'bg-red-500',
    1: 'bg-red-600',
  };

  return (
    <RoleGuard allowedRoles={['ib_coordinator', 'school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={sidebarLinks} role="ib_coordinator" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        
        <main className="ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{isIBDP ? 'Predicted IB Grades' : 'Grade Forecasts'}</h1>
              <p className="text-slate-600">Monitor {isIBDP ? 'predicted grades across all DP' : 'forecasted grades across all'} students and classes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Predictions</p>
                    <p className="text-2xl font-bold text-slate-900">{predictions.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Average {isIBDP ? 'Predicted' : 'Forecast'}</p>
                     <p className="text-2xl font-bold text-slate-900">{averagePredicted} {isIBDP ? `/ ${gradeScale.max}` : gradeScale.displayLabel}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">High Confidence</p>
                    <p className="text-2xl font-bold text-slate-900">{confidenceLevels.high}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Low Confidence</p>
                    <p className="text-2xl font-bold text-slate-900">{confidenceLevels.low}</p>
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-white border border-slate-200">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="by-student">By Student</TabsTrigger>
                <TabsTrigger value="by-class">By Class</TabsTrigger>
                <TabsTrigger value="distribution">Distribution</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Recent Predictions</h2>
                    <div className="flex items-center gap-3">
                      <Filter className="w-4 h-4 text-slate-400" />
                      <select 
                        value={filterGrade}
                        onChange={e => setFilterGrade(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <option value="all">All Grades</option>
                        {[7, 6, 5, 4, 3, 2, 1].map(g => (
                          <option key={g} value={g}>Grade {g}</option>
                        ))}
                      </select>
                      <select 
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <option value="all">All Classes</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                  ) : filteredPredictions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>No predicted grades yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredPredictions.map(pred => (
                        <div key={pred.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-slate-900">{pred.student_name}</h4>
                                <Badge className="bg-slate-100 text-slate-600 border-0 text-xs">
                                  {pred.class_name}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 line-clamp-1">{pred.rationale}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                <span>By: {pred.teacher_name || 'Teacher'}</span>
                                <span>•</span>
                                <span>{pred.entry_date ? format(new Date(pred.entry_date), 'MMM d, yyyy') : ''}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={confidenceColors[pred.confidence_level]} variant="outline">
                                {pred.confidence_level} confidence
                              </Badge>
                              <div className="text-center bg-violet-50 rounded-lg px-4 py-2 border border-violet-200">
                                <p className="text-xs text-violet-600 font-semibold">Predicted</p>
                                <p className="text-2xl font-bold text-violet-700">{pred.predicted_ib_grade}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="by-student">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Student Progress Overview</h2>
                  <div className="space-y-3">
                    {students.map(student => {
                      const studentPreds = predictions.filter(p => p.student_id === student.user_id);
                      const avgPred = studentPreds.length > 0
                        ? (studentPreds.reduce((sum, p) => sum + p.predicted_ib_grade, 0) / studentPreds.length).toFixed(1)
                        : null;

                      return (
                        <div key={student.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-slate-900">{student.user_name || student.user_email}</h4>
                              <p className="text-sm text-slate-500">{student.grade_level || 'DP Student'}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-slate-600">{studentPreds.length} predictions</span>
                              {avgPred && (
                                <div className="bg-indigo-50 rounded-lg px-3 py-1 border border-indigo-200">
                                  <p className="text-sm font-semibold text-indigo-700">Avg: {avgPred}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="by-class">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Class-Level Analysis</h2>
                  <div className="space-y-3">
                    {classes.map(cls => {
                      const classPreds = predictions.filter(p => p.class_id === cls.id);
                      const avgPred = classPreds.length > 0
                        ? (classPreds.reduce((sum, p) => sum + p.predicted_ib_grade, 0) / classPreds.length).toFixed(1)
                        : null;

                      return (
                        <div key={cls.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-slate-900">{cls.name}</h4>
                              <p className="text-sm text-slate-500">{cls.section || ''}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-slate-600">{classPreds.length} predictions</span>
                              {avgPred && (
                                <div className="bg-violet-50 rounded-lg px-4 py-2 border border-violet-200">
                                  <p className="text-xs text-violet-600 font-semibold">Class Avg</p>
                                  <p className="text-xl font-bold text-violet-700">{avgPred}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="distribution">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Grade Distribution</h2>
                  <div className="space-y-4">
                    {gradeDistribution.reverse().map(({ grade, count }) => {
                      const percentage = predictions.length > 0 ? (count / predictions.length * 100).toFixed(1) : 0;
                      return (
                        <div key={grade} className="flex items-center gap-4">
                          <div className="w-16 text-right">
                            <span className="text-2xl font-bold text-slate-900">{grade}</span>
                          </div>
                          <div className="flex-1 bg-slate-100 rounded-full h-12 overflow-hidden relative">
                            <div 
                              className={`h-full ${gradeColors[grade]} transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                            <div className="absolute inset-0 flex items-center px-4">
                              <span className="text-sm font-semibold text-slate-700">{count} students ({percentage}%)</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}