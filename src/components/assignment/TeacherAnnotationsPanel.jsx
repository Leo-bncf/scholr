import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export default function TeacherAnnotationsPanel({ onAddAnnotation, annotations = [] }) {
  const [documentName, setDocumentName] = useState('');
  const [selectionText, setSelectionText] = useState('');
  const [comment, setComment] = useState('');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <h2 className="font-semibold text-slate-900">Teacher Annotations</h2>
      <Input value={documentName} onChange={(e) => setDocumentName(e.target.value)} placeholder="Document name" />
      <Textarea value={selectionText} onChange={(e) => setSelectionText(e.target.value)} placeholder="Highlighted section or quoted text" rows={3} />
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comment tied to this part" rows={3} />
      <Button
        onClick={() => {
          if (!comment.trim()) return;
          onAddAnnotation({ document_name: documentName, selection_text: selectionText, comment });
          setDocumentName('');
          setSelectionText('');
          setComment('');
        }}
      >
        Add annotation
      </Button>
      <div className="space-y-3">
        {annotations.map((annotation) => (
          <div key={annotation.id} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
            <p className="text-xs text-slate-500">{annotation.document_name || 'General comment'}</p>
            {annotation.selection_text && <p className="text-sm text-slate-700 mt-1 italic">“{annotation.selection_text}”</p>}
            <p className="text-sm text-slate-900 mt-2">{annotation.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}