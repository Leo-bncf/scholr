import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight } from 'lucide-react';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import AppShell, { Segmented } from '@/components/app/AppShell';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import { useUser } from '@/components/auth/UserContext';

/**
 * Every school-admin page, framed the same way.
 *
 * There were three shells before this. The dashboard used AppShell; nine pages
 * used AdminTabNavigation; twelve used neither and drew their own header out
 * of divs. Not one of the twenty-two used <Group>, the grouped-list primitive
 * the rest of the product is built from — so the section a school admin lives
 * in every day was the only part of Scholr that did not look like Scholr.
 *
 * This is the whole frame: sidebar, collapsing large title, optional tabs,
 * optional actions, and a row of links to the pages a person is likely to need
 * next. Pages supply content and nothing else.
 *
 * `related` is not decoration. A school admin arrives with an errand that
 * rarely fits one page — adding a student touches Users, Enrolments and
 * Classes — and a dead end at the bottom of a page means going back to the
 * sidebar and remembering which of twenty-one entries comes next.
 */
export default function SchoolAdminPage({
  title,
  eyebrow,
  actions,
  tabs,
  activeTab,
  onTabChange,
  related,
  allowedRoles = ['school_admin', 'admin', 'super_admin'],
  children,
}) {
  const { user, school, schoolId } = useUser();

  return (
    <RoleGuard allowedRoles={allowedRoles}>
      <AppSidebar
        links={SCHOOL_ADMIN_SIDEBAR_LINKS}
        role="school_admin"
        schoolName={school?.name}
        userName={user?.full_name}
        userId={user?.id}
        schoolId={schoolId}
      />
      <div className="app-offset">
        <AppShell title={title} eyebrow={eyebrow} actions={actions}>
          {tabs?.length > 0 && (
            <div style={{ marginBottom: 'var(--space-xs)' }}>
              <Segmented
                label={`${title} sections`}
                value={activeTab}
                onChange={onTabChange}
                options={tabs}
              />
            </div>
          )}

          {children}

          {related?.length > 0 && (
            <nav
              aria-label="Related pages"
              style={{
                marginTop: 'var(--space-xl)',
                paddingTop: 'var(--space-md)',
                borderTop: '1px solid var(--rule)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '.4rem 1.4rem',
                alignItems: 'baseline',
              }}
            >
              <span className="scholr-label" style={{ margin: 0 }}>Next</span>
              {related.map(([page, label]) => (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  className="scholr-focus"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                    fontSize: '.86rem', color: 'var(--brand)', textDecoration: 'none',
                  }}
                >
                  {label}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ))}
            </nav>
          )}
        </AppShell>
      </div>
    </RoleGuard>
  );
}
