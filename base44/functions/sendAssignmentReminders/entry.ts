import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const tomorrowStart = new Date();
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
    tomorrowStart.setUTCHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setUTCHours(23, 59, 59, 999);

    const assignments = await base44.asServiceRole.entities.Assignment.list('-due_date', 200);
    const dueSoonAssignments = assignments.filter((assignment) => {
      if (!assignment.due_date || assignment.status !== 'published') return false;
      const dueDate = new Date(assignment.due_date);
      return dueDate >= tomorrowStart && dueDate <= tomorrowEnd;
    });

    let emailsSent = 0;

    for (const assignment of dueSoonAssignments) {
      const classes = await base44.asServiceRole.entities.Class.filter({ id: assignment.class_id });
      const currentClass = classes[0];
      if (!currentClass?.student_ids?.length) continue;

      const students = await base44.asServiceRole.entities.SchoolMembership.filter({
        school_id: assignment.school_id,
        role: 'student',
        status: 'active',
      });

      const targetStudents = students.filter((student) => currentClass.student_ids.includes(student.user_id));

      for (const student of targetStudents) {
        if (!student.user_email) continue;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: student.user_email,
          subject: `Reminder: ${assignment.title} is due tomorrow`,
          body: `Hi ${student.user_name || 'Student'},\n\nThis is a reminder that your assignment \"${assignment.title}\" is due tomorrow.\n\nPlease make sure your work is submitted on time.\n\nBest,\nScholr`,
        });
        emailsSent += 1;
      }
    }

    return Response.json({ success: true, assignmentsChecked: dueSoonAssignments.length, emailsSent });
  } catch (error) {
    console.error('sendAssignmentReminders error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});