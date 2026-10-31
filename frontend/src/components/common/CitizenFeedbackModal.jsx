import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { VoiceTextarea } from './VoiceTextarea';

const RATING_DESCRIPTIONS = {
  1: { label: 'Poor', desc: 'Work was inadequate or issue persists', color: 'text-rose-500' },
  2: { label: 'Fair', desc: 'Partially addressed, needs improvement', color: 'text-amber-500' },
  3: { label: 'Good', desc: 'Acceptable civic restoration work', color: 'text-yellow-500' },
  4: { label: 'Very Good', desc: 'Prompt and well executed resolution', color: 'text-lime-600 dark:text-lime-400' },
  5: { label: 'Excellent', desc: 'Completely resolved with outstanding quality', color: 'text-emerald-600 dark:text-emerald-400' }
};

const QUICK_TAGS = [
  '⚡ Rapid Turnaround',
  '🛠️ High Quality Repair',
  '🧹 Clean Site Cleanup',
  '👷 Courteous Worker',
  '💯 Issue 100% Resolved'
];

export const CitizenFeedbackModal = ({
  isOpen,
  onClose,
  onConfirm,
  complaint,
  loading = false
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  // Reset form when opened for a complaint
  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(0);
      setFeedback('');
      setSelectedTags([]);
    }
  }, [isOpen, complaint?.id]);

  const activeRating = hoverRating || rating;
  const ratingInfo = RATING_DESCRIPTIONS[activeRating] || RATING_DESCRIPTIONS[5];

  const handleTagToggle = (tag) => {
    let nextTags;
    if (selectedTags.includes(tag)) {
      nextTags = selectedTags.filter(t => t !== tag);
    } else {
      nextTags = [...selectedTags, tag];
    }
    setSelectedTags(nextTags);

    // Update feedback text intelligently with selected tags
    const tagText = nextTags.join(', ');
    setFeedback(prev => {
      // Remove any previously inserted tags header if present
      const cleanPrev = prev.replace(/^\[Highlights: [^\]]+\]\s*/i, '').trim();
      if (nextTags.length > 0) {
        return cleanPrev ? `[Highlights: ${tagText}] ${cleanPrev}` : `[Highlights: ${tagText}]`;
      }
      return cleanPrev;
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    
    await onConfirm({
      rating: Number(rating) || 5,
      feedback: feedback.trim() || `Resolution confirmed by citizen. Rated ${rating}/5 stars.`
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Confirm Remediation & Citizen Feedback"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Inspect Details First
          </Button>
          <Button
            variant="success"
            onClick={handleSubmit}
            loading={loading}
            icon={CheckCircle2}
          >
            Confirm &amp; Close Case
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Header Summary Pill */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-emerald-50/50 to-transparent dark:from-emerald-950/30 dark:via-emerald-950/10 dark:to-transparent border border-emerald-200/80 dark:border-emerald-800/40 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                #{complaint?.ticketNumber || complaint?.id}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-medium">
                Verified by Department
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate mt-0.5">
              {complaint?.title || 'Civic Grievance Resolution'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Please rate the completed civic remediation work before formally closing this grievance.
            </p>
          </div>
        </div>

        {/* Interactive 5-Star Rating */}
        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
            How would you rate the resolution quality?
          </label>

          <div
            className="flex items-center justify-center gap-2 my-2"
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((starValue) => {
              const isFilled = starValue <= activeRating;
              return (
                <button
                  key={starValue}
                  type="button"
                  onClick={() => setRating(starValue)}
                  onMouseEnter={() => setHoverRating(starValue)}
                  className="p-1.5 rounded-lg transition-transform transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      isFilled
                        ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                        : 'text-slate-300 dark:text-slate-600 hover:text-amber-200'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold">
            <span className={ratingInfo.color}>
              {activeRating} / 5 Stars — {ratingInfo.label}
            </span>
            <span className="text-slate-400 font-normal">
              ({ratingInfo.desc})
            </span>
          </div>
        </div>

        {/* Quick Feedback Tags */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Quick Feedback Highlights (Optional)
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Feedback with Voice Typing */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <label htmlFor="citizen-feedback-text" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Remarks &amp; Experience (Optional)
              </label>
            </div>
            <span className="text-[11px] text-slate-400">
              Supports Voice Dictation in English, Tamil, Kannada, Hindi
            </span>
          </div>

          <VoiceTextarea
            id="citizen-feedback-text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onVoiceChange={(text) => setFeedback(text)}
            rows={3}
            placeholder="Tell us about the repair quality, timeliness, or worker conduct..."
            defaultTranslateToEnglish={true}
          />
        </div>

        {/* Case Closure Notice */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
          ℹ️ Submitting this confirmation will formally transition ticket #{complaint?.ticketNumber || complaint?.id} to <strong className="text-emerald-700 dark:text-emerald-400">CLOSED</strong>. Both the field team and municipal administration will receive your rating.
        </p>
      </div>
    </Modal>
  );
};

export default CitizenFeedbackModal;

