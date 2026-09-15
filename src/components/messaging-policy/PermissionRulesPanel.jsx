import { Group, Row } from '@/components/app/AppShell';
import Notice from '@/components/app/Notice';
import StatusChip from '@/components/app/StatusChip';
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Users, GraduationCap, UserCheck, Shield } from 'lucide-react';

const RULE_GROUPS = [
  {
    label: 'Student Communication',
    icon: GraduationCap,
    rules: [
      { key: 'student_to_teacher', label: 'Student → Teacher', desc: 'Students can initiate direct messages to their teachers' },
      { key: 'student_to_student', label: 'Student → Student', desc: 'Students can message other students (peer messaging)', sensitive: true },
    ],
  },
  {
    label: 'Teacher Communication',
    icon: Users,
    rules: [
      { key: 'teacher_to_student', label: 'Teacher → Student', desc: 'Teachers can send direct messages to their enrolled students' },
      { key: 'teacher_to_parent', label: 'Teacher → Parent', desc: 'Teachers can message parents of their students' },
      { key: 'teacher_to_teacher', label: 'Teacher → Teacher', desc: 'Teachers can message colleagues directly' },
    ],
  },
  {
    label: 'Parent Communication',
    icon: UserCheck,
    rules: [
      { key: 'parent_to_teacher', label: 'Parent → Teacher', desc: 'Parents can contact their child\'s teachers directly' },
      { key: 'parent_to_admin', label: 'Parent → Admin / Coordinator', desc: 'Parents can message school administration or IB coordinator' },
    ],
  },
  {
    label: 'Admin & Coordinator',
    icon: Shield,
    rules: [
      { key: 'admin_to_all', label: 'Admin → Anyone', desc: 'School admins can message any school member' },
      { key: 'coordinator_to_all', label: 'IB Coordinator → Anyone', desc: 'IB coordinators can message any school member' },
    ],
  },
];


export default function PermissionRulesPanel({ form, onChange }) {
  const pr = form.permission_rules || {};

  const set = (key, val) => onChange({ permission_rules: { ...pr, [key]: val } });

  return (
    <div className="space-y-5">
      <Notice title="Who may start a conversation with whom">
        These rules are checked when someone composes a message, so a blocked pairing simply cannot be
        picked. Admins always keep full access, whatever is set here.
      </Notice>

      {/* Four groups, each in its own tint with a white-60% inner surface —
          so a page of ordinary switches read as four coloured zones and the
          one rule marked "review carefully" was the hardest thing to see. */}
      {RULE_GROUPS.map(group => (
        <Group key={group.label} title={group.label}>
          {group.rules.map(rule => (
            <Row key={rule.key} label={rule.label} detail={rule.desc}>
              {rule.sensitive && <StatusChip tone="warn">Think twice</StatusChip>}
              <Switch
                checked={pr[rule.key] ?? true}
                onCheckedChange={v => set(rule.key, v)}
                aria-label={rule.label}
              />
            </Row>
          ))}
        </Group>
      ))}
    </div>
  );
}