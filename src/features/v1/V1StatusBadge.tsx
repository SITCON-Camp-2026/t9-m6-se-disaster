import { v1CandidateStatusLabels, v1VerificationLabels } from "./v1-labels";

function classForStatus(status: string, reviewed?: boolean) {
  if (reviewed) return "status-reviewed";
  if (status === "candidate_urgent_submitted") return "status-urgent";
  if (status === "candidate_submitted") return "status-candidate";
  if (status === "verified" || status === "verified_open")
    return "status-verified";
  if (status === "needs_review") return "status-review";
  if (status === "unverified") return "status-unverified";
  return "status-default";
}

function labelForStatus(status: string, reviewed?: boolean) {
  const base =
    v1CandidateStatusLabels[status as keyof typeof v1CandidateStatusLabels] ??
    v1VerificationLabels[status] ??
    status;
  return reviewed ? `${base}（已人工複核）` : base;
}

export function V1StatusBadge({
  status,
  reviewed,
}: {
  status: string;
  reviewed?: boolean;
}) {
  return (
    <span
      className={`status-badge ${classForStatus(status, reviewed)}`}
      title={reviewed ? "整理者已複核，但仍為候選、未確認" : undefined}
    >
      {labelForStatus(status, reviewed)}
    </span>
  );
}
