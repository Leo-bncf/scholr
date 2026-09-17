import { jsPDF } from 'npm:jspdf@4.0.0';
import { fromRequest, isMemberOf, hasSchoolRole, isSuperAdmin, type Caller } from '../_shared/client.ts';
import { readJsonBody } from '../_shared/readBody.ts';
import { handler, json, unauthorized, badRequest, forbidden, corsHeaders } from '../_shared/http.ts';

/**
 * Export a report as a PDF.
 *
 * Two call shapes, both used today:
 *
 *   { reportId }                     — render a stored `reports` row. The row's
 *                                      `report_data` jsonb is the shape base44's
 *                                      generateReport wrote, so this renders it
 *                                      without inventing a new contract.
 *   { reporting_engine: { title, rows, columns } } — render a data table. The
 *                                      SchoolAdminReports builder computes rows
 *                                      client-side from RLS-visible queries and
 *                                      sends them here for a printable PDF.
 *
 * Authorization mirrors the `reports` RLS policy (school member plus student /
 * generator / staff role); the service role is only used to read the row once
 * that gate has passed.
 *
 * The response body is the PDF itself (Content-Type application/pdf) — the
 * browser builds a download from the returned Blob directly.
 */

interface ReportingEngine {
  title?: string;
  rows?: Record<string, unknown>[];
  columns?: { key?: string; label?: string }[];
}

interface Payload {
  reportId?: string | null;
  schoolId?: string;
  studentId?: string;
  reporting_engine?: ReportingEngine;
}

function sanitizeFilename(name: string): string {
  return (name || 'report').replace(/[^a-zA-Z0-9._-]+/g, '_');
}

function text(doc: jsPDF, content: unknown, x: number, y: number): void {
  const value = content ?? '—';
  doc.text(String(value), x, y);
}

/** Render a stored report's `report_data` (base44's generateReport shape). */
function renderReportData(
  doc: jsPDF,
  report: { title?: string | null; generated_at?: string | null; generated_by_name?: string | null; report_data?: Record<string, unknown> | null },
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(report.title || 'Report', margin, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 110, 110);
  text(doc, `Generated: ${report.generated_at ? new Date(report.generated_at).toLocaleDateString() : '—'}`, margin, y);
  y += 4;
  text(doc, `By: ${report.generated_by_name}`, margin, y);
  y += 3;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setTextColor(0, 0, 0);

  const section = (heading: string): number => {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(heading, margin, y);
    return y + 5;
  };

  const data = report.report_data as Record<string, unknown> | null | undefined;

  if (data?.student_info && typeof data.student_info === 'object') {
    const info = data.student_info as Record<string, unknown>;
    if (info.name) {
      y = section('Student Information');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      text(doc, `Name: ${info.name}`, margin, y); y += 5;
      if (info.grade_level) { text(doc, `Grade Level: ${info.grade_level}`, margin, y); y += 5; }
      if (info.report_date) { text(doc, `Report Date: ${info.report_date}`, margin, y); y += 5; }
      y += 3;
    }
  }

  if (data?.overall_summary && typeof data.overall_summary === 'object') {
    const summary = data.overall_summary as Record<string, unknown>;
    y = section('Overall Academic Summary');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (summary.average_grade != null) { text(doc, `Average Grade: ${Math.round(Number(summary.average_grade))}%`, margin, y); y += 4; }
    if (summary.gpa != null) { text(doc, `GPA: ${Number(summary.gpa).toFixed(2)}`, margin, y); y += 4; }
    if (summary.attendance_percentage != null) { text(doc, `Attendance: ${Math.round(Number(summary.attendance_percentage))}%`, margin, y); y += 4; }
    y += 3;
  }

  if (Array.isArray(data?.subject_reports) && data.subject_reports.length > 0) {
    y = section('Subject Performance');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    for (const subject of data.subject_reports as Record<string, unknown>[]) {
      if (y > pageHeight - 25) {
        doc.addPage();
        y = margin;
      }
      doc.setFont('helvetica', 'bold');
      text(doc, subject.subject_name, margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      if (subject.grade != null) { text(doc, `Score: ${subject.grade}`, margin + 5, y); y += 4; }
      if (subject.percentage != null) { text(doc, `Percentage: ${Math.round(Number(subject.percentage))}%`, margin + 5, y); y += 4; }
      if (subject.teacher_comment) {
        const lines = doc.splitTextToSize(`Comment: ${subject.teacher_comment}`, contentWidth - 5);
        doc.text(lines, margin + 5, y);
        y += lines.length * 4;
      }
      y += 3;
    }
    y += 2;
  }

  if (data?.attendance_data && typeof data.attendance_data === 'object') {
    const attendance = data.attendance_data as Record<string, unknown>;
    y = section('Attendance Summary');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (attendance.days_present != null) { text(doc, `Days Present: ${attendance.days_present} / ${attendance.total_days ?? '—'}`, margin, y); y += 4; }
    if (attendance.days_absent != null) { text(doc, `Days Absent: ${attendance.days_absent}`, margin, y); y += 4; }
    if (attendance.days_late != null) { text(doc, `Days Late: ${attendance.days_late}`, margin, y); y += 4; }
    if (attendance.attendance_percentage != null) { text(doc, `Attendance Rate: ${Math.round(Number(attendance.attendance_percentage))}%`, margin, y); y += 4; }
  }

  if (data?.behavior_summary && typeof data.behavior_summary === 'object') {
    const behavior = data.behavior_summary as Record<string, unknown>;
    y = section('Behaviour Summary');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (behavior.positive_count != null) { text(doc, `Positive: ${behavior.positive_count}`, margin, y); y += 4; }
    if (behavior.concern_count != null) { text(doc, `Concerns: ${behavior.concern_count}`, margin, y); y += 4; }
    if (behavior.incident_count != null) { text(doc, `Incidents: ${behavior.incident_count}`, margin, y); y += 4; }
  }

  if (data?.ib_progress && typeof data.ib_progress === 'object') {
    const ib = data.ib_progress as Record<string, unknown>;
    y = section('IB Core Progress');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (ib.cas_status != null) { text(doc, `CAS: ${ib.cas_status}`, margin, y); y += 4; }
    if (ib.ee_status != null) { text(doc, `EE: ${ib.ee_status}`, margin, y); y += 4; }
    if (ib.tok_status != null) { text(doc, `TOK: ${ib.tok_status}`, margin, y); y += 4; }
  }

  return y;
}

/** Render an arbitrary data table (the reporting builder's shape). */
function renderTable(doc: jsPDF, engine: ReportingEngine): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(engine.title || 'Report', margin, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 110, 110);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  y += 3;
  doc.setTextColor(0, 0, 0);

  const columns = Array.isArray(engine.columns) ? engine.columns : [];
  const rows = Array.isArray(engine.rows) ? engine.rows : [];

  doc.setFontSize(9);
  doc.setFillColor(238, 238, 238);

  const rowHeight = 6;
  const drawRow = (cells: string[], offsetY: number, bold = false, header = false): number => {
    const colWidth = contentWidth / Math.max(columns.length, 1);
    if (offsetY > pageHeight - 20) {
      doc.addPage();
      offsetY = margin;
    }
    if (header) {
      doc.rect(margin, offsetY - 4, contentWidth, rowHeight, 'F');
    }
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const cellYs: number[] = [];
    cells.forEach((cell, i) => {
      const textLines = doc.splitTextToSize(cell, colWidth - 4);
      doc.text(textLines, margin + i * colWidth + 2, offsetY + 2);
      cellYs.push(offsetY);
    });
    const writtenLines = Math.max(...cells.map((cell, i) => doc.splitTextToSize(cell, colWidth - 4).length));
    return offsetY + Math.max(rowHeight, writtenLines * 4) + (header ? 4 : 2);
  };

  if (columns.length === 0) {
    doc.setFontSize(10);
    doc.text('No columns were supplied to render.', margin, y + 8);
    return;
  }

  y = drawRow(
    columns.map((c) => String(c.label ?? c.key ?? '—')),
    y,
    true,
    true,
  );

  for (const row of rows) {
    const cells = columns.map((c) => String(row[c.key ?? ''] ?? '—'));
    y = drawRow(cells, y);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Page ${doc.internal.getNumberOfPages()}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' },
  );
}

