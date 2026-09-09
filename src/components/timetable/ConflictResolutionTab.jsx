import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as timetableSettingsData from '@/data/timetableSettings';
import * as timetableSyncsData from '@/data/timetableSyncs';
import {
  AlertTriangle, CheckCircle, Plus, Trash2, Link2, ShieldCheck,
  Users, MapPin, BookOpen, Clock, Loader2, Search
} from 'lucide-react';

const ENTITY_TYPES = [
  { value: 'teacher', label: 'Teacher',  icon: Users },
  { value: 'student', label: 'Student',  icon: Users },
  { value: 'class',   label: 'Class',    icon: BookOpen },
  { value: 'room',    label: 'Room',     icon: MapPin },
  { value: 'period',  label: 'Period',   icon: Clock },
];

function AddMappingDialog({ onClose, schoolId, settings, memberships, classes, rooms, periods }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ entity_type: 'teacher', external_id: '', internal_id: '', label: '' });

  const getOptions = (type) => {
    switch (type) {
      case 'teacher':
      case 'student':
        return memberships
          .filter(m => type === 'teacher'
            ? ['teacher', 'ib_coordinator', 'school_admin'].includes(m.role)
            : m.role === 'student')
          .filter(m => m.status === 'active')
          .map(m => ({ value: m.user_id, label: `${m.user_name || m.user_email} (${m.role})` }));
      case 'class':
        return classes.map(c => ({ value: c.id, label: c.name }));
      case 'room':
        return rooms.map(r => ({ value: r.id, label: `${r.name}${r.code ? ` (${r.code})` : ''}` }));
      case 'period':
        return periods.map(p => ({ value: p.id, label: `${p.name} ${p.start_time}–${p.end_time}` }));
      default:
        return [];
    }
  };

  const mutation = useMutation({
    mutationFn: () => {
      const newMapping = {
        id: `map_${Date.now()}`,
        entity_type: form.entity_type,
        external_id: form.external_id.trim(),
        internal_id: form.internal_id,
        label: form.label || getOptions(form.entity_type).find(o => o.value === form.internal_id)?.label || '',
        validated: false,
        created_by: 'admin',
      };
      const currentMappings = settings?.id_mappings || [];
      const payload = { id_mappings: [...currentMappings, newMapping] };
      return settings
        ? timetableSettingsData.update(settings.id, payload)
        : timetableSettingsData.create({ school_id: schoolId, ...payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-settings', schoolId] });
      onClose();
    },
  });

  const options = getOptions(form.entity_type);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Link2 className="w-4 h-4" /> Add ID Mapping
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-xs font-semibold text-slate-600">Entity Type</Label>
            <Select value={form.entity_type} onValueChange={v => setForm({ ...form, entity_type: v, internal_id: '' })}>
              <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-600">External ID (from timetable system)</Label>
            <Input value={form.external_id} onChange={e => setForm({ ...form, external_id: e.target.value })} placeholder="e.g. T042, SMITH_J, RM-LAB1" className="mt-1 h-9 text-sm font-mono" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-600">Maps to (internal record)</Label>
            {options.length > 0 ? (
              <Select value={form.internal_id} onValueChange={v => setForm({ ...form, internal_id: v })}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select internal record…" /></SelectTrigger>
                <SelectContent>
                  {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={form.internal_id} onChange={e => setForm({ ...form, internal_id: e.target.value })} placeholder="Internal record ID" className="mt-1 h-9 text-sm font-mono" />
            )}
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-600">Label (optional)</Label>
            <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Human-readable description" className="mt-1 h-9 text-sm" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={!form.external_id || !form.internal_id || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Link2 className="w-3.5 h-3.5 mr-1.5" />Add Mapping</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ConflictResolutionTab({ schoolId, syncHistory, settings, memberships, classes, rooms, periods }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [addMappingOpen, setAddMappingOpen] = useState(false);

  // Gather all unresolved conflicts from entire sync history
  const allConflicts = syncHistory.flatMap(sync =>
    (sync.mapping_conflicts || []).map(c => ({ ...c, sync_id: sync.id, sync_date: sync.started_at }))
  );
  const unresolvedConflicts = allConflicts.filter(c => !c.resolved);

  // Current ID mappings
  const idMappings = settings?.id_mappings || [];

  const filteredMappings = idMappings.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.external_id?.toLowerCase().includes(q) || m.label?.toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || m.entity_type === typeFilter;
    return matchSearch && matchType;
  });

  const resolveMutation = useMutation({
    mutationFn: ({ sync, conflictIdx, resolution }) => {
      const updated = (sync.mapping_conflicts || []).map((c, i) =>
        i === conflictIdx ? { ...c, resolved: true, resolution } : c
      );
      return timetableSyncsData.update(sync.id, { mapping_conflicts: updated });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timetable-sync-history', schoolId] }),
  });

  const validateMutation = useMutation({
    mutationFn: (mappingId) => {
      const updated = idMappings.map(m => m.id === mappingId ? { ...m, validated: true } : m);
      return timetableSettingsData.update(settings.id, { id_mappings: updated });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timetable-settings', schoolId] }),
  });

  const deleteMappingMutation = useMutation({
    mutationFn: (mappingId) => {
      const updated = idMappings.filter(m => m.id !== mappingId);
      return timetableSettingsData.update(settings.id, { id_mappings: updated });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timetable-settings', schoolId] }),
  });

  const getResolvingSyncForConflict = (conflict) =>
    syncHistory.find(s => s.id === conflict.sync_id);

  return (
    <div className="space-y-4">
      {/* Unresolved conflicts banner */}
      {unresolvedConflicts.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-800">
            <strong>{unresolvedConflicts.length} unresolved conflict{unresolvedConflicts.length !== 1 ? 's' : ''}</strong> detected from recent syncs. 
            Fix mapping mismatches below or add explicit ID mappings, then retry the sync.
          </AlertDescription>
        </Alert>
      )}

      {/* Unresolved conflicts list */}
      {unresolvedConflicts.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-100 bg-amber-50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-900">Unresolved Sync Conflicts</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {unresolvedConflicts.map((conflict, idx) => {
              const sync = getResolvingSyncForConflict(conflict);
              const conflictIdxInSync = sync?.mapping_conflicts?.findIndex(
                c => c.external_id === conflict.external_id && c.entity_type === conflict.entity_type && !c.resolved
              );
              const entityType = ENTITY_TYPES.find(t => t.value === conflict.entity_type);
              const Icon = entityType?.icon || AlertTriangle;
              return (
                <div key={`${conflict.sync_id}-${idx}`} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 border capitalize">{conflict.entity_type}</Badge>
                        <span className="text-sm font-mono font-semibold text-slate-800">{conflict.external_id}</span>
                      </div>
                      <p className="text-xs text-slate-600 mb-3">{conflict.issue}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          disabled={resolveMutation.isPending}
                          onClick={() => {
                            if (sync && conflictIdxInSync !== -1) {
                              resolveMutation.mutate({
                                sync,
                                conflictIdx: conflictIdxInSync,
                                resolution: 'Manually marked as resolved by admin',
                              });
                            }
                          }}
                        >
                          <CheckCircle className="w-3 h-3" /> Mark Resolved
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => setAddMappingOpen(true)}
                        >
                          <Link2 className="w-3 h-3" /> Add Mapping
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ID Mappings table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">ID Mapping Registry</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{idMappings.length} mappings · {idMappings.filter(m => m.validated).length} validated</p>
          </div>
          <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1" onClick={() => setAddMappingOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Mapping
          </Button>
        </div>

        <div className="px-5 py-3 border-b border-slate-100 flex gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input placeholder="Search mappings…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {ENTITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filteredMappings.length === 0 ? (
          <div className="p-12 text-center">
            <Link2 className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No ID mappings configured</p>
            <p className="text-[11px] text-slate-300 mt-1">Add mappings to link external IDs to internal records</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredMappings.map(m => {
              const entityType = ENTITY_TYPES.find(t => t.value === m.entity_type);
              const Icon = entityType?.icon || Link2;
              return (
                <div key={m.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono font-semibold text-slate-800">{m.external_id}</span>
                        <span className="text-slate-400 text-xs">→</span>
                        <span className="text-sm text-slate-600 truncate">{m.label || m.internal_id}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge className="text-[10px] bg-slate-100 text-slate-500 border-0 capitalize">{m.entity_type}</Badge>
                        {m.validated
                          ? <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 border flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" />Validated</Badge>
                          : <Badge className="text-[10px] bg-amber-50 text-amber-600 border-amber-200 border">Unvalidated</Badge>
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {!m.validated && (
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                        disabled={validateMutation.isPending}
                        onClick={() => validateMutation.mutate(m.id)}
                      >
                        <ShieldCheck className="w-3 h-3" /> Validate
                      </Button>
                    )}
                    <Button
                      variant="ghost" size="sm"
                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                      onClick={() => { if (window.confirm('Remove this mapping?')) deleteMappingMutation.mutate(m.id); }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {addMappingOpen && (
        <AddMappingDialog
          onClose={() => setAddMappingOpen(false)}
          schoolId={schoolId}
          settings={settings}
          memberships={memberships}
          classes={classes}
          rooms={rooms}
          periods={periods}
        />
      )}
    </div>
  );
}