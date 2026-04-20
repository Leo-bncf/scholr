import React from 'react';
import DemoShell from '@/components/demo-sandbox/DemoShell';
import DemoSectionCard from '@/components/demo-sandbox/DemoSectionCard';
import { LEADER, SCHOOL_METRICS, ENROLLMENT_TREND, GRADE_DISTRIBUTION, ANNOUNCEMENTS } from '@/components/demo-sandbox/mockSchoolData';
import { Users, GraduationCap, BookOpen, CheckCircle2, TrendingUp, LifeBuoy } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';

export default function DemoLeader() {
  const metrics = [
    { label: 'Students', value: SCHOOL_METRICS.totalStudents, icon: GraduationCap, color: 'text-sky-600 bg-sky-50' },
    { label: 'Teachers', value: SCHOOL_METRICS.totalTeachers, icon: Users, color: 'text-violet-600 bg-violet-50' },
    { label: 'Active classes', value: SCHOOL_METRICS.activeClasses, icon: BookOpen, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Attendance', value: `${SCHOOL_METRICS.attendanceRate}%`, icon: CheckCircle2, color: 'text-amber-600 bg-amber-50' },
    { label: 'Avg predicted', value: SCHOOL_METRICS.avgPredictedGrade, icon: TrendingUp, color: 'text-rose-600 bg-rose-50' },
    { label: 'Open tickets', value: SCHOOL_METRICS.openSupportTickets, icon: LifeBuoy, color: 'text-slate-600 bg-slate-100' },
  ];

  return (
    <DemoShell roleLabel="School Leader" userName={LEADER.name} userInitials={LEADER.avatarInitials} accent="bg-violet-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">School overview</h1>
        <p className="text-sm text-slate-500 mt-1">{LEADER.title} · {LEADER.name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${m.color} mb-3`}>
              <m.icon className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{m.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DemoSectionCard title="Enrollment trend" className="lg:col-span-2">
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ENROLLMENT_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Line type="monotone" dataKey="students" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DemoSectionCard>

        <DemoSectionCard title="Staff notices">
          <div className="space-y-3">
            {ANNOUNCEMENTS.map((n) => (
              <div key={n.id} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-slate-900">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{n.from} · {n.when}</p>
              </div>
            ))}
          </div>
        </DemoSectionCard>

        <DemoSectionCard title="Grade distribution (all students)" className="lg:col-span-3">
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={GRADE_DISTRIBUTION} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="grade" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DemoSectionCard>
      </div>
    </DemoShell>
  );
}