import React, { useState } from 'react';
import DemoShell from '@/components/demo-sandbox/DemoShell';
import DemoSectionCard from '@/components/demo-sandbox/DemoSectionCard';
import { PARENT, GRADES, UPCOMING_ASSIGNMENTS, ATTENDANCE, ANNOUNCEMENTS } from '@/components/demo-sandbox/mockSchoolData';
import { MessageSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const trendIcon = (t) => {
  if (t === 'up') return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (t === 'down') return <TrendingDown className="w-3.5 h-3.5 text-rose-500" />;
  return <Minus className="w-3.5 h-3.5 text-slate-400" />;
};

export default function DemoParent() {
  const [selectedChild, setSelectedChild] = useState(PARENT.children[0]);

  return (
    <DemoShell roleLabel="Parent" userName={PARENT.name} userInitials={PARENT.avatarInitials} accent="bg-amber-500">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {PARENT.name.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500 mt-1">Monitoring {PARENT.children.length} children</p>
      </div>

      <div className="flex gap-2 mb-6">
        {PARENT.children.map((child) => (
          <button
            key={child.id}
            onClick={() => setSelectedChild(child)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
              selectedChild.id === child.id
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            {child.name} <span className="opacity-60">· {child.grade}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DemoSectionCard title={`${selectedChild.name.split(' ')[0]}'s grades`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GRADES.map((g) => (
                <div key={g.subject} className="p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-800 truncate pr-2">{g.subject}</p>
                    {trendIcon(g.trend)}
                  </div>
                  <div className="flex items-baseline gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Current</p>
                      <p className="text-2xl font-bold text-slate-900">{g.current}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Predicted</p>
                      <p className="text-2xl font-bold text-amber-600">{g.predicted}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DemoSectionCard>

          <DemoSectionCard title="Upcoming assignments">
            <div className="space-y-3">
              {UPCOMING_ASSIGNMENTS.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.subject}</p>
                  </div>
                  <span className="text-xs text-slate-500">Due {a.dueIn.toLowerCase()}</span>
                </div>
              ))}
            </div>
          </DemoSectionCard>
        </div>

        <div className="space-y-6">
          <DemoSectionCard title="Attendance">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-emerald-50">
                <p className="text-2xl font-bold text-emerald-600">{ATTENDANCE.present}%</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 mt-1">Present</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50">
                <p className="text-2xl font-bold text-amber-600">{ATTENDANCE.late}%</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 mt-1">Late</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50">
                <p className="text-2xl font-bold text-rose-600">{ATTENDANCE.absent}%</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-700 mt-1">Absent</p>
              </div>
            </div>
          </DemoSectionCard>

          <DemoSectionCard title="Messages" action={<MessageSquare className="w-4 h-4 text-slate-400" />}>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-sm font-medium text-slate-900">Dr. Chen — Biology HL</p>
                <p className="text-xs text-slate-600 mt-1">Great progress on the enzyme kinetics lab. Amélie's analysis was thorough.</p>
                <p className="text-[10px] text-slate-400 mt-2">2 hours ago</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-sm font-medium text-slate-900">Mr. Harrow — Advisor</p>
                <p className="text-xs text-slate-600 mt-1">Reminder: parent conferences are open for booking until Friday.</p>
                <p className="text-[10px] text-slate-400 mt-2">Yesterday</p>
              </div>
            </div>
          </DemoSectionCard>

          <DemoSectionCard title="School notices">
            <div className="space-y-3">
              {ANNOUNCEMENTS.map((n) => (
                <div key={n.id}>
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.from} · {n.when}</p>
                </div>
              ))}
            </div>
          </DemoSectionCard>
        </div>
      </div>
    </DemoShell>
  );
}