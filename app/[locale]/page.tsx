import { Locale } from "@/types/locale";

export const revalidate = 86400; // 24h

interface HomePageProps {
    params: Promise<{ locale: Locale }>;
}

export default async function Home(props: HomePageProps) {
    const { locale } = await props.params;
    void locale;

    return (
        <div className="bg-white text-[#0F172A]">
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                        :root {
                            --midnight-blue: #0B1C2D;
                            --emerald-green: #1BC47D;
                            --success-green: #21D19F;
                            --warning-amber: #F5A623;
                            --error-red: #E5484D;
                            --bg-light: #F5F7FA;
                            --text-near-black: #0F172A;
                        }
                        body {
                            font-family: 'Inter', sans-serif;
                            background-color: white;
                            color: var(--text-near-black);
                            scroll-behavior: smooth;
                        }
                        .mono { font-family: 'JetBrains Mono', monospace; }
                        .btn-primary {
                            background-color: var(--emerald-green);
                            color: white;
                            transition: all 0.2s ease;
                        }
                        .btn-primary:hover {
                            filter: brightness(1.05);
                            box-shadow: 0 0 0 4px rgba(27, 196, 125, 0.15);
                        }
                        .glass-card {
                            background: white;
                            border: 1px solid rgba(11, 28, 45, 0.08);
                            border-radius: 12px;
                        }
                        .section-divider {
                            border-bottom: 1px solid rgba(11, 28, 45, 0.05);
                        }
                        .pillar-icon {
                            stroke-width: 1.5px;
                            color: var(--emerald-green);
                        }
                    `,
                }}
            />
            <nav className="fixed w-full z-50 bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0B1C2D] flex items-center justify-center rounded-md">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#1BC47D]" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 4h16v3H4zM10 7h4v13h-4z" />
                                <rect x="10" y="7" width="4" height="4" fill="#21D19F" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-[#0B1C2D]">TRUSTORA</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
                        <a href="#pillars" className="hover:text-[#1BC47D]">
                            Piloni
                        </a>
                        <a href="#how" className="hover:text-[#1BC47D]">
                            Infrastructură
                        </a>
                        <a href="#" className="px-4 py-2 rounded-md bg-[#0B1C2D] text-white hover:bg-slate-800 transition-all">
                            Start Protected Project
                        </a>
                    </div>
                </div>
            </nav>

            <main role="main" aria-label="Conținut principal" id="main-content">
                <section className="pt-40 pb-24 px-6 bg-white overflow-hidden">
                    <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[#0B1C2D] text-xs font-bold mb-8">
                            <span className="text-[#1BC47D]">●</span> DIGITAL TRUST INFRASTRUCTURE
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold text-[#0B1C2D] tracking-tight mb-6 max-w-4xl">
                            Hire and get paid with <span className="text-[#1BC47D]">zero risk.</span>
                        </h1>
                        <p className="text-xl text-slate-500 mb-12 max-w-2xl">
                            Verified professionals. Protected payments. Enforced delivery. <br className="hidden md:block" />
                            The secure layer for global online work.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 mb-20">
                            <button className="px-8 py-4 btn-primary font-bold rounded-lg text-lg">Start a protected project</button>
                            <button className="px-8 py-4 bg-white border border-slate-200 text-[#0B1C2D] font-bold rounded-lg text-lg hover:bg-slate-50">
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
                                <div className="text-[10px] font-bold mono text-slate-400 uppercase tracking-widest">
                                    Trustora Engine v2.4 — Escrow Secured
                                </div>
                                <div />
                            </div>
                            <div className="p-8 grid md:grid-cols-3 gap-8 text-left">
                                <div className="space-y-6">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Contracts</div>
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold">API Integration</span>
                                            <span className="mono text-[#1BC47D] text-sm">€ 2.450,00</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-[#1BC47D]" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Funds Locked</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Milestone Execution</div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-white">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-[#1BC47D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path d="M5 13l4 4L19 7" strokeWidth="3" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm font-medium">Architecture Design</span>
                                            </div>
                                            <span className="mono text-xs text-[#21D19F] font-bold">RELEASED</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 border-2 border-[#1BC47D]/20 rounded-lg bg-emerald-50/20">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded bg-[#1BC47D] flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                            strokeWidth="2"
                                                        />
                                                    </svg>
                                                </div>
                                                <span className="text-sm font-bold">Core Module Delivery</span>
                                            </div>
                                            <span className="mono text-xs text-[#0B1C2D] font-bold tracking-tighter">IN ESCROW</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24 px-6 bg-[#F5F7FA]" id="pillars">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid md:grid-cols-4 gap-8">
                            <div className="space-y-4">
                                <svg className="w-6 h-6 pillar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[#0B1C2D]">Verified People</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Nimeni nu lucrează fără test tehnic și verificare video obligatorie.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <svg className="w-6 h-6 pillar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[#0B1C2D]">Protected Money</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Fiecare euro este ținut în escrow până la confirmarea livrării.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <svg className="w-6 h-6 pillar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[#0B1C2D]">Enforced Delivery</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Plata se eliberează doar pe baza milestone-urilor acceptate.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <svg className="w-6 h-6 pillar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[#0B1C2D]">Legal-grade contracts</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Fiecare job este un contract digital cu valoare legală deplină.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24 px-6 bg-white" id="how">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-px bg-slate-100 border border-slate-100 rounded-3xl overflow-hidden shadow-xl">
                            <div className="bg-white p-12 lg:p-20">
                                <span className="text-[10px] font-bold text-[#0B1C2D] bg-slate-100 px-2 py-1 rounded mb-6 inline-block">
                                    FOR CLIENTS
                                </span>
                                <h2 className="text-4xl font-bold text-[#0B1C2D] mb-6">„Plătesc doar când primesc livrarea.”</h2>
                                <p className="text-slate-500 mb-8 leading-relaxed">
                                    Banii tăi sunt protejați prin escrow. Nicio plată nu părăsește platforma fără confirmarea ta explicită a
                                    calității muncii.
                                </p>
                                <ul className="space-y-4 mb-10">
                                    <li className="flex items-center gap-3 text-sm font-medium">
                                        <span className="text-[#1BC47D]">✅</span> Zero risc de pierdere financiară
                                    </li>
                                    <li className="flex items-center gap-3 text-sm font-medium">
                                        <span className="text-[#1BC47D]">✅</span> Profesioniști pre-verificați video
                                    </li>
                                </ul>
                                <a href="#" className="font-bold text-[#0B1C2D] border-b-2 border-[#1BC47D] pb-1">
                                    Start hiring safely →
                                </a>
                            </div>
                            <div className="bg-[#0B1C2D] p-12 lg:p-20 text-white">
                                <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-1 rounded mb-6 inline-block">
                                    FOR PROFESSIONALS
                                </span>
                                <h2 className="text-4xl font-bold mb-6">„Banii sunt blocați înainte să încep.”</h2>
                                <p className="text-slate-300 mb-8 leading-relaxed">
                                    Nu mai lucrezi pe promisiuni. Plata pentru fiecare milestone este deja blocată în sistem înainte ca tu să scrii
                                    prima linie de cod.
                                </p>
                                <ul className="space-y-4 mb-10">
                                    <li className="flex items-center gap-3 text-sm font-medium">
                                        <span className="text-[#1BC47D]">✅</span> Garanția plății 100%
                                    </li>
                                    <li className="flex items-center gap-3 text-sm font-medium">
                                        <span className="text-[#1BC47D]">✅</span> Dispute rezolvate prin arbitraj tehnic
                                    </li>
                                </ul>
                                <a href="#" className="font-bold text-white border-b-2 border-[#1BC47D] pb-1">
                                    Join the infrastructure →
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24 px-6 bg-white overflow-hidden">
                    <div className="max-w-7xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-16 text-[#0B1C2D]">Stripe + Notary + Marketplace</h2>
                        <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20">
                            <div className="w-48 h-48 glass-card flex flex-col items-center justify-center p-6 text-center">
                                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">💰</div>
                                <span className="text-xs font-bold uppercase tracking-wider">Money</span>
                                <span className="text-[10px] text-slate-400">Escrow Layer</span>
                            </div>
                            <div className="hidden md:block w-20 h-px bg-slate-200" />
                            <div className="w-48 h-48 glass-card border-2 border-[#1BC47D] flex flex-col items-center justify-center p-6 text-center shadow-lg shadow-emerald-100">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">📑</div>
                                <span className="text-xs font-bold uppercase tracking-wider">Contracts</span>
                                <span className="text-[10px] text-emerald-600">Digital Execution</span>
                            </div>
                            <div className="hidden md:block w-20 h-px bg-slate-200" />
                            <div className="w-48 h-48 glass-card flex flex-col items-center justify-center p-6 text-center">
                                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">👤</div>
                                <span className="text-xs font-bold uppercase tracking-wider">Verification</span>
                                <span className="text-[10px] text-slate-400">Identity Layer</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-32 px-6 bg-[#0B1C2D] text-white text-center">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-4xl lg:text-5xl font-bold mb-8">No trust. No deal.</h2>
                        <p className="text-slate-400 mb-12 text-lg">Work without risk on the safest platform for online services.</p>
                        <button className="px-10 py-5 btn-primary font-bold rounded-lg text-xl">Start a protected project</button>
                        <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-12 opacity-40 grayscale">
                            <span className="font-bold mono uppercase tracking-widest text-sm">Escrow Secured</span>
                            <span className="font-bold mono uppercase tracking-widest text-sm">Video Verified</span>
                            <span className="font-bold mono uppercase tracking-widest text-sm">Legal Grade</span>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-12 px-6 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-[#0B1C2D] flex items-center justify-center rounded">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#1BC47D]" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 4h16v3H4zM10 7h4v13h-4z" />
                            </svg>
                        </div>
                        <span className="font-bold tracking-tight text-[#0B1C2D]">TRUSTORA</span>
                    </div>
                    <div className="text-[10px] font-bold mono text-slate-400 uppercase tracking-[0.2em]">
                        © 2024 Trustora — Digital Trust Infrastructure
                    </div>
                    <div className="flex gap-6 text-xs font-bold text-slate-500">
                        <a href="#" className="hover:text-[#1BC47D]">
                            Terms
                        </a>
                        <a href="#" className="hover:text-[#1BC47D]">
                            Privacy
                        </a>
                        <a href="#" className="hover:text-[#1BC47D]">
                            API
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
