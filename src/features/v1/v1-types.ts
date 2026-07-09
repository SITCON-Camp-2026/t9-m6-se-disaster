// v1 reuses the same Phase 0 fixture and types.
// This file re-exports them so v1 components do not depend on phase-0 paths directly.
export type {
  Phase0Confidence as V1Confidence,
  Phase0JudgementDraft as V1JudgementDraft,
  Phase0MessyRecord as V1MessyRecord,
  Phase0PossibleKind as V1PossibleKind,
  Phase0SuggestedNextStep as V1SuggestedNextStep,
} from "../phase-0/phase0-types";

import type { Phase0CandidateReport } from "../phase-0/phase0-types";

// v1 extends the candidate report with an optional "organizer reviewed" timestamp.
// This lets the organizer mark a candidate as reviewed without changing its
// "unconfirmed" status or turning it into a verified task.
export type V1CandidateReport = Phase0CandidateReport & {
  reviewedAt?: string;
};
