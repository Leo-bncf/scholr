import * as lucide from 'npm:lucide-react';
Deno.serve(async (req) => {
  const keys = Object.keys(lucide);
  const toCheck = [
    'ArrowRight', 'BookOpen', 'Users', 'BarChart3', 'Shield', 
    'MessageSquare', 'Calendar', 'ClipboardCheck', 'Star',
    'ChevronRight', 'Sparkles', 'GraduationCap', 'UserCheck',
    'UserCircle', 'Compass', 'Settings2', 'CheckCircle2',
    'LayoutDashboard', 'LibraryBig', 'FilePenLine', 'UsersRound', 
    'CalendarClock', 'MessageCircleMore', 'ShieldCheck', 'Trophy',
    'PieChart', 'ListChecks', 'Award', 'HeartHandshake', 'CalendarDays',
    'MessageSquareShare', 'Globe2'
  ];
  const missing = toCheck.filter(k => !keys.includes(k));
  return Response.json({ missing });
});