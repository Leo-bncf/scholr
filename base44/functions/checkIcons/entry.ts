import * as lucide from 'npm:lucide-react';
Deno.serve(async (req) => {
  const keys = Object.keys(lucide);
  const toCheck = ['Globe2', 'LibraryBig', 'UsersRound', 'CalendarClock', 'MessageCircleMore', 'ShieldCheck', 'ListChecks', 'HeartHandshake', 'CalendarDays', 'MessageSquareShare', 'PieChart', 'Award'];
  const missing = toCheck.filter(k => !keys.includes(k));
  return Response.json({ missing, allKeysSample: keys.slice(0, 10) });
});