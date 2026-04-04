import { useEffect } from 'react';

export function useProjectRequestCardHighlight(
    highlightedMilestoneId: string | null,
    onClear: () => void
) {
    useEffect(() => {
        if (!highlightedMilestoneId) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            onClear();
        }, 5000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [highlightedMilestoneId, onClear]);
}
