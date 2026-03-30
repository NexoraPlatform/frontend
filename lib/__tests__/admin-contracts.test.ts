import { describe, expect, it } from "vitest";

import {
  normalizeAdminContractDetail,
  normalizeAdminContractListItem,
  normalizeAdminContractsDashboardStats,
  normalizeAdminReviewQueueItem,
  normalizeAdminSignatureQueueItem,
} from "../admin-contracts";

describe("lib/admin-contracts", () => {
  it("normalizes dashboard stats maps and totals", () => {
    const stats = normalizeAdminContractsDashboardStats({
      contracts: {
        total: 12,
        by_status: {
          pending_review: 3,
          signed: "4",
        },
      },
      reviews: {
        open_like_total: "5",
        urgent_total: 2,
        by_status: {
          OPEN: 1,
          IN_REVIEW: 4,
        },
      },
      signatures: {
        active_total: 7,
        stalled_total: "2",
        by_status: {
          sent: 5,
          partially_signed: 2,
        },
      },
      obligations: {
        overdue_total: "6",
        due_soon_total: 3,
      },
    });

    expect(stats.contracts.total).toBe(12);
    expect(stats.contracts.by_status.signed).toBe(4);
    expect(stats.reviews.open_like_total).toBe(5);
    expect(stats.signatures.stalled_total).toBe(2);
    expect(stats.obligations.overdue_total).toBe(6);
  });

  it("normalizes admin contract list and detail payloads", () => {
    const listItem = normalizeAdminContractListItem({
      id: 15,
      reference: "CTR-20260327-5",
      status: "pending_review",
      signature_level: "QES",
      requires_manual_review: true,
      project: {
        id: 91,
        title: "Marketplace rollout",
        reference: "PRJ-91",
      },
      latest_risk: {
        overall_risk: "HIGH",
        warnings: ["manual_review"],
      },
      parties: [
        {
          id: 1,
          party_role: "CLIENT",
          legal_name: "Client Corp",
        },
      ],
    });

    const detail = normalizeAdminContractDetail({
      id: 15,
      reference: "CTR-20260327-5",
      status: "pending_review",
      signature_level: "QES",
      requires_manual_review: true,
      project: {
        id: 91,
        title: "Marketplace rollout",
        reference: "PRJ-91",
      },
      latest_risk_assessment: {
        overall_risk: "HIGH",
        warnings: ["manual_review"],
        blocking_reasons: ["misclassification"],
      },
      documents: [
        {
          id: 101,
          document_role: "FINAL_PDF",
          file_name: "contract-final.pdf",
          is_current: true,
        },
      ],
      manual_reviews: [
        {
          id: 7,
          status: "OPEN",
          review_summary: "Needs legal eyes.",
          comments: [],
        },
      ],
      signatures: [
        {
          id: 9,
          contract_id: 15,
          status: "sent",
          flow_status: "AWAITING_CLIENT_UPLOAD",
          validations: [],
        },
      ],
      obligations: [
        {
          id: 3,
          title: "Collect provider signature",
          status: "PENDING",
        },
      ],
      notes: [
        {
          id: 1,
          contract_id: 15,
          note_type: "INTERNAL",
          body: "Escalated to legal.",
          author_user: {
            id: 4,
            name: "Legal Ops",
            email: "legal@example.com",
          },
        },
      ],
      parties: [],
    });

    expect(listItem?.project?.reference).toBe("PRJ-91");
    expect(listItem?.latest_risk?.overall_risk).toBe("HIGH");
    expect(detail?.documents[0]?.file_name).toBe("contract-final.pdf");
    expect(detail?.manual_reviews[0]?.status).toBe("OPEN");
    expect(detail?.signatures[0]?.flow_status).toBe("AWAITING_CLIENT_UPLOAD");
    expect(detail?.notes[0]?.author_user?.email).toBe("legal@example.com");
  });

  it("normalizes review and signature queue items", () => {
    const review = normalizeAdminReviewQueueItem({
      id: 7,
      status: "IN_REVIEW",
      priority: "HIGH",
      comments_count: "3",
      contract: {
        id: 15,
        reference: "CTR-20260327-5",
        status: "pending_review",
        signature_level: "QES",
        requires_manual_review: true,
      },
    });

    const signature = normalizeAdminSignatureQueueItem({
      id: 9,
      flow_reference: "sigflow-123",
      status: "partially_signed",
      flow_status: "AWAITING_PROVIDER_UPLOAD",
      events_count: 4,
      contract: {
        id: 15,
        reference: "CTR-20260327-5",
        status: "sent_for_signature",
      },
      signed_document: {
        id: 44,
        document_role: "SIGNED_PDF",
        file_name: "contract-signed.pdf",
      },
    });

    expect(review?.comments_count).toBe(3);
    expect(review?.contract?.signature_level).toBe("QES");
    expect(signature?.flow_status).toBe("AWAITING_PROVIDER_UPLOAD");
    expect(signature?.signed_document?.file_name).toBe("contract-signed.pdf");
  });
});
