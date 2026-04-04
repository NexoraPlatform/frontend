"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  Loader2,
  ScrollText,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { AdminOverviewItem, AdminSidebarCard } from "@/components/admin/admin-sidebar-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/lib/navigation";
import { ADMIN_SERVICE_CATEGORY_CONTRACT_TYPE_OPTIONS } from "@/lib/admin-legal-service-categories";
import type { AdminServiceCategoryContractType } from "@/lib/api";

export type LegalServiceCategoryEditorValues = {
  serviceCode: string;
  serviceName: string;
  serviceGroup: string;
  description: string;
  defaultContractType: AdminServiceCategoryContractType;
  milestoneRecommended: boolean;
  acceptanceTestingRequired: boolean;
  deliverySpecRequired: boolean;
  ipTransferExpected: boolean;
  backgroundIpExpected: boolean;
  openSourceRisk: boolean;
  thirdPartyMaterialRisk: boolean;
  moralRightsSensitive: boolean;
  ndaRecommended: boolean;
  dpaRequiredByDefault: boolean;
  personalDataProcessingLikely: boolean;
  securityClauseRequired: boolean;
  warrantyPeriodDays: string;
  bugFixPeriodDays: string;
  serviceLevelsRequired: boolean;
  professionalStandardsClauseRequired: boolean;
  regulatedActivityRisk: boolean;
  exportControlRisk: boolean;
  defaultAcceptanceRule: string;
  defaultDeliveryDefinition: string;
  internalLegalNote: string;
  isActive: boolean;
  sortOrder: string;
  version: string;
};

type LegalServiceCategoryEditorFormProps = {
  mode: "create" | "edit";
  initialValues: LegalServiceCategoryEditorValues;
  submitting?: boolean;
  error?: string;
  backHref?: string;
  onSubmit: (values: LegalServiceCategoryEditorValues) => Promise<void> | void;
};

