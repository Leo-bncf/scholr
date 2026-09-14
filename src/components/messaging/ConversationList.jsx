import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';

const ROLE_LABELS = {
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
  school_admin: 'Admin',
  ib_coordinator: 'IB Coordinator',
};

export default function ConversationList({ conversations, selectedId, onSelect }) {
  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 scholr-faint px-4">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 scholr-faint" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs mt-1 scholr-faint">Click "New Message" to start one</p>
      </div>
    );
  }

  return (
    <div className="divide-y scholr-divide">
      {conversations.map(conv => {
        const isSelected = (conv.thread_id || conv.id) === selectedId;
        const hasUnread = conv.unread_count > 0;

        return (
          <button
            key={conv.thread_id || conv.id}
            onClick={() => onSelect(conv)}
            className={`w-full p-4 text-left hover:scholr-sunk transition-colors ${
              isSelected ? 'scholr-accent-sf border-r-2 scholr-accent-rule' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full scholr-accent-sf flex items-center justify-center scholr-accent font-semibold text-sm flex-shrink-0">
                  {conv.participant_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${hasUnread ? 'font-bold scholr-ink' : 'font-medium scholr-body'}`}>
                    {conv.participant_name || 'Unknown'}
                  </p>
                  {conv.participant_role && (
                    <p className="text-xs scholr-faint">{ROLE_LABELS[conv.participant_role] || conv.participant_role}</p>
                  )}
                </div>
              </div>
              {hasUnread && (
                <Badge className="pub-btn pub-btn-gold border-0 text-xs px-2 py-0.5 ml-2 flex-shrink-0">
                  {conv.unread_count}
                </Badge>
              )}
            </div>
            <p className={`text-sm truncate ${hasUnread ? 'font-medium scholr-body' : 'scholr-muted'}`}>
              {conv.subject}
            </p>
            <p className="text-xs scholr-faint mt-1">
              {conv.updated_at ? format(new Date(conv.updated_at), 'MMM d, h:mm a') : ''}
            </p>
          </button>
        );
      })}
    </div>
  );
}