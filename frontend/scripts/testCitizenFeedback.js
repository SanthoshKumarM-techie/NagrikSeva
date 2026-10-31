/**
 * Test citizen resolution confirmation feedback & rating workflow
 */
import assert from 'assert';

console.log('🧪 Testing Citizen Resolution Feedback & Rating Workflow...\n');

// 1. Star Rating Validation
function validateRating(rating) {
  const num = Number(rating);
  if (!Number.isInteger(num) || num < 1 || num > 5) {
    return 5; // Default fallback
  }
  return num;
}

assert.strictEqual(validateRating(5), 5, '5 star rating valid');
assert.strictEqual(validateRating(4), 4, '4 star rating valid');
assert.strictEqual(validateRating(1), 1, '1 star rating valid');
assert.strictEqual(validateRating(null), 5, 'Null defaults to 5');
assert.strictEqual(validateRating(undefined), 5, 'Undefined defaults to 5');
assert.strictEqual(validateRating(10), 5, 'Out of bounds defaults to 5');
console.log('  ✅ PASS: Star rating validation & fallback logic');

// 2. Quick Tags Integration
function formatFeedbackWithTags(prevFeedback, selectedTags) {
  const tagText = selectedTags.join(', ');
  const cleanPrev = (prevFeedback || '').replace(/^\[Highlights: [^\]]+\]\s*/i, '').trim();
  if (selectedTags.length > 0) {
    return cleanPrev ? `[Highlights: ${tagText}] ${cleanPrev}` : `[Highlights: ${tagText}]`;
  }
  return cleanPrev;
}

const tags = ['⚡ Rapid Turnaround', '🛠️ High Quality Repair'];
const resWithTags = formatFeedbackWithTags('Pothole is fixed nicely.', tags);
assert.strictEqual(resWithTags, '[Highlights: ⚡ Rapid Turnaround, 🛠️ High Quality Repair] Pothole is fixed nicely.');
console.log('  ✅ PASS: Quick tags formatting into citizen feedback');

// 3. Timeline event creation with rating
function createResolutionTimelineEvent(citizenUser, rating, feedback) {
  const timestamp = new Date().toISOString();
  return {
    id: `tl-${Date.now()}`,
    status: 'CLOSED',
    title: 'Citizen Confirmed Resolution — Case Closed',
    description: `${citizenUser?.name || 'Citizen'} verified civic restoration (Rated: ${rating}/5 ⭐). ${feedback ? `Feedback: "${feedback}"` : ''}`.trim(),
    timestamp,
    author: citizenUser?.name || 'Citizen',
    role: 'Citizen'
  };
}

const tlEvent = createResolutionTimelineEvent({ name: 'Nithish' }, 5, 'Excellent service and quick repair!');
assert(tlEvent.description.includes('(Rated: 5/5 ⭐)'), 'Timeline includes star rating');
assert(tlEvent.description.includes('Feedback: "Excellent service and quick repair!"'), 'Timeline includes feedback text');
assert.strictEqual(tlEvent.status, 'CLOSED', 'Status is CLOSED');
console.log('  ✅ PASS: Grievance lifecycle timeline reflects citizen rating & feedback');

// 4. Payload for reviewsApi.citizenFeedback
function buildCitizenFeedbackPayload(rating, feedback) {
  return {
    decision: 'CONFIRMED',
    rating: validateRating(rating),
    feedback: (feedback || '').trim() || 'Resolution confirmed by citizen. Case resolved satisfactorily.'
  };
}

const payload = buildCitizenFeedbackPayload(5, 'Great job done!');
assert.deepStrictEqual(payload, {
  decision: 'CONFIRMED',
  rating: 5,
  feedback: 'Great job done!'
});
console.log('  ✅ PASS: Backend citizen feedback payload structure');

console.log('\n🎉 ALL CITIZEN FEEDBACK & RATING TESTS PASSED!');
