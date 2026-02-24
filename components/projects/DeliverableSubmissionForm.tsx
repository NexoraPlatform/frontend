"use client";

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Link as LinkIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, FetchError } from '@/lib/fetch-client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DeliveryProvider, Project, ProjectLine } from '@/types';

interface DeliverableSubmissionFormProps {
    project: Project;
    line: ProjectLine;
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

const validateGithubResource = (value: string) =>
    /^https?:\/\/(www\.)?github\.com\/[^/\s]+\/[^/\s]+(\/(pull|compare|tree|blob|commit|commits|issues)\/[^/\s]+)?\/?$/i.test(
        value
    );

const validateGoogleAnalyticsProperty = (value: string) => /^(properties\/)?\d+$/i.test(value);

const FORM_CONFIG: Record<string, FormConfig> = {
    figma: {
        label: 'Figma File Link',
        placeholder: 'https://www.figma.com/file/...',
        helper: 'Paste a public/shared Figma file link.',
        submitText: 'Submit design',
        validator: validateFigmaLink,
        invalidMessage: 'Please enter a valid Figma file link.',
    },
    google_drive: {
        label: 'Google Drive Folder Link',
        placeholder: 'https://drive.google.com/drive/folders/...',
        helper: 'Use the Drive folder link that contains your deliverables.',
        submitText: 'Submit folder',
        validator: validateGoogleDriveFolder,
        invalidMessage: 'Please enter a valid Google Drive folder link.',
    },
    google_analytics: {
        label: 'Google Analytics Property ID',
        placeholder: 'properties/123456789 or 123456789',
        helper: 'Provide the property used for this line report.',
        submitText: 'Run report',
        validator: validateGoogleAnalyticsProperty,
        invalidMessage: 'Please enter a valid Google Analytics property ID.',
    },
    github: {
        label: 'Repository / PR URL',
        placeholder: 'https://github.com/owner/repository or /pull/123',
        helper: 'Use a repository or pull request URL related to this delivery.',
        submitText: 'Link PR',
        validator: validateGithubResource,
        invalidMessage: 'Please enter a valid GitHub repository or PR URL.',
    },
    manual_upload: {
        label: 'Delivery Link',
        placeholder: 'https://...',
        helper: 'Paste the link where the client can access the files.',
        submitText: 'Submit delivery',
    },
    manual: {
        label: 'Delivery Link',
        placeholder: 'https://...',
        helper: 'Paste the link where the client can access the files.',
        submitText: 'Submit delivery',
    },
};

const resolveLineProvider = (line: ProjectLine): DeliveryProvider => {
    const normalized = String(line?.delivery_provider ?? '').toLowerCase();

    if (normalized === 'github') return 'github';
    if (normalized === 'figma') return 'figma';
    if (normalized === 'google_drive') return 'google_drive';
    if (normalized === 'google_analytics') return 'google_analytics';

    return 'manual_upload';
};

export default function DeliverableSubmissionForm({ project, line }: DeliverableSubmissionFormProps) {
    const [resourceId, setResourceId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const deliveryProvider = useMemo(() => resolveLineProvider(line), [line]);
    const formConfig = FORM_CONFIG[deliveryProvider] ?? {
        label: 'Resource ID',
        placeholder: 'Enter deliverable resource identifier',
        helper: 'Provide the resource identifier required for this project line.',
        submitText: 'Submit deliverable',
    };

    const inputId = useMemo(
        () => `deliverable-resource-id-${String(line.id).replace(/[^a-zA-Z0-9_-]/g, '-')}`,
        [line.id]
    );

    useEffect(() => {
        setResourceId('');
        setError(null);
        setSubmitted(false);
    }, [line.id]);

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
                body: {
                    resource_id: normalizedValue,
                    project_line_id: line.id,
                },
            });
            setSubmitted(true);
            setResourceId('');
            toast.success(`Deliverable submitted for "${line.title}"`);
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

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
                <Label htmlFor={inputId}>{formConfig.label}</Label>
                <Input
                    id={inputId}
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
                    <AlertDescription>
                        Deliverable sent for this line. You can submit another resource if needed.
                    </AlertDescription>
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
    );
}
