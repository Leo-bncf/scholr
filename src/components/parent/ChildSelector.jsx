import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users } from 'lucide-react';
import * as parentStudentLinksData from '@/data/parentStudentLinks';

export default function ChildSelector({ parentId, schoolId, selectedChildId, onSelectChild }) {
  const { data: linkedChildren = [], isLoading } = useQuery({
    queryKey: ['parent-children', parentId, schoolId],
    queryFn: async () => {
      const links = await parentStudentLinksData.where({
        school_id: schoolId,
        parent_id: parentId
      });
      return links;
    },
    enabled: !!parentId && !!schoolId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading children...</span>
      </div>
    );
  }

  if (linkedChildren.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
        <Users className="w-8 h-8 text-amber-600 mx-auto mb-2" />
        <p className="text-sm text-amber-900 font-medium">No children linked to your account</p>
        <p className="text-xs text-amber-700 mt-1">Please contact the school to link your child's account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">Viewing child:</label>
      <Select value={selectedChildId} onValueChange={onSelectChild}>
        <SelectTrigger className="w-full max-w-xs bg-white">
          <SelectValue placeholder="Select a child..." />
        </SelectTrigger>
        <SelectContent>
          {linkedChildren.map(link => (
            <SelectItem key={link.student_id} value={link.student_id}>
              {link.student_name} ({link.relationship})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}