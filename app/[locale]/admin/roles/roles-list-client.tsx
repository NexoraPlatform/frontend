"use client";

import { useEffect, useMemo, useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, Loader2, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import {
  AdminTableEmptyRow,
  AdminTableLoadingRow,
} from "@/components/admin/admin-state";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Link, useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import {
  extractAdminRoles,
  getPermissionCountForRole,
  type AdminRoleRow,
} from "@/lib/admin-roles";

function SortableRoleRow({
  role,
  onEdit,
  onDelete,
}: {
  role: AdminRoleRow;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const t = useTranslations();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: role.id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b border-border/70 transition-colors hover:bg-secondary/20",
        isDragging && "bg-primary/5"
      )}
    >
      <td className="px-4 py-4 align-top">
        <button
          aria-label={t("admin.roles.reorder_aria")}
          className="cursor-grab text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-4 py-4 align-top">
        <div className="min-w-[220px] space-y-1">
          <p className="font-medium text-foreground">{role.name}</p>
          {role.description ? (
            <p className="text-sm text-muted-foreground">{role.description}</p>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-4 align-top">
        <code className="rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground">
          /{role.slug}
        </code>
      </td>
      <td className="px-4 py-4 align-top text-sm text-muted-foreground">
        #{role.sortOrder ?? "—"}
      </td>
      <td className="px-4 py-4 align-top text-sm text-muted-foreground">
        {getPermissionCountForRole(role)}
      </td>
      <td className="px-4 py-4 align-top">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(role.id)}
            aria-label={t("admin.roles.edit")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(role.id)}
            aria-label={t("admin.roles.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function RolesListClient() {
  const t = useTranslations();
  const router = useRouter();
  const [roles, setRoles] = useState<AdminRoleRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const totalPages = useMemo(() => {
    if (!total || total <= 0) return 1;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [pageSize, total]);

  const baseIndex = useMemo(() => (page - 1) * pageSize, [page, pageSize]);
  const roleCount = total ?? roles.length;
  const listDescription =
    roleCount === 1
      ? t("admin.roles.list_description_one")
      : t("admin.roles.list_description_other", { count: roleCount });

  async function load(nextSearch = search, nextPage = page, nextPageSize = pageSize) {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.getRoles({
        search: nextSearch || undefined,
        page: nextPage,
        pageSize: nextPageSize,
      } as any);
      const { items, total } = extractAdminRoles(data as any);

      const withOrder = items.map((role, index) => ({
        ...role,
        sortOrder: role.sortOrder ?? (nextPage - 1) * nextPageSize + index + 1,
      }));

      setRoles(withOrder);
      setTotal(total);
    } catch (fetchError) {
      console.error("Failed to load roles", fetchError);
      setRoles([]);
      setTotal(0);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : t("admin.roles.error_occurred")
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  async function saveSortOrder(nextRoles: AdminRoleRow[]) {
    setSavingOrder(true);

    try {
      await Promise.all(
        nextRoles.map((role, index) =>
          apiClient.updateRoleSortOrder(role.id, baseIndex + index + 1)
        )
      );
    } catch (saveError) {
      console.error("Failed to save role order", saveError);
    } finally {
      setSavingOrder(false);
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = roles.findIndex((role) => role.id === active.id);
    const newIndex = roles.findIndex((role) => role.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(roles, oldIndex, newIndex).map((role, index) => ({
      ...role,
      sortOrder: baseIndex + index + 1,
    }));

    setRoles(reordered);
    void saveSortOrder(reordered);
  }

  const handleDelete = async (roleId: number) => {
    if (!window.confirm(t("admin.roles.confirm_delete"))) {
      return;
    }

    try {
      await apiClient.deleteRole(roleId);
      await load();
    } catch (deleteError) {
      console.error("Failed to delete role", deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : t("admin.roles.error_occurred")
      );
    }
  };

  return (
    <AdminSectionCard
      delay={0.18}
      title={t("admin.roles.list_title")}
      description={listDescription}
      action={
        savingOrder ? (
          <span className="inline-flex items-center text-xs text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("admin.roles.saving_order")}
          </span>
        ) : null
      }
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
        <AdminSearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("admin.roles.search_placeholder")}
        />
        <Button
          onClick={() => {
            setPage(1);
            void load(search, 1, pageSize);
          }}
        >
          {t("admin.roles.search_button")}
        </Button>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">
            {t("admin.roles.error_prefix")}
            {error}
          </p>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={roles.map((role) => role.id)}
            strategy={verticalListSortingStrategy}
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-[56px] px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.roles.table.reorder")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.roles.table.role")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.roles.table.slug")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.roles.table.order")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.roles.table.permissions")}
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-medium text-muted-foreground">
                    {t("admin.roles.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? <AdminTableLoadingRow colSpan={6} /> : null}

                {!loading &&
                  roles.map((role) => (
                    <SortableRoleRow
                      key={role.id}
                      role={role}
                      onEdit={(roleId) => router.push(`/admin/roles/${roleId}`)}
                      onDelete={handleDelete}
                    />
                  ))}

                {!loading && roles.length === 0 ? (
                  <AdminTableEmptyRow
                    colSpan={6}
                    icon={GripVertical}
                    title={t("admin.roles.no_roles_title")}
                    description={t("admin.roles.no_roles_description")}
                    action={
                      <Link href="/admin/roles/new">
                        <Button>{t("admin.roles.add_role")}</Button>
                      </Link>
                    }
                  />
                ) : null}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {t("admin.roles.pagination.page")} {page} {t("admin.roles.pagination.of")}{" "}
          {totalPages}
          {total != null
            ? ` (${t("admin.roles.pagination.total", { count: total })})`
            : ""}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="h-9 rounded-md border border-border/60 bg-background/80 px-2 text-sm text-foreground shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60"
            value={pageSize}
            onChange={(event) => {
              setPage(1);
              setPageSize(Number(event.target.value));
            }}
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">
            {t("admin.roles.pagination.per_page")}
          </span>

          <Pagination className="justify-start sm:justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (page > 1 && !loading) {
                      setPage((currentPage) => currentPage - 1);
                    }
                  }}
                  className={page <= 1 || loading ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (page < totalPages && !loading) {
                      setPage((currentPage) => currentPage + 1);
                    }
                  }}
                  className={
                    page >= totalPages || loading ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </AdminSectionCard>
  );
}
