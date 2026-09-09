import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { format, parseISO } from 'date-fns';
import * as gradebookData from '@/data/gradebook';

function TrendBadge({ trend }) {
  if (trend > 0) return <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold"><TrendingUp className="w-3 h-3" />+{trend.toFixed(1)}%</span>;
  if (trend < 0) return <span className="flex items-center gap-1 text-red-600 text-xs font-semibold"><TrendingDown className="w-3 h-3" />{trend.toFixed(1)}%</span>;
  return <span className="flex items-center gap-1 text-slate-400 text-xs"><Minus className="w-3 h-3" />No change</span>;
}

export default function PerformanceTrends({ schoolId, userId, classes }) {
  const [classFilter, setClassFilter] = useState('all');

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['student-grades-trends', schoolId, userId],
    queryFn: () => gradebookData.whereGradeItems({
      school_id: schoolId, student_id: userId, visible_to_student: true, status: 'published',
    }, { order: 'created_at', ascending: false }),
    enabled: !!schoolId && !!userId,
  });

  const classMap = useMemo(() => Object.fromEntries(classes.map(c => [c.id, c.name])), [classes]);

  const filtered = useMemo(() =>
    classFilter === 'all' ? grades : grades.filter(g => g.class_id === classFilter),
    [grades, classFilter]
  );

  // Monthly average trend data
  const trendData = useMemo(() => {
    const byMonth = {};
    filtered.forEach(g => {
      if (g.score == null || !g.max_score || !g.created_at) return;
      const month = format(parseISO(g.created_at), 'MMM yyyy');
      if (!byMonth[month]) byMonth[month] = { month, scores: [], date: parseISO(g.created_at) };
      byMonth[month].scores.push((g.score / g.max_score) * 100);
    });
    return Object.values(byMonth)
      .sort((a, b) => a.date - b.date)
      .slice(-8)
      .map(({ month, scores }) => ({
        month,
        avg: parseFloat((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1)),
        count: scores.length,
      }));
  }, [filtered]);

  // Per-class average bars
  const classAvgs = useMemo(() => {
    const byClass = {};
    grades.forEach(g => {
      if (g.score == null || !g.max_score) return;
      const name = classMap[g.class_id] || 'Unknown';
      if (!byClass[name]) byClass[name] = { class: name, scores: [] };
      byClass[name].scores.push((g.score / g.max_score) * 100);
    });
    return Object.values(byClass).map(({ class: c, scores }) => ({
      class: c.length > 16 ? c.slice(0, 16) + '…' : c,
      avg: parseFloat((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1)),
    }));
  }, [grades, classMap]);

  // Trend direction
  const trend = useMemo(() => {
    if (trendData.length < 2) return 0;
    return trendData[trendData.length - 1].avg - trendData[0].avg;
  }, [trendData]);

  const overallAvg = useMemo(() => {
    const valid = filtered.filter(g => g.score != null && g.max_score);
    if (!valid.length) return null;
    return (valid.reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / valid.length).toFixed(1);
  }, [filtered]);

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  if (!grades.length) return (
    <div className="text-center py-16 text-slate-400">
      <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-300" />
      <p>Not enough grade data to show trends yet</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          {overallAvg && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3">
              <p className="text-xs text-indigo-600 font-medium">Overall Average</p>
              <p className="text-2xl font-bold text-indigo-900">{overallAvg}%</p>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <p className="text-xs text-slate-500">Trend</p>
            <TrendBadge trend={trend} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Graded items</p>
            <p className="text-lg font-bold text-slate-900">{filtered.filter(g => g.score != null).length}</p>
          </div>
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-48 h-9 text-sm"><SelectValue placeholder="All classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Grade trend line chart */}
      {trendData.length >= 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900 mb-4 text-sm">Grade Trend Over Time</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v) => [`${v}%`, 'Average']} />
              <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-class comparison */}
      {classAvgs.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900 mb-4 text-sm">Average by Class</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={classAvgs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="class" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v) => [`${v}%`, 'Average']} />
              <Bar dataKey="avg" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Grade distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="font-semibold text-slate-900 mb-4 text-sm">Grade Distribution</p>
        <div className="space-y-2">
          {[
            { label: 'Excellent (≥80%)', min: 80, color: 'bg-emerald-500' },
            { label: 'Good (65–79%)', min: 65, max: 80, color: 'bg-blue-500' },
            { label: 'Pass (50–64%)', min: 50, max: 65, color: 'bg-amber-500' },
            { label: 'Below pass (<50%)', max: 50, color: 'bg-red-400' },
          ].map(({ label, min = 0, max = 101, color }) => {
            const count = filtered.filter(g => {
              if (g.score == null || !g.max_score) return false;
              const p = (g.score / g.max_score) * 100;
              return p >= min && p < max;
            }).length;
            const total = filtered.filter(g => g.score != null && g.max_score).length;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={label} className="flex items-center gap-3">
                <p className="text-xs text-slate-600 w-36 flex-shrink-0">{label}</p>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs font-semibold text-slate-700 w-8 text-right">{count}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}