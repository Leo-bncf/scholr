import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronDown, Trash2, Users, BookOpen, GraduationCap, Plus, UserCheck, UserPlus, MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function ClassCard({
  classItem,
  expanded,
  onToggleExpand,
  subjectsById,
  teachersByUserId,
  studentsByUserId,
  onAssignSubject,
  onRemoveSubjectAssignment,
  onAssignClassTeachers,
  onEnrolStudents,
  onRemoveStudent,
  onDeleteClass,
}) {
  const subjectAssignments = classItem.subject_teacher_assignments || [];
  const studentIds = classItem.student_ids || [];
  const classTeacherIds = classItem.teacher_ids || [];

  const subjectName = (id) => subjectsById[id]?.name || 'Unknown subject';
  const teacherName = (id) => teachersByUserId[id]?.user_name || 'Unknown';
  const studentName = (id) => studentsByUserId[id]?.user_name || 'Unknown';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <Collapsible open={expanded} onOpenChange={onToggleExpand}>
        <div className="flex items-center justify-between pr-3 hover:bg-slate-50 transition-colors">
          <CollapsibleTrigger asChild>
            <button className="flex-1 px-5 py-4 flex items-center justify-between text-left">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900 text-sm">{classItem.name}</h3>
                  {classItem.section && (
                    <Badge variant="secondary" className="text-[10px] py-0">§ {classItem.section}</Badge>
                  )}
                  {classItem.room && (
                    <span className="text-xs text-slate-400">Room {classItem.room}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    {studentIds.length} students
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {subjectAssignments.length} subjects
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {classTeacherIds.length} teachers
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ml-3 ${
                  expanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          </CollapsibleTrigger>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="w-4 h-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAssignClassTeachers(classItem)}>
                <UserCheck className="w-3.5 h-3.5 mr-2" /> Assign teachers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEnrolStudents(classItem)}>
                <UserPlus className="w-3.5 h-3.5 mr-2" /> Enrol students
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700"
                onClick={() => {
                  if (window.confirm(`Delete "${classItem.name}"? This cannot be undone.`)) {
                    onDeleteClass(classItem.id);
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete class
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CollapsibleContent className="border-t border-slate-100 bg-slate-50 p-5 space-y-5">
          {/* Class teachers */}
          <SectionHeader
            icon={<UserCheck className="w-3.5 h-3.5" />}
            title={`Class Teachers (${classTeacherIds.length})`}
            action={
              <Button
                size="sm" variant="outline" className="h-7 text-xs gap-1"
                onClick={() => onAssignClassTeachers(classItem)}
              >
                <UserCheck className="w-3 h-3" /> Manage
              </Button>
            }
          />
          {classTeacherIds.length === 0 ? (
            <EmptyInlineNote text="No class teachers assigned yet" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {classTeacherIds.map((id) => (
                <Badge key={id} variant="secondary" className="gap-1 py-1 px-2 text-xs font-medium">
                  <div className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-[9px] font-bold">
                    {teacherName(id)[0]?.toUpperCase() || '?'}
                  </div>
                  {teacherName(id)}
                </Badge>
              ))}
            </div>
          )}

          {/* Subject + teacher assignments */}
          <SectionHeader
            icon={<BookOpen className="w-3.5 h-3.5" />}
            title="Subjects & Teachers"
            action={
              <Button
                size="sm" variant="outline" className="h-7 text-xs gap-1"
                onClick={() => onAssignSubject(classItem)}
              >
                <Plus className="w-3 h-3" /> Add subject
              </Button>
            }
          />
          {subjectAssignments.length === 0 ? (
            <EmptyInlineNote text="No subjects mapped to teachers yet" />
          ) : (
            <div className="space-y-2">
              {subjectAssignments.map((a) => (
                <div key={a.id} className="bg-white rounded-lg border border-slate-200 p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{subjectName(a.subject_id)}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {a.teacher_ids?.length
                        ? a.teacher_ids.map(teacherName).join(', ')
                        : 'No teachers assigned'}
                    </p>
                  </div>
                  <Button
                    size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                    onClick={() => onRemoveSubjectAssignment(classItem.id, a.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Students */}
          <SectionHeader
            icon={<GraduationCap className="w-3.5 h-3.5" />}
            title={`Enrolled Students (${studentIds.length})`}
            action={
              <Button
                size="sm" variant="outline" className="h-7 text-xs gap-1"
                onClick={() => onEnrolStudents(classItem)}
              >
                <UserPlus className="w-3 h-3" /> Enrol
              </Button>
            }
          />
          {studentIds.length === 0 ? (
            <EmptyInlineNote text="No students enrolled yet" />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {studentIds.map((studentId) => {
                const s = studentsByUserId[studentId];
                return (
                  <div key={studentId} className="bg-white rounded-lg border border-slate-200 p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                        {s?.user_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{studentName(studentId)}</p>
                        <p className="text-xs text-slate-500 truncate">{s?.grade_level || 'Grade —'}</p>
                      </div>
                    </div>
                    <Button
                      size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 flex-shrink-0"
                      onClick={() => onRemoveStudent(classItem.id, studentId)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function SectionHeader({ icon, title, action }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
        <span className="text-slate-500">{icon}</span>
        {title}
      </h4>
      {action}
    </div>
  );
}

function EmptyInlineNote({ text }) {
  return <p className="text-xs text-slate-500 italic">{text}</p>;
}