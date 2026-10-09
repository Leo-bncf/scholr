import { createPageUrl } from '@/utils';

/** Where a teacher goes for one class, optionally on a given tab. */
export function classUrl(classId, tab) {
  const q = new URLSearchParams({ class_id: classId });
  if (tab) q.set('tab', tab);
  return `${createPageUrl('ClassWorkspace')}?${q}`;
}

/** The marking page, optionally narrowed to a view, class or assignment. */
export function markingUrl({ view, classId, assignmentId } = {}) {
  const q = new URLSearchParams();
  if (view) q.set('tab', view);
  if (classId) q.set('class', classId);
  if (assignmentId) q.set('assignment', assignmentId);
  const s = q.toString();
  return `${createPageUrl('TeacherWorkspace')}${s ? `?${s}` : ''}`;
}

/** "today", "tomorrow", "in 3 days", "2 days ago". */
export function relativeDays(date, now = new Date()) {
  const a = new Date(date); a.setHours(0, 0, 0, 0);
  const b = new Date(now); b.setHours(0, 0, 0, 0);
  const d = Math.round((a - b) / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  if (d === -1) return 'yesterday';
  return d > 0 ? `in ${d} days` : `${-d} days ago`;
}

/** Group rows by their assignment, keeping the first-seen order. */
export function byAssignment(list) {
  const groups = new Map();
  for (const item of list) {
    const a = item.assignment;
    if (!a) continue;
    if (!groups.has(a.id)) groups.set(a.id, { assignment: a, cls: item.cls, items: [] });
    groups.get(a.id).items.push(item);
  }
  return [...groups.values()];
}
