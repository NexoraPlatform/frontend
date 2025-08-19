"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import AdminCard from "@/app/admin/users/[id]/AdminCard";
import ClientCard from "@/app/admin/users/[id]/ClientCard";
import ProviderCard from "@/app/admin/users/[id]/ProviderCard";
import {AnyFormData} from "@/types/user-forms";

export default function EditUserClient({ id }: { id: number }) {
    const [formData, setFormData] = useState<AnyFormData>({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirm_password: "",
        role: "CLIENT",
        phone: "",
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
                alert("Error fetching user data: " + error.message);
            }
        };

        const getPermissions = async () => {
            try {
                const response = await apiClient.getPermissions();
                setPermissions(response);
            } catch (error: any) {
                alert("Error fetching permissions: " + error.message);
            }
        };

        getUser();
        getPermissions();
    }, [id]);

    // This is the only place that calls your update endpoint
    const submitAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (formData.password && formData.password.length > 0) {
            if (formData.password !== formData.confirm_password) {
                setError("Parolele nu coincid.");
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
                setError("Parolele nu coincid.");
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
            setError(e?.message ?? "Eroare la salvare.");
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
