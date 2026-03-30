'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  Download,
  FileCode2,
  FileSearch,
  FileText,
  Loader2,
  RefreshCw,
  Scale,
  ShieldCheck,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useOptionalAuth } from '@/contexts/auth-context';
import { usePublicAuth } from '@/hooks/use-public-auth';
import {
  getPermissionSlugs,
  getRoleSlugs,
  isSuperUser,
  type AccessUser,
} from '@/lib/access';
import { FetchError } from '@/lib/fetch-client';
import { cn } from '@/lib/utils';
import {
  contractsApi,
  extractFileNameFromContentDisposition,
  getCurrentContractDocument,
  getLatestContractRiskAssessment,
  getLatestContractSignatureValidation,
  type ContractManualReviewEntity,
  type ContractOperationsSnapshot,
  type ContractDocument,
  type ContractEntity,
  type ContractGenerationSummary,
  type ContractSignatureEntity,
} from '@/lib/contracts';
import { Link } from '@/lib/navigation';

type ProjectContractWorkspaceProps = {
  projectId: string | number;
  projectTitle?: string | null;
  projectClientId?: string | number | null;
  initialContractId?: string | number | null;
  locale?: string;
  autoGenerate?: boolean;
  variant?: 'panel' | 'dialog';
  className?: string;
};

const readCachedContractId = (projectId: string) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(`project-contract:${projectId}`);
    return raw && raw.trim() ? raw : null;
  } catch {
    return null;
  }
};

const writeCachedContractId = (projectId: string, contractId: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(`project-contract:${projectId}`, contractId);
  } catch {
    // Ignore client storage failures.
  }
};

const clearCachedContractId = (projectId: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(`project-contract:${projectId}`);
  } catch {
    // Ignore client storage failures.
  }
};

const resolveErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message.trim() ? error.message : fallback;

const normalizeId = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const formatFileSize = (value: number | null, locale: string) => {
  if (!value || value <= 0) {
    return null;
  }

  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ro-RO', {
    maximumFractionDigits: 1,
    style: 'unit',
    unit: value >= 1024 * 1024 ? 'megabyte' : 'kilobyte',
    unitDisplay: 'narrow',
  }).format(value >= 1024 * 1024 ? value / (1024 * 1024) : value / 1024);
};

const formatDateTime = (value: string | null, locale: string) => {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ro-RO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
};

const getStatusTone = (status: string) => {
  const normalized = status.trim().toLowerCase();

  if (normalized === 'signed' || normalized === 'ready_for_signature') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (
    normalized === 'awaiting_client_signature' ||
    normalized === 'awaiting_provider_signature'
  ) {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }

  if (normalized === 'pending_review' || normalized === 'sent_for_signature') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (normalized === 'blocked' || normalized === 'cancelled') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  return 'border-slate-200 bg-slate-100 text-slate-700';
};

