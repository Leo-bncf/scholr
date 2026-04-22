import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Archive, RotateCcw, Copy, Scissors, Merge, CheckCircle,
  Loader2, BookOpen, AlertTriangle, Info, ChevronRight, Users
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';

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
      return base44.entities.Class.create(payload);
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
            <Label className="text-xs font-semibold text-slate-600">New Class Name *</Label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} className="mt-1" />
          </div>
          {academicYears.length > 0 && (
            <div>
              <Label className="text-xs font-semibold text-slate-600">Target Academic Year</Label>
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
            <Label className="text-xs font-semibold text-slate-600">Copy options</Label>
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
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-700">
              A new active class section will be created. The roster lock will be cleared on the copy.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
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
      await base44.entities.Class.create({ ...base, name: nameA, student_ids: groupA });
      await base44.entities.Class.create({ ...base, name: nameB, student_ids: groupB });
      // Archive original
      await base44.entities.Class.update(classObj.id, { status: 'archived' });
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
              <Label className="text-xs font-semibold text-slate-600">Section A Name</Label>
              <Input value={nameA} onChange={e => setNameA(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600">Section B Name</Label>
              <Input value={nameB} onChange={e => setNameB(e.target.value)} className="mt-1" />
            </div>
          </div>
          <p className="text-xs text-slate-500">Tick students to assign them to Section A. Unticked students go to Section B.</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs mb-1">
            <div className="bg-indigo-50 text-indigo-700 rounded px-2 py-1 font-medium text-center">A: {groupA.length} students</div>
            <div className="bg-slate-100 text-slate-600 rounded px-2 py-1 font-medium text-center">B: {groupB.length} students</div>
          </div>
          <div className="space-y-1.5 overflow-y-auto max-h-52">
            {students.map(s => {
              const inA = groupA.includes(s.user_id);
              return (
                <button key={s.user_id} onClick={() => toggle(s.user_id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all text-sm ${inA ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${inA ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                    {inA && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={inA ? 'text-indigo-800 font-medium' : 'text-slate-700'}>{s.user_name}</span>
                  <span className={`ml-auto text-[11px] font-bold px-1.5 rounded ${inA ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>{inA ? 'A' : 'B'}</span>
                </button>
              );
            })}
          </div>
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-xs text-amber-700">
              The original class will be archived. Two new sections will be created with the same teacher assignments and subject mappings.
            </AlertDescription>
          </Alert>
        </div>
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
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
      const res = await base44.functions.invoke('updateClassStatus', { classId: id, status });
      const errMsg = res?.data?.error || res?.error;
      if (errMsg) throw new Error(errMsg);
      const failure = res?.data?.failures?.[0];
      if (failure) throw new Error(failure.error || 'Update failed');
      return res?.data;
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
      const res = await base44.functions.invoke('updateClassStatus', { classIds: ids, status: 'archived' });
      const errMsg = res?.data?.error || res?.error;
      if (errMsg) throw new Error(errMsg);
      return res?.data;
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

  const ActionCard = ({ icon: Icon, title, description, color, children }) => (
    <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{activeClasses.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Active Classes</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-400">{archivedClasses.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Archived Classes</p>
        </div>
      </div>

      {/* Bulk archive */}
      <ActionCard
        icon={Archive}
        title="End-of-Year Archive"
        description="Archive all active classes at once when the academic year concludes."
        color="bg-amber-100 text-amber-700"
      >
        {activeClasses.length === 0 ? (
          <p className="text-xs text-slate-400">No active classes to archive.</p>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">{activeClasses.length} active class{activeClasses.length !== 1 ? 'es' : ''} will be archived.</p>
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50 gap-1.5"
              disabled={bulkArchiveMutation.isPending}
              onClick={() => setBulkArchiveOpen(true)}
            >
              {bulkArchiveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
              Archive All Active
            </Button>
          </div>
        )}
      </ActionCard>

      {/* Archive/Restore individual */}
      {classes.length > 0 && (
        <ActionCard
          icon={RotateCcw}
          title="Archive / Restore Individual Classes"
          description="Manage individual class lifecycle states."
          color="bg-slate-100 text-slate-600"
        >
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {classes.map(c => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span className="text-sm font-medium text-slate-800 truncate">{c.name}</span>
                  <span className="text-[11px] text-slate-400">{c.student_ids?.length || 0} students</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-xs flex-shrink-0 gap-1 ${c.status === 'active' ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}`}
                  disabled={archiveMutation.isPending}
                  onClick={() => setPendingStatus({
                    classObj: c,
                    status: c.status === 'active' ? 'archived' : 'active',
                  })}
                >
                  {c.status === 'active' ? <><Archive className="w-3 h-3" />Archive</> : <><RotateCcw className="w-3 h-3" />Restore</>}
                </Button>
              </div>
            ))}
          </div>
        </ActionCard>
      )}

      {/* Duplicate for new year */}
      <ActionCard
        icon={Copy}
        title="Duplicate for New Year"
        description="Copy a class structure to the next academic year, with optional roster carry-over."
        color="bg-indigo-100 text-indigo-700"
      >
        {activeClasses.length === 0 ? (
          <p className="text-xs text-slate-400">No active classes to duplicate.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activeClasses.map(c => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-100 bg-slate-50">
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-slate-800 truncate block">{c.name}</span>
                  <span className="text-[11px] text-slate-400">{c.student_ids?.length || 0} students · {c.teacher_ids?.length || 0} staff</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1 flex-shrink-0"
                  onClick={() => setDuplicatingClass(c)}
                >
                  <Copy className="w-3 h-3" /> Duplicate
                </Button>
              </div>
            ))}
          </div>
        )}
      </ActionCard>

      {/* Split class */}
      <ActionCard
        icon={Scissors}
        title="Split Class Section"
        description="Divide a class into two sections and assign students to each group."
        color="bg-rose-100 text-rose-700"
      >
        {activeClasses.filter(c => (c.student_ids?.length || 0) >= 2).length === 0 ? (
          <p className="text-xs text-slate-400">No classes with enough students to split (need ≥ 2).</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activeClasses.filter(c => (c.student_ids?.length || 0) >= 2).map(c => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-100 bg-slate-50">
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-slate-800 truncate block">{c.name}</span>
                  <span className="text-[11px] text-slate-400">{c.student_ids?.length || 0} students</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 flex-shrink-0"
                  onClick={() => setSplittingClass(c)}
                >
                  <Scissors className="w-3 h-3" /> Split
                </Button>
              </div>
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