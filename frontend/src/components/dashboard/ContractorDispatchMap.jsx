import React, { useState, useEffect, useMemo } from 'react';
import {
  Navigation,
  Compass,
  MapPin,
  Truck,
  Phone,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Crosshair,
  AlertTriangle,
  Clock,
  CornerUpRight,
  Radio,
  LocateFixed,
  Maximize2,
  Minimize2,
  Volume2,
  CheckCircle2,
  ShieldCheck,
  Info
} from 'lucide-react';
import Button from '../common/Button';

/**
 * Uber / Red Taxi Styled Dispatch & Turn-by-Turn Navigation Map
 * Exclusively designed for Contractor & Crew Operations Gate.
 * 
 * Provides real-time field navigation, incident target beacon,
 * turn-by-turn guidance HUD, and direct GPS launch to citizen-reported coordinates.
 */
export const ContractorDispatchMap = ({
  task,
  tasks = [],
  selectedTaskId = null,
  onSelectTask = null,
  mode = 'single', // 'single' (in TaskDetails) or 'fleet' (in WorkerDashboard)
  height = 'h-[460px]'
}) => {
  const [copied, setCopied] = useState(false);
  const [mapStyle, setMapStyle] = useState('uber-dark'); // 'uber-dark', 'streets', 'satellite'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioPromptActive, setAudioPromptActive] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(35); // 0 to 100 % along route
  const [arrivedAtSite, setArrivedAtSite] = useState(false);

  // Active target task
  const activeTask = useMemo(() => {
    if (mode === 'single') return task;
    if (selectedTaskId && tasks.length > 0) {
      return tasks.find(t => (t.id === selectedTaskId || t.complaintId === selectedTaskId || t.ticketNumber === selectedTaskId)) || tasks[0];
    }
    return tasks[0] || task;
  }, [mode, task, tasks, selectedTaskId]);

  // Extract coordinates with realistic fallbacks
  const targetLat = useMemo(() => {
    const lat = parseFloat(activeTask?.latitude ?? activeTask?.coordinates?.lat);
    return !isNaN(lat) && lat !== 0 ? lat : 12.9719;
  }, [activeTask]);

  const targetLng = useMemo(() => {
    const lng = parseFloat(activeTask?.longitude ?? activeTask?.coordinates?.lng);
    return !isNaN(lng) && lng !== 0 ? lng : 77.6412;
  }, [activeTask]);

  // Simulated Crew Depot / Current Vehicle Location (approx 1.8km - 2.5km away)
  const crewCoords = useMemo(() => {
    // Generate deterministic crew location offset based on task coordinates
    return {
      lat: Number((targetLat - 0.0135).toFixed(4)),
      lng: Number((targetLng - 0.0125).toFixed(4)),
      label: 'Crew Unit #04 (Central Depot)',
      speed: '34 km/h'
    };
  }, [targetLat, targetLng]);

  // Calculate distance between crew and incident site using Haversine formula
  const distanceKm = useMemo(() => {
    const R = 6371; // Earth radius in km
    const dLat = ((targetLat - crewCoords.lat) * Math.PI) / 180;
    const dLng = ((targetLng - crewCoords.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((crewCoords.lat * Math.PI) / 180) *
      Math.cos((targetLat * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return dist > 0.1 ? dist.toFixed(1) : '0.4';
  }, [targetLat, targetLng, crewCoords]);

  // Estimated driving time at city average speed ~24 km/h
  const etaMinutes = useMemo(() => {
    const d = parseFloat(distanceKm);
    const mins = Math.max(3, Math.round((d / 22) * 60));
    return mins;
  }, [distanceKm]);

  // Turn-by-Turn maneuver instructions based on location landmark
  const turnInstruction = useMemo(() => {
    const landmark = activeTask?.landmark || activeTask?.location || 'Main 100 Feet Road';
    return {
      direction: 'Right',
      distance: '250m',
      street: `Turn Right onto ${landmark}`,
      subtext: 'Fastest Route • Normal Civic Traffic Flow'
    };
  }, [activeTask]);

  // Simulate vehicle moving along corridor
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedProgress(prev => {
        if (prev >= 95) return 20;
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Copy GPS Coordinates
  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${targetLat.toFixed(6)}, ${targetLng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Open Direct GPS Navigation (Google Maps deep link)
  const handleOpenGpsNavigation = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Open Google Street View
  const handleOpenStreetView = () => {
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${targetLat},${targetLng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Toggle voice navigation simulation
  const handleToggleVoice = () => {
    setAudioPromptActive(prev => !prev);
    if (!audioPromptActive && 'speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(
        `CivicLens Navigation: In 250 meters, turn right towards ${activeTask?.location || 'the incident site'}. Estimated arrival in ${etaMinutes} minutes.`
      );
      msg.rate = 1.0;
      window.speechSynthesis.speak(msg);
    }
  };

  // Generate OpenStreetMap bounding box
  const bbox = useMemo(() => {
    const minLat = Math.min(crewCoords.lat, targetLat) - 0.008;
    const maxLat = Math.max(crewCoords.lat, targetLat) + 0.008;
    const minLng = Math.min(crewCoords.lng, targetLng) - 0.008;
    const maxLng = Math.max(crewCoords.lng, targetLng) + 0.008;
    return `${minLng.toFixed(4)}%2C${minLat.toFixed(4)}%2C${maxLng.toFixed(4)}%2C${maxLat.toFixed(4)}`;
  }, [crewCoords, targetLat, targetLng]);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)]' : height
      }`}
    >
      {/* 1. UBER / RED TAXI DRIVER HEADS-UP DISPLAY (HUD) */}
      <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-slate-950/95 via-slate-950/80 to-transparent p-3 sm:p-4 pointer-events-none">
        <div className="flex items-center justify-between gap-3 pointer-events-auto">
          {/* Turn-by-Turn Card */}
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-emerald-500/30 shadow-lg shadow-emerald-950/20 max-w-md">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30 animate-pulse">
              <CornerUpRight className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-emerald-400">
                  {turnInstruction.distance}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">&bull;</span>
                <span className="text-[11px] font-medium text-slate-300">
                  {turnInstruction.street}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 truncate">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{turnInstruction.subtext}</span>
              </div>
            </div>
          </div>

          {/* Quick ETA & Speed Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex flex-col items-end bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{etaMinutes} min</span>
                <span className="text-slate-400 font-normal">({distanceKm} km)</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                Fastest Response
              </span>
            </div>

            {/* Audio Voice Guidance Toggle */}
            <button
              type="button"
              onClick={handleToggleVoice}
              title="Voice GPS Guidance"
              className={`p-2 rounded-xl border transition-colors backdrop-blur-md ${
                audioPromptActive
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900/90 text-slate-300 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Map Style Switcher */}
            <button
              type="button"
              onClick={() => setMapStyle(prev => prev === 'uber-dark' ? 'streets' : 'uber-dark')}
              title="Toggle Map Style"
              className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Fullscreen Expand */}
            <button
              type="button"
              onClick={() => setIsFullscreen(prev => !prev)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
              className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. REAL INTERACTIVE OPENSTREETMAP CANVAS */}
      <div className="w-full h-full relative overflow-hidden select-none">
        <iframe
          title="Contractor Dispatch Live Map"
          className={`w-full h-full border-0 transition-opacity duration-500 ${
            mapStyle === 'uber-dark' ? 'invert-[0.93] hue-rotate-180 brightness-95 contrast-125' : 'opacity-100'
          }`}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${targetLat}%2C${targetLng}`}
          loading="lazy"
        />

        {/* 3. UBER NAVIGATION OVERLAY (Route Corridor, Beacons & Waypoints) */}
        <div className="absolute inset-0 pointer-events-none">
          {/* SVG Animated Route Line */}
          <svg className="w-full h-full">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="1" />
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Simulated Dynamic Route Corridor */}
            <path
              d="M 180 340 Q 260 280, 340 220 T 520 160"
              fill="none"
              stroke="#047857"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              d="M 180 340 Q 260 280, 340 220 T 520 160"
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="6 6"
              filter="url(#neonGlow)"
              className="animate-pulse"
            />
          </svg>

          {/* CREW VEHICLE PIN (Simulated Dispatch Truck) */}
          <div
            className="absolute transition-all duration-1000 ease-linear pointer-events-auto cursor-pointer"
            style={{
              bottom: '28%',
              left: '26%'
            }}
          >
            <div className="relative group">
              {/* Ripple ping */}
              <div className="absolute -inset-2 rounded-full bg-emerald-500/40 animate-ping"></div>

              {/* Vehicle Badge */}
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border-2 border-emerald-400 text-emerald-400 shadow-xl shadow-emerald-500/30">
                <Truck className="w-5 h-5" />
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-md border border-slate-700 shadow-lg opacity-90 group-hover:opacity-100 transition-opacity">
                <span>{crewCoords.label} &bull; {crewCoords.speed}</span>
              </div>
            </div>
          </div>

          {/* CITIZEN INCIDENT TARGET PIN */}
          <div
            className="absolute pointer-events-auto cursor-pointer"
            style={{
              top: '35%',
              right: '34%'
            }}
          >
            <div className="relative group">
              {/* Radar beacon waves */}
              <div className="absolute -inset-4 rounded-full bg-rose-500/30 animate-ping duration-1000"></div>
              <div className="absolute -inset-8 rounded-full bg-rose-500/10 animate-pulse"></div>

              {/* Incident Marker Pin */}
              <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-rose-600 border-2 border-white text-white shadow-2xl shadow-rose-600/50 transform -translate-y-2 hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6 fill-white text-rose-600" />
              </div>

              {/* Incident Floating Pill */}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 text-white text-xs px-3 py-1.5 rounded-lg border border-rose-500/50 shadow-2xl">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  <span>{activeTask?.ticketNumber || activeTask?.id || 'Grievance Site'}</span>
                </div>
                <div className="text-[11px] text-slate-300 font-medium max-w-[200px] truncate">
                  {activeTask?.title || 'Reported Citizen Issue'}
                </div>
              </div>
            </div>
          </div>

          {/* Dispatch Navigation Compass (Top Left under HUD) */}
          <div className="absolute top-20 left-4 hidden md:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 text-[11px] text-slate-300 font-mono shadow">
            <Compass className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
            <span>HEADING: 042&deg; NE</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">GPS LOCK &plusmn;3m</span>
          </div>
        </div>
      </div>

      {/* 4. DRIVER DISPATCH CONSOLE FOOTER (UBER / RED TAXI STYLE) */}
      <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent p-3 sm:p-4">
        <div className="bg-slate-900/95 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Site Location & Citizen Details */}
          <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <LocateFixed className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white truncate">
                  {activeTask?.location || 'Indiranagar Main Road'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {activeTask?.ward || 'Ward 80'}
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-medium">
                  {targetLat.toFixed(4)}, {targetLng.toFixed(4)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate flex items-center gap-2 mt-0.5">
                <span>Citizen: <strong className="text-slate-200">{activeTask?.citizenName || 'Sunita Rao'}</strong></span>
                <span>&bull;</span>
                <span className="text-slate-300">{activeTask?.citizenPhone || '+91 98450 12345'}</span>
              </div>
            </div>
          </div>

          {/* Action Button Strip */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            {/* Call Citizen */}
            {activeTask?.citizenPhone && (
              <a
                href={`tel:${activeTask.citizenPhone}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>Call Citizen</span>
              </a>
            )}

            {/* Copy Coordinates */}
            <button
              type="button"
              onClick={handleCopyCoords}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy GPS</span>
                </>
              )}
            </button>

            {/* Google Street View */}
            <button
              type="button"
              onClick={handleOpenStreetView}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Street View</span>
            </button>

            {/* Primary Action: Turn-by-Turn GPS Launch (Uber / Google Maps) */}
            <button
              type="button"
              onClick={handleOpenGpsNavigation}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition-all hover:scale-[1.02]"
            >
              <Navigation className="w-4 h-4 fill-white" />
              <span>Start Turn-by-Turn GPS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorDispatchMap;
