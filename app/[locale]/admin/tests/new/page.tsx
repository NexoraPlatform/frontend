"use client";

import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { TestEditorForm } from "@/components/admin/test-editor-form";

export default function NewTestPage() {
  return (
    <ProjectAdminShell>
      <TestEditorForm mode="create" />
    </ProjectAdminShell>
  );
}
