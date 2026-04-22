import React from 'react';
import { ArrowLeft, Users, MapPin, Clock, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';

/**
 * Shared class workspace header.
 * Shows breadcrumb-style back link, class name, key metadata, and role-scoped context chip.
 */
export default function ClassHeader({ classData, backTo, backLabel, contextChip }) {
  const studentCount = classData.student_ids?.length || 0;
  const isArchived = classData.status === 'archived';

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between gap-4 mb-2">
          <a href={createPageUrl(backTo)}>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500 hover:text-slate-900 -ml-2">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              {backLabel}
            </Button>
          </a>
          {contextChip}
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">
                {classData.name}
              </h1>
              {classData.section && (
                <Badge variant="secondary" className="text-[11px]">Section {classData.section}</Badge>
              )}
              {isArchived && (
                <Badge className="bg-slate-200 text-slate-600 text-[11px] gap-1">
                  <Archive className="w-3 h-3" /> Archived
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {studentCount} student{studentCount !== 1 ? 's' : ''}
                {classData.capacity ? ` / ${classData.capacity}` : ''}
              </span>
              {classData.room && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Room {classData.room}
                </span>
              )}
              {classData.schedule_info && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {classData.schedule_info}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}