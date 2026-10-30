import db from '../../config/database.js';

export const createReview = async ({
  complaintId,
  reviewerId,
  reviewType = 'OFFICER_VERIFICATION',
  decision,
  feedback
}, client = db) => {
  // Map review_type to enum: OFFICER_VERIFICATION or CITIZEN_VERIFICATION
  const finalType = reviewType === 'CITIZEN_FEEDBACK' ? 'CITIZEN_VERIFICATION' : reviewType;

  // Map decision to enum: APPROVED, REWORK_REQUIRED, CONFIRMED, DISPUTED
  let finalDecision = decision;
  if (decision === 'REJECTED') finalDecision = 'REWORK_REQUIRED';

  const query = `
    INSERT INTO complaint_reviews (
      complaint_id, reviewed_by, review_type, decision, reason, reviewed_at
    )
    VALUES ($1, $2, $3::review_type, $4::review_decision, $5, CURRENT_TIMESTAMP)
    RETURNING id, complaint_id, reviewed_by as reviewer_id, review_type, decision, reason as feedback, reviewed_at as created_at;
  `;
  const result = await client.query(query, [
    complaintId,
    reviewerId,
    finalType,
    finalDecision,
    feedback || null
  ]);
  return result.rows[0];
};

export const findByComplaintId = async (complaintId) => {
  const query = `
    SELECT r.id, r.complaint_id, r.reviewed_by as reviewer_id, r.review_type, r.decision,
           r.reason as feedback, r.reviewed_at as created_at,
           u.full_name as reviewer_name, u.role as reviewer_role
    FROM complaint_reviews r
    JOIN users u ON r.reviewed_by = u.id
    WHERE r.complaint_id = $1
    ORDER BY r.reviewed_at DESC;
  `;
  const result = await db.query(query, [complaintId]);
  return result.rows;
};

export const createEscalation = async ({
  complaintId,
  escalationLevel = 'LEVEL_2',
  reason,
  triggeredBy = 'CITIZEN_DISPUTE'
}, client = db) => {
  let level = escalationLevel;
  if (level === 2 || level === '2') level = 'LEVEL_2';
  if (level === 1 || level === '1') level = 'LEVEL_1';
  if (level === 3 || level === '3') level = 'LEVEL_3';

  const query = `
    INSERT INTO escalations (complaint_id, level, description, trigger_type, status)
    VALUES ($1, $2::escalation_level, $3, $4, 'OPEN')
    RETURNING id, complaint_id, level as escalation_level, description as reason, trigger_type as triggered_by, status, created_at;
  `;
  const result = await client.query(query, [complaintId, level, reason, triggeredBy]);
  return result.rows[0];
};

export default {
  createReview,
  findByComplaintId,
  createEscalation
};
