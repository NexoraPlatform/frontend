'use client';

import * as React from 'react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { MuiIcon } from './MuiIcons';

type IconResult = { id: string; prefix: string; name: string };

// Dacă vrei un fallback local, poți lăsa ceva aici, dar nu e obligatoriu.
// const DEFAULT_COLLECTIONS = ['material-symbols', 'mdi', 'lucide'] as const;

function useDebounced<T>(v: T, delay = 300) {
    const [val, setVal] = useState(v);
    useEffect(() => {
        const t = setTimeout(() => setVal(v), delay);
        return () => clearTimeout(t);
    }, [v, delay]);
    return val;
}

interface IconSearchDropdownProps {
    value?: string;
    onChangeAction: (id: string) => void;
    /** `'*' | undefined | null | []` => toate colecțiile; altfel, listează explicit colecțiile */
    collections?: string[] | '*' | null;
    placeholder?: string;
    limit?: number;
}

export function IconSearchDropdown({
                                       value,
                                       onChangeAction,
                                       // implicit: toate colecțiile
                                       collections = '*',
                                       placeholder = 'Caută icon...',
                                       limit = 50,
                                   }: IconSearchDropdownProps) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState(value);
    const dq = useDebounced(q, 250);

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<IconResult[]>([]);
    const [hi, setHi] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    // cheie stabilă pt deps + semantica "toate colecțiile"
    const collectionsKey = useMemo(() => {
        if (collections === '*' || collections == null) return '';
        if (Array.isArray(collections) && collections.length === 0) return '';
        if (Array.isArray(collections)) return collections.join(',');
        return '';
    }, [collections]);

    useEffect(() => {
        let alive = true;

        (async () => {
            if (!dq?.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const qs = new URLSearchParams();
                qs.set('q', dq);
                qs.set('limit', String(limit));
                // doar dacă ai whitelist explicit → trimite param; altfel lasă backend-ul să caute în toate
                if (collectionsKey) qs.set('collections', collectionsKey);

                const url = `http://127.0.0.1:8000/api/general/search/icons?${qs.toString()}`;
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
                    onChange={(e) => {
                        setQ(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(e) => {
                        if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
                            setOpen(true);
                            return;
                        }
                        if (!open) return;
                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setHi((x) => Math.min(x + 1, results.length - 1));
                        }
                        if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setHi((x) => Math.max(x - 1, 0));
                        }
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const pick = results[hi];
                            if (pick) {
                                onChangeAction(pick.id);
                                setOpen(false);
                            }
                        }
                        if (e.key === 'Escape') {
                            setOpen(false);
                        }
                    }}
                />

            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                    <div className="max-h-72 overflow-auto bg-white">
                        {loading && <div className="p-3 text-sm text-muted-foreground">Caut...</div>}
                        {!loading && results.length === 0 && <div className="p-3 text-sm text-muted-foreground">Nimic găsit</div>}
                        {!loading &&
                            results.map((r, idx) => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => {
                                        onChangeAction(r.id);
                                        setOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-muted ${
                                        idx === hi ? 'bg-muted' : ''
                                    }`}
                                >
                                    <MuiIcon icon={r.id} size={20} />
                                    <div className="flex flex-col">
                                        <span className="text-sm">{r.id}</span>
                                        <span className="text-xs text-muted-foreground">
                      {r.prefix} / {r.name}
                    </span>
                                    </div>
                                </button>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
