import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import React, { useState } from 'react';
import Notice from '@/components/app/Notice';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Archive, RotateCcw, Copy, Scissors,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import * as classesData from '@/data/classes';
import * as fns from '@/data/functions';

function DuplicateDialog({ classObj, onClose, schoolId, academicYears }) {
  const queryClient = useQueryClient();
  const [targetYearId, setTargetYearId] = useState('');
  const [newName, setNewName] = useState(`${classObj.name} (Copy)`);
  const [keepTeachers, setKeepTeachers] = useState(true);
  const [keepStudents, setKeepStudents] = useState(false);
  const [keepSubjects, setKeepSubjects] = useState(true);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        school_id: schoolId,
        name: newName,
        section: classObj.section,
        room: classObj.room,
        subject_id: classObj.subject_id,
        schedule_info: classObj.schedule_info,
        capacity: classObj.capacity,
        status: 'active',
        academic_year_id: targetYearId || classObj.academic_year_id,
        cohort_id: classObj.cohort_id,
        teacher_ids: keepTeachers ? (classObj.teacher_ids || []) : [],
        primary_teacher_id: keepTeachers ? classObj.primary_teacher_id : null,
        co_teacher_permissions: keepTeachers ? (classObj.co_teacher_permissions || {}) : {},
        student_ids: keepStudents ? (classObj.student_ids || []) : [],
        subject_teacher_assignments: keepSubjects ? (classObj.subject_teacher_assignments || []) : [],
        roster_locked: false,
      };
      return classesData.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-classes', schoolId] });
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Copy className="w-4 h-4" /> Duplicate Class Structure
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-xs font-semibold scholr-muted">New Class Name *</Label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} className="mt-1" />
          </div>
          {academicYears.length > 0 && (
            <div>
              <Label className="text-xs font-semibold scholr-muted">Target Academic Year</Label>
              <Select value={targetYearId || '__same'} onValueChange={v => setTargetYearId(v === '__same' ? '' : v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__same">Same as original</SelectItem>
                  {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs font-semibold scholr-muted">Copy options</Label>
            {[
              { key: 'keepTeachers', label: 'Copy teacher assignments', val: keepTeachers, set: setKeepTeachers },
              { key: 'keepSubjects', label: 'Copy subject–teacher mappings', val: keepSubjects, set: setKeepSubjects },
              { key: 'keepStudents', label: 'Copy student roster', val: keepStudents, set: setKeepStudents },
            ].map(opt => (
              <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={opt.val}
                  onChange={e => opt.set(e.target.checked)}
                  className="rounded scholr-rule"
                />
                <span className="text-sm scholr-body">{opt.label}</span>
              </label>
            ))}
          </div>
          <Notice tone="info">
            A new active class section will be created. The roster lock will be cleared on the copy.
          </Notice>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 pub-btn pub-btn-primary"
              disabled={!newName || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Copy className="w-3.5 h-3.5 mr-1.5" />Duplicate</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SplitDialog({ classObj, onClose, schoolId, memberships }) {
  const queryClient = useQueryClient();
  const students = (classObj.student_ids || []).map(id =>
    memberships.find(m => m.user_id === id) || { user_id: id, user_name: 'Unknown' }
  );
  const [nameA, setNameA] = useState(`${classObj.name} – A`);
  const [nameB, setNameB] = useState(`${classObj.name} – B`);
  const [groupA, setGroupA] = useState([]);

  const groupB = students.map(s => s.user_id).filter(id => !groupA.includes(id));
  const toggle = (id) => setGroupA(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const mutation = useMutation({
    mutationFn: async () => {
      const base = {
        school_id: schoolId,
        section: classObj.section,
        room: classObj.room,
        subject_id: classObj.subject_id,
        academic_year_id: classObj.academic_year_id,
        cohort_id: classObj.cohort_id,
        teacher_ids: classObj.teacher_ids || [],
        primary_teacher_id: classObj.primary_teacher_id,
        co_teacher_permissions: classObj.co_teacher_permissions || {},
        subject_teacher_assignments: classObj.subject_teacher_assignments || [],
        status: 'active',
        roster_locked: false,
      };
      await classesData.create({ ...base, name: nameA, student_ids: groupA });
      await classesData.create({ ...base, name: nameB, student_ids: groupB });
      // Archive original
      await classesData.update(classObj.id, { status: 'archived' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-classes', schoolId] });
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Scissors className="w-4 h-4" /> Split Class — {classObj.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2 flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold scholr-muted">Section A Name</Label>
              <Input value={nameA} onChange={e => setNameA(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold scholr-muted">Section B Name</Label>
              <Input value={nameB} onChange={e => setNameB(e.target.value)} className="mt-1" />
            </div>
          </div>
          <p className="text-xs scholr-muted">Tick students to assign them to Section A. Unticked students go to Section B.</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs mb-1">
            <div className="scholr-accent-sf scholr-accent rounded px-2 py-1 font-medium text-center">A: {groupA.length} students</div>
            <div className="scholr-sunk scholr-muted rounded px-2 py-1 font-medium text-center">B: {groupB.length} students</div>
          </div>
          <div className="space-y-1.5 overflow-y-auto max-h-52">
            {students.map(s => {
              const inA = groupA.includes(s.user_id);
              return (
                <button key={s.user_id} onClick={() => toggle(s.user_id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-colors text-sm ${inA ? 'scholr-accent-sf scholr-accent-rule' : 'bg-white scholr-rule'}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${inA ? 'scholr-accent-sf scholr-accent-rule' : 'scholr-rule'}`}>
                    {inA && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={inA ? 'scholr-accent font-medium' : 'scholr-body'}>{s.user_name}</span>
                  <span className="scholr-label" style={{ marginLeft: 'auto', color: inA ? 'var(--brand)' : 'var(--faint)' }}>{inA ? 'A' : 'B'}</span>
                </button>
              );
            })}
          </div>
          <Notice tone="warn">
            The original class will be archived. Two new sections will be created with the same teacher assignments and subject mappings.
          </Notice>
        </div>
        <div className="flex gap-2 pt-3 border-t scholr-rule-soft">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 pub-btn pub-btn-primary"
            disabled={students.length === 0 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Scissors className="w-3.5 h-3.5 mr-1.5" />Split Class</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ClassLifecycleTab({ schoolId, classes, memberships, academicYears }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [duplicatingClass, setDuplicatingClass] = useState(null);
  const [splittingClass, setSplittingClass] = useState(null);
  // { classObj, status } — null when closed
  const [pendingStatus, setPendingStatus] = useState(null);
  const [bulkArchiveOpen, setBulkArchiveOpen] = useState(false);

  const archiveMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await fns.invoke('updateClassStatus', { classId: id, status });
      const errMsg = res?.error || res?.error;
      if (errMsg) throw new Error(errMsg);
      const failure = res?.failures?.[0];
      if (failure) throw new Error(failure.error || 'Update failed');
      return res;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['school-classes', schoolId] });
      toast({ title: vars.status === 'archived' ? 'Class archived' : 'Class restored' });
    },
    onError: (err) => {
      toast({
        title: 'Could not update class',
        description: err?.message || 'Unknown error — please try again.',
        variant: 'destructive',
      });
    },
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: async (ids) => {
      const res = await fns.invoke('updateClassStatus', { classIds: ids, status: 'archived' });
      const errMsg = res?.error || res?.error;
      if (errMsg) throw new Error(errMsg);
      return res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['school-classes', schoolId] });
      const failed = data?.failures?.length || 0;
      toast({
        title: `Archived ${data?.updated || 0} class${(data?.updated || 0) !== 1 ? 'es' : ''}`,
        description: failed ? `${failed} failed` : undefined,
        variant: failed ? 'destructive' : 'default',
      });
    },
    onError: (err) => {
      toast({ title: 'Bulk archive failed', description: err?.message, variant: 'destructive' });
    },
  });

  const activeClasses   = classes.filter(c => c.status === 'active');
  const archivedClasses = classes.filter(c => c.status === 'archived');

/* Five cards, each with a filled icon chip in a colour picked per card. The
   icons were decoration — a pair of scissors beside the word "Split" — and the
   chips gave one page five accents. Each one is a group now. */
  const ActionCard = ({ title, description, children }) => (
    <Group title={title}>
      <p style={{ margin: 0, padding: '.6rem .9rem 0', fontSize: '.82rem', color: 'var(--muted)' }}>
        {description}
      </p>
      {children}
    </Group>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <Group>
        <div className="scholr-grid app-cols-2">
          <StatCard label="Active" value={activeClasses.length} hint="running now" />
          <StatCard label="Archived" value={archivedClasses.length} hint="past years" />
        </div>
      </Group>

      {/* Bulk archive */}
      <ActionCard
        title="Archive the year"
        description="Close every active class at once when the academic year ends."
      >
        {activeClasses.length === 0 ? (
          <GroupEmpty>Nothing to archive — no class is active.</GroupEmpty>
        ) : (
          <Row
            label={`Archive all ${activeClasses.length} active class${activeClasses.length !== 1 ? 'es' : ''}`}
            detail="They stay readable; they stop appearing in the timetable and in enrolment."
          >
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              disabled={bulkArchiveMutation.isPending}
              onClick={() => setBulkArchiveOpen(true)}
            >
              {bulkArchiveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
              Archive all
            </Button>
          </Row>
        )}
      </ActionCard>

      {/* Archive/Restore individual */}
      {classes.length > 0 && (
        <ActionCard
          title="One class at a time"
          description="Archive a single class, or bring an archived one back."
        >
          <div style={{ maxHeight: '18rem', overflowY: 'auto' }}>
            {classes.map(c => (
              <Row
                key={c.id}
                label={c.name}
                detail={`${c.student_ids?.length || 0} student${c.student_ids?.length === 1 ? '' : 's'}${c.status === 'archived' ? ' · archived' : ''}`}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs flex-shrink-0 gap-1"
                  disabled={archiveMutation.isPending}
                  onClick={() => setPendingStatus({
                    classObj: c,
                    status: c.status === 'active' ? 'archived' : 'active',
                  })}
                >
                  {c.status === 'active' ? <><Archive className="w-3 h-3" />Archive</> : <><RotateCcw className="w-3 h-3" />Restore</>}
                </Button>
              </Row>
            ))}
          </div>
        </ActionCard>
      )}

      {/* Duplicate for new year */}
      <ActionCard
        title="Copy into next year"
        description="Reuse a class's structure — subject, staff, optionally the roster."
      >
        {activeClasses.length === 0 ? (
          <GroupEmpty>Nothing to copy — no class is active.</GroupEmpty>
        ) : (
          <div style={{ maxHeight: '16rem', overflowY: 'auto' }}>
            {activeClasses.map(c => (
              <Row
                key={c.id}
                label={c.name}
                detail={`${c.student_ids?.length || 0} students · ${c.teacher_ids?.length || 0} staff`}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 flex-shrink-0"
                  onClick={() => setDuplicatingClass(c)}
                >
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </Row>
            ))}
          </div>
        )}
      </ActionCard>

      {/* Split class */}
      <ActionCard
        title="Split a class in two"
        description="Divide the students between two new sections. The original is archived."
      >
        {activeClasses.filter(c => (c.student_ids?.length || 0) >= 2).length === 0 ? (
          <GroupEmpty>No class has enough students to split — two is the minimum.</GroupEmpty>
        ) : (
          <div style={{ maxHeight: '16rem', overflowY: 'auto' }}>
            {activeClasses.filter(c => (c.student_ids?.length || 0) >= 2).map(c => (
              <Row key={c.id} label={c.name} detail={`${c.student_ids?.length || 0} students`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 flex-shrink-0"
                  onClick={() => setSplittingClass(c)}
                >
                  <Scissors className="w-3 h-3" /> Split
                </Button>
              </Row>
            ))}
          </div>
        )}
      </ActionCard>

      {duplicatingClass && (
        <DuplicateDialog
          classObj={duplicatingClass}
          onClose={() => setDuplicatingClass(null)}
          schoolId={schoolId}
          academicYears={academicYears}
        />
      )}

      {splittingClass && (
        <SplitDialog
          classObj={splittingClass}
          onClose={() => setSplittingClass(null)}
          schoolId={schoolId}
          memberships={memberships}
        />
      )}

      <ConfirmDialog
        open={!!pendingStatus}
        title={pendingStatus?.status === 'archived' ? 'Archive this class?' : 'Restore this class?'}
        description={
          pendingStatus?.status === 'archived'
            ? `"${pendingStatus?.classObj?.name}" will be moved to the archive. Teachers and students will no longer see it in their active lists, but all data (grades, attendance, submissions) is preserved and the class can be restored at any time.`
            : `"${pendingStatus?.classObj?.name}" will be restored to active status and reappear for teachers and students.`
        }
        confirmLabel={
          archiveMutation.isPending
            ? 'Working…'
            : pendingStatus?.status === 'archived' ? 'Archive' : 'Restore'
        }
        cancelLabel="Cancel"
        isDestructive={pendingStatus?.status === 'archived'}
        onConfirm={() => {
          if (!pendingStatus) return;
          archiveMutation.mutate(
            { id: pendingStatus.classObj.id, status: pendingStatus.status },
            { onSettled: () => setPendingStatus(null) }
          );
        }}
        onCancel={() => !archiveMutation.isPending && setPendingStatus(null)}
      />

      <ConfirmDialog
        open={bulkArchiveOpen}
        title={`Archive all ${activeClasses.length} active class${activeClasses.length !== 1 ? 'es' : ''}?`}
        description="Every active class in this school will be moved to the archive. All data is preserved and classes can be restored individually at any time. This is typically done at the end of an academic year."
        confirmLabel={bulkArchiveMutation.isPending ? 'Archiving…' : 'Archive all'}
        cancelLabel="Cancel"
        isDestructive
        onConfirm={() => {
          bulkArchiveMutation.mutate(
            activeClasses.map(c => c.id),
            { onSettled: () => setBulkArchiveOpen(false) }
          );
        }}
        onCancel={() => !bulkArchiveMutation.isPending && setBulkArchiveOpen(false)}
      />
    </div>
  );
}