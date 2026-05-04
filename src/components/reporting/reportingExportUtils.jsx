export function downloadCSV(filename, columns, rows) {
  const header = columns.map((column) => column.label).join(',');
  const body = rows.map((row) => columns.map((column) => JSON.stringify(row[column.key] ?? '')).join(',')).join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}