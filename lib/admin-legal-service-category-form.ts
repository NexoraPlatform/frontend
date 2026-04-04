import type { LegalServiceCategoryEditorValues } from "@/components/admin/legal-service-category-editor-form";
import type {
  AdminServiceCategory,
  AdminServiceCategoryPayload,
} from "@/lib/api";

export const EMPTY_LEGAL_SERVICE_CATEGORY_VALUES: LegalServiceCategoryEditorValues = {
  serviceCode: "",
  serviceName: "",
  serviceGroup: "",
  description: "",
  defaultContractType: "SERVICES",
  milestoneRecommended: false,
  acceptanceTestingRequired: false,
  deliverySpecRequired: false,
  ipTransferExpected: false,
  backgroundIpExpected: false,
  openSourceRisk: false,
  thirdPartyMaterialRisk: false,
  moralRightsSensitive: false,
  ndaRecommended: false,
  dpaRequiredByDefault: false,
  personalDataProcessingLikely: false,
  securityClauseRequired: false,
  warrantyPeriodDays: "",
  bugFixPeriodDays: "",
  serviceLevelsRequired: false,
  professionalStandardsClauseRequired: false,
  regulatedActivityRisk: false,
  exportControlRisk: false,
  defaultAcceptanceRule: "",
  defaultDeliveryDefinition: "",
  internalLegalNote: "",
  isActive: true,
  sortOrder: "0",
  version: "1",
};

const toOptionalInteger = (value: string): number | null => {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export function buildLegalServiceCategoryEditorValues(
  category: AdminServiceCategory | null | undefined
): LegalServiceCategoryEditorValues {
  if (!category) {
    return EMPTY_LEGAL_SERVICE_CATEGORY_VALUES;
  }

  return {
    serviceCode: category.service_code,
    serviceName: category.service_name,
    serviceGroup: category.service_group,
    description: category.description,
    defaultContractType: category.default_contract_type,
    milestoneRecommended: category.milestone_recommended,
    acceptanceTestingRequired: category.acceptance_testing_required,
    deliverySpecRequired: category.delivery_spec_required,
    ipTransferExpected: category.ip_transfer_expected,
    backgroundIpExpected: category.background_ip_expected,
    openSourceRisk: category.open_source_risk,
    thirdPartyMaterialRisk: category.third_party_material_risk,
    moralRightsSensitive: category.moral_rights_sensitive,
    ndaRecommended: category.nda_recommended,
    dpaRequiredByDefault: category.dpa_required_by_default,
    personalDataProcessingLikely: category.personal_data_processing_likely,
    securityClauseRequired: category.security_clause_required,
    warrantyPeriodDays:
      category.warranty_period_days !== null ? String(category.warranty_period_days) : "",
    bugFixPeriodDays:
      category.bug_fix_period_days !== null ? String(category.bug_fix_period_days) : "",
    serviceLevelsRequired: category.service_levels_required,
    professionalStandardsClauseRequired:
      category.professional_standards_clause_required,
    regulatedActivityRisk: category.regulated_activity_risk,
    exportControlRisk: category.export_control_risk,
    defaultAcceptanceRule: category.default_acceptance_rule,
    defaultDeliveryDefinition: category.default_delivery_definition,
    internalLegalNote: category.internal_legal_note,
    isActive: category.is_active,
    sortOrder: String(category.sort_order),
    version: category.version !== null ? String(category.version) : "1",
  };
}

export function buildLegalServiceCategoryPayload(
  values: LegalServiceCategoryEditorValues
): AdminServiceCategoryPayload {
  return {
    service_code: values.serviceCode.trim(),
    service_name: values.serviceName.trim(),
    service_group: values.serviceGroup.trim(),
    description: values.description,
    default_contract_type: values.defaultContractType,
    milestone_recommended: values.milestoneRecommended,
    acceptance_testing_required: values.acceptanceTestingRequired,
    delivery_spec_required: values.deliverySpecRequired,
    ip_transfer_expected: values.ipTransferExpected,
    background_ip_expected: values.backgroundIpExpected,
    open_source_risk: values.openSourceRisk,
    third_party_material_risk: values.thirdPartyMaterialRisk,
    moral_rights_sensitive: values.moralRightsSensitive,
    nda_recommended: values.ndaRecommended,
    dpa_required_by_default: values.dpaRequiredByDefault,
    personal_data_processing_likely: values.personalDataProcessingLikely,
    security_clause_required: values.securityClauseRequired,
    warranty_period_days: toOptionalInteger(values.warrantyPeriodDays),
    bug_fix_period_days: toOptionalInteger(values.bugFixPeriodDays),
    service_levels_required: values.serviceLevelsRequired,
    professional_standards_clause_required:
      values.professionalStandardsClauseRequired,
    regulated_activity_risk: values.regulatedActivityRisk,
    export_control_risk: values.exportControlRisk,
    default_acceptance_rule: values.defaultAcceptanceRule,
    default_delivery_definition: values.defaultDeliveryDefinition,
    internal_legal_note: values.internalLegalNote,
    is_active: values.isActive,
    sort_order: toOptionalInteger(values.sortOrder) ?? 0,
    version: toOptionalInteger(values.version) ?? 1,
  };
}
