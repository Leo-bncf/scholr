import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import ConversationList from '@/components/messaging/ConversationList';
import ConversationView from '@/components/messaging/ConversationView';
import NewMessageDialog from '@/components/messaging/NewMessageDialog';
import AnnouncementComposer from '@/components/messaging/AnnouncementComposer';
import AnnouncementsFeed from '@/components/messaging/AnnouncementsFeed';
import { Group } from '@/components/app/AppShell';
import { Loader2 } from 'lucide-react';
import { getAppSidebarLinks } from '@/components/app/sidebarLinks';
import * as classesData from '@/data/classes';
import * as parentStudentLinksData from '@/data/parentStudentLinks';
import * as messagesData from '@/data/messages';

const TABS = [
  { value: 'messages', label: 'Conversations' },
  { value: 'announcements', label: 'Announcements' },
];

/**
 * Messages, for everyone.
 *
 * The one page in the school-admin list that a parent and a student also see,
 * so it takes the shared frame but keeps the sidebar its own role should get.
 *
 * It used to lock the conversation pane to `h-[calc(100vh-73px)]` — a number
 * that only held while the header was exactly 73px tall, and that made the page
 * the only one in the product where the browser scrollbar did nothing.
 */
export default function Messages() {
  const { user, school, schoolId, role } = useUser();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [tab, setTab] = useState('messages');

  const { data: myClasses = [] } = useQuery({
    queryKey: ['my-classes-messages', schoolId, user?.id, role],
    queryFn: async () => {
      const all = await classesData.where({ school_id: schoolId, status: 'active' });
      if (role === 'teacher' || role === 'ib_coordinator') return all.filter(c => c.teacher_ids?.includes(user.id));
      if (role === 'student') return all.filter(c => c.student_ids?.includes(user.id));
      if (role === 'parent') {
        const links = await parentStudentLinksData.where({ parent_id: user.id });
        const childIds = links.map(l => l.student_id);
        return all.filter(c => childIds.some(id => c.student_ids?.includes(id)));
      }
      return all;
    },
    enabled: !!schoolId && !!user?.id && !!role,
  });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['user-conversations', schoolId, user?.id],
    queryFn: async () => {
      const allMessages = await messagesData.where({
        school_id: schoolId,
        is_announcement: false,
      }, { order: 'updated_at', ascending: false });

      const mine = allMessages.filter(m =>
        m.sender_id === user.id || m.recipient_ids?.includes(user.id)
      );

      // Latest message per thread.
      const threads = {};
      mine.forEach(msg => {
        const key = msg.thread_id || msg.id;
        if (!threads[key] || new Date(msg.created_at) > new Date(threads[key].created_at)) {
          threads[key] = msg;
        }
      });

      return Object.values(threads).map(msg => {
        const otherUserId = msg.sender_id === user.id ? msg.recipient_ids?.[0] : msg.sender_id;
        return {
          id: msg.id,
          thread_id: msg.thread_id || msg.id,
          school_id: msg.school_id,
          sender_id: msg.sender_id,
          recipient_ids: msg.recipient_ids,
          participant_id: otherUserId,
          participant_name: msg.sender_id === user.id ? 'Recipient' : (msg.sender_name || 'Unknown'),
          participant_role: msg.sender_id === user.id ? '' : (msg.sender_role || ''),
          subject: msg.subject,
          updated_at: msg.updated_at || msg.created_at,
          unread_count: !msg.read_by?.includes(user.id) && msg.sender_id !== user.id ? 1 : 0,
        };
      }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    },
    enabled: !!schoolId && !!user?.id,
  });

  const classIds = myClasses.map(c => c.id);
  const isAdminOrCoord = role === 'school_admin' || role === 'ib_coordinator';
  const unread = conversations.reduce((n, c) => n + (c.unread_count || 0), 0);

  /* A parent has no business being sent to Users or Messaging rules. */
  const related = isAdminOrCoord || role === 'super_admin' || role === 'admin'
    ? [['SchoolAdminMessagingPolicy', 'Messaging rules'], ['SchoolAdminUsers', 'Users']]
    : [];

  return (
    <SchoolAdminPage
      title="Messages"
      eyebrow={unread > 0 ? `${unread} unread` : 'Conversations and announcements'}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      allowedRoles={['teacher', 'student', 'parent', 'school_admin', 'ib_coordinator', 'super_admin', 'admin']}
      sidebarLinks={getAppSidebarLinks(role)}
      sidebarRole={role}
      related={related}
      actions={
        <>
          <AnnouncementComposer userId={user?.id} userName={user?.full_name} userRole={role} schoolId={schoolId} />
          <NewMessageDialog userId={user?.id} userName={user?.full_name} userRole={role} schoolId={schoolId} />
        </>
      }
    >
      {tab === 'messages' && (
        <Group>
          <div style={{ display: 'flex', minHeight: '32rem' }}>
            <div
              style={{
                width: '18rem', flexShrink: 0, maxHeight: '38rem', overflowY: 'auto',
                borderRight: '1px solid var(--rule)',
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin scholr-accent" />
                </div>
              ) : conversations.length === 0 ? (
                <p style={{ padding: '1.25rem', fontSize: '.86rem', color: 'var(--muted)', margin: 0 }}>
                  No conversations yet. Start one with New message.
                </p>
              ) : (
                <ConversationList
                  conversations={conversations}
                  selectedId={selectedConversation?.thread_id}
                  onSelect={setSelectedConversation}
                />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <ConversationView
                conversation={selectedConversation}
                userId={user?.id}
                userName={user?.full_name}
                userRole={role}
              />
            </div>
          </div>
        </Group>
      )}

      {tab === 'announcements' && (
        <AnnouncementsFeed
          schoolId={schoolId}
          userId={user?.id}
          classIds={classIds}
          showAll={isAdminOrCoord}
        />
      )}
    </SchoolAdminPage>
  );
}
