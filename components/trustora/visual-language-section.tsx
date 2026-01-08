export function TrustoraVisualLanguageSection() {
    return (
        <section className="py-24 px-6 bg-white overflow-hidden dark:bg-[#070C14]">
            <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-16 text-[#0B1C2D] dark:text-[#E6EDF3]">Stripe + Notary + Marketplace</h2>
                <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20">
                    <div className="w-48 h-48 glass-card flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 dark:bg-[#111B2D]">💰</div>
                        <span className="text-xs font-bold uppercase tracking-wider dark:text-[#E6EDF3]">Money</span>
                        <span className="text-[10px] text-slate-400 dark:text-[#6B7285]">Escrow Layer</span>
                    </div>
                    <div className="hidden md:block w-20 h-px bg-slate-200 dark:bg-[#1E2A3D]" />
                    <div className="w-48 h-48 glass-card border-2 border-[#1BC47D] flex flex-col items-center justify-center p-6 text-center shadow-lg shadow-emerald-100">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4 dark:bg-[rgba(27,196,125,0.1)]">📑</div>
                        <span className="text-xs font-bold uppercase tracking-wider dark:text-[#E6EDF3]">Contracts</span>
                        <span className="text-[10px] text-emerald-600 dark:text-[#1BC47D]">Digital Execution</span>
                    </div>
                    <div className="hidden md:block w-20 h-px bg-slate-200 dark:bg-[#1E2A3D]" />
                    <div className="w-48 h-48 glass-card flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 dark:bg-[#111B2D]">👤</div>
                        <span className="text-xs font-bold uppercase tracking-wider dark:text-[#E6EDF3]">Verification</span>
                        <span className="text-[10px] text-slate-400 dark:text-[#6B7285]">Identity Layer</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