const humanizeCode = (value: string | null | undefined) =>
  String(value ?? '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

const canGenerateContractsForProject = (
  user: AccessUser | null,
  projectClientId: string | null
) => {
  if (!user) {
    return false;
  }

  if (isSuperUser(user)) {
    return true;
  }

  const roleSlugs = getRoleSlugs(user);
  if (roleSlugs.some((role) => ['admin', 'support', 'legal'].includes(role))) {
    return true;
  }

  const permissions = new Set(getPermissionSlugs(user));
  if (
    permissions.has('contracts.generate') ||
    permissions.has('legal.contracts.generate')
  ) {
    return true;
  }

  return projectClientId !== null && String(user.id) === projectClientId;
};

const PRIVILEGED_CONTRACT_ROLES = new Set(['admin', 'support', 'legal']);

const isPrivilegedContractActor = (user: AccessUser | null) => {
  if (!user) {
    return false;
  }

  if (isSuperUser(user)) {
    return true;
  }

  return getRoleSlugs(user).some((role) => PRIVILEGED_CONTRACT_ROLES.has(role));
};

const getProcessTone = (value: string | null | undefined) => {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (
    normalized.includes('approved') ||
    normalized.includes('accepted') ||
    normalized.includes('ready') ||
    normalized.includes('signed') ||
    normalized.includes('validated')
  ) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (
    normalized.includes('rejected') ||
    normalized.includes('failed') ||
    normalized.includes('blocked') ||
    normalized.includes('cancelled') ||
    normalized.includes('declined')
  ) {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (
    normalized.includes('awaiting') ||
    normalized.includes('pending') ||
    normalized.includes('open') ||
    normalized.includes('review') ||
    normalized.includes('requested') ||
    normalized.includes('received') ||
    normalized.includes('sent')
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-slate-200 bg-slate-100 text-slate-700';
};

const normalizeTextLines = (value: string) =>
  value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);

export default function ProjectContractWorkspace({
  projectId,
  projectTitle,
  projectClientId,
  initialContractId,
  locale = 'ro',
  autoGenerate = false,
  variant = 'panel',
  className,
}: ProjectContractWorkspaceProps) {
  const t = useTranslations('projects.detail.contracts');
  const authContext = useOptionalAuth();
  const publicAuth = usePublicAuth(!authContext);
  const user = authContext?.user ?? publicAuth.user;
  const loading = authContext?.loading ?? publicAuth.loading;
  const userLoading = authContext?.userLoading ?? publicAuth.userLoading;
  const permissionSlugs = useMemo(() => getPermissionSlugs(user ?? null), [user]);
  const permissionSet = useMemo(() => new Set(permissionSlugs), [permissionSlugs]);
  const normalizedProjectId = normalizeId(projectId) ?? '';
  const normalizedProjectClientId = normalizeId(projectClientId);
  const normalizedInitialContractId = normalizeId(initialContractId);
  const [contractId, setContractId] = useState<string | null>(
    normalizedInitialContractId
  );
  const [contract, setContract] = useState<ContractEntity | null>(null);
  const [summary, setSummary] = useState<ContractGenerationSummary | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [loadingContract, setLoadingContract] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [operationsSnapshot, setOperationsSnapshot] =
    useState<ContractOperationsSnapshot | null>(null);
  const [manualReview, setManualReview] =
    useState<ContractManualReviewEntity | null>(null);
  const [signature, setSignature] = useState<ContractSignatureEntity | null>(null);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [reviewActionMode, setReviewActionMode] = useState<
    'open' | 'assign' | 'start' | 'request_changes' | 'approve' | 'reject' | null
  >(null);
  const [reviewActionLoading, setReviewActionLoading] = useState<string | null>(null);
  const [signatureActionLoading, setSignatureActionLoading] = useState<string | null>(
    null
  );
  const [openReviewForm, setOpenReviewForm] = useState({
    summary: '',
    reasonCodes: '',
    priority: 'HIGH',
    comment: '',
    dueAt: '',
  });
  const [assignReviewForm, setAssignReviewForm] = useState({
    assignedToUserId: '',
    comment: '',
  });
  const [startReviewComment, setStartReviewComment] = useState('');
  const [requestChangesForm, setRequestChangesForm] = useState({
    requestedChanges: '',
    comment: '',
  });
  const [decisionNotes, setDecisionNotes] = useState('');
  const [validationPolicyCode, setValidationPolicyCode] = useState(
    'PADES_SEQUENTIAL_DEFAULT'
  );
  const [clientSignedFile, setClientSignedFile] = useState<File | null>(null);
  const [providerSignedFile, setProviderSignedFile] = useState<File | null>(null);
  const lastLoadedContractIdRef = useRef<string | null>(null);
  const autoGenerateAttemptedRef = useRef(false);
  const currentOpsContractIdRef = useRef<string | null>(null);
  const clientFileInputRef = useRef<HTMLInputElement | null>(null);
  const providerFileInputRef = useRef<HTMLInputElement | null>(null);

  const canGenerate = useMemo(
    () => canGenerateContractsForProject(user ?? null, normalizedProjectClientId),
    [normalizedProjectClientId, user]
  );

  const privilegedContractActor = useMemo(
    () => isPrivilegedContractActor(user ?? null),
    [user]
  );
  const canReadAdminContract = privilegedContractActor && permissionSet.has('contracts.read');
  const canOpenManualReview =
    privilegedContractActor && permissionSet.has('contracts.reviews.open');
  const canReadManualReview =
    privilegedContractActor && permissionSet.has('contracts.reviews.read');
  const canAssignManualReview =
    privilegedContractActor && permissionSet.has('contracts.reviews.assign');
  const canStartManualReview =
    privilegedContractActor && permissionSet.has('contracts.reviews.start');
  const canRequestManualReviewChanges =
    privilegedContractActor && permissionSet.has('contracts.reviews.request_changes');
  const canApproveManualReview =
    privilegedContractActor && permissionSet.has('contracts.reviews.approve');
  const canRejectManualReview =
    privilegedContractActor && permissionSet.has('contracts.reviews.reject');
  const canIssueSignatureFlow =
    privilegedContractActor && permissionSet.has('contracts.signatures.submit');
  const canReadSignatureDetail =
    privilegedContractActor && permissionSet.has('contracts.signatures.read');
  const canManageSignatureUploads = privilegedContractActor;

  const effectiveSummary = useMemo<ContractGenerationSummary | null>(() => {
    if (summary) {
      return summary;
    }

    if (!contract) {
      return null;
    }

    return {
      contract_id: contract.id,
      project_id: contract.project_id,
      reference: contract.reference,
      status: contract.status,
      requires_manual_review: contract.requires_manual_review,
      requires_qes: contract.requires_qes,
    };
  }, [contract, summary]);

  const translateIfPresent = useCallback(
    (key: string, fallback: string) => {
      const translator = t as typeof t & { has?: (messageKey: string) => boolean };
      return translator.has?.(key) ? translator(key as never) : fallback;
    },
    [t]
  );

  const currentFinalPdf = useMemo(
    () => getCurrentContractDocument(contract, 'FINAL_PDF'),
    [contract]
  );
  const currentClientSignedPdf = useMemo(
    () => getCurrentContractDocument(contract, 'CLIENT_SIGNED_PDF'),
    [contract]
  );
  const currentSignedPdf = useMemo(
    () => getCurrentContractDocument(contract, 'SIGNED_PDF'),
    [contract]
  );
  const latestRiskAssessment = useMemo(
    () => getLatestContractRiskAssessment(contract),
    [contract]
  );
  const activeReview = useMemo(
    () => manualReview ?? operationsSnapshot?.manual_reviews[0] ?? null,
    [manualReview, operationsSnapshot]
  );
  const activeSignature = useMemo(
    () => signature ?? operationsSnapshot?.signatures[0] ?? null,
    [operationsSnapshot, signature]
  );
  const latestSignatureValidation = useMemo(
    () => getLatestContractSignatureValidation(activeSignature),
    [activeSignature]
  );
  const sortedReviewComments = useMemo(() => {
    if (!activeReview) {
      return [] as ContractManualReviewEntity['comments'];
    }

    return [...activeReview.comments].sort((left, right) => {
      const leftTimestamp = Date.parse(left.created_at ?? '') || Number(left.id || 0);
      const rightTimestamp =
        Date.parse(right.created_at ?? '') || Number(right.id || 0);

      return rightTimestamp - leftTimestamp;
    });
  }, [activeReview]);

  const currentDocuments = useMemo(() => {
    if (!contract) {
      return [] as ContractDocument[];
    }

    return [...contract.documents].sort((left, right) => {
      const currentScore = Number(right.is_current) - Number(left.is_current);
      if (currentScore !== 0) {
        return currentScore;
      }

      return Number(right.id || 0) - Number(left.id || 0);
    });
  }, [contract]);

  const resetOperationalState = useCallback(() => {
    setOperationsSnapshot(null);
    setManualReview(null);
    setSignature(null);
    setReviewError(null);
    setSignatureError(null);
    setReviewActionMode(null);
    setReviewActionLoading(null);
    setSignatureActionLoading(null);
    setOpenReviewForm({
      summary: '',
      reasonCodes: '',
      priority: 'HIGH',
      comment: '',
      dueAt: '',
    });
    setAssignReviewForm({
      assignedToUserId: '',
      comment: '',
    });
    setStartReviewComment('');
    setRequestChangesForm({
      requestedChanges: '',
      comment: '',
    });
    setDecisionNotes('');
    setClientSignedFile(null);
    setProviderSignedFile(null);

    if (clientFileInputRef.current) {
      clientFileInputRef.current.value = '';
    }

    if (providerFileInputRef.current) {
      providerFileInputRef.current.value = '';
    }
  }, []);

  const downloadResponseBlob = useCallback(
    async (response: Response, fallbackFileName: string) => {
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const fileName =
        extractFileNameFromContentDisposition(
          response.headers.get('content-disposition')
        ) ?? fallbackFileName;

      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(objectUrl);
    },
    []
  );

  const loadOperationalData = useCallback(
    async (nextContractId: string) => {
      if (!nextContractId || !user || !canReadAdminContract) {
        return;
      }

      setOperationsLoading(true);

      try {
        const snapshot = await contractsApi.getAdminContract(nextContractId);
        setOperationsSnapshot(snapshot);

        const latestReview = snapshot.manual_reviews[0] ?? null;
        const latestSignature = snapshot.signatures[0] ?? null;

        setManualReview(latestReview);
        setSignature(latestSignature);
        setReviewError(null);
        setSignatureError(null);

        if (latestReview?.id && canReadManualReview) {
          try {
            const detailedReview = await contractsApi.getManualReview(latestReview.id);
            setManualReview(detailedReview);
          } catch (error) {
            setReviewError(resolveErrorMessage(error, t('review.errors.load')));
          }
        }

        if (latestSignature?.id && canReadSignatureDetail) {
          try {
            const detailedSignature = await contractsApi.getContractSignature(
              latestSignature.id
            );
            setSignature(detailedSignature);
          } catch (error) {
            setSignatureError(resolveErrorMessage(error, t('signature.errors.load')));
          }
        }
      } catch (error) {
        if (error instanceof FetchError && [403, 404].includes(error.status)) {
          setOperationsSnapshot(null);
          setManualReview(null);
          setSignature(null);
          setReviewError(null);
          setSignatureError(null);
          return;
        }

        setReviewError(resolveErrorMessage(error, t('review.errors.load')));
        setSignatureError(resolveErrorMessage(error, t('signature.errors.load')));
      } finally {
        setOperationsLoading(false);
      }
    },
    [canReadAdminContract, canReadManualReview, canReadSignatureDetail, t, user]
  );

  const loadContractById = useCallback(
    async (nextContractId: string, options?: { force?: boolean }) => {
      if (!nextContractId || !user) {
        return null;
      }

      if (!options?.force && lastLoadedContractIdRef.current === nextContractId) {
        return contract;
      }

      lastLoadedContractIdRef.current = nextContractId;
      setLoadingContract(true);
      setWorkspaceError(null);

      try {
        const nextContract = await contractsApi.getContract(nextContractId);
        setContract(nextContract);
        setSummary({
          contract_id: nextContract.id,
          project_id: nextContract.project_id,
          reference: nextContract.reference,
          status: nextContract.status,
          requires_manual_review: nextContract.requires_manual_review,
          requires_qes: nextContract.requires_qes,
        });
        setContractId(nextContract.id);
        writeCachedContractId(normalizedProjectId, nextContract.id);
        return nextContract;
      } catch (error) {
        const message = resolveErrorMessage(error, t('errors.load'));
        if (message.includes('403') || message.includes('404')) {
          clearCachedContractId(normalizedProjectId);
          setContractId(null);
          setContract(null);
          setSummary(null);
          lastLoadedContractIdRef.current = null;
        }
        setWorkspaceError(message);
        return null;
      } finally {
        setLoadingContract(false);
      }
    },
    [contract, normalizedProjectId, t, user]
  );

  const refreshWorkspaceData = useCallback(
    async (nextContractId?: string | null) => {
      const targetContractId = nextContractId ?? effectiveSummary?.contract_id ?? null;
      if (!targetContractId) {
        return;
      }

      lastLoadedContractIdRef.current = null;
      await loadContractById(targetContractId, { force: true });

      if (canReadAdminContract) {
        await loadOperationalData(targetContractId);
      }
    },
    [canReadAdminContract, effectiveSummary?.contract_id, loadContractById, loadOperationalData]
  );

  useEffect(() => {
    if (normalizedInitialContractId) {
      autoGenerateAttemptedRef.current = true;
      setWorkspaceError(null);
      setContractId((current) =>
        current === normalizedInitialContractId ? current : normalizedInitialContractId
      );

      if (lastLoadedContractIdRef.current !== normalizedInitialContractId) {
        lastLoadedContractIdRef.current = null;
      }

      return;
    }

    const cachedContractId = readCachedContractId(normalizedProjectId);
    if (cachedContractId) {
      setContractId((current) => current ?? cachedContractId);
    }
  }, [normalizedInitialContractId, normalizedProjectId]);

  useEffect(() => {
    const nextContractId = effectiveSummary?.contract_id ?? null;
    if (currentOpsContractIdRef.current === nextContractId) {
      return;
    }

    currentOpsContractIdRef.current = nextContractId;
    resetOperationalState();
  }, [effectiveSummary?.contract_id, resetOperationalState]);

  useEffect(() => {
    if (loading || userLoading) {
      return;
    }

    if (!user || !contractId) {
      return;
    }

    void loadContractById(contractId);
  }, [contractId, loadContractById, loading, user, userLoading]);

  useEffect(() => {
    if (loading || userLoading || !user) {
      return;
    }

    if (!effectiveSummary?.contract_id || !canReadAdminContract) {
      return;
    }

    void loadOperationalData(effectiveSummary.contract_id);
  }, [
    canReadAdminContract,
    effectiveSummary?.contract_id,
    loadOperationalData,
    loading,
    user,
    userLoading,
  ]);

  useEffect(() => {
    if (!autoGenerate || autoGenerateAttemptedRef.current) {
      return;
    }

    if (normalizedInitialContractId) {
      return;
    }

    if (loading || userLoading || !user || !canGenerate) {
      return;
    }

    if (contract || contractId || generating) {
      return;
    }

    autoGenerateAttemptedRef.current = true;

    void (async () => {
      setGenerating(true);
      setWorkspaceError(null);

      try {
        const nextSummary = await contractsApi.generateProjectContract(normalizedProjectId);
        setSummary(nextSummary);
        setContractId(nextSummary.contract_id);
        writeCachedContractId(normalizedProjectId, nextSummary.contract_id);
        await refreshWorkspaceData(nextSummary.contract_id);
      } catch (error) {
        setWorkspaceError(resolveErrorMessage(error, t('errors.generate')));
      } finally {
        setGenerating(false);
      }
    })();
  }, [
    autoGenerate,
    canGenerate,
    contract,
    contractId,
    generating,
    loading,
    normalizedInitialContractId,
    normalizedProjectId,
    refreshWorkspaceData,
    t,
    user,
    userLoading,
  ]);

  const handleGenerate = async () => {
    if (!canGenerate) {
      return;
    }

    setGenerating(true);
    setWorkspaceError(null);

    try {
      const nextSummary = await contractsApi.generateProjectContract(normalizedProjectId);
      setSummary(nextSummary);
      setContractId(nextSummary.contract_id);
      writeCachedContractId(normalizedProjectId, nextSummary.contract_id);
      await refreshWorkspaceData(nextSummary.contract_id);
    } catch (error) {
      setWorkspaceError(resolveErrorMessage(error, t('errors.generate')));
    } finally {
      setGenerating(false);
    }
  };

  const handlePreviewHtml = async () => {
    if (!effectiveSummary?.contract_id) {
      return;
    }

    setPreviewLoading(true);
    setWorkspaceError(null);

    try {
      const html = await contractsApi.getContractHtml(effectiveSummary.contract_id);
      setPreviewHtml(html);
      setPreviewOpen(true);
    } catch (error) {
      setWorkspaceError(resolveErrorMessage(error, t('errors.preview')));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!effectiveSummary?.contract_id) {
      return;
    }

    setDownloading(true);
    setWorkspaceError(null);

    try {
      const response = await contractsApi.getContractPdfResponse(
        effectiveSummary.contract_id
      );
      await downloadResponseBlob(
        response,
        currentFinalPdf?.file_name ??
          `${effectiveSummary.reference || 'contract'}-final.pdf`
      );
    } catch (error) {
      setWorkspaceError(resolveErrorMessage(error, t('errors.download')));
    } finally {
      setDownloading(false);
    }
  };

  const handleRefresh = async () => {
    await refreshWorkspaceData();
  };

  const handleOpenManualReview = async () => {
    if (!effectiveSummary?.contract_id || !canOpenManualReview) {
      return;
    }

    setReviewActionLoading('open');
    setReviewError(null);

    try {
      const reasonCodes = openReviewForm.reasonCodes
        .split(/[\n,]+/)
        .map((entry) => entry.trim())
        .filter(Boolean);

      const nextReview = await contractsApi.openManualReview(
        effectiveSummary.contract_id,
        {
          reason_codes: reasonCodes,
          summary: openReviewForm.summary.trim() || null,
          priority: openReviewForm.priority.trim() || null,
          comment: openReviewForm.comment.trim() || null,
          due_at: openReviewForm.dueAt.trim() || null,
        }
      );

      setManualReview(nextReview);
      setReviewActionMode(null);
      setOpenReviewForm({
        summary: '',
        reasonCodes: '',
        priority: 'HIGH',
        comment: '',
        dueAt: '',
      });
      await refreshWorkspaceData(effectiveSummary.contract_id);
    } catch (error) {
      setReviewError(resolveErrorMessage(error, t('review.errors.open')));
    } finally {
      setReviewActionLoading(null);
    }
  };

  const handleSubmitReviewAction = async () => {
    if (!activeReview?.id || !reviewActionMode) {
      return;
    }

    if (reviewActionMode === 'assign' && !assignReviewForm.assignedToUserId.trim()) {
      setReviewError(t('review.errors.assigned_user_required'));
      return;
    }

    if (
      reviewActionMode === 'request_changes' &&
      normalizeTextLines(requestChangesForm.requestedChanges).length === 0
    ) {
      setReviewError(t('review.errors.requested_changes_required'));
      return;
    }

    setReviewActionLoading(reviewActionMode);
    setReviewError(null);

    try {
      let nextReview: ContractManualReviewEntity | null = null;

      switch (reviewActionMode) {
        case 'assign':
          nextReview = await contractsApi.assignManualReview(activeReview.id, {
            assigned_to_user_id: assignReviewForm.assignedToUserId.trim(),
            comment: assignReviewForm.comment.trim() || null,
          });
          setAssignReviewForm({
            assignedToUserId: '',
            comment: '',
          });
          break;
        case 'start':
          nextReview = await contractsApi.startManualReview(activeReview.id, {
            comment: startReviewComment.trim() || null,
          });
          setStartReviewComment('');
          break;
        case 'request_changes':
          nextReview = await contractsApi.requestManualReviewChanges(activeReview.id, {
            requested_changes: normalizeTextLines(requestChangesForm.requestedChanges),
            comment: requestChangesForm.comment.trim() || null,
          });
          setRequestChangesForm({
            requestedChanges: '',
            comment: '',
          });
          break;
        case 'approve':
          nextReview = await contractsApi.approveManualReview(activeReview.id, {
            notes: decisionNotes.trim() || null,
          });
          setDecisionNotes('');
          break;
        case 'reject':
          nextReview = await contractsApi.rejectManualReview(activeReview.id, {
            notes: decisionNotes.trim() || null,
          });
          setDecisionNotes('');
          break;
        default:
          break;
      }

      if (nextReview) {
        setManualReview(nextReview);
      }

      setReviewActionMode(null);
      await refreshWorkspaceData(effectiveSummary?.contract_id);
    } catch (error) {
      const errorKey =
        reviewActionMode === 'request_changes'
          ? 'request_changes'
          : reviewActionMode;
      setReviewError(
        resolveErrorMessage(error, t(`review.errors.${errorKey}` as never))
      );
    } finally {
      setReviewActionLoading(null);
    }
  };

  const handleIssueSignatureFlow = async () => {
    if (!effectiveSummary?.contract_id || !canIssueSignatureFlow) {
      return;
    }

    setSignatureActionLoading('issue');
    setSignatureError(null);

    try {
      const nextSignature = await contractsApi.issueManualSignatureFlow(
        effectiveSummary.contract_id,
        {
          validation_policy_code: validationPolicyCode.trim() || null,
        }
      );

      setSignature(nextSignature);
      await refreshWorkspaceData(effectiveSummary.contract_id);
    } catch (error) {
      setSignatureError(resolveErrorMessage(error, t('signature.errors.issue')));
    } finally {
      setSignatureActionLoading(null);
    }
  };

  const handleDownloadSignedPdf = async () => {
    if (!activeSignature?.id) {
      return;
    }

    setSignatureActionLoading('signed-download');
    setSignatureError(null);

    try {
      const response = await contractsApi.getSignedPdfResponse(activeSignature.id);
      await downloadResponseBlob(
        response,
        activeSignature.fully_signed_document?.file_name ??
          activeSignature.signed_document?.file_name ??
          currentSignedPdf?.file_name ??
          `${effectiveSummary?.reference || 'contract'}-signed.pdf`
      );
    } catch (error) {
      setSignatureError(
        resolveErrorMessage(error, t('signature.errors.signed_download'))
      );
    } finally {
      setSignatureActionLoading(null);
    }
  };

  const handleDownloadManualSignatureStep = async (
    signerRole: 'client' | 'provider'
  ) => {
    if (!effectiveSummary?.contract_id || !canManageSignatureUploads) {
      return;
    }

    const loadingKey =
      signerRole === 'client' ? 'client-download' : 'provider-download';

    setSignatureActionLoading(loadingKey);
    setSignatureError(null);

    try {
      const response =
        signerRole === 'client'
          ? await contractsApi.getManualClientDownloadResponse(
              effectiveSummary.contract_id
            )
          : await contractsApi.getManualProviderDownloadResponse(
              effectiveSummary.contract_id
            );

      await downloadResponseBlob(
        response,
        signerRole === 'client'
          ? currentFinalPdf?.file_name ??
              `${effectiveSummary.reference || 'contract'}-for-client-signature.pdf`
          : currentClientSignedPdf?.file_name ??
              `${effectiveSummary.reference || 'contract'}-for-provider-signature.pdf`
      );
    } catch (error) {
      setSignatureError(
        resolveErrorMessage(
          error,
          t(
            signerRole === 'client'
              ? 'signature.errors.client_download'
              : 'signature.errors.provider_download'
          )
        )
      );
    } finally {
      setSignatureActionLoading(null);
    }
  };

  const handleUploadManualSignatureStep = async (
    signerRole: 'client' | 'provider'
  ) => {
    if (!effectiveSummary?.contract_id || !canManageSignatureUploads) {
      return;
    }

    const selectedFile =
      signerRole === 'client' ? clientSignedFile : providerSignedFile;

    if (!selectedFile) {
      setSignatureError(t('signature.errors.file_required'));
      return;
    }

    const loadingKey =
      signerRole === 'client' ? 'client-upload' : 'provider-upload';

    setSignatureActionLoading(loadingKey);
    setSignatureError(null);

    try {
      const nextSignature =
        signerRole === 'client'
          ? await contractsApi.uploadManualClientSignedPdf(
              effectiveSummary.contract_id,
              selectedFile
            )
          : await contractsApi.uploadManualProviderSignedPdf(
              effectiveSummary.contract_id,
              selectedFile
            );

      setSignature(nextSignature);

      if (signerRole === 'client') {
        setClientSignedFile(null);
        if (clientFileInputRef.current) {
          clientFileInputRef.current.value = '';
        }
      } else {
        setProviderSignedFile(null);
        if (providerFileInputRef.current) {
          providerFileInputRef.current.value = '';
        }
      }

      await refreshWorkspaceData(effectiveSummary.contract_id);
    } catch (error) {
      setSignatureError(
        resolveErrorMessage(
          error,
          t(
            signerRole === 'client'
              ? 'signature.errors.client_upload'
              : 'signature.errors.provider_upload'
          )
        )
      );
    } finally {
      setSignatureActionLoading(null);
    }
  };

  const handleClientFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setClientSignedFile(event.target.files?.[0] ?? null);
  };

  const handleProviderFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setProviderSignedFile(event.target.files?.[0] ?? null);
  };

  const canUploadClientSignedDocument =
    canManageSignatureUploads &&
    ['AWAITING_CLIENT_UPLOAD', 'CLIENT_SIGNATURE_REJECTED'].includes(
      String(activeSignature?.flow_status ?? '')
    );
  const canUploadProviderSignedDocument =
    canManageSignatureUploads &&
    ['AWAITING_PROVIDER_UPLOAD', 'PROVIDER_SIGNATURE_REJECTED'].includes(
      String(activeSignature?.flow_status ?? '')
    );
  const canIssueFreshSignatureFlow =
    canIssueSignatureFlow &&
    !activeSignature &&
    ['ready_for_signature', 'sent_for_signature'].includes(
      String(effectiveSummary?.status ?? '')
    );
  const reviewIsClosedLike = ['APPROVED', 'REJECTED', 'CLOSED'].includes(
    String(activeReview?.status ?? '')
  );
  const reviewNeedsAttention =
    Boolean(activeReview) ||
    effectiveSummary?.requires_manual_review === true ||
    effectiveSummary?.status === 'pending_review';

  const content = (
    <div className={cn('space-y-5', className)}>
      {loading || userLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      ) : null}

      {!loading && !userLoading && !user ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('unauthenticated.title')}</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{t('unauthenticated.description')}</span>
            <Button asChild size="sm">
              <Link href="/auth/signin">{t('unauthenticated.cta')}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {!loading && !userLoading && user && !effectiveSummary && !canGenerate ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('restricted.title')}</AlertTitle>
          <AlertDescription>{t('restricted.description')}</AlertDescription>
        </Alert>
      ) : null}

      {workspaceError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('errors.title')}</AlertTitle>
          <AlertDescription>{workspaceError}</AlertDescription>
        </Alert>
      ) : null}

      {!loading &&
      !userLoading &&
      user &&
      !effectiveSummary &&
      !loadingContract &&
      !generating ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 dark:border-[#1E2A3D] dark:bg-[#0F172A]/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#0B1C2D] dark:text-[#E6EDF3]">
                <Scale className="h-5 w-5 text-[#1BC47D]" />
                <h3 className="text-lg font-semibold">{t('empty.title')}</h3>
              </div>
              <p className="max-w-2xl text-sm text-slate-600 dark:text-[#A3ADC2]">
                {t('empty.description')}
              </p>
            </div>

            {canGenerate ? (
              <Button
                type="button"
                onClick={() => {
                  void handleGenerate();
                }}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('actions.generate')}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {effectiveSummary ? (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn('capitalize', getStatusTone(effectiveSummary.status))}>
                  {translateIfPresent(
                    `statuses.${effectiveSummary.status}`,
                    humanizeCode(effectiveSummary.status)
                  )}
                </Badge>
                {effectiveSummary.requires_manual_review ? (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    {t('flags.manual_review')}
                  </Badge>
                ) : null}
                {effectiveSummary.requires_qes ? (
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                    {t('flags.qes')}
                  </Badge>
                ) : null}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {effectiveSummary.reference || t('overview.reference_fallback')}
                </h3>
                <p className="text-sm text-slate-600 dark:text-[#A3ADC2]">
                  {t('overview.reference_description', {
                    project: projectTitle || t('project_fallback'),
                  })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void handleRefresh();
                }}
                disabled={loadingContract}
              >
                {loadingContract ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {t('actions.refresh')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void handlePreviewHtml();
                }}
                disabled={previewLoading}
              >
                {previewLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileCode2 className="mr-2 h-4 w-4" />
                )}
                {t('actions.preview_html')}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  void handleDownloadPdf();
                }}
                disabled={downloading}
                className="bg-[#0B1C2D] text-white hover:bg-[#10263F] dark:bg-[#E6EDF3] dark:text-[#0B1220] dark:hover:bg-white"
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {t('actions.download_pdf')}
              </Button>
              {canGenerate ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void handleGenerate();
                  }}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  {t('actions.generate_new_version')}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                {t('summary.generated')}
              </div>
              <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                {formatDateTime(contract?.generated_at ?? null, locale) ?? t('summary.unavailable')}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                {t('summary.documents')}
              </div>
              <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                {currentDocuments.length}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                {t('summary.milestones')}
              </div>
              <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                {contract?.milestones.length ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                {t('summary.risk')}
              </div>
              <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                {latestRiskAssessment?.overall_risk
                  ? translateIfPresent(
                      `risk_levels.${String(latestRiskAssessment.overall_risk).toLowerCase()}`,
                      humanizeCode(latestRiskAssessment.overall_risk)
                    )
                  : t('summary.unavailable')}
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
              <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
              <TabsTrigger value="documents">{t('tabs.documents')}</TabsTrigger>
              <TabsTrigger value="risk">{t('tabs.risk')}</TabsTrigger>
              <TabsTrigger value="review">{t('tabs.review')}</TabsTrigger>
              <TabsTrigger value="signature">{t('tabs.signature')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
                <Card className="border-slate-200 dark:border-[#1E2A3D]">
                  <CardHeader>
                    <CardTitle>{t('overview.title')}</CardTitle>
                    <CardDescription>{t('overview.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                        {t('overview.reference')}
                      </div>
                      <div className="text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {effectiveSummary.reference}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                        {t('overview.signature_level')}
                      </div>
                      <div className="text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {contract?.signature_level
                          ? humanizeCode(contract.signature_level)
                          : t('summary.unavailable')}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                        {t('overview.governing_law')}
                      </div>
                      <div className="text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {contract?.governing_law_code ?? t('summary.unavailable')}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                        {t('overview.jurisdiction')}
                      </div>
                      <div className="text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {contract?.jurisdiction_label ??
                          contract?.jurisdiction_code ??
                          t('summary.unavailable')}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                        {t('overview.currency')}
                      </div>
                      <div className="text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {contract?.currency ?? t('summary.unavailable')}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                        {t('overview.template')}
                      </div>
                      <div className="text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {contract?.template_code ?? t('summary.unavailable')}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-[#1E2A3D]">
                  <CardHeader>
                    <CardTitle>{t('overview.parties_title')}</CardTitle>
                    <CardDescription>{t('overview.parties_description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(contract?.parties ?? []).length > 0 ? (
                      contract?.parties.map((party) => (
                        <div
                          key={`${party.party_role}-${party.id || party.user_id || party.company_id || party.legal_name}`}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                              {party.legal_name ?? t('overview.unavailable_party')}
                            </div>
                            <Badge variant="outline">{humanizeCode(party.party_role)}</Badge>
                          </div>
                          <div className="mt-2 text-xs text-slate-500 dark:text-[#A3ADC2]">
                            {[party.country_code, party.signatory_name, party.signatory_title]
                              .filter(Boolean)
                              .join(' • ') || t('summary.unavailable')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                        {t('overview.no_parties')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <Card className="border-slate-200 dark:border-[#1E2A3D]">
                <CardHeader>
                  <CardTitle>{t('documents.title')}</CardTitle>
                  <CardDescription>{t('documents.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentDocuments.length > 0 ? (
                    currentDocuments.map((document) => (
                      <div
                        key={`${document.id}-${document.document_role}`}
                        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/70 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{humanizeCode(document.document_role)}</Badge>
                            {document.is_current ? (
                              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                {t('documents.current')}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {document.file_name ?? t('documents.unnamed')}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-[#A3ADC2]">
                            {[document.mime_type, formatFileSize(document.file_size_bytes, locale)]
                              .filter(Boolean)
                              .join(' • ') || t('summary.unavailable')}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {document.document_role === 'DRAFT_HTML' && document.is_current ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                void handlePreviewHtml();
                              }}
                              disabled={previewLoading}
                            >
                              <FileSearch className="mr-2 h-4 w-4" />
                              {t('actions.preview_html')}
                            </Button>
                          ) : null}
                          {document.document_role === 'FINAL_PDF' && document.is_current ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                void handleDownloadPdf();
                              }}
                              disabled={downloading}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              {t('actions.download_pdf')}
                            </Button>
                          ) : null}
                          {document.document_role === 'SIGNED_PDF' &&
                          document.is_current &&
                          activeSignature?.id ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                void handleDownloadSignedPdf();
                              }}
                              disabled={signatureActionLoading === 'signed-download'}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              {t('signature.actions.download_signed_pdf')}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                      {t('documents.empty')}
                    </p>
                  )}

                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-600 dark:border-[#1E2A3D] dark:bg-[#0B1220]/70 dark:text-[#A3ADC2]">
                    {t('documents.backfill_note')}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk" className="mt-4">
              <Card className="border-slate-200 dark:border-[#1E2A3D]">
                <CardHeader>
                  <CardTitle>{t('risk.title')}</CardTitle>
                  <CardDescription>{t('risk.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {latestRiskAssessment ? (
                    <>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        {[
                          ['overall', latestRiskAssessment.overall_risk],
                          ['misclassification', latestRiskAssessment.misclassification_risk],
                          ['gdpr', latestRiskAssessment.gdpr_risk],
                          ['ip', latestRiskAssessment.ip_risk],
                          ['tax', latestRiskAssessment.tax_risk],
                        ].map(([key, value]) => (
                          <div
                            key={key}
                            className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80"
                          >
                            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                              {t(`risk.labels.${key}` as never)}
                            </div>
                            <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                              {value
                                ? translateIfPresent(
                                    `risk_levels.${String(value).toLowerCase()}`,
                                    humanizeCode(value)
                                  )
                                : t('summary.unavailable')}
                            </div>
                          </div>
                        ))}
                      </div>

                      {latestRiskAssessment.warnings.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('risk.warnings')}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {latestRiskAssessment.warnings.map((warning) => (
                              <Badge key={warning} variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                {humanizeCode(warning)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {latestRiskAssessment.blocking_reasons.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('risk.blocking_reasons')}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {latestRiskAssessment.blocking_reasons.map((reason) => (
                              <Badge key={reason} variant="outline" className="border-red-200 bg-red-50 text-red-700">
                                {humanizeCode(reason)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                      {t('risk.empty')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="review" className="mt-4">
              <Card className="border-slate-200 dark:border-[#1E2A3D]">
                <CardHeader>
                  <CardTitle>{t('review.title')}</CardTitle>
                  <CardDescription>{t('review.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {operationsLoading && canReadAdminContract ? (
                    <div className="space-y-3">
                      <Skeleton className="h-24 w-full rounded-xl" />
                      <Skeleton className="h-40 w-full rounded-xl" />
                    </div>
                  ) : null}

                  {reviewError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{t('review.errors.title')}</AlertTitle>
                      <AlertDescription>{reviewError}</AlertDescription>
                    </Alert>
                  ) : null}

                  {activeReview ? (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getProcessTone(activeReview.status)}
                            >
                              {translateIfPresent(
                                `review.statuses.${String(activeReview.status).toLowerCase()}`,
                                humanizeCode(activeReview.status)
                              )}
                            </Badge>
                            {activeReview.priority ? (
                              <Badge variant="outline">
                                {t('review.labels.priority')}:{' '}
                                {humanizeCode(activeReview.priority)}
                              </Badge>
                            ) : null}
                          </div>

                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                              {activeReview.review_summary ?? t('review.empty_summary')}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-[#A3ADC2]">
                              {[activeReview.opened_at, activeReview.due_at]
                                .map((value) => formatDateTime(value, locale))
                                .filter(Boolean)
                                .join(' • ') || t('summary.unavailable')}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
                            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                              {t('review.labels.assigned_to')}
                            </div>
                            <div className="mt-2 text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                              {activeReview.assigned_to_user?.name ??
                                activeReview.assigned_to_user?.email ??
                                t('summary.unavailable')}
                            </div>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
                            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                              {t('review.labels.contract_status')}
                            </div>
                            <div className="mt-2 text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                              {activeReview.contract?.status
                                ? translateIfPresent(
                                    `statuses.${String(activeReview.contract.status).toLowerCase()}`,
                                    humanizeCode(activeReview.contract.status)
                                  )
                                : t('summary.unavailable')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {activeReview.review_reason_codes.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('review.labels.reason_codes')}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {activeReview.review_reason_codes.map((reasonCode) => (
                              <Badge key={reasonCode} variant="outline">
                                {humanizeCode(reasonCode)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {activeReview.requested_changes.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('review.labels.requested_changes')}
                          </div>
                          <div className="space-y-2">
                            {activeReview.requested_changes.map((entry, index) => (
                              <div
                                key={`${activeReview.id}-change-${index}`}
                                className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-900"
                              >
                                {entry}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {activeReview.final_decision_notes ? (
                        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
                          <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('review.labels.final_notes')}
                          </div>
                          <p className="mt-2 text-sm text-slate-600 dark:text-[#A3ADC2]">
                            {activeReview.final_decision_notes}
                          </p>
                        </div>
                      ) : null}

                      <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
                        <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {t('review.labels.comments')}
                        </div>
                        <div className="mt-3 space-y-3">
                          {sortedReviewComments.length > 0 ? (
                            sortedReviewComments.map((comment) => (
                              <div
                                key={comment.id}
                                className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80"
                              >
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-[#A3ADC2]">
                                  <Badge variant="outline">
                                    {comment.comment_type
                                      ? humanizeCode(comment.comment_type)
                                      : t('summary.unavailable')}
                                  </Badge>
                                  <span>
                                    {comment.author_user?.name ??
                                      comment.author_user?.email ??
                                      t('summary.unavailable')}
                                  </span>
                                  <span>
                                    {formatDateTime(comment.created_at, locale) ??
                                      t('summary.unavailable')}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm text-slate-700 dark:text-[#E6EDF3]">
                                  {comment.body ?? t('summary.unavailable')}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                              {t('review.empty_comments')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : reviewNeedsAttention ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{t('review.pending_title')}</AlertTitle>
                      <AlertDescription>{t('review.pending_description')}</AlertDescription>
                    </Alert>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                      {t('review.empty')}
                    </p>
                  )}

                  {!activeReview && canOpenManualReview ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                      <div className="mb-4">
                        <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {t('review.actions.open')}
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-[#A3ADC2]">
                          {t('review.open_description')}
                        </p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          value={openReviewForm.summary}
                          onChange={(event) =>
                            setOpenReviewForm((current) => ({
                              ...current,
                              summary: event.target.value,
                            }))
                          }
                          placeholder={t('review.form.summary')}
                        />
                        <Input
                          value={openReviewForm.priority}
                          onChange={(event) =>
                            setOpenReviewForm((current) => ({
                              ...current,
                              priority: event.target.value,
                            }))
                          }
                          placeholder={t('review.form.priority')}
                        />
                        <Input
                          value={openReviewForm.reasonCodes}
                          onChange={(event) =>
                            setOpenReviewForm((current) => ({
                              ...current,
                              reasonCodes: event.target.value,
                            }))
                          }
                          placeholder={t('review.form.reason_codes')}
                          className="md:col-span-2"
                        />
                        <Input
                          type="datetime-local"
                          value={openReviewForm.dueAt}
                          onChange={(event) =>
                            setOpenReviewForm((current) => ({
                              ...current,
                              dueAt: event.target.value,
                            }))
                          }
                        />
                        <Textarea
                          value={openReviewForm.comment}
                          onChange={(event) =>
                            setOpenReviewForm((current) => ({
                              ...current,
                              comment: event.target.value,
                            }))
                          }
                          placeholder={t('review.form.comment')}
                          className="min-h-[110px] md:col-span-2"
                        />
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          onClick={() => {
                            void handleOpenManualReview();
                          }}
                          disabled={reviewActionLoading === 'open'}
                        >
                          {reviewActionLoading === 'open' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {t('review.actions.open')}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {activeReview &&
                  !reviewIsClosedLike &&
                  (canAssignManualReview ||
                    canStartManualReview ||
                    canRequestManualReviewChanges ||
                    canApproveManualReview ||
                    canRejectManualReview) ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                      <div className="flex flex-wrap gap-2">
                        {canAssignManualReview ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setReviewActionMode('assign')}
                          >
                            {t('review.actions.assign')}
                          </Button>
                        ) : null}
                        {canStartManualReview ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setReviewActionMode('start')}
                          >
                            {t('review.actions.start')}
                          </Button>
                        ) : null}
                        {canRequestManualReviewChanges ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setReviewActionMode('request_changes')}
                          >
                            {t('review.actions.request_changes')}
                          </Button>
                        ) : null}
                        {canApproveManualReview ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setReviewActionMode('approve')}
                          >
                            {t('review.actions.approve')}
                          </Button>
                        ) : null}
                        {canRejectManualReview ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setReviewActionMode('reject')}
                          >
                            {t('review.actions.reject')}
                          </Button>
                        ) : null}
                      </div>

                      {reviewActionMode ? (
                        <div className="mt-4 space-y-3">
                          {reviewActionMode === 'assign' ? (
                            <>
                              <Input
                                value={assignReviewForm.assignedToUserId}
                                onChange={(event) =>
                                  setAssignReviewForm((current) => ({
                                    ...current,
                                    assignedToUserId: event.target.value,
                                  }))
                                }
                                placeholder={t('review.form.assigned_to_user_id')}
                              />
                              <Textarea
                                value={assignReviewForm.comment}
                                onChange={(event) =>
                                  setAssignReviewForm((current) => ({
                                    ...current,
                                    comment: event.target.value,
                                  }))
                                }
                                placeholder={t('review.form.comment')}
                                className="min-h-[100px]"
                              />
                            </>
                          ) : null}

                          {reviewActionMode === 'start' ? (
                            <Textarea
                              value={startReviewComment}
                              onChange={(event) => setStartReviewComment(event.target.value)}
                              placeholder={t('review.form.comment')}
                              className="min-h-[100px]"
                            />
                          ) : null}

                          {reviewActionMode === 'request_changes' ? (
                            <>
                              <Textarea
                                value={requestChangesForm.requestedChanges}
                                onChange={(event) =>
                                  setRequestChangesForm((current) => ({
                                    ...current,
                                    requestedChanges: event.target.value,
                                  }))
                                }
                                placeholder={t('review.form.requested_changes')}
                                className="min-h-[120px]"
                              />
                              <Textarea
                                value={requestChangesForm.comment}
                                onChange={(event) =>
                                  setRequestChangesForm((current) => ({
                                    ...current,
                                    comment: event.target.value,
                                  }))
                                }
                                placeholder={t('review.form.comment')}
                                className="min-h-[100px]"
                              />
                            </>
                          ) : null}

                          {reviewActionMode === 'approve' ||
                          reviewActionMode === 'reject' ? (
                            <Textarea
                              value={decisionNotes}
                              onChange={(event) => setDecisionNotes(event.target.value)}
                              placeholder={t('review.form.notes')}
                              className="min-h-[110px]"
                            />
                          ) : null}

                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setReviewActionMode(null)}
                            >
                              {t('review.actions.cancel')}
                            </Button>
                            <Button
                              type="button"
                              onClick={() => {
                                void handleSubmitReviewAction();
                              }}
                              disabled={reviewActionLoading === reviewActionMode}
                            >
                              {reviewActionLoading === reviewActionMode ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              {t('review.actions.submit')}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signature" className="mt-4">
              <Card className="border-slate-200 dark:border-[#1E2A3D]">
                <CardHeader>
                  <CardTitle>{t('signature.title')}</CardTitle>
                  <CardDescription>{t('signature.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {operationsLoading && canReadAdminContract ? (
                    <div className="space-y-3">
                      <Skeleton className="h-24 w-full rounded-xl" />
                      <Skeleton className="h-48 w-full rounded-xl" />
                    </div>
                  ) : null}

                  {signatureError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{t('signature.errors.title')}</AlertTitle>
                      <AlertDescription>{signatureError}</AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                        {t('signature.labels.contract_status')}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {effectiveSummary?.status
                          ? translateIfPresent(
                              `statuses.${String(effectiveSummary.status).toLowerCase()}`,
                              humanizeCode(effectiveSummary.status)
                            )
                          : t('summary.unavailable')}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                        {t('signature.labels.flow_status')}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {activeSignature?.flow_status
                          ? translateIfPresent(
                              `signature.flow_statuses.${String(
                                activeSignature.flow_status
                              ).toLowerCase()}`,
                              humanizeCode(activeSignature.flow_status)
                            )
                          : t('signature.awaiting_issue')}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                        {t('signature.labels.signature_level')}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {contract?.signature_level
                          ? humanizeCode(contract.signature_level)
                          : t('summary.unavailable')}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                        {t('signature.labels.completed_at')}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {formatDateTime(activeSignature?.completed_at ?? null, locale) ??
                          t('summary.unavailable')}
                      </div>
                    </div>
                  </div>

                  {activeSignature ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getProcessTone(activeSignature.status)}
                        >
                          {activeSignature.status
                            ? translateIfPresent(
                                `signature.statuses.${String(
                                  activeSignature.status
                                ).toLowerCase()}`,
                                humanizeCode(activeSignature.status)
                              )
                            : t('summary.unavailable')}
                        </Badge>
                        {activeSignature.flow_status ? (
                          <Badge
                            variant="outline"
                            className={getProcessTone(activeSignature.flow_status)}
                          >
                            {translateIfPresent(
                              `signature.flow_statuses.${String(
                                activeSignature.flow_status
                              ).toLowerCase()}`,
                              humanizeCode(activeSignature.flow_status)
                            )}
                          </Badge>
                        ) : null}
                        {activeSignature.validation_policy_code ? (
                          <Badge variant="outline">
                            {activeSignature.validation_policy_code}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                          <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('signature.steps.client')}
                          </div>
                          <p className="mt-1 text-sm text-slate-500 dark:text-[#A3ADC2]">
                            {t('signature.steps.client_description')}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {canManageSignatureUploads ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  void handleDownloadManualSignatureStep('client');
                                }}
                                disabled={signatureActionLoading === 'client-download'}
                              >
                                {signatureActionLoading === 'client-download' ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="mr-2 h-4 w-4" />
                                )}
                                {t('signature.actions.download_client_packet')}
                              </Button>
                            ) : null}
                          </div>
                          {canUploadClientSignedDocument ? (
                            <div className="mt-4 space-y-3">
                              <Input
                                ref={clientFileInputRef}
                                type="file"
                                accept="application/pdf"
                                onChange={handleClientFileChange}
                              />
                              <div className="text-xs text-slate-500 dark:text-[#A3ADC2]">
                                {clientSignedFile?.name ?? t('signature.no_file_selected')}
                              </div>
                              <Button
                                type="button"
                                onClick={() => {
                                  void handleUploadManualSignatureStep('client');
                                }}
                                disabled={signatureActionLoading === 'client-upload'}
                              >
                                {signatureActionLoading === 'client-upload' ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                {t('signature.actions.upload_client_signed_pdf')}
                              </Button>
                            </div>
                          ) : null}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                          <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('signature.steps.provider')}
                          </div>
                          <p className="mt-1 text-sm text-slate-500 dark:text-[#A3ADC2]">
                            {t('signature.steps.provider_description')}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {canManageSignatureUploads ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  void handleDownloadManualSignatureStep('provider');
                                }}
                                disabled={signatureActionLoading === 'provider-download'}
                              >
                                {signatureActionLoading === 'provider-download' ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="mr-2 h-4 w-4" />
                                )}
                                {t('signature.actions.download_provider_packet')}
                              </Button>
                            ) : null}
                            {activeSignature.id ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  void handleDownloadSignedPdf();
                                }}
                                disabled={signatureActionLoading === 'signed-download'}
                              >
                                {signatureActionLoading === 'signed-download' ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <FileText className="mr-2 h-4 w-4" />
                                )}
                                {t('signature.actions.download_signed_pdf')}
                              </Button>
                            ) : null}
                          </div>
                          {canUploadProviderSignedDocument ? (
                            <div className="mt-4 space-y-3">
                              <Input
                                ref={providerFileInputRef}
                                type="file"
                                accept="application/pdf"
                                onChange={handleProviderFileChange}
                              />
                              <div className="text-xs text-slate-500 dark:text-[#A3ADC2]">
                                {providerSignedFile?.name ?? t('signature.no_file_selected')}
                              </div>
                              <Button
                                type="button"
                                onClick={() => {
                                  void handleUploadManualSignatureStep('provider');
                                }}
                                disabled={signatureActionLoading === 'provider-upload'}
                              >
                                {signatureActionLoading === 'provider-upload' ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                {t('signature.actions.upload_provider_signed_pdf')}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {latestSignatureValidation ? (
                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/80">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                              {t('signature.validation.title')}
                            </div>
                            {latestSignatureValidation.validation_status ? (
                              <Badge
                                variant="outline"
                                className={getProcessTone(
                                  latestSignatureValidation.validation_status
                                )}
                              >
                                {translateIfPresent(
                                  `signature.validation.statuses.${String(
                                    latestSignatureValidation.validation_status
                                  ).toLowerCase()}`,
                                  humanizeCode(
                                    latestSignatureValidation.validation_status
                                  )
                                )}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                                {t('signature.validation.labels.stage')}
                              </div>
                              <div className="mt-2 text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                                {latestSignatureValidation.stage
                                  ? humanizeCode(latestSignatureValidation.stage)
                                  : t('summary.unavailable')}
                              </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                                {t('signature.validation.labels.signature_count')}
                              </div>
                              <div className="mt-2 text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                                {latestSignatureValidation.signature_count_found ??
                                  t('summary.unavailable')}
                              </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                                {t('signature.validation.labels.detected_level')}
                              </div>
                              <div className="mt-2 text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                                {latestSignatureValidation.detected_signature_level
                                  ? humanizeCode(
                                      latestSignatureValidation.detected_signature_level
                                    )
                                  : t('summary.unavailable')}
                              </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-[#A3ADC2]">
                                {t('signature.validation.labels.best_signature_time')}
                              </div>
                              <div className="mt-2 text-sm font-medium text-[#0B1C2D] dark:text-[#E6EDF3]">
                                {formatDateTime(
                                  latestSignatureValidation.best_signature_time,
                                  locale
                                ) ?? t('summary.unavailable')}
                              </div>
                            </div>
                          </div>

                          {latestSignatureValidation.failure_reason ? (
                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-800">
                              {latestSignatureValidation.failure_reason}
                            </div>
                          ) : null}

                          {latestSignatureValidation.signers.length > 0 ? (
                            <div className="mt-4 space-y-2">
                              <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                {t('signature.validation.labels.signers')}
                              </div>
                              <div className="grid gap-3 md:grid-cols-2">
                                {latestSignatureValidation.signers.map((signer) => (
                                  <div
                                    key={signer.id}
                                    className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80"
                                  >
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant="outline">
                                        {signer.expected_role
                                          ? humanizeCode(signer.expected_role)
                                          : t('summary.unavailable')}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className={getProcessTone(
                                          signer.signature_valid ? 'valid' : 'invalid'
                                        )}
                                      >
                                        {signer.signature_valid
                                          ? t('signature.validation.valid')
                                          : t('signature.validation.invalid')}
                                      </Badge>
                                    </div>
                                    <div className="mt-2 text-sm text-slate-700 dark:text-[#E6EDF3]">
                                      {signer.certificate_subject ?? t('summary.unavailable')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-600 dark:border-[#1E2A3D] dark:bg-[#0B1220]/70 dark:text-[#A3ADC2]">
                          {t('signature.validation.empty')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-sm text-slate-600 dark:border-[#1E2A3D] dark:bg-[#0B1220]/70 dark:text-[#A3ADC2]">
                        {effectiveSummary?.status === 'awaiting_client_signature'
                          ? t('signature.hints.awaiting_client_signature')
                          : effectiveSummary?.status === 'awaiting_provider_signature'
                            ? t('signature.hints.awaiting_provider_signature')
                            : effectiveSummary?.status === 'signed'
                              ? t('signature.hints.signed')
                              : canIssueFreshSignatureFlow
                                ? t('signature.ready_to_issue')
                                : t('signature.empty')}
                      </div>

                      {canIssueFreshSignatureFlow ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                          <div className="grid gap-3 md:grid-cols-[1fr,auto] md:items-end">
                            <div className="space-y-2">
                              <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                {t('signature.actions.issue_flow')}
                              </div>
                              <Input
                                value={validationPolicyCode}
                                onChange={(event) =>
                                  setValidationPolicyCode(event.target.value)
                                }
                                placeholder={t('signature.form.validation_policy_code')}
                              />
                            </div>
                            <Button
                              type="button"
                              onClick={() => {
                                void handleIssueSignatureFlow();
                              }}
                              disabled={signatureActionLoading === 'issue'}
                            >
                              {signatureActionLoading === 'issue' ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              {t('signature.actions.issue_flow')}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl overflow-hidden border-0 bg-white p-0 dark:bg-[#0B1220]">
          <DialogHeader className="border-b border-slate-200 px-6 py-4 dark:border-[#1E2A3D]">
            <DialogTitle>{t('preview.title')}</DialogTitle>
            <DialogDescription>
              {effectiveSummary?.reference || t('preview.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="h-[75vh] bg-slate-100 dark:bg-[#070C14]">
            {previewHtml ? (
              <iframe
                title={t('preview.title')}
                srcDoc={previewHtml}
                className="h-full w-full bg-white"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-[#A3ADC2]">
                {t('preview.empty')}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (variant === 'dialog') {
    return content;
  }

  return (
    <Card className={cn('glass-card shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-xl">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
