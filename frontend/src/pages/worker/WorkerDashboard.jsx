import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  Wrench,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  MapPin,
  Calendar
} from 'lucide-react';
import { useComplaints, mapBackendComplaint } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { COMPLAINT_STATUS } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/dashboard/StatCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatDate, timeAgo } from '../../utils/statusHelpers';
import assignmentsApi from '../../api/assignments.api';

export const WorkerDashboard = () => {
  const { complaints } = useComplaints();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [backendTasks, setBackendTasks] = useState([]);

  useEffect(() => {
    let isMounted = true;
    assignmentsApi.getMyTasks()
      .then((tasks) => {
        if (isMounted && Array.isArray(tasks)) {
          setBackendTasks(tasks);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch backend tasks:', err.message);
      });
    return () => { isMounted = false; };
  }, [currentUser]);

  // Tasks assigned to this worker
  const workerTasks = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    complaints.forEach((c) => {
      const isAssigned =
        c.assignedWorkerId === currentUser?.id ||
        c.assignedWorkerId === currentUser?.userCode ||
        c.assignedWorkerId === 'WRK001' ||
        (currentUser?.name && c.assignedWorkerName && c.assignedWorkerName.toLowerCase() === currentUser.name.toLowerCase()) ||
        backendTasks.some((t) => t.complaint_id === c.id || t.complaint_id === c.complaintId || t.ticket_number === c.ticketNumber);

      if (isAssigned) {
        list.push(c);
        seenIds.add(c.id);
        if (c.complaintId) seenIds.add(c.complaintId);
        if (c.ticketNumber) seenIds.add(c.ticketNumber);
      }
    });

    backendTasks.forEach((bt) => {
      if (!seenIds.has(bt.complaint_id) && !seenIds.has(bt.ticket_number) && !seenIds.has(bt.id)) {
        list.push(mapBackendComplaint({
          id: bt.complaint_id || bt.id,
          ticket_number: bt.ticket_number,
          title: bt.complaint_title,
          description: bt.complaint_description,
          current_status: bt.complaint_status || 'WORKER_ASSIGNED',
          priority: bt.complaint_priority,
          street_location: bt.complaint_address,
          category_name: bt.category_name,
          sla_resolution_due_at: bt.sla_deadline,
          assigned_worker_id: bt.worker_id,
          assignment_id: bt.id,
          assignment_status: bt.status,
          citizen_name: bt.citizen_name,
          citizen_phone: bt.citizen_phone
        }));
        seenIds.add(bt.complaint_id);
      }
    });

    return list;
  }, [complaints, backendTasks, currentUser]);

  const newAssignments = workerTasks.filter(
    (c) => c.status === COMPLAINT_STATUS.WORKER_ASSIGNED
  );
  const inProgress = workerTasks.filter(
    (c) => c.status === COMPLAINT_STATUS.INSPECTION || c.status === COMPLAINT_STATUS.WORK_IN_PROGRESS || c.status === COMPLAINT_STATUS.VERIFICATION
  );
  const completed = workerTasks.filter(
    (c) => c.status === COMPLAINT_STATUS.RESOLVED || c.status === COMPLAINT_STATUS.CLOSED
  );
  const overdue = workerTasks.filter(
    (c) => c.escalation !== null || (new Date(c.slaDeadline) < new Date() && c.status !== COMPLAINT_STATUS.RESOLVED && c.status !== COMPLAINT_STATUS.CLOSED)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Field Crew Operations &mdash; ${currentUser?.name || 'Suresh Patil'}`}
        description="Daily work orders, site inspection checkpoints, and remediation evidence submissions."
        tag="Field Specialist"
        actions={
          <Button
            variant="primary"
            icon={CheckSquare}
            onClick={() => navigate('/worker/tasks')}
          >
            Open Active Work Orders ({inProgress.length + newAssignments.length})
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Assigned Tasks"
          value={workerTasks.length}
          subtext="Total allocated work orders"
          icon={CheckSquare}
          color="blue"
          onClick={() => navigate('/worker/tasks')}
        />
        <StatCard
          title="New Assignments"
          value={newAssignments.length}
          subtext="Awaiting site inspection"
          icon={Clock}
          color="amber"
          onClick={() => navigate('/worker/tasks')}
        />
        <StatCard
          title="In Progress"
          value={inProgress.length}
          subtext="Under active remediation"
          icon={Wrench}
          color="purple"
          onClick={() => navigate('/worker/tasks')}
        />
        <StatCard
          title="Completed"
          value={completed.length}
          subtext="Certified & verified"
          icon={CheckCircle2}
          color="green"
          onClick={() => navigate('/worker/history')}
        />
        <StatCard
          title="Overdue Risk"
          value={overdue.length}
          subtext="Approaching SLA deadline"
          icon={AlertOctagon}
          color="red"
          onClick={() => navigate('/worker/tasks')}
        />
      </div>

      {/* Immediate Tasks Queue */}
      <div className="gov-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Priority Field Tasks
            </h3>
            <p className="text-xs text-slate-500">
              Assigned jobs requiring site attendance and photographic proof
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => navigate('/worker/tasks')}
          >
            View all work orders
          </Button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {workerTasks.length > 0 ? (
            workerTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/worker/tasks/${task.complaintId || task.id}`)}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-600">
                        {task.id}
                      </span>
                      <Badge status={task.status} size="sm" />
                      <Badge priority={task.priority} size="sm" />
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {task.location}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Assigned {formatDate(task.submittedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/worker/tasks/${task.complaintId || task.id}`);
                    }}
                  >
                    Open Work Order
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No field tasks currently assigned to your crew.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;

