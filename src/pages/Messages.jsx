import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import ConversationList from '@/components/messaging/ConversationList';
import ConversationView from '@/components/messaging/ConversationView';
import NewMessageDialog from '@/components/messaging/NewMessageDialog';
import AnnouncementComposer from '@/components/messaging/AnnouncementComposer';
import AnnouncementsFeed from '@/components/messaging/AnnouncementsFeed';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Loader2, Megaphone } from 'lucide-react';
import { getAppSidebarLinks } from '@/components/app/sidebarLinks';
import * as classesData from '@/data/classes';
import * as parentStudentLinksData from '@/data/parentStudentLinks';
import * as messagesData from '@/data/messages';

export default function Messages() {
  const { user, school, schoolId, role } = useUser();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [activeTab, setActiveTab] = useState('messages');

  // Load classes for announcement feed filtering
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

      // Only messages involving this user
      const mine = allMessages.filter(m =>
        m.sender_id === user.id || m.recipient_ids?.includes(user.id)
      );

      // Group by thread_id (or message id as fallback), take latest message per thread
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

  const sidebarLinks = getAppSidebarLinks(role);
  const classIds = myClasses.map(c => c.id);
  const isAdminOrCoord = role === 'school_admin' || role === 'ib_coordinator';

  return (
    <RoleGuard allowedRoles={['teacher', 'student', 'parent', 'school_admin', 'ib_coordinator', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar
          links={sidebarLinks}
          role={role}
          schoolName={school?.name}
          userName={user?.full_name}
          userId={user?.id}
          schoolId={schoolId}
        />

        <main className="md:ml-64">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">Communications</h1>
                <p className="text-sm text-slate-500 mt-0.5">Messages &amp; Announcements</p>
              </div>
              <div className="flex items-center gap-2">
                <AnnouncementComposer
                  userId={user?.id}
                  userName={user?.full_name}
                  userRole={role}
                  schoolId={schoolId}
                />
                <NewMessageDialog
                  userId={user?.id}
                  userName={user?.full_name}
                  userRole={role}
                  schoolId={schoolId}
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-[calc(100vh-73px)]">
            <div className="bg-white border-b border-slate-200 px-4 md:px-6">
              <TabsList className="bg-transparent border-0 h-auto p-0 gap-0">
                <TabsTrigger
                  value="messages"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium text-slate-600"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Messages
                </TabsTrigger>
                <TabsTrigger
                  value="announcements"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium text-slate-600"
                >
                  <Megaphone className="w-4 h-4 mr-2" />
                  Announcements
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Messages Tab */}
            <TabsContent value="messages" className="flex flex-1 mt-0 overflow-hidden">
              <div className="w-72 md:w-80 border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <ConversationList
                    conversations={conversations}
                    selectedId={selectedConversation?.thread_id}
                    onSelect={setSelectedConversation}
                  />
                )}
              </div>

              <ConversationView
                conversation={selectedConversation}
                userId={user?.id}
                userName={user?.full_name}
                userRole={role}
              />
            </TabsContent>

            {/* Announcements Tab */}
            <TabsContent value="announcements" className="flex-1 overflow-y-auto mt-0 p-4 md:p-6">
              <div className="max-w-3xl mx-auto">
                <AnnouncementsFeed
                  schoolId={schoolId}
                  userId={user?.id}
                  classIds={classIds}
                  showAll={isAdminOrCoord}
                />
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </RoleGuard>
  );
}