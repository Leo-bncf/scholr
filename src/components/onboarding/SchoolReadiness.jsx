import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap, Users, BookOpen, Layers, Mail, Link2,
  CheckCircle2, AlertCircle, Rocket, Clock
} from 'lucide-react';

/**
 * Top-of-page readiness snapshot: shows at-a-glance how close the school
 * is to being ready to go live (users invited & accepted, classes populated,
 * parent links set up).
 */
export default function SchoolReadiness({ schoolId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['school-readiness', schoolId],
    queryFn: async () => {
      const [memberships, invitations, classes, subjects, links, academicYears] = await Promise.all([
        base44.entities.SchoolMembership.filter({ school_id: schoolId, status: 'active' }),
        base44.entities.UserInvitation.filter({ school_id: schoolId }),
        base44.entities.Class.filter({ school_id: schoolId, status: 'active' }),
        base44.entities.Subject.filter({ school_id: schoolId }),
        base44.entities.ParentStudentLink.filter({ school_id: schoolId }),
        base44.entities.AcademicYear.filter({ school_id: schoolId }),
      ]);

      const teachers = memberships.filter(m => ['teacher', 'ib_coordinator'].includes(m.role));
      const students = memberships.filter(m => m.role === 'student');
      const parents = memberships.filter(m => m.role === 'parent');
      const pendingInvites = invitations.filter(
        i => i.status === 'pending' && new Date(i.expires_at) > new Date()
      );
      const acceptedInvites = invitations.filter(i => i.status === 'accepted');
      const classesWithTeachers = classes.filter(c =>
        (c.teacher_ids && c.teacher_ids.length > 0) ||
        (c.subject_teacher_assignments?.some(a => a.teacher_ids?.length > 0))
      );
      const classesWithStudents = classes.filter(c => c.student_ids?.length > 0);

      return {
        academicYears: academicYears.length,
        subjects: subjects.length,
        classes: classes.length,
        classesWithTeachers: classesWithTeachers.length,
        classesWithStudents: classesWithStudents.length,
        teachers: teachers.length,
        students: students.length,
        parents: parents.length,
        pendingInvites: pendingInvites.length,
        acceptedInvites: acceptedInvites.length,
        totalInvites: invitations.length,
        parentLinks: links.length,
      };
    },
    enabled: !!schoolId,
    staleTime: 30 * 1000,
  });

  if (isLoading || !data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="animate-pulse h-24 bg-slate-100 rounded" />
      </div>
    );
  }

  const gates = [
    { id: 'foundation', label: 'Academic foundation', value: data.academicYears > 0 && data.subjects > 0, detail: `${data.academicYears} year${data.academicYears !== 1 ? 's' : ''} · ${data.subjects} subject${data.subjects !== 1 ? 's' : ''}`, icon: GraduationCap },
    { id: 'classes', label: 'Classes created', value: data.classes > 0, detail: `${data.classes} class${data.classes !== 1 ? 'es' : ''}`, icon: Layers },
    { id: 'teachers', label: 'Teachers active', value: data.teachers > 0, detail: `${data.teachers} teacher${data.teachers !== 1 ? 's' : ''} on platform`, icon: Users },
    { id: 'teacher_assignments', label: 'Teachers assigned to classes', value: data.classesWithTeachers === data.classes && data.classes > 0, detail: `${data.classesWithTeachers}/${data.classes} classes staffed`, icon: BookOpen },
    { id: 'students', label: 'Students enrolled', value: data.students > 0, detail: `${data.students} student${data.students !== 1 ? 's' : ''}`, icon: GraduationCap },
    { id: 'student_rosters', label: 'Classes populated with students', value: data.classesWithStudents === data.classes && data.classes > 0, detail: `${data.classesWithStudents}/${data.classes} classes have students`, icon: Users },
    { id: 'parents', label: 'Parent–student links', value: data.parents === 0 || data.parentLinks > 0, detail: data.parents === 0 ? 'No parents yet (optional)' : `${data.parentLinks} link${data.parentLinks !== 1 ? 's' : ''} · ${data.parents} parent${data.parents !== 1 ? 's' : ''}`, icon: Link2 },
  ];

  const doneCount = gates.filter(g => g.value).length;
  const pct = Math.round((doneCount / gates.length) * 100);
  const isReady = doneCount === gates.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`px-6 py-5 ${isReady ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-indigo-600 to-indigo-500'} text-white`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {isReady ? <Rocket className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            <div>
              <h2 className="text-base font-bold">
                {isReady ? 'Your school is ready to launch' : 'School activation progress'}
              </h2>
              <p className="text-xs text-white/80">
                {isReady
                  ? 'All key setup tasks are complete. Users can log in and start working.'
                  : `${doneCount} of ${gates.length} activation gates complete`
                }
              </p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-0 text-xs">{pct}%</Badge>
        </div>
        <Progress value={pct} className="h-1.5 bg-white/25" indicatorClassName="bg-white" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
        <StatTile icon={Mail} color="indigo" label="Pending invites" value={data.pendingInvites} sub={`${data.acceptedInvites} accepted`} />
        <StatTile icon={Users} color="sky" label="Teachers" value={data.teachers} sub={`${data.classesWithTeachers}/${data.classes || 0} classes staffed`} />
        <StatTile icon={GraduationCap} color="emerald" label="Students" value={data.students} sub={`${data.classesWithStudents}/${data.classes || 0} classes populated`} />
        <StatTile icon={Link2} color="violet" label="Parent links" value={data.parentLinks} sub={`${data.parents} parent${data.parents !== 1 ? 's' : ''}`} />
      </div>

      <div className="border-t border-slate-100 divide-y divide-slate-50">
        {gates.map((gate) => {
          const Icon = gate.icon;
          return (
            <div key={gate.id} className="px-5 py-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${gate.value ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                {gate.value
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  : <AlertCircle className="w-4 h-4 text-slate-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${gate.value ? 'text-slate-900' : 'text-slate-600'}`}>
                  {gate.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <Icon className="w-3 h-3" /> {gate.detail}
                </p>
              </div>
              {gate.value && <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px]">Ready</Badge>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, color, label, value, sub }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
        <p className="text-[10px] text-slate-500 truncate">{sub}</p>
      </div>
    </div>
  );
}