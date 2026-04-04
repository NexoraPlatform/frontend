"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { AdminRolePermissionGroup } from "@/lib/admin-roles";

type RolePermissionsSelectorProps = {
  groups: AdminRolePermissionGroup[];
  selectedPermissionIds: number[];
  onTogglePermission: (permissionId: number, checked: boolean) => void;
};

export function RolePermissionsSelector({
  groups,
  selectedPermissionIds,
  onTogglePermission,
}: RolePermissionsSelectorProps) {
  return (
    <Accordion type="multiple" className="w-full">
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <AccordionItem
            key={group.id}
            value={group.slug}
            className="rounded-2xl border border-border/60 bg-background/70 p-2 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60"
          >
            <AccordionTrigger className="text-base font-semibold">
              {group.name}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pl-2">
                {group.permissions.map((permission) => {
                  const checked = selectedPermissionIds.includes(permission.id);

                  return (
                    <Label key={permission.id}>
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{permission.name}</p>
                          {permission.description ? (
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          ) : null}
                        </div>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            onTogglePermission(permission.id, Boolean(value))
                          }
                        />
                      </div>
                    </Label>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </div>
    </Accordion>
  );
}
