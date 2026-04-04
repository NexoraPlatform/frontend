import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getProjectReviewScoreEntries, type ProjectReviewRecord } from '@/lib/reviews';

export type ReviewScoreLabels = {
  communication: string;
  quality: string;
  timeliness: string;
  professionalism: string;
  scope_clarity: string;
  payment_reliability: string;
  would_work_again: string;
  would_work_again_yes: string;
  would_work_again_no: string;
};

type ReviewScoreListProps = {
  review: ProjectReviewRecord;
  labels: ReviewScoreLabels;
  className?: string;
};

export function ReviewScoreList({
  review,
  labels,
  className,
}: ReviewScoreListProps) {
  const entries = getProjectReviewScoreEntries(review);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {entries.map((entry) => {
        const isBoolean = entry.key === 'would_work_again';
        const label = isBoolean ? labels.would_work_again : labels[entry.key];
        const valueText = isBoolean
          ? entry.value === 1
            ? labels.would_work_again_yes
            : labels.would_work_again_no
          : `${entry.value}/5`;

        return (
          <Badge
            key={entry.key}
            variant="outline"
            className="border-slate-200 bg-white/70 text-slate-700 dark:border-[#23314D] dark:bg-[#111827] dark:text-slate-200"
          >
            {label}: {valueText}
          </Badge>
        );
      })}
    </div>
  );
}
