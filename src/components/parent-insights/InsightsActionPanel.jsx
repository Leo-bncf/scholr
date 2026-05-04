import React from 'react';
import { MessageSquare, ClipboardList, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InsightsActionPanel({ selectedChildId }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-lg font-bold text-slate-900">What you can do now</h3>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={() => window.location.href = '/Messages'}>
          <MessageSquare className="w-4 h-4" /> Message teacher
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/ParentDashboard'}>
          <ClipboardList className="w-4 h-4" /> View assignments
        </Button>
        <Button variant="outline" onClick={() => alert('Meeting booking can be connected here later.') }>
          <CalendarPlus className="w-4 h-4" /> Book meeting
        </Button>
      </div>
    </div>
  );
}