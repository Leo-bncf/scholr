import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

export default function AssignmentCompletionChart({ data }) {
  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 bg-slate-50 rounded-t-md">
        <h2 className="font-bold text-sm md:text-base text-slate-900 uppercase tracking-wide">Assignment Completion Rates</h2>
        <p className="text-xs text-slate-500 mt-1">Based on submitted assignments by class</p>
      </div>
      {data.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">No assignment data available yet</div>
      ) : (
        <div className="p-4 md:p-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`${value}%`, 'Completion']} />
                <Bar dataKey="completionRate" fill="#065f46" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}