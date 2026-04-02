export type ProjectContractWorkspaceProps = {
  projectId: string | number;
  projectTitle?: string | null;
  projectClientId?: string | number | null;
  initialContractId?: string | number | null;
  locale?: string;
  autoGenerate?: boolean;
  variant?: 'panel' | 'dialog';
  className?: string;
};

export type ReviewActionMode =
  | 'open'
  | 'assign'
  | 'start'
  | 'request_changes'
  | 'approve'
  | 'reject'
  | null;
