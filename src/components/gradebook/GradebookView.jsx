import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGradebookPolicy } from '@/hooks/useGradebookPolicy';
import { base44 } from '@/api/base44Client';
import { Loader2, Edit, Eye, EyeOff, ClipboardCheck } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GradeStudentDialog from './GradeStudentDialog';
import RubricGradingDialog from './RubricGradingDialog';
import CreateGradeItem from './CreateGradeItem';
import CreateRubricGradeItem from './CreateRubricGradeItem';
import PredictedGradeDialog from './PredictedGradeDialog';
import { useUser } from '@/components/auth/UserContext';
import { getCurriculumConfig, formatGrade } from '@/lib/curriculumConfig';

export default function GradebookView({ classData, assignments = [] }) {
  const { policy } = useGradebookPolicy(classData?.school_id);
  const { curriculum } = useUser();
  const currConfig = getCurriculumConfig(curriculum);
  const isIBDP = curriculum === 'ib_dp';
  const showIBGrade = currConfig.features?.ibGradeScale;
  const gradeScaleLabel = currConfig.gradeScale?.displayLabel || 'Grade';
  const predictedLabel = isIBDP ? 'Predicted IB Grades' : currConfig.labels?.predictedGrades || 'Grade Forecasts';
  const [selectedGradeItem, setSelectedGradeItem] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [predictedGradeDialogOpen, setPredictedGradeDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grades');

  const { data: students = [] } = useQuery({
    queryKey: ['class-students-gradebook', classData.id],
    queryFn: async () => {
      const members = await base44.entities.SchoolMembership.filter({
        school_id: classData.school_id,
        status: 'active'
      });
      return members.filter(m => classData.student_ids?.includes(m.user_id));
    },
  });

  const { data: gradeItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['class-grade-items', classData.id],
    queryFn: async () => {
      const items = await base44.entities.GradeItem.filter({
        school_id: classData.school_id,
        class_id: classData.id
      });
      // Get unique grade items by title
      const uniqueMap = {};
      items.forEach(item => {
        if (!item.student_id) {
          uniqueMap[item.id] = item;
        }
      });
      return Object.values(uniqueMap);
    },
  });

  const { data: allGrades = [], isLoading: loadingGrades } = useQuery({
    queryKey: ['class-grades', classData.id],
    queryFn: () => base44.entities.GradeItem.filter({
      school_id: classData.school_id,
      class_id: classData.id
    }),
  });

  const { data: predictedGrades = [] } = useQuery({
    queryKey: ['predicted-grades', classData.id],
    queryFn: () => base44.entities.PredictedGrade.filter({
      school_id: classData.school_id,
      class_id: classData.id
    }),
  });

  if (loadingItems || loadingGrades) {
    return <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /></div>;
  }

  const getGradeForStudent = (gradeItemTitle, studentId) => {
    return allGrades.find(g => g.title === gradeItemTitle && g.student_id === studentId);
  };

  const handleGradeClick = (gradeItem, student) => {
    setSelectedGradeItem(gradeItem);
    setSelectedStudent(student);
    setGradeDialogOpen(true);
  };

  const handlePredictedGradeClick = (student) => {
    setSelectedStudent(student);
    setPredictedGradeDialogOpen(true);
  };

  const getPredictedGradeForStudent = (studentId) => {
    return predictedGrades.find(p => p.student_id === studentId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Gradebook</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-4">
            <button
              onClick={() => setViewMode('grades')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'grades' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Grades
            </button>
            {policy.predicted_grades_enabled !== false && currConfig.features?.predictedGrades && (
              <button
                onClick={() => setViewMode('predicted')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'predicted' 
                    ? 'bg-violet-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {predictedLabel}
              </button>
            )}
          </div>
          <CreateGradeItem classData={classData} assignments={assignments} />
          <CreateRubricGradeItem classData={classData} />
          <div className="flex items-center gap-2 text-xs text-slate-500 border border-slate-200 rounded-lg px-3 py-2">
            <ClipboardCheck className="w-4 h-4" />
            Assessment results flow into the gradebook automatically
          </div>
        </div>
      </div>

      {viewMode === 'predicted' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-violet-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Student
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                  {predictedLabel}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                  Confidence
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Rationale
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                  Entry Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map(student => {
                const pred = getPredictedGradeForStudent(student.user_id);
                const confidenceColors = {
                  high: 'bg-emerald-100 text-emerald-700',
                  medium: 'bg-blue-100 text-blue-700',
                  low: 'bg-amber-100 text-amber-700',
                };

                return (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div>
                        <p className="text-sm">{student.user_name || student.user_email}</p>
                        <p className="text-xs text-slate-400">{student.grade_level || ''}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handlePredictedGradeClick(student)}
                        className="w-full h-full min-h-[60px] flex items-center justify-center hover:bg-violet-50 rounded-lg transition-colors"
                      >
                        {pred ? (
                          <div className="text-2xl font-bold text-violet-700">
                            {formatGrade(pred.predicted_ib_grade, curriculum)}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-sm">Not set</span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {pred && (
                        <Badge className={`${confidenceColors[pred.confidence_level]} border-0`}>
                          {pred.confidence_level}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">
                      <p className="line-clamp-2">{pred?.rationale || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-500">
                      {pred?.entry_date ? format(new Date(pred.entry_date), 'MMM d, yyyy') : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : gradeItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 mb-4">No grade items yet</p>
          <div className="flex items-center justify-center gap-3">
            <CreateGradeItem classData={classData} assignments={assignments} trigger={
              <Button variant="outline">Create Simple Grade Item</Button>
            } />
            <CreateRubricGradeItem classData={classData} trigger={
              <Button variant="outline" className="border-indigo-200 text-indigo-700">Create Rubric Grade Item</Button>
            } />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase sticky left-0 bg-slate-50 z-10">
                  Student
                </th>
                {gradeItems.map(item => (
                  <th key={item.id} className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase min-w-[120px]">
                    <div className="flex items-center justify-center gap-1">
                      <span className="truncate">{item.title}</span>
                      {item.visible_to_student ? (
                        <Eye className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-normal mt-0.5">
                      {item.max_score} pts
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase min-w-[100px]">
                  Average
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map(student => {
                const studentGrades = gradeItems.map(item => getGradeForStudent(item.title, student.user_id));
                const validScores = studentGrades.filter(g => g?.score != null).map(g => g.score);
                const avg = validScores.length > 0
                  ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
                  : '—';

                return (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white z-10">
                      <div>
                        <p className="text-sm">{student.user_name || student.user_email}</p>
                        <p className="text-xs text-slate-400">{student.grade_level || ''}</p>
                      </div>
                    </td>
                    {gradeItems.map(item => {
                     const grade = getGradeForStudent(item.title, student.user_id);
                     const isRubric = item.grading_type === 'rubric';

                     return (
                       <td key={item.id} className="px-4 py-3 text-center">
                         <button
                           onClick={() => handleGradeClick(item, student)}
                           className={`w-full h-full min-h-[60px] flex items-center justify-center rounded-lg transition-colors group ${
                             isRubric ? 'hover:bg-indigo-50 border border-indigo-100' : 'hover:bg-indigo-50'
                           }`}
                         >
                           {grade ? (
                             <div>
                               {grade.score != null && (
                                   <div className="text-lg font-semibold text-slate-900">
                                     {formatGrade(grade.score, curriculum)}
                                     {isRubric && <span className="text-xs text-indigo-600 ml-1">R</span>}
                                   </div>
                                 )}
                                 {showIBGrade && grade.ib_grade && (
                                   <Badge className="bg-violet-50 text-violet-700 border-0 text-xs mt-1">
                                     {gradeScaleLabel} {grade.ib_grade}
                                   </Badge>
                                 )}
                               {grade.status && grade.status !== 'draft' && grade.status !== 'published' && (
                                 <Badge className={`text-xs mt-1 border-0 ${
                                   grade.status === 'missing' ? 'bg-red-50 text-red-700' :
                                   grade.status === 'late' ? 'bg-amber-50 text-amber-700' :
                                   'bg-blue-50 text-blue-700'
                                 }`}>
                                   {grade.status}
                                 </Badge>
                               )}
                             </div>
                           ) : (
                             <Edit className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
                           )}
                         </button>
                       </td>
                     );
                    })}
                    <td className="px-4 py-3 text-center">
                      <div className="text-lg font-bold text-slate-900">{avg !== '—' ? formatGrade(avg, curriculum) : '—'}</div>
                      {avg !== '—' && <div className="text-xs text-slate-400">{gradeScaleLabel}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedGradeItem && selectedStudent && (
        selectedGradeItem.grading_type === 'rubric' ? (
          <RubricGradingDialog
            gradeTemplate={selectedGradeItem}
            student={selectedStudent}
            existingGrade={getGradeForStudent(selectedGradeItem.title, selectedStudent.user_id)}
            open={gradeDialogOpen}
            onClose={() => {
              setGradeDialogOpen(false);
              setSelectedGradeItem(null);
              setSelectedStudent(null);
            }}
          />
        ) : (
          <GradeStudentDialog
            gradeItem={selectedGradeItem}
            student={selectedStudent}
            existingGrade={getGradeForStudent(selectedGradeItem.title, selectedStudent.user_id)}
            open={gradeDialogOpen}
            onClose={() => {
              setGradeDialogOpen(false);
              setSelectedGradeItem(null);
              setSelectedStudent(null);
            }}
          />
        )
      )}

      {selectedStudent && (
        <PredictedGradeDialog
          classData={classData}
          student={selectedStudent}
          existingPrediction={getPredictedGradeForStudent(selectedStudent.user_id)}
          open={predictedGradeDialogOpen}
          onClose={() => {
            setPredictedGradeDialogOpen(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
}