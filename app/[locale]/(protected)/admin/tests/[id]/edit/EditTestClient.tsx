"use client";

import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { TestEditorForm } from "@/components/admin/test-editor-form";

export default function EditTestClient({ id }: { id: string }) {
  return (
    <ProjectAdminShell>
      <TestEditorForm mode="edit" testId={id} />
    </ProjectAdminShell>
  );
}
