import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import { useSuperAdminSchoolsQuery } from '@/components/hooks/useSuperAdminData';
import { useTimetableData } from '@/components/timetable/useTimetableData';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import { Group, GroupEmpty, Segmented } from '@/components/app/AppShell';
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
    <SuperAdminShell
      activeItem="timetables"
      currentUser={currentUser}
      title="Timetables"
      eyebrow="Any school, by class, teacher or student"
    >
      <Group title="Pick a timetable">
        <div className="px-4 py-3.5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* School */}
          <div>
            <label className="scholr-label" style={{ display: 'block', marginBottom: '.3rem' }}>
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
            <label className="scholr-label" style={{ display: 'block', marginBottom: '.3rem' }}>
              View by
            </label>
            <Segmented
              label="View by"
              value={viewMode}
              onChange={handleViewModeChange}
              options={VIEW_MODES.map((m) => ({ value: m.value, label: m.label }))}
            />
          </div>

          {/* Entity selector */}
          <div>
            <label className="scholr-label" style={{ display: 'block', marginBottom: '.3rem' }}>
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
                <div className="sticky top-0 p-2" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--rule-soft)' }}>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--faint)' }} />
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
                  <p className="text-xs text-center py-3" style={{ color: 'var(--faint)' }}>No results</p>
                ) : (
                  filteredEntityOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      <div className="flex flex-col">
                        <span className="text-sm">{opt.label}</span>
                        {opt.subtext && (
                          <span className="text-xs" style={{ color: 'var(--faint)' }}>{opt.subtext}</span>
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
          <div className="flex items-center gap-2 text-xs pt-3" style={{ color: 'var(--muted)', borderTop: '1px solid var(--rule-soft)' }}>
            <CalendarClock className="w-3.5 h-3.5" />
            Viewing <span className="font-medium" style={{ color: 'var(--ink)' }}>{selectedEntityLabel}</span>
            {' · '}
            <span>{filteredEntries.length} scheduled {filteredEntries.length === 1 ? 'entry' : 'entries'}</span>
          </div>
        )}
        </div>
      </Group>

      {!selectedSchoolId ? (
        <Group title="Timetable">
          <GroupEmpty>
            Choose a school above, then a class, teacher or student.
          </GroupEmpty>
        </Group>
      ) : isLoadingTimetable ? (
        <Group title="Timetable">
          <GroupEmpty>Loading…</GroupEmpty>
        </Group>
      ) : !selectedEntityId ? (
        <Group title="Timetable">
          <GroupEmpty>Pick a {viewMode} to see their week.</GroupEmpty>
        </Group>
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