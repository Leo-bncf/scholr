import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export default function TeacherAnnotationsPanel({ onAddAnnotation, annotations = [] }) {
  const [documentName, setDocumentName] = useState('');
  const [selectionText, setSelectionText] = useState('');
  const [comment, setComment] = useState('');

  return (
    <div className="bg-white rounded-xl border scholr-rule p-6 space-y-4">
      <h2 className="font-semibold scholr-ink">Teacher Annotations</h2>
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
          <div key={annotation.id} className="rounded-lg border scholr-rule p-3 scholr-sunk">
            <p className="text-xs scholr-muted">{annotation.document_name || 'General comment'}</p>
            {annotation.selection_text && <p className="text-sm scholr-body mt-1 italic">“{annotation.selection_text}”</p>}
            <p className="text-sm scholr-ink mt-2">{annotation.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}