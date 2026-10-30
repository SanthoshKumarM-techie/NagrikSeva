import auditRepository from './audit.repository.js';

export async function logActivity({ actorId, action, entityType, entityId, details, ipAddress }, db) {
  try {
    return await auditRepository.createAuditLog({
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip_address: ipAddress
    }, db);
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

export async function logEvent({ userId, actorId, action, entityType, entityId, details, ipAddress, userAgent }, db) {
  const mergedDetails = details || {};
  if (userAgent) {
    mergedDetails.userAgent = userAgent;
  }
  return await logActivity({
    actorId: actorId || userId,
    action,
    entityType,
    entityId,
    details: mergedDetails,
    ipAddress
  }, db);
}

export default {
  logActivity,
  logEvent
};
