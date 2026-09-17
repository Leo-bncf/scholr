import { Group, Row } from '@/components/app/AppShell';
import { Field, SelectField, SearchField, FilterBar } from '@/components/app/Field';
import DataTable from '@/components/app/DataTable';
import StatCard from '@/components/app/StatCard';
import StatusChip from '@/components/app/StatusChip';
import React, { useState, useMemo } from 'react';
import { humanise } from '@/lib/labels';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import * as behaviorRecordsData from '@/data/behaviorRecords';
import * as classesData from '@/data/classes';
import * as behaviorPoliciesData from '@/data/behaviorPolicies';

/* A positive record is a good thing that happened, not a healthy metric, and
   a note is neither. Only the two that someone may have to act on take colour,
   which is what stops a log of forty merits from reading as forty alarms. */
const TYPE_META = {
  positive: { label: 'Positive', tone: null },
  concern:  { label: 'Concern',  tone: 'warn' },
  incident: { label: 'Incident', tone: 'crit' },
  note:     { label: 'Note',     tone: null },
};

/* Severity is an ordered scale, so it reads as one: low says nothing, and the
   step up to critical is a step up in weight. Four separate hues — blue,
   amber, red, rose — made low look like its own category and made red and
   rose indistinguishable. */
const SEV_TONE = { low: null, medium: 'warn', high: 'crit', critical: 'crit' };

