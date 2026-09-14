import React from 'react';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, Users, GraduationCap, UserCheck, Shield } from 'lucide-react';

const RULE_GROUPS = [
  {
    label: 'Student Communication',
    icon: GraduationCap,
    color: 'blue',
    rules: [
      { key: 'student_to_teacher', label: 'Student → Teacher', desc: 'Students can initiate direct messages to their teachers' },
      { key: 'student_to_student', label: 'Student → Student', desc: 'Students can message other students (peer messaging)', sensitive: true },
    ],
  },
  {
    label: 'Teacher Communication',
    icon: Users,
    color: 'indigo',
    rules: [
      { key: 'teacher_to_student', label: 'Teacher → Student', desc: 'Teachers can send direct messages to their enrolled students' },
      { key: 'teacher_to_parent', label: 'Teacher → Parent', desc: 'Teachers can message parents of their students' },
      { key: 'teacher_to_teacher', label: 'Teacher → Teacher', desc: 'Teachers can message colleagues directly' },
    ],
  },
  {
    label: 'Parent Communication',
    icon: UserCheck,
    color: 'emerald',
    rules: [
      { key: 'parent_to_teacher', label: 'Parent → Teacher', desc: 'Parents can contact their child\'s teachers directly' },
      { key: 'parent_to_admin', label: 'Parent → Admin / Coordinator', desc: 'Parents can message school administration or IB coordinator' },
    ],
  },
  {
    label: 'Admin & Coordinator',
    icon: Shield,
    color: 'violet',
    rules: [
      { key: 'admin_to_all', label: 'Admin → Anyone', desc: 'School admins can message any school member' },
      { key: 'coordinator_to_all', label: 'IB Coordinator → Anyone', desc: 'IB coordinators can message any school member' },
    ],
  },
];

const ACCENT = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: 'text-blue-600',   title: 'text-blue-900' },
  indigo:  { bg: 'scholr-accent-sf',  border: 'scholr-accent-rule',  icon: 'scholr-accent', title: 'scholr-accent' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600',title: 'text-emerald-900' },
  violet:  { bg: 'scholr-accent-sf',  border: 'scholr-accent-rule',  icon: 'scholr-accent', title: 'scholr-accent' },
};

export default function PermissionRulesPanel({ form, onChange }) {
  const pr = form.permission_rules || {};

  const set = (key, val) => onChange({ permission_rules: { ...pr, [key]: val } });

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-900">Messaging Permission Rules</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Control who can initiate direct messages with whom. These rules are enforced at message composition time.
            Admins and super-admins always retain full messaging access regardless of these settings.
          </p>
        </div>
      </div>

      {RULE_GROUPS.map(group => {
        const a = ACCENT[group.color];
        const GroupIcon = group.icon;
        return (
          <div key={group.label} className={`rounded-xl border ${a.border} ${a.bg} overflow-hidden`}>
            <div className={`px-5 py-3 flex items-center gap-2 border-b ${a.border}`}>
              <GroupIcon className={`w-4 h-4 ${a.icon}`} />
              <h4 className={`text-sm font-bold ${a.title}`}>{group.label}</h4>
            </div>
            <div className="divide-y divide-white/60">
              {group.rules.map(rule => (
                <div key={rule.key} className="flex items-center justify-between px-5 py-3.5 gap-4 bg-white/60">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold scholr-ink">{rule.label}</p>
                      {rule.sensitive && (
                        <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded font-medium">Review carefully</span>
                      )}
                    </div>
                    <p className="text-xs scholr-muted mt-0.5">{rule.desc}</p>
                  </div>
                  <Switch
                    checked={pr[rule.key] ?? true}
                    onCheckedChange={v => set(rule.key, v)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}