import { Group, Row } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatusChip from '@/components/app/StatusChip';
import Meter from '@/components/app/Meter';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import * as membershipsData from '@/data/memberships';
import * as userInvitationsData from '@/data/userInvitations';
import * as classesData from '@/data/classes';
import * as academics from '@/data/academics';
import * as parentStudentLinksData from '@/data/parentStudentLinks';
import {
  GraduationCap, Users, BookOpen, Layers, Link2
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
        membershipsData.where({ school_id: schoolId, status: 'active' }),
        userInvitationsData.where({ school_id: schoolId }),
        classesData.where({ school_id: schoolId, status: 'active' }),
        academics.whereSubjects({ school_id: schoolId }),
        parentStudentLinksData.where({ school_id: schoolId }),
        academics.whereAcademicYears({ school_id: schoolId }),
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
      <Group>
        <div className="animate-pulse h-24 scholr-sunk rounded m-4" />
      </Group>
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
    <Group
      title={isReady ? 'Ready to go' : 'Getting set up'}
      action={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem' }}>
          <span className="scholr-label" style={{ margin: 0 }}>{doneCount} of {gates.length}</span>
          <span
            className="scholr-num"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '.82rem', color: isReady ? 'var(--good)' : 'var(--body)' }}
          >
            {pct}%
          </span>
        </span>
      }
    >
      {/* This was a full-bleed indigo-to-indigo gradient with white type — the
          loudest thing in the product, on the first page a new school opens,
          in a hue the brand does not use. It said one number. */}
      <div style={{ padding: '.8rem .9rem' }}>
        <p style={{ margin: '0 0 .5rem', fontSize: '.88rem', color: 'var(--muted)' }}>
          {isReady
            ? 'Everything is in place. Staff and students can sign in and start working.'
            : 'Finish the steps below and your school is live. Nothing here has to be done in order.'}
        </p>
        <Meter value={pct} tone={isReady ? 'good' : 'accent'} height={4} />
      </div>

      <div className="scholr-grid app-cols-4">
        <StatCard label="Invitations" value={data.pendingInvites} hint={`${data.acceptedInvites} accepted`} />
        <StatCard label="Teachers" value={data.teachers} hint={`${data.classesWithTeachers} of ${data.classes || 0} classes staffed`} />
        <StatCard label="Students" value={data.students} hint={`${data.classesWithStudents} of ${data.classes || 0} classes filled`} />
        <StatCard label="Parent links" value={data.parentLinks} hint={`${data.parents} parent${data.parents !== 1 ? 's' : ''}`} />
      </div>

      {gates.map((gate) => (
        <Row key={gate.id} label={gate.label} detail={gate.detail}>
          {gate.value
            ? <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>Done</span>
            : <StatusChip tone="warn">To do</StatusChip>}
        </Row>
      ))}
    </Group>
  );
}
