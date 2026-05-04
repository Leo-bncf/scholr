import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, ArrowRight, Save, Sparkles, CheckCircle2, Building2, Users, GraduationCap, BookOpenCheck, ClipboardList } from 'lucide-react';
import SchoolOnboardingProgress from '@/components/onboarding-flow/SchoolOnboardingProgress';
import SchoolOnboardingReview from '@/components/onboarding-flow/SchoolOnboardingReview';
import DemoDataControls from '@/components/onboarding/DemoDataControls';
import BulkImportTab from '@/components/users/BulkImportTab';

const steps = [
  { id: 'school_profile', label: 'Create school profile', icon: Building2, description: 'Add the core details for your school account.' },
  { id: 'classes', label: 'Add classes', icon: ClipboardList, description: 'Create at least one class to start structuring your school.' },
  { id: 'teachers', label: 'Add teachers', icon: Users, description: 'Add your teaching team so classes can be managed.' },
  { id: 'students', label: 'Add students', icon: GraduationCap, description: 'Upload students by CSV to populate enrolments.' },
  { id: 'subjects', label: 'Assign subjects', icon: BookOpenCheck, description: 'Link subjects to classes so teaching can begin.' },
  { id: 'review', label: 'Review and finish', icon: CheckCircle2, description: 'Check everything before going to the dashboard.' },
];

