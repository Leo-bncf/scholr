import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Moon, Bell, Clock } from 'lucide-react';

const ALL_ROLES = ['student', 'parent', 'teacher', 'ib_coordinator', 'school_admin'];
const ROLE_LABELS = {
  student: 'Student', parent: 'Parent', teacher: 'Teacher',
  ib_coordinator: 'IB Coordinator', school_admin: 'School Admin',
};

const NOTIF_OPTIONS = [
  { value: 'immediate', label: 'Immediate', desc: 'Notify as soon as the event occurs' },
  { value: 'digest_daily', label: 'Daily Digest', desc: 'Bundle into a single daily notification' },
  { value: 'digest_weekly', label: 'Weekly Digest', desc: 'Bundle into a weekly summary (messages only)' },
  { value: 'off', label: 'Off', desc: 'No notifications sent' },
];

const NOTIF_ANNOUNCE_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'digest_daily', label: 'Daily Digest' },
  { value: 'off', label: 'Off' },
];

export default function QuietHoursPanel({ form, onChange }) {
  const qh = form.quiet_hours || {};
  const nd = form.notification_defaults || {};

  const setQh = (key, val) => onChange({ quiet_hours: { ...qh, [key]: val } });
  const setNd = (key, val) => onChange({ notification_defaults: { ...nd, [key]: val } });

  const toggleRole = (role, include) => {
    const current = qh.applies_to_roles || [];
    const updated = include ? [...new Set([...current, role])] : current.filter(r => r !== role);
    setQh('applies_to_roles', updated);
  };

  return (
    <div className="space-y-6">
      {/* Quiet Hours */}
      <div className="app-group space-y-5" style={{ padding: '1rem 1.1rem' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 scholr-accent" />
            <div>
              <h4 className="font-bold scholr-ink text-sm">Quiet Hours</h4>
              <p className="text-xs scholr-muted mt-0.5">
                Set recommended communication windows. Outside these hours, sending is either blocked or shows a respectful warning to the sender.
              </p>
            </div>
          </div>
          <Switch checked={qh.enabled ?? false} onCheckedChange={v => setQh('enabled', v)} />
        </div>

        {qh.enabled && (
          <div className="space-y-5 pt-3 border-t scholr-rule-soft">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold scholr-muted block mb-1.5">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />Quiet starts at
                </label>
                <input
                  type="time"
                  value={qh.start_time || '18:00'}
                  onChange={e => setQh('start_time', e.target.value)}
                  className="w-full px-3 py-2 border scholr-rule rounded-lg text-sm"
                />
                <p className="text-xs scholr-faint mt-1">School timezone</p>
              </div>
              <div>
                <label className="text-xs font-semibold scholr-muted block mb-1.5">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />Quiet ends at
                </label>
                <input
                  type="time"
                  value={qh.end_time || '08:00'}
                  onChange={e => setQh('end_time', e.target.value)}
                  className="w-full px-3 py-2 border scholr-rule rounded-lg text-sm"
                />
                <p className="text-xs scholr-faint mt-1">Overnight windows are supported</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold scholr-muted mb-2">Apply quiet hours to these roles</p>
              <div className="flex flex-wrap gap-3">
                {ALL_ROLES.map(role => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(qh.applies_to_roles || []).includes(role)}
                      onChange={e => toggleRole(role, e.target.checked)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <span className="text-sm scholr-body">{ROLE_LABELS[role]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t scholr-rule-soft">
              <Switch checked={qh.block_send_during_quiet ?? false} onCheckedChange={v => setQh('block_send_during_quiet', v)} />
              <div>
                <p className="text-sm font-semibold scholr-ink">Block sending during quiet hours</p>
                <p className="text-xs scholr-muted mt-0.5">
                  If <span className="font-semibold">on</span>: messages cannot be sent during quiet hours. 
                  If <span className="font-semibold">off</span>: a polite banner is shown but sending is still allowed.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Switch checked={qh.weekend_quiet_hours_enabled ?? false} onCheckedChange={v => setQh('weekend_quiet_hours_enabled', v)} />
              <div>
                <p className="text-sm font-semibold scholr-ink">Apply quiet hours on weekends</p>
                <p className="text-xs scholr-muted mt-0.5">Extends the quiet-hours window to Saturday and Sunday.</p>
              </div>
            </div>
          </div>
        )}

        {!qh.enabled && (
          <div className="scholr-sunk border scholr-rule rounded-lg p-3 text-xs scholr-muted italic">
            Quiet hours are currently disabled. All messages can be sent at any time with no warnings.
          </div>
        )}
      </div>

      {/* Notification Defaults */}
      <div className="app-group space-y-5" style={{ padding: '1rem 1.1rem' }}>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <div>
            <h4 className="font-bold scholr-ink text-sm">Default Notification Preferences</h4>
            <p className="text-xs scholr-muted mt-0.5">School-wide defaults for how users are notified. Users can override these if permitted.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-semibold scholr-muted block mb-2">Direct message notifications</label>
            <div className="space-y-2">
              {NOTIF_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="msg_notif"
                    value={opt.value}
                    checked={(nd.default_message_notifications || 'immediate') === opt.value}
                    onChange={() => setNd('default_message_notifications', opt.value)}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-medium scholr-ink">{opt.label}</p>
                    <p className="text-xs scholr-muted">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold scholr-muted block mb-2">Announcement notifications</label>
            <div className="space-y-2">
              {NOTIF_ANNOUNCE_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="ann_notif"
                    value={opt.value}
                    checked={(nd.default_announcement_notifications || 'immediate') === opt.value}
                    onChange={() => setNd('default_announcement_notifications', opt.value)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm scholr-body">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-3 border-t scholr-rule-soft">
          <Switch checked={nd.allow_user_notification_override ?? true} onCheckedChange={v => setNd('allow_user_notification_override', v)} />
          <div>
            <p className="text-sm font-semibold scholr-ink">Allow users to override their notification preferences</p>
            <p className="text-xs scholr-muted mt-0.5">If off, school defaults cannot be changed by individual users. Useful for ensuring compliance with communication commitments.</p>
          </div>
        </div>
      </div>
    </div>
  );
}