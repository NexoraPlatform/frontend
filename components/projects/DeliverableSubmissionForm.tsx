"use client";

import { type FormEvent, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/lib/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, FetchError } from '@/lib/fetch-client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OAuthProvider } from '@/types/auth';
import type { DeliveryProvider, Project } from '@/types';

interface DeliverableSubmissionFormProps {
    project: Project;
}

type FormConfig = {
    label: string;
    placeholder: string;
    helper: string;
    submitText: string;
    validator?: (value: string) => boolean;
    invalidMessage?: string;
};

const validateFigmaLink = (value: string) =>
    /^https?:\/\/(www\.)?figma\.com\/(file|design|proto|board)\//i.test(value);

const validateGoogleDriveFolder = (value: string) =>
    /^https?:\/\/drive\.google\.com\/drive\/folders\/[^/?#]+/i.test(value);

const validateGithubRepo = (value: string) =>
    /^https?:\/\/(www\.)?github\.com\/[^/\s]+\/[^/\s]+\/?$/i.test(value);

const validateGoogleAnalyticsProperty = (value: string) =>
    /^(properties\/)?\d+$/i.test(value);

const FORM_CONFIG: Record<string, FormConfig> = {
    figma: {
        label: 'Figma File Link',
        placeholder: 'https://www.figma.com/file/...',
        helper: 'Paste a public/shared Figma file link.',
        submitText: 'Submit Figma file',
        validator: validateFigmaLink,
        invalidMessage: 'Please enter a valid Figma file link.',
    },
    google_drive: {
        label: 'Google Drive Folder Link',
        placeholder: 'https://drive.google.com/drive/folders/...',
        helper: 'Use the Drive folder link that contains your deliverables.',
        submitText: 'Submit Drive folder',
        validator: validateGoogleDriveFolder,
        invalidMessage: 'Please enter a valid Google Drive folder link.',
    },
    google_analytics: {
        label: 'Google Analytics Property ID',
        placeholder: 'properties/123456789 or 123456789',
        helper: 'Provide the property used for the delivery report.',
        submitText: 'Run report',
        validator: validateGoogleAnalyticsProperty,
        invalidMessage: 'Please enter a valid Google Analytics property ID.',
    },
    github: {
        label: 'Repository URL',
        placeholder: 'https://github.com/owner/repository',
        helper: 'Use the repository URL where the delivered code is hosted.',
        submitText: 'Submit repository',
        validator: validateGithubRepo,
        invalidMessage: 'Please enter a valid GitHub repository URL.',
    },
};

const formatProviderName = (provider: string) => {
    switch (provider) {
        case 'figma':
            return 'Figma';
        case 'google_drive':
            return 'Google Drive';
        case 'google_analytics':
            return 'Google Analytics';
        case 'github':
            return 'GitHub';
        default:
            return provider || 'Unknown';
    }
};

const mapDeliveryProviderToOAuth = (provider: string): OAuthProvider | null => {
    if (provider === 'figma') return 'figma';
    if (provider === 'github') return 'github';
    if (provider === 'google_drive' || provider === 'google_analytics') return 'google';
    return null;
};

const resolveDeliveryProvider = (project: Project): DeliveryProvider => {
    const fromService =
        typeof project?.service === 'object' && project?.service !== null
            ? String(project.service.delivery_provider ?? '')
            : '';
    const fallback = String(project?.delivery_type ?? '');
    return (fromService || fallback || '').toLowerCase();
};

export default function DeliverableSubmissionForm({ project }: DeliverableSubmissionFormProps) {
    const { user, loading, userLoading } = useAuth();
    const [resourceId, setResourceId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const roleSlugs = useMemo(() => {
        const fromRoleSlugs = Array.isArray(user?.role_slugs)
            ? (user?.role_slugs ?? []).map((role) => String(role).toLowerCase())
            : [];
        const fromRoles = Array.isArray(user?.roles)
            ? (user?.roles ?? [])
                .map((role: any) => String(role?.slug ?? role?.name ?? role ?? '').toLowerCase())
                .filter(Boolean)
            : [];
        const fromRole = user?.role ? [String(user.role).toLowerCase()] : [];
        return Array.from(new Set([...fromRoleSlugs, ...fromRoles, ...fromRole]));
    }, [user?.role, user?.role_slugs, user?.roles]);
    const isProviderRole = roleSlugs.includes('provider');

    const deliveryProvider = useMemo(() => resolveDeliveryProvider(project), [project]);
    const formConfig = FORM_CONFIG[deliveryProvider] ?? {
        label: 'Resource ID',
        placeholder: 'Enter deliverable resource identifier',
        helper: 'Provide the resource identifier required by this project.',
        submitText: 'Submit deliverable',
    };

    const requiredOAuthProvider = mapDeliveryProviderToOAuth(deliveryProvider);
    const connectedProviders = useMemo(() => {
        const connected = new Set<OAuthProvider>();
        const connectedAccounts = (Array.isArray(user?.connected_accounts)
            ? user?.connected_accounts
            : []) ?? [];

        connectedAccounts.forEach((account) => {
            if (account?.provider) {
                connected.add(account.provider);
            }
        });

        if (user?.github_token) {
            connected.add('github');
        }

        return connected;
    }, [user?.connected_accounts, user?.github_token]);

    const requiresAccountConnection = Boolean(requiredOAuthProvider);
    const hasRequiredConnection =
        !requiredOAuthProvider || connectedProviders.has(requiredOAuthProvider);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const normalizedValue = resourceId.trim();
        if (!normalizedValue) {
            const message = 'This field is required.';
            setError(message);
            toast.error(message);
            return;
        }

        if (formConfig.validator && !formConfig.validator(normalizedValue)) {
            const message = formConfig.invalidMessage || 'Invalid value.';
            setError(message);
            toast.error(message);
            return;
        }

        setSubmitting(true);
        try {
            await apiFetch(`/projects/${project.id}/deliverables`, {
                method: 'POST',
                body: { resource_id: normalizedValue },
            });
            setSubmitted(true);
            setResourceId('');
            toast.success('Deliverable submitted successfully');
        } catch (err) {
            let message = 'Failed to submit deliverable.';

            if (err instanceof FetchError) {
                const payload = err.data as Record<string, unknown> | null;
                message =
                    (payload?.message as string | undefined) ||
                    (payload?.error as string | undefined) ||
                    err.message ||
                    message;
            } else if (err instanceof Error) {
                message = err.message;
            }

            setError(message);
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || userLoading) {
        return (
            <Card className="glass-card shadow-sm">
                <CardContent className="flex items-center gap-3 p-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading delivery module...</span>
                </CardContent>
            </Card>
        );
    }

    if (!user) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between gap-3">
                    <span>You need to be signed in to submit a deliverable.</span>
                    <Button asChild size="sm">
                        <Link href="/auth/signin">Sign in</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    if (!isProviderRole) {
        return null;
    }

    if (!deliveryProvider) {
        return null;
    }

    if (requiresAccountConnection && !hasRequiredConnection) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between gap-3">
                    <span>
                        This project requires a connected {formatProviderName(deliveryProvider)} account.
                    </span>
                    <Button asChild size="sm" variant="outline">
                        <Link href="/dashboard/integrations">Open integrations</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Card className="glass-card shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-xl">Deliverable submission</CardTitle>
                    <Badge variant="outline">{formatProviderName(deliveryProvider)}</Badge>
                </div>
                <CardDescription>
                    Submit the delivery resource configured for this project.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="deliverable-resource-id">{formConfig.label}</Label>
                        <Input
                            id="deliverable-resource-id"
                            value={resourceId}
                            onChange={(event) => setResourceId(event.target.value)}
                            placeholder={formConfig.placeholder}
                        />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <LinkIcon className="h-3 w-3" />
                            <span>{formConfig.helper}</span>
                        </div>
                    </div>

                    {error ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : null}

                    {submitted ? (
                        <Alert>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription>Deliverable sent. You can submit another resource if needed.</AlertDescription>
                        </Alert>
                    ) : null}

                    <Button type="submit" disabled={submitting}>
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            formConfig.submitText
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
