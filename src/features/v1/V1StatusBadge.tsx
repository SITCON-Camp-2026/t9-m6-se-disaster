import { v1CandidateStatusLabels, v1VerificationLabels } from "./v1-labels";

function classForStatus(status: string) {
  if (status === "candidate_urgent_submitted") return "status-urgent";
  if (status === "candidate_submitted") return "status-candidate";
  if (status === "verified" || status === "verified_open")
    return "status-verified";
  if (status === "needs_review") return "status-review";
  if (status === "unverified") return "status-unverified";
  return "status-default";
}

function labelForStatus(status: string) {
  return (
    v1CandidateStatusLabels[status as keyof typeof v1CandidateStatusLabels] ??
    v1VerificationLabels[status] ??
    status
  );
}

export function V1StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge ${classForStatus(status)}`}>
      {labelForStatus(status)}
    </span>
  );
}
