import { useEffect } from 'react';

type UseClearHighlightedMilestoneParams = {
    highlightedMilestoneId: string | null;
    clearHighlightedMilestone: () => void;
};

export function useClearHighlightedMilestone({
    highlightedMilestoneId,
    clearHighlightedMilestone,
}: UseClearHighlightedMilestoneParams) {
    useEffect(() => {
        if (!highlightedMilestoneId) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            clearHighlightedMilestone();
        }, 5000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [clearHighlightedMilestone, highlightedMilestoneId]);
}
