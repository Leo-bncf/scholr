import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Megaphone, Monitor, Clock } from 'lucide-react';

const ALL_ROLES = ['school_admin', 'ib_coordinator', 'teacher', 'student', 'parent'];
const ROLE_LABELS = {
  school_admin: 'School Admin',
  ib_coordinator: 'IB Coordinator',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
};

function RoleCheckbox({ role, checked, onChange, disabled }) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 accent-indigo-600"
      />
      <span className="text-sm text-slate-700">{ROLE_LABELS[role]}</span>
    </label>
  );
}

export default function AnnouncementsGovernancePanel({ form, onChange }) {
  const br = form.broadcast_rules || {};
  const ag = form.announcement_governance || {};

  const setBr = (key, val) => onChange({ broadcast_rules: { ...br, [key]: val } });
  const setAg = (key, val) => onChange({ announcement_governance: { ...ag, [key]: val } });

  const toggleRoleInList = (listKey, role, include) => {
    const current = br[listKey] || [];
    const updated = include ? [...new Set([...current, role])] : current.filter(r => r !== role);
    setBr(listKey, updated);
  };

  return (
    <div className="space-y-6">
      {/* Who can broadcast */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Megaphone className="w-5 h-5 text-indigo-600" />
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Broadcast Permissions</h4>
            <p className="text-xs text-slate-500 mt-0.5">Define which roles can send announcements and to whom.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-700 uppercase mb-3">School-wide Announcements</p>
            <p className="text-xs text-slate-500 mb-3">Roles that can broadcast to the entire school community.</p>
            <div className="space-y-2">
              {ALL_ROLES.filter(r => !['student','parent'].includes(r)).map(role => (
                <RoleCheckbox
                  key={role}
                  role={role}
                  checked={(br.roles_allowed_school_wide || []).includes(role)}
                  onChange={v => toggleRoleInList('roles_allowed_school_wide', role, v)}
                  disabled={role === 'school_admin'}
                />
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-700 uppercase mb-3">Class Announcements</p>
            <p className="text-xs text-slate-500 mb-3">Roles that can post announcements scoped to a single class.</p>
            <div className="space-y-2">
              {ALL_ROLES.filter(r => !['student','parent'].includes(r)).map(role => (
                <RoleCheckbox
                  key={role}
                  role={role}
                  checked={(br.roles_allowed_class_announcements || []).includes(role)}
                  onChange={v => toggleRoleInList('roles_allowed_class_announcements', role, v)}
                  disabled={role === 'school_admin'}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
          <Switch
            checked={br.require_admin_approval_for_broadcast ?? false}
            onCheckedChange={v => setBr('require_admin_approval_for_broadcast', v)}
          />
          <div>
            <p className="text-sm font-semibold text-slate-800">Require admin approval for broadcasts</p>
            <p className="text-xs text-slate-500 mt-0.5">Non-admin broadcasts (e.g. from teachers) require school admin sign-off before being sent. Currently tracked as a policy flag — approval workflow shown at broadcast time.</p>
          </div>
        </div>
      </div>

      {/* Dashboard visibility */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Monitor className="w-5 h-5 text-emerald-600" />
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Dashboard Announcement Visibility</h4>
            <p className="text-xs text-slate-500 mt-0.5">Control which role dashboards surface announcements in their notification feeds.</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'show_in_student_dashboard', label: 'Show announcements in Student Dashboard', desc: 'Students see school & class announcements on their home screen' },
            { key: 'show_in_parent_dashboard', label: 'Show announcements in Parent Dashboard', desc: 'Parents receive school-wide and relevant class announcements' },
            { key: 'show_in_teacher_dashboard', label: 'Show announcements in Teacher Dashboard', desc: 'Teachers see all school-wide announcements from admin and coordinator' },
          ].map(item => (
            <div key={item.key} className="flex items-start gap-3">
              <Switch checked={ag[item.key] ?? true} onCheckedChange={v => setAg(item.key, v)} />
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Retention & pin duration */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5 text-amber-600" />
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Retention & Display</h4>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Announcement retention (days)</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={3650}
                value={ag.announcement_retention_days ?? 90}
                onChange={e => setAg('announcement_retention_days', Number(e.target.value))}
                className="w-28 h-9"
              />
              <span className="text-xs text-slate-500">days before archived</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Pinned announcement duration (days)</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={365}
                value={ag.pin_duration_days ?? 7}
                onChange={e => setAg('pin_duration_days', Number(e.target.value))}
                className="w-28 h-9"
              />
              <span className="text-xs text-slate-500">days at top of feed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}