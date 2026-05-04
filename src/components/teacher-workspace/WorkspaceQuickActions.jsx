import React from 'react';
import { FilePlus2, MessageSquare, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateAssignment from '@/components/assignment/CreateAssignment';

export default function WorkspaceQuickActions({ classData, userId }) {
  if (!classData) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <CreateAssignment classData={classData} userId={userId} />
      <Button variant="outline" onClick={() => window.location.href = '/Messages'}>
        <MessageSquare className="w-4 h-4" /> Message class
      </Button>
      <Button variant="outline" onClick={() => window.location.href = `/ClassGradebook?class_id=${classData.id}`}>
        <Download className="w-4 h-4" /> Export grades
      </Button>
    </div>
  );
}