function addFooter(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Page ${doc.internal.getNumberOfPages()}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' },
  );
}

interface ReportRow {
  id: string;
  school_id: string;
  student_id: string | null;
  generated_by: string | null;
  title: string | null;
  generated_at: string | null;
  generated_by_name: string | null;
  report_data: Record<string, unknown> | null;
}

async function authorizedFor(caller: Caller, report: ReportRow): Promise<boolean> {
  if (isSuperAdmin(caller)) return true;
  if (!caller.user) return false;
  if (!(await isMemberOf(caller, report.school_id))) return false;
  if (report.student_id === caller.user.id) return true;
  if (report.generated_by === caller.user.id) return true;
  return hasSchoolRole(caller, report.school_id, ['school_admin', 'ib_coordinator']);
}

Deno.serve(
  handler(async (req) => {
    const caller = await fromRequest(req);
    if (!caller.user) return unauthorized(req);

    const { reportId, reporting_engine } = await readJsonBody<Payload>(req);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'A4' });

    if (reportId) {
      const { data: report, error } = await caller.admin
        .from('reports')
        .select(
          'id, school_id, student_id, generated_by, title, generated_at, generated_by_name, report_data',
        )
        .eq('id', reportId)
        .maybeSingle();

      if (error) return json(req, { error: error.message }, 500);
      if (!report) return json(req, { error: 'Report not found.' }, 404);

      if (!(await authorizedFor(caller, report as ReportRow))) {
        return forbidden(req, 'You do not have access to this report.');
      }

      if (!report.report_data) {
        return json(req, { error: 'This report has no data to render yet.', code: 'empty_report' }, 404);
      }

      renderReportData(doc, report as ReportRow);
      addFooter(doc);
    } else if (reporting_engine) {
      const { title } = reporting_engine;
      if (!title && (!Array.isArray(reporting_engine.columns) || reporting_engine.columns.length === 0)) {
        return badRequest(req, '`reporting_engine` needs a title and at least one column.');
      }
      renderTable(doc, reporting_engine);
      addFooter(doc);
    } else {
      return badRequest(req, 'Provide either `reportId` or `reporting_engine`.');
    }

    const bytes = doc.output('arraybuffer');
    const filename = sanitizeFilename(reporting_engine?.title ?? (reportId ? String(reportId) : 'report'));

    return new Response(bytes, {
      status: 200,
      headers: {
        ...corsHeaders(req),
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      },
    });
  }),
);