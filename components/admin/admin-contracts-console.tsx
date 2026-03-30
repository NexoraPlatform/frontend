"use client";

import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  AlertCircle,
  Clock3,
  Download,
  FileSearch,
  FileSignature,
  FileText,
  Loader2,
  MessageSquareText,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Signature,
  SquarePen,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSpinner, AdminTableEmptyRow, AdminTableLoadingRow } from "@/components/admin/admin-state";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { checkRequirement, getPermissionSlugs, getRoleSlugs, isSuperUser } from "@/lib/access";
import {
  CONTRACT_NOTE_TYPE_OPTIONS,
  REVIEW_COMMENT_TYPE_OPTIONS,
  adminContractsApi,
  type AdminContractDetail,
  type AdminContractListItem,
  type AdminContractsDashboardStats,
  type AdminPaginatedResponse,
  type AdminReviewComment,
  type AdminReviewQueueItem,
  type AdminSignatureQueueItem,
} from "@/lib/admin-contracts";
import {
  contractsApi,
  extractFileNameFromContentDisposition,
  getLatestContractSignatureValidation,
  type ContractManualReviewEntity,
  type ContractSignatureEntity,
} from "@/lib/contracts";
import { FetchError } from "@/lib/fetch-client";
import { useRouter } from "@/lib/navigation";

type ContractsAdminTab = "overview" | "contracts" | "reviews" | "signatures";

const CONTRACT_STATUS_OPTIONS = [
  "draft",
  "pending_review",
  "blocked",
  "ready_for_signature",
  "sent_for_signature",
  "signed",
  "cancelled",
] as const;

const REVIEW_STATUS_OPTIONS = [
  "OPEN",
  "IN_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
  "CLOSED",
] as const;

const REVIEW_PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

const SIGNATURE_STATUS_OPTIONS = [
  "draft",
  "sent",
  "partially_signed",
  "signed",
  "declined",
  "failed",
  "cancelled",
] as const;

const SIGNATURE_LEVEL_OPTIONS = ["SES", "ADES", "QES"] as const;
const RISK_LEVEL_OPTIONS = ["LOW", "MEDIUM", "HIGH", "BLOCKED"] as const;

