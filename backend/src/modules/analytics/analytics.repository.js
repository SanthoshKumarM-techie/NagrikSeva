import db from '../../config/database.js';

export const getDepartmentAnalytics = async (departmentId) => {
  // Status breakdown
  const statusQuery = `
    SELECT status as current_status, COUNT(*)::int as count
    FROM complaints
    WHERE current_department_id = $1
    GROUP BY status;
  `;

  // Category breakdown
  const categoryQuery = `
    SELECT cat.name as category_name, COUNT(c.id)::int as count
    FROM complaints c
    JOIN complaint_categories cat ON c.category_id = cat.id
    WHERE c.current_department_id = $1
    GROUP BY cat.name
    ORDER BY count DESC;
  `;

  // Average resolution time in hours
  const avgTimeQuery = `
    SELECT 
      ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)::numeric, 1) as avg_resolution_hours,
      COUNT(*) FILTER (WHERE resolved_at IS NOT NULL AND resolved_at <= sla_resolution_due_at)::int as within_sla_count,
      COUNT(*) FILTER (WHERE resolved_at IS NOT NULL)::int as total_resolved_count
    FROM complaints
    WHERE current_department_id = $1 AND resolved_at IS NOT NULL;
  `;

  // Worker performance leaderboard
  const workerQuery = `
    SELECT u.full_name, w.specializations as specialization, w.rating,
           (SELECT COUNT(*)::int FROM worker_assignments a WHERE a.worker_id = u.id AND a.status IN ('ASSIGNED', 'ACCEPTED', 'INSPECTION', 'IN_PROGRESS')) as active_tasks_count,
           COUNT(a.id) FILTER (WHERE a.status = 'COMPLETED')::int as completed_tasks
    FROM users u
    JOIN worker_profiles w ON u.id = w.user_id
    LEFT JOIN worker_assignments a ON u.id = a.worker_id
    WHERE u.department_id = $1 AND u.is_active = TRUE
    GROUP BY u.id, u.full_name, w.specializations, w.rating
    ORDER BY completed_tasks DESC, w.rating DESC
    LIMIT 10;
  `;

  // Trend: complaints over last 6 months
  const trendQuery = `
    SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*)::int as count
    FROM complaints
    WHERE current_department_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY month
    ORDER BY month ASC;
  `;

  const [statusRes, categoryRes, avgTimeRes, workerRes, trendRes] = await Promise.all([
    db.query(statusQuery, [departmentId]),
    db.query(categoryQuery, [departmentId]),
    db.query(avgTimeQuery, [departmentId]),
    db.query(workerQuery, [departmentId]),
    db.query(trendQuery, [departmentId])
  ]);

  const avgData = avgTimeRes.rows[0] || {};
  const withinSla = parseInt(avgData.within_sla_count || 0, 10);
  const totalResolved = parseInt(avgData.total_resolved_count || 0, 10);
  const slaComplianceRate = totalResolved > 0 ? Math.round((withinSla / totalResolved) * 100) : 100;

  return {
    statusBreakdown: statusRes.rows,
    categoryBreakdown: categoryRes.rows,
    avgResolutionHours: parseFloat(avgData.avg_resolution_hours || 0),
    slaComplianceRate,
    workerLeaderboard: workerRes.rows,
    monthlyTrend: trendRes.rows
  };
};

export const getCityAnalytics = async () => {
  // Overall city stats
  const citySummaryQuery = `
    SELECT
      COUNT(*)::int as total_complaints,
      COUNT(*) FILTER (WHERE status IN ('RESOLVED', 'CLOSED'))::int as resolved_complaints,
      COUNT(*) FILTER (WHERE status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED'))::int as active_complaints,
      COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM escalations e WHERE e.complaint_id = complaints.id AND e.status IN ('OPEN', 'ACKNOWLEDGED')))::int as escalated_complaints,
      (SELECT COUNT(*)::int FROM users WHERE role = 'CITIZEN'::user_role) as total_citizens,
      (SELECT COUNT(*)::int FROM departments WHERE is_active = TRUE) as active_departments
    FROM complaints;
  `;

  // Department comparison
  const deptQuery = `
    SELECT d.id, d.name, d.code,
           COUNT(c.id)::int as total_complaints,
           COUNT(c.id) FILTER (WHERE c.status IN ('RESOLVED', 'CLOSED'))::int as resolved_count,
           COUNT(c.id) FILTER (WHERE EXISTS(SELECT 1 FROM escalations e WHERE e.complaint_id = c.id AND e.status IN ('OPEN', 'ACKNOWLEDGED')))::int as escalated_count,
           ROUND(AVG(CASE WHEN c.resolved_at IS NOT NULL THEN EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 3600 END)::numeric, 1) as avg_resolution_hours
    FROM departments d
    LEFT JOIN complaints c ON d.id = c.current_department_id
    GROUP BY d.id, d.name, d.code
    ORDER BY total_complaints DESC;
  `;

  // Ward performance breakdown
  const wardQuery = `
    SELECT w.ward_number, w.name as ward_name, w.zone_name as zone,
           COUNT(c.id)::int as complaint_count,
           COUNT(c.id) FILTER (WHERE c.status IN ('RESOLVED', 'CLOSED'))::int as resolved_count
    FROM municipal_wards w
    LEFT JOIN complaints c ON w.id = c.ward_id
    GROUP BY w.id, w.ward_number, w.name, w.zone_name
    ORDER BY complaint_count DESC
    LIMIT 15;
  `;

  // City-wide monthly trend
  const trendQuery = `
    SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*)::int as count
    FROM complaints
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY month
    ORDER BY month ASC;
  `;

  const [summaryRes, deptRes, wardRes, trendRes] = await Promise.all([
    db.query(citySummaryQuery),
    db.query(deptQuery),
    db.query(wardQuery),
    db.query(trendQuery)
  ]);

  return {
    summary: summaryRes.rows[0],
    departmentComparison: deptRes.rows,
    wardBreakdown: wardRes.rows,
    monthlyTrend: trendRes.rows
  };
};

export default {
  getDepartmentAnalytics,
  getCityAnalytics
};
