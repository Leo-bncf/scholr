import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, BookMarked, Lock, Search } from 'lucide-react';
import * as rubricTemplatesData from '@/data/rubricTemplates';

const subjectLabels = {
  group1_language_literature: 'Language & Literature',
  group2_language_acquisition: 'Language Acquisition',
  group3_individuals_societies: 'Individuals & Societies',
  group4_sciences: 'Sciences',
  group5_mathematics: 'Mathematics',
  group6_arts: 'Arts',
  core_tok: 'TOK',
  core_ee: 'Extended Essay',
  core_cas: 'CAS',
  general: 'General',
};

function RubricDetailDialog({ rubric, open, onClose }) {
  if (!rubric) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {rubric.name}
            {rubric.is_protected && <Lock className="w-4 h-4 text-amber-500" />}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{subjectLabels[rubric.subject_group] || rubric.subject_group}</Badge>
            <Badge variant="outline">{rubric.level}</Badge>
            {rubric.is_protected && (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 border">Protected Template</Badge>
            )}
          </div>

          {rubric.description && (
            <p className="text-sm text-slate-600">{rubric.description}</p>
          )}

          <div>
            <h3 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wide">Criteria</h3>
            <div className="space-y-3">
              {(rubric.criteria || []).map(criterion => (
                <div key={criterion.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{criterion.name}</p>
                      {criterion.description && (
                        <p className="text-sm text-slate-600 mt-1">{criterion.description}</p>
                      )}
                    </div>
                    <Badge className="bg-indigo-50 text-indigo-700 border-0 ml-3 flex-shrink-0">
                      Max: {criterion.max_score}
                    </Badge>
                  </div>
                  {criterion.strand_descriptors?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {criterion.strand_descriptors.map((d, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <span className="w-8 text-center font-semibold text-indigo-600 flex-shrink-0">{d.score}</span>
                          <span className="text-slate-600">{d.descriptor}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {rubric.total_max_score && (
            <div className="pt-3 border-t text-sm text-slate-700">
              Total Max Score: <span className="font-bold text-slate-900">{rubric.total_max_score}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RubricCard({ rubric, onView }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 truncate">{rubric.name}</h3>
            {rubric.is_protected && <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" title="Protected — read only" />}
          </div>
          {rubric.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{rubric.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="text-xs">{subjectLabels[rubric.subject_group] || rubric.subject_group}</Badge>
            <Badge variant="outline" className="text-xs">{rubric.level}</Badge>
            <Badge variant="secondary" className="text-xs">{rubric.criteria?.length || 0} criteria</Badge>
            {rubric.total_max_score && (
              <Badge className="bg-indigo-50 text-indigo-700 border-0 text-xs">{rubric.total_max_score} pts max</Badge>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Button variant="outline" size="sm" className="w-full" onClick={() => onView(rubric)}>
          View Rubric
        </Button>
      </div>
    </div>
  );
}

export default function ClassRubrics({ classData }) {
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [selectedRubric, setSelectedRubric] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: rubrics = [], isLoading } = useQuery({
    queryKey: ['rubric-templates', classData.school_id],
    queryFn: () => rubricTemplatesData.where({ school_id: classData.school_id, status: 'active' }),
  });

  const filtered = rubrics.filter(r => {
    const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = filterGroup === 'all' || r.subject_group === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const groups = [...new Set(rubrics.map(r => r.subject_group).filter(Boolean))];

  const handleView = (rubric) => { setSelectedRubric(rubric); setDetailOpen(true); };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Rubric & Criteria Templates</h2>
        <p className="text-sm text-slate-500 mt-0.5">School-approved IB rubrics available to use in assignments and grade items</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search rubrics..." className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterGroup('all')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filterGroup === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            All
          </button>
          {groups.map(g => (
            <button key={g} onClick={() => setFilterGroup(g)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${filterGroup === g ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {subjectLabels[g] || g}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BookMarked className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-600">{rubrics.length === 0 ? 'No rubric templates yet' : 'No rubrics match your search'}</p>
          <p className="text-sm mt-1">{rubrics.length === 0 ? 'Ask your school admin to add rubric templates in the gradebook governance settings' : 'Try a different search term'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(rubric => (
            <RubricCard key={rubric.id} rubric={rubric} onView={handleView} />
          ))}
        </div>
      )}

      <RubricDetailDialog rubric={selectedRubric} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}