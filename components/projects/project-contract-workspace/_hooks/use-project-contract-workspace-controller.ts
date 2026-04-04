import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { useTranslations } from 'next-intl';

import { useOptionalAuth } from '@/contexts/auth-context';
import { usePublicAuth } from '@/hooks/use-public-auth';
import { getPermissionSlugs } from '@/lib/access';
import { FetchError } from '@/lib/fetch-client';
import {
  contractsApi,
  getCurrentContractDocument,
  getLatestContractRiskAssessment,
  getLatestContractSignatureValidation,
  type ContractDocument,
  type ContractEntity,
  type ContractGenerationSummary,
  type ContractManualReviewEntity,
  type ContractOperationsSnapshot,
  type ContractSignatureEntity,
} from '@/lib/contracts';

import {
  canGenerateContractsForProject,
  clearCachedContractId,
  downloadResponseBlob,
  formatDateTime,
  isPrivilegedContractActor,
  normalizeId,
  normalizeTextLines,
  readCachedContractId,
  resolveErrorMessage,
  writeCachedContractId,
} from '../_lib/project-contract-workspace-helpers';
import type {
  ProjectContractWorkspaceProps,
  ReviewActionMode,
} from '../_lib/project-contract-workspace-types';

export function useProjectContractWorkspaceController({
  autoGenerate = false,
  initialContractId,
  locale = 'ro',
  projectClientId,
  projectId,
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
  const [reviewActionMode, setReviewActionMode] = useState<ReviewActionMode>(null);
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

  return {
    activeReview,
    activeSignature,
    assignReviewForm,
    autoGenerate,
    canApproveManualReview,
    canAssignManualReview,
    canGenerate,
    canIssueFreshSignatureFlow,
    canIssueSignatureFlow,
    canManageSignatureUploads,
    canOpenManualReview,
    canReadAdminContract,
    canReadManualReview,
    canReadSignatureDetail,
    canRejectManualReview,
    canRequestManualReviewChanges,
    canStartManualReview,
    canUploadClientSignedDocument,
    canUploadProviderSignedDocument,
    clientFileInputRef,
    clientSignedFile,
    contract,
    contractId,
    currentClientSignedPdf,
    currentDocuments,
    currentFinalPdf,
    currentSignedPdf,
    decisionNotes,
    downloading,
    effectiveSummary,
    formatDateTime,
    generating,
    handleClientFileChange,
    handleDownloadManualSignatureStep,
    handleDownloadPdf,
    handleDownloadSignedPdf,
    handleGenerate,
    handleIssueSignatureFlow,
    handleOpenManualReview,
    handlePreviewHtml,
    handleProviderFileChange,
    handleRefresh,
    handleSubmitReviewAction,
    handleUploadManualSignatureStep,
    latestRiskAssessment,
    latestSignatureValidation,
    loading,
    loadingContract,
    locale,
    openReviewForm,
    operationsLoading,
    previewHtml,
    previewLoading,
    previewOpen,
    projectId: normalizedProjectId,
    providerFileInputRef,
    providerSignedFile,
    requestChangesForm,
    reviewActionLoading,
    reviewActionMode,
    reviewError,
    reviewIsClosedLike,
    reviewNeedsAttention,
    setAssignReviewForm,
    setDecisionNotes,
    setOpenReviewForm,
    setPreviewOpen,
    setRequestChangesForm,
    setReviewActionMode,
    setStartReviewComment,
    setValidationPolicyCode,
    signature,
    signatureActionLoading,
    signatureError,
    sortedReviewComments,
    startReviewComment,
    summary,
    t,
    translateIfPresent,
    user,
    userLoading,
    validationPolicyCode,
    workspaceError,
  };
}

export type ProjectContractWorkspaceController = ReturnType<
  typeof useProjectContractWorkspaceController
>;
