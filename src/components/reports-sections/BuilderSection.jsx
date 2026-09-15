import { Field, SelectField } from '@/components/app/Field';
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown, FileSpreadsheet } from 'lucide-react';
import ReportingFilters from '@/components/reporting/ReportingFilters';
import ReportingSummaryCards from '@/components/reporting/ReportingSummaryCards';
import ReportingChartPanel from '@/components/reporting/ReportingChartPanel';
import ReportingTable from '@/components/reporting/ReportingTable';
import { downloadCSV } from '@/components/reporting/reportingExportUtils';
import * as membershipsData from '@/data/memberships';
import * as classesData from '@/data/classes';
import * as academics from '@/data/academics';
import * as gradebookData from '@/data/gradebook';
import * as attendanceData from '@/data/attendance';
import * as fns from '@/data/functions';

const reportConfigs = {
  student_performance: {
    label: 'Student Performance',
    columns: [
      { key: 'student', label: 'Student' },
      { key: 'className', label: 'Class' },
      { key: 'subjectName', label: 'Subject' },
      { key: 'averageScore', label: 'Average Score %' },
      { key: 'items', label: 'Grade Items' },
    ],
  },
  class_averages: {
    label: 'Class Averages',
    columns: [
      { key: 'className', label: 'Class' },
      { key: 'subjectName', label: 'Subject' },
      { key: 'averageScore', label: 'Average Score %' },
      { key: 'studentCount', label: 'Students' },
    ],
  },
  teacher_performance: {
    label: 'Teacher Performance',
    columns: [
      { key: 'teacher', label: 'Teacher' },
      { key: 'classes', label: 'Classes' },
      { key: 'averageScore', label: 'Average Score %' },
      { key: 'attendanceRate', label: 'Attendance %' },
    ],
  },
  attendance_summaries: {
    label: 'Attendance Summaries',
    columns: [
      { key: 'className', label: 'Class' },
      { key: 'teacher', label: 'Teacher' },
      { key: 'present', label: 'Present' },
      { key: 'absent', label: 'Absent' },
      { key: 'attendanceRate', label: 'Attendance %' },
    ],
  },
};

