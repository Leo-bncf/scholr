import React, { useState } from 'react';
import { Group, GroupEmpty, Row } from '@/components/app/AppShell';
import StatusChip from '@/components/app/StatusChip';
import { Field, SelectField } from '@/components/app/Field';
import { getBillingStatusMeta, getPlanMeta } from '@/components/admin/super-admin/superAdminConfig';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
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
      <SuperAdminShell
        activeItem="schools"
        currentUser={currentUser}
        title="School not found"
        eyebrow="It may have been deleted"
      >
        <Group title="Nothing here">
          <GroupEmpty>
            No school matches that id. It was probably deleted.
          </GroupEmpty>
          <Row label="Back to all schools" href="/SuperAdminSchools" />
        </Group>
      </SuperAdminShell>
    );
  }

  const healthIssues = getSchoolHealthIssues(school);
  const isAtRisk = healthIssues.length > 0;

  const day = (v) => (v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null);
  const planMeta = getPlanMeta(school.plan);
  const billingMeta = getBillingStatusMeta(school.billing_status);
  const trialDaysLeft = school.trial_end_date
    ? Math.ceil((new Date(school.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const actionBtn = 'pub-btn pub-btn-line scholr-focus';
  const actionStyle = { width: '100%', justifyContent: 'flex-start', fontSize: '.83rem' };
  const dangerStyle = { ...actionStyle, color: 'var(--crit)', borderColor: 'var(--crit)' };

  return (
    <>
      <SuperAdminShell
        activeItem="schools"
        currentUser={currentUser}
        title={school.name}
        eyebrow={[
          [school.city, school.country].filter(Boolean).join(', '),
          school.created_at ? `since ${day(school.created_at)}` : null,
        ].filter(Boolean).join(' · ')}
        actions={<SchoolStatusBadge status={school.status} billingStatus={school.billing_status} />}
      >
        <Link
          to="/SuperAdminSchools"
          className="scholr-focus"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '.3rem',
            marginBottom: 'var(--space-md)', fontSize: '.82rem',
            color: 'var(--brand)', textDecoration: 'none',
          }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          All schools
        </Link>

        {isAtRisk && (
          <div
            role="status"
            style={{
              margin: '0 0 var(--space-md)', padding: '.6rem .8rem',
              fontSize: '.85rem', color: 'var(--crit)',
              background: 'var(--crit-sf)', border: '1px solid var(--crit)',
              borderRadius: 'var(--radius-control)',
            }}
          >
            <strong>Needs attention.</strong> {healthIssues.join(', ')}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
          <div className="lg:col-span-2 flex flex-col gap-5 md:gap-6">
            <Group title="Onboarding">
              <div className="px-4 py-3.5">
                <SchoolOnboardingProgress schoolId={schoolId} />
              </div>
            </Group>

            <Group title="Setup">
              <Row label="Academic years" value={stats?.academicYears ?? 0} />
              <Row label="Terms" value={stats?.terms ?? 0} />
              <Row label="Subjects" value={stats?.subjects ?? 0} />
              <Row label="Classes" value={stats?.classes ?? 0} />
              <Row label="Staff" value={stats?.staff ?? 0} />
            </Group>

            <Group title="Billing">
              <Row label="Plan"><StatusChip>{planMeta.label}</StatusChip></Row>
              <Row label="Status"><StatusChip tone={billingMeta.tone}>{billingMeta.label}</StatusChip></Row>
              {school.billing_status === 'trial' && school.trial_end_date && (
                <Row
                  label="Trial ends"
                  detail={trialDaysLeft >= 0 ? `${trialDaysLeft} days left` : `${Math.abs(trialDaysLeft)} days ago`}
                  value={day(school.trial_end_date)}
                />
              )}
              {school.subscription_current_period_end && (
                <Row label="Period ends" value={day(school.subscription_current_period_end)} />
              )}
              {school.stripe_subscription_id && (
                <Row label="Stripe subscription" value={school.stripe_subscription_id} />
              )}
            </Group>

            <Group title={`People · ${members.length}`}>
              {members.length === 0 ? (
                <GroupEmpty>Nobody has been added to this school yet.</GroupEmpty>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {members.map((member) => (
                    <Row
                      key={member.id}
                      label={member.user_name || 'No name on file'}
                      detail={member.user_email}
                    >
                      <StatusChip>{member.role}</StatusChip>
                    </Row>
                  ))}
                </div>
              )}
            </Group>
          </div>

          <div className="flex flex-col gap-5 md:gap-6">
            <Group title="Details">
              <Row label="Email" value={school.email || 'Not set'} />
              <Row label="Phone" value={school.phone || 'Not set'} />
              <Row label="Address" value={school.address || 'Not set'} />
              <Row label="Timezone" value={school.timezone || 'UTC'} />
            </Group>

            {/* Impersonation is separated from the ordinary actions: it changes
                whose eyes you are looking through, and it is audited. */}
            <Group title="View as">
              <div className="px-4 py-3.5 flex flex-col gap-2">
                <Field label="Curriculum override" htmlFor="curriculum-override">
                  <SelectField
                    id="curriculum-override"
                    value={curriculumOverride}
                    onChange={setCurriculumOverride}
                    label="Curriculum override"
                    options={CURRICULUM_OPTIONS}
                  />
                </Field>
                {[
                  ['school_admin', 'School admin'],
                  ['teacher', 'Teacher'],
                  ['student', 'Student'],
                ].map(([role, label]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleImpersonate(role)}
                    className={actionBtn}
                    style={actionStyle}
                  >
                    <Eye className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </Group>

            <Group title="Actions">
              <div className="px-4 py-3.5 flex flex-col gap-2">
                <button type="button" onClick={() => setEditDialogOpen(true)} disabled={actionLoading} className={actionBtn} style={actionStyle}>
                  <Edit2 className="w-4 h-4" />
                  Edit details
                </button>
                <button type="button" onClick={() => setBillingDialogOpen(true)} disabled={actionLoading} className={actionBtn} style={actionStyle}>
                  <DollarSign className="w-4 h-4" />
                  Manage billing
                </button>
                <button type="button" onClick={() => setAddAdminDialogOpen(true)} disabled={actionLoading} className={actionBtn} style={actionStyle}>
                  <Users className="w-4 h-4" />
                  Add school admin
                </button>

                {school.status === 'onboarding' && (
                  <button type="button" onClick={handleActivateSchool} disabled={actionLoading} className={actionBtn} style={actionStyle}>
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Activate school
                  </button>
                )}
                {school.status === 'active' && (
                  <button type="button" onClick={handleSuspendSchool} disabled={actionLoading} className={actionBtn} style={dangerStyle}>
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Suspend school
                  </button>
                )}
                {school.status === 'suspended' && (
                  <button type="button" onClick={handleActivateSchool} disabled={actionLoading} className={actionBtn} style={actionStyle}>
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                    Reactivate school
                  </button>
                )}
                <button type="button" onClick={handleDeleteSchool} disabled={actionLoading} className={actionBtn} style={dangerStyle}>
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete school
                </button>
              </div>
            </Group>

            <Group title="System">
              <Row label="School ID" value={school.id} />
              <Row label="Stripe customer" value={school.stripe_customer_id || 'None'} />
            </Group>
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