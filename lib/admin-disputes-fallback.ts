export type AdminDisputeStatus = "OPEN" | "UNDER_REVIEW" | "ESCALATED" | "RESOLVED";
export type AdminDisputePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AdminDisputePartyRole = "CLIENT" | "PROVIDER";

export type AdminDisputeFallback = {
  id: string;
  caseNumber: string;
  orderId: string;
  orderNumber: string;
  subject: string;
  category: string;
  summary: string;
  status: AdminDisputeStatus;
  priority: AdminDisputePriority;
  claimantRole: AdminDisputePartyRole;
  claimantName: string;
  respondentName: string;
  amount: number;
  currency?: string;
  evidenceCount: number;
  createdAt: string;
  updatedAt: string;
};

const fallbackDisputes: AdminDisputeFallback[] = [
  {
    id: "demo-dispute-1",
    caseNumber: "DSP-4001",
    orderId: "demo-order-1",
    orderNumber: "ORD-1001",
    subject: "Delivery scope mismatch",
    category: "Scope",
    summary:
      "The client claims the delivered materials do not cover the agreed responsive layouts and missing handoff notes.",
    status: "UNDER_REVIEW",
    priority: "HIGH",
    claimantRole: "CLIENT",
    claimantName: "Maria Popescu",
    respondentName: "Alexandru Ionescu",
    amount: 2500,
    currency: "USD",
    evidenceCount: 4,
    createdAt: "2026-03-18T09:15:00.000Z",
    updatedAt: "2026-03-22T14:10:00.000Z",
  },
  {
    id: "demo-dispute-2",
    caseNumber: "DSP-4002",
    orderId: "demo-order-2",
    orderNumber: "ORD-1002",
    subject: "Payment release blocked",
    category: "Payments",
    summary:
      "The provider requests payment release after confirming that the latest requested revisions were already delivered.",
    status: "OPEN",
    priority: "MEDIUM",
    claimantRole: "PROVIDER",
    claimantName: "Elena Dumitrescu",
    respondentName: "Andrei Radu",
    amount: 1800,
    currency: "USD",
    evidenceCount: 2,
    createdAt: "2026-03-19T11:40:00.000Z",
    updatedAt: "2026-03-21T17:35:00.000Z",
  },
  {
    id: "demo-dispute-3",
    caseNumber: "DSP-4003",
    orderId: "demo-order-1",
    orderNumber: "ORD-1001",
    subject: "Escalated revision disagreement",
    category: "Revisions",
    summary:
      "The parties disagree on whether the extra revision round falls inside the original milestone bundle.",
    status: "ESCALATED",
    priority: "CRITICAL",
    claimantRole: "CLIENT",
    claimantName: "Maria Popescu",
    respondentName: "Alexandru Ionescu",
    amount: 2500,
    currency: "USD",
    evidenceCount: 6,
    createdAt: "2026-03-20T08:20:00.000Z",
    updatedAt: "2026-03-23T10:55:00.000Z",
  },
];

export function getAdminDisputesFallback(): AdminDisputeFallback[] {
  return fallbackDisputes.map((dispute) => ({ ...dispute }));
}
