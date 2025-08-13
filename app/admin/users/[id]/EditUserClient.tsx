"use client";

import {useEffect, useState} from "react";
import apiClient from "@/lib/api";

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
            const response = await apiClient.getUserById(id);
        }

        getUser();
    }, [id]);

    return (<></>);
}
