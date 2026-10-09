import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatusChip from '@/components/app/StatusChip';
import Notice from '@/components/app/Notice';
import { SearchField, FilterBar } from '@/components/app/Field';
import EnrollStudentsDialog from '@/components/enrollments/EnrollStudentsDialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useUser } from '@/components/auth/UserContext';
import * as classesData from '@/data/classes';
import * as membershipsData from '@/data/memberships';
import { useClassAttendanceSummary } from './useClassAttendanceSummary';
import { TEACHER_LOAD_KEY } from '../useTeacherLoad';

/**
 * The pupils in a class, with how each one is doing.
 *
 * Per student: attendance over 30 days, average mark, and how many pieces of
 * work are missing — the three things a teacher checks before a parents'
 * evening or a pastoral conversation. The roster table that was here listed
 * names, emails and enrolment status and nothing a teacher acts on.
 *
 * Who may change the roster is unchanged: the primary teacher, or a school
 * admin / coordinator, and never on a locked or archived class.
 */
export default function ClassStudents({ classData, load }) {
  const { user, membership, schoolId } = useUser();
  const queryClient = useQueryClient();
  const attendance = useClassAttendanceSummary(classData);
  const [search, setSearch] = useState('');
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [removing, setRemoving] = useState(null);

  const role = membership?.role;
  const isAdmin = ['school_admin', 'ib_coordinator', 'super_admin'].includes(role);
  const canEdit = !classData.roster_locked && classData.status !== 'archived'
    && (isAdmin || classData.primary_teacher_id === user?.id);

  // Only fetched when the teacher actually opens "Add students".
  const { data: candidates = [] } = useQuery({
    queryKey: ['enrol-candidates', schoolId],
    queryFn: () => membershipsData.listStudents(schoolId),
    enabled: enrollOpen && !!schoolId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['class-details'] });
    queryClient.invalidateQueries({ queryKey: TEACHER_LOAD_KEY });
  };
  const enrol = useMutation({
    mutationFn: (ids) => classesData.enrollStudents(classData.id, ids),
    onSuccess: () => { refresh(); setEnrollOpen(false); },
  });
  const remove = useMutation({
    mutationFn: (id) => classesData.setStudentEnrolled(classData.id, id, false),
    onSuccess: () => { refresh(); setRemoving(null); },
  });

  const students = useMemo(() => (classData.student_ids || []).map((id) => {
    const marks = load.grades.filter((g) => g.student_id === id && g.score != null && g.max_score);
    return {
      id,
      name: load.nameOf.get(id) || 'Student',
      email: load.roster.find((m) => m.user_id === id)?.user_email,
      attendance: attendance.forStudent(id),
      average: marks.length ? Math.round(marks.reduce((n, g) => n + (g.score / g.max_score) * 100, 0) / marks.length) : null,
      missing: load.missing.filter((m) => m.student_id === id).length,
    };
  }).sort((a, b) => a.name.localeCompare(b.name)), [classData.student_ids, load, attendance]);

  const q = search.trim().toLowerCase();
  const shown = q ? students.filter((s) => s.name.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)) : students;
  const failed = enrol.error || remove.error;

  return (
    <>
      <FilterBar>
        {students.length > 8 && (
          <span style={{ width: 'min(100%, 18rem)' }}>
            <SearchField value={search} onChange={setSearch} placeholder="Find a student" label="Find a student" />
          </span>
        )}
        {canEdit && (
          <button type="button" className="pub-btn pub-btn-line scholr-focus" onClick={() => setEnrollOpen(true)} style={{ marginLeft: 'auto' }}>
            <UserPlus className="w-4 h-4" /> Add students
          </button>
        )}
      </FilterBar>

      {classData.roster_locked && (
        <Notice title="This roster is locked">Your school manages who is in this class. Ask a school admin to add or remove students.</Notice>
      )}
      {failed && <Notice tone="crit" title="The roster didn't change">{String(failed.message || failed)}</Notice>}

      <Group title={`${students.length} student${students.length === 1 ? '' : 's'}`}>
        {shown.length === 0 ? (
          <GroupEmpty>{students.length === 0 ? 'No students in this class yet.' : 'No student matches that search.'}</GroupEmpty>
        ) : shown.map((s) => (
          <Row
            key={s.id}
            label={s.name}
            detail={[
              s.attendance?.rate != null ? `${s.attendance.rate}% attendance` : 'no registers yet',
              s.average != null ? `average ${s.average}%` : 'no marks yet',
            ].join(' · ')}
          >
            {s.missing > 0 && <StatusChip tone="warn">{s.missing} missing</StatusChip>}
            {s.attendance?.rate != null && s.attendance.rate < 85 && <StatusChip tone="warn">Attendance</StatusChip>}
            {canEdit && (
              <button
                type="button"
                className="scholr-focus"
                onClick={() => setRemoving(s)}
                style={{ font: 'inherit', fontSize: '.8rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '.2rem .3rem' }}
                aria-label={`Remove ${s.name} from this class`}
              >
                Remove
              </button>
            )}
          </Row>
        ))}
      </Group>

      <EnrollStudentsDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        classItem={classData}
        students={candidates}
        onSave={(ids) => enrol.mutate(ids)}
        isSaving={enrol.isPending}
      />
      <ConfirmDialog
        open={!!removing}
        title={`Remove ${removing?.name} from ${classData.name}?`}
        description="Their submitted work and marks stay on record. You can add them back at any time."
        confirmLabel="Remove"
        isDestructive
        onConfirm={() => remove.mutate(removing.id)}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}
