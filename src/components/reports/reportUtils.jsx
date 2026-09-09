import { format } from 'date-fns';

// ── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return `"${value.join('; ')}"`;
  if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, "'")}"`;
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCSV(rows, columns) {
  if (!rows || rows.length === 0) return null;
  const headers = columns.map(c => c.label);
  const lines = rows.map(row =>
    columns.map(c => escapeCell(typeof c.fn === 'function' ? c.fn(row) : row[c.key])).join(',')
  );
  return [headers.join(','), ...lines].join('\n');
}

export function downloadCSV(csvString, filename) {
  if (!csvString) return;
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Column definitions ───────────────────────────────────────────────────────

export const COLUMNS = {
  students: [
    { key: 'user_id', label: 'User ID' },
    { key: 'user_name', label: 'Name' },
    { key: 'user_email', label: 'Email' },
    { key: 'grade_level', label: 'Grade Level' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Enrolled Date', fn: r => r.created_at ? format(new Date(r.created_at), 'yyyy-MM-dd') : '' },
  ],
  teachers: [
    { key: 'user_id', label: 'User ID' },
    { key: 'user_name', label: 'Name' },
    { key: 'user_email', label: 'Email' },
    { key: 'department', label: 'Department' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
  ],
  all_users: [
    { key: 'user_id', label: 'User ID' },
    { key: 'user_name', label: 'Name' },
    { key: 'user_email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'grade_level', label: 'Grade Level' },
    { key: 'department', label: 'Department' },
    { key: 'status', label: 'Status' },
  ],
  classes: [
    { key: 'id', label: 'Class ID' },
    { key: 'name', label: 'Class Name' },
    { key: 'section', label: 'Section' },
    { key: 'status', label: 'Status' },
    { key: 'student_ids', label: 'Student Count', fn: r => (r.student_ids || []).length },
    { key: 'teacher_ids', label: 'Teacher Count', fn: r => (r.teacher_ids || []).length },
    { key: 'room', label: 'Room' },
    { key: 'schedule_info', label: 'Schedule' },
  ],
  enrollments: [
    { key: 'class_name', label: 'Class' },
    { key: 'student_name', label: 'Student Name' },
    { key: 'student_email', label: 'Student Email' },
    { key: 'grade_level', label: 'Grade Level' },
    { key: 'teacher_name', label: 'Primary Teacher' },
  ],
  grades: [
    { key: 'student_name', label: 'Student Name' },
    { key: 'class_id', label: 'Class ID' },
    { key: 'title', label: 'Assessment Title' },
    { key: 'score', label: 'Score' },
    { key: 'max_score', label: 'Max Score' },
    { key: 'percentage', label: 'Percentage', fn: r => r.percentage != null ? `${r.percentage.toFixed(1)}%` : (r.score != null && r.max_score ? `${((r.score / r.max_score) * 100).toFixed(1)}%` : '') },
    { key: 'ib_grade', label: 'IB Grade (1-7)' },
    { key: 'status', label: 'Status' },
    { key: 'term_id', label: 'Term ID' },
    { key: 'created_at', label: 'Date', fn: r => r.created_at ? format(new Date(r.created_at), 'yyyy-MM-dd') : '' },
  ],
  attendance: [
    { key: 'student_name', label: 'Student Name' },
    { key: 'class_id', label: 'Class ID' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' },
    { key: 'note', label: 'Note' },
    { key: 'reason_category', label: 'Reason Category' },
    { key: 'recorded_by', label: 'Recorded By' },
    { key: 'last_corrected_at', label: 'Last Corrected', fn: r => r.last_corrected_at ? format(new Date(r.last_corrected_at), 'yyyy-MM-dd') : '' },
  ],
  behavior: [
    { key: 'student_name', label: 'Student Name' },
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'title', label: 'Title' },
    { key: 'severity', label: 'Severity' },
    { key: 'action_taken', label: 'Action Taken' },
    { key: 'follow_up_required', label: 'Follow-up Required' },
    { key: 'pastoral_reviewed', label: 'Pastoral Reviewed' },
    { key: 'recorded_by_name', label: 'Recorded By' },
  ],
  predicted_grades: [
    { key: 'student_name', label: 'Student Name' },
    { key: 'class_name', label: 'Class' },
    { key: 'subject_name', label: 'Subject' },
    { key: 'predicted_ib_grade', label: 'Predicted Grade (1-7)' },
    { key: 'confidence_level', label: 'Confidence' },
    { key: 'teacher_name', label: 'Teacher' },
    { key: 'entry_date', label: 'Entry Date' },
    { key: 'rationale', label: 'Rationale' },
  ],
  cas: [
    { key: 'student_name', label: 'Student Name' },
    { key: 'title', label: 'Experience Title' },
    { key: 'cas_strands', label: 'CAS Strands', fn: r => (r.cas_strands || []).join('; ') },
    { key: 'status', label: 'Status' },
    { key: 'hours', label: 'Hours' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'supervisor_name', label: 'Supervisor' },
  ],
};

// ── PDF generation (browser print) ──────────────────────────────────────────

export function generatePrintableHTML({ title, subtitle, schoolName, sections, generatedBy }) {
  const now = format(new Date(), 'dd MMM yyyy, HH:mm');
  const sectionsHTML = sections.map(section => {
    if (section.type === 'table') {
      const thead = `<tr>${section.columns.map(c => `<th>${c.label}</th>`).join('')}</tr>`;
      const tbody = (section.rows || []).map(row =>
        `<tr>${section.columns.map(c => `<td>${typeof c.fn === 'function' ? c.fn(row) : (row[c.key] ?? '')}</td>`).join('')}</tr>`
      ).join('');
      return `
        <div class="section">
          <h3>${section.title}</h3>
          ${section.description ? `<p class="desc">${section.description}</p>` : ''}
          <table>
            <thead>${thead}</thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>`;
    }
    if (section.type === 'stats') {
      const statsHTML = section.stats.map(s =>
        `<div class="stat-box"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`
      ).join('');
      return `<div class="section"><h3>${section.title}</h3><div class="stats-row">${statsHTML}</div></div>`;
    }
    if (section.type === 'info') {
      const items = section.items.map(i => `<div class="info-row"><span class="info-key">${i.label}:</span><span class="info-val">${i.value}</span></div>`).join('');
      return `<div class="section"><h3>${section.title}</h3><div class="info-block">${items}</div></div>`;
    }
    return '';
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 24px; }
    .report-header { border-bottom: 2px solid #3730a3; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .report-header h1 { font-size: 20px; color: #1e293b; }
    .report-header .meta { text-align: right; color: #64748b; font-size: 10px; line-height: 1.6; }
    .section { margin-bottom: 24px; }
    .section h3 { font-size: 13px; font-weight: 700; color: #3730a3; text-transform: uppercase; letter-spacing: 0.05em; border-left: 3px solid #3730a3; padding-left: 8px; margin-bottom: 10px; }
    .desc { color: #64748b; font-size: 10px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
    td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tr:nth-child(even) td { background: #fafafa; }
    .stats-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
    .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; min-width: 100px; text-align: center; }
    .stat-value { font-size: 22px; font-weight: 700; color: #3730a3; }
    .stat-label { font-size: 10px; color: #64748b; margin-top: 2px; }
    .info-block { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .info-row { display: flex; gap: 8px; padding: 4px 0; border-bottom: 1px solid #f1f5f9; }
    .info-key { color: #64748b; min-width: 130px; font-weight: 600; }
    .info-val { color: #1e293b; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 9px; display: flex; justify-content: space-between; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="report-header">
    <div>
      <div style="font-size:11px;color:#64748b;margin-bottom:4px;">${schoolName}</div>
      <h1>${title}</h1>
      ${subtitle ? `<div style="color:#64748b;font-size:11px;margin-top:4px;">${subtitle}</div>` : ''}
    </div>
    <div class="meta">
      Generated: ${now}<br/>
      By: ${generatedBy || 'School Admin'}<br/>
      CONFIDENTIAL
    </div>
  </div>
  ${sectionsHTML}
  <div class="footer">
    <span>${schoolName} — ${title}</span>
    <span>Generated ${now}</span>
  </div>
</body>
</html>`;
}

export function printHTML(html) {
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.print(); };
}