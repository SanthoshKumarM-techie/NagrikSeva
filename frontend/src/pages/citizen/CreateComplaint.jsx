import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Upload,
  X,
  AlertTriangle,
  FileText,
  Camera,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Users,
  Eye,
  Info,
  Navigation,
  LocateFixed,
  Compass
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, PRIORITIES } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';

import evidenceApi from '../../api/evidence.api';
import complaintsApi from '../../api/complaints.api';
import { getImageUrl } from '../../utils/imageHelpers';

export const CreateComplaint = () => {
  const { complaints, createComplaint, addSupporter, categories, wards } = useComplaints();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const categoryOptions = categories && categories.length > 0 ? categories.map(c => c.name) : CATEGORIES;
  const wardOptions = wards && wards.length > 0 
    ? wards.map(w => w.ward_number ? `Ward ${w.ward_number} - ${w.name}` : w.name)
    : [
        'Ward 101 - Indiranagar',
        'Ward 102 - Koramangala',
        'Ward 103 - HSR Layout',
        'Ward 104 - Whitefield'
      ];

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: categoryOptions[0] || 'Pothole on Main Road',
    description: '',
    location: '',
    ward: wardOptions[0] || 'Ward 101 - Indiranagar',
    priority: PRIORITIES.HIGH,
    evidence: [],
    latitude: null,
    longitude: null,
    coordinates: null,
    isGpsCaptured: false
  });

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [supportedDuplicate, setSupportedDuplicate] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [serverMatches, setServerMatches] = useState([]);

  // Potential duplicates based on server matches and local fallback
  const localDuplicates = complaints.filter(
    (c) =>
      c.category === formData.category &&
      ((c.location || '').toLowerCase().includes(formData.location.toLowerCase().slice(0, 5)) ||
       c.ward === formData.ward ||
       (c.title || '').toLowerCase().includes(formData.title.toLowerCase().slice(0, 4)))
  ).slice(0, 2);

  const potentialDuplicates = serverMatches.length > 0 ? serverMatches : localDuplicates;

  const handleCaptureLiveLocation = () => {
    if (!navigator.geolocation) {
      setValidationError('Live GPS Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setValidationError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        setGpsAccuracy(accuracy);
        setGpsSuccess(true);
        setGpsLoading(false);

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          coordinates: { lat, lng },
          isGpsCaptured: true,
        }));

        // Reverse geocoding via OpenStreetMap with graceful fallback
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { Accept: 'application/json' } }
          );
          if (res.ok) {
            const geocode = await res.json();
            const addressObj = geocode.address || {};
            const road = addressObj.road || addressObj.suburb || addressObj.neighbourhood || addressObj.residential;
            const city = addressObj.city || addressObj.town || addressObj.county || 'Bangalore';
            const postcode = addressObj.postcode ? ` - ${addressObj.postcode}` : '';

            const streetText = road
              ? `${road}, ${city}${postcode}`
              : geocode.display_name?.split(',').slice(0, 3).join(',') || '';

            if (streetText) {
              setFormData((prev) => ({
                ...prev,
                location: prev.location && prev.location.trim().length > 0 ? prev.location : streetText,
              }));
            }

            // Match ward if suburb exists
            if (wards && wards.length > 0 && (addressObj.suburb || addressObj.neighbourhood)) {
              const queryArea = (addressObj.suburb || addressObj.neighbourhood).toLowerCase();
              const matchedWard = wards.find(
                (w) =>
                  w.name.toLowerCase().includes(queryArea) ||
                  queryArea.includes(w.name.toLowerCase())
              );
              if (matchedWard) {
                const wardStr = matchedWard.ward_number
                  ? `Ward ${matchedWard.ward_number} - ${matchedWard.name}`
                  : matchedWard.name;
                setFormData((prev) => ({ ...prev, ward: wardStr }));
              }
            }
          }
        } catch {
          // If offline or blocked, populate coordinate string if location input was empty
          setFormData((prev) => ({
            ...prev,
            location: prev.location || `GPS Location: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`,
          }));
        }
      },
      (err) => {
        setGpsLoading(false);
        setGpsSuccess(false);
        let errorMsg = 'Unable to capture live GPS location.';
        if (err.code === 1) {
          errorMsg = 'Location permission was denied. Please allow browser location access or type your landmark manually.';
        } else if (err.code === 2) {
          errorMsg = 'GPS positioning signal is unavailable on your device. Please enter the location manually.';
        } else if (err.code === 3) {
          errorMsg = 'GPS request timed out. Please try again or enter location manually.';
        }
        setValidationError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleStep1Next = () => {
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setValidationError('Please enter a descriptive grievance title (at least 3 characters).');
      return;
    }
    if (!formData.description.trim() || formData.description.trim().length < 3) {
      setValidationError('Please provide issue details in the description (at least 3 characters).');
      return;
    }
    if (!formData.location.trim()) {
      setValidationError('Please enter the street name or capture live location.');
      return;
    }
    setValidationError('');
    setCurrentStep(2);
  };

  const handleGoToStep3 = async () => {
    setCurrentStep(3);
    try {
      const selectedCat = categories.find(c => c.name === formData.category);
      if (selectedCat) {
        const matches = await complaintsApi.findMatches({
          categoryId: selectedCat.id,
          latitude: formData.latitude || formData.coordinates?.lat || 12.9716,
          longitude: formData.longitude || formData.coordinates?.lng || 77.5946,
          radiusMeters: 2000,
          title: formData.title,
          description: formData.description
        });
        if (matches && matches.length > 0) {
          setServerMatches(matches.map(m => ({
            id: m.ticket_number || m.id,
            title: m.title,
            location: m.street_location || 'Nearby Location',
            supporterCount: m.support_count || 1,
            status: m.status || 'SUBMITTED'
          })));
        }
      }
    } catch {
      // Fallback to local filter
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.evidence.length >= 4) {
      alert('Maximum 4 photos allowed.');
      return;
    }

    try {
      setIsUploading(true);
      const res = await evidenceApi.uploadFile(file, { stage: 'CITIZEN_INITIAL' });
      const url = res?.url || res?.fileUrl || (res ? `/uploads/${res.filename || file.name}` : '');
      if (url) {
        setFormData(prev => ({ ...prev, evidence: [...prev.evidence, url] }));
      }
    } catch (err) {
      alert(`File upload failed: ${err.message || 'Error uploading file'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddEvidencePhoto = (url) => {
    if (!url) return;
    if (formData.evidence.length >= 4) {
      alert('Maximum 4 photos allowed.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      evidence: [...prev.evidence, url],
    }));
    setImageUrlInput('');
  };

  const handleRemoveEvidence = (index) => {
    setFormData((prev) => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index),
    }));
  };

  const handleJoinDuplicate = (duplicateComplaint) => {
    addSupporter(duplicateComplaint.id, currentUser);
    setSupportedDuplicate(duplicateComplaint);
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      setValidationError('');
      const newComp = await createComplaint(formData, currentUser);
      setSubmittedComplaint(newComp);
    } catch (err) {
      const detailedMsg = err?.errors && Array.isArray(err.errors) && err.errors.length > 0
        ? err.errors.map(e => e.replace(/^body\./, '')).join('; ')
        : (err?.message || 'Failed to submit grievance. Please try again.');
      setValidationError(detailedMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = ['Issue Details', 'Evidence Photos', 'Duplicate Verification', 'Review & Confirm'];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Register Civic Grievance"
        description="File a municipal complaint with automated department routing and duplicate prevention."
        tag="Citizen Filing"
        backUrl="/citizen"
      />

      {/* Success View after Submitting New Complaint */}
      {submittedComplaint ? (
        <div className="gov-card p-6 sm:p-8 text-center bg-white dark:bg-slate-900 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
            Grievance Registered Successfully
          </span>

          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            Complaint Tracking ID: <span className="text-blue-600 font-mono">{submittedComplaint.id}</span>
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Your issue has been logged and assigned to the <strong>{submittedComplaint.department}</strong> division for review and officer assignment.
          </p>

          <div className="p-4 max-w-md mx-auto rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="font-semibold">{submittedComplaint.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Priority:</span>
              <Badge priority={submittedComplaint.priority} size="sm" />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target SLA:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Within 72 Hours</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setSubmittedComplaint(null);
                setCurrentStep(1);
                setFormData({
                  title: '',
                  category: 'Roads & Infrastructure',
                  description: '',
                  location: '',
                  ward: 'Ward 80 - Hoysala Nagar (Indiranagar)',
                  priority: PRIORITIES.HIGH,
                  evidence: [],
                });
              }}
            >
              File Another Report
            </Button>
            <Button
              variant="primary"
              icon={Eye}
              onClick={() => navigate(`/citizen/complaints/${submittedComplaint.id}`)}
            >
              Track Grievance Status
            </Button>
          </div>
        </div>
      ) : supportedDuplicate ? (
        /* Success View when Joined Existing Duplicate */
        <div className="gov-card p-6 sm:p-8 text-center bg-white dark:bg-slate-900 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-4">
            <Users className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-2">
            Endorsement Recorded
          </span>

          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            Joined Existing Complaint: <span className="text-blue-600 font-mono">{supportedDuplicate.id}</span>
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Instead of creating a duplicate ticket, your endorsement has boosted the priority of the existing issue. You will receive real-time notifications on its resolution.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/citizen/explore')}>
              Explore More Issues
            </Button>
            <Button
              variant="primary"
              icon={Eye}
              onClick={() => navigate(`/citizen/complaints/${supportedDuplicate.id}`)}
            >
              View Complaint Progress
            </Button>
          </div>
        </div>
      ) : (
        /* Wizard Steps Card */
        <div className="gov-card p-6 bg-white dark:bg-slate-900">
          {/* Stepper Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {stepLabels.map((label, idx) => {
                const stepNum = idx + 1;
                const isCompleted = currentStep > stepNum;
                const isCurrent = currentStep === stepNum;

                return (
                  <div key={label} className="flex-1 flex flex-col items-center relative">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                    </div>
                    <span
                      className={`text-[11px] mt-1.5 font-medium text-center hidden sm:block ${
                        isCurrent
                          ? 'text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-500'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: Issue Information */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <Input
                label="Complaint Title / Brief Headline"
                placeholder="e.g. Deep pothole damaging vehicles at Indiranagar 100ft road"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Civic Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={categoryOptions}
                  required
                />

                <Select
                  label="Urgency / Severity"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  options={Object.values(PRIORITIES)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Specific Location / Landmark <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCaptureLiveLocation}
                    disabled={gpsLoading}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-lg transition-colors"
                    title="Capture live GPS coordinates using device geolocation"
                  >
                    <LocateFixed className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                    {gpsLoading ? 'Acquiring GPS Signal...' : gpsSuccess ? 'Update Live GPS' : 'Capture Live GPS Location'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    placeholder="e.g. Near Sony Signal, opposite SBI ATM"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />

                  <Select
                    value={formData.ward}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    options={wardOptions}
                    required
                  />
                </div>

                {gpsSuccess && formData.latitude && formData.longitude && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 animate-fade-in mt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>
                        <strong>Live GPS Tagged:</strong> {formData.latitude.toFixed(5)}° N, {formData.longitude.toFixed(5)}° E
                        {gpsAccuracy ? ` (±${Math.round(gpsAccuracy)}m accuracy)` : ''}
                      </span>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      View Pin &rarr;
                    </a>
                  </div>
                )}
              </div>

              <Input
                label="Detailed Description"
                type="textarea"
                rows={4}
                placeholder="Describe how long the issue has persisted, hazard level, impact on pedestrians or traffic..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="primary" icon={ArrowRight} iconPosition="right" onClick={handleStep1Next}>
                  Proceed to Evidence
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Evidence Upload */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  High-quality photographic proof helps officers quickly acknowledge and prioritize field workers. You can upload custom images or choose from simulated civic presets below.
                </span>
              </div>

              {/* Uploaded Evidence Grid */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Uploaded Evidence ({formData.evidence.length} / 4)
                </label>

                {formData.evidence.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {formData.evidence.map((url, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 h-28 bg-slate-100 dark:bg-slate-800">
                        <img src={getImageUrl(url)} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveEvidence(idx)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-400">
                    No images uploaded yet.
                  </div>
                )}
              </div>

              {/* File Upload Button */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer shadow-sm transition-colors">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>{isUploading ? 'Uploading Image...' : 'Upload Photo from Device'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading || formData.evidence.length >= 4}
                  />
                </label>
                <span className="text-[11px] text-slate-400">JPG, PNG or WebP up to 10MB</span>
              </div>

              {/* Custom Image URL input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Paste direct image URL..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleAddEvidencePhoto(imageUrlInput)}
                  disabled={!imageUrlInput.trim()}
                >
                  Add URL
                </Button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" icon={ArrowLeft} onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button variant="primary" icon={ArrowRight} iconPosition="right" onClick={handleGoToStep3}>
                  Verify Duplicate Check
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Duplicate Check */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-0.5">Automated Civic Duplicate Detection</strong>
                  We searched for active complaints matching category <strong>{formData.category}</strong> near your reported zone. If one matches your problem, joining it expedites municipal action!
                </div>
              </div>

              {potentialDuplicates.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Potential Matching Complaints Found ({potentialDuplicates.length})
                  </h4>

                  {potentialDuplicates.map((dup) => (
                    <div
                      key={dup.id}
                      className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-blue-600">
                              {dup.id}
                            </span>
                            <Badge status={dup.status} size="sm" />
                          </div>
                          <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {dup.title}
                          </h5>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {dup.location}
                          </p>
                        </div>

                        <span className="text-xs font-semibold px-2 py-1 bg-white dark:bg-slate-800 rounded-md border text-slate-600 dark:text-slate-300 shrink-0">
                          {dup.supporterCount} Supporters
                        </span>
                      </div>

                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-blue-50/40 dark:bg-blue-950/30 p-2.5 rounded-lg">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Is this the same issue you are experiencing?
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            icon={Users}
                            onClick={() => handleJoinDuplicate(dup)}
                          >
                            Yes, Endorse This Issue
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="text-center py-2 text-xs text-slate-500">
                    None of these match? You can continue to create a new ticket below.
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-800/20 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  No duplicate grievances found in this immediate ward area. Proceed with new complaint creation.
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" icon={ArrowLeft} onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button variant="primary" icon={ArrowRight} iconPosition="right" onClick={() => setCurrentStep(4)}>
                  No Match, Proceed to Review
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Review and Submit */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    Grievance Summary
                  </span>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Edit details
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block">Headline:</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-xs font-semibold">
                      {formData.title}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Category:</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-xs">
                      {formData.category}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Location:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {formData.location} ({formData.ward})
                    </span>
                    {formData.latitude && formData.longitude && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        <LocateFixed className="w-3 h-3 text-emerald-500" />
                        Live GPS: {formData.latitude.toFixed(5)}° N, {formData.longitude.toFixed(5)}° E
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block">Priority:</span>
                    <Badge priority={formData.priority} size="sm" />
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Description:</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                    {formData.description}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Attached Photos:</span>
                  <div className="flex gap-2">
                    {formData.evidence.map((url, i) => (
                      <img key={i} src={getImageUrl(url)} alt="Proof" className="w-14 h-14 object-cover rounded border" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" icon={ArrowLeft} onClick={() => setCurrentStep(3)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  icon={CheckCircle2}
                  size="md"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering Grievance...' : 'Confirm & Submit Grievance'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateComplaint;

