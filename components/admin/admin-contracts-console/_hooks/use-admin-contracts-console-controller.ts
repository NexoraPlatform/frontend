import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";

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
  type AdminReviewQueueItem,
  type AdminSignatureQueueItem,
} from "@/lib/admin-contracts";
import {
  contractsApi,
  getLatestContractSignatureValidation,
  type ContractManualReviewEntity,
  type ContractSignatureEntity,
} from "@/lib/contracts";
import { FetchError } from "@/lib/fetch-client";
import { useRouter } from "@/lib/navigation";

import {
  downloadResponseBlob,
  extractValidationMessage,
  normalizeLines,
} from "../_lib/admin-contracts-console-helpers";
import {
  type ContractsAdminTab,
  type ReviewActionMode,
} from "../_lib/admin-contracts-console-types";

export function useAdminContractsConsoleController() {
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
        canReadReviewComments,
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
  const [contractNoteType, setContractNoteType] = useState<
    (typeof CONTRACT_NOTE_TYPE_OPTIONS)[number]
  >("INTERNAL");
  const [contractNoteBody, setContractNoteBody] = useState("");
  const [contractNoteLoading, setContractNoteLoading] = useState(false);
  const [contractPreviewLoading, setContractPreviewLoading] = useState(false);
  const [contractDownloadLoading, setContractDownloadLoading] = useState(false);

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [reviewDetail, setReviewDetail] = useState<ContractManualReviewEntity | null>(null);
  const [reviewDetailLoading, setReviewDetailLoading] = useState(false);
  const [reviewDetailError, setReviewDetailError] = useState<string | null>(null);
  const [reviewCommentType, setReviewCommentType] = useState<
    (typeof REVIEW_COMMENT_TYPE_OPTIONS)[number]
  >("INTERNAL");
  const [reviewCommentBody, setReviewCommentBody] = useState("");
  const [reviewCommentLoading, setReviewCommentLoading] = useState(false);
  const [reviewActionMode, setReviewActionMode] = useState<ReviewActionMode>(null);
  const [reviewActionLoading, setReviewActionLoading] = useState<string | null>(null);
  const [reviewAssignUserId, setReviewAssignUserId] = useState("");
  const [reviewAssignComment, setReviewAssignComment] = useState("");
  const [reviewStartComment, setReviewStartComment] = useState("");
  const [reviewRequestedChanges, setReviewRequestedChanges] = useState("");
  const [reviewRequestedChangesComment, setReviewRequestedChangesComment] =
    useState("");
  const [reviewDecisionNotes, setReviewDecisionNotes] = useState("");

  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | null>(null);
  const [signatureDetail, setSignatureDetail] = useState<ContractSignatureEntity | null>(
    null
  );
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

  const openContractDialog = useCallback((contractId: string) => {
    setSelectedContractId(contractId);
    setContractDialogOpen(true);
  }, []);

  const openReviewDialog = useCallback((reviewId: string) => {
    setSelectedReviewId(reviewId);
    setReviewDialogOpen(true);
  }, []);

  const openSignatureDialog = useCallback((signatureId: string) => {
    setSelectedSignatureId(signatureId);
    setSignatureDialogOpen(true);
  }, []);

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

  const shouldShowLoadingShell =
    loading ||
    userLoading ||
    (!hasAnyContractAccess && !checkRequirement(user, { superuser: true }));

  return {
    activeTab,
    canApproveReviews,
    canAssignReviews,
    canCreateNotes,
    canCreateReviewComments,
    canReadReviews,
    canReadSignatures,
    canRequestReviewChanges,
    canStartReviews,
    canRejectReviews,
    canUploadSignedPdf,
    canViewContracts,
    canViewDashboard,
    contractDetail,
    contractDetailError,
    contractDetailLoading,
    contractDialogOpen,
    contractDownloadLoading,
    contractNoteBody,
    contractNoteLoading,
    contractNoteType,
    contractPage,
    contractPreviewLoading,
    contractRequiresReview,
    contractRisk,
    contractSearch,
    contractStatus,
    contracts,
    contractsError,
    contractsLoading,
    handleContractDownload,
    handleContractPreview,
    handleCreateContractNote,
    handleCreateReviewComment,
    handleReviewAction,
    handleSignedPdfDownload,
    handleSignedPdfUpload,
    hasAnyContractAccess,
    initialTab,
    latestSignatureValidation,
    loadContracts,
    loadReviews,
    loadSignatures,
    locale,
    openContractDialog,
    openReviewDialog,
    openSignatureDialog,
    refreshActiveTab,
    reviewActionLoading,
    reviewActionMode,
    reviewAssignComment,
    reviewAssignUserId,
    reviewCommentBody,
    reviewCommentLoading,
    reviewCommentType,
    reviewContractStatus,
    reviewDecisionNotes,
    reviewDetail,
    reviewDetailError,
    reviewDetailLoading,
    reviewDialogOpen,
    reviewPage,
    reviewPriority,
    reviewRequestedChanges,
    reviewRequestedChangesComment,
    reviewSearch,
    reviewStartComment,
    reviewStatus,
    reviews,
    reviewsError,
    reviewsLoading,
    setActiveTab,
    setContractDialogOpen,
    setContractNoteBody,
    setContractNoteType,
    setContractPage,
    setContractRequiresReview,
    setContractRisk,
    setContractSearch,
    setContractStatus,
    setReviewActionMode,
    setReviewAssignComment,
    setReviewAssignUserId,
    setReviewCommentBody,
    setReviewCommentType,
    setReviewContractStatus,
    setReviewDecisionNotes,
    setReviewDialogOpen,
    setReviewPage,
    setReviewPriority,
    setReviewRequestedChanges,
    setReviewRequestedChangesComment,
    setReviewSearch,
    setReviewStartComment,
    setReviewStatus,
    setSignatureContractStatus,
    setSignatureDialogOpen,
    setSignatureLevel,
    setSignaturePage,
    setSignatureSearch,
    setSignatureStatus,
    setSignatureUploadFile,
    shouldShowLoadingShell,
    signatureContractStatus,
    signatureDetail,
    signatureDetailError,
    signatureDetailLoading,
    signatureDialogOpen,
    signatureDownloadLoading,
    signatureLevel,
    signaturePage,
    signatureSearch,
    signatureStatus,
    signatureUploadFile,
    signatureUploadInputRef,
    signatureUploadLabel,
    signatureUploadLoading,
    signatures,
    signaturesError,
    signaturesLoading,
    stats,
    statsError,
    statsLoading,
  };
}

export type AdminContractsConsoleController = ReturnType<
  typeof useAdminContractsConsoleController
>;
