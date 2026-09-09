import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as gradebookData from '@/data/gradebook';

/**
 * Workflow for teachers to enter predicted grades
 * Records teacher confidence level and rationale
 */
export default function PredictedGradeWorkflow({
  open,
  onClose,
  schoolId,
  studentId,
  studentName,
  classId,
  className,
  subjectId,
  subjectName,
  existingPredictedGrade = null
}) {
  const queryClient = useQueryClient();
  const [predictedGrade, setPredictedGrade] = useState(existingPredictedGrade?.predicted_ib_grade || 4);
  const [confidence, setConfidence] = useState(existingPredictedGrade?.confidence_level || 'medium');
  const [rationale, setRationale] = useState(existingPredictedGrade?.rationale || '');

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (existingPredictedGrade) {
        return gradebookData.updatePredicted(existingPredictedGrade.id, data);
      }
      return gradebookData.createPredicted(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predicted-grades'] });
      queryClient.invalidateQueries({ queryKey: ['class-predicted-grades'] });
      onClose();
    }
  });

  const handleSave = () => {
    mutation.mutate({
      school_id: schoolId,
      student_id: studentId,
      student_name: studentName,
      class_id: classId,
      class_name: className,
      subject_id: subjectId,
      subject_name: subjectName,
      predicted_ib_grade: parseInt(predictedGrade),
      confidence_level: confidence,
      rationale,
      entry_date: new Date().toISOString().split('T')[0],
      visible_to_student: false // Teachers decide when to publish
    });
  };

  const gradeOptions = [
    { value: 7, label: '7 - Excellent' },
    { value: 6, label: '6 - Very Good' },
    { value: 5, label: '5 - Good' },
    { value: 4, label: '4 - Satisfactory' },
    { value: 3, label: '3 - Developing' },
    { value: 2, label: '2 - Beginning' },
    { value: 1, label: '1 - Limited' }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {existingPredictedGrade ? 'Update' : 'Enter'} Predicted Grade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800 ml-3 text-sm">
              <p className="font-semibold">Predicted Grade Entry</p>
              <p className="mt-1">Enter your best estimate based on current performance and progress.</p>
            </AlertDescription>
          </Alert>

          <div>
            <Label className="text-sm font-semibold">
              {studentName} - {subjectName}
            </Label>
            <p className="text-xs text-slate-500 mt-0.5">{className}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Predicted IB Grade (1-7)</Label>
            <Select value={predictedGrade.toString()} onValueChange={setPredictedGrade}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Your Confidence Level</Label>
            <Select value={confidence} onValueChange={setConfidence}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Still developing a clear picture</SelectItem>
                <SelectItem value="medium">Medium - Reasonable estimate based on current work</SelectItem>
                <SelectItem value="high">High - Strong indicator based on consistent performance</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              This helps coordinators understand the reliability of the prediction.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Rationale</Label>
            <Textarea
              placeholder="Why are you predicting this grade? What evidence supports it?"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={4}
              className="text-sm"
            />
            <p className="text-xs text-slate-500">
              Explain your reasoning for coordinators and future reference.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {existingPredictedGrade ? 'Update' : 'Save'} Predicted Grade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}