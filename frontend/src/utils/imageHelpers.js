/**
 * Universal Image URL normalizer for NagrikSeva
 * Safely resolves relative upload paths, Supabase URLs, external CDN URLs, and object payloads.
 */

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';

export const getImageUrl = (source) => {
  if (!source) return FALLBACK_IMAGE;

  let rawUrl = '';
  if (typeof source === 'string') {
    rawUrl = source.trim();
  } else if (typeof source === 'object' && source !== null) {
    rawUrl = source.file_url || source.storage_url || source.fileUrl || source.url || '';
  }

  if (!rawUrl) return FALLBACK_IMAGE;

  // Already an absolute URL, data uri, or blob uri
  if (
    rawUrl.startsWith('http://') ||
    rawUrl.startsWith('https://') ||
    rawUrl.startsWith('data:') ||
    rawUrl.startsWith('blob:')
  ) {
    return rawUrl;
  }

  // Relative path starting with /uploads or uploads
  if (rawUrl.startsWith('/uploads') || rawUrl.startsWith('uploads')) {
    const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    return `${BACKEND_BASE}${cleanPath}`;
  }

  return rawUrl;
};

// Preset sample images for Citizen Grievance Filing
export const SAMPLE_CITIZEN_EVIDENCE = [
  {
    id: 'sample-pothole',
    label: 'Pothole Crater',
    category: 'Roads',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-water',
    label: 'Water Pipe Leak',
    category: 'Water',
    url: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-garbage',
    label: 'Garbage Dump Overflow',
    category: 'Sanitation',
    url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-drain',
    label: 'Broken Drain / Sewage',
    category: 'Drainage',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'sample-light',
    label: 'Dead Streetlight',
    category: 'Electrical',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  },
];

// Preset sample completed remediation images for Field Workers
export const SAMPLE_WORKER_PROOF = [
  {
    id: 'proof-asphalt',
    label: 'Compacted Asphalt Layer',
    trade: 'Roads',
    url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'proof-pipe',
    label: 'Replaced Flange & Welded Pipe',
    trade: 'Water',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'proof-cleared',
    label: 'Cleared & Disinfected Area',
    trade: 'Sanitation',
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'proof-light',
    label: 'Working LED Luminaire Restored',
    trade: 'Electrical',
    url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=600&auto=format&fit=crop&q=80',
  },
];

export default {
  getImageUrl,
  FALLBACK_IMAGE,
  SAMPLE_CITIZEN_EVIDENCE,
  SAMPLE_WORKER_PROOF,
};