export default function BuilderSection() {
  const { user, school, schoolId } = useUser();
  const [reportType, setReportType] = useState('student_performance');
  const [filters, setFilters] = useState({ startDate: '', endDate: '', subjectId: 'all', classId: 'all', teacherId: 'all' });

  const { data, isLoading } = useQuery({
    queryKey: ['reporting-engine', schoolId],
    queryFn: async () => {
      const [memberships, classes, subjects, grades, attendance] = await Promise.all([
        membershipsData.where({ school_id: schoolId, status: 'active' }),
        classesData.where({ school_id: schoolId, status: 'active' }),
        academics.whereSubjects({ school_id: schoolId, status: 'active' }),
        gradebookData.whereGradeItems({ school_id: schoolId }),
        attendanceData.whereRecords({ school_id: schoolId }),
      ]);
      return { memberships, classes, subjects, grades, attendance };
    },
    enabled: !!schoolId,
    staleTime: 300000,
  });

  const computed = useMemo(() => {
    if (!data) return { rows: [], cards: [], chartData: [] };

    const subjectMap = Object.fromEntries(data.subjects.map((item) => [item.id, item]));
    const teacherMap = Object.fromEntries(data.memberships.filter((item) => item.role === 'teacher').map((item) => [item.user_id, item]));

    const filteredClasses = data.classes.filter((item) => {
      if (filters.classId !== 'all' && item.id !== filters.classId) return false;
      if (filters.teacherId !== 'all' && !item.teacher_ids?.includes(filters.teacherId)) return false;
      if (filters.subjectId !== 'all') {
        const subjectMatch = item.subject_id === filters.subjectId || item.subject_teacher_assignments?.some((entry) => entry.subject_id === filters.subjectId);
        if (!subjectMatch) return false;
      }
      return true;
    });

    const filteredClassIds = new Set(filteredClasses.map((item) => item.id));
    const filteredGrades = data.grades.filter((item) => filteredClassIds.has(item.class_id) && item.score != null && item.max_score);
    const filteredAttendance = data.attendance.filter((item) => filteredClassIds.has(item.class_id));

    let rows = [];
    let chartData = [];

    if (reportType === 'student_performance') {
      const grouped = {};
      filteredGrades.forEach((grade) => {
        const key = `${grade.student_id}_${grade.class_id}`;
        if (!grouped[key]) grouped[key] = { id: key, student: grade.student_name, className: data.classes.find((item) => item.id === grade.class_id)?.name || '—', subjectName: subjectMap[data.classes.find((item) => item.id === grade.class_id)?.subject_id]?.name || '—', scores: [] };
        grouped[key].scores.push((grade.score / grade.max_score) * 100);
      });
      rows = Object.values(grouped).map((item) => ({ ...item, averageScore: Math.round(item.scores.reduce((sum, value) => sum + value, 0) / item.scores.length), items: item.scores.length }));
      chartData = rows.slice(0, 10).map((item) => ({ label: item.student, value: item.averageScore }));
    }

    if (reportType === 'class_averages') {
      rows = filteredClasses.map((classItem) => {
        const classGrades = filteredGrades.filter((grade) => grade.class_id === classItem.id);
        const averageScore = classGrades.length ? Math.round(classGrades.reduce((sum, grade) => sum + ((grade.score / grade.max_score) * 100), 0) / classGrades.length) : 0;
        return { id: classItem.id, className: classItem.name, subjectName: subjectMap[classItem.subject_id]?.name || '—', averageScore, studentCount: classItem.student_ids?.length || 0 };
      });
      chartData = rows.map((item) => ({ label: item.className, value: item.averageScore }));
    }

    if (reportType === 'teacher_performance') {
      rows = data.memberships.filter((item) => item.role === 'teacher').map((teacher) => {
        const teacherClasses = filteredClasses.filter((classItem) => classItem.teacher_ids?.includes(teacher.user_id));
        const teacherClassIds = new Set(teacherClasses.map((item) => item.id));
        const teacherGrades = filteredGrades.filter((grade) => teacherClassIds.has(grade.class_id));
        const teacherAttendance = filteredAttendance.filter((record) => teacherClassIds.has(record.class_id));
        const averageScore = teacherGrades.length ? Math.round(teacherGrades.reduce((sum, grade) => sum + ((grade.score / grade.max_score) * 100), 0) / teacherGrades.length) : 0;
        const present = teacherAttendance.filter((record) => record.status === 'present').length;
        const attendanceRate = teacherAttendance.length ? Math.round((present / teacherAttendance.length) * 100) : 0;
        return { id: teacher.user_id, teacher: teacher.user_name || teacher.user_email, classes: teacherClasses.length, averageScore, attendanceRate };
      }).filter((item) => filters.teacherId === 'all' || item.id === filters.teacherId);
      chartData = rows.map((item) => ({ label: item.teacher, value: item.averageScore }));
    }

    if (reportType === 'attendance_summaries') {
      rows = filteredClasses.map((classItem) => {
        const teacher = teacherMap[classItem.primary_teacher_id] || teacherMap[classItem.teacher_ids?.[0]];
        const classAttendance = filteredAttendance.filter((record) => record.class_id === classItem.id);
        const present = classAttendance.filter((record) => record.status === 'present').length;
        const absent = classAttendance.filter((record) => record.status === 'absent').length;
        const attendanceRate = classAttendance.length ? Math.round((present / classAttendance.length) * 100) : 0;
        return { id: classItem.id, className: classItem.name, teacher: teacher?.user_name || teacher?.user_email || '—', present, absent, attendanceRate };
      });
      chartData = rows.map((item) => ({ label: item.className, value: item.attendanceRate }));
    }

    const cards = [
      { label: 'Rows', value: rows.length, helper: 'Current result set' },
      { label: 'Classes', value: filteredClasses.length, helper: 'After filters' },
      { label: 'Grades', value: filteredGrades.length, helper: 'Scored grade items' },
      { label: 'Attendance', value: filteredAttendance.length, helper: 'Attendance records' },
    ];

    return { rows, cards, chartData };
  }, [data, filters, reportType]);

  const handleExportPDF = async () => {
    const response = await fns.invoke('exportReportPDF', { reportId: null, reporting_engine: { title: reportConfigs[reportType].label, rows: computed.rows, columns: reportConfigs[reportType].columns } });
    const blob = new Blob([response], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (isLoading) {
    return <div className="min-h-screen scholr-sunk flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-700" /></div>;
  }

  return (
    <div className="space-y-4">
      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Field label="Report" htmlFor="rb-type">
          <SelectField
            id="rb-type" label="Report" value={reportType} onChange={setReportType}
            options={Object.entries(reportConfigs).map(([key, config]) => ({ value: key, label: config.label }))}
          />
        </Field>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem' }}>
          <Button variant="outline" onClick={() => downloadCSV(`${reportType}.csv`, reportConfigs[reportType].columns, computed.rows)}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button onClick={handleExportPDF}>
            <FileDown className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>
      <ReportingFilters
        filters={filters}
        setFilters={setFilters}
        subjects={data.subjects}
        classes={data.classes}
        teachers={data.memberships.filter((item) => item.role === 'teacher')}
      />

      <ReportingSummaryCards cards={computed.cards} />

      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
        <ReportingChartPanel title={`${reportConfigs[reportType].label} Chart`} data={computed.chartData.slice(0, 12)} />
        <ReportingTable columns={reportConfigs[reportType].columns} rows={computed.rows} />
      </div>
    </div>
  );
}
