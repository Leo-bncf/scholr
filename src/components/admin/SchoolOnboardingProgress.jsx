import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle } from 'lucide-react';
import * as academics from '@/data/academics';
import * as classesData from '@/data/classes';

function ProgressView({ progress, items }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">Setup Progress</span>
        <span className="text-xs text-slate-600">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="grid grid-cols-2 gap-2 text-xs mt-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1">
            {item.completed ? (
              <CheckCircle className="w-3 h-3 text-emerald-600 flex-shrink-0" />
            ) : (
              <Circle className="w-3 h-3 text-slate-300 flex-shrink-0" />
            )}
            <span className={item.completed ? 'text-slate-600' : 'text-slate-500'}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SchoolOnboardingProgress({ schoolId, summary }) {
  const [progress, setProgress] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (summary) {
      setProgress(summary.progress || 0);
      setItems(summary.items || []);
      setLoading(false);
      return;
    }

    const loadProgress = async () => {
      try {
        const [academicYears, terms, subjects, classes] = await Promise.all([
          academics.whereAcademicYears({ school_id: schoolId }),
          academics.whereTerms({ school_id: schoolId }),
          academics.whereSubjects({ school_id: schoolId }),
          classesData.where({ school_id: schoolId }),
        ]);

        const setupItems = [
          { label: 'School Profile', completed: true },
          { label: 'Academic Years', completed: academicYears.length > 0 },
          { label: 'Terms', completed: terms.length > 0 },
          { label: 'Subjects', completed: subjects.length > 0 },
          { label: 'Classes', completed: classes.length > 0 },
        ];

        const completedCount = setupItems.filter((item) => item.completed).length;
        setProgress((completedCount / setupItems.length) * 100);
        setItems(setupItems);
      } catch (error) {
        console.error('Error loading onboarding progress:', error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    loadProgress();
  }, [schoolId, summary]);

  if (loading) {
    return <div className="text-xs text-slate-500">Loading...</div>;
  }

  return <ProgressView progress={progress} items={items} />;
}