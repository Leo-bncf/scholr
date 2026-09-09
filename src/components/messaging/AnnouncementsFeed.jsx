import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Globe, BookOpen, Loader2, Pin, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import * as messagesData from '@/data/messages';

function AnnouncementCard({ msg }) {
  const [expanded, setExpanded] = useState(false);
  const isSchoolWide = msg.is_school_wide;
  const isPinned = msg.is_pinned;

  return (
    <div className={`rounded-xl border overflow-hidden ${isPinned ? 'border-amber-300' : isSchoolWide ? 'border-indigo-200' : 'border-slate-200'}`}>
      <div className={`px-4 py-3 flex items-start justify-between gap-3 ${isPinned ? 'bg-amber-50' : isSchoolWide ? 'bg-indigo-50' : 'bg-white'}`}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isSchoolWide ? 'bg-indigo-100' : 'bg-slate-100'}`}>
            {isSchoolWide
              ? <Globe className="w-4 h-4 text-indigo-600" />
              : <BookOpen className="w-4 h-4 text-slate-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              {isPinned && (
                <Badge className="bg-amber-100 text-amber-700 border-0 text-xs flex items-center gap-1 py-0">
                  <Pin className="w-2.5 h-2.5" /> Pinned
                </Badge>
              )}
              <Badge className={`border-0 text-xs ${isSchoolWide ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                {isSchoolWide ? 'School-wide' : msg.class_name || 'Class'}
              </Badge>
            </div>
            <p className="font-semibold text-slate-900 truncate">{msg.subject}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {msg.sender_name || 'School'} · {msg.created_at ? format(parseISO(msg.created_at), 'MMM d, yyyy') : ''}
            </p>
          </div>
        </div>
        {msg.body && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
        )}
      </div>
      {expanded && msg.body && (
        <div className="px-4 py-3 border-t border-slate-100 bg-white">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.body}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Universal announcements feed. 
 * For students/parents pass `classIds` array to filter class-specific announcements.
 * For admins/teachers no filtering needed (they see all relevant ones by role).
 */
export default function AnnouncementsFeed({ schoolId, userId, classIds = [], showAll = false }) {
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements', schoolId, userId, classIds],
    queryFn: async () => {
      const all = await messagesData.where({
        school_id: schoolId,
        is_announcement: true,
      }, { order: 'created_at', ascending: false });

      if (showAll) return all; // admins see all

      const classSet = new Set(classIds);
      return all.filter(m => m.is_school_wide || classSet.has(m.class_id));
    },
    enabled: !!schoolId,
  });

  const filtered = useMemo(() => {
    if (typeFilter === 'school') return announcements.filter(a => a.is_school_wide);
    if (typeFilter === 'class') return announcements.filter(a => !a.is_school_wide);
    return announcements;
  }, [announcements, typeFilter]);

  const pinned = filtered.filter(a => a.is_pinned);
  const rest = filtered.filter(a => !a.is_pinned);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {[
          { value: 'all', label: 'All' },
          { value: 'school', label: 'School-wide' },
          { value: 'class', label: 'Class' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setTypeFilter(opt.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${typeFilter === opt.value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm">No announcements</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Pin className="w-3 h-3" /> Pinned
              </p>
              {pinned.map(a => <AnnouncementCard key={a.id} msg={a} />)}
              {rest.length > 0 && <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-1">Recent</p>}
            </>
          )}
          {rest.map(a => <AnnouncementCard key={a.id} msg={a} />)}
        </div>
      )}
    </div>
  );
}