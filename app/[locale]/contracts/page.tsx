'use client';
import { useState } from 'react';

type ContractClause = {
    title: string;
    text: string;
    logic_source?: string;
};

type ContractResponse = {
    meta?: {
        client_jurisdiction?: string;
        freelancer_jurisdiction?: string;
    };
    clauses?: ContractClause[];
};

export default function ContractGenerator() {
    const [formData, setFormData] = useState({
        client_country: 'US', // Default SUA
        freelancer_country: 'RO', // Default România
        project_data: {
            client_name: 'Tech Corp LLC',
            freelancer_name: 'Ion Popescu',
            fee: '5000 EUR'
        }
    });

    const [contract, setContract] = useState<ContractResponse | null>(null);

    const handleGenerate = async () => {
        const res = await fetch('http://localhost:8000/api/contract/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        setContract(data);
    };

    return (
        <div className="p-10 max-w-4xl mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-blue-900">Trustora Global Engine</h1>

            {/* Zona de Configurare */}
            <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded shadow mb-8">
                <div>
                    <label className="block text-sm font-bold mb-2">Client Country</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={formData.client_country}
                        onChange={(e) => setFormData({...formData, client_country: e.target.value})}
                    >
                        <option value="US">USA (Common Law)</option>
                        <option value="UK">UK (Common Law)</option>
                        <option value="DE">Germany (Civil Law)</option>
                        <option value="RO">Romania (Civil Law)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2">Freelancer Country</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={formData.freelancer_country}
                        onChange={(e) => setFormData({...formData, freelancer_country: e.target.value})}
                    >
                        <option value="RO">Romania</option>
                        <option value="DE">Germany</option>
                        <option value="US">USA</option>
                    </select>
                </div>
            </div>

            <button
                onClick={handleGenerate}
                className="bg-blue-600 text-white px-6 py-3 rounded font-bold hover:bg-blue-700 transition w-full mb-8"
            >
                Generare Contract &#34;Legal Wrapper&#34;
            </button>

            {/* Zona de Previzualizare */}
            {contract && (
                <div className="bg-white p-8 border border-gray-300 shadow-lg">
                    <div className="text-xs text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">
                        System Logic: {contract?.meta?.client_jurisdiction} → {contract?.meta?.freelancer_jurisdiction}
                    </div>

                    {contract?.clauses?.map((clause: any, idx: any) => (
                        <div key={idx} className="mb-6">
                            <h3 className="font-bold text-gray-700 text-sm mb-1">{clause.title}</h3>
                            <p className="text-gray-800 leading-relaxed bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                                {clause.text}
                            </p>
                            <span className="text-xs text-green-600 font-mono">
                [Engine Logic: {clause.logic_source}]
              </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
