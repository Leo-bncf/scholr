import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import ConversationList from '@/components/messaging/ConversationList';
import ConversationView from '@/components/messaging/ConversationView';
import NewMessageDialog from '@/components/messaging/NewMessageDialog';
import StudentAnnouncements from '@/components/student/StudentAnnouncements';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Megaphone, Loader2
} from 'lucide-react';
import { getStudentSidebarLinks } from '@/components/app/studentSidebarLinks';
import * as classesData from '@/data/classes';
import * as messagesData from '@/data/messages';

export default function StudentCommunication() {
  const { user, school, schoolId, membership, curriculum } = useUser();
  const studentLinks = getStudentSidebarLinks(curriculum);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const { data: classes = [] } = useQuery({
    queryKey: ['student-classes', schoolId, user?.id],
    queryFn: async () => {
      const all = await classesData.where({ school_id: schoolId, status: 'active' });
      return all.filter(c => c.student_ids?.includes(user.id));
    },
    enabled: !!schoolId && !!user?.id,
  });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['student-conversations', schoolId, user?.id],
    queryFn: async () => {
      const allMessages = await messagesData.where({
        school_id: schoolId,
        is_announcement: false,
      }, { order: 'updated_at', ascending: false });

      const userMessages = allMessages.filter(m =>
        m.sender_id === user.id || m.recipient_ids?.includes(user.id)
      );

      const convoMap = {};
      userMessages.forEach(msg => {
        const otherUserId = msg.sender_id === user.id
          ? msg.recipient_ids?.[0]
          : msg.sender_id;
        if (!convoMap[otherUserId]) {
          convoMap[otherUserId] = {
            id: msg.id,
            school_id: msg.school_id,
            participant_id: otherUserId,
            participant_name: msg.sender_id === user.id ? 'Recipient' : msg.sender_name,
            participant_role: msg.sender_id === user.id ? '' : msg.sender_role,
            subject: msg.subject,
            updated_at: msg.updated_at || msg.created_at,
            recipient_ids: msg.recipient_ids,
            unread_count: !msg.read_by?.includes(user.id) ? 1 : 0,
          };
        }
      });

      return Object.values(convoMap);
    },
    enabled: !!schoolId && !!user?.id,
  });

  const { data: announcementCount = 0 } = useQuery({
    queryKey: ['student-announcement-count', schoolId, user?.id],
    queryFn: async () => {
      const classIds = new Set(classes.map(c => c.id));
      const all = await messagesData.where({ school_id: schoolId, is_announcement: true });
      return all.filter(m => m.is_school_wide || classIds.has(m.class_id)).length;
    },
    enabled: !!schoolId && classes.length > 0,
  });

  const unreadCount = conversations.filter(c => c.unread_count > 0).length;

  return (
    <RoleGuard allowedRoles={['student', 'school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={studentLinks} role="student" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="ml-0 md:ml-64 p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-5">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">Communication</h1>
              <p className="text-sm text-slate-500 mt-1">Messages and school announcements</p>
            </div>

            <Tabs defaultValue="messages">
              <TabsList className="mb-5">
                <TabsTrigger value="messages" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Messages
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white border-0 text-xs px-1.5 py-0 ml-1">{unreadCount}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="announcements" className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4" />
                  Announcements
                  {announcementCount > 0 && (
                    <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs px-1.5 py-0 ml-1">{announcementCount}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Messages tab */}
              <TabsContent value="messages">
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="font-semibold text-sm text-slate-700">Conversations</p>
                    <NewMessageDialog
                      userId={user?.id}
                      userName={user?.full_name}
                      userRole={membership?.role || 'student'}
                      schoolId={schoolId}
                    />
                  </div>
                  <div className="flex" style={{ height: '60vh' }}>
                    {/* Conversation list */}
                    <div className="w-72 border-r border-slate-100 overflow-y-auto">
                      {isLoading ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        </div>
                      ) : (
                        <ConversationList
                          conversations={conversations}
                          selectedId={selectedConversation?.id}
                          onSelect={setSelectedConversation}
                        />
                      )}
                    </div>
                    {/* Conversation view */}
                    <div className="flex-1 overflow-hidden">
                      <ConversationView
                        conversation={selectedConversation}
                        userId={user?.id}
                        userName={user?.full_name}
                        userRole={membership?.role || 'student'}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Announcements tab */}
              <TabsContent value="announcements">
                <StudentAnnouncements schoolId={schoolId} userId={user?.id} classIds={classes.map(c => c.id)} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}