type ToggleFieldProps = {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function ToggleField({ id, label, checked, onCheckedChange }: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/50 px-4 py-3">
      <Label htmlFor={id} className="text-sm font-medium leading-5">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function LegalServiceCategoryEditorForm({
  mode,
  initialValues,
  submitting = false,
  error,
  backHref = "/admin/legal/service-categories",
  onSubmit,
}: LegalServiceCategoryEditorFormProps) {
  const t = useTranslations();
  const [formData, setFormData] = useState<LegalServiceCategoryEditorValues>(initialValues);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const pageTitle =
    mode === "create"
      ? t("admin.legal_service_categories.create_title")
      : t("admin.legal_service_categories.edit_title");
  const pageSubtitle =
    mode === "create"
      ? t("admin.legal_service_categories.create_subtitle")
      : t("admin.legal_service_categories.edit_subtitle");
  const submitLabel =
    mode === "create"
      ? t("admin.legal_service_categories.actions.create")
      : t("admin.legal_service_categories.actions.save");
  const submittingLabel =
    mode === "create"
      ? t("admin.legal_service_categories.actions.creating")
      : t("admin.legal_service_categories.actions.saving");

  const contractTypeLabels = useMemo(
    () => ({
      SERVICES: t("admin.legal_service_categories.contract_types.services"),
      WORK_FOR_RESULT: t("admin.legal_service_categories.contract_types.work_for_result"),
      MIXED: t("admin.legal_service_categories.contract_types.mixed"),
    }),
    [t]
  );

  const deliveryToggles = [
    {
      id: "milestoneRecommended",
      label: t("admin.legal_service_categories.form.milestone_recommended"),
      checked: formData.milestoneRecommended,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({ ...prev, milestoneRecommended: checked })),
    },
    {
      id: "acceptanceTestingRequired",
      label: t("admin.legal_service_categories.form.acceptance_testing_required"),
      checked: formData.acceptanceTestingRequired,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({ ...prev, acceptanceTestingRequired: checked })),
    },
    {
      id: "deliverySpecRequired",
      label: t("admin.legal_service_categories.form.delivery_spec_required"),
      checked: formData.deliverySpecRequired,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({ ...prev, deliverySpecRequired: checked })),
    },
    {
      id: "serviceLevelsRequired",
      label: t("admin.legal_service_categories.form.service_levels_required"),
      checked: formData.serviceLevelsRequired,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({ ...prev, serviceLevelsRequired: checked })),
    },
  ];

  const ipAndRiskToggles = [
    {
      id: "ipTransferExpected",
      label: t("admin.legal_service_categories.form.ip_transfer_expected"),
      checked: formData.ipTransferExpected,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({ ...prev, ipTransferExpected: checked })),
    },
    {
      id: "backgroundIpExpected",
      label: t("admin.legal_service_categories.form.background_ip_expected"),
      checked: formData.backgroundIpExpected,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({ ...prev, backgroundIpExpected: checked })),
    },
    {
      id: "openSourceRisk",
      label: t("admin.legal_service_categories.form.open_source_risk"),
      checked: formData.openSourceRisk,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({ ...prev, openSourceRisk: checked })),
    },
    {
      id: "thirdPartyMaterialRisk",
      label: t("admin.legal_service_categories.form.third_party_material_risk"),
      checked: formData.thirdPartyMaterialRisk,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({ ...prev, thirdPartyMaterialRisk: checked })),
    },
    {
      id: "moralRightsSensitive",
      label: t("admin.legal_service_categories.form.moral_rights_sensitive"),
      checked: formData.moralRightsSensitive,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({ ...prev, moralRightsSensitive: checked })),
    },
    {
      id: "regulatedActivityRisk",
      label: t("admin.legal_service_categories.form.regulated_activity_risk"),
      checked: formData.regulatedActivityRisk,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({ ...prev, regulatedActivityRisk: checked })),
    },
    {
      id: "exportControlRisk",
      label: t("admin.legal_service_categories.form.export_control_risk"),
      checked: formData.exportControlRisk,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({ ...prev, exportControlRisk: checked })),
    },
    {
      id: "professionalStandardsClauseRequired",
      label: t(
        "admin.legal_service_categories.form.professional_standards_clause_required"
      ),
      checked: formData.professionalStandardsClauseRequired,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({
          ...prev,
          professionalStandardsClauseRequired: checked,
        })),
    },
  ];

  const complianceToggles = [
    {
      id: "ndaRecommended",
      label: t("admin.legal_service_categories.form.nda_recommended"),
      checked: formData.ndaRecommended,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({ ...prev, ndaRecommended: checked })),
    },
    {
      id: "dpaRequiredByDefault",
      label: t("admin.legal_service_categories.form.dpa_required_by_default"),
      checked: formData.dpaRequiredByDefault,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({ ...prev, dpaRequiredByDefault: checked })),
    },
    {
      id: "personalDataProcessingLikely",
      label: t("admin.legal_service_categories.form.personal_data_processing_likely"),
      checked: formData.personalDataProcessingLikely,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({
          ...prev,
          personalDataProcessingLikely: checked,
        })),
    },
    {
      id: "securityClauseRequired",
      label: t("admin.legal_service_categories.form.security_clause_required"),
      checked: formData.securityClauseRequired,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({ ...prev, securityClauseRequired: checked })),
    },
    {
      id: "isActive",
      label: t("admin.legal_service_categories.form.is_active"),
      checked: formData.isActive,
      onCheckedChange: (checked: boolean) =>
        setFormData((prev) => ({ ...prev, isActive: checked })),
    },
  ];

  const enabledFlagCount = [
    formData.milestoneRecommended,
    formData.acceptanceTestingRequired,
    formData.deliverySpecRequired,
    formData.ipTransferExpected,
    formData.backgroundIpExpected,
    formData.openSourceRisk,
    formData.thirdPartyMaterialRisk,
    formData.moralRightsSensitive,
    formData.ndaRecommended,
    formData.dpaRequiredByDefault,
    formData.personalDataProcessingLikely,
    formData.securityClauseRequired,
    formData.serviceLevelsRequired,
    formData.professionalStandardsClauseRequired,
    formData.regulatedActivityRisk,
    formData.exportControlRisk,
  ].filter(Boolean).length;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <AdminPageHeader title={pageTitle} description={pageSubtitle} backHref={backHref} />

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <AdminSectionCard
            delay={0.12}
            title={t("admin.legal_service_categories.form.basics_title")}
            description={t("admin.legal_service_categories.form.basics_description")}
          >
            {error ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serviceCode">
                  {t("admin.legal_service_categories.form.service_code")}
                </Label>
                <Input
                  id="serviceCode"
                  value={formData.serviceCode}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, serviceCode: event.target.value }))
                  }
                  placeholder={t("admin.legal_service_categories.form.service_code_placeholder")}
                  required
                  className="border-border bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceGroup">
                  {t("admin.legal_service_categories.form.service_group")}
                </Label>
                <Input
                  id="serviceGroup"
                  value={formData.serviceGroup}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, serviceGroup: event.target.value }))
                  }
                  placeholder={t("admin.legal_service_categories.form.service_group_placeholder")}
                  required
                  className="border-border bg-transparent"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="serviceName">
                {t("admin.legal_service_categories.form.service_name")}
              </Label>
              <Input
                id="serviceName"
                value={formData.serviceName}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, serviceName: event.target.value }))
                }
                placeholder={t("admin.legal_service_categories.form.service_name_placeholder")}
                required
                className="border-border bg-transparent"
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultContractType">
                  {t("admin.legal_service_categories.form.default_contract_type")}
                </Label>
                <Select
                  value={formData.defaultContractType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      defaultContractType: value as AdminServiceCategoryContractType,
                    }))
                  }
                >
                  <SelectTrigger id="defaultContractType" className="border-border bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_SERVICE_CATEGORY_CONTRACT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {contractTypeLabels[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">
                    {t("admin.legal_service_categories.form.sort_order")}
                  </Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, sortOrder: event.target.value }))
                    }
                    placeholder="0"
                    className="border-border bg-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">
                    {t("admin.legal_service_categories.form.version")}
                  </Label>
                  <Input
                    id="version"
                    type="number"
                    min="1"
                    value={formData.version}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, version: event.target.value }))
                    }
                    placeholder="1"
                    className="border-border bg-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="description">
                {t("admin.legal_service_categories.form.description")}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder={t("admin.legal_service_categories.form.description_placeholder")}
                rows={4}
                className="border-border bg-transparent"
              />
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            delay={0.16}
            title={t("admin.legal_service_categories.form.delivery_title")}
            description={t("admin.legal_service_categories.form.delivery_description")}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {deliveryToggles.map((field) => (
                <ToggleField key={field.id} {...field} />
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="warrantyPeriodDays">
                  {t("admin.legal_service_categories.form.warranty_period_days")}
                </Label>
                <Input
                  id="warrantyPeriodDays"
                  type="number"
                  value={formData.warrantyPeriodDays}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      warrantyPeriodDays: event.target.value,
                    }))
                  }
                  placeholder={t(
                    "admin.legal_service_categories.form.warranty_period_days_placeholder"
                  )}
                  className="border-border bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bugFixPeriodDays">
                  {t("admin.legal_service_categories.form.bug_fix_period_days")}
                </Label>
                <Input
                  id="bugFixPeriodDays"
                  type="number"
                  value={formData.bugFixPeriodDays}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      bugFixPeriodDays: event.target.value,
                    }))
                  }
                  placeholder={t(
                    "admin.legal_service_categories.form.bug_fix_period_days_placeholder"
                  )}
                  className="border-border bg-transparent"
                />
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultAcceptanceRule">
                  {t("admin.legal_service_categories.form.default_acceptance_rule")}
                </Label>
                <Textarea
                  id="defaultAcceptanceRule"
                  value={formData.defaultAcceptanceRule}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      defaultAcceptanceRule: event.target.value,
                    }))
                  }
                  placeholder={t(
                    "admin.legal_service_categories.form.default_acceptance_rule_placeholder"
                  )}
                  rows={4}
                  className="border-border bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultDeliveryDefinition">
                  {t("admin.legal_service_categories.form.default_delivery_definition")}
                </Label>
                <Textarea
                  id="defaultDeliveryDefinition"
                  value={formData.defaultDeliveryDefinition}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      defaultDeliveryDefinition: event.target.value,
                    }))
                  }
                  placeholder={t(
                    "admin.legal_service_categories.form.default_delivery_definition_placeholder"
                  )}
                  rows={4}
                  className="border-border bg-transparent"
                />
              </div>
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            delay={0.2}
            title={t("admin.legal_service_categories.form.risk_title")}
            description={t("admin.legal_service_categories.form.risk_description")}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {ipAndRiskToggles.map((field) => (
                <ToggleField key={field.id} {...field} />
              ))}
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            delay={0.24}
            title={t("admin.legal_service_categories.form.compliance_title")}
            description={t("admin.legal_service_categories.form.compliance_description")}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {complianceToggles.map((field) => (
                <ToggleField key={field.id} {...field} />
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="internalLegalNote">
                {t("admin.legal_service_categories.form.internal_legal_note")}
              </Label>
              <Textarea
                id="internalLegalNote"
                value={formData.internalLegalNote}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    internalLegalNote: event.target.value,
                  }))
                }
                placeholder={t(
                  "admin.legal_service_categories.form.internal_legal_note_placeholder"
                )}
                rows={5}
                className="border-border bg-transparent"
              />
            </div>
          </AdminSectionCard>
        </div>

        <div className="space-y-6">
          <AdminSidebarCard
            delay={0.18}
            icon={ScrollText}
            title={t("admin.legal_service_categories.sidebar.overview_title")}
            description={t("admin.legal_service_categories.sidebar.overview_description")}
          >
            <div className="space-y-4">
              <AdminOverviewItem
                label={t("admin.legal_service_categories.form.service_code")}
                value={formData.serviceCode || "-"}
              />
              <AdminOverviewItem
                label={t("admin.legal_service_categories.form.service_group")}
                value={formData.serviceGroup || "-"}
              />
              <AdminOverviewItem
                label={t("admin.legal_service_categories.form.default_contract_type")}
                value={contractTypeLabels[formData.defaultContractType]}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminOverviewItem
                  label={t("admin.legal_service_categories.form.is_active")}
                  value={formData.isActive ? t("admin.legal_service_categories.status.active") : t("admin.legal_service_categories.status.inactive")}
                />
                <AdminOverviewItem
                  label={t("admin.legal_service_categories.sidebar.enabled_flags")}
                  value={enabledFlagCount}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminOverviewItem
                  label={t("admin.legal_service_categories.form.sort_order")}
                  value={formData.sortOrder || "0"}
                />
                <AdminOverviewItem
                  label={t("admin.legal_service_categories.form.version")}
                  value={formData.version || "-"}
                />
              </div>
            </div>
          </AdminSidebarCard>

          <AdminSidebarCard
            delay={0.22}
            icon={Settings2}
            title={t("admin.legal_service_categories.sidebar.rules_title")}
            description={t("admin.legal_service_categories.sidebar.rules_description")}
          >
            <div className="space-y-4">
              <AdminOverviewItem
                label={t("admin.legal_service_categories.form.default_acceptance_rule")}
                value={formData.defaultAcceptanceRule || t("admin.legal_service_categories.empty")}
                valueClassName="mt-2 whitespace-pre-wrap text-sm"
              />
              <AdminOverviewItem
                label={t("admin.legal_service_categories.form.default_delivery_definition")}
                value={
                  formData.defaultDeliveryDefinition ||
                  t("admin.legal_service_categories.empty")
                }
                valueClassName="mt-2 whitespace-pre-wrap text-sm"
              />
            </div>
          </AdminSidebarCard>

          <AdminSidebarCard
            delay={0.26}
            icon={ShieldCheck}
            title={t("admin.legal_service_categories.sidebar.actions_title")}
            description={t("admin.legal_service_categories.sidebar.actions_description")}
          >
            <div className="space-y-3">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-white hover:bg-primary/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {submittingLabel}
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
              <Link href={backHref} className="block">
                <Button type="button" variant="outline" className="w-full border-border bg-transparent">
                  {t("admin.legal_service_categories.actions.cancel")}
                </Button>
              </Link>
            </div>
          </AdminSidebarCard>
        </div>
      </form>
    </div>
  );
}
