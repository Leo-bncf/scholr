import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data } = await req.json();
    const classes = await base44.asServiceRole.entities.Class.filter({ id: data.class_id });
    const currentClass = classes[0];
    if (!currentClass?.student_ids?.length) return Response.json({ success: true, skipped: true });

    await base44.asServiceRole.functions.invoke('createNotification', {
      schoolId: data.school_id,
      userIds: currentClass.student_ids,
      message: `New assignment: ${data.title}`,
      type: 'assignment_created',
      relatedEntityId: data.id,
      relatedEntityType: 'Assignment',
      groupKey: `assignment_created_${data.class_id}_${new Date().toISOString().slice(0,10)}`,
      sendEmail: true,
      emailSubject: 'New assignment posted'
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});