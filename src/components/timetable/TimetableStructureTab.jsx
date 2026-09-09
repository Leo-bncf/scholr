import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as periodsData from '@/data/periods';
import * as roomsData from '@/data/rooms';
import {
  Plus, Pencil, Trash2, Clock, MapPin, Coffee, Lock, ExternalLink,
  Calendar, Building2, Loader2
} from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ROOM_TYPES = ['classroom', 'lab', 'gym', 'library', 'auditorium', 'office', 'other'];

function PeriodForm({ initial, onSave, onCancel, isPending }) {
  const [form, setForm] = useState(initial || {
    name: '', start_time: '', end_time: '', day_of_week: '', period_order: '', is_break: false,
  });
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-slate-600">Period Name *</Label>
          <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Period 1, Block A" className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600">Order</Label>
          <Input type="number" min="1" value={form.period_order} onChange={e => setForm({ ...form, period_order: parseInt(e.target.value) || '' })} placeholder="1" className="mt-1 h-8 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-slate-600">Start Time *</Label>
          <Input required type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600">End Time *</Label>
          <Input required type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="mt-1 h-8 text-sm" />
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-600">Day of Week (optional)</Label>
        <Select value={form.day_of_week?.toString() || '__any'} onValueChange={v => setForm({ ...form, day_of_week: v === '__any' ? '' : parseInt(v) })}>
          <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Any day" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__any">Any day</SelectItem>
            {DAY_NAMES.map((d, i) => <SelectItem key={i} value={i.toString()}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
        <Switch checked={form.is_break} onCheckedChange={v => setForm({ ...form, is_break: v })} />
        <Label className="text-xs text-amber-800 cursor-pointer">This is a break / lunch period</Label>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Period'}
        </Button>
      </div>
    </form>
  );
}

function RoomForm({ initial, onSave, onCancel, isPending }) {
  const [form, setForm] = useState(initial || {
    name: '', code: '', building: '', capacity: '', room_type: 'classroom',
  });
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-slate-600">Room Name *</Label>
          <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Science Lab 1" className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600">Room Code</Label>
          <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. SL1" className="mt-1 h-8 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-slate-600">Building</Label>
          <Input value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} placeholder="e.g. Block A" className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600">Capacity</Label>
          <Input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || '' })} placeholder="30" className="mt-1 h-8 text-sm" />
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-600">Type</Label>
        <Select value={form.room_type} onValueChange={v => setForm({ ...form, room_type: v })}>
          <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ROOM_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Room'}
        </Button>
      </div>
    </form>
  );
}

