import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import BehaviorRecordsList from '@/components/behavior/BehaviorRecordsList';
import * as behaviorRecordsData from '@/data/behaviorRecords';

export default function ChildBehaviorOverview({ schoolId, studentId }) {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['parent-child-behavior', schoolId, studentId],
    queryFn: () => behaviorRecordsData.where({
      school_id: schoolId,
      student_id: studentId,
      visible_to_parent: true
    }, { order: 'date', ascending: false }),
    enabled: !!schoolId && !!studentId,
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  }

  return <BehaviorRecordsList records={records} showVisibilityIndicators={false} />;
}