"use client";

import { useState } from "react";
import {
  AlertCircle,
  Loader2,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { AdminOverviewItem, AdminSidebarCard } from "@/components/admin/admin-sidebar-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
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
import apiClient from "@/lib/api";
import { Link, useRouter } from "@/lib/navigation";

export default function NewUserPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "CLIENT",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const t = useTranslations();

  const addTitle = t("admin.users.new.title");
  const addSubtitle = t("admin.users.new.subtitle");
  const infoTitle = t("admin.users.new.info_title");
  const infoDescription = t("admin.users.new.info_description");
  const errorOccurred = t("admin.users.new.error_occurred");
  const firstNameLabel = t("admin.users.new.first_name_label");
  const lastNameLabel = t("admin.users.new.last_name_label");
  const emailLabel = t("admin.users.new.email_label");
  const passwordLabel = t("admin.users.new.password_label");
  const passwordHint = t("admin.users.new.password_hint");
  const roleLabel = t("admin.users.new.role_label");
  const phoneLabel = t("admin.users.new.phone_label");
  const phonePlaceholder = t("admin.users.new.phone_placeholder");
  const creatingLabel = t("admin.users.new.creating");
  const createUserLabel = t("admin.users.new.create_user");
  const cancelLabel = t("admin.users.new.cancel");
  const roleClient = t("admin.users.new.roles.CLIENT");
  const roleProvider = t("admin.users.new.roles.PROVIDER");
  const roleAdmin = t("admin.users.new.roles.ADMIN");

  const roleOptions = [
    { value: "CLIENT", label: roleClient },
    { value: "PROVIDER", label: roleProvider },
    { value: "ADMIN", label: roleAdmin },
  ];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiClient.createUser(formData);
      router.push("/admin/users");
    } catch (nextError: any) {
      setError(nextError.message || errorOccurred);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={addTitle}
          description={addSubtitle}
          backHref="/admin/users"
        />

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <AdminSectionCard
            delay={0.15}
            title={infoTitle}
            description={infoDescription}
          >
            {error ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{firstNameLabel}</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(event) => setFormData({ ...formData, firstName: event.target.value })}
                    required
                    className="border-border bg-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">{lastNameLabel}</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(event) => setFormData({ ...formData, lastName: event.target.value })}
                    required
                    className="border-border bg-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{emailLabel}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  required
                  className="border-border bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{passwordLabel}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                  required
                  minLength={6}
                  className="border-border bg-transparent"
                />
                <p className="text-sm text-muted-foreground">{passwordHint}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">{roleLabel}</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger id="role" className="border-border bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLIENT">{roleClient}</SelectItem>
                      <SelectItem value="PROVIDER">{roleProvider}</SelectItem>
                      <SelectItem value="ADMIN">{roleAdmin}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{phoneLabel}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                    placeholder={phonePlaceholder}
                    className="border-border bg-transparent"
                  />
                </div>
              </div>
            </div>
          </AdminSectionCard>

          <div className="space-y-6">
            <AdminSidebarCard
              delay={0.25}
              icon={UserPlus}
              title={t("admin.users.new.overview.title")}
              description={t("admin.users.new.overview.description")}
            >
              <div className="space-y-4">
                <AdminOverviewItem
                  label={t("admin.users.new.overview.role")}
                  value={roleOptions.find((option) => option.value === formData.role)?.label ?? formData.role}
                  valueClassName="mt-2 text-sm font-medium"
                />
                <AdminOverviewItem
                  label={t("admin.users.new.overview.email")}
                  value={formData.email || t("admin.users.new.overview.empty")}
                />
                <AdminOverviewItem
                  label={t("admin.users.new.overview.phone")}
                  value={formData.phone || t("admin.users.new.overview.empty")}
                />
              </div>
            </AdminSidebarCard>

            <AdminSidebarCard
              delay={0.35}
              icon={ShieldCheck}
              title={t("admin.users.new.actions.title")}
              description={t("admin.users.new.actions.description")}
            >
              <div className="space-y-3">
                <Button type="submit" disabled={loading} className="w-full bg-primary text-white hover:bg-primary/90">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {creatingLabel}
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {createUserLabel}
                    </>
                  )}
                </Button>

                <Link href="/admin/users" className="block">
                  <Button type="button" variant="outline" className="w-full border-border bg-transparent">
                    {cancelLabel}
                  </Button>
                </Link>
              </div>
            </AdminSidebarCard>
          </div>
        </form>
      </div>
    </ProjectAdminShell>
  );
}
