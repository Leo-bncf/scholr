import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const assignments = await base44.asServiceRole.entities.Assignment.list('-due_date', 200);
    const classes = await base44.asServiceRole.entities.Class.list('-updated_date', 200);
    const submissions = await base44.asServiceRole.entities.Submission.list('-updated_date', 500);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const assignment of assignments) {
      if (!assignment.due_date || assignment.status !== 'published') continue;
      const dueDate = new Date(assignment.due_date);
      const currentClass = classes.find((item) => item.id === assignment.class_id);
      if (!currentClass?.student_ids?.length) continue;

      const hasDueSoon = dueDate.toDateString() === tomorrow.toDateString();
      if (hasDueSoon) {
        await base44.asServiceRole.functions.invoke('createNotification', {
          schoolId: assignment.school_id,
          userIds: currentClass.student_ids,
          message: `${currentClass.student_ids.length > 1 ? currentClass.student_ids.length : 1} assignment${currentClass.student_ids.length > 1 ? 's are' : ' is'} due tomorrow`,
          type: 'assignment_due_soon',
          relatedEntityId: assignment.id,
          relatedEntityType: 'Assignment',
          groupKey: `assignment_due_soon_${assignment.class_id}_${tomorrow.toISOString().slice(0,10)}`,
          sendEmail: true,
          emailSubject: 'Assignment due tomorrow'
        });
      }

      if (dueDate < now) {
        const submittedStudentIds = submissions.filter((item) => item.assignment_id === assignment.id).map((item) => item.student_id);
        const missingStudentIds = currentClass.student_ids.filter((studentId) => !submittedStudentIds.includes(studentId));
        if (missingStudentIds.length) {
          await base44.asServiceRole.functions.invoke('createNotification', {
            schoolId: assignment.school_id,
            userIds: missingStudentIds,
            message: `${missingStudentIds.length} assignment${missingStudentIds.length > 1 ? 's are' : ' is'} missing`,
            type: 'assignment_missing',
            relatedEntityId: assignment.id,
            relatedEntityType: 'Assignment',
            groupKey: `assignment_missing_${assignment.id}`,
            sendEmail: true,
            emailSubject: 'Missing assignment reminder'
          });
        }
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});