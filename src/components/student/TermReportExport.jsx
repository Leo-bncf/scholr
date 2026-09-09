import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import * as gradebookData from '@/data/gradebook';
import * as attendanceData from '@/data/attendance';

export default function TermReportExport({ schoolId, userId, userName, schoolName, classes }) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const { data: grades = [] } = useQuery({
    queryKey: ['export-grades', schoolId, userId],
    queryFn: () => gradebookData.whereGradeItems({ school_id: schoolId, student_id: userId, visible_to_student: true, status: 'published' }, { order: 'created_at', ascending: false }),
    enabled: !!schoolId && !!userId,
  });

  const { data: predictions = [] } = useQuery({
    queryKey: ['export-predicted', schoolId, userId],
    queryFn: () => gradebookData.wherePredictedGrades({ school_id: schoolId, student_id: userId, visible_to_student: true }),
    enabled: !!schoolId && !!userId,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['export-attendance', schoolId, userId],
    queryFn: () => attendanceData.whereRecords({ school_id: schoolId, student_id: userId }),
    enabled: !!schoolId && !!userId,
  });

  const classMap = Object.fromEntries(classes.map(c => [c.id, c.name]));

  const generatePDF = async () => {
    setGenerating(true);
    setDone(false);
    try {
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;

      const addLine = (text, size = 11, bold = false, color = [30, 41, 59]) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setTextColor(...color);
        doc.text(text, 14, y);
        y += size * 0.5 + 3;
      };

      const checkPage = (needed = 30) => {
        if (y + needed > 275) { doc.addPage(); y = 20; }
      };

      // Header
      doc.setFillColor(239, 246, 255);
      doc.rect(0, 0, pageW, 38, 'F');
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 27, 75);
      doc.text('Student Progress Report', 14, 16);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`${userName || 'Student'}  ·  ${schoolName || 'School'}  ·  Generated ${format(new Date(), 'MMM d, yyyy')}`, 14, 26);
      doc.setDrawColor(199, 210, 254);
      doc.line(0, 38, pageW, 38);
      y = 50;

      // ── Grades ────────────────────────────────────────────────────────────
      addLine('Academic Grades', 14, true, [30, 27, 75]);
      y += 2;

      const validGrades = grades.filter(g => g.score != null && g.max_score);
      if (validGrades.length === 0) {
        addLine('No grades available.', 10, false, [100, 116, 139]);
      } else {
        // Group by class
        const byClass = {};
        validGrades.forEach(g => {
          const cls = classMap[g.class_id] || 'Other';
          if (!byClass[cls]) byClass[cls] = [];
          byClass[cls].push(g);
        });

        Object.entries(byClass).forEach(([cls, items]) => {
          checkPage(40);
          addLine(cls, 11, true, [55, 65, 81]);
          y += 1;
          items.forEach(g => {
            checkPage(12);
            const pct = ((g.score / g.max_score) * 100).toFixed(0);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text(`${g.title}`, 18, y);
            doc.text(`${g.score}/${g.max_score}  (${pct}%)`, pageW - 40, y);
            y += 7;
          });
          const avg = (items.reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / items.length).toFixed(1);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(99, 102, 241);
          doc.text(`Class average: ${avg}%`, 18, y);
          y += 10;
        });
      }

      // ── Predicted Grades ─────────────────────────────────────────────────
      checkPage(40);
      y += 4;
      addLine('Predicted IB Grades', 14, true, [30, 27, 75]);
      y += 2;
      if (predictions.length === 0) {
        addLine('No predicted grades available.', 10, false, [100, 116, 139]);
      } else {
        predictions.forEach(p => {
          checkPage(12);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(`${p.class_name || 'Subject'}`, 18, y);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(109, 40, 217);
          doc.text(`${p.predicted_ib_grade}/7`, pageW - 40, y);
          y += 7;
        });
        const avg = (predictions.reduce((s, p) => s + (p.predicted_ib_grade || 0), 0) / predictions.length).toFixed(1);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(109, 40, 217);
        doc.text(`Predicted IB average: ${avg}/7`, 18, y);
        y += 12;
      }

      // ── Attendance Summary ────────────────────────────────────────────────
      checkPage(50);
      y += 4;
      addLine('Attendance Summary', 14, true, [30, 27, 75]);
      y += 2;
      if (attendance.length === 0) {
        addLine('No attendance records available.', 10, false, [100, 116, 139]);
      } else {
        const counts = { present: 0, absent: 0, late: 0, excused: 0 };
        attendance.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });
        const total = attendance.length;
        const rate = ((counts.present / total) * 100).toFixed(1);
        const rows = [
          ['Total sessions', String(total)],
          ['Present', `${counts.present} (${rate}%)`],
          ['Absent', String(counts.absent)],
          ['Late', String(counts.late)],
          ['Excused', String(counts.excused)],
        ];
        rows.forEach(([label, val]) => {
          checkPage(10);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(label, 18, y);
          doc.setFont('helvetica', 'bold');
          doc.text(val, 80, y);
          y += 7;
        });
      }

      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`AtlasIB  ·  Page ${i} of ${totalPages}`, 14, 290);
        doc.text(format(new Date(), 'yyyy-MM-dd'), pageW - 40, 290);
      }

      doc.save(`progress-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } finally {
      setGenerating(false);
    }
  };

  const hasData = grades.length > 0 || predictions.length > 0 || attendance.length > 0;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Term Progress Report (PDF)</h3>
            <p className="text-sm text-slate-500 mt-1">
              A snapshot of your academic performance including grades, predicted IB scores, and attendance.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Grade items', value: grades.length, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                { label: 'Predicted grades', value: predictions.length, color: 'bg-violet-50 text-violet-700 border-violet-200' },
                { label: 'Attendance records', value: attendance.length, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-lg border p-3 text-center ${color}`}>
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Button
                onClick={generatePDF}
                disabled={generating || !hasData}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                ) : done ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />Downloaded!</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" />Download PDF</>
                )}
              </Button>
              {!hasData && <p className="text-xs text-slate-400">No data available to export yet.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-600 mb-2">Report includes:</p>
        <ul className="space-y-1.5">
          {[
            'All published grades with scores and percentages, grouped by class',
            'Predicted IB grades with overall average',
            'Attendance summary (present, absent, late, excused)',
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}