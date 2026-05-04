import React, { useMemo, useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import DocumentCard from '@/components/assignment/DocumentCard';

function buildCriteria(submissionRow) {
  if (submissionRow?.gradeItem?.rubric_criteria?.length) {
    return submissionRow.gradeItem.rubric_criteria.map((criterion) => ({
      criterion_id: criterion.id,
      name: criterion.name,
      description: criterion.description,
      max_score: criterion.max_score || 0,
      score: 0,
      feedback: '',
    }));
  }

  const fallbackMax = submissionRow?.assignment?.max_score || 10;
  return [{
    criterion_id: 'overall',
    name: 'Overall',
    description: 'General assessment',
    max_score: fallbackMax,
    score: 0,
    feedback: '',
  }];
}

export default function WorkspaceGradingPanel({ row, open, onClose, onSaveDraft, onPublishGrade }) {
  const [criteria, setCriteria] = useState([]);
  const [overallFeedback, setOverallFeedback] = useState('');

  useEffect(() => {
    if (row) {
      setCriteria(buildCriteria(row));
      setOverallFeedback(row.submission?.feedback || '');
    }
  }, [row]);

  const totalScore = useMemo(() => criteria.reduce((sum, item) => sum + (Number(item.score) || 0), 0), [criteria]);

  const updateCriterion = (criterionId, field, value) => {
    setCriteria((current) => current.map((item) => (
      item.criterion_id === criterionId ? { ...item, [field]: value } : item
    )));
  };

  const payload = {
    criteria,
    overallFeedback,
    totalScore,
  };

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white border-l border-slate-200 shadow-2xl transform transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50">
          <div>
            <p className="text-lg font-bold text-slate-900">{row?.studentName || 'Submission'}</p>
            <p className="text-sm text-slate-500 mt-1">{row?.assignmentName || 'Review and grade submission'}</p>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Submission viewer</h3>
                {row?.submission?.content ? (
                  <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">{row.submission.content}</div>
                ) : (
                  <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-400">No written response</div>
                )}
              </div>

              {row?.submission?.documents?.length > 0 && (
                <div className="space-y-3">
                  {row.submission.documents.map((document) => (
                    <DocumentCard key={document.id} document={document} onOpen={(doc) => window.open(doc.url, '_blank')} compact />
                  ))}
                </div>
              )}

              {row?.submission?.link_url && (
                <a href={row.submission.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline">
                  <ExternalLink className="w-4 h-4" /> Open attached link
                </a>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Rubric criteria</h3>
                <div className="space-y-4">
                  {criteria.map((criterion) => (
                    <div key={criterion.criterion_id} className="rounded-lg border border-slate-200 p-3 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{criterion.name}</p>
                        {criterion.description && <p className="text-xs text-slate-500 mt-1">{criterion.description}</p>}
                      </div>
                      <div>
                        <Label>Score</Label>
                        <Input type="number" min="0" max={criterion.max_score} value={criterion.score} onChange={(e) => updateCriterion(criterion.criterion_id, 'score', Number(e.target.value) || 0)} />
                        <p className="text-[11px] text-slate-400 mt-1">Out of {criterion.max_score}</p>
                      </div>
                      <div>
                        <Label>Comment</Label>
                        <Textarea rows={2} value={criterion.feedback} onChange={(e) => updateCriterion(criterion.criterion_id, 'feedback', e.target.value)} placeholder="Criterion feedback" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div>
                  <Label>Overall feedback</Label>
                  <Textarea rows={4} value={overallFeedback} onChange={(e) => setOverallFeedback(e.target.value)} placeholder="Overall feedback for the student" />
                </div>
                <div className="text-sm font-semibold text-slate-900">Total score: {totalScore}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 bg-white flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => onSaveDraft(payload)}>Save draft</Button>
          <Button onClick={() => onPublishGrade(payload)}>Publish grade</Button>
        </div>
      </div>
    </div>
  );
}