export default function SchoolOnboardingFlow() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, school, schoolId } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [schoolProfile, setSchoolProfile] = useState({ name: '', country: '', city: '', address: '', email: '', phone: '' });
  const [classDraft, setClassDraft] = useState({ name: '', section: '', academic_year_id: '' });
  const [teacherDraft, setTeacherDraft] = useState({ name: '', email: '', department: '' });
  const [subjectAssignment, setSubjectAssignment] = useState({ classId: '', subjectId: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['school-onboarding-flow', schoolId],
    queryFn: async () => {
      const [schools, classes, memberships, subjects, academicYears] = await Promise.all([
        base44.entities.School.filter({ id: schoolId }),
        base44.entities.Class.filter({ school_id: schoolId }),
        base44.entities.SchoolMembership.filter({ school_id: schoolId }),
        base44.entities.Subject.filter({ school_id: schoolId }),
        base44.entities.AcademicYear.filter({ school_id: schoolId }),
      ]);
      return {
        school: schools[0],
        classes,
        memberships,
        subjects,
        academicYears,
      };
    },
    enabled: !!schoolId,
  });

  useEffect(() => {
    if (data?.school || user?.onboarding_school_profile) {
      setSchoolProfile({
        name: user?.onboarding_school_profile?.name || data?.school?.name || '',
        country: user?.onboarding_school_profile?.country || data?.school?.country || '',
        city: user?.onboarding_school_profile?.city || data?.school?.city || '',
        address: user?.onboarding_school_profile?.address || data?.school?.address || '',
        email: user?.onboarding_school_profile?.email || data?.school?.email || '',
        phone: user?.onboarding_school_profile?.phone || data?.school?.phone || '',
      });
      setClassDraft((prev) => ({ ...prev, academic_year_id: prev.academic_year_id || data?.academicYears?.find((item) => item.is_current)?.id || data?.academicYears?.[0]?.id || '' }));
    }
  }, [data, user]);

  const safeData = data || { school: null, classes: [], memberships: [], subjects: [], academicYears: [] };
  const teachers = safeData.memberships.filter((item) => item.role === 'teacher');
  const students = safeData.memberships.filter((item) => item.role === 'student');

  const reviewSummary = useMemo(() => ([
    { label: 'School profile', value: schoolProfile.name ? 'Ready' : 'Missing' },
    { label: 'Classes', value: data?.classes?.length || 0 },
    { label: 'Teachers', value: teachers.length },
    { label: 'Students', value: students.length },
    { label: 'Subjects', value: data?.subjects?.length || 0 },
    { label: 'Assignments', value: data?.classes?.filter((item) => item.subject_id).length || 0 },
  ]), [schoolProfile.name, data, teachers.length, students.length]);

  const saveProgress = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    await base44.auth.updateMe({
      onboarding_flow_step: currentStep,
      onboarding_flow_saved_at: new Date().toISOString(),
      onboarding_school_profile: schoolProfile,
    });
    setSaving(false);
    setSuccess('Progress saved');
  };

  const refreshFlowData = async () => {
    await queryClient.invalidateQueries({ queryKey: ['school-onboarding-flow', schoolId] });
  };

  const validateStep = () => {
    if (currentStep === 0 && !schoolProfile.name.trim()) return 'School name is required.';
    if (currentStep === 1 && (!data?.classes?.length && !classDraft.name.trim())) return 'Add at least one class.';
    if (currentStep === 2 && (!teachers.length && (!teacherDraft.name.trim() || !teacherDraft.email.trim()))) return 'Add at least one teacher.';
    if (currentStep === 3 && students.length === 0) return 'Import at least one student with CSV.';
    if (currentStep === 4 && (!safeData.subjects.length || !safeData.classes.some((item) => item.subject_id))) return 'Add subjects and assign one to a class.';
    return '';
  };

  const handleNext = async () => {
    const validationError = validateStep();
    setError(validationError);
    setSuccess('');
    if (validationError || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (currentStep === 1 && classDraft.name.trim()) {
        await base44.entities.Class.create({
          school_id: schoolId,
          name: classDraft.name.trim(),
          section: classDraft.section.trim(),
          academic_year_id: classDraft.academic_year_id || undefined,
          status: 'active',
          teacher_ids: [],
          student_ids: [],
          subject_teacher_assignments: [],
        });
        setClassDraft({ name: '', section: '', academic_year_id: classDraft.academic_year_id });
      }

      if (currentStep === 2 && teacherDraft.name.trim() && teacherDraft.email.trim()) {
        await base44.entities.SchoolMembership.create({
          school_id: schoolId,
          user_name: teacherDraft.name.trim(),
          user_email: teacherDraft.email.trim(),
          role: 'teacher',
          department: teacherDraft.department.trim(),
          status: 'pending',
        });
        setTeacherDraft({ name: '', email: '', department: '' });
      }

      if (currentStep === 4 && subjectAssignment.classId && subjectAssignment.subjectId) {
        const selectedClass = safeData.classes.find((item) => item.id === subjectAssignment.classId);
        if (selectedClass) {
          await base44.entities.Class.update(selectedClass.id, { subject_id: subjectAssignment.subjectId });
        }
      }

      await base44.auth.updateMe({
        onboarding_flow_step: Math.min(currentStep + 1, steps.length - 1),
        onboarding_flow_saved_at: new Date().toISOString(),
        onboarding_school_profile: schoolProfile,
      });
      await refreshFlowData();

      if (currentStep === steps.length - 1) {
        navigate('/SchoolAdminDashboard');
        return;
      }

      setCurrentStep((prev) => prev + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setError('');
    setSuccess('');
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  useEffect(() => {
    const loadSavedStep = async () => {
      if (user?.onboarding_flow_step != null) {
        setCurrentStep(Math.min(user.onboarding_flow_step, steps.length - 1));
      }
    };
    loadSavedStep();
  }, [user]);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-700" /></div>;
  }

  return (
    <RoleGuard allowedRoles={['school_admin', 'admin', 'super_admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={SCHOOL_ADMIN_SIDEBAR_LINKS} role="school_admin" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="md:ml-64 min-h-screen p-6 max-w-7xl mx-auto space-y-6">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 p-6 md:p-8 text-white shadow-lg">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100 font-semibold">Quick setup</p>
                <h1 className="text-3xl md:text-4xl font-bold mt-2">School Onboarding Flow</h1>
                <p className="text-sm md:text-base text-emerald-50/90 mt-3">Move through the setup step by step, save progress any time, and finish with a ready school admin dashboard.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/SchoolAdminDashboard')} className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" />Exit</Button>
                <Button variant="outline" onClick={saveProgress} disabled={saving} className="bg-white text-emerald-900 border-white hover:bg-emerald-50">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save progress</Button>
              </div>
            </div>
          </div>

          {error && <Alert className="border-red-200 bg-red-50"><AlertDescription className="text-red-700">{error}</AlertDescription></Alert>}
          {success && <Alert className="border-emerald-200 bg-emerald-50"><AlertDescription className="text-emerald-700">{success}</AlertDescription></Alert>}

          <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
            <div className="space-y-4">
              <SchoolOnboardingProgress steps={steps} currentStep={currentStep} />
              <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-semibold text-slate-900">Demo / sample data</h3>
                </div>
                <DemoDataControls schoolId={schoolId} onRefresh={() => queryClient.invalidateQueries({ queryKey: ['school-onboarding-flow', schoolId] })} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-0">{steps[currentStep].label}</Badge>
                  <h2 className="text-2xl font-bold text-slate-900 mt-3">{steps[currentStep].label}</h2>
                  <p className="text-sm text-slate-500 mt-2 max-w-2xl">{steps[currentStep].description}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 min-w-[180px]">
                  <p className="text-xs text-slate-500">Current progress</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">{currentStep + 1} / {steps.length}</p>
                </div>
              </div>

              {currentStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>School name *</Label>
                    <Input value={schoolProfile.name} onChange={(e) => setSchoolProfile({ ...schoolProfile, name: e.target.value })} className="mt-1" />
                  </div>
                  <div><Label>Country</Label><Input value={schoolProfile.country} onChange={(e) => setSchoolProfile({ ...schoolProfile, country: e.target.value })} className="mt-1" /></div>
                  <div><Label>City</Label><Input value={schoolProfile.city} onChange={(e) => setSchoolProfile({ ...schoolProfile, city: e.target.value })} className="mt-1" /></div>
                  <div className="md:col-span-2"><Label>Address</Label><Textarea value={schoolProfile.address} onChange={(e) => setSchoolProfile({ ...schoolProfile, address: e.target.value })} className="mt-1" /></div>
                  <div><Label>Email</Label><Input value={schoolProfile.email} onChange={(e) => setSchoolProfile({ ...schoolProfile, email: e.target.value })} className="mt-1" /></div>
                  <div><Label>Phone</Label><Input value={schoolProfile.phone} onChange={(e) => setSchoolProfile({ ...schoolProfile, phone: e.target.value })} className="mt-1" /></div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><Label>Class name *</Label><Input value={classDraft.name} onChange={(e) => setClassDraft({ ...classDraft, name: e.target.value })} className="mt-1" /></div>
                    <div><Label>Section</Label><Input value={classDraft.section} onChange={(e) => setClassDraft({ ...classDraft, section: e.target.value })} className="mt-1" /></div>
                    <div>
                      <Label>Academic year</Label>
                      <Select value={classDraft.academic_year_id || 'none'} onValueChange={(value) => setClassDraft({ ...classDraft, academic_year_id: value === 'none' ? '' : value })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No year</SelectItem>
                          {safeData.academicYears.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">Existing classes</p>
                    {safeData.classes.length === 0 ? <p className="text-sm text-slate-400">No classes yet.</p> : safeData.classes.map((item) => <div key={item.id} className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">{item.name}</div>)}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><Label>Teacher name *</Label><Input value={teacherDraft.name} onChange={(e) => setTeacherDraft({ ...teacherDraft, name: e.target.value })} className="mt-1" /></div>
                    <div><Label>Email *</Label><Input value={teacherDraft.email} onChange={(e) => setTeacherDraft({ ...teacherDraft, email: e.target.value })} className="mt-1" /></div>
                    <div><Label>Department</Label><Input value={teacherDraft.department} onChange={(e) => setTeacherDraft({ ...teacherDraft, department: e.target.value })} className="mt-1" /></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">Added teachers</p>
                    {teachers.length === 0 ? <p className="text-sm text-slate-400">No teachers yet.</p> : teachers.map((item) => <div key={item.id} className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">{item.user_name || item.user_email}</div>)}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50"><AlertDescription className="text-blue-700">Student upload is required in this step. Use the CSV importer below.</AlertDescription></Alert>
                  <BulkImportTab schoolId={schoolId} schoolName={school?.name} />
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Class</Label>
                      <Select value={subjectAssignment.classId || 'none'} onValueChange={(value) => setSubjectAssignment({ ...subjectAssignment, classId: value === 'none' ? '' : value })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select class</SelectItem>
                          {safeData.classes.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Subject</Label>
                      <Select value={subjectAssignment.subjectId || 'none'} onValueChange={(value) => setSubjectAssignment({ ...subjectAssignment, subjectId: value === 'none' ? '' : value })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select subject</SelectItem>
                          {safeData.subjects.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">Current class subject assignments</p>
                    {safeData.classes.length === 0 ? <p className="text-sm text-slate-400">No classes available.</p> : safeData.classes.map((item) => <div key={item.id} className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">{item.name} — {safeData.subjects.find((subject) => subject.id === item.subject_id)?.name || 'No subject assigned'}</div>)}
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-5">
                  <SchoolOnboardingReview summary={reviewSummary} />
                  <Alert className="border-emerald-200 bg-emerald-50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <AlertDescription className="text-emerald-700">When you finish, you will be redirected to the School Admin Dashboard.</AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                <Button variant="outline" onClick={handleBack} disabled={currentStep === 0 || isSubmitting} className="min-w-[120px]"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
                <Button onClick={handleNext} disabled={isSubmitting} className="min-w-[160px] bg-emerald-700 hover:bg-emerald-800">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{currentStep === steps.length - 1 ? 'Finish setup' : 'Next'}<ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}