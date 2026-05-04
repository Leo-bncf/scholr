import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { schoolId, userIds, message, type, relatedEntityId, relatedEntityType, groupKey, sendEmail, emailSubject } = payload;

    if (!schoolId || !userIds?.length || !message || !type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const memberships = await base44.asServiceRole.entities.SchoolMembership.filter({ school_id: schoolId, status: 'active' });
    const targetMemberships = memberships.filter((item) => userIds.includes(item.user_id));

    const created = [];
    for (const member of targetMemberships) {
      const notification = await base44.asServiceRole.entities.Notification.create({
        school_id: schoolId,
        user_id: member.user_id,
        message,
        type,
        timestamp: new Date().toISOString(),
        read_status: false,
        related_entity_id: relatedEntityId || '',
        related_entity_type: relatedEntityType || 'Other',
        group_key: groupKey || `${type}_${relatedEntityId || Date.now()}`,
        group_count: 1,
        email_sent: !!sendEmail,
      });
      created.push(notification);

      if (sendEmail && member.user_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: member.user_email,
          subject: emailSubject || 'New notification',
          body: message,
        });
      }
    }

    return Response.json({ success: true, count: created.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});