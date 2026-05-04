import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data } = await req.json();
    if (data.status === 'present') return Response.json({ success: true, skipped: true });

    await base44.asServiceRole.functions.invoke('createNotification', {
      schoolId: data.school_id,
      userIds: [data.student_id],
      message: `Attendance issue recorded: ${data.status}`,
      type: 'attendance_issue',
      relatedEntityId: data.id,
      relatedEntityType: 'AttendanceRecord',
      groupKey: `attendance_issue_${data.student_id}_${new Date().toISOString().slice(0,10)}`,
      sendEmail: true,
      emailSubject: 'Attendance update'
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});