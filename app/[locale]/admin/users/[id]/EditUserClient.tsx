"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import AdminCard from "./AdminCard";
import ClientCard from "./ClientCard";
import ProviderCard from "./ProviderCard";
import {AnyFormData} from "@/types/user-forms";
import {useAuth} from "@/contexts/auth-context";
import { usePathname } from 'next/navigation';
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import { Locale } from '@/types/locale';

export default function EditUserClient({ id }: { id: number }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const locale = (pathname.split('/')[1] as Locale) || 'ro';
    const cannotEdit = useAsyncTranslation(locale, 'admin.users.edit.cannot_edit');
    const passwordsNotMatch = useAsyncTranslation(locale, 'admin.users.edit.passwords_not_match');
    const errorSaving = useAsyncTranslation(locale, 'admin.users.edit.error_saving');
    const fetchUserErrorPrefix = useAsyncTranslation(locale, 'admin.users.edit.fetch_user_error');
    const fetchPermErrorPrefix = useAsyncTranslation(locale, 'admin.users.edit.fetch_permissions_error');
    const [formData, setFormData] = useState<AnyFormData>({
        avatar: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirm_password: "",
        role: "CLIENT",
        phone: "",
        is_superuser: false,
        testVerified: false,
        callVerified: false,
        stripe_account_id: "",
        location: "",
    } as AnyFormData);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");


    useEffect(() => {
        const getUser = async () => {
            try {
                const response = await apiClient.getUserById(id);
                setFormData(response);
            } catch (error: any) {
                alert(fetchUserErrorPrefix + error.message);
            }
        };

        const getPermissions = async () => {
            try {
                const response = await apiClient.getPermissions();
                setPermissions(response);
            } catch (error: any) {
                alert(fetchPermErrorPrefix + error.message);
            }
        };

        getUser();
        getPermissions();
    }, [id]);

    if (!!user?.is_superuser) {
        if (Number(user?.id) !== 1 && Number(id) === 1) return <div>{cannotEdit}</div>;
    }

    const submitAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (formData.password && formData.password.length > 0) {
            if (formData.password !== formData.confirm_password) {
                setError(passwordsNotMatch);
                setLoading(false);
                return;
            }
        }

        switch (formData.role) {
            case "ADMIN": {
                break;
            }
            case "PROVIDER": {
                break;
            }
            case "CLIENT": {
                break;
            }
        }

        try {
            // Build payload. Omit password if empty to avoid resetting unintentionally.
            const { firstName, lastName, email, phone, role, password, confirm_password } = formData;

            if (password && password.length > 0 && password !== confirm_password) {
                setError(passwordsNotMatch);
                setLoading(false);
                return;
            }

            const payload: any = { firstName, lastName, email, phone, role };
            if (password && password.length > 0) {
                payload.password = password;
            }

            // Example: PATCH /admin/users/:id
            await apiClient.updateUser(id, payload);

            // Optional: clear password fields locally after success
            setFormData((prev: any) => ({ ...prev, password: "", confirm_password: "" }));
        } catch (e: any) {
            setError(e?.message ?? errorSaving);
        } finally {
            setLoading(false);
        }
    };

    const userRole = formData.role;

    return (
        <>
            {userRole === "ADMIN" ? (
                <AdminCard
                    formData={formData}
                    setFormDataAction={setFormData}
                    permissions={permissions}
                    submitAction={submitAction}
                    loading={loading}
                    error={error}
                />
            ) : userRole === "PROVIDER" ? (
                <ProviderCard
                    formData={formData}
                    setFormDataAction={setFormData}
                    permissions={permissions}
                    submitAction={submitAction}
                    loading={loading}
                    error={error}
                />
            ) : userRole === "CLIENT" ? (
                <ClientCard
                    formData={formData}
                    setFormDataAction={setFormData}
                    permissions={permissions}
                    submitAction={submitAction}
                    loading={loading}
                    error={error}
                />
            ) : (
                ""
            )}
        </>
    );
}
