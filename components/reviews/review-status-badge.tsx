import { Badge } from '@/components/ui/badge';

type ReviewStatusBadgeProps = {
  status: string;
  labels?: Partial<Record<'SUBMITTED' | 'PUBLISHED' | 'REMOVED', string>>;
};

const FALLBACK_LABELS: Record<'SUBMITTED' | 'PUBLISHED' | 'REMOVED', string> = {
  SUBMITTED: 'Submitted',
  PUBLISHED: 'Published',
  REMOVED: 'Removed',
};

export function ReviewStatusBadge({
  status,
  labels,
}: ReviewStatusBadgeProps) {
  const normalizedStatus = status.trim().toUpperCase();

  if (normalizedStatus === 'PUBLISHED') {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
        {labels?.PUBLISHED ?? FALLBACK_LABELS.PUBLISHED}
      </Badge>
    );
  }

  if (normalizedStatus === 'REMOVED') {
    return (
      <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200">
        {labels?.REMOVED ?? FALLBACK_LABELS.REMOVED}
      </Badge>
    );
  }

  return (
    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-100">
      {labels?.SUBMITTED ?? FALLBACK_LABELS.SUBMITTED}
    </Badge>
  );
}
