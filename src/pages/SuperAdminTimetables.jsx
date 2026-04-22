import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import { useSuperAdminSchoolsQuery } from '@/components/hooks/useSuperAdminData';
import { useTimetableData } from '@/components/timetable/useTimetableData';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import SuperAdminPageHeader from '@/components/admin/super-admin/SuperAdminPageHeader';
import TimetableGrid from '@/components/admin/super-admin/timetables/TimetableGrid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CalendarClock, Search, BookOpen, User, GraduationCap } from 'lucide-react';

const VIEW_MODES = [
  { value: 'class', label: 'Class', icon: BookOpen },
  { value: 'teacher', label: 'Teacher', icon: User },
  { value: 'student', label: 'Student', icon: GraduationCap },
];

export default function SuperAdminTimetables() {
  const navigate = useNavigate();
  const { currentUser, isChecking } = useSuperAdminAccess(navigate);
  const { data: schools = [], isLoading: isLoadingSchools } = useSuperAdminSchoolsQuery({
    enabled: !!currentUser,
  });

  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [viewMode, setViewMode] = useState('class');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [entitySearch, setEntitySearch] = useState('');

  const { scheduleEntries, rooms, classes, memberships, isLoading: isLoadingTimetable } =
    useTimetableData(selectedSchoolId);

  const classesById = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c])), [classes]);
  const membershipsByUserId = useMemo(
    () => Object.fromEntries(memberships.map((m) => [m.user_id, m])),
    [memberships]
  );

  const teachers = useMemo(
    () => memberships.filter((m) => m.role === 'teacher' || m.role === 'ib_coordinator'),
    [memberships]
  );
  const students = useMemo(() => memberships.filter((m) => m.role === 'student'), [memberships]);

  // Reset entity selection when school or view mode changes
  const handleSchoolChange = (val) => {
    setSelectedSchoolId(val);
    setSelectedEntityId('');
    setEntitySearch('');
  };
  const handleViewModeChange = (val) => {
    setViewMode(val);
    setSelectedEntityId('');
    setEntitySearch('');
  };

  // Build entity options based on view mode
  const entityOptions = useMemo(() => {
    if (viewMode === 'class') {
      return classes.map((c) => ({
        id: c.id,
        label: c.name + (c.section ? ` – Section ${c.section}` : ''),
        subtext: classesById[c.id]?.room || '',
      }));
    }
    if (viewMode === 'teacher') {
      return teachers.map((m) => ({
        id: m.user_id,
        label: m.user_name || m.user_email || 'Unnamed',
        subtext: m.department || m.role,
      }));
    }
    return students.map((m) => ({
      id: m.user_id,
      label: m.user_name || m.user_email || 'Unnamed',
      subtext: m.grade_level || '',
    }));
  }, [viewMode, classes, teachers, students, classesById]);

  const filteredEntityOptions = useMemo(() => {
    const q = entitySearch.trim().toLowerCase();
    if (!q) return entityOptions.slice(0, 200);
    return entityOptions
      .filter((o) => o.label.toLowerCase().includes(q) || (o.subtext || '').toLowerCase().includes(q))
      .slice(0, 200);
  }, [entityOptions, entitySearch]);

  // Filter schedule entries based on selected entity
  const filteredEntries = useMemo(() => {
    if (!selectedEntityId) return [];
    if (viewMode === 'class') {
      return scheduleEntries.filter((e) => e.class_id === selectedEntityId);
    }
    if (viewMode === 'teacher') {
      return scheduleEntries.filter((e) => {
        if (e.teacher_id === selectedEntityId) return true;
        const cls = classesById[e.class_id];
        return cls?.teacher_ids?.includes(selectedEntityId);
      });
    }
    // student: find classes the student is enrolled in
    const studentClassIds = new Set(
      classes.filter((c) => c.student_ids?.includes(selectedEntityId)).map((c) => c.id)
    );
    return scheduleEntries.filter((e) => studentClassIds.has(e.class_id));
  }, [selectedEntityId, viewMode, scheduleEntries, classesById, classes]);

  if (isChecking || isLoadingSchools) {
    return <SuperAdminLoadingState />;
  }

  if (!currentUser) {
    return null;
  }

  const selectedEntityLabel = entityOptions.find((o) => o.id === selectedEntityId)?.label;

  return (
    <SuperAdminShell activeItem="timetables" currentUser={currentUser}>
      <SuperAdminPageHeader
        title="Timetables"
        subtitle="View any school's schedule by class, teacher, or student"
      />

      {/* Selectors */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm p-5 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* School */}
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">
              School
            </label>
            <Select value={selectedSchoolId} onValueChange={handleSchoolChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a school..." />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View mode */}
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">
              View by
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 rounded-md p-1">
              {VIEW_MODES.map((mode) => {
                const Icon = mode.icon;
                const isActive = viewMode === mode.value;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => handleViewModeChange(mode.value)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Entity selector */}
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5 block">
              {viewMode === 'class' ? 'Class / Grade' : viewMode === 'teacher' ? 'Teacher' : 'Student'}
            </label>
            <Select
              value={selectedEntityId}
              onValueChange={setSelectedEntityId}
              disabled={!selectedSchoolId || isLoadingTimetable}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !selectedSchoolId
                      ? 'Select a school first'
                      : isLoadingTimetable
                      ? 'Loading...'
                      : `Select ${viewMode}...`
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <Input
                      value={entitySearch}
                      onChange={(e) => setEntitySearch(e.target.value)}
                      placeholder="Search..."
                      className="h-8 pl-8 text-xs"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                {filteredEntityOptions.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">No results</p>
                ) : (
                  filteredEntityOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      <div className="flex flex-col">
                        <span className="text-sm">{opt.label}</span>
                        {opt.subtext && (
                          <span className="text-xs text-slate-400">{opt.subtext}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedEntityLabel && (
          <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
            <CalendarClock className="w-3.5 h-3.5" />
            Viewing <span className="font-medium text-slate-700">{selectedEntityLabel}</span>
            {' · '}
            <span>{filteredEntries.length} scheduled {filteredEntries.length === 1 ? 'entry' : 'entries'}</span>
          </div>
        )}
      </div>

      {/* Timetable grid */}
      {!selectedSchoolId ? (
        <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
          <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 text-sm font-medium">Select a school to begin</p>
          <p className="text-slate-400 text-xs mt-1">
            Choose a school, then pick a class, teacher, or student to view their timetable.
          </p>
        </div>
      ) : isLoadingTimetable ? (
        <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
          <p className="text-slate-500 text-sm">Loading timetable data...</p>
        </div>
      ) : !selectedEntityId ? (
        <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
          <p className="text-slate-600 text-sm font-medium">
            Select a {viewMode} to view their timetable
          </p>
        </div>
      ) : (
        <TimetableGrid
          entries={filteredEntries}
          rooms={rooms}
          classesById={classesById}
          membershipsByUserId={membershipsByUserId}
        />
      )}
    </SuperAdminShell>
  );
}