export default function BehaviorDashboard({ schoolId, isPastoral = false }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expandedId, setExpandedId] = useState(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['behavior-admin', schoolId, dateFrom, dateTo],
    queryFn: () => behaviorRecordsData.listRange(schoolId, { from: dateFrom, to: dateTo }),
    enabled: !!schoolId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['behavior-categories', schoolId],
    queryFn: () => behaviorRecordsData.listCategories(schoolId),
    enabled: !!schoolId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes-behavior', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const { data: policy = {} } = useQuery({
    queryKey: ['behavior-policy', schoolId],
    queryFn: async () => {
      const p = await behaviorPoliciesData.where({ school_id: schoolId });
      return p[0] || {};
    },
    enabled: !!schoolId,
  });

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (!isPastoral && r.staff_only) return false;
      if (r.date < dateFrom || r.date > dateTo) return false;
      if (filterType !== 'all' && r.type !== filterType) return false;
      if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false;
      if (filterCategory !== 'all' && r.category !== filterCategory) return false;
      if (filterClass !== 'all' && r.class_id !== filterClass) return false;
      if (search && !r.student_name?.toLowerCase().includes(search.toLowerCase()) && !r.title?.toLowerCase().includes(search.toLowerCase()) && !r.recorded_by_name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [records, dateFrom, dateTo, filterType, filterSeverity, filterCategory, filterClass, search, isPastoral]);

  const counts = filtered.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {});
  const pendingFollowUp = filtered.filter(r => r.follow_up_required && !r.follow_up_completed).length;
  const pendingPastoral = filtered.filter(r => !r.pastoral_reviewed && (r.severity === 'high' || r.severity === 'critical')).length;

  return (
    <div className="space-y-6">
      <Group>
        <div className="scholr-grid app-cols-4">
          <StatCard label="Incidents" value={counts.incident || 0} tone={counts.incident ? 'crit' : undefined} hint="in this range" />
          <StatCard label="Concerns" value={counts.concern || 0} tone={counts.concern ? 'warn' : undefined} hint="in this range" />
          <StatCard label="Positive" value={counts.positive || 0} hint="merits and praise" />
          {isPastoral ? (
            <StatCard
              label="Awaiting review"
              value={pendingPastoral}
              tone={pendingPastoral > 0 ? 'warn' : undefined}
              hint="pastoral sign-off"
            />
          ) : (
            <StatCard
              label="Awaiting follow-up"
              value={pendingFollowUp}
              tone={pendingFollowUp > 0 ? 'warn' : undefined}
              hint="action not yet closed"
            />
          )}
        </div>
      </Group>

      <FilterBar>
        <Field label="Search" htmlFor="beh-q">
          <SearchField id="beh-q" label="Search records" value={search} onChange={setSearch} placeholder="Student, title, staff…" />
        </Field>
        <Field label="From" htmlFor="beh-from">
          <input id="beh-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="app-input scholr-focus" />
        </Field>
        <Field label="To" htmlFor="beh-to">
          <input id="beh-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="app-input scholr-focus" />
        </Field>
        <Field label="Type" htmlFor="beh-type">
          <SelectField
            id="beh-type" label="Type" value={filterType} onChange={setFilterType}
            options={[
              { value: 'all', label: 'All types' },
              { value: 'positive', label: 'Positive' },
              { value: 'concern', label: 'Concern' },
              { value: 'incident', label: 'Incident' },
              { value: 'note', label: 'Note' },
            ]}
          />
        </Field>
        <Field label="Severity" htmlFor="beh-sev">
          <SelectField
            id="beh-sev" label="Severity" value={filterSeverity} onChange={setFilterSeverity}
            options={[
              { value: 'all', label: 'Any severity' },
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
          />
        </Field>
        <Field label="Category" htmlFor="beh-cat">
          <SelectField
            id="beh-cat" label="Category" value={filterCategory} onChange={setFilterCategory}
            options={[{ value: 'all', label: 'All categories' }, ...categories.map(c => ({ value: c, label: humanise(c) }))]}
          />
        </Field>
        <Field label="Class" htmlFor="beh-class">
          <SelectField
            id="beh-class" label="Class" value={filterClass} onChange={setFilterClass}
            options={[{ value: 'all', label: 'All classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]}
          />
        </Field>
      </FilterBar>

      <Group title="Records" action={<span className="scholr-label">{filtered.length} shown</span>}>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin scholr-accent" /></div>
        ) : (
          <DataTable
            columns={[
              { key: 'student_name', header: 'Student' },
              { key: 'date', header: 'Date' },
              {
                key: 'title',
                header: 'What happened',
                render: (r) => (
                  <>
                    <span style={{ display: 'block', color: 'var(--ink)' }}>{r.title}</span>
                    {r.category && (
                      <span style={{ display: 'block', fontSize: '.76rem', color: 'var(--muted)' }}>{humanise(r.category)}</span>
                    )}
                  </>
                ),
              },
              {
                key: 'type',
                header: 'Type',
                render: (r) => {
                  const tm = TYPE_META[r.type] || TYPE_META.note;
                  return tm.tone
                    ? <StatusChip tone={tm.tone}>{tm.label}</StatusChip>
                    : <span style={{ color: 'var(--body)' }}>{tm.label}</span>;
                },
              },
              {
                key: 'severity',
                header: 'Severity',
                render: (r) => {
                  if (!r.severity) return '—';
                  const tone = SEV_TONE[r.severity];
                  return tone
                    ? <StatusChip tone={tone}>{r.severity}</StatusChip>
                    : <span style={{ color: 'var(--muted)' }}>{r.severity}</span>;
                },
              },
              {
                key: 'visibility',
                header: 'Seen by',
                /* Two eye glyphs, one blue and one green, meant nothing to
                   anyone who had not been told. The words say it. */
                render: (r) => {
                  if (r.staff_only) return <StatusChip tone="crit">Staff only</StatusChip>;
                  const who = [r.visible_to_student && 'student', r.visible_to_parent && 'parent'].filter(Boolean);
                  return who.length ? who.join(' and ') : 'Staff';
                },
              },
              { key: 'recorded_by_name', header: 'Recorded by' },
              ...(isPastoral ? [{
                key: 'reviewed',
                header: 'Reviewed',
                render: (r) => (r.pastoral_reviewed
                  ? 'Yes'
                  : (r.severity === 'high' || r.severity === 'critical')
                    ? <StatusChip tone="warn">Needs review</StatusChip>
                    : '—'),
              }] : []),
            ]}
            rows={filtered}
            rowKey={(r) => r.id}
            onRowClick={(r) => setExpandedId(expandedId === r.id ? null : r.id)}
            empty="No behaviour records match these filters."
          />
        )}
      </Group>

      {/* The detail used to be a <tr colSpan={8}> inside the tbody — it broke
          the column widths and a screen reader announced it as a data row. */}
      {filtered.filter(r => r.id === expandedId).map(r => (
        <Group key={r.id} title={`${r.student_name} — ${r.title}`}>
          {r.description && <Row label="What happened" detail={r.description} />}
          {r.action_taken && <Row label="Action taken" detail={r.action_taken} />}
          {r.follow_up_required && (
            <Row label="Follow-up" detail={r.follow_up_note || undefined}>
              {r.follow_up_completed
                ? <span style={{ color: 'var(--muted)' }}>Done</span>
                : <StatusChip tone="warn">Still open</StatusChip>}
            </Row>
          )}
          {r.pastoral_reviewed && (
            <Row
              label="Pastoral review"
              detail={`${r.pastoral_reviewed_by}${r.pastoral_reviewed_at ? ` on ${format(new Date(r.pastoral_reviewed_at), 'd MMM yyyy')}` : ''}`}
            />
          )}
        </Group>
      ))}

    </div>
  );
}