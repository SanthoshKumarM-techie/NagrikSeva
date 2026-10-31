import db from '../../config/database.js';

export const createTransfer = async ({
  complaintId,
  fromDepartmentId,
  toDepartmentId,
  initiatedBy,
  reason
}, client = db) => {
  const countQuery = `SELECT COALESCE(MAX(transfer_number), 0) + 1 AS next_num FROM complaint_transfers WHERE complaint_id = $1;`;
  const countRes = await client.query(countQuery, [complaintId]);
  const transferNumber = countRes.rows[0]?.next_num || 1;

  const query = `
    INSERT INTO complaint_transfers (
      complaint_id, from_department_id, to_department_id, transferred_by, transfer_number, reason, receiving_decision, transferred_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', CURRENT_TIMESTAMP)
    RETURNING id, complaint_id, from_department_id, to_department_id, transferred_by as initiated_by,
              transfer_number, reason, receiving_decision as status, transferred_at as created_at;
  `;
  const result = await client.query(query, [
    complaintId,
    fromDepartmentId,
    toDepartmentId,
    initiatedBy,
    transferNumber,
    reason
  ]);
  return result.rows[0];
};

export const findById = async (id) => {
  const query = `
    SELECT t.id, t.complaint_id, t.from_department_id, t.to_department_id,
           t.transferred_by as initiated_by, t.reason, t.transfer_number,
           t.receiving_decision as status, t.receiving_decision,
           t.receiving_decided_by as reviewed_by, t.receiving_decided_at as reviewed_at,
           t.transferred_at as created_at, t.admin_notes,
           c.ticket_number, c.title as complaint_title, c.status as complaint_status,
           fd.name as from_department_name, fd.code as from_department_code,
           td.name as to_department_name, td.code as to_department_code,
           u1.full_name as initiated_by_name,
           u2.full_name as reviewed_by_name
    FROM complaint_transfers t
    JOIN complaints c ON t.complaint_id = c.id
    LEFT JOIN departments fd ON t.from_department_id = fd.id
    LEFT JOIN departments td ON t.to_department_id = td.id
    LEFT JOIN users u1 ON t.transferred_by = u1.id
    LEFT JOIN users u2 ON t.receiving_decided_by = u2.id
    WHERE t.id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

export const updateTransferReview = async (id, { status, reviewedBy, toDepartmentId, adminNotes }, client = db) => {
  const query = `
    UPDATE complaint_transfers
    SET receiving_decision = $2,
        receiving_decided_by = $3,
        receiving_decided_at = CURRENT_TIMESTAMP,
        to_department_id = COALESCE($4, to_department_id),
        admin_notes = COALESCE($5, admin_notes)
    WHERE id = $1
    RETURNING id, complaint_id, from_department_id, to_department_id, receiving_decision as status,
              receiving_decided_by as reviewed_by, receiving_decided_at as reviewed_at, admin_notes;
  `;
  const result = await client.query(query, [id, status, reviewedBy, toDepartmentId || null, adminNotes || null]);
  return result.rows[0] || null;
};

export const findIncomingTransfers = async (departmentId, { status = 'PENDING' } = {}) => {
  const query = `
    SELECT t.id, t.complaint_id, t.from_department_id, t.to_department_id,
           t.transferred_by as initiated_by, t.reason, t.transfer_number,
           t.receiving_decision as status, t.transferred_at as created_at, t.admin_notes,
           c.ticket_number, c.title as complaint_title, c.status as complaint_status,
           c.priority, c.street_location as address, c.created_at as complaint_created_at,
           fd.name as from_department_name, fd.code as from_department_code,
           u.full_name as initiated_by_name
    FROM complaint_transfers t
    JOIN complaints c ON t.complaint_id = c.id
    LEFT JOIN departments fd ON t.from_department_id = fd.id
    LEFT JOIN users u ON t.transferred_by = u.id
    WHERE t.to_department_id = $1 AND ($2::text IS NULL OR t.receiving_decision = $2)
    ORDER BY t.transferred_at DESC;
  `;
  const result = await db.query(query, [departmentId, status || null]);
  return result.rows;
};

export const findOutgoingTransfers = async (departmentId, { status } = {}) => {
  const query = `
    SELECT t.id, t.complaint_id, t.from_department_id, t.to_department_id,
           t.transferred_by as initiated_by, t.reason, t.transfer_number,
           t.receiving_decision as status, t.transferred_at as created_at, t.admin_notes,
           c.ticket_number, c.title as complaint_title, c.status as complaint_status,
           c.priority, c.street_location as address,
           td.name as to_department_name, td.code as to_department_code,
           u.full_name as initiated_by_name
    FROM complaint_transfers t
    JOIN complaints c ON t.complaint_id = c.id
    LEFT JOIN departments td ON t.to_department_id = td.id
    LEFT JOIN users u ON t.transferred_by = u.id
    WHERE t.from_department_id = $1 AND ($2::text IS NULL OR t.receiving_decision = $2)
    ORDER BY t.transferred_at DESC;
  `;
  const result = await db.query(query, [departmentId, status || null]);
  return result.rows;
};

export const findByComplaintId = async (complaintId) => {
  const query = `
    SELECT t.id, t.complaint_id, t.from_department_id, t.to_department_id,
           t.transferred_by as initiated_by, t.reason, t.transfer_number,
           t.receiving_decision as status, t.transferred_at as created_at, t.admin_notes,
           fd.name as from_department_name, fd.code as from_department_code,
           td.name as to_department_name, td.code as to_department_code,
           u1.full_name as initiated_by_name,
           u2.full_name as reviewed_by_name
    FROM complaint_transfers t
    JOIN departments fd ON t.from_department_id = fd.id
    LEFT JOIN departments td ON t.to_department_id = td.id
    JOIN users u1 ON t.transferred_by = u1.id
    LEFT JOIN users u2 ON t.receiving_decided_by = u2.id
    WHERE t.complaint_id = $1
    ORDER BY t.transferred_at ASC;
  `;
  const result = await db.query(query, [complaintId]);
  return result.rows;
};

export const findRepeatedTransfers = async () => {
  const query = `
    SELECT c.id as complaint_id, c.ticket_number, c.title, c.status as current_status,
           COUNT(t.id)::int as transfer_count,
           d.name as current_department_name
    FROM complaints c
    JOIN complaint_transfers t ON c.id = t.complaint_id
    JOIN departments d ON c.current_department_id = d.id
    GROUP BY c.id, c.ticket_number, c.title, c.status, d.name
    HAVING COUNT(t.id) > 1
    ORDER BY transfer_count DESC;
  `;
  const result = await db.query(query);
  return result.rows;
};

export const findAllTransfers = async ({ limit = 50, offset = 0, status } = {}) => {
  const query = `
    SELECT t.id, t.complaint_id, t.from_department_id, t.to_department_id,
           t.transferred_by as initiated_by, t.reason, t.transfer_number,
           t.receiving_decision as status, t.transferred_at as created_at, t.admin_notes,
           c.ticket_number, c.title as complaint_title, c.status as complaint_status,
           fd.name as from_department_name, fd.code as from_department_code,
           td.name as to_department_name, td.code as to_department_code,
           u.full_name as initiated_by_name,
           u2.full_name as reviewed_by_name
    FROM complaint_transfers t
    JOIN complaints c ON t.complaint_id = c.id
    LEFT JOIN departments fd ON t.from_department_id = fd.id
    LEFT JOIN departments td ON t.to_department_id = td.id
    LEFT JOIN users u ON t.transferred_by = u.id
    LEFT JOIN users u2 ON t.receiving_decided_by = u2.id
    WHERE ($3::text IS NULL OR t.receiving_decision = $3)
    ORDER BY t.transferred_at DESC
    LIMIT $1 OFFSET $2;
  `;
  const result = await db.query(query, [limit, offset, status || null]);
  return result.rows;
};

export default {
  createTransfer,
  findById,
  updateTransferReview,
  findIncomingTransfers,
  findOutgoingTransfers,
  findByComplaintId,
  findRepeatedTransfers,
  findAllTransfers
};
