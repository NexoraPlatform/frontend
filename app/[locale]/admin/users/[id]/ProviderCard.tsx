import React from "react";

export default function ProviderCard({
                                         formData,
                                         setFormDataAction,
                                         permissions,
                                         submitAction,      // <- submit comes from parent
                                         loading = false,   // <- UI state from parent
                                         error = '',
                                     }: {
    formData: any;
    setFormDataAction: React.Dispatch<React.SetStateAction<any>>;
    permissions: any[];
    submitAction: (e: React.FormEvent) => Promise<void>;
    loading?: boolean;
    error?: string;
}) {
    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Admin Details</h2>
            <p><strong>ID:</strong> {formData.id}</p>
            <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
            <p><strong>Email:</strong> {formData.email}</p>
            <p><strong>Role:</strong> {formData.role}</p>
            <p><strong>Phone:</strong> {formData.phone}</p>
        </div>
    );
}
