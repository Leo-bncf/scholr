import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { SCHOOL_ADMIN_REDIRECTS } from '@/components/app/schoolAdminSidebarLinks';

/**
 * A page that was merged into another, kept alive as a signpost.
 *
 * Seven school-admin pages were folded into four when the menu went from
 * twenty-two entries to fifteen. Deleting their routes outright would have
 * 404'd every bookmark, every link a school wrote in its own handbook, and
 * every "Next" row still pointing at the old name — our tidying landing on
 * them as a broken page.
 *
 * So each old path resolves to the tab that absorbed it, with `replace` so the
 * dead route does not sit in history and trap the back button.
 */
export default function SchoolAdminRedirect() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  useEffect(() => {
    const from = pathname.replace(/^\/+|\/+$/g, '');
    const key = Object.keys(SCHOOL_ADMIN_REDIRECTS)
      .find(k => k.toLowerCase() === from.toLowerCase());
    const target = key ? SCHOOL_ADMIN_REDIRECTS[key] : null;
    if (!target) {
      navigate(createPageUrl('SchoolAdminDashboard'), { replace: true });
      return;
    }
    const [page, query] = target.split('?');
    // A tab already in the URL wins over the default this redirect carries.
    const existing = new URLSearchParams(search).get('tab');
    const qs = existing ? `tab=${existing}` : query;
    navigate(`${createPageUrl(page)}${qs ? `?${qs}` : ''}`, { replace: true });
  }, [pathname, search, navigate]);

  return null;
}
