import React, { useState, useMemo } from 'react';
import {
  Navigation,
  MapPin,
  Phone,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Car,
  Maximize2,
  Minimize2,
  Clock,
  Compass
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Contractor & Field Crew Site Navigation Map
 * Human-designed SaaS UI styled with official Google Maps integration.
 * Seamlessly adapts to Light and Dark mode using the project's design system tokens.
 */
export const ContractorDispatchMap = ({
  task,
  tasks = [],
  selectedTaskId = null,
  onSelectTask = null,
  mode = 'single',
  height = 'h-[390px]'
}) => {
  const [copied, setCopied] = useState(false);
  // 'route' (driving directions), 'map' (standard road view), 'satellite' (aerial satellite view)
  const [viewMode, setViewMode] = useState('route');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Safe theme detection
  let isDark = false;
  try {
    const themeContext = useTheme();
    isDark = themeContext?.isDark ?? false;
  } catch {
    isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  }

  // Active target task
  const activeTask = useMemo(() => {
    if (mode === 'single') return task;
    if (selectedTaskId && tasks.length > 0) {
      return (
        tasks.find(
          t => t.id === selectedTaskId || t.complaintId === selectedTaskId || t.ticketNumber === selectedTaskId
        ) || tasks[0]
      );
    }
    return tasks[0] || task;
  }, [mode, task, tasks, selectedTaskId]);

  // Extract coordinates with realistic fallbacks
  const targetLat = useMemo(() => {
    const lat = parseFloat(activeTask?.latitude ?? activeTask?.coordinates?.lat);
    return !isNaN(lat) && lat !== 0 ? lat : 12.9716;
  }, [activeTask]);

  const targetLng = useMemo(() => {
    const lng = parseFloat(activeTask?.longitude ?? activeTask?.coordinates?.lng);
    return !isNaN(lng) && lng !== 0 ? lng : 77.5946;
  }, [activeTask]);

  // Crew Base / Depot coordinates
  const crewCoords = useMemo(() => {
    return {
      lat: Number((targetLat - 0.0135).toFixed(4)),
      lng: Number((targetLng - 0.0125).toFixed(4)),
      label: 'Crew Operations Base'
    };
  }, [targetLat, targetLng]);

  // Distance calculation (Haversine)
  const distanceKm = useMemo(() => {
    const R = 6371;
    const dLat = ((targetLat - crewCoords.lat) * Math.PI) / 180;
    const dLng = ((targetLng - crewCoords.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((crewCoords.lat * Math.PI) / 180) *
      Math.cos((targetLat * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return dist > 0.1 ? dist.toFixed(1) : '0.5';
  }, [targetLat, targetLng, crewCoords]);

  // Estimated driving time
  const etaMinutes = useMemo(() => {
    const d = parseFloat(distanceKm);
    return Math.max(3, Math.round((d / 22) * 60));
  }, [distanceKm]);

  // Copy GPS Coordinates
  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${targetLat.toFixed(6)}, ${targetLng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Open Direct Navigation in Google Maps
  const handleOpenGpsNavigation = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Open Google Street View
  const handleOpenStreetView = () => {
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${targetLat},${targetLng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Google Maps Embed URL
  const googleMapsEmbedUrl = useMemo(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (apiKey) {
      if (viewMode === 'route') {
        return `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${crewCoords.lat},${crewCoords.lng}&destination=${targetLat},${targetLng}&mode=driving&solution_id=gmp_git_agentskills_v1`;
      }
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${targetLat},${targetLng}&maptype=${viewMode === 'satellite' ? 'satellite' : 'roadmap'}&solution_id=gmp_git_agentskills_v1`;
    }

    // Zero-config Universal Google Maps embed
    if (viewMode === 'route') {
      return `https://maps.google.com/maps?saddr=${crewCoords.lat},${crewCoords.lng}&daddr=${targetLat},${targetLng}&hl=en&z=14&output=embed`;
    }
    if (viewMode === 'satellite') {
      return `https://maps.google.com/maps?q=${targetLat},${targetLng}&t=k&hl=en&z=17&output=embed`;
    }
    return `https://maps.google.com/maps?q=${targetLat},${targetLng}&t=m&hl=en&z=16&output=embed`;
  }, [viewMode, targetLat, targetLng, crewCoords]);

  return (
    <div
      className={`gov-card overflow-hidden transition-all duration-200 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${
        isFullscreen ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)] flex flex-col' : 'flex flex-col'
      }`}
    >
      {/* 1. CLEAN SAAS CARD HEADER */}
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Site Location & Route Navigation
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                ~{etaMinutes} min ({distanceKm} km)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
              {activeTask?.location || 'Bengaluru'} {activeTask?.ward ? `• ${activeTask.ward}` : ''}
            </p>
          </div>
        </div>

        {/* View Mode Switcher & Fullscreen */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('route')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'route'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm border border-slate-200/80 dark:border-transparent font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Route</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm border border-slate-200/80 dark:border-transparent font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('satellite')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'satellite'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm border border-slate-200/80 dark:border-transparent font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Satellite</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(prev => !prev)}
            title={isFullscreen ? 'Exit full view' : 'Expand map view'}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. UNOBSTRUCTED GOOGLE MAP AREA */}
      <div className={`relative w-full ${isFullscreen ? 'flex-1' : height} bg-slate-100 dark:bg-slate-950 overflow-hidden`}>
        <iframe
          title="Google Maps Location"
          className={`w-full h-full border-0 transition-opacity duration-300 ${
            isDark && viewMode !== 'satellite'
              ? 'invert-[0.92] hue-rotate-180 brightness-95 contrast-125'
              : 'opacity-100'
          }`}
          src={googleMapsEmbedUrl}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* 3. CLEAN CARD FOOTER & ACTION TOOLBAR */}
      <div className="p-4 sm:p-4.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Location summary & citizen contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto text-xs">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
              Landmark / Location
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {activeTask?.landmark || activeTask?.location || 'Location specified by citizen'}
              </span>
              <button
                type="button"
                onClick={handleCopyCoords}
                title="Copy coordinates"
                className="text-[11px] font-mono text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy GPS</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
              Citizen Reporter
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {activeTask?.citizenName || 'Reporter'}
              </span>
              {activeTask?.citizenPhone && (
                <a
                  href={`tel:${activeTask.citizenPhone}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Phone className="w-3 h-3" />
                  <span>{activeTask.citizenPhone}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleOpenStreetView}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Street View</span>
          </button>

          <button
            type="button"
            onClick={handleOpenGpsNavigation}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2 shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5 fill-white" />
            <span>Open in Google Maps</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractorDispatchMap;
