"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input"; // Sau calea ta către input
import { Label } from "@/components/ui/label"; // Sau calea ta către label
import { CheckCircle2, XCircle, Building2, CreditCard } from "lucide-react";
import * as ibantools from "ibantools";
import { cn } from "@/lib/utils";

interface BankInputProps {
    value: string;
    onChange: (value: string, isValid: boolean) => void;
    error?: string;
    id: string;
    label?: string;
    placeholder?: string;
}

export function BankInput({
                              value,
                              onChange,
                              error,
                              id,
                              label = "IBAN Cont Bancar",
                              placeholder = "RO00 BTRL 0000 0000 0000 00XX",
                          }: BankInputProps) {
    const [displayValue, setDisplayValue] = useState<any>("");
    const [isValid, setIsValid] = useState<boolean | null>(null);

    // Sincronizare inițială sau externă
    useEffect(() => {
        if (value) {
            setDisplayValue(ibantools.friendlyFormatIBAN(value));
            setIsValid(ibantools.isValidIBAN(value));
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // 1. Curățăm inputul: eliminăm spațiile și caracterele non-alfanumerice
        let rawValue = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

        // 2. Limităm lungimea (IBAN max e 34, RO are 24)
        if (rawValue.length > 34) return;

        // 3. Validăm matematic IBAN-ul
        const valid = ibantools.isValidIBAN(rawValue);
        setIsValid(valid);

        // 4. Formatăm vizual (grupuri de 4)
        const formatted = ibantools.friendlyFormatIBAN(rawValue);
        setDisplayValue(formatted);

        // 5. Trimitem valoarea curată ("RO12BTRL...") părintelui
        onChange(rawValue, valid);
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={id || undefined} className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                {label}
            </Label>

            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <CreditCard className="w-4 h-4" />
                </div>

                <Input
                    id={id || undefined}
                    name={id || undefined}
                    value={displayValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    autoComplete={id || undefined}
                    className={cn(
                        "pl-10 pr-10 font-mono uppercase transition-colors",
                        isValid === true && "border-emerald-500 focus-visible:ring-emerald-500/20",
                        isValid === false && rawValueLength(displayValue) > 0 && "border-red-500 focus-visible:ring-red-500/20"
                    )}
                    maxLength={45} // Permite spații extra la tastare
                />

                {/* Indicator vizual de validare */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValid === true && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-in fade-in zoom-in" />
                    )}
                    {isValid === false && rawValueLength(displayValue) > 4 && (
                        <XCircle className="w-5 h-5 text-red-500 animate-in fade-in zoom-in" />
                    )}
                </div>
            </div>

            {/* Mesaj de eroare */}
            {(error || (isValid === false && rawValueLength(displayValue) > 15)) && (
                <p className="text-xs text-red-500 mt-1">
                    {error || "Codul IBAN introdus nu este valid."}
                </p>
            )}

            {/* Helper text pentru România */}
            {isValid === null && (
                <p className="text-xs text-slate-400">
                    Introduceți IBAN-ul complet al contului (ex: RO98....)
                </p>
            )}
        </div>
    );
}

// Helper simplu pentru a număra caracterele reale
function rawValueLength(val: string) {
    return val.replace(/[^A-Z0-9]/g, "").length;
}
