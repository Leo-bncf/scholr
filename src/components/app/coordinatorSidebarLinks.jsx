import { LayoutDashboard, BarChart3, Star, BookOpen } from 'lucide-react';

/**
 * Coordinator navigation, built from the curriculum config: the IB Core item
 * is hidden for non-DP programmes and the predicted-grades item is renamed.
 *
 * "Cohorts" and "Reporting" used to be listed here and both pointed at
 * CoordinatorDashboard — the page the coordinator was already on. Three items
 * therefore highlighted as the current page at once, which is what made the
 * bug visible, but the real problem was that two of them were destinations
 * that do not exist. Cohorts is a section of the dashboard, not a page; add
 * them back when there is somewhere for them to go.
 */
export function getCoordinatorSidebarLinks(curriculum, config) {
  const isIBDP = curriculum === 'ib_dp';
  const features = config?.features || {};

  const links = [
    { label: 'Dashboard', page: 'CoordinatorDashboard', icon: LayoutDashboard },
    { label: 'Subjects',  page: 'SchoolAdminSubjects',  icon: BookOpen },
  ];

  if (features.predictedGrades) {
    links.push({
      label: isIBDP ? 'Predicted Grades' : 'Grade Forecasts',
      page: 'CoordinatorPredictedGrades',
      icon: BarChart3,
    });
  }

  if (features.coreModules) {
    links.push({
      label: isIBDP ? 'IB Core' : 'Core Programme',
      page: 'CoordinatorIBCore',
      icon: Star,
    });
  }

  return links;
}