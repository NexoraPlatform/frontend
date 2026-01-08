export function TrustoraHeroSection() {
    return (
        <section className="pt-40 pb-24 px-6 bg-white dark:bg-[#070C14] overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[#0B1C2D] text-xs font-bold mb-8 dark:bg-[#111B2D] dark:border-[#1E2A3D] dark:text-[#E6EDF3]">
                    <span className="text-[#1BC47D]">●</span> DIGITAL TRUST INFRASTRUCTURE
                </div>
                <h1 className="text-5xl lg:text-7xl font-bold text-[#0B1C2D] tracking-tight mb-6 max-w-4xl dark:text-[#E6EDF3]">
                    Hire and get paid with <span className="text-[#1BC47D]">zero risk.</span>
                </h1>
                <p className="text-xl text-slate-500 mb-12 max-w-2xl dark:text-[#A3ADC2]">
                    Verified professionals. Protected payments. Enforced delivery. <br className="hidden md:block" />
                    The secure layer for global online work.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-20">
                    <button className="px-8 py-4 btn-primary font-bold rounded-lg text-lg">Start a protected project</button>
                    <button className="px-8 py-4 bg-white border border-slate-200 text-[#0B1C2D] font-bold rounded-lg text-lg hover:bg-slate-50 dark:bg-transparent dark:border-[#1BC47D] dark:text-[#1BC47D] dark:hover:bg-[rgba(27,196,125,0.1)]">
                        Contact Sales
                    </button>
                </div>

                <div className="w-full max-w-5xl glass-card overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex items-center justify-between">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                        </div>
                        <div className="text-[10px] font-bold mono text-slate-400 uppercase tracking-widest dark:text-[#6B7285]">
                            Trustora Engine v2.4 — Escrow Secured
                        </div>
                        <div />
                    </div>
                    <div className="p-8 grid md:grid-cols-3 gap-8 text-left">
                        <div className="space-y-6">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest dark:text-[#6B7285]">Active Contracts</div>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 dark:bg-[#0B1220] dark:border-[#1E2A3D]">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold dark:text-[#E6EDF3]">API Integration</span>
                                    <span className="mono text-[#1BC47D] text-sm">€ 2.450,00</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#1BC47D]" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase dark:text-[#6B7285]">Funds Locked</span>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 dark:text-[#6B7285]">Milestone Execution</div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-white dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center dark:bg-[rgba(27,196,125,0.1)]">
                                            <svg className="w-4 h-4 text-[#1BC47D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path d="M5 13l4 4L19 7" strokeWidth="3" />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium dark:text-[#E6EDF3]">Architecture Design</span>
                                    </div>
                                    <span className="mono text-xs text-[#21D19F] font-bold">RELEASED</span>
                                </div>
                                <div className="flex items-center justify-between p-4 border-2 border-[#1BC47D]/20 rounded-lg bg-emerald-50/20 dark:border-[#1BC47D]/30 dark:bg-[rgba(27,196,125,0.08)]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded bg-[#1BC47D] flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                    strokeWidth="2"
                                                />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-bold dark:text-[#E6EDF3]">Core Module Delivery</span>
                                    </div>
                                    <span className="mono text-xs text-[#0B1C2D] font-bold tracking-tighter dark:text-[#E6EDF3]">IN ESCROW</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