export default function TimetableStructureTab({ schoolId, periods, rooms, scheduleEntries, settings }) {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('periods');
  const [addingPeriod, setAddingPeriod] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [addingRoom, setAddingRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);

  const isReadOnly = settings?.override_policy === 'read_only';

  const periodMutation = useMutation({
    mutationFn: ({ id, data }) => id
      ? periodsData.update(id, data)
      : periodsData.create({ ...data, school_id: schoolId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-periods', schoolId] });
      setAddingPeriod(false); setEditingPeriod(null);
    },
  });

  const deletePeriodMutation = useMutation({
    mutationFn: (id) => periodsData.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timetable-periods', schoolId] }),
  });

  const roomMutation = useMutation({
    mutationFn: ({ id, data }) => id
      ? roomsData.update(id, data)
      : roomsData.create({ ...data, school_id: schoolId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-rooms', schoolId] });
      setAddingRoom(false); setEditingRoom(null);
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id) => roomsData.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timetable-rooms', schoolId] }),
  });

  const dayEntries = scheduleEntries
    .filter(e => e.day_of_week === selectedDay && e.status === 'active')
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  const sortedPeriods = [...periods].sort((a, b) => (a.period_order || 0) - (b.period_order || 0));

  return (
    <div className="space-y-4">
      {isReadOnly && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-xs text-red-700">
          <Lock className="w-3.5 h-3.5 flex-shrink-0" />
          <span><strong>Read-Only mode active.</strong> Structure is controlled by the external timetable system. Local edits are disabled.</span>
        </div>
      )}

      {/* Section switcher */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {[
          { key: 'periods', label: 'Periods', icon: Clock },
          { key: 'rooms',   label: 'Rooms',   icon: MapPin },
          { key: 'schedule',label: 'Schedule', icon: Calendar },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeSection === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* PERIODS */}
      {activeSection === 'periods' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Time Periods</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{periods.length} periods · {periods.filter(p => p.is_break).length} breaks</p>
            </div>
            {!isReadOnly && (
              <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1" onClick={() => setAddingPeriod(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Period
              </Button>
            )}
          </div>

          {addingPeriod && (
            <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100">
              <p className="text-xs font-semibold text-indigo-700 mb-3">New Period</p>
              <PeriodForm onSave={d => periodMutation.mutate({ id: null, data: d })} onCancel={() => setAddingPeriod(false)} isPending={periodMutation.isPending} />
            </div>
          )}

          {sortedPeriods.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No periods configured</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {sortedPeriods.map(p => (
                <div key={p.id}>
                  {editingPeriod?.id === p.id ? (
                    <div className="px-5 py-4 bg-slate-50">
                      <PeriodForm
                        initial={{ name: p.name, start_time: p.start_time, end_time: p.end_time, day_of_week: p.day_of_week ?? '', period_order: p.period_order || '', is_break: p.is_break || false }}
                        onSave={d => periodMutation.mutate({ id: p.id, data: d })}
                        onCancel={() => setEditingPeriod(null)}
                        isPending={periodMutation.isPending}
                      />
                    </div>
                  ) : (
                    <div className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${p.is_break ? 'bg-amber-100' : 'bg-indigo-100'}`}>
                          {p.is_break ? <Coffee className="w-3.5 h-3.5 text-amber-600" /> : <Clock className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">{p.name}</span>
                            {p.is_break && <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 border">Break</Badge>}
                            {p.external_sync_id && <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 border flex items-center gap-1"><ExternalLink className="w-2.5 h-2.5" />Synced</Badge>}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {p.start_time} – {p.end_time}
                            {p.day_of_week != null && p.day_of_week !== '' && ` · ${DAY_NAMES[p.day_of_week]}`}
                            {p.period_order && ` · Order ${p.period_order}`}
                          </p>
                        </div>
                      </div>
                      {!isReadOnly && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700" onClick={() => setEditingPeriod(p)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600" onClick={() => { if (window.confirm('Delete this period?')) deletePeriodMutation.mutate(p.id); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ROOMS */}
      {activeSection === 'rooms' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Rooms & Facilities</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{rooms.length} rooms configured</p>
            </div>
            {!isReadOnly && (
              <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1" onClick={() => setAddingRoom(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Room
              </Button>
            )}
          </div>

          {addingRoom && (
            <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100">
              <p className="text-xs font-semibold text-indigo-700 mb-3">New Room</p>
              <RoomForm onSave={d => roomMutation.mutate({ id: null, data: { ...d, status: 'active' } })} onCancel={() => setAddingRoom(false)} isPending={roomMutation.isPending} />
            </div>
          )}

          {rooms.length === 0 ? (
            <div className="p-12 text-center">
              <MapPin className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No rooms configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-slate-100">
              {rooms.map(r => (
                <div key={r.id}>
                  {editingRoom?.id === r.id ? (
                    <div className="bg-white p-4">
                      <RoomForm
                        initial={{ name: r.name, code: r.code || '', building: r.building || '', capacity: r.capacity || '', room_type: r.room_type || 'classroom' }}
                        onSave={d => roomMutation.mutate({ id: r.id, data: d })}
                        onCancel={() => setEditingRoom(null)}
                        isPending={roomMutation.isPending}
                      />
                    </div>
                  ) : (
                    <div className="bg-white p-4 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                            {r.code && <p className="text-[11px] text-slate-400">{r.code}</p>}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] capitalize">{r.room_type}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-400">
                          {r.building && `${r.building} · `}{r.capacity && `Cap. ${r.capacity}`}
                          {r.external_sync_id && <span className="ml-1 text-blue-600">· Synced</span>}
                        </p>
                        {!isReadOnly && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700" onClick={() => setEditingRoom(r)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-red-600" onClick={() => { if (window.confirm('Delete this room?')) deleteRoomMutation.mutate(r.id); }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCHEDULE VIEW */}
      {activeSection === 'schedule' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Schedule Entries</h3>
            <div className="flex gap-1 flex-wrap">
              {[1, 2, 3, 4, 5].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedDay === d ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {DAY_NAMES[d]}
                </button>
              ))}
            </div>
          </div>
          {dayEntries.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No schedule entries for {DAY_NAMES[selectedDay]}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {dayEntries.map(e => (
                <div key={e.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-right flex-shrink-0 w-20">
                      <p className="text-xs font-mono font-semibold text-slate-700">{e.start_time}</p>
                      <p className="text-[10px] text-slate-400">{e.end_time}</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{e.class_name || '—'}</p>
                      <p className="text-[11px] text-slate-400">
                        {e.teacher_name && `${e.teacher_name} · `}
                        {e.room_name && `📍 ${e.room_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.external_sync_id && (
                      <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 border flex items-center gap-1">
                        <ExternalLink className="w-2.5 h-2.5" />Synced
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] capitalize">{e.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}