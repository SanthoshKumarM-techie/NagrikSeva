import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, PlusCircle, Search, Eye, Filter, ArrowUpDown } from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { COMPLAINT_STATUS, CATEGORIES } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import { formatDate, timeAgo } from '../../utils/statusHelpers';

import complaintsApi from '../../api/complaints.api';
import { mapBackendComplaint } from '../../context/ComplaintContext';

export const MyComplaints = () => {
  const { complaints, categories } = useComplaints();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [backendMyComplaints, setBackendMyComplaints] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    let isMounted = true;
    complaintsApi.getMyComplaints().then((data) => {
      if (isMounted && data) {
        setBackendMyComplaints(data.map(mapBackendComplaint));
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [currentUser]);

  const activePool = backendMyComplaints || complaints;

  // Filter complaints related to this user (submitted or supported)
  const userComplaints = useMemo(() => {
    return activePool.filter((c) => {
      const isMine =
        backendMyComplaints !== null ||
        c.citizenId === currentUser?.id ||
        c.citizenId === currentUser?.userCode ||
        c.submitted_by === currentUser?.id ||
        (c.supporters && (c.supporters.includes(currentUser?.id) || c.supporters.includes(currentUser?.userCode)));

      if (!isMine) return false;

      const matchSearch =
        !search ||
        (c.ticketNumber || c.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.location || c.address || '').toLowerCase().includes(search.toLowerCase());

      const matchStatus = !statusFilter || c.status === statusFilter;
      const matchCat = !categoryFilter || c.category === categoryFilter;

      return matchSearch && matchStatus && matchCat;
    });
  }, [activePool, backendMyComplaints, currentUser, search, statusFilter, categoryFilter]);

  const totalPages = Math.ceil(userComplaints.length / pageSize) || 1;
  const paginatedData = userComplaints.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      header: 'Complaint ID',
      accessor: 'id',
      sortable: true,
      className: 'font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap',
    },
    {
      header: 'Issue Headline',
      accessor: 'title',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
            {row.title}
          </span>
          <span className="text-[11px] text-slate-500 line-clamp-1">{row.location}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      sortable: true,
      className: 'whitespace-nowrap',
    },
    {
      header: 'Submitted',
      accessor: 'submittedAt',
      sortable: true,
      render: (row) => formatDate(row.submittedAt),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <Badge status={row.status} size="sm" />,
    },
    {
      header: 'Department',
      accessor: 'department',
      sortable: true,
      className: 'text-xs whitespace-nowrap',
    },
    {
      header: 'Last Update',
      render: (row) => {
        const lastTimeline = row.timeline && row.timeline.length > 0 ? row.timeline[row.timeline.length - 1] : null;
        return (
          <span className="text-[11px] text-slate-500 whitespace-nowrap">
            {lastTimeline ? timeAgo(lastTimeline.timestamp) : 'Recent'}
          </span>
        );
      },
    },
    {
      header: 'Action',
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          icon={Eye}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/citizen/complaints/${row.id}`);
          }}
        >
          Track
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Civic Grievances"
        description="Monitor status updates, verify contractor remediations, and confirm resolution for all your cases."
        tag={`${userComplaints.length} Total`}
        actions={
          <Button
            variant="primary"
            icon={PlusCircle}
            onClick={() => navigate('/citizen/create')}
          >
            Register Complaint
          </Button>
        }
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
            placeholder="Search by ID, keyword..."
          />

          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={categories && categories.length > 0 ? categories.map(c => c.name) : CATEGORIES}
            placeholder="All Categories"
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
        </div>
      </div>

      {/* Data Table */}
      <div className="space-y-2">
        <DataTable
          columns={columns}
          data={paginatedData}
          onRowClick={(row) => navigate(`/citizen/complaints/${row.id}`)}
          emptyTitle="No complaints found"
          emptyDescription="You haven't filed or supported any grievances matching this filter criteria."
          emptyActionLabel="Register First Grievance"
          emptyAction={() => navigate('/citizen/create')}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={userComplaints.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default MyComplaints;

