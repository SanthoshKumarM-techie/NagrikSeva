import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Filter,
  Layers,
  Map as MapIcon,
  Grid,
  Users,
  Search,
  CheckCircle2,
  ThumbsUp,
  Sparkles
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, COMPLAINT_STATUS } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import ComplaintCard from '../../components/dashboard/ComplaintCard';
import Badge from '../../components/common/Badge';

export const ExploreComplaints = () => {
  const { complaints, addSupporter, categories, wards } = useComplaints();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [activePin, setActivePin] = useState(null);

  const categoryOptions = categories && categories.length > 0 ? categories.map(c => c.name) : CATEGORIES;
  const wardsList = wards && wards.length > 0
    ? wards.map(w => w.ward_number ? `Ward ${w.ward_number} - ${w.name}` : w.name)
    : [
      'Ward 80 - Hoysala Nagar (Indiranagar)',
      'Ward 151 - Koramangala',
      'Ward 174 - HSR Layout',
      'Ward 153 - Jayanagar',
      'Ward 84 - Hagadur (Whitefield)',
      'Ward 45 - Malleshwaram',
      'Ward 176 - BTM Layout',
      'Ward 110 - Sampangirama Nagar (MG Road)',
    ];

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchSearch =
        !search ||
        (c.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.ticketNumber || c.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.location || c.address || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase());

      const matchCategory = !selectedCategory || c.category === selectedCategory;
      const matchStatus = !selectedStatus || c.status === selectedStatus;
      const matchWard = !selectedWard || (c.ward && c.ward.includes(selectedWard));

      return matchSearch && matchCategory && matchStatus && matchWard;
    });
  }, [complaints, search, selectedCategory, selectedStatus, selectedWard]);

  const handleSupport = (e, complaint) => {
    e.stopPropagation();
    addSupporter(complaint.id, currentUser);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Explore Civic Grievances"
        description="Discover reports in your zone, verify public works, and endorse active neighborhood grievances."
        tag="Community Redressal"
        actions={
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'map'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Zonal Map</span>
            </button>
          </div>
        }
      />

      {/* Filters Bar */}
      <div className="gov-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by ID, title, road..."
          />

          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={categoryOptions}
            placeholder="All Categories"
          />

          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={Object.values(COMPLAINT_STATUS)}
            placeholder="All Statuses"
          />

          <Select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            options={wardsList}
            placeholder="All Municipal Wards"
          />
        </div>

        {(search || selectedCategory || selectedStatus || selectedWard) && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing <strong className="text-slate-800 dark:text-slate-200">{filteredComplaints.length}</strong> matching reports
            </span>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setSelectedStatus('');
                setSelectedWard('');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Content View: Grid or Map */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredComplaints.length > 0 ? (
            filteredComplaints.map((c) => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                onClick={(item) => navigate(`/citizen/complaints/${item.id}`)}
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs">
              No civic complaints matched your filters. Try widening your search terms.
            </div>
          )}
        </div>
      ) : (
        /* Map-style Interface */
        <div className="gov-card overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Bengaluru Municipal Corporation Grievance Hotspots
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Interactive GIS Simulation &bull; Click pin to view summary
            </span>
          </div>

          <div className="relative h-[480px] bg-slate-100 dark:bg-slate-950 p-6 flex items-center justify-center overflow-hidden">
            {/* Stylized GIS Grid Map background */}
            <div className="absolute inset-0 opacity-15 dark:opacity-20 pointer-events-none bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Simulated Road Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-300 dark:stroke-slate-800" strokeWidth="2">
              <line x1="10%" y1="20%" x2="90%" y2="80%" strokeDasharray="4 4" />
              <line x1="80%" y1="10%" x2="20%" y2="90%" strokeDasharray="4 4" />
              <line x1="50%" y1="0%" x2="50%" y2="100%" strokeDasharray="6 6" />
              <line x1="0%" y1="50%" x2="100%" y2="50%" strokeDasharray="6 6" />
            </svg>

            {/* Pins on the Map */}
            {filteredComplaints.map((c, i) => {
              // Distribute pseudo coordinates across map
              const leftPercent = 15 + ((i * 19 + 7) % 70);
              const topPercent = 15 + ((i * 23 + 13) % 70);

              const isSelected = activePin?.id === c.id;

              return (
                <div
                  key={c.id}
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                >
                  <button
                    type="button"
                    onClick={() => setActivePin(isSelected ? null : c)}
                    className={`group relative flex items-center justify-center transition-all ${isSelected ? 'scale-125 z-20' : 'hover:scale-110'
                      }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md font-bold text-[10px] ${c.priority === 'Critical'
                          ? 'bg-rose-600 ring-4 ring-rose-300/40'
                          : c.priority === 'High'
                            ? 'bg-amber-600 ring-4 ring-amber-300/40'
                            : 'bg-blue-600 ring-4 ring-blue-300/40'
                        }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </div>

                    <span className="absolute -bottom-5 whitespace-nowrap bg-black/75 text-white text-[10px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {c.id}
                    </span>
                  </button>
                </div>
              );
            })}

            {/* Active Pin Popup Card */}
            {activePin && (
              <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-4 z-30 animate-fade-in">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600">
                      {activePin.id}
                    </span>
                    <Badge status={activePin.status} size="sm" />
                  </div>
                  <button
                    onClick={() => setActivePin(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm"
                  >
                    &times;
                  </button>
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {activePin.title}
                </h4>
                <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {activePin.location}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-500" />
                    {activePin.supporterCount} citizens backing
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => navigate(`/citizen/complaints/${activePin.id}`)}
                    >
                      Inspect Details
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreComplaints;

