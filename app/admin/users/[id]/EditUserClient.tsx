"use client";

import {useEffect, useState} from "react";
import apiClient from "@/lib/api";
import AdminCard from "@/app/admin/users/[id]/AdminCard";
import ClientCard from "@/app/admin/users/[id]/ClientCard";
import ProviderCard from "@/app/admin/users/[id]/ProviderCard";

export default function EditUserClient({ id }: { id: number; }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'CLIENT',
        phone: ''
    });

    useEffect(() => {
        const getUser = async () => {
            try {
                const response = await apiClient.getUserById(id);
                setFormData(response);
            } catch (error: any) {
                alert("Error fetching user data: " + error.message);
            }
        }
        getUser();
    }, [id]);
    const userRole = formData.role;
    console.log("User Role:", userRole);
    return (
        <>
            {userRole === 'ADMIN' ? (
                <AdminCard user={formData} />
            ) : userRole === 'PROVIDER' ? (
                <ProviderCard user={formData} />
            ) : userRole === 'CLIENT' ? (
                <ClientCard user={formData} />
            ) : ''}
        </>
    );
}
