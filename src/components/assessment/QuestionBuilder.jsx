import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function QuestionBuilder({ question, onChange, onDelete }) {
  return (
    <div className="border rounded-xl p-4 space-y-3 bg-slate-50">
      <div className="flex gap-3">
        <div className="flex-1">
          <Label>Question</Label>
          <Textarea value={question.prompt} onChange={(e) => onChange({ ...question, prompt: e.target.value })} className="mt-1" />
        </div>
        <div className="w-40">
          <Label>Type</Label>
          <Select value={question.type} onValueChange={(value) => onChange({ ...question, type: value, options: value === 'multiple_choice' ? question.options || ['', ''] : [], correct_answer: '' })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple_choice">Multiple choice</SelectItem>
              <SelectItem value="short_answer">Short answer</SelectItem>
              <SelectItem value="long_answer">Long answer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-24">
          <Label>Points</Label>
          <Input type="number" value={question.points} onChange={(e) => onChange({ ...question, points: Number(e.target.value) || 0 })} className="mt-1" />
        </div>
      </div>
      {question.type === 'multiple_choice' && (
        <div className="space-y-2">
          <Label>Options</Label>
          {(question.options || []).map((option, index) => (
            <Input key={index} value={option} onChange={(e) => onChange({ ...question, options: question.options.map((item, i) => i === index ? e.target.value : item) })} placeholder={`Option ${index + 1}`} />
          ))}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...question, options: [...(question.options || []), ''] })}>Add option</Button>
            <Input value={question.correct_answer || ''} onChange={(e) => onChange({ ...question, correct_answer: e.target.value })} placeholder="Correct answer text" />
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onDelete}>Delete question</Button>
      </div>
    </div>
  );
}