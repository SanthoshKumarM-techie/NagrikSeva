import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Wrench, Eye, MapPin, Calendar, Clock } from 'lucide-react';
import { useComplaints, mapBackendComplaint } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { COMPLAINT_STATUS, PRIORITIES } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/statusHelpers';
import assignmentsApi from '../../api/assignments.api';

export const AssignedTasks = () => {
  const { complaints } = useComplaints();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [backendTasks, setBackendTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

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

  // Filter tasks assigned to worker
  const assignedList = useMemo(() => {
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

    return list.filter((c) => {
      const matchSearch =
        !search ||
        (c.id && c.id.toLowerCase().includes(search.toLowerCase())) ||
        (c.ticketNumber && c.ticketNumber.toLowerCase().includes(search.toLowerCase())) ||
        (c.title && c.title.toLowerCase().includes(search.toLowerCase())) ||
        (c.location && c.location.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = !statusFilter || c.status === statusFilter;
      const matchPriority = !priorityFilter || c.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [complaints, backendTasks, currentUser, search, statusFilter, priorityFilter]);

  const totalPages = Math.ceil(assignedList.length / pageSize) || 1;
  const paginatedData = assignedList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      header: 'Work Order ID',
      accessor: 'id',
      sortable: true,
      className: 'font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap',
    },
    {
      header: 'Task Title & Location',
      accessor: 'title',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
            {row.title}
          </span>
          <span className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400" />
            {row.location}
          </span>
        </div>
      ),
    },
    {
      header: 'Priority',
      accessor: 'priority',
      sortable: true,
      render: (row) => <Badge priority={row.priority} size="sm" />,
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <Badge status={row.status} size="sm" />,
    },
    {
      header: 'SLA Deadline',
      accessor: 'slaDeadline',
      sortable: true,
      render: (row) => (
        <span className="text-xs whitespace-nowrap">
          {formatDate(row.slaDeadline)}
        </span>
      ),
    },
    {
      header: 'Action',
      render: (row) => (
        <Button
          size="sm"
          variant="primary"
          icon={Wrench}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/worker/tasks/${row.complaintId || row.id}`);
          }}
        >
          Execute
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Work Orders"
        description="Active maintenance jobs assigned to your specialist crew."
        tag={`${assignedList.length} Tasks`}
      />

      {/* Filter Toolbar */}
      <div className="gov-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            placeholder="Search work order ID, title, road..."
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={Object.values(COMPLAINT_STATUS)}
            placeholder="All Statuses"
          />

          <Select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={Object.values(PRIORITIES)}
            placeholder="All Priorities"
          />
        </div>
      </div>

      {/* Table */}
      <div className="space-y-2">
        <DataTable
          columns={columns}
          data={paginatedData}
          onRowClick={(row) => navigate(`/worker/tasks/${row.complaintId || row.id}`)}
          emptyTitle="No assigned tasks"
          emptyDescription="You have no field tasks matching this criteria."
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={assignedList.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default AssignedTasks;

