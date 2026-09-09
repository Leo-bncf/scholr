import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as gradebookData from '@/data/gradebook';
import * as academics from '@/data/academics';
import * as classesData from '@/data/classes';

/**
 * Coordinator-facing overview of predicted grades across cohorts
 * Provides insights and alerts on grade distributions
 */
export default function CoordinatorPredictedGradesOverview({ schoolId, academicYearId }) {
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterConfidence, setFilterConfidence] = useState('all');

  const { data: predictedGrades = [], isLoading } = useQuery({
    queryKey: ['predicted-grades-overview', schoolId, academicYearId],
    queryFn: async () => {
      const grades = await gradebookData.wherePredictedGrades({
        school_id: schoolId,
        academic_year_id: academicYearId
      });
      return grades.sort((a, b) => b.created_at - a.created_at);
    }
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', schoolId],
    queryFn: () => academics.whereSubjects({ school_id: schoolId })
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId })
  });

  // Filter data
  const filtered = predictedGrades.filter(pg => {
    if (filterSubject !== 'all' && pg.subject_id !== filterSubject) return false;
    if (filterClass !== 'all' && pg.class_id !== filterClass) return false;
    if (filterConfidence !== 'all' && pg.confidence_level !== filterConfidence) return false;
    return true;
  });

  // Calculate statistics
  const stats = {
    total: filtered.length,
    byGrade: Array.from({ length: 7 }, (_, i) => {
      const grade = 7 - i;
      return {
        grade,
        count: filtered.filter(p => p.predicted_ib_grade === grade).length
      };
    }),
    byConfidence: {
      high: filtered.filter(p => p.confidence_level === 'high').length,
      medium: filtered.filter(p => p.confidence_level === 'medium').length,
      low: filtered.filter(p => p.confidence_level === 'low').length
    },
    averageGrade: filtered.length > 0
      ? (filtered.reduce((sum, p) => sum + p.predicted_ib_grade, 0) / filtered.length).toFixed(1)
      : 0
  };

  const lowConfidenceCount = filtered.filter(p => p.confidence_level === 'low').length;
  const showConfidenceAlert = lowConfidenceCount > filtered.length * 0.3;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Subject</label>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Class</label>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Confidence</label>
          <Select value={filterConfidence} onValueChange={setFilterConfidence}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Confidence Levels</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Alerts */}
      {showConfidenceAlert && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-800 ml-3">
            <p className="font-semibold text-sm">Many Low-Confidence Predictions</p>
            <p className="text-xs mt-1">
              {lowConfidenceCount} of {filtered.length} predictions have low confidence. Follow up with teachers to clarify reasoning.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-600">Total Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-600">Average Predicted Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-indigo-600">{stats.averageGrade}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-600">High Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{stats.byConfidence.high}</p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.total > 0 ? Math.round((stats.byConfidence.high / stats.total) * 100) : 0}% of predictions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Grade Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.byGrade.map(({ grade, count }) => (
              <div key={grade} className="flex items-center gap-4">
                <div className="w-12">
                  <Badge variant="outline" className="w-full justify-center">
                    Grade {grade}
                  </Badge>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-slate-200 rounded-full h-6 relative">
                    <div
                      className="h-6 rounded-full bg-indigo-500 transition-all flex items-center justify-center"
                      style={{
                        width: stats.total > 0 ? `${(count / stats.total) * 100}%` : '0%',
                        minWidth: count > 0 ? '40px' : '0px'
                      }}
                    >
                      {count > 0 && <span className="text-xs font-semibold text-white">{count}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      {filtered.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filtered.slice(0, 50).map((pg) => (
                <div key={pg.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-slate-50">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{pg.student_name}</p>
                    <p className="text-sm text-slate-600">
                      {pg.subject_name} • {pg.class_name}
                    </p>
                    {pg.rationale && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{pg.rationale}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-indigo-600">{pg.predicted_ib_grade}</p>
                      <Badge
                        variant="outline"
                        className={
                          pg.confidence_level === 'high'
                            ? 'bg-emerald-50 text-emerald-700'
                            : pg.confidence_level === 'medium'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }
                      >
                        {pg.confidence_level}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}