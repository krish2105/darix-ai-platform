// localStorage keys shared across components (e.g. so PricingSection can
// offer an upgrade for whichever assessment the visitor most recently
// completed in this browser).
export const LAST_ASSESSMENT_ID_KEY = 'darix:lastAssessmentId';

// In-progress assessment draft — lets a visitor resume where they left
// off after a refresh or an accidental tab close, instead of losing every
// answer. Cleared on successful submit or an explicit retake.
export const ASSESSMENT_DRAFT_KEY = 'darix:assessmentDraft';
