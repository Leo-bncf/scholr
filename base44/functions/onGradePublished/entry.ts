import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data } = await req.json();
    if (data.status !== 'published') return Response.json({ success: true, skipped: true });

    const userIds = [data.student_id].filter(Boolean);
    await base44.asServiceRole.functions.invoke('createNotification', {
      schoolId: data.school_id,
      userIds,
      message: `New grade posted: ${data.title}`,
      type: 'grade_published',
      relatedEntityId: data.id,
      relatedEntityType: 'GradeItem',
      groupKey: `grade_published_${data.student_id}_${new Date().toISOString().slice(0,10)}`,
      sendEmail: true,
      emailSubject: 'New grade available'
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});