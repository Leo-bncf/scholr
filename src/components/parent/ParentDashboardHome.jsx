import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isAfter, addDays, differenceInCalendarDays } from 'date-fns';
import { CheckCircle } from 'lucide-react';
import StatusChip from '@/components/app/StatusChip';
import { Panel, PanelRow, PanelEmpty } from '@/components/app/Panel';
import * as classesData from '@/data/classes';
import * as assignmentsData from '@/data/assignments';
import * as gradebookData from '@/data/gradebook';
import * as attendanceData from '@/data/attendance';
import * as messagesData from '@/data/messages';

export default function ParentDashboardHome({ schoolId, studentId, parentUserId }) {
  const queryClient = useQueryClient();
  const now = new Date();

  // Fetch child's classes
  const { data: classes = [] } = useQuery({
    queryKey: ['parent-child-classes', schoolId, studentId],
    queryFn: async () => {
      const all = await classesData.where({ school_id: schoolId, status: 'active' });
      return all.filter(c => c.student_ids?.includes(studentId));
    },
    enabled: !!schoolId && !!studentId,
  });

  const classIds = classes.map(c => c.id);

  // Upcoming deadlines
  const { data: assignments = [] } = useQuery({
    queryKey: ['parent-child-assignments', schoolId, studentId],
    queryFn: async () => {
      const all = await assignmentsData.where({ school_id: schoolId, status: 'published' });
      return all
        .filter(a => classIds.includes(a.class_id) && a.due_date && isAfter(new Date(a.due_date), now))
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    },
    enabled: !!schoolId && classIds.length > 0,
  });

  // Recent grades (released to parent)
  const { data: grades = [] } = useQuery({
    queryKey: ['parent-child-grades', schoolId, studentId],
    queryFn: async () => {
      const all = await gradebookData.whereGradeItems({
        school_id: schoolId,
        student_id: studentId,
        visible_to_parent: true,
        status: 'published',
      });
      return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
    },
    enabled: !!schoolId && !!studentId,
  });

  // Recent attendance issues
  const { data: attendance = [] } = useQuery({
    queryKey: ['parent-child-attendance-issues', schoolId, studentId],
    queryFn: async () => {
      const cutoff = format(addDays(now, -30), 'yyyy-MM-dd');
      const all = await attendanceData.whereRecords({ school_id: schoolId, student_id: studentId });
      return all
        .filter(a => a.status !== 'present' && a.date >= cutoff)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6);
    },
    enabled: !!schoolId && !!studentId,
  });

  // Messages for this parent
  const { data: messages = [] } = useQuery({
    queryKey: ['parent-messages', schoolId, parentUserId],
    queryFn: async () => {
      const all = await messagesData.where({ school_id: schoolId });
      return all
        .filter(m => m.recipient_ids?.includes(parentUserId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 8);
    },
    enabled: !!schoolId && !!parentUserId,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (msg) => {
      const readBy = Array.from(new Set([...(msg.read_by || []), parentUserId]));
      return messagesData.update(msg.id, { read_by: readBy });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-messages', schoolId, parentUserId] });
    },
  });

  const unreadMessages = messages.filter(m => !m.read_by?.includes(parentUserId));
  const readMessages = messages.filter(m => m.read_by?.includes(parentUserId));

  // Only imminence gets a status colour. A deadline three weeks out is not a
  // warning, and colouring it one teaches parents to ignore the colour.
  const dueTone = (dueDate) => {
    const days = differenceInCalendarDays(new Date(dueDate), now);
    if (days <= 2) return 'crit';
    if (days <= 7) return 'warn';
    return 'mute';
  };

  const ATTENDANCE_TONE = { absent: 'crit', late: 'warn', excused: 'info' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">

      <Panel title="Coming up">
        {assignments.length === 0 ? (
          <PanelEmpty>Nothing due in the near future.</PanelEmpty>
        ) : (
          assignments.slice(0, 6).map(a => (
            <PanelRow key={a.id} name={a.title} detail={a.type?.replace(/_/g, ' ')}>
              <StatusChip tone={dueTone(a.due_date)}>{format(new Date(a.due_date), 'd MMM')}</StatusChip>
            </PanelRow>
          ))
        )}
      </Panel>

      <Panel title="Grades released">
        {grades.length === 0 ? (
          <PanelEmpty>
            Nothing released yet. Teachers choose when a grade becomes visible to families.
          </PanelEmpty>
        ) : (
          grades.map(g => (
            <PanelRow
              key={g.id}
              name={g.title}
              detail={[
                g.score != null && g.max_score ? `${g.score}/${g.max_score}` : null,
                g.created_at ? format(new Date(g.created_at), 'd MMM') : null,
              ].filter(Boolean).join(' · ')}
              // Deliberately uncoloured. A grade is a result, not an alert, and
              // the reserved palette is for things that need acting on.
              value={
                g.ib_grade != null ? `${g.ib_grade}/7`
                  : g.percentage != null ? `${g.percentage}%`
                  : '—'
              }
            />
          ))
        )}
      </Panel>

      <Panel title="Attendance">
        {attendance.length === 0 ? (
          <PanelEmpty>No absences or lates in the last 30 days.</PanelEmpty>
        ) : (
          attendance.map(a => (
            <PanelRow key={a.id} name={format(new Date(a.date), 'EEEE d MMM')} detail={a.note || undefined}>
              <StatusChip tone={ATTENDANCE_TONE[a.status] || 'mute'}>{a.status}</StatusChip>
            </PanelRow>
          ))
        )}
      </Panel>

      <Panel title={unreadMessages.length > 0 ? `Messages · ${unreadMessages.length} unread` : 'Messages'}>
        {messages.length === 0 ? (
          <PanelEmpty>No messages from the school yet.</PanelEmpty>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {unreadMessages.map(msg => (
              <div
                key={msg.id}
                className="panel-row flex items-start gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid var(--rule-soft)', borderLeft: '3px solid var(--brand)' }}
              >
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-sm font-medium" style={{ color: 'var(--ink)' }}>{msg.subject}</p>
                  <p className="m-0 mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
                    {msg.sender_name} · {format(new Date(msg.created_at), 'd MMM')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => acknowledgeMutation.mutate(msg)}
                  disabled={acknowledgeMutation.isPending}
                  className="scholr-focus shrink-0 inline-flex items-center gap-1.5 text-xs font-medium"
                  style={{
                    border: '1px solid var(--rule)',
                    borderRadius: 'var(--radius-control)',
                    padding: '0.3rem 0.6rem',
                    background: 'var(--surface)',
                    color: 'var(--brand)',
                    cursor: acknowledgeMutation.isPending ? 'wait' : 'pointer',
                  }}
                >
                  <CheckCircle className="w-3 h-3" /> Acknowledge
                </button>
              </div>
            ))}
            {readMessages.map(msg => (
              <div
                key={msg.id}
                className="panel-row px-4 py-3"
                style={{ borderBottom: '1px solid var(--rule-soft)', opacity: 0.6 }}
              >
                <p className="m-0 text-sm" style={{ color: 'var(--body)' }}>{msg.subject}</p>
                <p className="m-0 mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
                  {msg.sender_name} · {format(new Date(msg.created_at), 'd MMM')}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>

    </div>
  );
}
