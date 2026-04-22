import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link2, Users, Trash2, Plus, UserCheck, Loader2, Search } from 'lucide-react';

/**
 * Admin UI to link parents to their children.
 * Reads SchoolMemberships (parents + students) + existing ParentStudentLink records.
 * Writes to the ParentStudentLink entity.
 */
export default function ParentLinkingPanel({ schoolId }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: memberships = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['school-memberships-for-linking', schoolId],
    queryFn: () => base44.entities.SchoolMembership.filter({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const { data: links = [], isLoading: loadingLinks } = useQuery({
    queryKey: ['parent-student-links', schoolId],
    queryFn: () => base44.entities.ParentStudentLink.filter({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const parents = useMemo(() => memberships.filter(m => m.role === 'parent'), [memberships]);
  const students = useMemo(() => memberships.filter(m => m.role === 'student'), [memberships]);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ParentStudentLink.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parent-student-links', schoolId] }),
  });

  const filteredLinks = useMemo(() => {
    if (!search) return links;
    const q = search.toLowerCase();
    return links.filter(l =>
      l.parent_name?.toLowerCase().includes(q) ||
      l.student_name?.toLowerCase().includes(q)
    );
  }, [links, search]);

  if (loadingMembers || loadingLinks) {
    return <div className="text-center py-8 text-slate-400 text-sm">Loading parent-student links...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Parent–Student Links</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {links.length} link{links.length !== 1 && 's'} · {parents.length} parents · {students.length} students at your school
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          disabled={parents.length === 0 || students.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 gap-1.5"
        >
          <Plus className="w-4 h-4" /> Link parent to student
        </Button>
      </div>

      {(parents.length === 0 || students.length === 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
          You need at least one parent and one student account before you can link them.
          {parents.length === 0 && <> No parents found.</>}
          {students.length === 0 && <> No students found.</>}
        </div>
      )}

      {links.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by parent or student name..."
            className="pl-9 h-9"
          />
        </div>
      )}

      {links.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium mb-1">No parent-student links yet</p>
          <p className="text-xs text-slate-500 mb-4">Link parent accounts to the students they're responsible for.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {filteredLinks.map((link) => (
            <div key={link.id} className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Link2 className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-2 text-sm">
                <span className="font-medium text-slate-900 truncate">{link.parent_name || 'Parent'}</span>
                <span className="text-slate-400 text-xs">→</span>
                <span className="text-slate-700 truncate">{link.student_name || 'Student'}</span>
                <Badge variant="outline" className="text-[10px] capitalize ml-1">{link.relationship || 'guardian'}</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMutation.mutate(link.id)}
                disabled={deleteMutation.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <LinkParentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        schoolId={schoolId}
        parents={parents}
        students={students}
        existingLinks={links}
      />
    </div>
  );
}

function LinkParentDialog({ open, onClose, schoolId, parents, students, existingLinks }) {
  const queryClient = useQueryClient();
  const [parentId, setParentId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [relationship, setRelationship] = useState('guardian');

  const parent = parents.find(p => p.user_id === parentId);
  const student = students.find(s => s.user_id === studentId);

  const createMutation = useMutation({
    mutationFn: () => base44.entities.ParentStudentLink.create({
      school_id: schoolId,
      parent_id: parentId,
      parent_name: parent?.user_name,
      student_id: studentId,
      student_name: student?.user_name,
      relationship,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-student-links', schoolId] });
      setParentId('');
      setStudentId('');
      setRelationship('guardian');
      onClose();
    },
  });

  const alreadyLinked = existingLinks.some(l => l.parent_id === parentId && l.student_id === studentId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Link2 className="w-5 h-5" /> Link parent to student</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold">Parent</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a parent" /></SelectTrigger>
              <SelectContent>
                {parents.map(p => (
                  <SelectItem key={p.user_id} value={p.user_id}>
                    {p.user_name || p.user_email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-semibold">Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a student" /></SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.user_id} value={s.user_id}>
                    {s.user_name || s.user_email} {s.grade_level && <span className="text-slate-400">· {s.grade_level}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-semibold">Relationship</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mother">Mother</SelectItem>
                <SelectItem value="father">Father</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {alreadyLinked && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              This parent is already linked to this student.
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!parentId || !studentId || alreadyLinked || createMutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-1.5"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              Create link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}