export const getLocalizedAdminValue = (value: unknown, locale: string) => {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record[locale] ?? record.en ?? record.ro ?? "");
  }

  return "";
};