const humanizeCode = (value: string | null | undefined) =>
  String(value ?? "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

const getToneClass = (value: string | null | undefined) => {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (
    normalized.includes("approved") ||
    normalized.includes("accepted") ||
    normalized.includes("signed") ||
    normalized.includes("valid")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    normalized.includes("reject") ||
    normalized.includes("failed") ||
    normalized.includes("declined") ||
    normalized.includes("blocked") ||
    normalized.includes("cancel")
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    normalized.includes("awaiting") ||
    normalized.includes("pending") ||
    normalized.includes("open") ||
    normalized.includes("review") ||
    normalized.includes("sent") ||
    normalized.includes("partial")
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
};

const formatDateTime = (value: string | null, locale: string) => {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
};

const formatMoney = (
  value: number | null,
  currency: string | null,
  locale: string
) => {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  try {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "ro-RO", {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || ""}`.trim();
  }
};

const extractValidationMessage = (data: unknown) => {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;
  const directMessage = payload.message ?? payload.error;
  if (typeof directMessage === "string" && directMessage.trim()) {
    return directMessage;
  }

  const errors = payload.errors;
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) {
    return null;
  }

  const firstList = Object.values(errors).find((entry) => Array.isArray(entry));
  if (!Array.isArray(firstList)) {
    return null;
  }

  const firstMessage = firstList.find((entry) => typeof entry === "string");
  return typeof firstMessage === "string" && firstMessage.trim()
    ? firstMessage
    : null;
};

const downloadResponseBlob = async (
  response: Response,
  fallbackFileName: string
) => {
  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const fileName =
    extractFileNameFromContentDisposition(
      response.headers.get("content-disposition")
    ) ?? fallbackFileName;

  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
};

const normalizeLines = (value: string) =>
  value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

function AdminErrorBanner({
  title,
  message,
}: {
  title: string;
  message: string | null;
}) {
  if (!message) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function EmptyTableMessage({
  icon: Icon,
  title,
  description,
  colSpan,
}: {
  icon: typeof FileSignature;
  title: string;
  description: string;
  colSpan: number;
}) {
  return (
    <AdminTableEmptyRow
      colSpan={colSpan}
      icon={Icon}
      title={title}
      description={description}
    />
  );
}

export function AdminContractsConsole() {
  const { user, loading, userLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("admin.contracts");
  const locale = useMemo(
    () => (String(t("locale")).toLowerCase() === "en" ? "en" : "ro"),
    [t]
  );
  const superUser = useMemo(() => isSuperUser(user), [user]);

  const isPrivileged = useMemo(() => {
    if (!user) {
      return false;
    }

    if (superUser) {
      return true;
    }

    return getRoleSlugs(user).some((role) =>
      ["admin", "support", "legal"].includes(role)
    );
  }, [superUser, user]);

  const permissionSet = useMemo(() => new Set(getPermissionSlugs(user)), [user]);
  const canViewDashboard = superUser || permissionSet.has("contracts.dashboard.read");
  const canViewContracts = superUser || permissionSet.has("contracts.read");
  const canReadNotes = superUser || permissionSet.has("contracts.notes.read");
  const canCreateNotes = superUser || permissionSet.has("contracts.notes.create");
  const canReadReviews = superUser || permissionSet.has("contracts.reviews.read");
  const canAssignReviews = superUser || permissionSet.has("contracts.reviews.assign");
  const canStartReviews = superUser || permissionSet.has("contracts.reviews.start");
  const canRequestReviewChanges =
    superUser || permissionSet.has("contracts.reviews.request_changes");
  const canApproveReviews = superUser || permissionSet.has("contracts.reviews.approve");
  const canRejectReviews = superUser || permissionSet.has("contracts.reviews.reject");
  const canReadReviewComments =
    superUser || permissionSet.has("contracts.reviews.comments.read");
  const canCreateReviewComments =
    superUser || permissionSet.has("contracts.reviews.comments.create");
  const canReadSignatures = superUser || permissionSet.has("contracts.signatures.read");
  const canUploadSignedPdf =
    superUser || permissionSet.has("contracts.signatures.upload_signed_pdf");

  const hasAnyContractAccess =
    isPrivileged &&
    (superUser ||
      [
        canViewDashboard,
        canViewContracts,
        canReadReviews,
        canReadSignatures,
        canReadNotes,
        canCreateNotes,
        canCreateReviewComments,
      ].some(Boolean));

  const initialTab = useMemo<ContractsAdminTab>(() => {
    if (canViewContracts) {
      return "contracts";
    }

    if (canReadReviews) {
      return "reviews";
    }

    if (canReadSignatures) {
      return "signatures";
    }

    return "overview";
  }, [canReadReviews, canReadSignatures, canViewContracts]);

  const [activeTab, setActiveTab] = useState<ContractsAdminTab>(initialTab);

  const [stats, setStats] = useState<AdminContractsDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [contractSearch, setContractSearch] = useState("");
  const [contractStatus, setContractStatus] = useState("all");
  const [contractRisk, setContractRisk] = useState("all");
  const [contractRequiresReview, setContractRequiresReview] = useState("all");
  const deferredContractSearch = useDeferredValue(contractSearch);
  const [contractPage, setContractPage] = useState(1);
  const [contracts, setContracts] =
    useState<AdminPaginatedResponse<AdminContractListItem> | null>(null);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsError, setContractsError] = useState<string | null>(null);

  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewStatus, setReviewStatus] = useState("all");
  const [reviewPriority, setReviewPriority] = useState("all");
  const [reviewContractStatus, setReviewContractStatus] = useState("all");
  const deferredReviewSearch = useDeferredValue(reviewSearch);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviews, setReviews] =
    useState<AdminPaginatedResponse<AdminReviewQueueItem> | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const [signatureSearch, setSignatureSearch] = useState("");
  const [signatureStatus, setSignatureStatus] = useState("all");
  const [signatureLevel, setSignatureLevel] = useState("all");
  const [signatureContractStatus, setSignatureContractStatus] = useState("all");
  const deferredSignatureSearch = useDeferredValue(signatureSearch);
  const [signaturePage, setSignaturePage] = useState(1);
  const [signatures, setSignatures] =
    useState<AdminPaginatedResponse<AdminSignatureQueueItem> | null>(null);
  const [signaturesLoading, setSignaturesLoading] = useState(false);
  const [signaturesError, setSignaturesError] = useState<string | null>(null);

  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [contractDetail, setContractDetail] = useState<AdminContractDetail | null>(null);
  const [contractDetailLoading, setContractDetailLoading] = useState(false);
  const [contractDetailError, setContractDetailError] = useState<string | null>(null);
  const [contractNoteType, setContractNoteType] = useState<(typeof CONTRACT_NOTE_TYPE_OPTIONS)[number]>("INTERNAL");
  const [contractNoteBody, setContractNoteBody] = useState("");
  const [contractNoteLoading, setContractNoteLoading] = useState(false);
  const [contractPreviewLoading, setContractPreviewLoading] = useState(false);
  const [contractDownloadLoading, setContractDownloadLoading] = useState(false);

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [reviewDetail, setReviewDetail] = useState<ContractManualReviewEntity | null>(null);
  const [reviewDetailLoading, setReviewDetailLoading] = useState(false);
  const [reviewDetailError, setReviewDetailError] = useState<string | null>(null);
  const [reviewCommentType, setReviewCommentType] = useState<(typeof REVIEW_COMMENT_TYPE_OPTIONS)[number]>("INTERNAL");
  const [reviewCommentBody, setReviewCommentBody] = useState("");
  const [reviewCommentLoading, setReviewCommentLoading] = useState(false);
  const [reviewActionMode, setReviewActionMode] = useState<
    "assign" | "start" | "request_changes" | "approve" | "reject" | null
  >(null);
  const [reviewActionLoading, setReviewActionLoading] = useState<string | null>(null);
  const [reviewAssignUserId, setReviewAssignUserId] = useState("");
  const [reviewAssignComment, setReviewAssignComment] = useState("");
  const [reviewStartComment, setReviewStartComment] = useState("");
  const [reviewRequestedChanges, setReviewRequestedChanges] = useState("");
  const [reviewRequestedChangesComment, setReviewRequestedChangesComment] = useState("");
  const [reviewDecisionNotes, setReviewDecisionNotes] = useState("");

  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(null);
  const [signatureDetail, setSignatureDetail] = useState<ContractSignatureEntity | null>(null);
  const [signatureDetailLoading, setSignatureDetailLoading] = useState(false);
  const [signatureDetailError, setSignatureDetailError] = useState<string | null>(null);
  const [signatureUploadFile, setSignatureUploadFile] = useState<File | null>(null);
  const [signatureUploadLoading, setSignatureUploadLoading] = useState(false);
  const [signatureDownloadLoading, setSignatureDownloadLoading] = useState(false);
  const signatureUploadInputRef = useRef<HTMLInputElement | null>(null);

  const resolveErrorMessage = useCallback(
    (error: unknown, fallbackKey: string) => {
      if (error instanceof FetchError) {
        if (error.status === 401) {
          return t("errors.unauthenticated");
        }

        if (error.status === 403) {
          return t("errors.forbidden");
        }

        if (error.status === 404) {
          return t("errors.not_found");
        }

        if (error.status === 422) {
          return extractValidationMessage(error.data) ?? t("errors.validation");
        }

        if (error.message.trim()) {
          return error.message;
        }
      }

      if (error instanceof Error && error.message.trim()) {
        return error.message;
      }

      return t(fallbackKey as never);
    },
    [t]
  );

  useEffect(() => {
    if (loading || userLoading) {
      return;
    }

    if (!hasAnyContractAccess) {
      router.replace(`/access-denied?from=${encodeURIComponent("/admin/contracts")}`);
    }
  }, [hasAnyContractAccess, loading, router, userLoading]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loadStats = useCallback(async () => {
    if (!canViewDashboard) {
      setStats(null);
      setStatsError(null);
      return;
    }

    setStatsLoading(true);
    setStatsError(null);

    try {
      const nextStats = await adminContractsApi.getDashboardStats();
      setStats(nextStats);
    } catch (error) {
      setStatsError(resolveErrorMessage(error, "overview.errors.load"));
    } finally {
      setStatsLoading(false);
    }
  }, [canViewDashboard, resolveErrorMessage]);

  const loadContracts = useCallback(async () => {
    if (!canViewContracts) {
      setContracts(null);
      setContractsError(null);
      return;
    }

    setContractsLoading(true);
    setContractsError(null);

    try {
      const payload = await adminContractsApi.listContracts({
        page: contractPage,
        per_page: 20,
        ...(deferredContractSearch.trim()
          ? { search: deferredContractSearch.trim() }
          : {}),
        ...(contractStatus !== "all" ? { status: contractStatus } : {}),
        ...(contractRisk !== "all" ? { overall_risk: contractRisk } : {}),
        ...(contractRequiresReview !== "all"
          ? { requires_manual_review: contractRequiresReview === "true" }
          : {}),
      });
      setContracts(payload);
    } catch (error) {
      setContractsError(resolveErrorMessage(error, "contracts_tab.errors.load"));
    } finally {
      setContractsLoading(false);
    }
  }, [
    canViewContracts,
    contractPage,
    contractRequiresReview,
    contractRisk,
    contractStatus,
    deferredContractSearch,
    resolveErrorMessage,
  ]);

  const loadReviews = useCallback(async () => {
    if (!canReadReviews) {
      setReviews(null);
      setReviewsError(null);
      return;
    }

    setReviewsLoading(true);
    setReviewsError(null);

    try {
      const payload = await adminContractsApi.listReviewQueue({
        page: reviewPage,
        per_page: 20,
        ...(deferredReviewSearch.trim() ? { search: deferredReviewSearch.trim() } : {}),
        ...(reviewStatus !== "all" ? { status: reviewStatus } : {}),
        ...(reviewPriority !== "all" ? { priority: reviewPriority } : {}),
        ...(reviewContractStatus !== "all"
          ? { contract_status: reviewContractStatus }
          : {}),
      });
      setReviews(payload);
    } catch (error) {
      setReviewsError(resolveErrorMessage(error, "reviews_tab.errors.load"));
    } finally {
      setReviewsLoading(false);
    }
  }, [
    canReadReviews,
    deferredReviewSearch,
    resolveErrorMessage,
    reviewContractStatus,
    reviewPage,
    reviewPriority,
    reviewStatus,
  ]);

  const loadSignatures = useCallback(async () => {
    if (!canReadSignatures) {
      setSignatures(null);
      setSignaturesError(null);
      return;
    }

    setSignaturesLoading(true);
    setSignaturesError(null);

    try {
      const payload = await adminContractsApi.listSignatureQueue({
        page: signaturePage,
        per_page: 20,
        ...(deferredSignatureSearch.trim()
          ? { search: deferredSignatureSearch.trim() }
          : {}),
        ...(signatureStatus !== "all" ? { status: signatureStatus } : {}),
        ...(signatureLevel !== "all" ? { signature_level: signatureLevel } : {}),
        ...(signatureContractStatus !== "all"
          ? { contract_status: signatureContractStatus }
          : {}),
      });
      setSignatures(payload);
    } catch (error) {
      setSignaturesError(resolveErrorMessage(error, "signatures_tab.errors.load"));
    } finally {
      setSignaturesLoading(false);
    }
  }, [
    canReadSignatures,
    deferredSignatureSearch,
    resolveErrorMessage,
    signatureContractStatus,
    signatureLevel,
    signaturePage,
    signatureStatus,
  ]);

  const refreshActiveTab = useCallback(async () => {
    await Promise.all([
      loadStats(),
      activeTab === "contracts"
        ? loadContracts()
        : activeTab === "reviews"
          ? loadReviews()
          : activeTab === "signatures"
            ? loadSignatures()
            : Promise.resolve(),
    ]);
  }, [activeTab, loadContracts, loadReviews, loadSignatures, loadStats]);

  useEffect(() => {
    if (!hasAnyContractAccess) {
      return;
    }

    void loadStats();
  }, [hasAnyContractAccess, loadStats]);

  useEffect(() => {
    if (!hasAnyContractAccess) {
      return;
    }

    if (activeTab === "contracts") {
      void loadContracts();
    }
  }, [activeTab, hasAnyContractAccess, loadContracts]);

  useEffect(() => {
    if (!hasAnyContractAccess) {
      return;
    }

    if (activeTab === "reviews") {
      void loadReviews();
    }
  }, [activeTab, hasAnyContractAccess, loadReviews]);

  useEffect(() => {
    if (!hasAnyContractAccess) {
      return;
    }

    if (activeTab === "signatures") {
      void loadSignatures();
    }
  }, [activeTab, hasAnyContractAccess, loadSignatures]);

  const loadContractDetail = useCallback(async () => {
    if (!selectedContractId || !canViewContracts) {
      setContractDetail(null);
      return;
    }

    setContractDetailLoading(true);
    setContractDetailError(null);

    try {
      const detail = await adminContractsApi.getContractDetail(selectedContractId);
      setContractDetail(detail);
    } catch (error) {
      setContractDetailError(resolveErrorMessage(error, "contract_detail.errors.load"));
    } finally {
      setContractDetailLoading(false);
    }
  }, [canViewContracts, resolveErrorMessage, selectedContractId]);

  useEffect(() => {
    if (contractDialogOpen) {
      void loadContractDetail();
    }
  }, [contractDialogOpen, loadContractDetail]);

  const loadReviewDetail = useCallback(async () => {
    if (!selectedReviewId || !canReadReviews) {
      setReviewDetail(null);
      return;
    }

    setReviewDetailLoading(true);
    setReviewDetailError(null);

    try {
      const detail = await adminContractsApi.getReviewDetail(selectedReviewId);
      setReviewDetail(detail);
    } catch (error) {
      setReviewDetailError(resolveErrorMessage(error, "review_detail.errors.load"));
    } finally {
      setReviewDetailLoading(false);
    }
  }, [canReadReviews, resolveErrorMessage, selectedReviewId]);

  useEffect(() => {
    if (reviewDialogOpen) {
      void loadReviewDetail();
    }
  }, [loadReviewDetail, reviewDialogOpen]);

  const loadSignatureDetail = useCallback(async () => {
    if (!selectedSignatureId || !canReadSignatures) {
      setSignatureDetail(null);
      return;
    }

    setSignatureDetailLoading(true);
    setSignatureDetailError(null);

    try {
      const detail = await adminContractsApi.getSignatureDetail(selectedSignatureId);
      setSignatureDetail(detail);
    } catch (error) {
      setSignatureDetailError(resolveErrorMessage(error, "signature_detail.errors.load"));
    } finally {
      setSignatureDetailLoading(false);
    }
  }, [canReadSignatures, resolveErrorMessage, selectedSignatureId]);

  useEffect(() => {
    if (signatureDialogOpen) {
      void loadSignatureDetail();
    }
  }, [loadSignatureDetail, signatureDialogOpen]);

  const handleContractPreview = async () => {
    if (!selectedContractId) {
      return;
    }

    const previewWindow = window.open("", "_blank", "noopener,noreferrer");
    setContractPreviewLoading(true);
    setContractDetailError(null);

    try {
      const html = await contractsApi.getContractHtml(selectedContractId);
      if (previewWindow) {
        previewWindow.document.open();
        previewWindow.document.write(html);
        previewWindow.document.close();
      }
    } catch (error) {
      if (previewWindow) {
        previewWindow.close();
      }
      setContractDetailError(resolveErrorMessage(error, "contract_detail.errors.preview"));
    } finally {
      setContractPreviewLoading(false);
    }
  };

  const handleContractDownload = async () => {
    if (!selectedContractId || !contractDetail) {
      return;
    }

    setContractDownloadLoading(true);
    setContractDetailError(null);

    try {
      const response = await contractsApi.getContractPdfResponse(selectedContractId);
      await downloadResponseBlob(
        response,
        `${contractDetail.reference || "contract"}-final.pdf`
      );
    } catch (error) {
      setContractDetailError(resolveErrorMessage(error, "contract_detail.errors.download"));
    } finally {
      setContractDownloadLoading(false);
    }
  };

  const handleCreateContractNote = async () => {
    if (!selectedContractId || !canCreateNotes || !contractNoteBody.trim()) {
      return;
    }

    setContractNoteLoading(true);
    setContractDetailError(null);

    try {
      const note = await adminContractsApi.createContractNote(selectedContractId, {
        note_type: contractNoteType,
        body: contractNoteBody.trim(),
      });

      setContractDetail((current) =>
        current
          ? {
              ...current,
              notes: [note, ...current.notes],
            }
          : current
      );
      setContractNoteBody("");
      await loadContracts();
    } catch (error) {
      setContractDetailError(resolveErrorMessage(error, "contract_detail.errors.note_create"));
    } finally {
      setContractNoteLoading(false);
    }
  };

  const handleCreateReviewComment = async () => {
    if (!selectedReviewId || !canCreateReviewComments || !reviewCommentBody.trim()) {
      return;
    }

    setReviewCommentLoading(true);
    setReviewDetailError(null);

    try {
      const comment = await adminContractsApi.createReviewComment(selectedReviewId, {
        comment_type: reviewCommentType,
        body: reviewCommentBody.trim(),
      });

      setReviewDetail((current) =>
        current
          ? {
              ...current,
              comments: [
                {
                  id: comment.id,
                  comment_type: comment.comment_type,
                  body: comment.body,
                  metadata: comment.metadata,
                  created_at: comment.created_at,
                  author_user: comment.author_user,
                },
                ...current.comments,
              ],
            }
          : current
      );
      setReviewCommentBody("");
      await loadReviews();
    } catch (error) {
      setReviewDetailError(resolveErrorMessage(error, "review_detail.errors.comment_create"));
    } finally {
      setReviewCommentLoading(false);
    }
  };

  const handleReviewAction = async () => {
    if (!reviewDetail || !reviewActionMode) {
      return;
    }

    if (reviewActionMode === "assign" && !reviewAssignUserId.trim()) {
      setReviewDetailError(t("review_detail.errors.assigned_user_required"));
      return;
    }

    if (
      reviewActionMode === "request_changes" &&
      normalizeLines(reviewRequestedChanges).length === 0
    ) {
      setReviewDetailError(t("review_detail.errors.requested_changes_required"));
      return;
    }

    setReviewActionLoading(reviewActionMode);
    setReviewDetailError(null);

    try {
      let nextReview: ContractManualReviewEntity | null = null;

      switch (reviewActionMode) {
        case "assign":
          nextReview = await contractsApi.assignManualReview(reviewDetail.id, {
            assigned_to_user_id: reviewAssignUserId.trim(),
            comment: reviewAssignComment.trim() || null,
          });
          setReviewAssignUserId("");
          setReviewAssignComment("");
          break;
        case "start":
          nextReview = await contractsApi.startManualReview(reviewDetail.id, {
            comment: reviewStartComment.trim() || null,
          });
          setReviewStartComment("");
          break;
        case "request_changes":
          nextReview = await contractsApi.requestManualReviewChanges(reviewDetail.id, {
            requested_changes: normalizeLines(reviewRequestedChanges),
            comment: reviewRequestedChangesComment.trim() || null,
          });
          setReviewRequestedChanges("");
          setReviewRequestedChangesComment("");
          break;
        case "approve":
          nextReview = await contractsApi.approveManualReview(reviewDetail.id, {
            notes: reviewDecisionNotes.trim() || null,
          });
          setReviewDecisionNotes("");
          break;
        case "reject":
          nextReview = await contractsApi.rejectManualReview(reviewDetail.id, {
            notes: reviewDecisionNotes.trim() || null,
          });
          setReviewDecisionNotes("");
          break;
      }

      if (nextReview) {
        setReviewDetail(nextReview);
      }
      setReviewActionMode(null);
      await Promise.all([loadReviewDetail(), loadReviews(), loadContracts()]);
    } catch (error) {
      setReviewDetailError(resolveErrorMessage(error, "review_detail.errors.action"));
    } finally {
      setReviewActionLoading(null);
    }
  };

  const handleSignedPdfUpload = async () => {
    if (!selectedSignatureId || !signatureUploadFile) {
      setSignatureDetailError(t("signature_detail.errors.file_required"));
      return;
    }

    setSignatureUploadLoading(true);
    setSignatureDetailError(null);

    try {
      const response = await adminContractsApi.uploadSignedPdf(
        selectedSignatureId,
        signatureUploadFile
      );
      setSignatureDetail(response.signature);
      setSignatureUploadFile(null);
      if (signatureUploadInputRef.current) {
        signatureUploadInputRef.current.value = "";
      }
      await loadSignatures();
    } catch (error) {
      setSignatureDetailError(resolveErrorMessage(error, "signature_detail.errors.upload"));
    } finally {
      setSignatureUploadLoading(false);
    }
  };

  const handleSignedPdfDownload = async () => {
    if (!selectedSignatureId || !signatureDetail) {
      return;
    }

    setSignatureDownloadLoading(true);
    setSignatureDetailError(null);

    try {
      const response = await contractsApi.getSignedPdfResponse(selectedSignatureId);
      await downloadResponseBlob(
        response,
        signatureDetail.fully_signed_document?.file_name ??
          signatureDetail.signed_document?.file_name ??
          `${signatureDetail.contract?.reference || "contract"}-signed.pdf`
      );
    } catch (error) {
      setSignatureDetailError(resolveErrorMessage(error, "signature_detail.errors.download"));
    } finally {
      setSignatureDownloadLoading(false);
    }
  };

  const signatureUploadLabel = useMemo(() => {
    const flowStatus = String(signatureDetail?.flow_status ?? "").toUpperCase();

    if (flowStatus === "AWAITING_CLIENT_UPLOAD") {
      return t("signature_detail.actions.upload_client");
    }

    if (flowStatus === "AWAITING_PROVIDER_UPLOAD") {
      return t("signature_detail.actions.upload_provider");
    }

    return t("signature_detail.actions.upload_generic");
  }, [signatureDetail?.flow_status, t]);

  const latestSignatureValidation = useMemo(
    () => getLatestContractSignatureValidation(signatureDetail),
    [signatureDetail]
  );

  if (loading || userLoading || (!hasAnyContractAccess && !checkRequirement(user, { superuser: true }))) {
    return (
      <ProjectAdminShell>
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <AdminSpinner />
        </div>
      </ProjectAdminShell>
    );
  }

  if (!hasAnyContractAccess) {
    return null;
  }

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={t("title")}
          description={t("description")}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void refreshActiveTab();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("actions.refresh")}
            </Button>
          }
        />

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            startTransition(() => setActiveTab(value as ContractsAdminTab));
          }}
          className="space-y-6"
        >
          <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
            {canViewContracts ? (
              <TabsTrigger value="contracts">{t("tabs.contracts")}</TabsTrigger>
            ) : null}
            {canReadReviews ? (
              <TabsTrigger value="reviews">{t("tabs.reviews")}</TabsTrigger>
            ) : null}
            {canReadSignatures ? (
              <TabsTrigger value="signatures">{t("tabs.signatures")}</TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AdminErrorBanner title={t("overview.errors.title")} message={statsError} />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AdminSummaryCard
                title={t("overview.cards.contracts")}
                value={statsLoading ? "…" : stats?.contracts.total ?? 0}
                icon={FileSignature}
                colorClassName="bg-gradient-to-br from-sky-500 to-cyan-400"
              />
              <AdminSummaryCard
                title={t("overview.cards.reviews")}
                value={statsLoading ? "…" : stats?.reviews.open_like_total ?? 0}
                icon={MessageSquareText}
                colorClassName="bg-gradient-to-br from-amber-500 to-orange-400"
                badge={
                  <Badge variant="outline">
                    {t("overview.cards.urgent_badge", {
                      count: stats?.reviews.urgent_total ?? 0,
                    })}
                  </Badge>
                }
              />
              <AdminSummaryCard
                title={t("overview.cards.signatures")}
                value={statsLoading ? "…" : stats?.signatures.active_total ?? 0}
                icon={Signature}
                colorClassName="bg-gradient-to-br from-emerald-500 to-teal-400"
                badge={
                  <Badge variant="outline">
                    {t("overview.cards.stalled_badge", {
                      count: stats?.signatures.stalled_total ?? 0,
                    })}
                  </Badge>
                }
              />
              <AdminSummaryCard
                title={t("overview.cards.obligations")}
                value={statsLoading ? "…" : stats?.obligations.overdue_total ?? 0}
                icon={Clock3}
                colorClassName="bg-gradient-to-br from-rose-500 to-pink-400"
                badge={
                  <Badge variant="outline">
                    {t("overview.cards.due_soon_badge", {
                      count: stats?.obligations.due_soon_total ?? 0,
                    })}
                  </Badge>
                }
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
              <AdminSectionCard
                title={t("overview.operational.title")}
                description={t("overview.operational.description")}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="text-sm font-semibold">{t("overview.operational.flow_status_title")}</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("overview.operational.flow_status_body")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="text-sm font-semibold">{t("overview.operational.upload_title")}</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("overview.operational.upload_body")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="text-sm font-semibold">{t("overview.operational.backfill_title")}</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("overview.operational.backfill_body")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="text-sm font-semibold">{t("overview.operational.business_title")}</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("overview.operational.business_body")}
                    </p>
                  </div>
                </div>
              </AdminSectionCard>

              <AdminSectionCard
                title={t("overview.error_reference.title")}
                description={t("overview.error_reference.description")}
              >
                <div className="space-y-3 text-sm">
                  <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
                    <div className="font-semibold">401</div>
                    <div className="text-muted-foreground">{t("overview.error_reference.unauthenticated")}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
                    <div className="font-semibold">403</div>
                    <div className="text-muted-foreground">{t("overview.error_reference.forbidden")}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
                    <div className="font-semibold">404</div>
                    <div className="text-muted-foreground">{t("overview.error_reference.not_found")}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
                    <div className="font-semibold">422</div>
                    <div className="text-muted-foreground">{t("overview.error_reference.validation")}</div>
                  </div>
                </div>
              </AdminSectionCard>
            </div>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            <AdminErrorBanner title={t("contracts_tab.errors.title")} message={contractsError} />

            <AdminSectionCard
              title={t("contracts_tab.filters.title")}
              description={t("contracts_tab.filters.description")}
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <AdminSearchInput
                  value={contractSearch}
                  onChange={(event) => {
                    setContractSearch(event.target.value);
                    setContractPage(1);
                  }}
                  placeholder={t("contracts_tab.filters.search")}
                  className="relative xl:col-span-2"
                />
                <Select
                  value={contractStatus}
                  onValueChange={(value) => {
                    setContractStatus(value);
                    setContractPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("contracts_tab.filters.status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {CONTRACT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {humanizeCode(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={contractRisk}
                  onValueChange={(value) => {
                    setContractRisk(value);
                    setContractPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("contracts_tab.filters.risk")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {RISK_LEVEL_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {humanizeCode(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={contractRequiresReview}
                  onValueChange={(value) => {
                    setContractRequiresReview(value);
                    setContractPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("contracts_tab.filters.manual_review")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    <SelectItem value="true">{t("common.yes")}</SelectItem>
                    <SelectItem value="false">{t("common.no")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AdminSectionCard>

            <AdminSectionCard
              title={t("contracts_tab.list.title")}
              description={t("contracts_tab.list.description", {
                count: contracts?.total ?? 0,
              })}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">{t("contracts_tab.table.reference")}</th>
                      <th className="px-4 py-3">{t("contracts_tab.table.project")}</th>
                      <th className="px-4 py-3">{t("contracts_tab.table.status")}</th>
                      <th className="px-4 py-3">{t("contracts_tab.table.risk")}</th>
                      <th className="px-4 py-3">{t("contracts_tab.table.signature_level")}</th>
                      <th className="px-4 py-3">{t("contracts_tab.table.generated_at")}</th>
                      <th className="px-4 py-3">{t("contracts_tab.table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractsLoading ? <AdminTableLoadingRow colSpan={7} /> : null}
                    {!contractsLoading && (contracts?.data.length ?? 0) === 0 ? (
                      <EmptyTableMessage
                        icon={FileSignature}
                        title={t("contracts_tab.empty_title")}
                        description={t("contracts_tab.empty_description")}
                        colSpan={7}
                      />
                    ) : null}
                    {!contractsLoading
                      ? contracts?.data.map((contract) => (
                          <tr
                            key={contract.id}
                            className="border-b border-border/60 transition-colors hover:bg-muted/30"
                          >
                            <td className="px-4 py-4 font-medium">{contract.reference}</td>
                            <td className="px-4 py-4">
                              <div>{contract.project?.title ?? t("common.unavailable")}</div>
                              <div className="text-xs text-muted-foreground">
                                {contract.project?.reference ?? "—"}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <Badge variant="outline" className={getToneClass(contract.status)}>
                                {humanizeCode(contract.status)}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              {contract.latest_risk?.overall_risk ? (
                                <Badge variant="outline">
                                  {humanizeCode(contract.latest_risk.overall_risk)}
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-4 py-4">{contract.signature_level ?? "—"}</td>
                            <td className="px-4 py-4">
                              {formatDateTime(contract.generated_at, locale) ?? "—"}
                            </td>
                            <td className="px-4 py-4">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedContractId(contract.id);
                                  setContractDialogOpen(true);
                                }}
                              >
                                {t("common.view")}
                              </Button>
                            </td>
                          </tr>
                        ))
                      : null}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
                <div>
                  {t("common.pagination", {
                    current: contracts?.current_page ?? 1,
                    total: contracts?.last_page ?? 1,
                  })}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={(contracts?.current_page ?? 1) <= 1}
                    onClick={() => setContractPage((current) => Math.max(1, current - 1))}
                  >
                    {t("common.previous")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={(contracts?.current_page ?? 1) >= (contracts?.last_page ?? 1)}
                    onClick={() =>
                      setContractPage((current) =>
                        Math.min(contracts?.last_page ?? current, current + 1)
                      )
                    }
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            </AdminSectionCard>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <AdminErrorBanner title={t("reviews_tab.errors.title")} message={reviewsError} />

            <AdminSectionCard
              title={t("reviews_tab.filters.title")}
              description={t("reviews_tab.filters.description")}
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <AdminSearchInput
                  value={reviewSearch}
                  onChange={(event) => {
                    setReviewSearch(event.target.value);
                    setReviewPage(1);
                  }}
                  placeholder={t("reviews_tab.filters.search")}
                  className="relative xl:col-span-2"
                />
                <Select
                  value={reviewStatus}
                  onValueChange={(value) => {
                    setReviewStatus(value);
                    setReviewPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("reviews_tab.filters.status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {REVIEW_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {humanizeCode(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={reviewPriority}
                  onValueChange={(value) => {
                    setReviewPriority(value);
                    setReviewPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("reviews_tab.filters.priority")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {REVIEW_PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {humanizeCode(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={reviewContractStatus}
                  onValueChange={(value) => {
                    setReviewContractStatus(value);
                    setReviewPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("reviews_tab.filters.contract_status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {CONTRACT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {humanizeCode(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AdminSectionCard>

            <AdminSectionCard
              title={t("reviews_tab.list.title")}
              description={t("reviews_tab.list.description", {
                count: reviews?.total ?? 0,
              })}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">{t("reviews_tab.table.contract")}</th>
                      <th className="px-4 py-3">{t("reviews_tab.table.status")}</th>
                      <th className="px-4 py-3">{t("reviews_tab.table.priority")}</th>
                      <th className="px-4 py-3">{t("reviews_tab.table.assigned_to")}</th>
                      <th className="px-4 py-3">{t("reviews_tab.table.due_at")}</th>
                      <th className="px-4 py-3">{t("reviews_tab.table.comments")}</th>
                      <th className="px-4 py-3">{t("reviews_tab.table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewsLoading ? <AdminTableLoadingRow colSpan={7} /> : null}
                    {!reviewsLoading && (reviews?.data.length ?? 0) === 0 ? (
                      <EmptyTableMessage
                        icon={MessageSquareText}
                        title={t("reviews_tab.empty_title")}
                        description={t("reviews_tab.empty_description")}
                        colSpan={7}
                      />
                    ) : null}
                    {!reviewsLoading
                      ? reviews?.data.map((review) => (
                          <tr
                            key={review.id}
                            className="border-b border-border/60 transition-colors hover:bg-muted/30"
                          >
                            <td className="px-4 py-4">
                              <div className="font-medium">
                                {review.contract?.reference ?? t("common.unavailable")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {review.review_summary ?? t("reviews_tab.no_summary")}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <Badge variant="outline" className={getToneClass(review.status)}>
                                {humanizeCode(review.status)}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              {review.priority ? humanizeCode(review.priority) : "—"}
                            </td>
                            <td className="px-4 py-4">
                              {review.assigned_to_user?.name ??
                                review.assigned_to_user?.email ??
                                "—"}
                            </td>
                            <td className="px-4 py-4">
                              {formatDateTime(review.due_at, locale) ?? "—"}
                            </td>
                            <td className="px-4 py-4">{review.comments_count}</td>
                            <td className="px-4 py-4">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReviewId(review.id);
                                  setReviewDialogOpen(true);
                                }}
                              >
                                {t("common.view")}
                              </Button>
                            </td>
                          </tr>
                        ))
                      : null}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
                <div>
                  {t("common.pagination", {
                    current: reviews?.current_page ?? 1,
                    total: reviews?.last_page ?? 1,
                  })}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={(reviews?.current_page ?? 1) <= 1}
                    onClick={() => setReviewPage((current) => Math.max(1, current - 1))}
                  >
                    {t("common.previous")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={(reviews?.current_page ?? 1) >= (reviews?.last_page ?? 1)}
                    onClick={() =>
                      setReviewPage((current) =>
                        Math.min(reviews?.last_page ?? current, current + 1)
                      )
                    }
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            </AdminSectionCard>
          </TabsContent>

          <TabsContent value="signatures" className="space-y-6">
            <AdminErrorBanner title={t("signatures_tab.errors.title")} message={signaturesError} />

            <AdminSectionCard
              title={t("signatures_tab.filters.title")}
              description={t("signatures_tab.filters.description")}
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <AdminSearchInput
                  value={signatureSearch}
                  onChange={(event) => {
                    setSignatureSearch(event.target.value);
                    setSignaturePage(1);
                  }}
                  placeholder={t("signatures_tab.filters.search")}
                  className="relative xl:col-span-2"
                />
                <Select
                  value={signatureStatus}
                  onValueChange={(value) => {
                    setSignatureStatus(value);
                    setSignaturePage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("signatures_tab.filters.status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {SIGNATURE_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {humanizeCode(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={signatureLevel}
                  onValueChange={(value) => {
                    setSignatureLevel(value);
                    setSignaturePage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("signatures_tab.filters.signature_level")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {SIGNATURE_LEVEL_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={signatureContractStatus}
                  onValueChange={(value) => {
                    setSignatureContractStatus(value);
                    setSignaturePage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("signatures_tab.filters.contract_status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {CONTRACT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {humanizeCode(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AdminSectionCard>

            <AdminSectionCard
              title={t("signatures_tab.list.title")}
              description={t("signatures_tab.list.description", {
                count: signatures?.total ?? 0,
              })}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">{t("signatures_tab.table.contract")}</th>
                      <th className="px-4 py-3">{t("signatures_tab.table.flow_status")}</th>
                      <th className="px-4 py-3">{t("signatures_tab.table.status")}</th>
                      <th className="px-4 py-3">{t("signatures_tab.table.sent_at")}</th>
                      <th className="px-4 py-3">{t("signatures_tab.table.last_event_at")}</th>
                      <th className="px-4 py-3">{t("signatures_tab.table.events")}</th>
                      <th className="px-4 py-3">{t("signatures_tab.table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signaturesLoading ? <AdminTableLoadingRow colSpan={7} /> : null}
                    {!signaturesLoading && (signatures?.data.length ?? 0) === 0 ? (
                      <EmptyTableMessage
                        icon={Signature}
                        title={t("signatures_tab.empty_title")}
                        description={t("signatures_tab.empty_description")}
                        colSpan={7}
                      />
                    ) : null}
                    {!signaturesLoading
                      ? signatures?.data.map((signature) => (
                          <tr
                            key={signature.id}
                            className="border-b border-border/60 transition-colors hover:bg-muted/30"
                          >
                            <td className="px-4 py-4">
                              <div className="font-medium">
                                {signature.contract?.reference ?? t("common.unavailable")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {signature.flow_reference ?? "—"}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {signature.flow_status ? (
                                <Badge
                                  variant="outline"
                                  className={getToneClass(signature.flow_status)}
                                >
                                  {humanizeCode(signature.flow_status)}
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <Badge variant="outline" className={getToneClass(signature.status)}>
                                {humanizeCode(signature.status)}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              {formatDateTime(signature.sent_at, locale) ?? "—"}
                            </td>
                            <td className="px-4 py-4">
                              {formatDateTime(signature.last_event_at, locale) ?? "—"}
                            </td>
                            <td className="px-4 py-4">{signature.events_count}</td>
                            <td className="px-4 py-4">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSignatureId(signature.id);
                                  setSignatureDialogOpen(true);
                                }}
                              >
                                {t("common.view")}
                              </Button>
                            </td>
                          </tr>
                        ))
                      : null}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
                <div>
                  {t("common.pagination", {
                    current: signatures?.current_page ?? 1,
                    total: signatures?.last_page ?? 1,
                  })}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={(signatures?.current_page ?? 1) <= 1}
                    onClick={() => setSignaturePage((current) => Math.max(1, current - 1))}
                  >
                    {t("common.previous")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={(signatures?.current_page ?? 1) >= (signatures?.last_page ?? 1)}
                    onClick={() =>
                      setSignaturePage((current) =>
                        Math.min(signatures?.last_page ?? current, current + 1)
                      )
                    }
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            </AdminSectionCard>
          </TabsContent>
        </Tabs>

        <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{t("contract_detail.title")}</DialogTitle>
              <DialogDescription>{t("contract_detail.description")}</DialogDescription>
            </DialogHeader>

            <AdminErrorBanner
              title={t("contract_detail.errors.title")}
              message={contractDetailError}
            />

            {contractDetailLoading ? (
              <div className="py-10">
                <AdminSpinner />
              </div>
            ) : contractDetail ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={getToneClass(contractDetail.status)}>
                    {humanizeCode(contractDetail.status)}
                  </Badge>
                  {contractDetail.signature_level ? (
                    <Badge variant="outline">{contractDetail.signature_level}</Badge>
                  ) : null}
                  {contractDetail.requires_manual_review ? (
                    <Badge variant="outline">{t("contract_detail.badges.manual_review")}</Badge>
                  ) : null}
                  {contractDetail.requires_qes ? (
                    <Badge variant="outline">{t("contract_detail.badges.qes")}</Badge>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void handleContractPreview();
                    }}
                    disabled={contractPreviewLoading}
                  >
                    {contractPreviewLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileSearch className="mr-2 h-4 w-4" />
                    )}
                    {t("contract_detail.actions.preview_html")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void handleContractDownload();
                    }}
                    disabled={contractDownloadLoading}
                  >
                    {contractDownloadLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {t("contract_detail.actions.download_pdf")}
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("contract_detail.labels.reference")}
                    </div>
                    <div className="mt-2 text-sm font-semibold">{contractDetail.reference}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("contract_detail.labels.project")}
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      {contractDetail.project?.title ?? t("common.unavailable")}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("contract_detail.labels.value")}
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      {formatMoney(
                        contractDetail.total_amount,
                        contractDetail.currency,
                        locale
                      ) ?? t("common.unavailable")}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("contract_detail.labels.updated_at")}
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      {formatDateTime(contractDetail.updated_at, locale) ??
                        t("common.unavailable")}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
                  <AdminSectionCard
                    title={t("contract_detail.risk_title")}
                    description={t("contract_detail.risk_description")}
                  >
                    {contractDetail.latest_risk_assessment ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {[
                            contractDetail.latest_risk_assessment.overall_risk,
                            contractDetail.latest_risk_assessment.misclassification_risk,
                            contractDetail.latest_risk_assessment.gdpr_risk,
                            contractDetail.latest_risk_assessment.ip_risk,
                            contractDetail.latest_risk_assessment.tax_risk,
                          ]
                            .filter(Boolean)
                            .map((entry) => (
                              <Badge key={entry} variant="outline">
                                {humanizeCode(entry)}
                              </Badge>
                            ))}
                        </div>
                        {contractDetail.latest_risk_assessment.warnings.length > 0 ? (
                          <div>
                            <div className="text-sm font-medium">
                              {t("contract_detail.warnings")}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {contractDetail.latest_risk_assessment.warnings.map((warning) => (
                                <Badge key={warning} variant="outline">
                                  {humanizeCode(warning)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {contractDetail.latest_risk_assessment.blocking_reasons.length > 0 ? (
                          <div>
                            <div className="text-sm font-medium">
                              {t("contract_detail.blocking_reasons")}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {contractDetail.latest_risk_assessment.blocking_reasons.map(
                                (reason) => (
                                  <Badge
                                    key={reason}
                                    variant="outline"
                                    className="border-red-200 bg-red-50 text-red-700"
                                  >
                                    {humanizeCode(reason)}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t("contract_detail.no_risk")}
                      </p>
                    )}
                  </AdminSectionCard>

                  <AdminSectionCard
                    title={t("contract_detail.documents_title")}
                    description={t("contract_detail.documents_description")}
                  >
                    <div className="space-y-3">
                      {contractDetail.documents.map((document) => (
                        <div
                          key={document.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium">
                              {document.file_name ?? t("common.unavailable")}
                            </div>
                            <div className="flex gap-2">
                              {document.document_role ? (
                                <Badge variant="outline">
                                  {humanizeCode(document.document_role)}
                                </Badge>
                              ) : null}
                              {document.is_current ? (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                                >
                                  {t("contract_detail.current_document")}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {document.mime_type ?? "—"} •{" "}
                            {formatDateTime(document.created_at, locale) ?? "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 text-sm text-muted-foreground">
                      {t("contract_detail.backfill_note")}
                    </div>
                  </AdminSectionCard>
                </div>

                <AdminSectionCard
                  title={t("contract_detail.notes_title")}
                  description={t("contract_detail.notes_description")}
                >
                  {canCreateNotes ? (
                    <div className="mb-4 grid gap-3 md:grid-cols-[200px,1fr,auto]">
                      <Select
                        value={contractNoteType}
                        onValueChange={(value) =>
                          setContractNoteType(
                            value as (typeof CONTRACT_NOTE_TYPE_OPTIONS)[number]
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTRACT_NOTE_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {humanizeCode(option)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        value={contractNoteBody}
                        onChange={(event) => setContractNoteBody(event.target.value)}
                        placeholder={t("contract_detail.note_placeholder")}
                        rows={3}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          void handleCreateContractNote();
                        }}
                        disabled={contractNoteLoading}
                      >
                        {contractNoteLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <SquarePen className="mr-2 h-4 w-4" />
                        )}
                        {t("contract_detail.actions.add_note")}
                      </Button>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    {contractDetail.notes.length > 0 ? (
                      contractDetail.notes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              {humanizeCode(note.note_type)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(note.created_at, locale) ?? "—"}
                            </span>
                          </div>
                          <div className="mt-2 text-sm">{note.body}</div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {note.author_user?.name ?? note.author_user?.email ?? "—"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t("contract_detail.no_notes")}
                      </p>
                    )}
                  </div>
                </AdminSectionCard>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{t("review_detail.title")}</DialogTitle>
              <DialogDescription>{t("review_detail.description")}</DialogDescription>
            </DialogHeader>

            <AdminErrorBanner
              title={t("review_detail.errors.title")}
              message={reviewDetailError}
            />

            {reviewDetailLoading ? (
              <div className="py-10">
                <AdminSpinner />
              </div>
            ) : reviewDetail ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={getToneClass(reviewDetail.status)}>
                    {humanizeCode(reviewDetail.status)}
                  </Badge>
                  {reviewDetail.priority ? (
                    <Badge variant="outline">{humanizeCode(reviewDetail.priority)}</Badge>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("review_detail.labels.contract")}
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      {reviewDetail.contract?.reference ?? t("common.unavailable")}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("review_detail.labels.assigned_to")}
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      {reviewDetail.assigned_to_user?.name ??
                        reviewDetail.assigned_to_user?.email ??
                        t("common.unavailable")}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("review_detail.labels.opened_at")}
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      {formatDateTime(reviewDetail.opened_at, locale) ??
                        t("common.unavailable")}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("review_detail.labels.due_at")}
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      {formatDateTime(reviewDetail.due_at, locale) ??
                        t("common.unavailable")}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="text-sm font-semibold">{reviewDetail.review_summary ?? t("review_detail.no_summary")}</div>
                  {reviewDetail.review_reason_codes.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {reviewDetail.review_reason_codes.map((reason) => (
                        <Badge key={reason} variant="outline">
                          {humanizeCode(reason)}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {reviewDetail.requested_changes.length > 0 ? (
                    <div className="mt-4">
                      <div className="text-sm font-medium">
                        {t("review_detail.labels.requested_changes")}
                      </div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {reviewDetail.requested_changes.map((entry) => (
                          <li key={entry}>{entry}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {reviewDetail.final_decision_notes ? (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-3 text-sm">
                      {reviewDetail.final_decision_notes}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {canAssignReviews ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReviewActionMode("assign")}
                    >
                      {t("review_detail.actions.assign")}
                    </Button>
                  ) : null}
                  {canStartReviews ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReviewActionMode("start")}
                    >
                      {t("review_detail.actions.start")}
                    </Button>
                  ) : null}
                  {canRequestReviewChanges ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReviewActionMode("request_changes")}
                    >
                      {t("review_detail.actions.request_changes")}
                    </Button>
                  ) : null}
                  {canApproveReviews ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReviewActionMode("approve")}
                    >
                      {t("review_detail.actions.approve")}
                    </Button>
                  ) : null}
                  {canRejectReviews ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReviewActionMode("reject")}
                    >
                      {t("review_detail.actions.reject")}
                    </Button>
                  ) : null}
                </div>

                {reviewActionMode ? (
                  <AdminSectionCard
                    title={t(`review_detail.actions.${reviewActionMode}` as never)}
                    description={t("review_detail.action_description")}
                  >
                    <div className="space-y-3">
                      {reviewActionMode === "assign" ? (
                        <>
                          <Input
                            value={reviewAssignUserId}
                            onChange={(event) => setReviewAssignUserId(event.target.value)}
                            placeholder={t("review_detail.placeholders.assigned_user_id")}
                          />
                          <Textarea
                            value={reviewAssignComment}
                            onChange={(event) => setReviewAssignComment(event.target.value)}
                            placeholder={t("review_detail.placeholders.comment")}
                            rows={3}
                          />
                        </>
                      ) : null}
                      {reviewActionMode === "start" ? (
                        <Textarea
                          value={reviewStartComment}
                          onChange={(event) => setReviewStartComment(event.target.value)}
                          placeholder={t("review_detail.placeholders.comment")}
                          rows={3}
                        />
                      ) : null}
                      {reviewActionMode === "request_changes" ? (
                        <>
                          <Textarea
                            value={reviewRequestedChanges}
                            onChange={(event) => setReviewRequestedChanges(event.target.value)}
                            placeholder={t("review_detail.placeholders.requested_changes")}
                            rows={4}
                          />
                          <Textarea
                            value={reviewRequestedChangesComment}
                            onChange={(event) =>
                              setReviewRequestedChangesComment(event.target.value)
                            }
                            placeholder={t("review_detail.placeholders.comment")}
                            rows={3}
                          />
                        </>
                      ) : null}
                      {reviewActionMode === "approve" || reviewActionMode === "reject" ? (
                        <Textarea
                          value={reviewDecisionNotes}
                          onChange={(event) => setReviewDecisionNotes(event.target.value)}
                          placeholder={t("review_detail.placeholders.notes")}
                          rows={4}
                        />
                      ) : null}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => {
                            void handleReviewAction();
                          }}
                          disabled={reviewActionLoading === reviewActionMode}
                        >
                          {reviewActionLoading === reviewActionMode ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {t("review_detail.actions.submit")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setReviewActionMode(null)}
                        >
                          {t("review_detail.actions.cancel")}
                        </Button>
                      </div>
                    </div>
                  </AdminSectionCard>
                ) : null}

                <AdminSectionCard
                  title={t("review_detail.comments_title")}
                  description={t("review_detail.comments_description")}
                >
                  {canCreateReviewComments ? (
                    <div className="mb-4 grid gap-3 md:grid-cols-[220px,1fr,auto]">
                      <Select
                        value={reviewCommentType}
                        onValueChange={(value) =>
                          setReviewCommentType(
                            value as (typeof REVIEW_COMMENT_TYPE_OPTIONS)[number]
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REVIEW_COMMENT_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {humanizeCode(option)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        value={reviewCommentBody}
                        onChange={(event) => setReviewCommentBody(event.target.value)}
                        placeholder={t("review_detail.placeholders.comment")}
                        rows={3}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          void handleCreateReviewComment();
                        }}
                        disabled={reviewCommentLoading}
                      >
                        {reviewCommentLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <SquarePen className="mr-2 h-4 w-4" />
                        )}
                        {t("review_detail.actions.add_comment")}
                      </Button>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    {reviewDetail.comments.length > 0 ? (
                      reviewDetail.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              {humanizeCode(comment.comment_type)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(comment.created_at, locale) ?? "—"}
                            </span>
                          </div>
                          <div className="mt-2 text-sm">{comment.body}</div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {comment.author_user?.name ??
                              comment.author_user?.email ??
                              "—"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t("review_detail.no_comments")}
                      </p>
                    )}
                  </div>
                </AdminSectionCard>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{t("signature_detail.title")}</DialogTitle>
              <DialogDescription>{t("signature_detail.description")}</DialogDescription>
            </DialogHeader>

            <AdminErrorBanner
              title={t("signature_detail.errors.title")}
              message={signatureDetailError}
            />

            {signatureDetailLoading ? (
              <div className="py-10">
                <AdminSpinner />
              </div>
            ) : signatureDetail ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={getToneClass(signatureDetail.status)}>
                    {humanizeCode(signatureDetail.status)}
                  </Badge>
                  {signatureDetail.flow_status ? (
                    <Badge
                      variant="outline"
                      className={getToneClass(signatureDetail.flow_status)}
                    >
                      {humanizeCode(signatureDetail.flow_status)}
                    </Badge>
                  ) : null}
                  {signatureDetail.signature_level ? (
                    <Badge variant="outline">{signatureDetail.signature_level}</Badge>
                  ) : null}
                </div>

                <Alert>
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>{t("signature_detail.operational_title")}</AlertTitle>
                  <AlertDescription>
                    {t("signature_detail.operational_body")}
                  </AlertDescription>
                </Alert>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("signature_detail.labels.contract")}
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      {signatureDetail.contract?.reference ?? t("common.unavailable")}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("signature_detail.labels.validation_policy")}
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      {signatureDetail.validation_policy_code ?? t("common.unavailable")}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("signature_detail.labels.sent_at")}
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      {formatDateTime(signatureDetail.sent_at, locale) ??
                        t("common.unavailable")}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("signature_detail.labels.completed_at")}
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      {formatDateTime(signatureDetail.completed_at, locale) ??
                        t("common.unavailable")}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void handleSignedPdfDownload();
                    }}
                    disabled={signatureDownloadLoading}
                  >
                    {signatureDownloadLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {t("signature_detail.actions.download_signed_pdf")}
                  </Button>
                </div>

                <AdminSectionCard
                  title={t("signature_detail.upload_title")}
                  description={t("signature_detail.upload_description")}
                >
                  {canUploadSignedPdf ? (
                    <div className="grid gap-3 md:grid-cols-[1fr,auto] md:items-end">
                      <div className="space-y-2">
                        <Input
                          ref={signatureUploadInputRef}
                          type="file"
                          accept="application/pdf"
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setSignatureUploadFile(event.target.files?.[0] ?? null)
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          {signatureUploadFile?.name ??
                            t("signature_detail.no_file_selected")}
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          void handleSignedPdfUpload();
                        }}
                        disabled={signatureUploadLoading}
                      >
                        {signatureUploadLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <UploadIcon />
                        )}
                        {signatureUploadLabel}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("signature_detail.no_upload_permission")}
                    </p>
                  )}
                </AdminSectionCard>

                <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
                  <AdminSectionCard
                    title={t("signature_detail.documents_title")}
                    description={t("signature_detail.documents_description")}
                  >
                    <div className="space-y-3">
                      {[
                        signatureDetail.base_document,
                        signatureDetail.client_signed_document,
                        signatureDetail.fully_signed_document,
                        signatureDetail.signed_document,
                      ]
                        .filter(Boolean)
                        .map((document) => (
                          <div
                            key={document!.id}
                            className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              {document?.document_role ? (
                                <Badge variant="outline">
                                  {humanizeCode(document.document_role)}
                                </Badge>
                              ) : null}
                              <span className="text-sm font-medium">
                                {document?.file_name ?? t("common.unavailable")}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {document?.mime_type ?? "—"} • {document?.sha256_hash ?? "—"}
                            </div>
                          </div>
                        ))}
                    </div>
                  </AdminSectionCard>

                  <AdminSectionCard
                    title={t("signature_detail.signers_title")}
                    description={t("signature_detail.signers_description")}
                  >
                    <div className="space-y-3">
                      {signatureDetail.required_signer_sequence.length > 0 ? (
                        signatureDetail.required_signer_sequence.map((entry, index) => {
                          const payload =
                            typeof entry === "object" && entry !== null
                              ? (entry as Record<string, unknown>)
                              : null;
                          const signerOrder =
                            typeof payload?.order === "number" ||
                            typeof payload?.order === "string"
                              ? payload.order
                              : index + 1;

                          return (
                            <div
                              key={`${payload?.role ?? "signer"}-${index}`}
                              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">
                                  {humanizeCode(String(payload?.role ?? `Signer ${index + 1}`))}
                                </Badge>
                                <Badge variant="outline">
                                  {t("signature_detail.signer_order", {
                                    value: signerOrder,
                                  })}
                                </Badge>
                              </div>
                              <div className="mt-2 text-sm">
                                {String(payload?.signatory_name ?? t("common.unavailable"))}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {String(payload?.signatory_email ?? "—")} •{" "}
                                {String(payload?.signature_field_name ?? "—")}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {t("signature_detail.no_signers")}
                        </p>
                      )}
                    </div>
                  </AdminSectionCard>
                </div>

                <AdminSectionCard
                  title={t("signature_detail.events_title")}
                  description={t("signature_detail.events_description")}
                >
                  <div className="space-y-3">
                    {signatureDetail.events.length > 0 ? (
                      signatureDetail.events.map((event) => (
                        <div
                          key={event.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              {humanizeCode(event.event_type)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(event.occurred_at, locale) ?? "—"}
                            </span>
                          </div>
                          <div className="mt-2 text-sm">
                            {event.actor_email ?? event.actor_role ?? "—"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t("signature_detail.no_events")}
                      </p>
                    )}
                  </div>
                </AdminSectionCard>

                <AdminSectionCard
                  title={t("signature_detail.validations_title")}
                  description={t("signature_detail.validations_description")}
                >
                  {latestSignatureValidation ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {latestSignatureValidation.validation_status ? (
                          <Badge
                            variant="outline"
                            className={getToneClass(
                              latestSignatureValidation.validation_status
                            )}
                          >
                            {humanizeCode(latestSignatureValidation.validation_status)}
                          </Badge>
                        ) : null}
                        {latestSignatureValidation.stage ? (
                          <Badge variant="outline">
                            {humanizeCode(latestSignatureValidation.stage)}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            {t("signature_detail.validation.signature_count")}
                          </div>
                          <div className="mt-2 text-sm font-semibold">
                            {latestSignatureValidation.signature_count_found ?? "—"}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            {t("signature_detail.validation.detected_level")}
                          </div>
                          <div className="mt-2 text-sm font-semibold">
                            {latestSignatureValidation.detected_signature_level ?? "—"}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            {t("signature_detail.validation.best_time")}
                          </div>
                          <div className="mt-2 text-sm font-semibold">
                            {formatDateTime(
                              latestSignatureValidation.best_signature_time,
                              locale
                            ) ?? "—"}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            {t("signature_detail.validation.integrity")}
                          </div>
                          <div className="mt-2 text-sm font-semibold">
                            {latestSignatureValidation.integrity_ok
                              ? t("common.ok")
                              : t("common.failed")}
                          </div>
                        </div>
                      </div>
                      {latestSignatureValidation.failure_reason ? (
                        <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 text-sm text-red-800">
                          {latestSignatureValidation.failure_reason}
                        </div>
                      ) : null}
                      {latestSignatureValidation.signers.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {latestSignatureValidation.signers.map((signer) => (
                            <div
                              key={signer.id}
                              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">
                                  {humanizeCode(signer.expected_role)}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={getToneClass(
                                    signer.signature_valid ? "valid" : "invalid"
                                  )}
                                >
                                  {signer.signature_valid
                                    ? t("signature_detail.validation.valid")
                                    : t("signature_detail.validation.invalid")}
                                </Badge>
                              </div>
                              <div className="mt-2 text-sm">
                                {signer.certificate_subject ?? t("common.unavailable")}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {signer.signature_field_name ?? "—"}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("signature_detail.no_validations")}
                    </p>
                  )}
                </AdminSectionCard>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </ProjectAdminShell>
  );
}

function UploadIcon() {
  return <FileText className="mr-2 h-4 w-4" />;
}
