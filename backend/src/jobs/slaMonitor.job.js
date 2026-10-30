import cron from 'node-cron';
import db from '../config/database.js';
import notificationService from '../modules/notifications/notification.service.js';
import auditService from '../modules/audit/audit.service.js';

export const runSlaCheck = async () => {
  try {
    // Query complaints that breached SLA resolution deadline and have no open escalation
    const query = `
      SELECT c.id, c.ticket_number, c.current_department_id as department_id, 
             c.submitted_by as citizen_id, c.status as current_status, c.sla_resolution_due_at as sla_deadline
      FROM complaints c
      WHERE c.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')
        AND c.sla_resolution_due_at IS NOT NULL
        AND c.sla_resolution_due_at < CURRENT_TIMESTAMP
        AND NOT EXISTS (
          SELECT 1 FROM escalations e 
          WHERE e.complaint_id = c.id AND e.status IN ('OPEN', 'ACKNOWLEDGED')
        )
      LIMIT 100;
    `;
    const result = await db.query(query);
    const breached = result.rows;

    if (breached.length === 0) {
      return { processed: 0 };
    }

    console.log(`[SLA Monitor] Found ${breached.length} complaints breaching SLA. Processing escalations...`);

    for (const complaint of breached) {
      try {
        await db.withTransaction(async (client) => {
          // 1. Insert escalation record
          await client.query(
            `INSERT INTO escalations (complaint_id, level, trigger_type, description, status)
             VALUES ($1, 'LEVEL_1', 'SLA_BREACH', 'Automated SLA breach detected by monitor', 'OPEN')`,
            [complaint.id]
          );

          // 2. Add status history
          await client.query(
            `INSERT INTO complaint_status_history (complaint_id, from_status, to_status, changed_by, note)
             VALUES ($1, $2, $2, $3, 'Automated SLA breach: escalated to Level 1 by system')`,
            [complaint.id, complaint.current_status, complaint.citizen_id]
          );

          // 3. Alert department officers
          notificationService.notifyDepartmentOfficers({
            departmentId: complaint.department_id,
            complaintId: complaint.id,
            title: 'SLA BREACH ALERT',
            message: `Complaint #${complaint.ticket_number} has breached its resolution SLA and is now escalated to Level 1.`,
            notificationType: 'SLA_ESCALATION'
          }).catch(console.error);

          // 4. Notify citizen of expedited escalation
          notificationService.notifyUser({
            userId: complaint.citizen_id,
            complaintId: complaint.id,
            title: 'Complaint Expedited',
            message: `Resolution target for #${complaint.ticket_number} has elapsed. It has been escalated for priority resolution.`,
            notificationType: 'SLA_ESCALATION'
          }).catch(console.error);

          // 5. System audit log
          auditService.logEvent({
            userId: complaint.citizen_id,
            action: 'SYSTEM_SLA_ESCALATION',
            entityType: 'COMPLAINT',
            entityId: complaint.id,
            details: { ticketNumber: complaint.ticket_number, deadline: complaint.sla_deadline }
          }).catch(console.error);
        });
      } catch (err) {
        console.error(`[SLA Monitor] Failed to escalate complaint ${complaint.id}:`, err.message || err);
      }
    }

    return { processed: breached.length };
  } catch (error) {
    console.error('[SLA Monitor] Error during SLA check execution:', error.message || error);
    return { error: error.message };
  }
};

export const startSlaMonitorJob = () => {
  // Run every 15 minutes
  const task = cron.schedule('*/15 * * * *', async () => {
    console.log('[SLA Monitor] Running periodic SLA breach check...');
    await runSlaCheck();
  });

  console.log('✅ SLA Monitor cron job scheduled (every 15 minutes)');
  return task;
};

export default {
  runSlaCheck,
  startSlaMonitorJob
};
