'use client';

import * as React from 'react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { MuiIcon } from './MuiIcons';

type IconResult = { id: string; prefix: string; name: string };

// ✅ const extern – NU crea array nou în fiecare render
const DEFAULT_COLLECTIONS = ['material-symbols', 'mdi', 'lucide'] as const;

function useDebounced<T>(v: T, delay = 300) {
    const [val, setVal] = useState(v);
    useEffect(() => {
        const t = setTimeout(() => setVal(v), delay);
        return () => clearTimeout(t);
    }, [v, delay]);
    return val;
}

export function IconSearchDropdown({
                                       value,
                                       onChange,
                                       collections = DEFAULT_COLLECTIONS as unknown as string[], // păstrează stabil
                                       placeholder = 'Caută icon...',
                                       limit = 50,
                                   }: {
    value?: string;
    onChange: (id: string) => void;
    collections?: string[]; // dacă părintele pasează inline, vezi nota de mai jos
    placeholder?: string;
    limit?: number;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const dq = useDebounced(q, 250);

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<IconResult[]>([]);
    const [hi, setHi] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    // ✅ cheie stabilă pentru deps
    const collectionsKey = useMemo(() => collections.join(','), [collections]);

    useEffect(() => {
        let alive = true;
        (async () => {
            if (!dq.trim()) {
                setResults([]); // ok, efectul NU va rerula fiindcă deps rămân aceleași
                return;
            }
            setLoading(true);
            try {
                const url = `http://127.0.0.1:8000/api/general/search/icons?q=${encodeURIComponent(dq)}&collections=${encodeURIComponent(collectionsKey)}&limit=${limit}`;
                const res = await fetch(url);
                const data = await res.json();
                if (!alive) return;
                setResults(Array.isArray(data.results) ? data.results : []);
                setHi(0);
            } catch {
                if (alive) setResults([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
        // ✅ depinde de stringul stabil, nu de array
    }, [dq, collectionsKey, limit]);

    // click în afara dropdown-ului -> închide
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler, { passive: true });
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative w-full max-w-md" ref={ref}>
            <div className="flex items-center gap-2 rounded border px-3 py-2 bg-background">
                {value ? <MuiIcon icon={value} size={20} /> : <span className="text-sm text-muted-foreground">🔎</span>}
                <input
                    className="w-full bg-transparent outline-none text-sm"
                    value={q}
                    placeholder={placeholder}
                    onChange={(e) => { setQ(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(e) => {
                        if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { setOpen(true); return; }
                        if (!open) return;
                        if (e.key === 'ArrowDown') { e.preventDefault(); setHi((x) => Math.min(x + 1, results.length - 1)); }
                        if (e.key === 'ArrowUp')   { e.preventDefault(); setHi((x) => Math.max(x - 1, 0)); }
                        if (e.key === 'Enter')     { e.preventDefault(); const pick = results[hi]; if (pick) { onChange(pick.id); setOpen(false); } }
                        if (e.key === 'Escape')    { setOpen(false); }
                    }}
                />
                {value && (
                    <span className="text-xs text-muted-foreground truncate max-w-[40%]" title={value}>
            {value}
          </span>
                )}
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                    <div className="max-h-72 overflow-auto bg-white">
                        {loading && <div className="p-3 text-sm text-muted-foreground">Caut...</div>}
                        {!loading && results.length === 0 && <div className="p-3 text-sm text-muted-foreground">Nimic găsit</div>}
                        {!loading && results.map((r, idx) => (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => { onChange(r.id); setOpen(false); }}
                                className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-muted ${idx === hi ? 'bg-muted' : ''}`}
                            >
                                <MuiIcon icon={r.id} size={20} />
                                <div className="flex flex-col">
                                    <span className="text-sm">{r.id}</span>
                                    <span className="text-xs text-muted-foreground">{r.prefix} / {r.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
