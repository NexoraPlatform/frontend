export type ContractsAdminTab = "overview" | "contracts" | "reviews" | "signatures";

export type ReviewActionMode =
  | "assign"
  | "start"
  | "request_changes"
  | "approve"
  | "reject"
  | null;

export const CONTRACT_STATUS_OPTIONS = [
  "draft",
  "pending_review",
  "blocked",
  "ready_for_signature",
  "sent_for_signature",
  "signed",
  "cancelled",
] as const;

export const REVIEW_STATUS_OPTIONS = [
  "OPEN",
  "IN_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
  "CLOSED",
] as const;

export const REVIEW_PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const SIGNATURE_STATUS_OPTIONS = [
  "draft",
  "sent",
  "partially_signed",
  "signed",
  "declined",
  "failed",
  "cancelled",
] as const;

export const SIGNATURE_LEVEL_OPTIONS = ["SES", "ADES", "QES"] as const;

export const RISK_LEVEL_OPTIONS = ["LOW", "MEDIUM", "HIGH", "BLOCKED"] as const;
