import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import * as attendanceData from '@/data/attendance';

/**
 * Attendance for one class over the last 30 days, overall and per student.
 *
 * "Rate" counts late as attended — the student was in the room — which is how
 * the school-wide attendance pages count it too.
 */
export function useClassAttendanceSummary(classData, days = 30) {
  const to = format(new Date(), 'yyyy-MM-dd');
  const from = format(subDays(new Date(), days), 'yyyy-MM-dd');

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['class-attendance-summary', classData.id, from, to],
    queryFn: () => attendanceData.listForClassBetween(classData.id, from, to),
  });

  return useMemo(() => {
    const per = new Map();
    for (const r of records) {
      const s = per.get(r.student_id) || { present: 0, late: 0, absent: 0, excused: 0, total: 0 };
      s[r.status] = (s[r.status] || 0) + 1;
      s.total += 1;
      per.set(r.student_id, s);
    }
    const rateOf = (s) => (s.total ? Math.round(((s.present + s.late) / s.total) * 100) : null);
    const all = [...per.values()].reduce((a, s) => ({ attended: a.attended + s.present + s.late, total: a.total + s.total }), { attended: 0, total: 0 });
    return {
      isLoading,
      rate: all.total ? Math.round((all.attended / all.total) * 100) : null,
      forStudent: (id) => {
        const s = per.get(id);
        return s ? { ...s, rate: rateOf(s) } : null;
      },
    };
  }, [records, isLoading]);
}
