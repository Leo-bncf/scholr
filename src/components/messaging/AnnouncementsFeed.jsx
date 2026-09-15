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
    <div className={`rounded-xl border overflow-hidden ${isPinned ? 'border-amber-300' : isSchoolWide ? 'scholr-accent-rule' : 'scholr-rule'}`}>
      {/* Pinned and school-wide were a tinted card body. That coloured a whole
          announcement for a fact about where it sits in the list, which the
          chips beside the title already say. */}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isSchoolWide ? 'scholr-accent-sf' : 'scholr-sunk'}`}>
            {isSchoolWide
              ? <Globe className="w-4 h-4 scholr-accent" />
              : <BookOpen className="w-4 h-4 scholr-muted" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              {isPinned && (
                <Badge className="scholr-sunk scholr-muted border-0 text-xs flex items-center gap-1 py-0">
                  <Pin className="w-2.5 h-2.5" /> Pinned
                </Badge>
              )}
              <Badge className={`border-0 text-xs ${isSchoolWide ? 'scholr-accent-sf scholr-accent' : 'scholr-sunk scholr-muted'}`}>
                {isSchoolWide ? 'School-wide' : msg.class_name || 'Class'}
              </Badge>
            </div>
            <p className="font-semibold scholr-ink truncate">{msg.subject}</p>
            <p className="text-xs scholr-muted mt-0.5">
              {msg.sender_name || 'School'} · {msg.created_at ? format(parseISO(msg.created_at), 'MMM d, yyyy') : ''}
            </p>
          </div>
        </div>
        {msg.body && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4 scholr-muted" /> : <ChevronDown className="w-4 h-4 scholr-muted" />}
          </button>
        )}
      </div>
      {expanded && msg.body && (
        <div className="px-4 py-3 border-t scholr-rule-soft bg-white">
          <p className="text-sm scholr-body whitespace-pre-wrap">{msg.body}</p>
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
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin scholr-accent" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 scholr-sunk rounded-lg p-1 w-fit">
        {[
          { value: 'all', label: 'All' },
          { value: 'school', label: 'School-wide' },
          { value: 'class', label: 'Class' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setTypeFilter(opt.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${typeFilter === opt.value ? 'bg-white scholr-accent shadow-sm' : 'scholr-muted hover:scholr-ink'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 scholr-faint">
          <Megaphone className="w-12 h-12 mx-auto mb-3 scholr-faint" />
          <p className="text-sm">No announcements</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <>
              <p className="text-xs font-semibold scholr-muted uppercase tracking-wide flex items-center gap-1.5">
                <Pin className="w-3 h-3" /> Pinned
              </p>
              {pinned.map(a => <AnnouncementCard key={a.id} msg={a} />)}
              {rest.length > 0 && <p className="text-xs font-semibold scholr-muted uppercase tracking-wide pt-1">Recent</p>}
            </>
          )}
          {rest.map(a => <AnnouncementCard key={a.id} msg={a} />)}
        </div>
      )}
    </div>
  );
}