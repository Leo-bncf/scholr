import React, { useEffect, useState } from 'react';
import { Moon, Sun, Save, Settings } from 'lucide-react';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { getAppSidebarLinks } from '@/components/app/sidebarLinks';
import { getStudentSidebarLinks } from '@/components/app/studentSidebarLinks';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function PersonalSettings() {
  const { user, school, schoolId, role, reload, curriculum } = useUser();
  const [displayName, setDisplayName] = useState('');
  const [emailAssignments, setEmailAssignments] = useState(true);
  const [emailMessages, setEmailMessages] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(user?.full_name || '');
    setEmailAssignments(user?.data?.email_preferences?.assignments ?? true);
    setEmailMessages(user?.data?.email_preferences?.messages ?? true);
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const sidebarLinks = role === 'student' ? getStudentSidebarLinks(curriculum) : getAppSidebarLinks(role);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      display_name: displayName,
      email_preferences: {
        assignments: emailAssignments,
        messages: emailMessages,
      },
    });
    await reload();
    setSaving(false);
  };

  return (
    <RoleGuard allowedRoles={['teacher', 'student', 'school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <AppSidebar links={sidebarLinks} role={role} schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="ml-0 md:ml-64 p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Personal Settings</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update your display name, email preferences, and theme.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
              <div className="space-y-2">
                <Label>Display name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name" />
              </div>

              <div className="space-y-3">
                <Label>Email preferences</Label>
                <div className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Assignment reminders</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Receive reminder emails for upcoming due work</p>
                  </div>
                  <Switch checked={emailAssignments} onCheckedChange={setEmailAssignments} />
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Message emails</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Receive email alerts for new messages</p>
                  </div>
                  <Switch checked={emailMessages} onCheckedChange={setEmailMessages} />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Appearance</Label>
                <div className="flex gap-3">
                  <Button type="button" variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>
                    <Sun className="w-4 h-4" /> Light
                  </Button>
                  <Button type="button" variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>
                    <Moon className="w-4 h-4" /> Dark
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4" /> Save settings
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}