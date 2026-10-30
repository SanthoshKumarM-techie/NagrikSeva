import db from '../../config/database.js';

export const findByComplaintId = async (complaintId) => {
  const query = `
    SELECT e.id, e.complaint_id, e.uploaded_by, e.stage as evidence_type, e.stage,
           e.storage_url as file_url, e.storage_url, e.mime_type as file_type, e.file_size_bytes,
           e.caption, e.is_public, e.uploaded_at as created_at,
           u.full_name as uploaded_by_name, u.role as uploaded_by_role
    FROM complaint_evidence e
    JOIN users u ON e.uploaded_by = u.id
    WHERE e.complaint_id = $1
    ORDER BY e.uploaded_at ASC;
  `;
  const result = await db.query(query, [complaintId]);
  return result.rows;
};

export const create = async ({
  complaintId,
  uploadedBy,
  evidenceType = 'CITIZEN_INITIAL',
  stage,
  fileUrl,
  fileName,
  fileType,
  fileSizeBytes = 0,
  caption,
  isPublic = true
}, client = db) => {
  // Map evidenceType to allowed enum: CITIZEN_INITIAL, WORKER_BEFORE, WORKER_AFTER, OTHER
  let finalStage = stage || evidenceType;
  if (finalStage === 'BEFORE') finalStage = 'CITIZEN_INITIAL';
  if (finalStage === 'DURING') finalStage = 'WORKER_BEFORE';
  if (finalStage === 'AFTER') finalStage = 'WORKER_AFTER';
  if (!['CITIZEN_INITIAL', 'WORKER_BEFORE', 'WORKER_AFTER', 'OTHER'].includes(finalStage)) {
    finalStage = 'OTHER';
  }

  const query = `
    INSERT INTO complaint_evidence (
      complaint_id, uploaded_by, stage, file_name,
      storage_url, mime_type, file_size_bytes, caption, is_public
    )
    VALUES ($1, $2, $3::evidence_stage, $4, $5, $6, $7, $8, $9)
    RETURNING id, complaint_id, uploaded_by, stage, storage_url, storage_url as file_url, uploaded_at as created_at;
  `;
  const result = await client.query(query, [
    complaintId,
    uploadedBy,
    finalStage,
    fileName || 'evidence.jpg',
    fileUrl,
    fileType || 'image/jpeg',
    fileSizeBytes || 0,
    caption || null,
    isPublic !== undefined ? isPublic : true
  ]);
  return result.rows[0];
};

export default {
  findByComplaintId,
  create
};
