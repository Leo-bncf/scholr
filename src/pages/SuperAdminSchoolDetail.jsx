import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  ChevronLeft,
  DollarSign,
  Edit2,
  Eye,
  Loader2,
  Lock,
  Trash2,
  Unlock,
  Users,
  Zap,
} from 'lucide-react';
import { useImpersonation } from '@/components/auth/ImpersonationContext';
import EditSchoolDialog from '@/components/admin/EditSchoolDialog';
import ManageBillingDialog from '@/components/admin/ManageBillingDialog';
import AddSchoolAdminDialog from '@/components/admin/super-admin/AddSchoolAdminDialog';
import SchoolOnboardingProgress from '@/components/admin/SchoolOnboardingProgress';
import SchoolStatusBadge from '@/components/admin/SchoolStatusBadge';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import { getSchoolHealthIssues } from '@/components/admin/super-admin/superAdminConfig';
import { useSuperAdminSchoolDetailQuery } from '@/components/hooks/useSuperAdminData';
import * as schoolsData from '@/data/schools';

export default function SuperAdminSchoolDetail() {
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const { currentUser, isChecking } = useSuperAdminAccess(navigate, ['super_admin', 'admin']);
  const { data, isLoading, refetch } = useSuperAdminSchoolDetailQuery(schoolId, { enabled: !!currentUser });

  const school = data?.school || null;
  const stats = data?.stats || null;
  const members = data?.members || [];
  const { impersonate } = useImpersonation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [curriculumOverride, setCurriculumOverride] = useState('');

  const CURRICULUM_OPTIONS = [
    { value: '', label: 'Use school default' },
    { value: 'ib_dp', label: 'IB Diploma Programme' },
    { value: 'ib_myp', label: 'IB Middle Years' },
    { value: 'ib_pyp', label: 'IB Primary Years' },
    { value: 'igcse', label: 'IGCSE' },
    { value: 'a_levels', label: 'A Levels' },
    { value: 'us_common_core', label: 'US Common Core' },
  ];

  const roleRedirects = {
    school_admin: '/SchoolAdminDashboard',
    teacher: '/TeacherDashboard',
    student: '/StudentDashboard',
  };

  const handleImpersonate = (role) => {
    impersonate(school, role, curriculumOverride || null);
    navigate(roleRedirects[role] || '/SchoolAdminDashboard');
  };

  const reloadSchool = async () => {
    await refetch();
  };

  const handleSuspendSchool = async () => {
    if (!window.confirm('Are you sure you want to suspend this school? Users will not be able to access it.')) {
      return;
    }

    setActionLoading(true);
    await schoolsData.update(schoolId, { status: 'suspended' });
    await reloadSchool();
    setActionLoading(false);
  };

  const handleActivateSchool = async () => {
    setActionLoading(true);
    await schoolsData.update(schoolId, { status: 'active' });
    await reloadSchool();
    setActionLoading(false);
  };

  const handleDeleteSchool = async () => {
    if (!window.confirm(`Permanently delete "${school.name}"? This cannot be undone.`)) return;
    if (!window.confirm(`Second confirmation: all school data will be lost. Are you absolutely sure?`)) return;
    setActionLoading(true);
    await schoolsData.remove(schoolId);
    navigate('/SuperAdminSchools');
  };

  if (isChecking || isLoading) {
    return <SuperAdminLoadingState />;
  }

  if (!currentUser) {
    return null;
  }

  if (!school) {
    return (
      <SuperAdminShell activeItem="schools" currentUser={currentUser}>
        <Button onClick={() => navigate('/SuperAdminSchools')} variant="outline" className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Schools
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">School not found</p>
          </CardContent>
        </Card>
      </SuperAdminShell>
    );
  }

  const healthIssues = getSchoolHealthIssues(school);
  const isAtRisk = healthIssues.length > 0;

  return (
    <>
      <SuperAdminShell activeItem="schools" currentUser={currentUser}>
        <Button onClick={() => navigate('/SuperAdminSchools')} variant="outline" className="mb-6 text-xs md:text-sm">
          <ChevronLeft className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
          Back to Schools
        </Button>

        <Card className="mb-6">
          <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 truncate">{school.name}</h1>
                <p className="text-xs md:text-sm text-slate-600 mt-1 truncate">
                  {school.city}, {school.country} • Created {new Date(school.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="flex-shrink-0">
                <SchoolStatusBadge status={school.status} billingStatus={school.billing_status} />
              </div>
            </div>

            {isAtRisk && (
              <Alert className="bg-red-50 border-red-200 mt-4">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800 ml-3">
                  <strong>Attention needed:</strong> {healthIssues.join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Onboarding Status</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                <SchoolOnboardingProgress schoolId={schoolId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">School Setup</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  <div>
                    <p className="text-xs md:text-sm text-slate-600 font-semibold">Academic Years</p>
                    <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{stats?.academicYears || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-slate-600 font-semibold">Terms</p>
                    <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{stats?.terms || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-slate-600 font-semibold">Subjects</p>
                    <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{stats?.subjects || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-slate-600 font-semibold">Classes</p>
                    <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{stats?.classes || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-slate-600 font-semibold">Staff</p>
                    <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{stats?.staff || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Billing & Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6 pt-0 md:pt-0">
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 font-semibold">Plan</p>
                    <p className="text-lg font-bold text-slate-900 mt-1 capitalize">{school.plan || 'Starter'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 font-semibold">Billing Status</p>
                    <p className="text-lg font-bold text-slate-900 mt-1 capitalize">{school.billing_status || 'No Plan'}</p>
                  </div>

                  {school.billing_status === 'trial' && school.trial_end_date && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-slate-600 font-semibold">Trial Ends</p>
                      <p className="text-lg font-bold text-blue-900 mt-1">{new Date(school.trial_end_date).toLocaleDateString()}</p>
                      <p className="text-xs text-blue-700 mt-1">
                        {Math.ceil((new Date(school.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                      </p>
                    </div>
                  )}

                  {school.subscription_current_period_end && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600 font-semibold">Billing Period Ends</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">{new Date(school.subscription_current_period_end).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {school.stripe_subscription_id && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 font-semibold">Stripe Subscription ID</p>
                    <p className="text-sm font-mono text-slate-900 mt-1 break-all">{school.stripe_subscription_id}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Users className="w-4 md:w-5 h-4 md:h-5" />
                  Staff & Members ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                {members.length === 0 ? (
                  <p className="text-xs md:text-sm text-slate-600">No staff members added yet</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 border border-slate-200 rounded text-xs md:text-sm gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 truncate">{member.user_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-600 mt-0.5 truncate">{member.user_email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0">{member.role}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs md:text-sm p-4 md:p-6 pt-0 md:pt-0">
                <div className="min-w-0">
                  <p className="text-slate-600">Email</p>
                  <p className="font-semibold text-slate-900 truncate">{school.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-600">Phone</p>
                  <p className="font-semibold text-slate-900">{school.phone || 'N/A'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-slate-600">Address</p>
                  <p className="font-semibold text-slate-900 truncate">{school.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-600">Timezone</p>
                  <p className="font-semibold text-slate-900">{school.timezone || 'UTC'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 md:p-6 pt-0 md:pt-0">
                <div className="pb-3 mb-1 border-b border-slate-100 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Impersonate</p>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Curriculum override</p>
                    <select
                      value={curriculumOverride}
                      onChange={e => setCurriculumOverride(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    >
                      {CURRICULUM_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={() => handleImpersonate('school_admin')}
                    className="w-full justify-start text-xs md:text-sm bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                    variant="outline"
                  >
                    <Eye className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
                    View as School Admin
                  </Button>
                  <Button
                    onClick={() => handleImpersonate('teacher')}
                    className="w-full justify-start text-xs md:text-sm bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                    variant="outline"
                  >
                    <Eye className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
                    View as Teacher
                  </Button>
                  <Button
                    onClick={() => handleImpersonate('student')}
                    className="w-full justify-start text-xs md:text-sm bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                    variant="outline"
                  >
                    <Eye className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
                    View as Student
                  </Button>
                </div>

                <Button onClick={() => setEditDialogOpen(true)} disabled={actionLoading} className="w-full justify-start text-xs md:text-sm" variant="outline">
                  <Edit2 className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
                  Edit Details
                </Button>

                <Button onClick={() => setBillingDialogOpen(true)} disabled={actionLoading} className="w-full justify-start text-xs md:text-sm" variant="outline">
                  <DollarSign className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
                  Manage Billing
                </Button>

                <Button onClick={() => setAddAdminDialogOpen(true)} disabled={actionLoading} className="w-full justify-start text-xs md:text-sm" variant="outline">
                  <Users className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
                  Add School Admin
                </Button>

                {school.status === 'onboarding' && (
                  <Button onClick={handleActivateSchool} disabled={actionLoading} className="w-full justify-start text-xs md:text-sm" variant="outline">
                    {actionLoading && <Loader2 className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2 animate-spin" />}
                    <Zap className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
                    Activate School
                  </Button>
                )}

                {school.status === 'active' && (
                  <Button onClick={handleSuspendSchool} disabled={actionLoading} className="w-full justify-start text-xs md:text-sm text-red-600 hover:text-red-700" variant="outline">
                    {actionLoading && <Loader2 className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2 animate-spin" />}
                    <Lock className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
                    Suspend School
                  </Button>
                )}

                {school.status === 'suspended' && (
                  <Button onClick={handleActivateSchool} disabled={actionLoading} className="w-full justify-start text-xs md:text-sm" variant="outline">
                    {actionLoading && <Loader2 className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2 animate-spin" />}
                    <Unlock className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />
                    Reactivate School
                  </Button>
                )}

                <div className="pt-2 mt-1 border-t border-slate-100">
                  <Button onClick={handleDeleteSchool} disabled={actionLoading} className="w-full justify-start text-xs md:text-sm text-red-600 hover:text-red-700 hover:bg-red-50" variant="outline">
                    {actionLoading ? <Loader2 className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2 animate-spin" /> : <Trash2 className="w-3 md:w-4 h-3 md:h-4 mr-1 md:mr-2" />}
                    Delete School
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">System</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs p-4 md:p-6 pt-0 md:pt-0">
                <div className="min-w-0">
                  <p className="text-slate-600">School ID</p>
                  <p className="font-mono text-slate-900 break-all text-xs">{school.id}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-slate-600">Stripe Customer ID</p>
                  <p className="font-mono text-slate-900 break-all text-xs">{school.stripe_customer_id || 'None'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SuperAdminShell>

      <EditSchoolDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        school={school}
        onSchoolUpdated={reloadSchool}
      />

      <ManageBillingDialog
        open={billingDialogOpen}
        onOpenChange={setBillingDialogOpen}
        school={school}
        onUpdated={reloadSchool}
      />

      <AddSchoolAdminDialog
        open={addAdminDialogOpen}
        onOpenChange={setAddAdminDialogOpen}
        school={school}
      />
    </>
  );
}