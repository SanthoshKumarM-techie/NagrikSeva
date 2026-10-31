import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Wrench,
  CheckCircle2,
  Clock,
  Star,
  Phone,
  Mail,
  UserPlus,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { COMPLAINT_STATUS } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';

export const WorkerAssignments = () => {
  const { workers, complaints, assignWorker } = useComplaints();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const officerDept = currentUser?.department || 'Roads & Infrastructure';

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // Pending complaints awaiting worker assignment in officer's department
  const unassignedComplaints = complaints.filter(
    (c) =>
      c.department === officerDept &&
      (!c.assignedWorkerId || c.status === COMPLAINT_STATUS.SUBMITTED || c.status === COMPLAINT_STATUS.ACKNOWLEDGED)
  );

  const handleOpenAssignModal = (worker) => {
    setSelectedWorker(worker);
    setSelectedComplaintId(unassignedComplaints[0]?.id || '');
    setAssignmentNotes('');
    setAssignModalOpen(true);
  };

  const handleConfirmAssignment = () => {
    if (!selectedWorker || !selectedComplaintId) {
      alert('Please select both a worker and a complaint.');
      return;
    }
    assignWorker(selectedComplaintId, selectedWorker.id, assignmentNotes, currentUser);
    setAssignModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contractor & Crew Deployments"
        description="Monitor contractor and crew workloads, assign municipal tasks, and optimize dispatch."
        tag="Operations"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Unassigned tickets: <strong className="text-amber-600 font-bold">{unassignedComplaints.length}</strong>
            </span>
          </div>
        }
      />

      {/* Field Workers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {workers.map((worker) => {
          const workerTasks = complaints.filter((c) => c.assignedWorkerId === worker.id);
          const activeTasks = workerTasks.filter(
            (c) => c.status !== COMPLAINT_STATUS.RESOLVED && c.status !== COMPLAINT_STATUS.CLOSED
          );

          return (
            <div key={worker.id} className="gov-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={worker.avatar}
                      alt={worker.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {worker.name}
                      </h4>
                      <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                        {worker.id} &bull; {worker.department}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      activeTasks.length >= 3
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {activeTasks.length >= 3 ? 'High Load' : 'Available'}
                  </span>
                </div>

                {/* Worker Metrics */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center text-xs mb-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Active</span>
                    <strong className="font-bold text-slate-800 dark:text-slate-200">
                      {activeTasks.length}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Completed</span>
                    <strong className="font-bold text-slate-800 dark:text-slate-200">
                      {worker.completedTasks || 40}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Rating</span>
                    <strong className="font-bold text-amber-600 flex items-center justify-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {worker.rating || 4.8}
                    </strong>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="mb-3">
                  <span className="text-[11px] text-slate-400 block mb-1">Specializations:</span>
                  <div className="flex flex-wrap gap-1">
                    {worker.skills?.map((skill, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Zone & Phone */}
                <div className="text-xs text-slate-500 space-y-1 mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{worker.zone || 'Zone Central'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{worker.phone}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="primary"
                  icon={UserPlus}
                  className="w-full"
                  onClick={() => handleOpenAssignModal(worker)}
                  disabled={unassignedComplaints.length === 0}
                >
                  {unassignedComplaints.length === 0 ? 'No Unassigned Tickets' : 'Assign to Issue'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assignment Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Task to ${selectedWorker?.name}`}
        description="Select a pending ticket for immediate field inspection and repair."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={UserPlus}
              onClick={handleConfirmAssignment}
              disabled={!selectedComplaintId}
            >
              Confirm Assignment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Pending Unassigned Complaint"
            value={selectedComplaintId}
            onChange={(e) => setSelectedComplaintId(e.target.value)}
            options={unassignedComplaints.map((c) => ({
              value: c.id,
              label: `${c.id} — ${c.title} (${c.location})`,
            }))}
            required
          />

          <Input
            label="Special Instructions / Priority Notes"
            type="textarea"
            rows={3}
            placeholder="e.g. Conduct initial inspection before 11:00 AM. Coordinate with traffic marshals."
            value={assignmentNotes}
            onChange={(e) => setAssignmentNotes(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default WorkerAssignments;

