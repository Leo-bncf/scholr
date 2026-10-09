import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatusChip from '@/components/app/StatusChip';
import TeacherPage from '@/components/teacher/TeacherPage';
import { ClassSignals, PageLoading } from '@/components/teacher/bits';
import { useTeacherLoad } from '@/components/teacher/useTeacherLoad';
import { classUrl } from '@/components/teacher/links';
import { useUser } from '@/components/auth/UserContext';
import * as classesData from '@/data/classes';

/**
 * Classes — every class this teacher teaches, as a list.
 *
 * Was a grid of cards, each with a coloured stripe picked by position from six
 * hues (so a class changed colour when the list reordered) and nothing on the
 * card but a student count. A teacher opens this page to get into a class, and
 * to see which one needs them; the rows now carry that instead.
 */
export default function TeacherClasses() {
  const { schoolId, user, effectiveUserId } = useUser();
  const teacherId = effectiveUserId || user?.id;
  const [tab, setTab] = useState('active');
  const load = useTeacherLoad();

  const { data: archived = [], isLoading: loadingArchived } = useQuery({
    queryKey: ['teacher-classes-archived', schoolId, teacherId],
    queryFn: () => classesData.listForTeacher(schoolId, teacherId, { status: 'archived' }),
    enabled: tab === 'archived' && !!schoolId && !!teacherId,
  });

  const rows = [...load.byClass.values()];

  return (
    <TeacherPage
      title="Classes"
      eyebrow={load.classes.length ? `${load.classes.length} teaching this year` : undefined}
      tabs={[
        { value: 'active', label: 'Teaching' },
        { value: 'archived', label: 'Archived' },
      ]}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'active' && (load.isLoading ? <PageLoading /> : (
        <Group>
          {rows.length === 0 ? (
            <GroupEmpty>You aren't teaching any classes yet. When your school adds you to one it will appear here.</GroupEmpty>
          ) : rows.map((r) => (
            <Row
              key={r.cls.id}
              href={classUrl(r.cls.id)}
              label={r.cls.name}
              detail={[
                r.cls.subject?.name,
                `${r.students} student${r.students === 1 ? '' : 's'}`,
                r.cls.room && `Room ${r.cls.room}`,
                r.nextDue && `next due ${format(new Date(r.nextDue.due_date), 'd MMM')}`,
              ].filter(Boolean).join(' · ')}
            >
              <ClassSignals row={r} />
            </Row>
          ))}
        </Group>
      ))}

      {tab === 'archived' && (loadingArchived ? <PageLoading /> : (
        <Group>
          {archived.length === 0 ? (
            <GroupEmpty>No archived classes. Classes from earlier years appear here once your school archives them.</GroupEmpty>
          ) : archived.map((c) => (
            <Row
              key={c.id}
              href={classUrl(c.id)}
              label={c.name}
              detail={[c.subject?.name, `${c.student_ids?.length || 0} students`].filter(Boolean).join(' · ')}
            >
              <StatusChip tone="mute">Archived</StatusChip>
            </Row>
          ))}
        </Group>
      ))}
    </TeacherPage>
  );
}
