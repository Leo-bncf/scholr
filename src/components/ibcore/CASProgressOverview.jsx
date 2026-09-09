import React from 'react';
import { Palette, Heart, Users, CheckCircle2 } from 'lucide-react';

export default function CASProgressOverview({ experiences }) {
  const creativity = experiences.filter(e => e.cas_strands?.includes('creativity'));
  const activity = experiences.filter(e => e.cas_strands?.includes('activity'));
  const service = experiences.filter(e => e.cas_strands?.includes('service'));
  const approved = experiences.filter(e => e.status === 'approved');

  const totalHours = experiences.reduce((sum, e) => sum + (e.hours || 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-purple-900">Creativity</h3>
        </div>
        <p className="text-2xl font-bold text-purple-700">{creativity.length}</p>
        <p className="text-xs text-purple-600 mt-1">experiences</p>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-emerald-900">Activity</h3>
        </div>
        <p className="text-2xl font-bold text-emerald-700">{activity.length}</p>
        <p className="text-xs text-emerald-600 mt-1">experiences</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Service</h3>
        </div>
        <p className="text-2xl font-bold text-blue-700">{service.length}</p>
        <p className="text-xs text-blue-600 mt-1">experiences</p>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-indigo-900">Approved</h3>
        </div>
        <p className="text-2xl font-bold text-indigo-700">{approved.length}</p>
        <p className="text-xs text-indigo-600 mt-1">of {experiences.length} total</p>
      </div>
    </div>
  );
}