import { ROLES } from './constants';

/**
 * Returns standard 3-letter prefix for a role.
 */
export const getRolePrefix = (role) => {
  if (!role) return 'USR';
  const r = String(role).toLowerCase();
  if (r.includes('citizen')) return 'CIT';
  if (r.includes('worker') || r.includes('contractor') || r.includes('crew')) return 'WRK';
  if (r.includes('officer')) return 'OFF';
  if (r.includes('admin')) return 'ADM';
  return 'USR';
};

/**
 * Formats a clean, role-distinct User ID (e.g. CIT-001, WRK-403, OFF-402, ADM-404).
 * Guarantees that every role has its own distinctive prefix and a unique identifier.
 */
export const formatUserCode = (user, fallbackRole) => {
  if (!user && !fallbackRole) return '';
  const role = user?.role || fallbackRole || '';
  const prefix = getRolePrefix(role);

  // 1. If user already has an explicit userCode / user_code
  const rawCode = user?.userCode || user?.user_code;
  if (rawCode && typeof rawCode === 'string') {
    const trimmed = rawCode.trim();
    // Matches e.g. CIT001, WRK001, OFF001, ADM001 -> CIT-001
    const codeMatch = trimmed.match(/^([A-Za-z]{3})[-_]?(\d+)$/);
    if (codeMatch) {
      return `${codeMatch[1].toUpperCase()}-${codeMatch[2]}`;
    }
    if (trimmed.toUpperCase().startsWith(`${prefix}-`)) {
      return trimmed.toUpperCase();
    }
    if (trimmed.length <= 8 && !trimmed.includes('-')) {
      const nums = trimmed.replace(/\D/g, '');
      return `${prefix}-${nums.slice(-3) || trimmed}`;
    }
  }

  // 2. Derive distinct unique ID from UUID or numeric ID
  const rawId = String(user?.id || user?.userId || '');
  if (rawId) {
    const digitsOnly = rawId.replace(/\D/g, '');
    if (digitsOnly.length >= 3) {
      return `${prefix}-${digitsOnly.slice(-3)}`;
    }
    const alphanumeric = rawId.replace(/[^a-zA-Z0-9]/g, '');
    if (alphanumeric.length >= 3) {
      return `${prefix}-${alphanumeric.slice(-3).toUpperCase()}`;
    }
  }

  return `${prefix}-001`;
};

/**
 * Categorizes and validates whether an authenticated user's role matches the required gate/portal.
 * E.g., at Citizen Portal, only Citizen accounts are accepted.
 */
export const checkRoleMatchesExpected = (displayRole, rawRole, expectedPortalOrRole) => {
  if (!expectedPortalOrRole) return true;
  const exp = String(expectedPortalOrRole).toLowerCase().trim();
  const dRole = String(displayRole || '').toLowerCase().trim();
  const rRole = String(rawRole || '').toLowerCase().trim();

  if (exp.includes('citizen')) {
    return dRole.includes('citizen') || rRole === 'citizen';
  }
  if (exp.includes('worker') || exp.includes('contractor') || exp.includes('crew')) {
    return dRole.includes('worker') || dRole.includes('contractor') || dRole.includes('crew') || rRole === 'field_worker';
  }
  if (exp.includes('officer')) {
    return dRole.includes('officer') || rRole === 'department_officer';
  }
  if (exp.includes('admin')) {
    return dRole.includes('admin') || rRole === 'super_admin';
  }

  return dRole === exp || rRole === exp;
};

export default {
  getRolePrefix,
  formatUserCode,
  checkRoleMatchesExpected
};
