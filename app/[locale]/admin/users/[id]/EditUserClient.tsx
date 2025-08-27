"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import AdminCard from "./AdminCard";
import ClientCard from "./ClientCard";
import ProviderCard from "./ProviderCard";
import {AnyFormData} from "@/types/user-forms";
import {useAuth} from "@/contexts/auth-context";

export default function EditUserClient({ id }: { id: number }) {
    const { user } = useAuth();
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

    if (!!user?.is_superuser) {
        if (Number(user?.id) !== 1 && Number(id) === 1) return <div>Nu poți edita utilizatorul acest utilizator.</div>;
    }

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
