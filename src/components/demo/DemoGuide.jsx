import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, BarChart3, Settings, Shield } from 'lucide-react';

export default function DemoGuide() {
  const guides = [
    {
      role: 'Student',
      icon: BookOpen,
      color: 'blue',
      tasks: [
        'View assignments and submit work',
        'Check grades and feedback from teachers',
        'Track attendance and behavior records',
        'Monitor CAS experience progress',
        'View predicted grades',
      ],
      key: 'emma.brown@riverside.edu',
    },
    {
      role: 'Teacher',
      icon: Users,
      color: 'emerald',
      tasks: [
        'Create and manage assignments',
        'Review and grade student submissions',
        'View class roster and student progress',
        'Record attendance and behavior',
        'Enter predicted grades',
      ],
      key: 'carol.white@riverside.edu',
    },
    {
      role: 'Parent',
      icon: BarChart3,
      color: 'purple',
      tasks: [
        'Monitor child\'s academic progress',
        'View grades and assignment feedback',
        'Check attendance and behavior records',
        'Review CAS and IB Core progress',
        'Communicate with teachers',
      ],
      key: 'henry.wilson@riverside.edu',
    },
    {
      role: 'IB Coordinator',
      icon: Settings,
      color: 'amber',
      tasks: [
        'Oversee CAS, EE, and TOK workflows',
        'Manage student milestones and submissions',
        'Review predicted grades across school',
        'Track IB Core compliance',
        'Generate IB progress reports',
      ],
      key: 'bob.smith@riverside.edu',
    },
    {
      role: 'School Admin',
      icon: Shield,
      color: 'red',
      tasks: [
        'Manage school settings and configuration',
        'Invite and manage users',
        'Set up classes, timetables, and subjects',
        'Configure academic years and terms',
        'View school analytics and health',
      ],
      key: 'alice.johnson@riverside.edu',
    },
  ];

  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  return (
    <div className="space-y-6">
      {guides.map((guide) => {
        const Icon = guide.icon;
        return (
          <Card key={guide.role} className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${colorMap[guide.color]}`} />
                  <div>
                    <CardTitle className="text-white">{guide.role}</CardTitle>
                    <CardDescription className="text-slate-400 font-mono text-xs mt-1">
                      {guide.key}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {guide.tasks.map((task, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${colorMap[guide.color]}`} />
                    <p className="text-slate-300">{task}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}