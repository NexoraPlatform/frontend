"use client";

import Link from "next/link";
import {Button} from "@/components/ui/button";
import {ArrowLeft, IdCardLanyard, Loader2} from "lucide-react";
import {CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import React, {useEffect, useState} from "react";
import {Card, CardContent} from "@mui/material";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import apiClient from "@/lib/api";
import {useRouter} from "next/navigation";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"

type Role = {
    name: string;
    description: string;
    permissions: number[];
}

type Permissions = {
    id: number;
    name: string;
    slug: string;
    description: string;
    is_active: number;
    permission_group_id: number;
}

type GroupPermissions = {
    id: number;
    name: string;
    slug: string;
    permissions: Permissions[];
}

export default function EditRoleClient({ id }: { id: number;}) {
    const [ roleData, setRoleData ] = useState<Role>({
        name: '',
        description: '',
        permissions: [],
    });
    const [error, setError] = useState<string | boolean>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [permissionGroups, setPermissionGroups] = useState<GroupPermissions[]>([]);
    const router = useRouter();

    useEffect(() => {
        const getRole = async () => {
            const response = await apiClient.getRole(id);

            const mappedRole: Role = {
                name: response.name,
                description: response.description ?? '',
                permissions: response.permissions.map((p: any) => p.id),
            };

            setRoleData(mappedRole);
        }

        getRole();
    }, [id]);

    useEffect(() => {
        const loadPermissions = async () => {
            try {
                const response = await apiClient.getPermisions();
                setPermissionGroups(response);
            } catch (err) {
                console.error('Failed to load permissions:', err);
            }
        };

        loadPermissions();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!roleData.name.trim() || !roleData.description.trim() || roleData.permissions.length === 0) {
            setError(true);
            setLoading(false);
            return;
        }

        try {
            const response = await apiClient.updateRole(id, roleData);

            if (!response.ok) {
                setError(true);
                return;
            }

            router.push('/admin/roles');
        } catch (error: any) {
            setError(error.message || 'A apărut o eroare');
        } finally {
            setLoading(false);
        }
    };

    return(
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-8">
                <Link href="/admin/roles">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Adaugă Rol Nou</h1>
                    <p className="text-muted-foreground">
                        Creează un rol nou
                    </p>
                </div>
            </div>

            <div className="w-full">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <IdCardLanyard className="w-5 h-5" />
                            <span>Informații Rol</span>
                        </CardTitle>
                        <CardDescription>
                            Completează informațiile pentru un nou rol
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="name" className={`${error && 'text-red-500'}`}>Nume Rol *</Label>
                                <Input
                                    id="name"
                                    value={roleData.name}
                                    onChange={(e) => {
                                        setRoleData((prev) => ({ ...prev, name: e.target.value }));
                                        setError('');
                                    }}
                                    placeholder="ex: Dezvoltare Web"
                                    className={`${error && 'border-red-500'}`}
                                />
                            </div>

                            <div>
                                <Label htmlFor="description" className={`${error && 'text-red-500'}`}>Descriere Rol *</Label>
                                <Input
                                    id="description"
                                    value={roleData.description}
                                    onChange={(e) => {
                                        setRoleData((prev) => ({ ...prev, description: e.target.value }));
                                        setError('');
                                    }}
                                    placeholder="ex: Dezvoltare Web"
                                    className={`${error && 'border-red-500'}`}
                                />
                            </div>

                            <Accordion type="multiple" className="w-full">
                                <div className={`grid grid-cols-1 ${permissionGroups.length > 1 ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-4`}>
                                    {permissionGroups.map((group) => (
                                        <AccordionItem key={group.id} value={group.slug} className="border rounded-md p-2">
                                            <AccordionTrigger className="text-md font-semibold">
                                                {group.name}
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-4 pl-2">
                                                    {group.permissions.map((perm) => {
                                                        const checked = roleData.permissions.includes(perm.id);
                                                        return (
                                                            <Label key={perm.id}>
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="space-y-1">
                                                                        <p className="text-sm font-medium">{perm.name}</p>
                                                                        {perm.description && (
                                                                            <p className="text-xs text-muted-foreground">{perm.description}</p>
                                                                        )}
                                                                    </div>
                                                                    <Checkbox
                                                                        checked={checked}
                                                                        onCheckedChange={(checked) => {
                                                                            setRoleData((prev) => {
                                                                                const updated = checked
                                                                                    ? [...prev.permissions, perm.id]
                                                                                    : prev.permissions.filter((id) => id !== perm.id);
                                                                                return { ...prev, permissions: updated };
                                                                            });
                                                                        }}
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


                            <div className="flex space-x-4 pt-6">
                                <Button type="submit" disabled={loading} className="flex-1">
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Se creează...
                                        </>
                                    ) : (
                                        <>
                                            <IdCardLanyard className="w-4 h-4 mr-2" />
                                            Creează Rolul
                                        </>
                                    )}
                                </Button>
                                <Link href="/admin/roles">
                                    <Button type="button" variant="outline">
                                        Anulează
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
