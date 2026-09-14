import React from 'react';
import { Users, BookOpen, BarChart3, Calendar, AlertTriangle, TrendingUp, GraduationCap, CheckCircle2 } from 'lucide-react';

function KpiCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'scholr-accent scholr-accent-sf',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    rose: 'text-rose-600 bg-rose-50',
    violet: 'scholr-accent scholr-accent-sf',
    sky: 'text-sky-600 bg-sky-50',
  };
  return (
    <div className="bg-white rounded-xl border scholr-rule p-5 flex items-start gap-4">
      <div className={`rounded-lg p-2.5 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm scholr-muted">{label}</p>
        <p className="text-2xl font-bold scholr-ink mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs scholr-faint mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function ReportsCenterOverview({ memberships, classes, grades, attendance, behavior, predictedGrades, casExperiences }) {
  const students = memberships.filter(m => m.role === 'student');
  const teachers = memberships.filter(m => m.role === 'teacher');
  const absentCount = attendance.filter(a => a.status === 'absent').length;
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const attendanceRate = attendance.length > 0
    ? ((presentCount / attendance.length) * 100).toFixed(1)
    : null;
  const incidentCount = behavior.filter(b => b.type === 'incident').length;
  const casApproved = casExperiences.filter(c => c.status === 'approved').length;
  const pgCount = predictedGrades.filter(p => p.predicted_ib_grade).length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold scholr-muted uppercase tracking-wide mb-4">School Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <KpiCard icon={Users} label="Students" value={students.length} color="indigo" />
          <KpiCard icon={Users} label="Teaching Staff" value={teachers.length} color="sky" />
          <KpiCard icon={BookOpen} label="Active Classes" value={classes.length} color="emerald" />
          <KpiCard icon={BarChart3} label="Grade Records" value={grades.length} color="violet" />
          <KpiCard icon={Calendar} label="Attendance Records" value={attendance.length} sub={attendanceRate ? `${attendanceRate}% present rate` : null} color="amber" />
          <KpiCard icon={AlertTriangle} label="Incidents" value={incidentCount} color="rose" />
          <KpiCard icon={TrendingUp} label="Predicted Grades" value={pgCount} color="violet" />
          <KpiCard icon={CheckCircle2} label="CAS Approved" value={casApproved} color="emerald" />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold scholr-muted uppercase tracking-wide mb-4">Attendance Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Present', count: presentCount, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            { label: 'Absent', count: absentCount, color: 'bg-red-50 border-red-200 text-red-700' },
            { label: 'Late', count: attendance.filter(a => a.status === 'late').length, color: 'bg-amber-50 border-amber-200 text-amber-700' },
            { label: 'Excused', count: attendance.filter(a => a.status === 'excused').length, color: 'bg-blue-50 border-blue-200 text-blue-700' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`rounded-xl border p-4 text-center ${color}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold scholr-muted uppercase tracking-wide mb-4">Behavior Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Positive', type: 'positive', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            { label: 'Concerns', type: 'concern', color: 'bg-amber-50 border-amber-200 text-amber-700' },
            { label: 'Incidents', type: 'incident', color: 'bg-red-50 border-red-200 text-red-700' },
            { label: 'Notes', type: 'note', color: 'scholr-sunk scholr-rule scholr-muted' },
          ].map(({ label, type, color }) => (
            <div key={type} className={`rounded-xl border p-4 text-center ${color}`}>
              <p className="text-2xl font-bold">{behavior.filter(b => b.type === type).length}</p>
              <p className="text-sm font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {(predictedGrades.length > 0 || casExperiences.length > 0) && (
        <div>
          <h2 className="text-sm font-semibold scholr-muted uppercase tracking-wide mb-4">IB Core Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border scholr-rule p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 scholr-accent" />
                <h3 className="font-semibold scholr-ink">Predicted Grades</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3,4,5,6,7].reduce((acc, grade) => {
                  const count = predictedGrades.filter(p => p.predicted_ib_grade === grade).length;
                  if (count > 0) acc.push({ grade, count });
                  return acc;
                }, []).map(({ grade, count }) => (
                  <div key={grade} className="scholr-accent-sf rounded-lg p-2 text-center">
                    <p className="text-lg font-bold scholr-accent">{grade}</p>
                    <p className="text-xs scholr-accent">{count} student{count !== 1 ? 's' : ''}</p>
                  </div>
                ))}
                {predictedGrades.length === 0 && <p className="text-sm scholr-faint col-span-3">No predicted grades recorded</p>}
              </div>
            </div>

            <div className="bg-white rounded-xl border scholr-rule p-5">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold scholr-ink">CAS Experiences</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['creativity', 'activity', 'service'].map(strand => {
                  const count = casExperiences.filter(c => c.cas_strands?.includes(strand)).length;
                  return (
                    <div key={strand} className="bg-emerald-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-emerald-700">{count}</p>
                      <p className="text-xs text-emerald-500 capitalize">{strand}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}